// Veridian Markets — read the signed-in user's favourites back out of the
// dedicated vm-favourites table (pk="u#<sub>", sk="<TICKER>"), written by
// vm-capture's syncFavourites(). Same recipe as vm-my-activity: Function URL
// Auth NONE, verifies the Cognito access token itself via JWKS (no API
// Gateway, no admin role needed — this only ever returns the caller's own
// favourites, keyed by their own `sub`).
//
// Env vars: FAV_TABLE=vm-favourites, COGNITO_POOL_ID, COGNITO_REGION=us-east-1
// IAM:      the function role needs DynamoDB Query on FAV_TABLE.

import crypto from 'node:crypto';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';

const db = new DynamoDBClient({});
const FAV_TABLE = process.env.FAV_TABLE || 'vm-favourites';
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
      TableName: FAV_TABLE,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: { ':pk': { S: `u#${claims.sub}` } },
      ProjectionExpression: '#sk',
      ExpressionAttributeNames: { '#sk': 'sk' },   // "sk" is a DynamoDB reserved word
    }));

    const tickers = (r.Items || []).map(item => item.sk?.S).filter(Boolean);
    return resp(200, { tickers });
  } catch (e) {
    console.warn('my-favourites error', e.message);
    return resp(400, { error: e.message });
  }
};

// Verify a Cognito JWT (RS256) against the pool JWKS — same helper as
// vm-my-activity / billing / avatar.
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
