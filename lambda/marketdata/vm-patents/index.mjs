// Veridian Markets — USPTO patents (Finnhub /stock/uspto-patent, cached).
//
// Fetches a company's recent USPTO patents over a ~3-year window and pre-computes
// what the Patents tab needs: a stat row, filings-by-year counts, and a list of
// recent patents. Patents publish continuously but slowly, so a 24h TTL is fine.
// See finnhub-roadmap.md.
//
// Returns:
//   { symbol, stats:{ total, granted, thisYear, years },
//     byYear:[ { y, n } ],                       // newest→oldest
//     recent:[ { title, filingDate, pubDate, patentNumber, status } ] }
//
// NO npm deps: fetch for Finnhub; @aws-sdk/client-dynamodb (Node 20 runtime).
//
// Trigger:  Lambda Function URL (Auth NONE; Function URL CORS OFF — code sets it).
// Env vars: FINNHUB_KEY, TABLE=vm-patents, TTL_SECONDS=86400
// IAM:      the function role needs DynamoDB GetItem + PutItem on TABLE.

import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';

const db = new DynamoDBClient({});
const TABLE  = process.env.TABLE || 'vm-patents';
const TTL_MS = (Number(process.env.TTL_SECONDS) || 86400) * 1000;   // 24h
const WINDOW_DAYS = 3 * 365;
const MAX_RECENT = 20;

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'content-type',
  'access-control-allow-methods': 'GET,OPTIONS',
};

export const handler = async (event) => {
  if (event.requestContext?.http?.method === 'OPTIONS') return { statusCode: 204, headers: CORS };

  const symbol = (event.queryStringParameters?.symbol || '').trim().toUpperCase();
  if (!symbol) return resp(400, { error: 'pass ?symbol=AAPL' });

  try {
    const data = await getPatents(symbol);
    return resp(200, { symbol, ...data });
  } catch (e) {
    console.warn(symbol, e.message);
    return resp(502, { error: 'could not load patents', detail: e.message });
  }
};

async function getPatents(symbol) {
  const cached = await readCache(symbol);
  if (cached && (Date.now() - cached.updatedAt) < TTL_MS) return { ...cached.payload, updatedAt: cached.updatedAt, cached: true };
  const payload = await fetchAndShape(symbol);
  const updatedAt = Date.now();
  await writeCache(symbol, payload, updatedAt);
  return { ...payload, updatedAt, cached: false };
}

async function fetchAndShape(symbol) {
  const to = ymd(new Date());
  const from = ymd(new Date(Date.now() - WINDOW_DAYS * 86400 * 1000));
  const url = `https://finnhub.io/api/v1/stock/uspto-patent?symbol=${encodeURIComponent(symbol)}&from=${from}&to=${to}&token=${process.env.FINNHUB_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`finnhub ${res.status}`);
  const json = await res.json();   // { data:[ { applicationNumber, description, filingDate, publicationDate, patentNumber, status, companyName } ], symbol }
  const rows = Array.isArray(json.data) ? json.data : [];

  // filings-by-year (by filing date), newest first
  const yearCount = {};
  rows.forEach((p) => { const y = (p.filingDate || '').slice(0, 4); if (y) yearCount[y] = (yearCount[y] || 0) + 1; });
  const byYear = Object.keys(yearCount).sort((a, b) => b.localeCompare(a)).map((y) => ({ y, n: yearCount[y] }));

  const granted = rows.filter((p) => p.patentNumber).length;
  const thisYear = new Date().getFullYear().toString();
  const stats = { total: rows.length, granted, thisYear: yearCount[thisYear] || 0, years: byYear.length };

  const recent = rows
    .slice()
    .sort((a, b) => String(b.filingDate || '').localeCompare(String(a.filingDate || '')))
    .slice(0, MAX_RECENT)
    .map((p) => ({ title: p.description || '(untitled)', filingDate: p.filingDate || '', pubDate: p.publicationDate || '', patentNumber: p.patentNumber || '', status: p.status || '' }));

  return { stats, byYear, recent };
}

const ymd = (d) => d.toISOString().slice(0, 10);

// ── DynamoDB (whole payload as one JSON string attribute) ────────────────────
async function readCache(symbol) {
  const r = await db.send(new GetItemCommand({ TableName: TABLE, Key: { pk: { S: symbol } } }));
  if (!r.Item || !r.Item.json?.S) return null;
  try {
    return { payload: JSON.parse(r.Item.json.S), updatedAt: Number(r.Item.updatedAt?.N || 0) };
  } catch { return null; }
}
async function writeCache(symbol, payload, updatedAt) {
  await db.send(new PutItemCommand({
    TableName: TABLE,
    Item: {
      pk: { S: symbol },
      json: { S: JSON.stringify(payload) },
      updatedAt: { N: String(updatedAt) },
      ttl: { N: String(Math.floor(Date.now() / 1000) + 7 * 86400) },   // GC after ~7 days
    },
  }));
}

const resp = (statusCode, body) => ({ statusCode, headers: { 'content-type': 'application/json', ...CORS }, body: JSON.stringify(body) });
