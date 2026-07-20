// Veridian Markets — admin-privileged, MUTATING user actions (Suspend /
// Reactivate / Delete / Change plan) PLUS per-employee admin permissions
// (Team). Unlike vm-admin-analytics (read-only), this actually changes a
// real Cognito account or the subscriptions table — treat every code
// change here with the care that implies.
//
// Admin-only: verifies the caller's Cognito token AND that they're in the
// `admin` group (same JWKS check as vm-admin-analytics), then performs ONE
// action on the TARGET user identified by `sub` — Cognito's Admin* APIs
// accept a user's `sub` as an alternative to their Username (this pool's
// actual Username is the sign-up email, not the sub, so this avoids needing
// to look that up separately).
//
// Body: { action: 'suspend'|'reactivate'|'delete'|'setPlan'|'listTeam'|'setPermissions', sub, plan?, group?, grant? }
//
// ── Permissions model ─────────────────────────────────────────────────────
// Three extra Cognito groups gate the three mutating actions beyond plain
// `admin` membership: `admin-suspend` (suspend/reactivate), `admin-delete`,
// `admin-billing` (setPlan). An owner grants/revokes these per employee from
// the new Team tab (`setPermissions`), which itself needs "full admin" — see
// below.
//
// SAFE ROLLOUT RULE: an admin who has never been assigned ANY of the three
// permission groups is treated as a full admin (today's behavior,
// unrestricted) — restriction only kicks in once an owner has explicitly
// assigned that person at least one of the three groups. This means
// deploying this Lambda/these Cognito groups can never silently lock out
// every existing admin (including the account owner) before anyone's had a
// chance to set the new groups up in the Cognito console.
//
// Env vars: COGNITO_POOL_ID, COGNITO_REGION=us-east-1, SUBS_TABLE=vm-subscriptions
// IAM: cognito-idp:AdminDisableUser, AdminEnableUser, AdminDeleteUser,
//      ListUsersInGroup, AdminListGroupsForUser, AdminAddUserToGroup,
//      AdminRemoveUserFromGroup on the pool ARN
//      (arn:aws:cognito-idp:<region>:<account>:userpool/<poolId>);
//      dynamodb:UpdateItem on SUBS_TABLE.

import crypto from 'node:crypto';
import {
  CognitoIdentityProviderClient, AdminDisableUserCommand, AdminEnableUserCommand, AdminDeleteUserCommand,
  ListUsersInGroupCommand, AdminListGroupsForUserCommand, AdminAddUserToGroupCommand, AdminRemoveUserFromGroupCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';

const cog = new CognitoIdentityProviderClient({});
const db  = new DynamoDBClient({});
const REGION     = process.env.COGNITO_REGION || 'us-east-1';
const POOL       = process.env.COGNITO_POOL_ID;
const ISS        = `https://cognito-idp.${REGION}.amazonaws.com/${POOL}`;
const SUBS_TABLE = process.env.SUBS_TABLE || 'vm-subscriptions';
const PLANS      = ['free', 'plus', 'pro', 'business'];

const PERMISSION_GROUPS  = ['admin-suspend', 'admin-delete', 'admin-billing'];
const ACTION_PERMISSION  = { suspend: 'admin-suspend', reactivate: 'admin-suspend', delete: 'admin-delete', setPlan: 'admin-billing' };

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization,content-type',
  'access-control-allow-methods': 'POST,OPTIONS',
};

let JWKS = null;
async function jwks() { if (JWKS) return JWKS; JWKS = (await (await fetch(`${ISS}/.well-known/jwks.json`)).json()).keys; return JWKS; }

// See the SAFE ROLLOUT RULE note above — an admin never touched by the Team
// tool keeps full rights; only once assigned at least one permission group
// do they become restricted to exactly what's ticked.
function hasPermission(groups, requiredGroup) {
  if (!requiredGroup) return true;
  const migrated = PERMISSION_GROUPS.some(g => groups.includes(g));
  if (!migrated) return true;
  return groups.includes(requiredGroup);
}
function isFullAdmin(groups) {
  return PERMISSION_GROUPS.every(g => hasPermission(groups, g));
}

