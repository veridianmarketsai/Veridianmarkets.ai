// Veridian Markets — return the signed-in user's subscription plan.
//
// The app calls this on load with the Cognito access token. We verify the JWT
// against the pool's JWKS (no libraries — Node crypto), read the user's row from
// DynamoDB, and return { plan, status }. No Stripe secret needed here.
//
// Trigger:  Lambda Function URL (Auth type = NONE; CORS enabled) — we verify the
//           Cognito token ourselves.
// Env vars: TABLE, COGNITO_POOL_ID, COGNITO_REGION
// IAM:      the function role needs DynamoDB GetItem on TABLE.

import crypto from 'node:crypto';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';

const db = new DynamoDBClient({});
const TABLE  = process.env.TABLE || 'vm-subscriptions';
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
  const method = event.requestContext?.http?.method;
  if (method === 'OPTIONS') return { statusCode: 204, headers: CORS };
  try {
    const auth = event.headers?.authorization || event.headers?.Authorization || '';
    const claims = await verifyJwt(auth.replace(/^Bearer\s+/i, ''));
    const r = await db.send(new GetItemCommand({ TableName: TABLE, Key: { sub: { S: claims.sub } } }));
    return resp(200, { plan: r.Item?.plan?.S || 'free', status: r.Item?.status?.S || 'none' });
  } catch (e) {
    console.warn('status error', e.message);
    return resp(200, { plan: 'free', status: 'none' });   // fail safe → treat as free
  }
};

// Verify a Cognito JWT (RS256) against the pool JWKS. Node 20 supports importing
// a JWK directly + crypto.verify — no jsonwebtoken/jose needed.
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
