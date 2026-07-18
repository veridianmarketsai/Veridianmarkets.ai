// Veridian Markets — real authentication via AWS Cognito.
//
// Called DIRECTLY from the browser against the Cognito Identity Provider REST API
// (no Amplify SDK, no build step — fits our CDN-React + in-browser-Babel setup).
// The app client is PUBLIC (no client secret), so no SECRET_HASH is needed.
// See backend-signin.md for the full guide + AWS console setup.
//
// Tokens (ID / Access / Refresh JWTs) are stored in localStorage under
// `vm_session`. The app treats the ID token's claims as "the user"; it never
// verifies tokens itself — the backend (API Gateway Cognito authorizer) does.

const VM_AUTH = {
  region:   'us-east-1',                       // Cognito user pool region
  poolId:   'us-east-1_FusGT8Ntu',             // User Pool ID
  clientId: '7idj7ncoa195pgqiaqs7376k8d',      // Public App Client ID (NO secret)
  endpoint: 'https://cognito-idp.us-east-1.amazonaws.com/',
  sessionKey: 'vm_session',
};

// Low-level call to the Cognito IdP JSON API. `action` is e.g. 'InitiateAuth'.
async function cognito(action, body) {
  const res = await fetch(VM_AUTH.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': `AWSCognitoIdentityProviderService.${action}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(cognitoMessage(data));
    err.code = (data.__type || '').split('#').pop();   // e.g. 'NotAuthorizedException'
    throw err;
  }
  return data;
}

// Turn Cognito's terse error types into friendly, editorial-voiced messages.
function cognitoMessage(data) {
  const type = (data.__type || '').split('#').pop();
  const map = {
    NotAuthorizedException:      'Incorrect email or password.',
    UserNotFoundException:       'No account found for that email.',
    UserNotConfirmedException:   'Please confirm your email first — check your inbox for the code.',
    UsernameExistsException:     'An account with that email already exists.',
    CodeMismatchException:       'That code isn’t right — check it and try again.',
    ExpiredCodeException:        'That code has expired — request a new one.',
    InvalidPasswordException:    'Password must be 8+ characters with upper, lower, a number and a symbol.',
    InvalidParameterException:   data.message || 'Please check the details and try again.',
    LimitExceededException:      'Too many attempts — please wait a moment and retry.',
    TooManyRequestsException:    'Too many attempts — please wait a moment and retry.',
    CodeDeliveryFailureException:'We couldn’t send the verification email — try again shortly.',
  };
  return map[type] || data.message || 'Something went wrong. Please try again.';
}

// ── token / session helpers ─────────────────────────────────────────────────
// Decode a JWT payload (UTF-8 safe). No signature check — the backend verifies.
function vmDecodeJwt(token) {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch { return {}; }
}
// The user object the rest of the app consumes: { email, name, role, sub }.
function vmUserFromClaims(idToken) {
  const p = vmDecodeJwt(idToken);
  const groups = p['cognito:groups'] || [];
  return {
    email: p.email || p['cognito:username'] || '',
    name:  p.name || p.given_name || (p.email ? p.email.split('@')[0] : 'Member'),
    role:  groups.includes('admin') ? 'admin' : 'user',   // admin = Cognito group membership
    sub:   p.sub,
  };
}
function vmSaveSession(authResult, prev) {
  const s = {
    id:      authResult.IdToken,
    access:  authResult.AccessToken,
    // REFRESH_TOKEN_AUTH doesn't return a new refresh token — keep the old one.
    refresh: authResult.RefreshToken || (prev && prev.refresh),
    exp:     Date.now() + (authResult.ExpiresIn || 3600) * 1000,
  };
  try { localStorage.setItem(VM_AUTH.sessionKey, JSON.stringify(s)); } catch {}
  return s;
}
function vmGetSession() { try { return JSON.parse(localStorage.getItem(VM_AUTH.sessionKey)); } catch { return null; } }
function vmClearSession() { try { localStorage.removeItem(VM_AUTH.sessionKey); } catch {} }
// Synchronous read of the stored session → user or null (used to seed app state).
function vmLoadUser() { const s = vmGetSession(); return s && s.id ? vmUserFromClaims(s.id) : null; }