export const handler = async (event) => {
  if (event.requestContext?.http?.method === 'OPTIONS') return { statusCode: 204, headers: CORS };
  try {
    const auth = event.headers?.authorization || event.headers?.Authorization || '';
    const claims = await verifyJwt(auth.replace(/^Bearer\s+/i, ''));
    const groups = claims['cognito:groups'] || [];
    if (!groups.includes('admin')) return resp(403, { error: 'admin only' });

    const body = JSON.parse(event.body || '{}');
    const { action, sub } = body;

    if (action === 'listTeam') {
      if (!isFullAdmin(groups)) return resp(403, { error: 'Only a full admin can view team permissions.' });
      return resp(200, { ok: true, team: await listTeam() });
    }

    if (action === 'setPermissions') {
      if (!isFullAdmin(groups)) return resp(403, { error: 'Only a full admin can change team permissions.' });
      if (!sub) return resp(400, { error: 'missing sub' });
      if (sub === claims.sub) return resp(400, { error: 'You can’t change your own permissions from here.' });
      if (!PERMISSION_GROUPS.includes(body.group)) return resp(400, { error: 'unknown permission group' });

      // A not-yet-migrated admin shows every box checked (implicit full
      // access — see the SAFE ROLLOUT RULE). The first time any box is
      // touched for them, make that implicit access explicit in Cognito
      // for the OTHER groups first, so touching one box can't silently
      // change the other two.
      const current = await cog.send(new AdminListGroupsForUserCommand({ UserPoolId: POOL, Username: sub }));
      const currentGroups = (current.Groups || []).map(g => g.GroupName);
      const wasMigrated = PERMISSION_GROUPS.some(g => currentGroups.includes(g));
      if (!wasMigrated) {
        for (const g of PERMISSION_GROUPS) {
          if (g !== body.group) await cog.send(new AdminAddUserToGroupCommand({ UserPoolId: POOL, Username: sub, GroupName: g }));
        }
      }
      if (body.grant) {
        await cog.send(new AdminAddUserToGroupCommand({ UserPoolId: POOL, Username: sub, GroupName: body.group }));
      } else {
        await cog.send(new AdminRemoveUserFromGroupCommand({ UserPoolId: POOL, Username: sub, GroupName: body.group }));
      }
      return resp(200, { ok: true });
    }

    if (!sub) return resp(400, { error: 'missing sub' });
    // An admin can't suspend/delete their own account through this panel —
    // forces that to go through a path with more friction than a dropdown click.
    if ((action === 'suspend' || action === 'delete') && sub === claims.sub) {
      return resp(400, { error: 'You can’t suspend or delete your own account from here.' });
    }
    const requiredGroup = ACTION_PERMISSION[action];
    if (requiredGroup && !hasPermission(groups, requiredGroup)) {
      return resp(403, { error: `You don't have permission to do that. Ask a full admin to grant it from the Team tab.` });
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

// The `admin` cohort + each member's fine-grained permission groups —
// powers the Team tab's tickbox table.
async function listTeam() {
  const members = [];
  let token;
  do {
    const r = await cog.send(new ListUsersInGroupCommand({ UserPoolId: POOL, GroupName: 'admin', Limit: 60, NextToken: token }));
    for (const u of r.Users || []) {
      const attrs = Object.fromEntries((u.Attributes || []).map(a => [a.Name, a.Value]));
      const g = await cog.send(new AdminListGroupsForUserCommand({ UserPoolId: POOL, Username: u.Username }));
      const memberGroups = (g.Groups || []).map(x => x.GroupName);
      members.push({
        sub: attrs.sub, email: attrs.email || '', name: attrs.name || '',
        permissions: PERMISSION_GROUPS.filter(pg => memberGroups.includes(pg)),
        migrated: PERMISSION_GROUPS.some(pg => memberGroups.includes(pg)),
      });
    }
    token = r.NextToken;
  } while (token && members.length < 500);
  return members;
}

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
