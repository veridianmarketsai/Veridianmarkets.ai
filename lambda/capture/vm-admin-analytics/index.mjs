// Veridian Markets — admin analytics (read vm-events + Cognito → the Admin panel).
//
// Admin-only. Verifies the caller's Cognito token AND that they're in the `admin`
// group, then aggregates the captured events into what the Admin Users/Analytics
// tabs need. Cognito ListUsers gives the authoritative roster (even users with no
// activity yet); vm-events adds behaviour (plan, last seen, favourites, funnels).
//
// Views (?view=):
//   overview → totals, active users, plan split, top favourites/viewed, funnel
//   users    → merged roster (Cognito identity + captured activity + favourites)
//   user&id= → one user's recent event timeline
//
// Env vars: TABLE=vm-events, COGNITO_POOL_ID, COGNITO_REGION=us-east-1
// IAM:      DynamoDB Scan+Query on TABLE  +  cognito-idp:ListUsers on the pool.

import crypto from 'node:crypto';
import { DynamoDBClient, ScanCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { CognitoIdentityProviderClient, ListUsersCommand } from '@aws-sdk/client-cognito-identity-provider';

const db  = new DynamoDBClient({});
const cog = new CognitoIdentityProviderClient({});
const TABLE  = process.env.TABLE || 'vm-events';
const REGION = process.env.COGNITO_REGION || 'us-east-1';
const POOL   = process.env.COGNITO_POOL_ID;
const ISS    = `https://cognito-idp.${REGION}.amazonaws.com/${POOL}`;

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization,content-type',
  'access-control-allow-methods': 'GET,OPTIONS',
};

let JWKS = null;
async function jwks() { if (JWKS) return JWKS; JWKS = (await (await fetch(`${ISS}/.well-known/jwks.json`)).json()).keys; return JWKS; }

export const handler = async (event) => {
  if (event.requestContext?.http?.method === 'OPTIONS') return { statusCode: 204, headers: CORS };
  try {
    const auth = event.headers?.authorization || event.headers?.Authorization || '';
    const claims = await verifyJwt(auth.replace(/^Bearer\s+/i, ''));
    const groups = claims['cognito:groups'] || [];
    if (!groups.includes('admin')) return resp(403, { error: 'admin only' });

    const qs = event.queryStringParameters || {};
    const view = qs.view || 'overview';
    if (view === 'user') return resp(200, await userDetail(qs.id || ''));

    const agg = await aggregate();
    return resp(200, view === 'users' ? { users: agg.users } : agg.overview);
  } catch (e) {
    console.warn('admin-analytics error', e.message);
    return resp(400, { error: e.message });
  }
};

// ── aggregation over the whole event table ───────────────────────────────────
async function aggregate() {
  const items = await scanAll();
  const profiles = {}, favCount = {}, viewCount = {}, userFavs = {};
  const funnel = { sessions: 0, companyViews: 0, paywallHits: 0, checkoutStarts: 0 };
  let totalEvents = 0;

  for (const it of items) {
    const pk = it.pk?.S, sk = it.sk?.S;
    if (!pk) continue;
    if (sk === '#profile') {
      profiles[pk] = {
        userId: pk, sub: pk.startsWith('u#') ? pk.slice(2) : null,
        email: it.email?.S || '', name: it.name?.S || '', plan: it.plan?.S || 'free',
        firstSeen: num(it.firstSeen), lastSeen: num(it.lastSeen), eventCount: num(it.eventCount),
      };
      continue;
    }
    totalEvents++;
    const type = it.type?.S, props = safeParse(it.props?.S);
    if (type === 'session_start') funnel.sessions++;
    else if (type === 'navigate' && props.ticker) { funnel.companyViews++; bump(viewCount, props.ticker); }
    else if (type === 'paywall_hit') funnel.paywallHits++;
    else if (type === 'checkout_start') funnel.checkoutStarts++;
    else if (type === 'favourite' && props.ticker) {
      bump(favCount, props.ticker, props.action === 'remove' ? -1 : 1);
      (userFavs[pk] ||= new Set());
      if (props.action === 'remove') userFavs[pk].delete(props.ticker); else userFavs[pk].add(props.ticker);
    }
  }

  let roster = [];
  try { roster = await listCognitoUsers(); } catch (e) { console.warn('cognito', e.message); }

  const bySub = {};
  Object.values(profiles).forEach(p => { if (p.sub) bySub[p.sub] = p; });
  const favsFor = (uid) => (userFavs[uid] ? [...userFavs[uid]] : []);

  const users = roster.length
    ? roster.map(u => { const p = bySub[u.sub] || {}; return {
        sub: u.sub, email: u.email || p.email || '', name: u.name || p.name || '',
        created: u.created, status: u.status, plan: p.plan || 'free',
        lastSeen: p.lastSeen || null, eventCount: p.eventCount || 0, favourites: favsFor('u#' + u.sub) }; })
    : Object.values(profiles).map(p => ({ ...p, created: null, status: 'CAPTURED', favourites: favsFor(p.userId) }));

  const now = Date.now(), week = 7 * 86400 * 1000;
  const overview = {
    totalUsers: users.length,
    activeUsers7d: users.filter(u => u.lastSeen && now - u.lastSeen < week).length,
    plans: countBy(users.map(u => u.plan)),
    totalEvents,
    topFavourites: topN(favCount, 12),
    topViewed: topN(viewCount, 12),
    funnel,
  };
  return { users, overview };
}

