// Veridian Markets — first-party data capture (silent analytics → DynamoDB).
//
// The app POSTs small batches of events here as the user navigates. We store each
// event and keep a rolling per-user profile (who they are + counters), so the
// Admin panel can later read behaviour, sign-up/lead info and preferences.
//
// Table vm-events uses a COMPOSITE key so we can query one user's events in time
// order:  partition key `pk` (String) = "u#<cognitoSub>" or "a#<anonId>"
//         sort key      `sk` (String) = "<ts>#<rand>" for events, "#profile" for the profile row
//
// No auth: this is a public ingest beacon (like an analytics collector). Events
// are trusted only as much as any client telemetry. Keep the payload small.
//
// Env vars: TABLE=vm-events, TTL_DAYS (default 180)
// IAM:      the function role needs DynamoDB BatchWriteItem + UpdateItem on TABLE.

import { DynamoDBClient, BatchWriteItemCommand, UpdateItemCommand, PutItemCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';

const db = new DynamoDBClient({});
const TABLE     = process.env.TABLE || 'vm-events';
const FAV_TABLE = process.env.FAV_TABLE || 'vm-favourites';   // dedicated favourites (pk=userId, sk=ticker)
const TTL_DAYS  = Number(process.env.TTL_DAYS) || 180;

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'content-type',
  'access-control-allow-methods': 'POST,OPTIONS',
};

const rand = () => Math.random().toString(36).slice(2, 10);

export const handler = async (event) => {
  if (event.requestContext?.http?.method === 'OPTIONS') return { statusCode: 204, headers: CORS };

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return resp(400, { error: 'bad json' }); }

  const u = body.user || {};
  const userId = u.sub ? `u#${u.sub}` : `a#${body.anonId || 'unknown'}`;
  const events = Array.isArray(body.events) ? body.events.slice(0, 25) : [];
  const now = Date.now();
  const ttl = Math.floor(now / 1000) + TTL_DAYS * 86400;

  try {
    if (events.length) {
      const puts = events.map((e) => ({
        PutRequest: {
          Item: {
            pk: { S: userId },
            sk: { S: `${e.ts || now}#${rand()}` },
            type: { S: String(e.type || 'event') },
            page: { S: String(e.page || '') },
            props: { S: JSON.stringify(e.props || {}) },
            ts: { N: String(e.ts || now) },
            ...(e.sessionId ? { sessionId: { S: String(e.sessionId) } } : {}),
            ...(u.plan ? { plan: { S: String(u.plan) } } : {}),
            ttl: { N: String(ttl) },
          },
        },
      }));
      await db.send(new BatchWriteItemCommand({ RequestItems: { [TABLE]: puts } }));
    }
    await upsertProfile(userId, u, now, events.length);
    await syncFavourites(userId, u, events, now);   // dedicated favourites table (best-effort)
    return resp(200, { ok: true, stored: events.length });
  } catch (err) {
    console.warn('capture error', err.message);
    return resp(200, { ok: false });   // never break the client over telemetry
  }
};

// Rolling profile row (pk=userId, sk="#profile"): identity + first/last seen + counters.
async function upsertProfile(userId, u, now, n) {
  const names = {};
  const sets = ['lastSeen = :now', 'firstSeen = if_not_exists(firstSeen, :now)'];
  const vals = { ':now': { N: String(now) }, ':n': { N: String(n || 0) } };
  if (u.email) { sets.push('email = :e');  vals[':e']  = { S: String(u.email) }; }
  if (u.name)  { sets.push('#nm = :nm');   vals[':nm'] = { S: String(u.name) }; names['#nm'] = 'name'; }
  if (u.plan)  { sets.push('#pl = :p');    vals[':p']  = { S: String(u.plan) }; names['#pl'] = 'plan'; }   // "plan" is a reserved word
  const cmd = {
    TableName: TABLE,
    Key: { pk: { S: userId }, sk: { S: '#profile' } },
    UpdateExpression: `SET ${sets.join(', ')} ADD eventCount :n`,
    ExpressionAttributeValues: vals,
  };
  if (Object.keys(names).length) cmd.ExpressionAttributeNames = names;
  await db.send(new UpdateItemCommand(cmd));
}

// Mirror favourite add/remove into the dedicated vm-favourites table so "who
// favourited what" is a direct lookup (pk=userId, sk=TICKER). Best-effort: a
// failure here (e.g. table not created yet) never fails the capture call.
async function syncFavourites(userId, u, events, now) {
  const favs = events.filter((e) => e.type === 'favourite' && e.props && e.props.ticker);
  if (!favs.length) return;
  try {
    await Promise.all(favs.map((e) => {
      const t = String(e.props.ticker).toUpperCase();
      const Key = { pk: { S: userId }, sk: { S: t } };
      if (e.props.action === 'remove') return db.send(new DeleteItemCommand({ TableName: FAV_TABLE, Key }));
      return db.send(new PutItemCommand({ TableName: FAV_TABLE, Item: {
        ...Key, ticker: { S: t }, addedAt: { N: String(now) },
        ...(u.email ? { email: { S: String(u.email) } } : {}),
        ...(u.sub ? { sub: { S: String(u.sub) } } : {}),
      } }));
    }));
  } catch (e) { console.warn('fav sync', e.message); }
}

const resp = (statusCode, body) => ({ statusCode, headers: { 'content-type': 'application/json', ...CORS }, body: JSON.stringify(body) });
