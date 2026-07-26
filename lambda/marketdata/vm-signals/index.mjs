// Veridian Markets — company signals (Finnhub, cached).
//
// One function serves four free per-company signals via a `type` param:
//   type=recommendation → /stock/recommendation        (analyst buy/hold/sell)
//   type=earnings       → /stock/earnings              (EPS actual vs estimate)
//   type=peers          → /stock/peers                 (related tickers)
//   type=insider        → /stock/insider-transactions  (insider buys/sells)
//
// These change slowly (quarterly-ish), so a 12h TTL is plenty. Cached per
// symbol+type. See finnhub-roadmap.md.
//
// NO npm deps: fetch for Finnhub; @aws-sdk/client-dynamodb (Node 20 runtime).
//
// Trigger:  Lambda Function URL (Auth NONE; Function URL CORS OFF — code sets it).
// Env vars: FINNHUB_KEY, TABLE=vm-signals, TTL_SECONDS=43200
// IAM:      the function role needs DynamoDB GetItem + PutItem on TABLE.

import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';

const db = new DynamoDBClient({});
const TABLE  = process.env.TABLE || 'vm-signals';
const TTL_MS = (Number(process.env.TTL_SECONDS) || 43200) * 1000;   // 12h
const TYPES  = new Set(['recommendation', 'earnings', 'peers', 'insider']);

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'content-type',
  'access-control-allow-methods': 'GET,OPTIONS',
};

export const handler = async (event) => {
  if (event.requestContext?.http?.method === 'OPTIONS') return { statusCode: 204, headers: CORS };

  const qs = event.queryStringParameters || {};
  const symbol = (qs.symbol || '').trim().toUpperCase();
  const type   = (qs.type || '').trim().toLowerCase();
  if (!symbol) return resp(400, { error: 'pass ?symbol=AAPL&type=recommendation|earnings|peers|insider' });
  if (!TYPES.has(type)) return resp(400, { error: `type must be one of: ${[...TYPES].join(', ')}` });

  try {
    const { data, updatedAt, cached } = await getSignal(symbol, type);
    return resp(200, { symbol, type, count: Array.isArray(data) ? data.length : 0, data, updatedAt, cached });
  } catch (e) {
    console.warn(symbol, type, e.message);
    return resp(502, { error: 'could not load signal', detail: e.message });
  }
};

async function getSignal(symbol, type) {
  const key = `${symbol}#${type}`;
  const cached = await readCache(key);
  if (cached && (Date.now() - cached.updatedAt) < TTL_MS) return { data: cached.data, updatedAt: cached.updatedAt, cached: true };
  const data = await fetchFinnhub(symbol, type);
  const updatedAt = Date.now();
  await writeCache(key, data, updatedAt);
  return { data, updatedAt, cached: false };
}

async function fetchFinnhub(symbol, type) {
  const token = process.env.FINNHUB_KEY;
  const sym = encodeURIComponent(symbol);
  const paths = {
    recommendation: `stock/recommendation?symbol=${sym}`,
    earnings:       `stock/earnings?symbol=${sym}`,
    peers:          `stock/peers?symbol=${sym}`,
    insider:        `stock/insider-transactions?symbol=${sym}`,
  };
  const res = await fetch(`https://finnhub.io/api/v1/${paths[type]}&token=${token}`);
  if (!res.ok) throw new Error(`finnhub ${res.status}`);
  const json = await res.json();

  if (type === 'recommendation') {
    return (Array.isArray(json) ? json : [])
      .sort((a, b) => String(b.period).localeCompare(String(a.period)))
      .slice(0, 6)
      .map((r) => ({ period: r.period, strongBuy: r.strongBuy, buy: r.buy, hold: r.hold, sell: r.sell, strongSell: r.strongSell }));
  }
  if (type === 'earnings') {
    return (Array.isArray(json) ? json : [])
      .slice(0, 8)
      .map((e) => ({ period: e.period, year: e.year, quarter: e.quarter, actual: e.actual, estimate: e.estimate, surprise: e.surprise, surprisePercent: e.surprisePercent }));
  }
  if (type === 'peers') {
    return (Array.isArray(json) ? json : []).filter(Boolean).slice(0, 12);
  }
  // insider
  const rows = Array.isArray(json?.data) ? json.data : [];
  return rows
    .sort((a, b) => String(b.transactionDate || '').localeCompare(String(a.transactionDate || '')))
    .slice(0, 15)
    .map((t) => ({ name: t.name, share: t.share, change: t.change, filingDate: t.filingDate, transactionDate: t.transactionDate, transactionPrice: t.transactionPrice, transactionCode: t.transactionCode }));
}

// ── DynamoDB (data array as one JSON string attribute) ───────────────────────
async function readCache(key) {
  const r = await db.send(new GetItemCommand({ TableName: TABLE, Key: { pk: { S: key } } }));
  if (!r.Item || !r.Item.json?.S) return null;
  try {
    return { data: JSON.parse(r.Item.json.S), updatedAt: Number(r.Item.updatedAt?.N || 0) };
  } catch { return null; }
}
async function writeCache(key, data, updatedAt) {
  await db.send(new PutItemCommand({
    TableName: TABLE,
    Item: {
      pk: { S: key },
      json: { S: JSON.stringify(data) },
      updatedAt: { N: String(updatedAt) },
      ttl: { N: String(Math.floor(Date.now() / 1000) + 7 * 86400) },   // GC after ~7 days
    },
  }));
}

const resp = (statusCode, body) => ({ statusCode, headers: { 'content-type': 'application/json', ...CORS }, body: JSON.stringify(body) });
