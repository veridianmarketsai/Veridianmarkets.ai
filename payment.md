# Veridian Markets — Payments & Paywall (Stripe)

> Branch: `payments-1.1` · How the paywall works today (mock) and how to make it
> real with **Stripe**. Companion to [`backend-signin.md`](backend-signin.md) and
> [`backend.md`](backend.md).

---

## ✅ Live status (as of 2026-06-30, Stripe **test/sandbox**)

The **pay → unlock loop is real and working end to end**:

- **Buy:** Stripe **Payment Links** (Plus £9 / Pro £19) from the paywall + Settings,
  tagged with the Cognito `sub` (`vmStartCheckout` in [`billing.jsx`](ui_kits/web/billing.jsx)).
- **Record:** `vm-billing-webhook` Lambda (Function URL) → verifies the Stripe
  signature → writes the plan to DynamoDB `vm-subscriptions`. **200 OK.**
- **Read:** `vm-billing-status` Lambda (Function URL + CORS) → verifies the Cognito
  JWT → returns the plan. The app fetches it on load (`vmFetchPlan`) and reflects it
  in the paywall locks + Settings.

**Deferred (do before real/live launch):**
- **`vm-billing-portal`** (Customer Portal) — self-serve **cancel / switch plan**.
  Skipping it for now; the admin manages subscriptions in the Stripe dashboard.
  Needed before real customers (easy-cancel UX/compliance). Wire it to the Settings
  **"Manage subscription"** / **Edit** button.
- **`vm-billing-checkout`** Lambda — reuse **one** Stripe customer per user, so
  upgrades modify the existing subscription instead of Payment Links creating
  **duplicate subscriptions** (a real gotcha seen in testing).
- Move Stripe from **test** to **live** keys; complete account activation
  ("Managed payments: needs info"); switch email to **SES**.
- Store `plan` as a Cognito **`custom:plan`** claim (optional) so gating needs no
  extra call; tighten IAM from `AmazonDynamoDBFullAccess` to the single table.

---

## 1. What exists today (mock)

The paywall is built and working, backed by a **client-side mock plan** — no money
moves yet:

- **Gated rail items:** `News`, `Calendar`, `Dependency map` (`GATED_ROUTES` in
  [`app.jsx`](ui_kits/web/app.jsx)). Non-payers see a **🔒 lock** and are routed to
  the **/upgrade** page instead of the feature.
- **Plan state:** `plan` in `app.jsx`, persisted to `localStorage` (`vm_plan`).
  `isPaying = signedIn && plan !== 'free'`. Everyone starts **Free**.
- **Upgrade page:** [`Pricing.jsx`](ui_kits/web/Pricing.jsx) — Free / Plus ($9) /
  Pro ($19) tiers. Clicking *Upgrade* calls `onUpgrade(planId)` which just flips the
  mock plan and returns you to the page you were blocked from.

**The seam:** everything routes through `plan` (source of truth = `localStorage`) and
`onUpgrade` (the "purchase"). Stripe replaces exactly those two things:
- `plan` ← comes from the **backend** (Stripe is the real source of truth), not
  `localStorage`.
- `onUpgrade` ← redirects to **Stripe Checkout** instead of flipping a flag.

Nothing else in the gating logic changes.

---

### Interim (no backend yet): Stripe Payment Links

To take real Stripe payments *before* the Lambdas exist, the Upgrade buttons use
**Payment Links** (dashboard-created checkout URLs), configured in
`VM_BILLING.paymentLinks` in [`Pricing.jsx`](ui_kits/web/Pricing.jsx):
- Plus → `https://buy.stripe.com/test_7sY7sK51z9i63dt7gw43S01`
- Pro  → `https://buy.stripe.com/test_cNi6oG3Xv1PE8xNasI43S00`

The button appends `client_reference_id` (Cognito `sub`) + `prefilled_email` so the
webhook can later match the payment to the account. **Caveat:** a payment succeeds
but does **not** unlock the plan yet — entitlement still needs the **webhook Lambda**
(§5.2). Until then the plan flip stays mock. When the backend is live, set
`VM_BILLING.apiBase` and the code prefers the full Checkout flow over the link.

## 2. The one hard rule about Stripe

**You cannot do subscription billing from the browser alone.** Creating a
subscription, a checkout session, or verifying a payment all require your Stripe
**secret key**, which must never ship to the browser. So Stripe needs a **backend** —
which you already have the pattern for (AWS Lambda + API Gateway, like the heatmap).

The good news: with the **Stripe Checkout** approach, the browser never handles card
details at all — it just **redirects to a Stripe-hosted page**. That means:
- **No `stripe.js` in the browser, no build step needed** — a plain redirect.
- **PCI compliance is Stripe's problem**, not yours.
- Perfect fit for a static GitHub Pages SPA.

---

## 3. Recommended architecture — Checkout + Portal + Webhooks

