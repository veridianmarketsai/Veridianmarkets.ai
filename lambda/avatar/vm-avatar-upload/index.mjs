// Veridian Markets — profile photo upload → S3.
//
// The browser already resizes the photo to a small (~160px) JPEG data URL
// before calling this (see AccountSettings.jsx / vmResizeImageFile). This
// Lambda verifies the caller's Cognito access token itself (same JWKS check
// as the billing Lambdas — no API Gateway authorizer), then PUTs the bytes to
// S3 under a deterministic per-user key so re-uploads just overwrite the file.
//
// NO npm deps beyond the AWS SDK v3 (@aws-sdk/client-s3 ships with the
// Node.js Lambda runtime — nothing to `npm install`).
//
// Trigger:  Lambda Function URL (Auth type = NONE — we verify the token ourselves).
// Env vars: BUCKET (e.g. veridianmarkets-avatars), COGNITO_POOL_ID, COGNITO_REGION=us-east-1
// IAM:      the function role needs s3:PutObject AND s3:DeleteObject on
//           arn:aws:s3:::<BUCKET>/avatars/* (DeleteObject added for the
//           remove-photo action — update the inline role policy).

import crypto from 'node:crypto';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({});
const BUCKET = process.env.BUCKET;
const REGION = process.env.COGNITO_REGION || 'us-east-1';
const POOL   = process.env.COGNITO_POOL_ID;
const ISS    = `https://cognito-idp.${REGION}.amazonaws.com/${POOL}`;

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
    const key = `avatars/${claims.sub}.jpg`;

    if (body.action === 'delete') {
      await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
      return resp(200, { ok: true });
    }

    const m = String(body.image || '').match(/^data:image\/(jpeg|png);base64,(.+)$/);
    if (!m) return resp(400, { error: 'expected a data:image/jpeg or png base64 string' });
    const bytes = Buffer.from(m[2], 'base64');
    if (bytes.length > 2 * 1024 * 1024) return resp(400, { error: 'image too large' });

    await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: bytes, ContentType: 'image/jpeg' }));

    // Cache-bust query param so the browser doesn't keep showing the old photo.
    return resp(200, { url: `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}?v=${Date.now()}` });
  } catch (e) {
    console.warn('avatar upload error', e.message);
    return resp(400, { error: e.message });
  }
};

// Verify a Cognito JWT (RS256) against the pool JWKS — same helper as the billing
// Lambdas. The browser sends the ACCESS token (has `sub`, which is all we need
// for the S3 key).
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
