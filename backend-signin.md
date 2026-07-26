# Veridian Markets — Sign-in Backend (AWS Cognito)

> Branch: `backend-signin-AWS-1.1` · A teaching + implementation guide for replacing
> the placeholder client-side auth with **real AWS Cognito** sign-in.
> Companion to [`backend.md`](backend.md).

---

## 0. TL;DR — the plan in six lines

1. Create an **Amazon Cognito User Pool** (a hosted user directory) in the AWS console.
2. Add a **public App Client** (no client secret — a browser can't keep a secret).
3. Enable the **`ALLOW_USER_PASSWORD_AUTH`** + **`ALLOW_REFRESH_TOKEN_AUTH`** flows.
4. From the browser, call Cognito's REST API with `fetch` (no SDK, no build step) to
   **sign up → confirm email → sign in → refresh → sign out**.
5. Cognito returns three **JWTs** (ID, Access, Refresh). Store them; treat the **ID
   token's claims** as "the user"; send the **Access token** to your APIs.
6. Protect API Gateway / Lambda with a **Cognito Authorizer** so the backend trusts
   those tokens.

**Cost:** Cognito's free tier is **50,000 monthly active users**. At startup scale this
is effectively **$0** — exactly the low-cost footing you want.

---

## 1. Concepts you need (and only these)

| Term | What it is |
|---|---|
| **User Pool** | A managed directory of your users (email, password, attributes, verification, MFA). This *is* your sign-in database — you don't build one. |
| **App Client** | A registered "app" that's allowed to talk to the pool. For a browser SPA it's a **public client** with **no secret**. |
| **Auth flow** | *How* a client authenticates. We use **`USER_PASSWORD_AUTH`** (send username+password over TLS — simplest, no SDK). The more secure `USER_SRP_AUTH` needs the Amplify SDK's crypto, which fights our no-build setup. |
| **JWTs** | On success Cognito returns three JSON Web Tokens: **ID token** (who the user is — claims like email, `sub`, `cognito:groups`), **Access token** (authorises API calls), **Refresh token** (gets new ID/Access tokens without re-login, valid ~30 days). |
| **Cognito Authorizer** | An API Gateway feature that validates an incoming JWT for you, so your Lambda never sees an unauthenticated request. |

**Why direct REST calls (not Amplify SDK)?** This app is CDN-React + in-browser Babel
with **no bundler** and static hosting (GitHub Pages). The Amplify SDK really wants a
build step. Cognito's plain REST endpoint works from any browser with `fetch`, keeps our
editorial [`SignIn.jsx`](ui_kits/web/SignIn.jsx), and adds **zero dependencies**.

**Why no client secret?** Anything shipped to the browser is public. A public SPA client
must be created **without** a secret; if it has one, every request needs a `SECRET_HASH`
you can't compute safely client-side. So: **public client, no secret.**

---

## 2. One-time AWS Console setup

> Region: pick one and keep it (e.g. `eu-west-1`). You'll need the **region**, the
> **User Pool ID**, and the **App Client ID** for the code.

1. **Cognito → Create user pool.**
   - Sign-in option: **Email**.
   - Password policy: your call (default is fine to start).
   - MFA: **Optional** (or Off for v1; can tighten later).
   - Self-service sign-up: **Enabled** (so users can register).
   - Email: use the **Cognito default email sender** for now (limited volume, fine for
     dev). Move to **Amazon SES** before real launch for deliverability.
   - Required attributes: **email**.
2. **Create an App Client** (inside the pool):
   - Type: **Public client**.
   - **Client secret: DO NOT generate one.**
   - **Auth flows:** tick **ALLOW_USER_PASSWORD_AUTH** and **ALLOW_REFRESH_TOKEN_AUTH**.
   - Token expiry: Access/ID ~60 min, Refresh ~30 days (defaults are sensible).
3. **Copy three values** into a config block in the app (see §3):
   `REGION`, `USER_POOL_ID`, `CLIENT_ID`.
4. (Later) **App Integration → domain** only needed if you ever switch to the **Hosted
   UI** (§7). Not required for the REST approach.

Nothing here is secret except your AWS *account* credentials — the pool ID and client ID
are safe to ship in the front-end.

---

## 3. Front-end config

Add a tiny config object (e.g. top of `app.jsx`, or a new `auth.jsx`):

```js
const VM_AUTH = {
  region:   'eu-west-1',                         // your region
  clientId: 'xxxxxxxxxxxxxxxxxxxxxxxxxx',        // App Client ID (public, no secret)
  // Cognito IDP endpoint for the region:
  endpoint: 'https://cognito-idp.eu-west-1.amazonaws.com/',
};

// Low-level call to the Cognito Identity Provider JSON API.
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
  if (!res.ok) throw new Error(data.message || data.__type || 'Auth request failed');
  return data;
}
```

That single helper covers every flow below — each is just a different `action`.

---

## 4. The five flows (drop-in replacements for the placeholder)

Today's placeholder lives in [`app.jsx`](ui_kits/web/app.jsx): `VM_ACCOUNTS`,
`verifyCredentials`, `VM_SESSION_KEY`, `loadSession`, `signIn`, `signOut`. We replace the
*implementations* and keep the *same shapes* so the rest of the app (and `SignIn.jsx`)
barely changes.

### 4.1 Sign up
```js
async function signUp(email, password) {
  await cognito('SignUp', {
    ClientId: VM_AUTH.clientId,
    Username: email,
    Password: password,
    UserAttributes: [{ Name: 'email', Value: email }],
  });
  // Cognito emails a 6-digit code → next step is confirmSignUp.
}
```

### 4.2 Confirm sign-up (email code)
```js
async function confirmSignUp(email, code) {
  await cognito('ConfirmSignUp', {
    ClientId: VM_AUTH.clientId,
    Username: email,
    ConfirmationCode: code,
  });
}
```

### 4.3 Sign in  → replaces `verifyCredentials` + `signIn`
```js
async function signIn(email, password) {           // returns a user object or throws
  const out = await cognito('InitiateAuth', {
    ClientId: VM_AUTH.clientId,
    AuthFlow: 'USER_PASSWORD_AUTH',
    AuthParameters: { USERNAME: email, PASSWORD: password },
  });
  const t = out.AuthenticationResult;               // { IdToken, AccessToken, RefreshToken, ExpiresIn }
  saveTokens(t);
  return userFromIdToken(t.IdToken);                // decode claims → { email, name, role }
}
```

### 4.4 Refresh (silent re-auth on load / near expiry)
```js
async function refreshSession(refreshToken) {
  const out = await cognito('InitiateAuth', {
    ClientId: VM_AUTH.clientId,
    AuthFlow: 'REFRESH_TOKEN_AUTH',
    AuthParameters: { REFRESH_TOKEN: refreshToken },
  });
  return out.AuthenticationResult;                  // new Id/Access tokens (refresh token stays)
}
```

### 4.5 Forgot / reset password
```js
const forgotPassword        = (email)              => cognito('ForgotPassword',        { ClientId: VM_AUTH.clientId, Username: email });
const confirmForgotPassword = (email, code, pass)  => cognito('ConfirmForgotPassword', { ClientId: VM_AUTH.clientId, Username: email, ConfirmationCode: code, Password: pass });
```

### 4.6 Tokens, session, sign-out
```js
const VM_SESSION_KEY = 'vm_session';                // reuse the existing key

function saveTokens(t) {
  localStorage.setItem(VM_SESSION_KEY, JSON.stringify({
    id: t.IdToken, access: t.AccessToken, refresh: t.RefreshToken,
    exp: Date.now() + (t.ExpiresIn || 3600) * 1000,
  }));
}
// Decode a JWT payload (no verification needed client-side — the API verifies).
function userFromIdToken(idToken) {
  const p = JSON.parse(atob(idToken.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
  return { email: p.email, name: p.name || p['cognito:username'] || p.email,
           role: (p['cognito:groups'] || []).includes('admin') ? 'admin' : 'user' };
}
function loadSession() {                            // same name the app already calls
  try {
    const s = JSON.parse(localStorage.getItem(VM_SESSION_KEY));
    return s && s.id ? userFromIdToken(s.id) : null;
  } catch { return null; }
}
function signOut() { localStorage.removeItem(VM_SESSION_KEY); /* + setUser(null); go('front') */ }
```

**Admin role:** create a **Group** named `admin` in the pool and add yourself. The `admin`
membership rides in the ID token's `cognito:groups` claim — so `role: 'admin'` (which the
rail and Admin gate already read) comes straight from Cognito. The hardcoded
`veridianmarkets.ai@gmail.com` admin goes away.

