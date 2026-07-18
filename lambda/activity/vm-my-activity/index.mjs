// Veridian Markets — "Your activity" (Settings) reads the signed-in user's own
// recent events back out of vm-events (written by vm-capture). Same recipe as
// vm-avatar-upload: Function URL Auth NONE, verifies the Cognito access token
// itself via JWKS (no API Gateway, no admin role needed — this only ever
// returns the caller's own events, keyed by their own `sub`).
//
// vm-events schema (see lambda/capture/vm-capture): pk = "u#<sub>" (or
// "a#<anonId>" for anonymous), sk = "<ts>#<rand>" for events / "#profile" for
// the rolling profile row. Relevant event types: "search_select" ({query,
// ticker}) and "navigate" ({route, ticker, name}) — a navigate to route
// "dashboard" is a company view.
//
// Env vars: TABLE=vm-events, COGNITO_POOL_ID, COGNITO_REGION=us-east-1
// IAM:      the function role needs DynamoDB Query on TABLE (AmazonDynamoDBReadOnlyAccess is fine).

import crypto from 'node:crypto';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';

const db = new DynamoDBClient({});
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
async function jwks() {
  if (JWKS) return JWKS;
  const res = await fetch(`${ISS}/.well-known/jwks.json`);
  JWKS = (await res.json()).keys;
  return JWKS;
}

export const handler = async (event) => {
  if (event.requestContext?.http?.method === 'OPTIONS') return { statusCode: 204, headers: CORS };
  try {
    const auth = event.headers?.authorization || event.headers?.Authorization || '';
    const claims = await verifyJwt(auth.replace(/^Bearer\s+/i, ''));

    const r = await db.send(new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: { ':pk': { S: `u#${claims.sub}` } },
      ScanIndexForward: false,   // most recent first
      Limit: 150,
    }));

    const searches = [];
    const seenQ = new Set();
    const viewed = [];
    const seenT = new Set();

    for (const item of r.Items || []) {
      if (!item.type) continue;   // skip the "#profile" row (no `type`)
      const type = item.type.S;
      let props = {};
      try { props = JSON.parse(item.props?.S || '{}'); } catch {}

      if (type === 'search_select' && props.query && searches.length < 8) {
        const key = props.query.toLowerCase();
        if (!seenQ.has(key)) { seenQ.add(key); searches.push(props.query); }
      } else if (type === 'navigate' && props.route === 'dashboard' && props.ticker && viewed.length < 8) {
        if (!seenT.has(props.ticker)) { seenT.add(props.ticker); viewed.push({ ticker: props.ticker, name: props.name || props.ticker }); }
      }
    }

    return resp(200, { searches, viewed });
  } catch (e) {
    console.warn('my-activity error', e.message);
    return resp(400, { error: e.message });
  }
};

// Verify a Cognito JWT (RS256) against the pool JWKS — same helper as the
// billing/avatar Lambdas.
async function verifyJwt(token) {
  const [h, p, s] = (token || '').split('.');
  if (!h || !p || !s) throw new Error('malformed token');
  const header  = JSON.parse(Buffer.from(h, 'base64url').toString());
  const payload = JSON.parse(Buffer.from(p, 'base64url').toString());
  const jwk = (await jwks()).find(k => k.kid === header.kid);
  if (!jwk) throw new Error('unknown signing key');
  const key = crypto.createPublicKey({ key: jwk, format: 'jwk' });
  const ok = crypto.verify('RSA-SHA256', Buffer.from(`${h}.${p}`), key, Buffer.from(s, 'base64url'));
  if (!ok) throw new Error('bad signature');
  if (payload.iss !== ISS) throw new Error('bad issuer');
  if (payload.exp * 1000 < Date.now()) throw new Error('token expired');
  return payload;
}

const resp = (statusCode, body) => ({ statusCode, headers: { 'content-type': 'application/json', ...CORS }, body: JSON.stringify(body) });
