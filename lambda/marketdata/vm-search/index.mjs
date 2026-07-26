// Veridian Markets — symbol search (Finnhub /search, "Symbol Lookup").
//
// Proxies Finnhub's symbol lookup so the API key stays server-side, and caches
// each query's result in DynamoDB (24h TTL) — searches repeat a lot, and this
// keeps us well under the rate limit. Responses are small (a handful of matches)
// so we store the whole result array as one JSON string attribute.
//
// Returns: { q, count, result:[ { symbol, description, displaySymbol, type } ] }
//
// NO npm deps: fetch for Finnhub; @aws-sdk/client-dynamodb (Node 20 runtime).
//
// Trigger:  Lambda Function URL (Auth NONE; Function URL CORS OFF — code sets it).
// Env vars: FINNHUB_KEY, TABLE=vm-search, TTL_SECONDS=86400
// IAM:      the function role needs DynamoDB GetItem + PutItem on TABLE.

import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';

const db = new DynamoDBClient({});
const TABLE  = process.env.TABLE || 'vm-search';
const TTL_MS = (Number(process.env.TTL_SECONDS) || 86400) * 1000;   // 24h
const MAX_RESULTS = 25;

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'content-type',
  'access-control-allow-methods': 'GET,OPTIONS',
};

export const handler = async (event) => {
  if (event.requestContext?.http?.method === 'OPTIONS') return { statusCode: 204, headers: CORS };

  const q = (event.queryStringParameters?.q || '').trim();
  if (!q) return resp(400, { error: 'pass ?q=apple' });

  try {
    const result = await getSearch(q);
    return resp(200, { q, count: result.length, result });
  } catch (e) {
    console.warn(q, e.message);
    return resp(502, { error: 'search failed', detail: e.message });
  }
};

// Cache-or-fetch for one query.
async function getSearch(q) {
  const key = q.toLowerCase();
  const cached = await readCache(key);
  if (cached && (Date.now() - cached.updatedAt) < TTL_MS) return cached.result;
  const result = await fetchFinnhub(q);
  await writeCache(key, result);
  return result;
}

async function fetchFinnhub(q) {
  const url = `https://finnhub.io/api/v1/search?q=${encodeURIComponent(q)}&exchange=US&token=${process.env.FINNHUB_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`finnhub ${res.status}`);
  const json = await res.json();   // { count, result:[ {symbol, description, displaySymbol, type} ] }
  const rows = Array.isArray(json.result) ? json.result : [];
  return rows
    .filter((r) => r.symbol && r.description)
    .map((r) => ({ symbol: r.symbol, description: r.description, displaySymbol: r.displaySymbol, type: r.type }))
    .slice(0, MAX_RESULTS);
}

// ── DynamoDB (result array as one JSON string attribute) ─────────────────────
async function readCache(key) {
  const r = await db.send(new GetItemCommand({ TableName: TABLE, Key: { q: { S: key } } }));
  if (!r.Item || !r.Item.json?.S) return null;
  try {
    return { result: JSON.parse(r.Item.json.S), updatedAt: Number(r.Item.updatedAt?.N || 0) };
  } catch { return null; }
}
async function writeCache(key, result) {
  await db.send(new PutItemCommand({
    TableName: TABLE,
    Item: {
      q: { S: key },
      json: { S: JSON.stringify(result) },
      updatedAt: { N: String(Date.now()) },
      ttl: { N: String(Math.floor(Date.now() / 1000) + 7 * 86400) },   // GC after ~7 days
    },
  }));
}

const resp = (statusCode, body) => ({ statusCode, headers: { 'content-type': 'application/json', ...CORS }, body: JSON.stringify(body) });