```
Browser (static SPA)          AWS (Lambda + API GW)              Stripe
────────────────────          ─────────────────────              ──────
Pricing.jsx "Upgrade"
   │ POST /billing/checkout  (+ Cognito JWT)
   ▼
                              Lambda: create Checkout Session
                              (secret key, price_id, customer) ──► Stripe
   ◄───────────────── returns session.url ─────────────────────
window.location = url  ──────────────────────────────────────►  Stripe-hosted
                                                                 card page
                              Lambda: /billing/webhook  ◄──────  events
                              (verify signature)                 (subscription.*)
                              → write plan to DynamoDB
                                (source of truth)
   Manage/cancel:
   POST /billing/portal ────► Lambda: create Portal Session ───► Stripe portal
```

Three moving parts:
1. **Checkout** (buy a plan) — Stripe-hosted payment page.
2. **Customer Portal** (change/cancel/update card) — Stripe-hosted, zero UI to build.
3. **Webhooks** — Stripe tells your backend when a subscription starts/changes/ends.
   **This is the source of truth for who's paying** — never trust the client.

---

## 4. Stripe Dashboard — one-time setup

All doable in **test mode** first (free, use test cards).

1. Create a Stripe account → **Developers → API keys**. Note:
   - **Publishable key** `pk_test_…` (safe in browser; only needed if you ever embed
     Stripe.js — not required for pure Checkout redirect).
   - **Secret key** `sk_test_…` → **backend only** (Lambda env var).
2. **Products → Add product:** ✅ done (Sandbox / test mode, **GBP**):
   - *Plus* → £9/mo → **Price ID** `price_1TsTEtBCOL2lO2oBgCSaXuen`
   - *Pro*  → £19/mo → **Price ID** `price_1TsTF8BCOL2lO2oBmh8hJb2b`
   - These are already set in the frontend `VM_BILLING.prices` in
     [`Pricing.jsx`](ui_kits/web/Pricing.jsx), and go in the checkout Lambda's
     `PRICE_PLUS` / `PRICE_PRO` env vars.
3. **Settings → Billing → Customer portal** → enable it (lets users cancel/switch).
4. **Developers → Webhooks → Add endpoint:**
   - URL = your API Gateway webhook URL (e.g. `https://api.veridianmarkets.ai/billing/webhook`).
   - Events: `checkout.session.completed`, `customer.subscription.updated`,
     `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`.
   - Copy the **Signing secret** `whsec_…` → Lambda env var.

**Secrets that live only in Lambda env vars:** `STRIPE_SECRET_KEY`,
`STRIPE_WEBHOOK_SECRET`, plus the two `PRICE_…` IDs.

---

## 5. Backend — three Lambdas (Node ESM, `stripe` package)

Mirror your existing `lambda/` structure. All use `import Stripe from 'stripe'`.

### 5.1 Create Checkout Session — `POST /billing/checkout` (Cognito-authorized)
```js
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const PRICES = { plus: process.env.PRICE_PLUS, pro: process.env.PRICE_PRO };

export const handler = async (event) => {
  const claims = event.requestContext.authorizer.jwt.claims;   // from Cognito authorizer
  const sub = claims.sub, email = claims.email;
  const { plan } = JSON.parse(event.body);                     // 'plus' | 'pro'

  const customerId = await getOrCreateCustomer(sub, email);    // stored in DynamoDB
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: PRICES[plan], quantity: 1 }],
    success_url: 'https://veridianmarkets.ai/upgrade?status=success',
    cancel_url:  'https://veridianmarkets.ai/upgrade?status=cancel',
    client_reference_id: sub,
  });
  return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
};
```

### 5.2 Webhook — `POST /billing/webhook` (NO auth, verify signature)
```js
export const handler = async (event) => {
  const sig = event.headers['stripe-signature'];
  const raw = event.isBase64Encoded ? Buffer.from(event.body, 'base64') : event.body;
  let evt;
  try { evt = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET); }
  catch (e) { return { statusCode: 400, body: `Bad signature: ${e.message}` }; }

  if (evt.type === 'checkout.session.completed' ||
      evt.type === 'customer.subscription.updated' ||
      evt.type === 'customer.subscription.deleted') {
    const sub = evt.data.object;
    const plan   = evt.type === 'customer.subscription.deleted' ? 'free' : planFromPriceId(sub.items?.data?.[0]?.price?.id);
    const status = sub.status;                          // active | canceled | past_due …
    await savePlan(sub.customer, { plan, status });     // write to DynamoDB (source of truth)
  }
  return { statusCode: 200, body: '{}' };
};
```
> ⚠️ API Gateway must pass the **raw body** to the webhook (needed for signature
> verification). Use Lambda proxy integration and decode `isBase64Encoded`.