async function userDetail(id) {
  const pk = (id.startsWith('u#') || id.startsWith('a#')) ? id : `u#${id}`;
  const r = await db.send(new QueryCommand({
    TableName: TABLE, KeyConditionExpression: 'pk = :p',
    ExpressionAttributeValues: { ':p': { S: pk } }, ScanIndexForward: false, Limit: 100,
  }));
  const events = (r.Items || []).filter(i => i.sk?.S !== '#profile')
    .map(i => ({ ts: num(i.ts), type: i.type?.S, page: i.page?.S, props: safeParse(i.props?.S) }));
  return { userId: pk, events };
}

// ── data sources ─────────────────────────────────────────────────────────────
async function scanAll() {
  const items = []; let key;
  do {
    const r = await db.send(new ScanCommand({ TableName: TABLE, ExclusiveStartKey: key }));
    items.push(...(r.Items || []));
    key = r.LastEvaluatedKey;
  } while (key && items.length < 20000);
  return items;
}
async function listCognitoUsers() {
  const users = []; let token;
  do {
    const r = await cog.send(new ListUsersCommand({ UserPoolId: POOL, Limit: 60, PaginationToken: token }));
    for (const u of r.Users || []) {
      const a = Object.fromEntries((u.Attributes || []).map(x => [x.Name, x.Value]));
      users.push({ sub: a.sub, email: a.email || '', name: a.name || a.given_name || '', status: u.UserStatus, created: u.UserCreateDate });
    }
    token = r.PaginationToken;
  } while (token && users.length < 500);
  return users;
}

// ── helpers ──────────────────────────────────────────────────────────────────
const num = (a) => (a?.N != null ? Number(a.N) : (a?.S != null ? Number(a.S) : null));
const safeParse = (s) => { try { return JSON.parse(s || '{}'); } catch { return {}; } };
const bump = (m, k, d = 1) => { m[k] = (m[k] || 0) + d; };
const countBy = (arr) => arr.reduce((m, v) => { m[v] = (m[v] || 0) + 1; return m; }, {});
const topN = (m, n) => Object.entries(m).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => ({ key: k, n: v }));

async function verifyJwt(token) {
  const [h, p, s] = (token || '').split('.');
  if (!h || !p || !s) throw new Error('malformed token');
  const header = JSON.parse(Buffer.from(h, 'base64url').toString());
  const payload = JSON.parse(Buffer.from(p, 'base64url').toString());
  const jwk = (await jwks()).find(k => k.kid === header.kid);
  if (!jwk) throw new Error('unknown signing key');
  const key = crypto.createPublicKey({ key: jwk, format: 'jwk' });
  if (!crypto.verify('RSA-SHA256', Buffer.from(`${h}.${p}`), key, Buffer.from(s, 'base64url'))) throw new Error('bad signature');
  if (payload.iss !== ISS) throw new Error('bad issuer');
  if (payload.exp * 1000 < Date.now()) throw new Error('token expired');
  return payload;
}

const resp = (statusCode, body) => ({ statusCode, headers: { 'content-type': 'application/json', ...CORS }, body: JSON.stringify(body) });
