// Veridian Markets — financials as reported (Finnhub /stock/financials-reported).
//
// Read-through cache, same shape as vm-quote but a much longer TTL: company
// filings only change when a new 10-K/10-Q is filed (quarterly), not by the
// second. So we cache a symbol's filings for ~24h; the first user after that
// refreshes it for everyone.
//
// Response we hand back (per filing): { form, year, quarter, startDate,
// endDate, filedDate, report: { bs, ic, cf } } — each of bs/ic/cf is an array
// of { concept, label, unit, value } straight from the SEC filing.
//
// NO npm deps: fetch for Finnhub; @aws-sdk/client-dynamodb (Node 20 runtime).
// We store the whole (trimmed) payload as ONE JSON string attribute to dodge
// the 400 KB item limit and avoid per-field typing.
//
// Trigger:  Lambda Function URL (Auth NONE; Function URL CORS OFF — code sets it).
// Env vars: FINNHUB_KEY, TABLE=vm-financials, TTL_SECONDS=86400
// IAM:      the function role needs DynamoDB GetItem + PutItem on TABLE.

import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';

const db = new DynamoDBClient({});
const TABLE  = process.env.TABLE || 'vm-financials';
const TTL_MS = (Number(process.env.TTL_SECONDS) || 86400) * 1000;   // 24h default
const MAX_FILINGS = 8;   // keep the most recent N filings so the item stays small

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'content-type',
  'access-control-allow-methods': 'GET,OPTIONS',
};

export const handler = async (event) => {
  if (event.requestContext?.http?.method === 'OPTIONS') return { statusCode: 204, headers: CORS };

  const symbol = (event.queryStringParameters?.symbol || '').trim().toUpperCase();
  if (!symbol) return resp(400, { error: 'pass ?symbol=AAPL' });
  const freq = (event.queryStringParameters?.freq || 'annual').toLowerCase() === 'quarterly' ? 'quarterly' : 'annual';

  try {
    const data = await getFinancials(symbol, freq);
    return resp(200, { symbol, freq, ...data });
  } catch (e) {
    console.warn(symbol, freq, e.message);
    return resp(502, { error: 'could not load financials', detail: e.message });
  }
};

// Cache-or-fetch for one symbol+freq.
async function getFinancials(symbol, freq) {
  const key = `${symbol}#${freq}`;
  const cached = await readCache(key);
  if (cached && (Date.now() - cached.updatedAt) < TTL_MS) {
    return { filings: cached.filings, updatedAt: cached.updatedAt, cached: true };
  }
  const filings = await fetchFinnhub(symbol, freq);
  const updatedAt = Date.now();
  await writeCache(key, filings, updatedAt);
  return { filings, updatedAt, cached: false };
}

async function fetchFinnhub(symbol, freq) {
  const url = `https://finnhub.io/api/v1/stock/financials-reported?symbol=${encodeURIComponent(symbol)}&freq=${freq}&token=${process.env.FINNHUB_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`finnhub ${res.status}`);
  const json = await res.json();   // { cik, symbol, data: [ { form, year, quarter, ..., report:{bs,ic,cf} } ] }
  const rows = Array.isArray(json.data) ? json.data : [];
  // newest first, trim, keep only the fields the UI needs.
  return rows
    .slice()
    .sort((a, b) => new Date(b.endDate || 0) - new Date(a.endDate || 0))
    .slice(0, MAX_FILINGS)
    .map((f) => ({
      form: f.form, year: f.year, quarter: f.quarter,
      startDate: f.startDate, endDate: f.endDate, filedDate: f.filedDate,
      report: {
        bs: cleanSection(f.report?.bs),
        ic: cleanSection(f.report?.ic),
        cf: cleanSection(f.report?.cf),
      },
    }));
}

// Keep concept/label/unit/value only (drops nothing important, trims noise).
function cleanSection(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map((r) => ({ concept: r.concept, label: r.label, unit: r.unit, value: r.value }));
}

// ── DynamoDB (whole payload as one JSON string attribute) ────────────────────
async function readCache(key) {
  const r = await db.send(new GetItemCommand({ TableName: TABLE, Key: { symbol: { S: key } } }));
  if (!r.Item || !r.Item.json?.S) return null;
  try {
    return { filings: JSON.parse(r.Item.json.S), updatedAt: Number(r.Item.updatedAt?.N || 0) };
  } catch { return null; }
}
async function writeCache(key, filings, updatedAt) {
  await db.send(new PutItemCommand({
    TableName: TABLE,
    Item: {
      symbol: { S: key },
      json: { S: JSON.stringify(filings) },
      updatedAt: { N: String(updatedAt) },
      ttl: { N: String(Math.floor(Date.now() / 1000) + 7 * 86400) },   // GC cold symbols after ~7 days
    },
  }));
}

const resp = (statusCode, body) => ({ statusCode, headers: { 'content-type': 'application/json', ...CORS }, body: JSON.stringify(body) });
