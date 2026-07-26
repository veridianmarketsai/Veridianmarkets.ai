// Veridian Markets — open the Stripe Customer Portal for the signed-in user.
//
// The app POSTs here with the Cognito access token. We verify the JWT (no libs —
// Node crypto), look up the user's stored Stripe customer id in DynamoDB (the
// webhook saved it as stripeCustomerId), create a Billing Portal session, and
// return its URL. The app redirects there so the user can cancel / switch plan;
// Stripe then fires customer.subscription.* which the webhook already handles.
//
// Trigger:  Lambda Function URL (Auth type = NONE — we verify the token ourselves).
// Env vars: STRIPE_SECRET_KEY, TABLE=vm-subscriptions, COGNITO_POOL_ID,
//           COGNITO_REGION=us-east-1, RETURN_URL (where Stripe sends them back)
// IAM:      the function role needs DynamoDB GetItem on TABLE.

import crypto from 'node:crypto';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';

const db = new DynamoDBClient({});
const TABLE  = process.env.TABLE || 'vm-subscriptions';
const REGION = process.env.COGNITO_REGION || 'us-east-1';
const POOL   = process.env.COGNITO_POOL_ID;
const ISS    = `https://cognito-idp.${REGION}.amazonaws.com/${POOL}`;
const RETURN_URL = process.env.RETURN_URL || 'https://veridianmarkets.ai/settings';

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization,content-type',
  'access-control-allow-methods': 'POST,OPTIONS',
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

    const r = await db.send(new GetItemCommand({ TableName: TABLE, Key: { sub: { S: claims.sub } } }));
    const customer = r.Item?.stripeCustomerId?.S;
    if (!customer) return resp(404, { error: 'no Stripe customer on file — subscribe while signed in first' });

    const session = await stripePortal(customer);
    return resp(200, { url: session.url });
  } catch (e) {
    console.warn('portal error', e.message);
    return resp(400, { error: e.message });
  }
};

// Create a Billing Portal session (Stripe REST, form-encoded, no SDK).
async function stripePortal(customer) {
  const body = new URLSearchParams({ customer, return_url: RETURN_URL });
  const res = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`stripe portal ${res.status}: ${await res.text()}`);
  return res.json();
}

// Verify a Cognito JWT (RS256) against the pool JWKS — same as vm-billing-status.
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
