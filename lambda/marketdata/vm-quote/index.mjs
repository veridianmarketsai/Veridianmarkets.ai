// Veridian Markets — cached market quotes (Finnhub).
//
// Read-through cache: serve a quote from DynamoDB if it's < TTL old; otherwise
// fetch it from Finnhub, store it, and serve. So each symbol hits Finnhub at most
// once per TTL (2 min), only when someone actually asks for it, and one fetch
// serves every user. See marketdataapi.md.
//
// NO npm deps: fetch for Finnhub; @aws-sdk/client-dynamodb (in the Node 20 runtime)
// for the cache. Paste into the Lambda console + Deploy.
//
// Trigger:  Lambda Function URL (Auth NONE; CORS on) — called by the browser.
// Env vars: FINNHUB_KEY, TABLE=vm-quotes, TTL_SECONDS=120
// IAM:      the function role needs DynamoDB GetItem + PutItem on TABLE.

import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';

const db = new DynamoDBClient({});
const TABLE  = process.env.TABLE || 'vm-quotes';
const TTL_MS = (Number(process.env.TTL_SECONDS) || 120) * 1000;

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'content-type',
  'access-control-allow-methods': 'GET,OPTIONS',
};

export const handler = async (event) => {
  if (event.requestContext?.http?.method === 'OPTIONS') return { statusCode: 204, headers: CORS };

  const raw = (event.queryStringParameters?.symbols || '').trim();
  if (!raw) return resp(400, { error: 'pass ?symbols=AAPL,MSFT' });
  const symbols = [...new Set(raw.toUpperCase().split(',').map(s => s.trim()).filter(Boolean))].slice(0, 25);

  const quotes = {};
  await Promise.all(symbols.map(async (sym) => {
    try { quotes[sym] = await getQuote(sym); }
    catch (e) { console.warn(sym, e.message); quotes[sym] = null; }
  }));
  return resp(200, { quotes });
};

// Cache-or-fetch for one symbol.
async function getQuote(symbol) {
  const cached = await readCache(symbol);
  if (cached && (Date.now() - cached.updatedAt) < TTL_MS) return { ...cached, cached: true };
  const fresh = await fetchFinnhub(symbol);
  await writeCache(fresh);
  return { ...fresh, cached: false };
}

async function fetchFinnhub(symbol) {
  const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${process.env.FINNHUB_KEY}`);
  if (!res.ok) throw new Error(`finnhub ${res.status}`);
  const q = await res.json();   // { c: current, d: change, dp: %change, h, l, o, pc, t }
  return { symbol, price: q.c, change: q.d, pct: q.dp, high: q.h, low: q.l, open: q.o, prevClose: q.pc, updatedAt: Date.now() };
}

// ── DynamoDB (low-level client; numbers stored as N) ────────────────────────
async function readCache(symbol) {
  const r = await db.send(new GetItemCommand({ TableName: TABLE, Key: { symbol: { S: symbol } } }));
  if (!r.Item) return null;
  const n = (k) => (r.Item[k]?.N != null ? Number(r.Item[k].N) : null);
  return { symbol, price: n('price'), change: n('change'), pct: n('pct'), high: n('high'), low: n('low'), open: n('open'), prevClose: n('prevClose'), updatedAt: n('updatedAt') };
}
async function writeCache(q) {
  const num = (v) => ({ N: String(v == null ? 0 : v) });
  await db.send(new PutItemCommand({
    TableName: TABLE,
    Item: {
      symbol: { S: q.symbol },
      price: num(q.price), change: num(q.change), pct: num(q.pct),
      high: num(q.high), low: num(q.low), open: num(q.open), prevClose: num(q.prevClose),
      updatedAt: num(q.updatedAt),
      ttl: num(Math.floor(Date.now() / 1000) + 86400),   // DynamoDB TTL: GC cold symbols after ~1 day
    },
  }));
}

const resp = (statusCode, body) => ({ statusCode, headers: { 'content-type': 'application/json', ...CORS }, body: JSON.stringify(body) });
