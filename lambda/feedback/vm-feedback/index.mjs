// Veridian Markets — real feedback backend (screenshot + comment widget).
//
// Two actions, both requiring a real, valid Cognito access token AND real
// eligibility (beta OR a paying plan) — checked server-side here, not just
// by hiding the button client-side:
//   uploadUrl — presigned S3 PUT URL for one screenshot (same technique as
//               vm-media-upload, unrelated bucket prefix). Keys are random,
//               unguessable (crypto.randomBytes), not sequential — screenshots
//               can contain real session data, so "public but unguessable"
//               is the same tradeoff already accepted for the founder video,
//               just deliberately non-enumerable here since the content is
//               more sensitive.
//   submit     — writes the feedback record (metadata + the S3 URLs from
//               uploadUrl, NOT the raw image data — DynamoDB items cap out
//               around 400KB, nowhere near enough for screenshots) to
//               FEEDBACK_TABLE. Admin reads happen via vm-admin-actions'
//               listFeedback (admin-gated, separate Lambda/role on purpose —
//               same split as beta invites: self-service write here, admin
//               read over there).
//
// Body: { action: 'uploadUrl'|'submit', filename?, type?, page?, route?, items? }
//
// Env vars: COGNITO_POOL_ID, COGNITO_REGION=us-east-1, SUBS_TABLE=vm-subscriptions,
//           FEEDBACK_TABLE=vm-feedback, BUCKET_NAME, CDN_BASE_URL
// IAM: dynamodb:GetItem on SUBS_TABLE; dynamodb:PutItem on FEEDBACK_TABLE;
//      s3:PutObject on BUCKET_NAME's feedback/* prefix.
// Deploy as a ZIP (not pasted inline) — needs @aws-sdk/s3-request-presigner,
// which isn't bundled in the default Lambda Node.js runtime.

import crypto from 'node:crypto';
import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const db = new DynamoDBClient({});
const s3 = new S3Client({});
const REGION         = process.env.COGNITO_REGION || 'us-east-1';
const POOL            = process.env.COGNITO_POOL_ID;
const ISS             = `https://cognito-idp.${REGION}.amazonaws.com/${POOL}`;
const SUBS_TABLE       = process.env.SUBS_TABLE || 'vm-subscriptions';
const FEEDBACK_TABLE   = process.env.FEEDBACK_TABLE || 'vm-feedback';
const BUCKET           = process.env.BUCKET_NAME;
const CDN_BASE         = (process.env.CDN_BASE_URL || '').replace(/\/$/, '');

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization,content-type',
  'access-control-allow-methods': 'POST,OPTIONS',
};

let JWKS = null;
async function jwks() { if (JWKS) return JWKS; JWKS = (await (await fetch(`${ISS}/.well-known/jwks.json`)).json()).keys; return JWKS; }
async function verifyJwt(token) {
  const [h, p, s] = (token || '').split('.');
  if (!h || !p || !s) throw new Error('malformed token');
  const header  = JSON.parse(Buffer.from(h, 'base64url').toString());
  const payload = JSON.parse(Buffer.from(p, 'base64url').toString());
  const jwk = (await jwks()).find(k => k.kid === header.kid);
  if (!jwk) throw new Error('unknown signing key');
  const key = crypto.createPublicKey({ key: jwk, format: 'jwk' });
  if (!crypto.verify('RSA-SHA256', Buffer.from(`${h}.${p}`), key, Buffer.from(s, 'base64url'))) throw new Error('bad signature');
  if (payload.iss !== ISS) throw new Error('bad issuer');
  if (payload.exp * 1000 < Date.now()) throw new Error('token expired');
  return payload;
}

// Real eligibility check — beta tester OR an actual paying plan, both read
// from real sources (Cognito group / vm-subscriptions), not trusted from
// the client at all.
async function isEligible(claims) {
  const groups = claims['cognito:groups'] || [];
  if (groups.includes('beta') || groups.includes('admin')) return true;
  const r = await db.send(new GetItemCommand({ TableName: SUBS_TABLE, Key: { sub: { S: claims.sub } } }));
  const plan = r.Item?.plan?.S || 'free';
  return plan !== 'free';
}

export const handler = async (event) => {
  if (event.requestContext?.http?.method === 'OPTIONS') return { statusCode: 204, headers: CORS };
  try {
    const auth = event.headers?.authorization || event.headers?.Authorization || '';
    const claims = await verifyJwt(auth.replace(/^Bearer\s+/i, ''));
    if (!(await isEligible(claims))) {
      return resp(403, { error: 'Feedback is available for beta testers and paying subscribers.' });
    }

    const body = JSON.parse(event.body || '{}');

    if (body.action === 'uploadUrl') {
      if (!BUCKET) return resp(500, { error: 'BUCKET_NAME not configured' });
      const folder = crypto.randomBytes(8).toString('base64url');   // unguessable per-submission folder
      const safeName = String(body.filename || 'img.jpg').replace(/[^a-zA-Z0-9._-]/g, '_');
      const key = `feedback/${folder}/${safeName}`;
      const uploadUrl = await getSignedUrl(s3, new PutObjectCommand({
        Bucket: BUCKET, Key: key, ContentType: body.type || 'image/jpeg',
      }), { expiresIn: 300 });
      return resp(200, { ok: true, uploadUrl, publicUrl: `${CDN_BASE}/${key}` });
    }

    if (body.action === 'submit') {
      const items = Array.isArray(body.items) ? body.items.slice(0, 10) : [];
      const feedback = {
        id: crypto.randomBytes(8).toString('base64url'),
        page: String(body.page || ''), route: String(body.route || ''),
        ts: Date.now(), userEmail: claims.email || '', userName: claims.name || claims.email || '',
        items: items.map(it => ({ screenshotUrl: String(it.screenshotUrl || ''), comment: String(it.comment || '').slice(0, 2000) })),
        status: 'new',
      };
      await db.send(new PutItemCommand({
        TableName: FEEDBACK_TABLE,
        Item: {
          id: { S: feedback.id }, page: { S: feedback.page }, route: { S: feedback.route },
          ts: { N: String(feedback.ts) }, userEmail: { S: feedback.userEmail }, userName: { S: feedback.userName },
          items: { S: JSON.stringify(feedback.items) }, status: { S: feedback.status },
        },
      }));
      return resp(200, { ok: true, id: feedback.id });
    }

    return resp(400, { error: 'unknown action' });
  } catch (e) {
    console.warn('feedback error', e.message);
    return resp(400, { error: e.message });
  }
};

const resp = (statusCode, body) => ({ statusCode, headers: { 'content-type': 'application/json', ...CORS }, body: JSON.stringify(body) });
