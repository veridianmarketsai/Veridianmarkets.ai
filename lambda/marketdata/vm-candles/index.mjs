// Veridian Markets — OHLC candles (Finnhub /stock/candle, premium plan required).
//
// Read-through cache keyed on symbol#resolution#from#to. TTL depends on
// resolution: intraday bars (1/5/15/30/60) go stale fast so get a short TTL;
// daily/weekly/monthly bars barely change intraday so get a long TTL.
//
// NO npm deps: fetch for Finnhub; @aws-sdk/client-dynamodb (Node 20 runtime).
//
// Trigger:  Lambda Function URL (Auth NONE; Function URL CORS OFF — code sets it), 30s timeout.
// Env vars: FINNHUB_KEY, TABLE=vm-candles
// Table:    vm-candles — partition key `pk` (String)
// IAM:      the function role needs DynamoDB GetItem + PutItem on TABLE.

import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';

const db = new DynamoDBClient({});
const TABLE = process.env.TABLE || 'vm-candles';
const MAX_ITEM = 380000;   // ~380KB — skip caching bigger payloads (DynamoDB 400KB limit)
const MAX_BARS = 6000;     // keep the most recent N bars so the item stays small

const INTRADAY = new Set(['1', '5', '15', '30', '60']);
const RESOLUTIONS = new Set(['1', '5', '15', '30', '60', 'D', 'W', 'M']);

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'content-type',
  'access-control-allow-methods': 'GET,OPTIONS',
};

export const handler = async (event) => {
  if (event.requestContext?.http?.method === 'OPTIONS') return { statusCode: 204, headers: CORS };

  const qs = event.queryStringParameters || {};
  const symbol = (qs.symbol || '').trim().toUpperCase();
  const resolution = (qs.resolution || 'D').trim().toUpperCase() === 'D' ? 'D' : (qs.resolution || 'D').trim();
  const from = (qs.from || '').trim();
  const to = (qs.to || '').trim();

  if (!symbol) return resp(400, { error: 'pass ?symbol=AAPL&resolution=D&from=<unix>&to=<unix>' });
  if (!RESOLUTIONS.has(resolution)) return resp(400, { error: `resolution must be one of ${[...RESOLUTIONS].join(',')}` });
  if (!from || !to) return resp(400, { error: 'pass from/to as unix seconds' });

  const ttlMs = (INTRADAY.has(resolution) ? 300 : 86400) * 1000;   // 5min intraday, 24h daily+
  const key = `${symbol}#${resolution}#${from}#${to}`;

  try {
    const cached = await readCache(key);
    if (cached && (Date.now() - cached.updatedAt) < ttlMs) return resp(200, { symbol, resolution, ...cached.data, cached: true });
    const data = await fetchFinnhub(symbol, resolution, from, to);
    await writeCache(key, data);   // silently skips payloads over the item limit
    return resp(200, { symbol, resolution, ...data, cached: false });
  } catch (e) {
    console.warn(symbol, resolution, e.message);
    return resp(502, { error: 'could not load candles', detail: e.message });
  }
};

async function fetchFinnhub(symbol, resolution, from, to) {
  const url = `https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=${encodeURIComponent(resolution)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&token=${process.env.FINNHUB_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`finnhub ${res.status}`);
  const json = await res.json();   // { c,h,l,o,t,v: number[], s: 'ok'|'no_data' }
  if (json.s !== 'ok' || !Array.isArray(json.t)) return { s: json.s || 'no_data', t: [], o: [], h: [], l: [], c: [], v: [] };
  // keep only the most recent MAX_BARS bars so the cached item stays small.
  const n = json.t.length;
  const start = Math.max(0, n - MAX_BARS);
  return {
    s: 'ok',
    t: json.t.slice(start),
    o: json.o.slice(start),
    h: json.h.slice(start),
    l: json.l.slice(start),
    c: json.c.slice(start),
    v: json.v.slice(start),
  };
}

async function readCache(key) {
  const r = await db.send(new GetItemCommand({ TableName: TABLE, Key: { pk: { S: key } } }));
  if (!r.Item || !r.Item.json?.S) return null;
  try { return { data: JSON.parse(r.Item.json.S), updatedAt: Number(r.Item.updatedAt?.N || 0) }; }
  catch { return null; }
}
async function writeCache(key, data) {
  const json = JSON.stringify(data);
  if (json.length > MAX_ITEM) return;   // too big to cache; served fresh each call
  await db.send(new PutItemCommand({
    TableName: TABLE,
    Item: {
      pk: { S: key },
      json: { S: json },
      updatedAt: { N: String(Date.now()) },
      ttl: { N: String(Math.floor(Date.now() / 1000) + 7 * 86400) },
    },
  }));
}

const resp = (statusCode, body) => ({ statusCode, headers: { 'content-type': 'application/json', ...CORS }, body: JSON.stringify(body) });