---

## 5. Wiring into the existing app (minimal diff)

In [`app.jsx`](ui_kits/web/app.jsx):
- **Delete** `VM_ACCOUNTS`, `sha256Hex`, `verifyCredentials`.
- **Replace** `signIn` / `signOut` / `loadSession` with the versions above (same names,
  same return shapes → `signedIn`, `user.role`, `redirectTo` all keep working).
- On app mount, if the stored session is **near expiry**, call `refreshSession` once
  before rendering gated pages (keeps "stay logged in" working across refreshes).

In [`SignIn.jsx`](ui_kits/web/SignIn.jsx):
- Keep the editorial layout. Add small states for the **confirm-code** step and a
  **"Create account" / "Forgot password"** toggle that call `signUp` / `confirmSignUp` /
  `forgotPassword`. The `signIn` submit path stays the same (it already returns a
  promise + `redirectTo`).

That's the whole front-end change — no new libraries, no build step.

---

## 6. Protecting the backend (when you add APIs)

Your future Lambdas (you already have a `lambda/` folder from the heatmap) should **not**
trust the client. Two options:
1. **API Gateway → Cognito Authorizer** (recommended): attach the User Pool as an
   authorizer; the client sends `Authorization: Bearer <AccessToken>`; API Gateway
   rejects invalid/expired tokens before your Lambda runs. Almost no code.
