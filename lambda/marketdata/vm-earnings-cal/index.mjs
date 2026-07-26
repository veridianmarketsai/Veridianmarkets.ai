// Veridian Markets — earnings calendar (Finnhub /calendar/earnings, cached).
//
// Returns upcoming/past earnings dates for a date range, optionally filtered to
// a set of symbols (so the Calendar page can show just the companies it cares
// about). Estimates update through the day, so a 12h TTL is fine. Cached per
// (from,to,symbols). See finnhub-roadmap.md.
//
// Request:  ?from=YYYY-MM-DD&to=YYYY-MM-DD[&symbols=AAPL,MSFT,...]
//           (from/to default to today … today+45d)
// Returns:  { from, to, count, earnings:[ { symbol, date, hour, quarter, year,
//             epsEstimate, epsActual, revenueEstimate, revenueActual } ] }
//
// NO npm deps: fetch for Finnhub; @aws-sdk/client-dynamodb (Node 20 runtime).
//
// Trigger:  Lambda Function URL (Auth NONE; Function URL CORS OFF — code sets it).
// Env vars: FINNHUB_KEY, TABLE=vm-earnings-cal, TTL_SECONDS=43200
// IAM:      the function role needs DynamoDB GetItem + PutItem on TABLE.

import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';

const db = new DynamoDBClient({});
const TABLE  = process.env.TABLE || 'vm-earnings-cal';
const TTL_MS = (Number(process.env.TTL_SECONDS) || 43200) * 1000;   // 12h
const MAX_ROWS = 250;

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'content-type',
  'access-control-allow-methods': 'GET,OPTIONS',
};

export const handler = async (event) => {
  if (event.requestContext?.http?.method === 'OPTIONS') return { statusCode: 204, headers: CORS };

  const qs = event.queryStringParameters || {};
  const from = (qs.from || ymd(new Date())).trim();
  const to   = (qs.to || ymd(new Date(Date.now() + 45 * 86400 * 1000))).trim();
  const symbols = (qs.symbols || '').trim().toUpperCase();
  const symSet = symbols ? new Set(symbols.split(',').map((s) => s.trim()).filter(Boolean)) : null;
  const symKey = symbols ? symbols.split(',').map((s) => s.trim()).filter(Boolean).sort().join(',') : 'ALL';

  try {
    const earnings = await getCalendar(from, to, symSet, `${from}#${to}#${symKey}`);
    return resp(200, { from, to, count: earnings.length, earnings });
  } catch (e) {
    console.warn(from, to, e.message);
    return resp(502, { error: 'could not load earnings calendar', detail: e.message });
  }
};

async function getCalendar(from, to, symSet, key) {
  const cached = await readCache(key);
  if (cached && (Date.now() - cached.updatedAt) < TTL_MS) return cached.earnings;
  const earnings = await fetchFinnhub(from, to, symSet);
  await writeCache(key, earnings);
  return earnings;
}

async function fetchFinnhub(from, to, symSet) {
  const url = `https://finnhub.io/api/v1/calendar/earnings?from=${from}&to=${to}&token=${process.env.FINNHUB_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`finnhub ${res.status}`);
  const json = await res.json();   // { earningsCalendar: [ { date, epsActual, epsEstimate, hour, quarter, revenueActual, revenueEstimate, symbol, year } ] }
  const rows = Array.isArray(json.earningsCalendar) ? json.earningsCalendar : [];
  const filtered = rows.filter((e) => e.symbol && (!symSet || symSet.has(e.symbol.toUpperCase())));
  // Watchlist (symbols given) → keep all, date-sorted. Otherwise surface the
  // biggest reporters: rank by revenue estimate so a busy month isn't truncated
  // to just its first days. The frontend sorts by date for display.
  const ranked = symSet
    ? filtered.sort((a, b) => String(a.date).localeCompare(String(b.date)))
    : filtered.filter((e) => e.revenueEstimate != null).sort((a, b) => b.revenueEstimate - a.revenueEstimate);
  const cap = symSet ? MAX_ROWS : 70;
  return ranked
    .slice(0, cap)
    .map((e) => ({
      symbol: e.symbol, date: e.date, hour: e.hour || '', quarter: e.quarter, year: e.year,
      epsEstimate: e.epsEstimate ?? null, epsActual: e.epsActual ?? null,
      revenueEstimate: e.revenueEstimate ?? null, revenueActual: e.revenueActual ?? null,
    }));
}

const ymd = (d) => d.toISOString().slice(0, 10);

// ── DynamoDB (earnings array as one JSON string attribute) ───────────────────
async function readCache(key) {
  const r = await db.send(new GetItemCommand({ TableName: TABLE, Key: { pk: { S: key } } }));
  if (!r.Item || !r.Item.json?.S) return null;
  try {
    return { earnings: JSON.parse(r.Item.json.S), updatedAt: Number(r.Item.updatedAt?.N || 0) };
  } catch { return null; }
}
async function writeCache(key, earnings) {
  await db.send(new PutItemCommand({
    TableName: TABLE,
    Item: {
      pk: { S: key },
      json: { S: JSON.stringify(earnings) },
      updatedAt: { N: String(Date.now()) },
      ttl: { N: String(Math.floor(Date.now() / 1000) + 3 * 86400) },   // GC after ~3 days
    },
  }));
}

const resp = (statusCode, body) => ({ statusCode, headers: { 'content-type': 'application/json', ...CORS }, body: JSON.stringify(body) });
