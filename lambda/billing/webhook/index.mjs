// Veridian Markets — Stripe webhook → record the subscription plan in DynamoDB.
//
// NO npm dependencies: verifies the Stripe signature with Node's built-in crypto,
// calls Stripe's REST API with fetch, and uses ONLY @aws-sdk/client-dynamodb (which
// is always present in the Lambda Node 20 runtime — we avoid @aws-sdk/lib-dynamodb,
// which isn't reliably bundled and causes a 502). Paste into the console + Deploy.
//
// Trigger:  Lambda Function URL (Auth type = NONE — Stripe calls it; we verify sig).
// Env vars: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, PRICE_PLUS, PRICE_PRO, TABLE
// IAM:      the function role needs DynamoDB Get/Put/UpdateItem on TABLE.

import crypto from 'node:crypto';
import { DynamoDBClient, GetItemCommand, PutItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';

const db = new DynamoDBClient({});
const TABLE = process.env.TABLE || 'vm-subscriptions';
const PRICE_PLAN = {
  [process.env.PRICE_PLUS]: 'plus',
  [process.env.PRICE_PRO]:  'pro',
};

export const handler = async (event) => {
  const sig = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];
  const raw = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;

  let evt;
  try { evt = verifyStripe(raw, sig, process.env.STRIPE_WEBHOOK_SECRET); }
  catch (e) { console.warn('bad signature', e.message); return resp(400, { error: e.message }); }

  try {
    if (evt.type === 'checkout.session.completed') {
      const s = evt.data.object;
      const sub = s.client_reference_id;               // Cognito sub (set on the Payment Link)
      if (sub) {
        const plan = await planFromSession(s);
        await savePlan(sub, { plan, status: 'active', customer: s.customer, subscriptionId: s.subscription });
        if (s.customer) await mapCustomer(s.customer, sub);
      }
    } else if (evt.type === 'customer.subscription.updated' || evt.type === 'customer.subscription.deleted') {
      const s = evt.data.object;
      const sub = await subFromCustomer(s.customer);
      if (sub) {
        const plan = evt.type === 'customer.subscription.deleted'
          ? 'free'
          : (PRICE_PLAN[s.items?.data?.[0]?.price?.id] || 'plus');
        await savePlan(sub, { plan, status: s.status, subscriptionId: s.id });
      }
    }
  } catch (e) {
    console.error('handler error', e);
    return resp(500, { error: 'processing error' });
  }
  return resp(200, { received: true });
};

// ── Stripe signature verification (no SDK) ──────────────────────────────────
function verifyStripe(payload, header, secret) {
  if (!secret) throw new Error('missing STRIPE_WEBHOOK_SECRET');
  if (!header) throw new Error('missing signature header');
  const parts = Object.fromEntries(header.split(',').map(p => p.split('=')));
  if (!parts.t || !parts.v1) throw new Error('malformed signature');
  const expected = crypto.createHmac('sha256', secret).update(`${parts.t}.${payload}`).digest('hex');
  const a = Buffer.from(expected), b = Buffer.from(parts.v1);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw new Error('signature mismatch');
  if (Math.abs(Date.now() / 1000 - Number(parts.t)) > 300) throw new Error('timestamp outside tolerance');
  return JSON.parse(payload);
}

// ── Stripe REST (no SDK) — read the checkout session's price to know the plan ─
async function planFromSession(s) {
  const r = await stripeGet(`checkout/sessions/${s.id}/line_items?limit=1`);
  return PRICE_PLAN[r.data?.[0]?.price?.id] || 'plus';
}
async function stripeGet(path) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
  });
  if (!res.ok) throw new Error(`stripe ${path} → ${res.status}`);
  return res.json();
}

// ── DynamoDB (low-level client only — attribute values typed by hand) ────────
async function savePlan(sub, a) {
  const names = { '#p': 'plan', '#s': 'status' };
  const sets = ['#p = :p', '#s = :s', 'updatedAt = :u'];
  const vals = { ':p': { S: a.plan }, ':s': { S: a.status }, ':u': { S: new Date().toISOString() } };
  if (a.customer)       { sets.push('stripeCustomerId = :c'); vals[':c'] = { S: a.customer }; }
  if (a.subscriptionId) { sets.push('subscriptionId = :sub'); vals[':sub'] = { S: a.subscriptionId }; }
  await db.send(new UpdateItemCommand({
    TableName: TABLE, Key: { sub: { S: sub } },
    UpdateExpression: 'SET ' + sets.join(', '),
    ExpressionAttributeNames: names, ExpressionAttributeValues: vals,
  }));
}
const mapCustomer = (customer, sub) =>
  db.send(new PutItemCommand({ TableName: TABLE, Item: { sub: { S: `cust#${customer}` }, mapsTo: { S: sub } } }));
const subFromCustomer = async (customer) => {
  const r = await db.send(new GetItemCommand({ TableName: TABLE, Key: { sub: { S: `cust#${customer}` } } }));
  return r.Item?.mapsTo?.S;
};

const resp = (statusCode, body) => ({ statusCode, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
