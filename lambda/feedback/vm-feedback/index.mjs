// Veridian Markets — Feedback backend (submit + list + view).
//
// The Beta Feedback widget (BetaFeedback.jsx) captures a screenshot, lets the
// user annotate/comment, then POSTs here. This Lambda verifies the caller's
// Cognito access token itself (same JWKS check as avatar-upload / admin-actions
// — no API Gateway authorizer), uploads each screenshot to a PRIVATE S3
// bucket, and stores the metadata in DynamoDB.
//
// Visibility rule (enforced server-side, not just hidden in the UI): a
// feedback item is only ever readable by its own creator (sub match) or a
// Cognito `admin` group member. Screenshots are served via short-lived
// presigned GET URLs — the bucket itself is never public.
//
// NO npm deps beyond the AWS SDK v3 (@aws-sdk/client-s3, @aws-sdk/client-dynamodb,
// @aws-sdk/util-dynamodb, @aws-sdk/s3-request-presigner all ship with the
// Node.js Lambda runtime — nothing to `npm install`; same as media-upload).
//
// Trigger:  Lambda Function URL (Auth type = NONE — we verify the token ourselves).
// Env vars: BUCKET (e.g. vm-feedback-screenshots), TABLE_NAME (e.g. vm-feedback),
//           COGNITO_POOL_ID, COGNITO_REGION=us-east-1, AWS_REGION=us-east-1
// IAM:      s3:PutObject + s3:GetObject on arn:aws:s3:::<BUCKET>/feedback/*;
//           dynamodb:PutItem, Query, Scan, GetItem, UpdateItem on arn:aws:dynamodb:<region>:<account>:table/<TABLE_NAME>
//
// Body: { action: 'submit'|'listMine'|'listAll'|'getItem'|'setStatus'|'setNote', ... }
//   submit:    { items: [{ screenshot: 'data:image/jpeg;base64,...', comment }], page, route, userEmail, userName }
//   listMine:  {}                              → caller's own submissions (summaries, no images)
//   listAll:   {}                    (admin)    → every submission (summaries, no images)
//   getItem:   { sub, id }                      → one submission's full items incl. presigned screenshot URLs
//   setStatus: { sub, id, status }   (admin)    → triage workflow: 'new' | 'in_progress' | 'resolved'
//   setNote:   { sub, id, note }     (admin)    → internal admin note, not shown to the submitter

