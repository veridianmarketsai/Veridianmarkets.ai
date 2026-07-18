// Veridian Markets — admin-privileged, MUTATING user actions (Suspend /
// Reactivate / Delete / Change plan). Unlike vm-admin-analytics (read-only),
// this actually changes a real Cognito account or the subscriptions table —
// treat every code change here with the care that implies.
//
// Admin-only: verifies the caller's Cognito token AND that they're in the
// `admin` group (same JWKS check as vm-admin-analytics), then performs ONE
// action on the TARGET user identified by `sub` — Cognito's Admin* APIs
// accept a user's `sub` as an alternative to their Username (this pool's
// actual Username is the sign-up email, not the sub, so this avoids needing
// to look that up separately).
//
// Body: { action: 'suspend'|'reactivate'|'delete'|'setPlan', sub, plan? }
//
// Env vars: COGNITO_POOL_ID, COGNITO_REGION=us-east-1, SUBS_TABLE=vm-subscriptions
// IAM: cognito-idp:AdminDisableUser, AdminEnableUser, AdminDeleteUser on the
//      pool ARN (arn:aws:cognito-idp:<region>:<account>:userpool/<poolId>);
//      dynamodb:UpdateItem on SUBS_TABLE.

import crypto from 'node:crypto';
import {
  CognitoIdentityProviderClient, AdminDisableUserCommand, AdminEnableUserCommand, AdminDeleteUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';

const cog = new CognitoIdentityProviderClient({});
const db  = new DynamoDBClient({});
const REGION     = process.env.COGNITO_REGION || 'us-east-1';
const POOL       = process.env.COGNITO_POOL_ID;
const ISS        = `https://cognito-idp.${REGION}.amazonaws.com/${POOL}`;
const SUBS_TABLE = process.env.SUBS_TABLE || 'vm-subscriptions';
const PLANS      = ['free', 'plus', 'pro', 'business'];

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization,content-type',
  'access-control-allow-methods': 'POST,OPTIONS',
};

let JWKS = null;
async function jwks() { if (JWKS) return JWKS; JWKS = (await (await fetch(`${ISS}/.well-known/jwks.json`)).json()).keys; return JWKS; }

export const handler = async (event) => {
  if (event.requestContext?.http?.method === 'OPTIONS') return { statusCode: 204, headers: CORS };
  try {
    const auth = event.headers?.authorization || event.headers?.Authorization || '';
    const claims = await verifyJwt(auth.replace(/^Bearer\s+/i, ''));
    if (!(claims['cognito:groups'] || []).includes('admin')) return resp(403, { error: 'admin only' });

    const body = JSON.parse(event.body || '{}');
    const { action, sub } = body;
    if (!sub) return resp(400, { error: 'missing sub' });
    // An admin can't suspend/delete their own account through this panel —
    // forces that to go through a path with more friction than a dropdown click.
    if ((action === 'suspend' || action === 'delete') && sub === claims.sub) {
      return resp(400, { error: 'You can’t suspend or delete your own account from here.' });
    }

    if (action === 'suspend') {
      await cog.send(new AdminDisableUserCommand({ UserPoolId: POOL, Username: sub }));
    } else if (action === 'reactivate') {
      await cog.send(new AdminEnableUserCommand({ UserPoolId: POOL, Username: sub }));
    } else if (action === 'delete') {
      await cog.send(new AdminDeleteUserCommand({ UserPoolId: POOL, Username: sub }));
    } else if (action === 'setPlan') {
      if (!PLANS.includes(body.plan)) return resp(400, { error: 'unknown plan' });
      // This is an app-side override (vm-subscriptions), NOT a Stripe call —
      // it does not create/modify/cancel any real subscription or charge.
      await db.send(new UpdateItemCommand({
        TableName: SUBS_TABLE, Key: { sub: { S: sub } },
        UpdateExpression: 'SET #pl = :p',
        ExpressionAttributeNames: { '#pl': 'plan' },   // "plan" is a reserved word
        ExpressionAttributeValues: { ':p': { S: body.plan } },
      }));
    } else {
      return resp(400, { error: 'unknown action' });
    }

    return resp(200, { ok: true });
  } catch (e) {
    console.warn('admin-actions error', e.message);
    return resp(400, { error: e.message });
  }
};

// Verify a Cognito JWT (RS256) against the pool JWKS — same helper as the
// other admin/billing/avatar Lambdas.
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
