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
// Body: { action: 'suspend'|'reactivate'|'delete'|'setPlan'|'listTeam'|'setPermissions'
//               |'createInvite'|'listInvites'|'redeemInvite', sub, plan?, group?, grant?, token? }
//
// ── Beta invites (createInvite / listInvites / redeemInvite) ────────────────
// The only actions in this file that DON'T require the `admin` group —
// redeemInvite runs the moment a brand-new signup confirms their real
// Cognito account (BetaSignup.jsx), before they could possibly be an admin.
// It's the real security boundary invite links never had before: a token
// only grants anything if it was actually created here (DynamoDB
// INVITES_TABLE, one row per token) and hasn't already been redeemed —
// completely separate from BetaSignup.jsx's own optimistic client-side
// "any 6+ char token opens the form" check, which just decides whether to
// *show* the signup form, not whether anything real happens. On a valid,
// unused token: marks it used, adds the caller to the `beta` Cognito group,
// and sets their real plan to 'pro' in SUBS_TABLE — "everyone who gets the
// beta gets Pro" is enforced here, once, server-side.
//
// ── Permissions model ─────────────────────────────────────────────────────
// Six extra Cognito groups: three gate mutating actions (`admin-suspend` for
// suspend/reactivate, `admin-delete`, `admin-billing` for setPlan) and three
// gate which Admin tabs even show up client-side (`admin-view-overview`,
// `admin-view-analytics`, `admin-view-courses` — the Users tab has no group,
// it's the floor every admin always sees; the Team tab itself never shows to
// anyone but a full admin). The tab-visibility groups aren't checked by this
// Lambda at all — the frontend reads them straight off the caller's own ID
// token (`user.groups`) to decide what to render; there's no separate real
// user data behind Overview/Analytics/Courses that this Lambda gates, so
// there's nothing further to enforce server-side for those three. An owner
// grants/revokes any of the six per employee from the Team tab
// (`setPermissions`), which itself needs "full admin" — see below.
//
// SAFE ROLLOUT RULE: an admin who has never been assigned ANY of the six
// permission groups is treated as a full admin (today's behavior,
// unrestricted) — restriction only kicks in once an owner has explicitly
// assigned that person at least one of the six groups. This means deploying
// this Lambda/these Cognito groups can never silently lock out every
// existing admin (including the account owner) before anyone's had a chance
// to set the new groups up in the Cognito console.
//
// Env vars: COGNITO_POOL_ID, COGNITO_REGION=us-east-1, SUBS_TABLE=vm-subscriptions,
//           INVITES_TABLE=vm-beta-invites, FEEDBACK_TABLE=vm-feedback
// IAM: cognito-idp:AdminDisableUser, AdminEnableUser, AdminDeleteUser,
//      ListUsersInGroup, AdminListGroupsForUser, AdminAddUserToGroup,
//      AdminRemoveUserFromGroup on the pool ARN
//      (arn:aws:cognito-idp:<region>:<account>:userpool/<poolId>);
//      dynamodb:UpdateItem on SUBS_TABLE;
//      dynamodb:GetItem, PutItem, UpdateItem, Scan on INVITES_TABLE;
//      dynamodb:Scan on FEEDBACK_TABLE.