// ── flows ───────────────────────────────────────────────────────────────────
// Register: Cognito emails a 6-digit confirmation code → then vmConfirmSignUp.
async function vmSignUp(email, password) {
  await cognito('SignUp', {
    ClientId: VM_AUTH.clientId,
    Username: email,
    Password: password,
    UserAttributes: [{ Name: 'email', Value: email }],
  });
}
async function vmConfirmSignUp(email, code) {
  await cognito('ConfirmSignUp', { ClientId: VM_AUTH.clientId, Username: email, ConfirmationCode: code });
}
async function vmResendCode(email) {
  await cognito('ResendConfirmationCode', { ClientId: VM_AUTH.clientId, Username: email });
}
// Sign in → returns the user object, or throws (with .code) on failure.
async function vmSignIn(email, password) {
  const out = await cognito('InitiateAuth', {
    ClientId: VM_AUTH.clientId,
    AuthFlow: 'USER_PASSWORD_AUTH',
    AuthParameters: { USERNAME: email, PASSWORD: password },
  });
  if (out.ChallengeName) {                     // e.g. admin-created user in FORCE_CHANGE_PASSWORD
    const e = new Error('This account needs a new password. Use “Forgot password” to set one.');
    e.code = out.ChallengeName;
    throw e;
  }
  const s = vmSaveSession(out.AuthenticationResult);
  return vmUserFromClaims(s.id);
}
async function vmForgotPassword(email) {
  await cognito('ForgotPassword', { ClientId: VM_AUTH.clientId, Username: email });
}
async function vmConfirmForgotPassword(email, code, password) {
  await cognito('ConfirmForgotPassword', { ClientId: VM_AUTH.clientId, Username: email, ConfirmationCode: code, Password: password });
}
// Silent re-auth using the refresh token (extends the session without re-login).
async function vmRefresh() {
  const s = vmGetSession();
  if (!s || !s.refresh) return null;
  try {
    const out = await cognito('InitiateAuth', {
      ClientId: VM_AUTH.clientId,
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      AuthParameters: { REFRESH_TOKEN: s.refresh },
    });
    const ns = vmSaveSession(out.AuthenticationResult, s);
    return vmUserFromClaims(ns.id);
  } catch { vmClearSession(); return null; }   // refresh expired → force re-login
}
// Called on app load: refresh if the ID token is within 5 min of expiry.
async function vmEnsureFreshSession() {
  const s = vmGetSession();
  if (!s) return null;
  if (Date.now() > s.exp - 5 * 60 * 1000) return await vmRefresh();
  return vmUserFromClaims(s.id);
}

// ── self-service profile edits (Settings → Personal details) ────────────────
// `cognitoMessage()`'s NotAuthorizedException wording ("Incorrect email or
// password") is written for the sign-in form — wrong here, where it actually
// means the access token expired mid-session. Re-map it for these calls.
async function vmSelfService(promise) {
  try { return await promise; }
  catch (e) {
    if (e.code === 'NotAuthorizedException') throw new Error('Your session has expired — please sign in again.');
    throw e;
  }
}
// Update non-contact attributes (e.g. `name`) — takes effect immediately, no
// verification step. `attrs` is a plain { AttributeName: value } map.
async function vmUpdateAttributes(attrs) {
  const s = vmGetSession();
  if (!s || !s.access) throw new Error('Not signed in.');
  await vmSelfService(cognito('UpdateUserAttributes', {
    AccessToken: s.access,
    UserAttributes: Object.entries(attrs).map(([Name, Value]) => ({ Name, Value })),
  }));
}
// Email is a verified-contact attribute: Cognito accepts the new value right
// away but marks it unverified until the user confirms a code sent to it.
async function vmRequestEmailChange(newEmail) {
  await vmUpdateAttributes({ email: newEmail });
  const s = vmGetSession();
  await vmSelfService(cognito('GetUserAttributeVerificationCode', { AccessToken: s.access, AttributeName: 'email' }));
}
async function vmResendEmailCode() {
  const s = vmGetSession();
  if (!s || !s.access) throw new Error('Not signed in.');
  await vmSelfService(cognito('GetUserAttributeVerificationCode', { AccessToken: s.access, AttributeName: 'email' }));
}
async function vmConfirmEmailChange(code) {
  const s = vmGetSession();
  if (!s || !s.access) throw new Error('Not signed in.');
  await vmSelfService(cognito('VerifyUserAttribute', { AccessToken: s.access, AttributeName: 'email', Code: code }));
}

Object.assign(window, {
  VM_AUTH, cognito,
  vmSignUp, vmConfirmSignUp, vmResendCode, vmSignIn,
  vmForgotPassword, vmConfirmForgotPassword,
  vmRefresh, vmEnsureFreshSession,
  vmLoadUser, vmClearSession, vmUserFromClaims,
  vmUpdateAttributes, vmRequestEmailChange, vmResendEmailCode, vmConfirmEmailChange,
});