### 5.3 Customer Portal — `POST /billing/portal` (Cognito-authorized)
```js
const customerId = await getCustomer(claims.sub);
const portal = await stripe.billing.portal.sessions.create({
  customer: customerId,
  return_url: 'https://veridianmarkets.ai/settings',
});
return { statusCode: 200, body: JSON.stringify({ url: portal.url }) };
```

### 5.4 Read current plan — `GET /billing/status` (Cognito-authorized)
Returns `{ plan, status }` from DynamoDB so the app can gate. (Alternative: mirror
plan into a Cognito **`custom:plan`** attribute via `AdminUpdateUserAttributes` in the
webhook, so it rides in the ID token — no extra call, but only refreshes on token
refresh. DynamoDB + a status call is simpler and instant.)

---

## 6. Data model (DynamoDB)

Table `vm-subscriptions` (or add to your existing user table):

| Field | Example | Notes |
|---|---|---|
| `sub` (PK) | Cognito user `sub` | ties Stripe ↔ your user |
| `stripeCustomerId` | `cus_…` | created on first checkout |
| `plan` | `plus` | `free` \| `plus` \| `pro` |
| `status` | `active` | `active` \| `past_due` \| `canceled` |
| `subscriptionId` | `sub_…` | current subscription |
| `currentPeriodEnd` | epoch | for "renews on…" display |

---

## 7. Frontend changes (replace the mock)

Small, localized — the gating stays as-is.

- **[`Pricing.jsx`](ui_kits/web/Pricing.jsx) `choose(id)`** → instead of `onUpgrade`,
  call the backend and redirect:
  ```js
  const res = await fetch(`${API}/billing/checkout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan: id }),
  });
  const { url } = await res.json();
  window.location.href = url;                 // → Stripe Checkout
  ```
- **Return handling:** `success_url` lands back on `/upgrade?status=success`. On load,
  call `GET /billing/status` (poll a couple times — the webhook may land a second
  after redirect) and set `plan`. Show a "Welcome to Plus" confirmation.
- **`app.jsx` `plan`** → seed from `GET /billing/status` (or `custom:plan` claim)
  instead of `localStorage`. `isPaying` / `GATED_ROUTES` logic is unchanged.
- **Settings → "Manage subscription"** → `POST /billing/portal`, then
  `window.location = url`. This gives cancel / switch / update-card for free.

Access token comes from the Cognito session (`vm_session.access` — see
[`auth.jsx`](ui_kits/web/auth.jsx)).

---

## 8. Security & correctness

- **Secret key + webhook secret live only in Lambda env vars.** Never in the repo or
  browser.
- **Entitlement is decided by the webhook → DynamoDB**, not the client. The
  `?status=success` redirect is just UX; a user can't self-grant Plus by faking it.
- **Verify webhook signatures** (`constructEvent`) and use the **raw** body.
- **Idempotency:** webhooks can arrive more than once — writes should be idempotent
  (upsert by `sub`/`subscriptionId`).
- **Protect the checkout/portal/status endpoints** with the API Gateway **Cognito
  authorizer** (from `backend-signin.md` §6) so only signed-in users can call them.

---

## 9. Cost

- **Stripe:** no monthly fee — pay-as-you-go per charge (typically **2.9% + 30¢** per
  successful transaction; verify current rates for your country). Test mode is free.
- **AWS:** three tiny Lambdas + a DynamoDB table sit inside the free tier at startup
  scale.

So fixed cost is ~**$0** until you're actually taking payments — aligned with the
low-startup-cost goal.

---

## 10. Test cards (test mode)

- Success: `4242 4242 4242 4242`, any future expiry, any CVC/ZIP.
- Requires authentication (3DS): `4000 0025 0000 3155`.
- Declined: `4000 0000 0000 0002`.

Use the **Stripe CLI** (`stripe listen --forward-to <url>`) to replay webhooks locally
while developing.

---

## 11. Build order

1. Stripe Dashboard: account → 2 products/prices → portal → webhook endpoint. Capture
   `sk_test`, `whsec`, `PRICE_PLUS`, `PRICE_PRO`. *(You do this; paste me the price IDs
   + API base URL.)*
2. DynamoDB table `vm-subscriptions`.
3. Lambdas: `checkout`, `portal`, `webhook`, `status` behind API Gateway + Cognito
   authorizer. Add env vars.
4. Frontend: swap `Pricing.choose` → checkout redirect; seed `plan` from
   `/billing/status`; add "Manage subscription" to Settings.
5. Test end-to-end with `4242…` in test mode → confirm the webhook flips the plan and
   the locks lift.
6. Switch to **live keys**, re-create the webhook endpoint for live, go live.

---

## Change log

| Date | Branch | What |
|---|---|---|
| 2026-06-30 | `payments-1.1` | Paywall shipped (mock plan): gate News/Calendar/Dependency map → `Pricing.jsx` upgrade page. This doc: Stripe (Checkout + Portal + Webhooks) integration plan for the no-build static SPA + AWS backend. |