import crypto from 'node:crypto';
import {
  CognitoIdentityProviderClient, AdminDisableUserCommand, AdminEnableUserCommand, AdminDeleteUserCommand,
  ListUsersInGroupCommand, AdminListGroupsForUserCommand, AdminAddUserToGroupCommand, AdminRemoveUserFromGroupCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient, UpdateItemCommand, PutItemCommand, GetItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';

const cog = new CognitoIdentityProviderClient({});
const db  = new DynamoDBClient({});
const REGION        = process.env.COGNITO_REGION || 'us-east-1';
const POOL          = process.env.COGNITO_POOL_ID;
const ISS           = `https://cognito-idp.${REGION}.amazonaws.com/${POOL}`;
const SUBS_TABLE     = process.env.SUBS_TABLE || 'vm-subscriptions';
const INVITES_TABLE  = process.env.INVITES_TABLE || 'vm-beta-invites';
const FEEDBACK_TABLE = process.env.FEEDBACK_TABLE || 'vm-feedback';
const PLANS      = ['free', 'plus', 'pro', 'business'];

const PERMISSION_GROUPS  = [
  'admin-view-overview', 'admin-view-analytics', 'admin-view-courses',
  'admin-suspend', 'admin-delete', 'admin-billing',
];
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

    const body = JSON.parse(event.body || '{}');
    const { action, sub } = body;

    // The one action any signed-in user (not just admins) can call — see the
    // big comment at the top of the file for why this is the real security
    // boundary for beta invites. Throws (caught below, same as every other
    // validation failure in this file) rather than returning an {ok:false},
    // so an invalid/used token comes back as a proper 4xx like everything else.
    if (action === 'redeemInvite') { await redeemInvite(body.token, claims); return resp(200, { ok: true }); }

    if (!groups.includes('admin')) return resp(403, { error: 'admin only' });

    if (action === 'createInvite') return resp(200, { ok: true, invite: await createInvite() });
    if (action === 'listInvites') return resp(200, { ok: true, invites: await listInvites() });
    if (action === 'listFeedback') return resp(200, { ok: true, feedback: await listFeedback() });

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

// ── Beta invites ─────────────────────────────────────────────────────────────
function randomToken() {
  return crypto.randomBytes(9).toString('base64url'); // 12 chars, URL-safe
}
async function createInvite() {
  const token = randomToken();
  const createdAt = Date.now();
  await db.send(new PutItemCommand({
    TableName: INVITES_TABLE,
    Item: { token: { S: token }, createdAt: { N: String(createdAt) } },
    ConditionExpression: 'attribute_not_exists(#tk)',
    ExpressionAttributeNames: { '#tk': 'token' },
  }));
  return { token, createdAt, usedAt: null, usedBy: null };
}
async function listInvites() {
  const items = [];
  let key;
  do {
    const r = await db.send(new ScanCommand({ TableName: INVITES_TABLE, ExclusiveStartKey: key }));
    items.push(...(r.Items || []));
    key = r.LastEvaluatedKey;
  } while (key && items.length < 2000);
  return items.map(i => ({
    token: i.token?.S, createdAt: i.createdAt ? Number(i.createdAt.N) : null,
    usedAt: i.usedAt ? Number(i.usedAt.N) : null, usedBy: i.usedBy?.S || null,
  })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

// Real feedback submissions (vm-feedback wrote these) — powers the Feedback
// tab. `items` was stored as a JSON string (each item's screenshotUrl is a
// public-but-unguessable S3 URL, not the image itself).
async function listFeedback() {
  const items = [];
  let key;
  do {
    const r = await db.send(new ScanCommand({ TableName: FEEDBACK_TABLE, ExclusiveStartKey: key }));
    items.push(...(r.Items || []));
    key = r.LastEvaluatedKey;
  } while (key && items.length < 2000);
  return items.map(i => ({
    id: i.id?.S, page: i.page?.S || '', route: i.route?.S || '',
    ts: i.ts ? Number(i.ts.N) : null, userEmail: i.userEmail?.S || '', userName: i.userName?.S || '',
    status: i.status?.S || 'new',
    items: (() => { try { return JSON.parse(i.items?.S || '[]'); } catch { return []; } })(),
  })).sort((a, b) => (b.ts || 0) - (a.ts || 0));
}
// The real security boundary for beta signup — see the top-of-file comment.
// Throws on anything invalid; only reaches the bottom (group + plan grant)
// for a token that genuinely exists here and hasn't been redeemed already.
async function redeemInvite(token, claims) {
  if (!token) throw new Error('Missing invite token.');
  const r = await db.send(new GetItemCommand({ TableName: INVITES_TABLE, Key: { token: { S: token } } }));
  if (!r.Item) throw new Error('This invite link isn’t valid.');
  if (r.Item.usedAt) throw new Error('This invite link has already been used.');

  await db.send(new UpdateItemCommand({
    TableName: INVITES_TABLE, Key: { token: { S: token } },
    UpdateExpression: 'SET usedAt = :t, usedBy = :e',
    ConditionExpression: 'attribute_not_exists(usedAt)',   // race guard: two redemptions can't both win
    ExpressionAttributeValues: { ':t': { N: String(Date.now()) }, ':e': { S: claims.email || claims.sub } },
  }));

  await cog.send(new AdminAddUserToGroupCommand({ UserPoolId: POOL, Username: claims.sub, GroupName: 'beta' }));
  await db.send(new UpdateItemCommand({
    TableName: SUBS_TABLE, Key: { sub: { S: claims.sub } },
    UpdateExpression: 'SET #pl = :p',
    ExpressionAttributeNames: { '#pl': 'plan' },
    ExpressionAttributeValues: { ':p': { S: 'pro' } },
  }));
}

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