2. **Verify in Lambda**: fetch the pool's **JWKS** (`https://cognito-idp.<region>.amazonaws.com/<poolId>/.well-known/jwks.json`),
   verify the JWT signature + `aud`/`iss`/`exp`. More control, more code.

Either way: **front-end attaches the token, backend verifies it.** Never accept a raw
`userId` from the browser as identity.

---

## 7. Alternative: Hosted UI (if you'd rather not build login screens)

Cognito can host the whole login page. You redirect to it (Authorization Code + PKCE),
the user signs in there, and you get redirected back with a code you exchange for tokens.
- **Pro:** zero login UI to build/maintain; social logins (Google/Apple) are a checkbox.
- **Con:** you lose the bespoke editorial `SignIn.jsx` look; needs a Cognito **domain**
  and callback URLs configured.
- **Verdict for us:** we keep our own UI (§4) for brand reasons; revisit Hosted UI only if
  you want Google/Apple sign-in fast.

---

## 8. Security notes (don't skip)

- **Public client, no secret.** ✔ (see §1).
- **HTTPS only** — GitHub Pages + Cognito are both HTTPS; never send creds over HTTP.
- **Token storage tradeoff:** `localStorage` is simple but readable by any XSS. It's fine
  for this stage and matches today's behaviour. The hardened option (httpOnly, SameSite
  cookies) requires a backend to set them — a later upgrade, note it and move on.
- **Migrate the placeholder admin:** once Cognito is live, remove `VM_ACCOUNTS` entirely
  so no credentials ship in client code.
- **Rate limiting / lockout:** Cognito has built-in throttling and adaptive auth (advanced
  security) — enable adaptive auth before launch.
- **Email deliverability:** move from the Cognito default sender to **Amazon SES** before
  real users, or confirmation emails will land in spam / hit send limits.

---

## 9. Suggested build order (this branch)

1. Console: create pool + public app client + `admin` group. Capture `region / poolId /
   clientId`. *(You do this; paste me the three values.)*
2. Add `VM_AUTH` config + `cognito()` helper + the flow functions.
3. Swap `signIn / signOut / loadSession` in `app.jsx`; delete `VM_ACCOUNTS`.
4. Extend `SignIn.jsx` with sign-up + confirm-code + forgot-password steps.
5. Add silent refresh-on-load.
6. Test: register a new email → confirm code → sign in → refresh page (stays in) → sign
   out. Add yourself to `admin`, confirm the Admin tab unlocks.
7. Later (separate branch): API Gateway + Cognito Authorizer for the real data endpoints.

---

## Change log

| Date | Branch | What |
|---|---|---|
| 2026-06-30 | `backend-signin-AWS-1.1` | Initial guide: Cognito user pool + public client + REST (`USER_PASSWORD_AUTH`) integration plan for the no-build static SPA. |
