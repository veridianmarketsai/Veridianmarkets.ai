// Veridian Markets — create a Stripe Checkout Session for the signed-in user.
//
// This replaces Payment Links. It reuses ONE Stripe customer per Cognito user
// (stored in DynamoDB), so repeat checkouts never create duplicate customers,
// and every subscription is tied to the account — so vm-billing-status reliably
// returns the right plan and the portal/webhook can find the customer.
//
// Flow: verify the Cognito access token → find-or-create the user's Stripe
// customer → create a subscription Checkout Session for the chosen plan's price
// → return its URL for the browser to redirect to.
//
// NO npm deps: Node crypto for JWT verify, fetch for Stripe REST, and only
// @aws-sdk/client-dynamodb (avoid @aws-sdk/lib-dynamodb — not bundled → 502).
//
// Trigger:  Lambda Function URL (Auth type = NONE — we verify the token ourselves).
// Env vars: STRIPE_SECRET_KEY, TABLE=vm-subscriptions, COGNITO_POOL_ID,
//           COGNITO_REGION=us-east-1, PRICE_PLUS, PRICE_PRO, SUCCESS_URL, CANCEL_URL
// IAM:      the function role needs DynamoDB GetItem + PutItem + UpdateItem on TABLE.

import crypto from 'node:crypto';
import { DynamoDBClient, GetItemCommand, PutItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';

const db = new DynamoDBClient({});
const TABLE  = process.env.TABLE || 'vm-subscriptions';
const REGION = process.env.COGNITO_REGION || 'us-east-1';
const POOL   = process.env.COGNITO_POOL_ID;
const ISS    = `https://cognito-idp.${REGION}.amazonaws.com/${POOL}`;
const PRICE  = { plus: process.env.PRICE_PLUS, pro: process.env.PRICE_PRO };
const SUCCESS_URL = process.env.SUCCESS_URL || 'https://veridianmarkets.ai/settings';
const CANCEL_URL  = process.env.CANCEL_URL  || 'https://veridianmarkets.ai/upgrade';

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

    const body = JSON.parse(event.body || '{}');
    const plan = String(body.plan || '').toLowerCase();
    const price = PRICE[plan];
    if (!price) return resp(400, { error: `unknown plan "${plan}"` });

    const customer = await getOrCreateCustomer(claims, body.email);
    const session = await createCheckout(customer, price, claims.sub);
    return resp(200, { url: session.url });
  } catch (e) {
    console.warn('checkout error', e.message);
    return resp(400, { error: e.message });
  }
};

// One Stripe customer per Cognito user — reused across checkouts. If the stored
// customer was deleted in Stripe (e.g. manual cleanup), we make a fresh one.
async function getOrCreateCustomer(claims, email) {
  const r = await db.send(new GetItemCommand({ TableName: TABLE, Key: { sub: { S: claims.sub } } }));
  const existing = r.Item?.stripeCustomerId?.S;
  if (existing && await customerLives(existing)) return existing;

  const c = await stripePost('customers', {
    ...(email || claims.email ? { email: email || claims.email } : {}),
    'metadata[cognitoSub]': claims.sub,
  });
  // Save the id on the user's row and a reverse map (cust#id → sub) so the
  // webhook can resolve subscription.updated/deleted events back to the user.
  await db.send(new UpdateItemCommand({
    TableName: TABLE, Key: { sub: { S: claims.sub } },
    UpdateExpression: 'SET stripeCustomerId = :c',
    ExpressionAttributeValues: { ':c': { S: c.id } },
  }));
  await db.send(new PutItemCommand({ TableName: TABLE, Item: { sub: { S: `cust#${c.id}` }, mapsTo: { S: claims.sub } } }));
  return c.id;
}

function createCheckout(customer, price, sub) {
  return stripePost('checkout/sessions', {
    mode: 'subscription',
    customer,
    'line_items[0][price]': price,
    'line_items[0][quantity]': '1',
    client_reference_id: sub,
    success_url: SUCCESS_URL,
    cancel_url: CANCEL_URL,
  });
}

// Does this Stripe customer still exist (and isn't deleted)?
async function customerLives(id) {
  try {
    const res = await fetch(`https://api.stripe.com/v1/customers/${id}`, {
      headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
    });
    if (!res.ok) return false;             // 404 → deleted / unknown
    const c = await res.json();
    return !c.deleted;                     // Stripe returns { deleted: true } for a deleted customer
  } catch { return false; }
}

async function stripePost(path, params) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
  });
  if (!res.ok) throw new Error(`stripe ${path} ${res.status}: ${await res.text()}`);
  return res.json();
}

// Verify a Cognito JWT (RS256) against the pool JWKS — same as the other billing
// Lambdas. The browser sends the ACCESS token (has sub; email comes from the body).
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
