// Veridian Markets — "What's new" updates feed (Admin → Updates writes,
// every signed-in user reads). Single global feed, one DynamoDB table:
//   pk = "UPDATE" (fixed — one partition, whole feed)
//   sk = "<ISO createdAt>#<8-char id>"  (lexicographically sortable → newest
//        first via ScanIndexForward:false, no GSI needed)
// Same recipe as vm-my-favourites (Function URL Auth NONE, verifies the
// Cognito token itself via JWKS) + vm-admin-actions (requires `admin` group
// for the mutating actions). GET is public — anyone can read the feed,
// including signed-out visitors on the public /updates page — POST/PUT/DELETE
// require a valid Cognito access token AND `admin` group membership.
//
// Env vars: UPDATES_TABLE=vm-updates, COGNITO_POOL_ID, COGNITO_REGION=us-east-1
// IAM: the function role needs dynamodb:Query, PutItem, UpdateItem, DeleteItem
//      on UPDATES_TABLE.
//
// Table setup (AWS Console → DynamoDB → Create table):
//   Table name: vm-updates · Partition key: pk (String) · Sort key: sk (String)
//   On-demand capacity, everything else default.

import crypto from 'node:crypto';
import { DynamoDBClient, QueryCommand, PutItemCommand, UpdateItemCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';

const db = new DynamoDBClient({});
const TABLE  = process.env.UPDATES_TABLE || 'vm-updates';
const REGION = process.env.COGNITO_REGION || 'us-east-1';
const POOL   = process.env.COGNITO_POOL_ID;
const ISS    = `https://cognito-idp.${REGION}.amazonaws.com/${POOL}`;
const PK     = 'UPDATE';

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization,content-type',
  'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

let JWKS = null;
async function jwks() { if (JWKS) return JWKS; JWKS = (await (await fetch(`${ISS}/.well-known/jwks.json`)).json()).keys; return JWKS; }

// Verify a Cognito JWT (RS256) against the pool JWKS — same helper as the
// other admin/favourites/billing Lambdas.
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

async function requireAdmin(event) {
  const auth = event.headers?.authorization || event.headers?.Authorization || '';
  const claims = await verifyJwt(auth.replace(/^Bearer\s+/i, ''));
  const groups = claims['cognito:groups'] || [];
  if (!groups.includes('admin')) { const e = new Error('admin only'); e.statusCode = 403; throw e; }
  return claims;
}

const itemToJson = (it) => ({
  id: it.sk.S, title: it.title.S, body: it.body.S, tag: it.tag?.S || 'Update',
  date: it.date.S, createdAt: Number(it.createdAt.N),
});

async function listUpdates() {
  const r = await db.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: 'pk = :pk',
    ExpressionAttributeValues: { ':pk': { S: PK } },
    ScanIndexForward: false,   // newest sk (ISO timestamp prefix) first
    Limit: 200,
  }));
  return (r.Items || []).map(itemToJson);
}

async function createUpdate(body) {
  const title = String(body.title || '').trim();
  const text  = String(body.body || '').trim();
  if (!title || !text) { const e = new Error('title and body are required'); e.statusCode = 400; throw e; }
  const now = Date.now();
  const iso = new Date(now).toISOString();
  const sk  = `${iso}#${crypto.randomUUID().slice(0, 8)}`;
  const item = {
    pk: { S: PK }, sk: { S: sk },
    title: { S: title.slice(0, 200) },
    body:  { S: text.slice(0, 4000) },
    tag:   { S: String(body.tag || 'Update').slice(0, 40) },
    date:  { S: iso.slice(0, 10) },
    createdAt: { N: String(now) },
  };
  await db.send(new PutItemCommand({ TableName: TABLE, Item: item }));
  return itemToJson(item);
}

async function updateUpdate(id, body) {
  if (!id) { const e = new Error('missing id'); e.statusCode = 400; throw e; }
  const names = {}, values = {}, sets = [];
  if (body.title != null) { sets.push('#ti = :ti'); names['#ti'] = 'title'; values[':ti'] = { S: String(body.title).trim().slice(0, 200) }; }
  if (body.body  != null) { sets.push('#bo = :bo'); names['#bo'] = 'body';  values[':bo'] = { S: String(body.body).trim().slice(0, 4000) }; }
  if (body.tag   != null) { sets.push('#ta = :ta'); names['#ta'] = 'tag';   values[':ta'] = { S: String(body.tag).slice(0, 40) }; }
  if (!sets.length) { const e = new Error('nothing to update'); e.statusCode = 400; throw e; }
  await db.send(new UpdateItemCommand({
    TableName: TABLE, Key: { pk: { S: PK }, sk: { S: id } },
    UpdateExpression: `SET ${sets.join(', ')}`,
    ExpressionAttributeNames: names, ExpressionAttributeValues: values,
    ConditionExpression: 'attribute_exists(pk)',
  }));
  return { ok: true };
}

async function deleteUpdate(id) {
  if (!id) { const e = new Error('missing id'); e.statusCode = 400; throw e; }
  await db.send(new DeleteItemCommand({ TableName: TABLE, Key: { pk: { S: PK }, sk: { S: id } } }));
  return { ok: true };
}

export const handler = async (event) => {
  const method = event.requestContext?.http?.method || 'GET';
  if (method === 'OPTIONS') return { statusCode: 204, headers: CORS };
  try {
    if (method === 'GET') return resp(200, { updates: await listUpdates() });

    // Everything past this point mutates the feed — admin only.
    await requireAdmin(event);
    const body = JSON.parse(event.body || '{}');

    if (method === 'POST')   return resp(200, await createUpdate(body));
    if (method === 'PUT')    return resp(200, await updateUpdate(body.id || event.queryStringParameters?.id, body));
    if (method === 'DELETE') return resp(200, await deleteUpdate(body.id || event.queryStringParameters?.id));

    return resp(405, { error: 'method not allowed' });
  } catch (e) {
    console.warn('vm-updates error', e.message);
    return resp(e.statusCode || 400, { error: e.message });
  }
};

const resp = (statusCode, body) => ({ statusCode, headers: { 'content-type': 'application/json', ...CORS }, body: JSON.stringify(body) });
