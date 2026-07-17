// Veridian Markets — market + company news (Finnhub, cached).
//
// Two modes, one cached function:
//   ?scope=general   → /news?category=general      (Home tiles + News page)
//   ?symbol=AAPL     → /company-news?symbol=&from=&to=  (company News tab)
//
// News moves through the day but not by the second, so a 15-min TTL keeps it
// fresh while staying well under the rate limit (one fetch serves everyone).
// See finnhub-roadmap.md.
//
// NO npm deps: fetch for Finnhub; @aws-sdk/client-dynamodb (Node 20 runtime).
// Articles stored as one JSON string attribute (trimmed + capped to stay small).
//
// Trigger:  Lambda Function URL (Auth NONE; Function URL CORS OFF — code sets it).
// Env vars: FINNHUB_KEY, TABLE=vm-news, TTL_SECONDS=900
// IAM:      the function role needs DynamoDB GetItem + PutItem on TABLE.

import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';

const db = new DynamoDBClient({});
const TABLE  = process.env.TABLE || 'vm-news';
const TTL_MS = (Number(process.env.TTL_SECONDS) || 900) * 1000;   // 15 min
const MAX_ARTICLES = 30;
const SUMMARY_MAX = 320;

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'content-type',
  'access-control-allow-methods': 'GET,OPTIONS',
};

export const handler = async (event) => {
  if (event.requestContext?.http?.method === 'OPTIONS') return { statusCode: 204, headers: CORS };

  const qs = event.queryStringParameters || {};
  const symbol = (qs.symbol || '').trim().toUpperCase();
  const scope  = (qs.scope || '').trim().toLowerCase();
  if (!symbol && scope !== 'general') return resp(400, { error: 'pass ?scope=general or ?symbol=AAPL' });

  const key = symbol ? `CO#${symbol}` : 'general';
  try {
    const { articles, updatedAt, cached } = await getNews(key, symbol);
    return resp(200, { scope: symbol ? 'company' : 'general', symbol: symbol || null, count: articles.length, articles, updatedAt, cached });
  } catch (e) {
    console.warn(key, e.message);
    return resp(502, { error: 'could not load news', detail: e.message });
  }
};

async function getNews(key, symbol) {
  const cached = await readCache(key);
  if (cached && (Date.now() - cached.updatedAt) < TTL_MS) return { articles: cached.articles, updatedAt: cached.updatedAt, cached: true };
  const articles = await fetchFinnhub(symbol);
  const updatedAt = Date.now();
  await writeCache(key, articles, updatedAt);
  return { articles, updatedAt, cached: false };
}

async function fetchFinnhub(symbol) {
  const token = process.env.FINNHUB_KEY;
  let url;
  if (symbol) {
    const to = ymd(new Date());
    const from = ymd(new Date(Date.now() - 30 * 86400 * 1000));   // last 30 days
    url = `https://finnhub.io/api/v1/company-news?symbol=${encodeURIComponent(symbol)}&from=${from}&to=${to}&token=${token}`;
  } else {
    url = `https://finnhub.io/api/v1/news?category=general&token=${token}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`finnhub ${res.status}`);
  const rows = await res.json();   // array of { headline, summary, source, url, image, datetime, related, category }
  return (Array.isArray(rows) ? rows : [])
    .filter((a) => a.headline && a.url)
    .sort((a, b) => (b.datetime || 0) - (a.datetime || 0))
    .slice(0, MAX_ARTICLES)
    .map((a) => ({
      headline: a.headline,
      summary: (a.summary || '').slice(0, SUMMARY_MAX),
      source: a.source || '',
      url: a.url,
      image: a.image || '',
      datetime: a.datetime || 0,
      related: a.related || '',
      category: a.category || '',
    }));
}

const ymd = (d) => d.toISOString().slice(0, 10);

// ── DynamoDB (articles array as one JSON string attribute) ───────────────────
async function readCache(key) {
  const r = await db.send(new GetItemCommand({ TableName: TABLE, Key: { pk: { S: key } } }));
  if (!r.Item || !r.Item.json?.S) return null;
  try {
    return { articles: JSON.parse(r.Item.json.S), updatedAt: Number(r.Item.updatedAt?.N || 0) };
  } catch { return null; }
}
async function writeCache(key, articles, updatedAt) {
  await db.send(new PutItemCommand({
    TableName: TABLE,
    Item: {
      pk: { S: key },
      json: { S: JSON.stringify(articles) },
      updatedAt: { N: String(updatedAt) },
      ttl: { N: String(Math.floor(Date.now() / 1000) + 2 * 86400) },   // GC after ~2 days
    },
  }));
}

const resp = (statusCode, body) => ({ statusCode, headers: { 'content-type': 'application/json', ...CORS }, body: JSON.stringify(body) });
