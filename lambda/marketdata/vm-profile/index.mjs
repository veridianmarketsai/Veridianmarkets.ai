// Veridian Markets — company profile + key metrics (Finnhub, cached).
//
// One cached call returns BOTH:
//   /stock/profile2?symbol=X          → company facts (name, industry, country,
//                                        IPO, market cap, shares, logo, website)
//   /stock/metric?symbol=X&metric=all → valuation/quality metrics (P/E, yield,
//                                        52-wk range, beta, margins, ROE, growth)
//
// Powers the Overview tab + header (P/E · yield · 52-wk) for ANY US ticker,
// including ones reached via symbol search. Profiles change rarely, so a 24h TTL
// is plenty. See finnhub-roadmap.md.
//
// NO npm deps: fetch for Finnhub; @aws-sdk/client-dynamodb (Node 20 runtime).
// Whole payload stored as one JSON string attribute.
//
// Trigger:  Lambda Function URL (Auth NONE; Function URL CORS OFF — code sets it).
// Env vars: FINNHUB_KEY, TABLE=vm-profile, TTL_SECONDS=86400
// IAM:      the function role needs DynamoDB GetItem + PutItem on TABLE.

import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';

const db = new DynamoDBClient({});
const TABLE  = process.env.TABLE || 'vm-profile';
const TTL_MS = (Number(process.env.TTL_SECONDS) || 86400) * 1000;   // 24h

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
    const data = await getProfile(symbol);
    return resp(200, { symbol, ...data });
  } catch (e) {
    console.warn(symbol, e.message);
    return resp(502, { error: 'could not load profile', detail: e.message });
  }
};

// Cache-or-fetch for one symbol.
async function getProfile(symbol) {
  const cached = await readCache(symbol);
  if (cached && (Date.now() - cached.updatedAt) < TTL_MS) {
    return { profile: cached.profile, metric: cached.metric, updatedAt: cached.updatedAt, cached: true };
  }
  const [profile, metric] = await fetchBoth(symbol);
  const updatedAt = Date.now();
  await writeCache(symbol, profile, metric, updatedAt);
  return { profile, metric, updatedAt, cached: false };
}

// Both endpoints in parallel; a failure in one doesn't sink the other.
async function fetchBoth(symbol) {
  const key = process.env.FINNHUB_KEY;
  const [p, m] = await Promise.allSettled([
    fetchJson(`https://finnhub.io/api/v1/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${key}`),
    fetchJson(`https://finnhub.io/api/v1/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all&token=${key}`),
  ]);
  const profileRaw = p.status === 'fulfilled' ? p.value : {};
  const metricRaw  = m.status === 'fulfilled' ? (m.value?.metric || {}) : {};
  return [cleanProfile(profileRaw), cleanMetric(metricRaw)];
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`finnhub ${res.status}`);
  return res.json();
}

// Keep the fields the UI uses (both objects small, but curated = predictable).
function cleanProfile(p) {
  return {
    name: p.name || null, ticker: p.ticker || null, exchange: p.exchange || null,
    industry: p.finnhubIndustry || null, country: p.country || null, currency: p.currency || null,
    ipo: p.ipo || null, marketCap: p.marketCapitalization ?? null, sharesOut: p.shareOutstanding ?? null,
    logo: p.logo || null, weburl: p.weburl || null, phone: p.phone || null,
  };
}
function cleanMetric(M) {
  const n = (v) => (v == null || Number.isNaN(Number(v)) ? null : Number(v));
  return {
    peTTM: n(M.peTTM ?? M.peBasicExclExtraTTM), psTTM: n(M.psTTM), pbAnnual: n(M.pbAnnual),
    dividendYield: n(M.dividendYieldIndicatedAnnual ?? M.currentDividendYieldTTM),
    week52High: n(M['52WeekHigh']), week52Low: n(M['52WeekLow']),
    beta: n(M.beta), epsTTM: n(M.epsTTM ?? M.epsBasicExclExtraItemsTTM),
    roeTTM: n(M.roeTTM), grossMarginTTM: n(M.grossMarginTTM),
    netMarginTTM: n(M.netProfitMarginTTM ?? M.netMarginTTM),
    revenueGrowthYoY: n(M.revenueGrowthTTMYoy),
  };
}

// ── DynamoDB (profile + metric as one JSON string attribute) ─────────────────
async function readCache(symbol) {
  const r = await db.send(new GetItemCommand({ TableName: TABLE, Key: { pk: { S: symbol } } }));
  if (!r.Item || !r.Item.json?.S) return null;
  try {
    const j = JSON.parse(r.Item.json.S);
    return { profile: j.profile, metric: j.metric, updatedAt: Number(r.Item.updatedAt?.N || 0) };
  } catch { return null; }
}
async function writeCache(symbol, profile, metric, updatedAt) {
  await db.send(new PutItemCommand({
    TableName: TABLE,
    Item: {
      pk: { S: symbol },
      json: { S: JSON.stringify({ profile, metric }) },
      updatedAt: { N: String(updatedAt) },
      ttl: { N: String(Math.floor(Date.now() / 1000) + 7 * 86400) },   // GC after ~7 days
    },
  }));
}

const resp = (statusCode, body) => ({ statusCode, headers: { 'content-type': 'application/json', ...CORS }, body: JSON.stringify(body) });