import crypto from 'node:crypto';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { DynamoDBClient, PutItemCommand, QueryCommand, ScanCommand, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

const s3 = new S3Client({});
const db = new DynamoDBClient({});
const BUCKET = process.env.BUCKET;
const TABLE  = process.env.TABLE_NAME || 'vm-feedback';
const REGION = process.env.COGNITO_REGION || 'us-east-1';
const POOL   = process.env.COGNITO_POOL_ID;
const ISS    = `https://cognito-idp.${REGION}.amazonaws.com/${POOL}`;

const MAX_ITEMS_PER_SUBMIT = 8;
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const STATUSES = ['new', 'in_progress', 'resolved'];
const URL_TTL_S = 600; // 10 min — plenty to load the modal / annotation canvas

// CORS is handled by the Function URL's own CORS config (AWS console/CLI —
// see lambda/README.md), NOT here. Returning access-control-* headers from the
// function too causes AWS to send them twice (e.g. "access-control-allow-origin:
// *, *"), which every browser rejects outright — that was silently breaking
// every call this Lambda ever served. Preflight OPTIONS is also handled by the
// Function URL itself and never reaches this handler.

let JWKS = null;
async function jwks() { if (JWKS) return JWKS; JWKS = (await (await fetch(`${ISS}/.well-known/jwks.json`)).json()).keys; return JWKS; }

export const handler = async (event) => {
  try {
    const auth = event.headers?.authorization || event.headers?.Authorization || '';
    const claims = await verifyJwt(auth.replace(/^Bearer\s+/i, ''));
    const isAdmin = (claims['cognito:groups'] || []).includes('admin');

    const body = JSON.parse(event.body || '{}');

    if (body.action === 'submit')   return resp(200, await doSubmit(claims, body));
    if (body.action === 'listMine') return resp(200, { ok: true, items: await listBySub(claims.sub) });
    if (body.action === 'listAll') {
      if (!isAdmin) return resp(403, { error: 'admin only' });
      return resp(200, { ok: true, items: await listAll() });
    }
    if (body.action === 'getItem') {
      if (!body.sub || !body.id) return resp(400, { error: 'missing sub or id' });
      if (!isAdmin && body.sub !== claims.sub) return resp(403, { error: 'not your feedback' });
      const item = await getItem(body.sub, body.id);
      if (!item) return resp(404, { error: 'not found' });
      return resp(200, { ok: true, item: await withPresignedUrls(item) });
    }
    if (body.action === 'setStatus') {
      if (!isAdmin) return resp(403, { error: 'admin only' });
      if (!body.sub || !body.id) return resp(400, { error: 'missing sub or id' });
      if (!STATUSES.includes(body.status)) return resp(400, { error: 'unknown status' });
      await db.send(new UpdateItemCommand({
        TableName: TABLE, Key: marshall({ sub: body.sub, id: body.id }),
        UpdateExpression: 'SET #st = :s',
        ExpressionAttributeNames: { '#st': 'status' },
        ExpressionAttributeValues: { ':s': { S: body.status } },
      }));
      return resp(200, { ok: true });
    }
    if (body.action === 'setNote') {
      if (!isAdmin) return resp(403, { error: 'admin only' });
      if (!body.sub || !body.id) return resp(400, { error: 'missing sub or id' });
      await db.send(new UpdateItemCommand({
        TableName: TABLE, Key: marshall({ sub: body.sub, id: body.id }),
        UpdateExpression: 'SET adminNote = :n',
        ExpressionAttributeValues: { ':n': { S: String(body.note || '').slice(0, 4000) } },
      }));
      return resp(200, { ok: true });
    }
    return resp(400, { error: 'unknown action' });
  } catch (e) {
    console.warn('feedback error', e.message);
    return resp(400, { error: e.message });
  }
};

async function doSubmit(claims, body) {
  const items = Array.isArray(body.items) ? body.items.slice(0, MAX_ITEMS_PER_SUBMIT) : [];
  if (!items.length) throw new Error('no items');

  const id = `${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const stored = [];
  for (let i = 0; i < items.length; i++) {
    const m = String(items[i].screenshot || '').match(/^data:image\/jpeg;base64,(.+)$/);
    if (!m) throw new Error(`item ${i}: expected a data:image/jpeg base64 string`);
    const bytes = Buffer.from(m[1], 'base64');
    if (bytes.length > MAX_IMAGE_BYTES) throw new Error(`item ${i}: image too large`);
    const key = `feedback/${claims.sub}/${id}/${i}.jpg`;
    await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: bytes, ContentType: 'image/jpeg' }));
    stored.push({ key, comment: String(items[i].comment || '').slice(0, 2000) });
  }

  // The access token (what the browser sends) carries `sub` + `cognito:groups`
  // but not profile claims like email/name — those live on the ID token only.
  // sub is what actually gates access (see getItem/listMine); email/name here
  // are just display metadata for the admin view, supplied by the caller.
  await db.send(new PutItemCommand({
    TableName: TABLE,
    Item: marshall({
      sub: claims.sub, id,
      ts: Date.now(),
      page: String(body.page || '').slice(0, 300),
      route: String(body.route || '').slice(0, 120),
      userEmail: String(body.userEmail || '').slice(0, 200),
      userName: String(body.userName || 'Member').slice(0, 200),
      status: 'new',
      items: stored,
    }),
  }));

  return { ok: true, id };
}

async function listBySub(sub) {
  // ConsistentRead: Scan/Query default to eventually-consistent reads, which
  // could otherwise make a just-submitted item briefly invisible right after
  // doSubmit's PutItem — exactly the "feedback isn't there yet" symptom this
  // is meant to avoid. Table is tiny, so the 2x read-capacity cost is nothing.
  const res = await db.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: 'sub = :s',
    ExpressionAttributeValues: { ':s': { S: sub } },
    ScanIndexForward: false, // id is time-prefixed → newest first
    ConsistentRead: true,
  }));
  return (res.Items || []).map(unmarshall).map(summarize);
}

async function listAll() {
  const items = [];
  let ExclusiveStartKey;
  do {
    const res = await db.send(new ScanCommand({ TableName: TABLE, ExclusiveStartKey, ConsistentRead: true }));
    items.push(...(res.Items || []).map(unmarshall).map(summarize));
    ExclusiveStartKey = res.LastEvaluatedKey;
  } while (ExclusiveStartKey && items.length < 2000);
  return items.sort((a, b) => b.ts - a.ts);
}

async function getItem(sub, id) {
  const res = await db.send(new GetItemCommand({ TableName: TABLE, Key: marshall({ sub, id }) }));
  return res.Item ? unmarshall(res.Item) : null;
}

// List views omit screenshots entirely (no S3 round-trip needed just to show a
// row) — the admin/My-feedback UI lazily calls getItem to view images.
function summarize(it) {
  return {
    sub: it.sub, id: it.id, ts: it.ts, page: it.page, route: it.route, status: it.status,
    userEmail: it.userEmail, userName: it.userName, adminNote: it.adminNote || '',
    itemCount: (it.items || []).length,
    comments: (it.items || []).map(i => i.comment),
  };
}

async function withPresignedUrls(it) {
  const items = await Promise.all((it.items || []).map(async i => ({
    comment: i.comment,
    screenshot: await getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: i.key }), { expiresIn: URL_TTL_S }),
  })));
  return { ...it, items };
}

// Verify a Cognito JWT (RS256) against the pool JWKS — same helper as the
// avatar/admin-actions Lambdas.
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

const resp = (statusCode, body) => ({ statusCode, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
