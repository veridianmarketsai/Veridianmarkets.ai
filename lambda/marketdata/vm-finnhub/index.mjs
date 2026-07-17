// Veridian Markets — generic Finnhub read-through cache proxy.
//
// ONE Lambda + ONE table serves many free Finnhub GET endpoints. Call with
// ?endpoint=<key>&<params>. TTL is per-endpoint (baked in below) so there's no
// TTL_SECONDS env var — add endpoints by editing the EP map. See finnhub-roadmap.md.
//
// Env vars: FINNHUB_KEY, TABLE=vm-finnhub
// Table:    vm-finnhub — partition key `pk` (String)
// Trigger:  Lambda Function URL (Auth NONE; Function URL CORS OFF — code sets it), 30s timeout.
// IAM:      the function role needs DynamoDB GetItem + PutItem.

import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';

const db = new DynamoDBClient({});
const TABLE = process.env.TABLE || 'vm-finnhub';
const MAX_ITEM = 380000;   // ~380KB — skip caching bigger payloads (DynamoDB 400KB limit)

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'content-type',
  'access-control-allow-methods': 'GET,OPTIONS',
};

// endpoint key → Finnhub path · TTL (seconds) · allowed passthrough params ·
// optional default param values · optional default date window (days from today).
const EP = {
  'ipo-calendar':      { path: 'calendar/ipo',                    ttl: 43200, params: ['from', 'to'],                    win: { from: 0,    to: 90 } },
  'fda-calendar':      { path: 'fda-advisory-committee-calendar', ttl: 43200, params: [] },
  'market-status':     { path: 'stock/market-status',             ttl: 300,   params: ['exchange'], def: { exchange: 'US' } },
  'market-holiday':    { path: 'stock/market-holiday',            ttl: 86400, params: ['exchange'], def: { exchange: 'US' } },
  'insider-sentiment': { path: 'stock/insider-sentiment',         ttl: 86400, params: ['symbol', 'from', 'to'],          win: { from: -365, to: 0 } },
  'usa-spending':      { path: 'stock/usa-spending',              ttl: 86400, params: ['symbol', 'from', 'to'],          win: { from: -365, to: 0 } },
  'lobbying':          { path: 'stock/lobbying',                  ttl: 86400, params: ['symbol', 'from', 'to'],          win: { from: -365, to: 0 } },
  'sec-filings':       { path: 'stock/filings',                   ttl: 21600, params: ['symbol', 'from', 'to', 'form'],  win: { from: -180, to: 0 } },
};

const ymd = (d) => d.toISOString().slice(0, 10);
const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x);

export const handler = async (event) => {
  if (event.requestContext?.http?.method === 'OPTIONS') return { statusCode: 204, headers: CORS };

  const qs = event.queryStringParameters || {};
  const ep = (qs.endpoint || '').trim();
  const cfg = EP[ep];
  if (!cfg) return resp(400, { error: 'pass ?endpoint=<key>[&params]', valid: Object.keys(EP) });

  // collect allowed params, apply defaults + a date window for range endpoints
  const params = {};
  for (const p of cfg.params) if (qs[p] != null && qs[p] !== '') params[p] = qs[p];
  if (cfg.def) for (const k in cfg.def) if (params[k] == null) params[k] = cfg.def[k];
  if (cfg.win && !params.from && !params.to) {
    params.from = ymd(new Date(Date.now() + cfg.win.from * 86400000));
    params.to   = ymd(new Date(Date.now() + cfg.win.to   * 86400000));
  }

  const qstr = Object.keys(params).sort().map((k) => `${k}=${encodeURIComponent(params[k])}`).join('&');
  const key = `${ep}#${qstr}`;
  const ttlMs = cfg.ttl * 1000;

  try {
    const cached = await readCache(key);
    if (cached && (Date.now() - cached.updatedAt) < ttlMs) return resp(200, wrap(cached.data, true));
    const data = await fetchFinnhub(cfg.path, qstr);
    await writeCache(key, data);   // silently skips payloads over the item limit
    return resp(200, wrap(data, false));
  } catch (e) {
    console.warn(ep, e.message);
    return resp(502, { error: 'fetch failed', detail: e.message });
  }
};

const wrap = (data, cached) => (isObj(data) ? { ...data, cached } : { data, cached });

async function fetchFinnhub(path, qstr) {
  const sep = qstr ? '&' : '';
  const res = await fetch(`https://finnhub.io/api/v1/${path}?${qstr}${sep}token=${process.env.FINNHUB_KEY}`);
  if (!res.ok) throw new Error(`finnhub ${res.status}`);
  return res.json();
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
