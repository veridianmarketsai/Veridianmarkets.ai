# CLAUDE Memory — Veridian Markets working conventions

> Collaboration conventions for this repo (section identifiers, the Toolbar Menu,
> branch/iteration rules). This is the source of truth Claude should consult for
> UI and structural work.
>
> ⚠️ Filename note: this is `CLAUDEMemory.md`, **not** the special `CLAUDE.md`
> that Claude Code loads automatically. So it is **not** auto-loaded — Claude
> reads it on request / at the start of UI work. (Say the word if you'd like a
> one-line `CLAUDE.md` pointer added so it loads every session.)

---

## Source of truth & product status

- **Live product = the React app in [`ui_kits/web/`](ui_kits/web/).** All edits go
  there. The original archive (`scraps/`, `uploads/`, and the
  `Veridian Memoir UI Kit (preview).html`) was **deleted 2026-06-01**. What remains
  outside `ui_kits/web/`: `preview/` (design-system component pages, served at
  `/preview/`) and `data_exports/` (generated CSVs).
- **veridianmarkets.ai is the real product** (not a throwaway demo). Today it's a
  CDN-React + in-browser-Babel prototype; expect a move to a real build (e.g.
  Vite) as foundations progress — write code with production in mind.
- **Brand name = "Veridian Markets"** (was "Veridian Memoir"). "Memoir" survives
  only as the **Read memoir / Memoir Page** feature, not the brand.
- **Data & backend:** real data from **external APIs**; backend on **AWS** (incl.
  auth for Sign in / My portfolio). Keep data behind a clean seam (`data.jsx`) so
  mock data can be swapped for live calls. See [`README.md`](README.md).

---

## Toolbar Menu

**"Toolbar Menu"** = the left navigation rail (`Rail` in
[`ui_kits/web/chrome.jsx`](ui_kits/web/chrome.jsx)). Anything added to that rail
belongs to the Toolbar Menu.

### Section registry — current state *(as of 2026-05-30 11:18)*

| Visible label                  | Section (identifier) | Route      | Notes |
|--------------------------------|----------------------|------------|-------|
| *logo — "Veridian Markets"*    | **Home Page**        | `front`    | The top-left wordmark **is** the Home button. There is no "Front page" text item. |
| Sign in                        | **Sign in Page**     | `signin`   | Chromeless page (`SignIn.jsx`): green header + footer + centered card, **no rail/ticker**, **five modes** (sign in / sign up / confirm code / forgot / reset). **Real AWS Cognito auth** now (`auth.jsx` — `backend-signin-AWS-1.1`, merged): pool `us-east-1_FusGT8Ntu`, public app client, `USER_PASSWORD_AUTH` via REST (no SDK); tokens in `localStorage` (`vm_session`); admin = Cognito `admin` group. See `backend-signin.md`. |
| *(paywall target)*             | **Pricing / Upgrade**| `upgrade`  | `Pricing.jsx` (route `/upgrade`). Non-payers hitting a gated item (News/Calendar/Dependency map) land here. Free/Plus/Pro/Business tiers → **real Stripe** checkout (`billing.jsx`). Gating + `plan` in `app.jsx` (`GATED_ROUTES`, `isPaying`, `vmFetchPlan`). See `payment.md` (`payments-1.1`, merged). |
| My Business *(business mode)*  | **My Business Page** | `mybusiness` | **NEW (`business-page-2.8`, merged to main + live).** Signed-in-only **dependency-map builder** (`MyBusiness.jsx`): the firm at the centre, draggable supplier/external/customer nodes with live curved connectors, a right-hand editor panel (name/ticker/role/note/type + delete), add/clear/reset, **Save** to `localStorage` (`vm_business_map`). Reached via the rail **Personal ⇄ Business** toggle (top of rail) or the **My Business** rail item, which show per `accountMode` (persisted). Mobile = list editor fallback. Mock until backend. |
| My portfolio                   | **My Portfolio Page**| `myportfolio` | Gated (`signedIn` from `localStorage`). Now a **customisable widget dashboard** (`MyPortfolio.jsx`): Connect-accounts bar (Trading 212 + IBKR/Robinhood/Coinbase/Vanguard/Binance, mock connect), then Summary KPIs, Performance area chart (range toggles), Allocation donut, Holdings table, Watchlist, Analogue alerts. **Customise mode** = show/hide + reorder + resize widgets; layout & connections persist to `localStorage`. Mock data. |
| Supply chain network           | **SCN Page**         | `supply`   | Now the **interactive dependency map** (`ScnLiveDemo.jsx`): principle centre node, inputs/external left, customers right, curved SVG connectors, hover tooltips, click-to-drill + breadcrumb, All/Companies/External filters (5Y Lens = placeholder). Carries the **"• Live Demo"** badge. Old `SupplyChain.jsx` is **retired** (file kept, unreferenced). **Merged to main + live** (2026-05-30 18:59) via `scn-live-demo-1.6`; still WIP (breadcrumbs + company-page entry points to come). |
| Search                         | **Main Search Page** | `screener` | Renamed from "Company search". Rows hover/pop-out + eye-preview exactly like the home list; filter chips are now dropdowns (`FILTER_DEFS` mock → DB later) with add/remove + Clear all. |
| News                           | **News Page**        | `news`     | "Global News" editorial feed (`News.jsx`): search button, category pills, featured lead + article-card grid; clicking a story opens an **article overlay** (`ArticleModal`). Reused on the home page ("Global News" tiles + "See more") and the company dashboard **News tab**. Mock data. |
| Calendar                       | **Calendar Page**    | `calendar` | Economic/events calendar (`Calendar.jsx`): month grid with type-coded event dots, type filter, selected-day panel. Opened from the home Mini-calendar's external-link box. Mock events. |
| History                        | **History Page**     | `history`  | Now a **search / "ask" hub** (`History.jsx`): hint pill, big "Search." title, search bar (submit is a scaffold — no backend), and clickable example **Prompts**. Replaced the old analogue-engine layout (analogue data still in `data.jsx`). |
| Learn                          | **Learn VM**         | `learn`    | Course/guide catalogue (`Learn.jsx`): guided-path banner, search, category pills + Level/Format filters, responsive card grid with Show-more. "App tutorial" cards `go()` into screens. Content is mock scaffold data (inline). |
| Read memoir                    | **Memoir Page**      | `memoir`   | |
| Settings *(signed-in only)*    | **Account Settings** | `settings` | Grouped settings list (Instagram "Settings and activity" pattern, VM editorial style) in `AccountSettings.jsx`: profile summary + sections (Your account / How you use Veridian / Privacy & data / Support / danger), each row drilling into its own sub-page (internal state, back arrow). Rail item shows only when `signedIn`. Mock/scaffold. |
| Admin *(admins only)*          | **Admin Page**       | `admin`    | Role-gated control panel (`AdminPanel.jsx`); rail item shows only for `role:'admin'`. Tabs: **Overview** (user-metrics dashboard), **Users** (100-user temp DB w/ ⋮ row menu → details modal, personal profits, simulated "access account" banner, mock actions), **Courses** (add/remove Learn courses via the course store). Temp data: `admin_data.jsx` (users) + `vm*Course` store in `Learn.jsx`. All mock until the real backend. |

Routes map to screens in [`ui_kits/web/app.jsx`](ui_kits/web/app.jsx); labels live
in `RAIL_GROUPS` in `chrome.jsx`. Items with no route are non-clickable
placeholders until their page exists.

---

## Change log

### 2026-07-18 — `personal.settings.1.2` continued: Learning, toggles, real 2FA.

User picked 3 of the "bigger, new integrations" list (explicitly skipped SMS
2FA and broker connections — both need real outside setup, not code):
Learning progress, Notifications/Privacy/Data-permissions toggles, and a
**full-loop** real authenticator-app 2FA (their words: "do the full loop, but
I want the customer to have the option to use it if they want it" — i.e. real
Cognito TOTP, opt-in per account via `SetUserMFAPreference`, not pool-wide).

- **Learning progress — real, not hardcoded.** There was no persisted
  progress at all (the lesson viewer's progress bar was session-only, purely
  positional). Added real tracking in `Learn.jsx`: `vmSaveLearnProgress`
  records `{title, pct, ts}` per course to `vm_learn_progress` every time
  `LessonViewer` renders a lesson; `vmLatestLearnProgress()` picks the
  most-recently-touched one. Settings → Learning now shows that (or "You
  haven't started a course yet." if none).
- **Notifications / Privacy / Data permissions toggles now persist.**
  `StToggle` gained an optional `id` prop — when given, reads/writes a
  consolidated `vm_toggles` localStorage map instead of resetting to its
  default every remount; omitted (kept on the 2 purely cosmetic Appearance
  toggles) it keeps the old ephemeral behavior. Added ids to all 15
  Notifications/Privacy/Permissions toggles.
- **Authenticator-app 2FA — real Cognito TOTP, full loop.** New auth.jsx calls:
  `vmAssociateSoftwareToken` (registers a real secret), `vmVerifySoftwareToken`
  (checks a live code), `vmSetSoftwareMfaPreference` (the actual on/off
  switch — per-account opt-in, not pool-wide), `vmGetMfaStatus` (so Settings
  shows Cognito's real current state, not a cached guess). Real QR via a new
  CDN script `qrcode@1.5.3` (`window.QRCode.toDataURL` on an `otpauth://`
  URI) — replaces the old hand-drawn fake `QR_GRID` pixel grid + the
  `JBSWY3DPEHPK3PXP (mock)` fixed secret.
  **Closing the loop required touching sign-in itself** (flagged to the user
  before starting, since this is the one part of this round that could
  actually lock someone out if done wrong): `vmSignIn` now returns
  `{mfaRequired:true, session, username}` instead of setting the session when
  Cognito challenges with `SOFTWARE_TOKEN_MFA`; new `vmConfirmMfaSignIn`
  completes it via `RespondToAuthChallenge`. `app.jsx`'s `signIn` wrapper and
  a new `confirmMfa` handle both; `SignIn.jsx` gained a 5th mode (`mfa`) that
  prompts for the code and resumes the same challenge Session.
  **AWS step still needed by the user:** Cognito console → user pool →
  Sign-in experience → Multi-factor authentication → set enforcement to
  **Optional** (not Off) and enable the **Authenticator apps** method — until
  that's set, `SetUserMFAPreference` will fail regardless of what the code
  does (this is a hard Cognito requirement, not a bug to fix in code).
  Verified: fake-token 2FA-setup attempt fails cleanly with the "session
  expired" message (no crash); sign-in page still renders/works with the new
  mode added. **Could not test the real enable → sign-in-challenge → confirm
  loop** — needs a real signed-in session + a real authenticator app, and the
  pool MFA setting flipped to Optional first.

- **Change password — real Cognito `ChangePassword`.** Was checking against a
  fake password in `localStorage` (`vm_mock_password`, removed). Now a real
  self-service call (`vmChangePassword` in auth.jsx); a wrong current password
  surfaces as an inline field error same as before. Deliberately **not**
  routed through the `vmSelfService()` NotAuthorizedException re-mapping added
  last round — here that exception code genuinely does mean "wrong current
  password," not an expired session, so remapping it would've been wrong in
  the other direction.
- **Delete account — real Cognito `DeleteUser`.** Previously only cleared
  `localStorage` and signed out — never actually deleted the account despite
  the modal's copy promising permanent removal. Now calls `vmDeleteAccount()`
  first; only clears local data + signs out if that succeeds. Modal gained a
  `busy` state (Cancel/backdrop/Confirm all disabled mid-request) so a slow or
  failing call can't be raced. Verified live (fake token): shows "session
  expired" and — importantly — does NOT sign out or clear local data when the
  delete call fails, so a real user is never (falsely) shown "deleted" while
  their account still exists.
- **Saved — reads real favourites.** Was hardcoded to the first 4 companies in
  the database. New `SavedSection` reads `vmFavs()` (capture.jsx) — the same
  localStorage source of truth the ⭐ on company pages already uses — and maps
  tickers back to full company objects. No new backend needed; this data
  already existed.
- **Your activity — new `vm-my-activity` Lambda (real, needs deploy).**
  Was hardcoded `MOCK_SEARCHES`/`MOCK_VIEWED`. New Lambda
  (`lambda/activity/vm-my-activity/index.mjs`, same recipe as
  vm-avatar-upload: Function URL Auth NONE, verifies the Cognito access token
  itself via JWKS) **Queries** (not Scans — scoped to the caller's own `pk`)
  `vm-events` for `type:"search_select"` and `type:"navigate"` (route
  "dashboard") events, dedupes, returns the 8 most recent of each. New
  `activity.jsx` (`VM_ACTIVITY` config + `vmFetchMyActivity`, same shape as
  avatar.jsx/billing.jsx). **Deployed** — Function URL
  `https://oh3bjpbnrw2g64tplpicg4yam40wiybz.lambda-url.us-east-1.on.aws/`,
  wired into `activity.jsx`. Verified live: manual fetch to the Lambda
  confirms it's reachable and JWKS-verifying; `vmFetchMyActivity()` correctly
  returns `null` on an invalid token and `ActivitySection` falls back to the
  mock cleanly (couldn't test the real-data success path from here — needs a
  real signed-in session, same limitation as the other Cognito-gated flows).
- Verified all four together with one scripted CDP/headless-Edge run (fake
  session): Saved renders real favourited tickers; Activity falls back to
  mock cleanly (Lambda not deployed yet); Change password surfaces "Incorrect
  password" correctly on a bad token; Delete account shows the session-expired
  toast and — confirmed — does not sign out or wipe local data on failure. No
  JS errors.

### 2026-07-18 — Started `personal.settings.1.1`.

New branch (from main) for personal/account settings work. Branch name given
verbatim by the user (dotted form, not the usual kebab-case slug — honoured
as-is).

- **Profile photo upload (`AccountSettings.jsx`).** "Change photo" on the
  Personal details page was a toast-only mock. Now a real client-side upload,
  stored as a data URL in `vm_avatar_<sub>` → new shared `StAvatar` renders
  it (falling back to the initials square) on both the settings-list profile
  card and the Personal details page. Added a Remove-photo link; wired
  avatar-key cleanup into Delete account.

- **`AvatarCropModal` — pick-a-photo preview/adjust popup.** Picking a file no
  longer auto-crops silently; it opens a modal (same portal/overlay pattern as
  `DeleteAccountModal`) with a 240px square viewport showing the photo — drag
  to reposition, a slider (1×–3×) to zoom, Cancel/Save. Save reads the exact
  pan/zoom back into source-image coordinates and crops a 320px JPEG via
  `vmCropImageToDataUrl` (replaced the old auto-centre-crop `vmResizeImageFile`,
  now dead code since the modal always drives the crop). Verified end-to-end
  with a scripted CDP/headless-Edge run: file picked → modal opens → slider
  dragged to 2× (confirmed the resulting CSS transform scale doubled, so the
  pan/zoom math is correct) → simulated a drag pan via `Input.dispatchMouseEvent`
  → Save → uploads/falls back → modal closes → avatar renders. No JS errors.

- **`vm-avatar-upload` — real S3-backed photo storage.** New Lambda
  (`lambda/avatar/vm-avatar-upload/index.mjs`, same recipe as the billing
  Lambdas: Function URL Auth NONE, verifies the Cognito **access** token itself
  via JWKS — no API Gateway). Takes the already-resized JPEG data URL, PUTs it
  to S3 at a deterministic per-user key `avatars/<cognito-sub>.jpg` (re-uploads
  just overwrite), returns the public URL. **AWS set up by the user:** S3
  bucket `veridianmarkets-avatars` (public-read via bucket policy scoped to
  `avatars/*`, matching the existing "code sets CORS, Function URL CORS off"
  convention), inline role policy `vm-avatar-s3-write` (`s3:PutObject` scoped
  to that prefix — not a blanket S3 FullAccess). Function URL:
  `https://tjm2rqjtjljgikdlucblj3kiyq0brefs.lambda-url.us-east-1.on.aws/`.
  **Frontend:** new `avatar.jsx` (`VM_AVATAR` config + `vmUploadAvatar`, same
  shape as `billing.jsx`), registered in `index.html`. `StProfileSection`'s
  upload handler now tries `vmUploadAvatar` first and falls back to the
  local-only `localStorage` copy if it's not configured/fails (offline, quota,
  etc.) — toast text tells the user which happened.

  **Verified fully live end-to-end** (2026-07-18, real signed-in session):
  upload → Lambda verifies token → S3 PutObject → toast "Profile photo
  updated." → renders in Settings. Hit one real bug along the way: the S3
  object URL 403'd (`AccessDenied`) even though the upload succeeded — the
  bucket policy step had been skipped (empty policy = nothing grants public
  read), and separately the bucket-level "Block Public Access" (not the
  account-wide one — both exist, at different console locations) still had it
  on, which rejects a bucket policy save outright until cleared. Fixed by
  turning off bucket-level Block Public Access, then saving the public-read
  policy scoped to `avatars/*`. **Not yet done:** no cross-device
  reconciliation on load — the avatar shown is still whatever's cached in this
  browser's `localStorage`, not re-fetched from S3 on other devices/browsers.

- **Editable Full name / Email / Username — real Cognito self-service.**
  `StField` (Personal details) was always a live-looking `<input>` but never
  actually saved anything — `Save changes` just showed a mock toast. Now:
  - **Full name** → real Cognito `UpdateUserAttributes` (`name` attribute),
    immediate, no verification. On success calls the new `onUserRefresh` (app.jsx
    → `vmRefresh()` → `setUser`) so the fresh claim shows up everywhere `user` is
    read (rail greeting, etc.) without a re-login.
  - **Email** → real Cognito flow, not just a form save: `UpdateUserAttributes`
    + `GetUserAttributeVerificationCode` sends a code to the *new* address, then
    a new `VerifyEmailModal` (code entry, resend, confirm/cancel) calls
    `VerifyUserAttribute` before it's final — matches how email changes work
    everywhere (security-correct, user's explicit choice over a no-verification
    shortcut).
  - **Username** → confirmed **not a real separate Cognito field** (this pool's
    real username is the fixed sign-up email and can't be renamed); made it a
    genuine local display handle instead, `vm_username_<sub>` (localStorage),
    independent of email — user's choice over dropping the field.
  - New auth.jsx exports: `vmUpdateAttributes`, `vmRequestEmailChange`,
    `vmResendEmailCode`, `vmConfirmEmailChange`, plus an internal
    `vmSelfService()` wrapper that re-maps `NotAuthorizedException` — the
    shared `cognitoMessage()` map says "Incorrect email or password" for that
    code (correct for sign-in, wrong here: it means the access token expired
    mid-session) → now "Your session has expired — please sign in again."
    **Caught by a scripted headless-Edge test**, not spotted by inspection —
    worth remembering `cognitoMessage()`'s mappings are sign-in-flow-specific
    and need re-checking whenever reused in a new context.
  - **Correctness fix motivated by this change:** avatar storage key switched
    from `vm_avatar_<email>` to `vm_avatar_<sub>` (sub is stable, email isn't
    anymore) — otherwise changing your email would silently orphan your
    already-uploaded photo. Delete-account cleanup updated to match (now also
    clears `vm_username_<sub>`).
  - Verified with a scripted CDP/headless-Edge run (fake-but-decodable ID
    token): fields load real values from claims, name field edits are
    controlled/lift correctly, Save fires the real Cognito call and — key
    finding — surfaces the corrected error message on an invalid/expired
    token. **Still needs a live test with a real signed-in session** for the
    actual success paths (name update reflecting in the rail; full email
    verify-code round trip) — can't fake a validly-signed Cognito JWT from
    here.

### 2026-07-18 — `landing-page-3.1` merged to main + live.

Whole-app sign-in gate (below) pushed to `main` → veridianmarkets.ai.

### 2026-07-18 — Started `landing-page-3.1`.

New branch (from main) to pick back up Landing page work (`Landing.jsx`, the
marketing site at root). User asked to number it `3.1` (a new series for this
feature track, after `landing-page-1.1`/`landing-page-2.1`, both merged).

- **Gated the whole app behind sign-in (`app.jsx`).** Since the landing-page
  split moved the app to `/home`, every app route (`front`, `screener`,
  `history`, `learn`, `memoir`, `myportfolio`, `mybusiness`, `admin`,
  `settings`, `calendar`, `news`, `upgrade`, `/company/<ticker>`) was actually
  reachable unauthenticated via direct URL — only `mybusiness`/`admin`/the 3
  paid routes redirected. Found via a real (non-guessed) test: headless Edge
  with a clean profile hitting `/home` rendered the full FrontPage. New
  `appGated = !signedIn && route!=='landing' && route!=='signin'` catches
  everything else → `signin`, replacing the old one-off `gatedFromBusiness`.
  `SignIn`'s `redirectTo` now sends the user back to whatever route they were
  gated from (was hardcoded to `admin`/`mybusiness`/`myportfolio`). Also fixed
  the document-title effect to key off `effRoute` (what's actually on screen)
  instead of `route` (the requested one) — it was stale/wrong for any gated
  page. Removes the old "portfolio sign-in guard disabled" testing bypass as
  a side effect (now covered by the blanket gate).

### 2026-07-18 — financials display fixes (branch `fix-earnings-order`). Merged to main.

- **Balance sheet** BS_MAP reordered to **Yahoo hierarchy** (Assets→Liabilities→Equity;
  subtotals bold, components indented) + many added us-gaap concepts (PP&E, goodwill,
  intangibles, non-current sections, retained earnings, minority interest, shares).
  Dashboard row render now does multi-level indent (`paddingLeft: 12+(in)*15`) + bold at
  any level; added `shares` fmt (no $).
- **Q4 in quarterly**: `vmBuildQuarterly(qPayload, aPayload)` — 10-Qs = Q1–Q3 only, so pull
  annual 10-K too; **balance sheet Q4 = year-end snapshot as-filed**, **income/cashflow Q4 =
  annual − (Q1+Q2+Q3)** derived (`_deriveQ4`). `useVMFinancials` fetches both freqs on quarterly.
- **Units:** `unit` state + "Show in: Relative/Thousands" toggle; **$ removed from all cells**,
  "Currency in USD · …" caption added; Thousands = plain `value×1000` with commas.
- EPS-surprise card sorts quarters chronologically (`signals.jsx`).

### 2026-07-18 — data-capture-1.2: admin reports + favourites table. Merged to main.

- **`vm-admin-analytics`** Lambda (`lambda/capture/vm-admin-analytics/`): admin-only (checks
  `cognito:groups` includes `admin`); Scans `vm-events` + Cognito **ListUsers** → views
  `overview`/`users`/`user&id=`. Env TABLE, COGNITO_POOL_ID, COGNITO_REGION. IAM needs
  **AmazonDynamoDBReadOnlyAccess + AmazonCognitoReadOnly**. Uses AWS SDK v3
  `@aws-sdk/client-cognito-identity-provider` (bundled in Node 20; Cognito call wrapped in
  try/catch so it degrades to events-only if not).
- **`adminanalytics.jsx`** (`useAdminAnalytics`) + `LiveCapturePanel` atop Admin→Overview:
  real users/active-7d/plans/top-favourites/top-viewed/funnel. Hidden if not admin (403).
- **`vm-favourites`** table (pk+sk = userId, TICKER): `vm-capture` now mirrors favourite
  add/remove there (best-effort). **Two AWS steps still needed by user: create `vm-favourites`
  table + redeploy `vm-capture`.** **Data lives in DynamoDB us-east-1** — report via Explore
  items/Scan→CSV, PartiQL, the admin Lambda, or (later) S3 export + Athena. Cognito ≠ database.
  **Next idea: wire Admin Users tab to the real Cognito+activity roster.**

### 2026-07-18 — data-capture-1.1: first-party analytics → DynamoDB. Merged to main.

- **`vm-capture`** Lambda (`lambda/capture/vm-capture/`): batched event ingest → **`vm-events`**
  table (COMPOSITE key **`pk`+`sk`** — first table with a sort key; pk=`u#<sub>`/`a#<anonId>`,
  sk=`<ts>#rand` for events or `#profile` for the rolling identity+counter row). Public POST
  beacon, no auth, TTL_DAYS. **Gotcha fixed: `plan` (like `name`) is a DynamoDB reserved word**
  — alias in UpdateExpression (`#pl`). Env TABLE, TTL_DAYS. IAM: BatchWriteItem+UpdateItem.
- **`capture.jsx`** (`vmCapture`/`vmIdentify`/`vmFavs`/`vmToggleFav`): batched (flush every 2.5s
  or 12 events, `sendBeacon` on pagehide), sent as text/plain = no CORS preflight; no-op until
  `VM_CAPTURE.url` set.
- **Wired:** ⭐ favourite star in `CompanyHead` (persists localStorage + logs); global `click`
  listener; `navigate`/`session_start`(+referrer/UTM/device)/`paywall_hit`/`checkout_start` in
  app.jsx & billing.jsx; `search_select`, `tab_view`, `feature`(export). Next ideas: search
  no-results, dwell time, cancel-reason, an Admin "Users & activity" view reading `vm-events`.

### 2026-07-18 — payments-1.3: proper checkout (no duplicate customers). Merged to main.

- **`vm-billing-checkout`** Lambda (`lambda/billing/checkout/`): JWT verify → reuse ONE
  Stripe customer per Cognito user (stored `stripeCustomerId` + reverse map `cust#id`→sub)
  → create subscription Checkout Session → return url. Replaces Payment Links (kills
  duplicate customers). Env: STRIPE_SECRET_KEY, TABLE, COGNITO_POOL_ID, COGNITO_REGION,
  PRICE_PLUS, PRICE_PRO, SUCCESS_URL, CANCEL_URL. Guards a deleted customer via
  `customerLives()`. `billing.jsx` apiBase → this Lambda; sends `email` in the body
  (access token lacks email). **Set timeout 30s** (checkout.session.completed 502'd on
  the webhook's 3s default — the extra Stripe line-items call; same fix due on checkout).
- **Phase 4** = webhook already handles subscription.updated/deleted; just raise
  `vm-billing-webhook` timeout to 30s + ensure the 3 events subscribed. **User hasn't
  run the full test yet.** Still pending: GBP→USD prices. **Next: data-capture-1.1.**

### 2026-07-18 — payments-1.2: billing portal + admin access. Merged to main.

- **`vm-billing-portal`** Lambda (`lambda/billing/portal/`): verifies Cognito JWT →
  reads `stripeCustomerId` from `vm-subscriptions` → creates a Stripe Customer Portal
  session → returns URL. Env: STRIPE_SECRET_KEY, TABLE, COGNITO_POOL_ID, COGNITO_REGION,
  RETURN_URL. Function URL Auth NONE, CORS off. Frontend `vmOpenPortal()` + "Manage /
  cancel subscription" button in Settings. Works only for subs made **while signed in**
  (webhook stored the customer id) — Phase 3 (`vm-billing-checkout`, one customer per
  Cognito user) still pending to kill duplicate Stripe customers + reliable plan sync.
- **Admin bypasses paywall**: `isPaying = signedIn && (plan!=='free' || user.role==='admin')`.
- **Fixed** pre-existing `StList` crash — used `planTier` without the prop; blanked the
  Settings menu on a direct `/settings` deep-link. **Payments still test-mode**; see
  `review.md` (currency GBP→USD, single-customer checkout, go-live) + the payments
  problem list. **Next: customer data capture.**

### 2026-07-17 — Generic Finnhub proxy + extra calendars. Merged to main.

- **`vm-finnhub`** — ONE generic caching proxy Lambda for many free Finnhub GETs.
  Call `?endpoint=<key>[&params]`; an `EP` map holds path + **per-endpoint TTL** (no
  `TTL_SECONDS` env var) + allowed params + default date windows. One table
  `vm-finnhub` (key `pk`). Endpoints: ipo-calendar, fda-calendar, market-status(5m),
  market-holiday, insider-sentiment, usa-spending, lobbying, sec-filings. Skips
  caching payloads >380KB. **This is the pattern for adding more endpoints — edit the
  EP map, no new Lambda.**
- **`calendars.jsx`** (`useVMCalendars`) puts **IPO / FDA / market-holiday** onto the
  Calendar page as new event types (added to `CAL_TYPES` + `CAL_EDU` + `calEduFor`), so
  filter chips/legend/day-panel/education pick them up automatically. Branch
  `api-links-2.1.1`. **Still unwired (deployed, on vm-finnhub):** insider-sentiment,
  usa-spending, lobbying, sec-filings, market-status → belong in Signals/Overview/header.

### 2026-07-17 — Finnhub data build-out (6 Lambdas). Merged to main.

Same read-through-cache recipe each time (DynamoDB key **`pk`**, code-set CORS +
Function-URL CORS **off**, 30s timeout, `AmazonDynamoDBFullAccess`). All stacked
branches merged via `earnings-calendar`. Roadmap/tracker: `finnhub-roadmap.md`.

- **`vm-search`** (`/search`) → `symbolsearch.jsx` `SymbolSearchBox` on Home+Search;
  opens any US ticker (non-curated = real price/financials + `TabUnavailable` for
  mock-only tabs). Table key `q` (not `pk`).
- **`vm-profile`** (`/stock/profile2` + `/stock/metric`) → `profile.jsx`: header mkt
  cap/P/E/yield (replaced hardcoded 37.36), `LiveMetrics` on every Overview,
  `ProfileOverview` for searched tickers.
- **`vm-news`** (`/news` + `/company-news`) → `newsfeed.jsx`: Home tiles, News page
  (source links), company News tab + "Latest headlines" strip. 15m TTL.
- **`vm-signals`** (recommendation/earnings/peers/insider) → `signals.jsx`
  `SignalsPanel`; Screener Analyst filter live via `useVMConsensus`.
- **`vm-patents`** (`/stock/uspto-patent`) → `patents.jsx` `PatentsLive` (stat row,
  title-classified tech breakdown, filing trend, recent). Free tier caps ~250.
- **`vm-earnings-cal`** (`/calendar/earnings`) → `earningscal.jsx`: month's biggest
  reporters (ranked by revenue est — curated-only was too sparse) on the Calendar
  grid/day-panel/list. Free tier chokes on >~1-month ranges → fetch per month.

**Gotcha:** `news.jsx` collides with `News.jsx` on Windows (case-insensitive FS) —
the helper is `newsfeed.jsx`. Remaining free endpoints (Phase 2) in `finnhub-roadmap.md`.

### 2026-07-14

- **`financials-1.1` — financials as reported (cached). Merged to main.** `vm-financials`
  Lambda caches Finnhub `/stock/financials-reported` in DynamoDB (`vm-financials`, key
  `symbol#freq`, **24h TTL**, whole payload as one JSON `S` attr to dodge the 400KB limit,
  trimmed to 8 latest filings). `financials.jsx` (`vmFinancials`/`vmBuildStatements`/
  `useVMFinancials`) maps raw **us-gaap concepts** → the curated Income/Balance/Cashflow
  rows (matched by concept suffix after `_`, first-wins; values ÷1e6 to USD millions, EPS
  raw) → same `{periods,income,balance,cashflow}` shape the tab already renders/exports.
  `DashFinancials` uses live filings per ticker/period, else the mock, with an "as reported
  vs illustrative" source line. **US filers only** (free tier). Same Lambda recipe as
  `vm-quote`: CORS in code + Function URL CORS off, 30s timeout, DynamoDB Get/PutItem IAM.

- **`marketdata-1.1` — live Finnhub quotes (cached). Merged to main.** Read-through
  cache shipped: `vm-quote` Lambda serves a **`vm-quotes`** DynamoDB entry (2-min TTL) or
  fetches Finnhub on a miss. Frontend `marketdata.jsx` (`vmQuotes`/`useVMQuotes`/`vmApply`,
  2-min client cache) drives **company header, Home, Search** in **USD** with a live dot;
  non-equities stay mock (free tier = US stocks only). **Setup gotchas (fixed):** CORS must
  be single-source — code sets the headers, so the **Function URL CORS config is OFF** (had
  `*, *` → blocked); **Lambda timeout raised to 30s** (default 3s timed out on the 10-symbol
  Home request → no CORS header on the error). IAM role needs DynamoDB Get/PutItem. Guide
  `marketdataapi.md`.

### 2026-06-30

- **Started `marketdata-1.1`.** New branch (from main) for **live market data** via the
  **Finnhub API** (backend track, `-1.1`). Strategy (`marketdataapi.md`): **read-through
  cache** in DynamoDB (`vm-quotes`) with a **2-minute TTL** — quotes fetched from Finnhub
  **only when a user accesses a symbol AND the cached copy is stale** (>120s); one fetch
  serves all users; key stays server-side in a `vm-quote` Lambda; `data.jsx` seam swaps
  mock → cached quotes. Build TBD (user gets Finnhub key first).

- **`backend-signin-AWS-1.1` — real Cognito sign-in. Merged to main.** Replaced the
  placeholder `VM_ACCOUNTS`/SHA-256 auth with **AWS Cognito** (pool `us-east-1_FusGT8Ntu`,
  public app client `7idj7ncoa195pgqiaqs7376k8d`, no secret, `USER_PASSWORD_AUTH`). New
  `auth.jsx` (global `VM_AUTH` + `cognito()` REST helper + flows, no SDK/build step);
  `SignIn.jsx` five modes; `app.jsx` session/refresh/sign-out via Cognito; admin = Cognito
  group. Guide `backend-signin.md`. **Still test-stage:** move to SES email + adaptive auth
  before scale.
- **`payments-1.1` — payment/paywall + real Stripe (test). Merged to main.** (Numbered
  `-1.1`, payments/backend track.) Gates **News/Calendar/Dependency map** behind a paying
  plan → lock → **/upgrade** page (`Pricing.jsx`). Shared `billing.jsx` (`VM_BILLING` +
  `vmStartCheckout` + `vmFetchPlan`), also wired into Settings→Subscription. **Real Stripe
  loop works (sandbox):** Payment Links (Plus £9 `price_1TsTEt…` / Pro £19 `price_1TsTF8…`)
  tagged with Cognito `sub` → **`vm-billing-webhook`** Lambda verifies signature + writes plan
  to DynamoDB `vm-subscriptions` → **`vm-billing-status`** Lambda verifies the Cognito JWT +
  returns plan → app `vmFetchPlan` on load unlocks. Lambdas in `lambda/billing/` (fetch-based,
  no npm; use only `@aws-sdk/client-dynamodb` — `lib-dynamodb` 502s). **Deferred to pre-launch:**
  `vm-billing-portal` (cancel/switch — user chose to skip for now), single-customer
  `vm-billing-checkout` (Payment Links create **duplicate subs**), live keys. Guide `payment.md`.

- **Started `backend-signin-AWS-1.1`.** New branch (from main) — **first real backend
  work**: replacing the placeholder client-side auth (`VM_ACCOUNTS` / SHA-256 / localStorage
  session in `app.jsx`) with **real AWS-backed sign-in** (Cognito, per the README data/backend
  plan). Branch name given verbatim by the user (kept the `AWS` casing + `-1.1`, a fresh
  counter for the new backend track rather than the Foundation-2 UI counter).

- **Started `analysis-tools-2.1`.** New branch (from main) for additional **analysis
  tools**. (User said "analysis tools" → feature-scoped `-2.1`.) Clarified to mean
  **admin-facing operator analytics**, not market tools for end users.
- **Admin Analytics tab (`analysis-tools-2.1`). Merged to main + live.** Replaced the
  Admin **Heatmap** top-level tab with an **Analytics** tab (`AnalyticsTab` in
  `AdminPanel.jsx`); the heatmap is preserved as a sub-tool inside it. Seven sub-tools,
  all derived deterministically from `VM_USERS`: **Retention** (cohort grid + avg curve),
  **Growth** (growth accounting + Quick Ratio, synthesised monthly activity w/ gaps),
  **Funnel**, **Revenue** (MRR/ARPU/LTV/LTV:CAC + MRR-movement waterfall + 12-mo trend +
  NRR/GRR + plan-movement bars), **Engagement** (DAU/WAU/MAU, stickiness, **L28** power-user
  curve, top pages), **Churn risk** (scored save-list + CSV), **Heatmap**. Reusable
  helpers added: `AnStat`, `AnLine`. Mock until the real event stream (heatmap pipeline)
  can feed the behavioural metrics. Open ideas next: path/flow analysis, event explorer,
  A/B experiments, virality k-factor (all want real event data).

### 2026-06-11

- **Code cleanup 2.1 (`code-cleanup-2.1`). Merged to main.** Multi-file cleanup
  across all 23 JSX source files — no feature changes, only code quality. Constant
  hoisting (`TUTORIAL_BTN_STYLE`, `catLabel`, `initials`, `A_PLAN_PRICE`, `DAY_MS`),
  dead code removal (unused params, duplicate menu item, `previewIds` alias), JSX
  comment removal, expression simplifications (`deltaCols`, optional chaining,
  redundant if guard). Data fixes: AAPL/AMZN sums corrected, NVDA match 64→70,
  "Grovee's"→"Grove's" typo, GOOGL/AMZN filings `partial:true`. 23 files,
  −146 net lines.

- **Admin refinement 2.1 (`admin-refinement-2.1`). Merged to main.** Admin Overview
  KPI tiles and chart sections are now clickable → focused drill-down modals with full
  breakdowns. All admin modals gained a Download CSV button.

- **My Business 2.1 UX polish + tabs + Import (`my-business-2.1`). Merged to main.**
  New editor-panel tabs: **Signals** (mock market signals per node), **Impact**
  (concentration/contract/exposure breakdown), **Analysis** (Claude API placeholder).
  New **Import** flow: CSV/Excel drag-drop → parsed preview table with inline error
  highlighting (required/invalid/duplicate/format warnings) → confirm to add nodes.

### 2026-06-10

- **My Business 2.1 Tidy button (`my-business-2.1`).** Auto-arranges nodes into clean
  columns on click. First commit in `my-business-2.1` before the larger UX pass.

- **Learn 2.2 (`learn-veridian-markets-2.2`). Merged to main.** Tutorial overlays
  added to the Dependency Map and Admin panel.

- **Learn 2.1 (`learn-veridian-markets-2.1`). Merged to main.** Interactive
  `TutorialOverlay` (terracotta "Tutorial" button + step-through spotlight) added to
  every major page and company dashboard tab.

### 2026-06-09

- **Started `business-page-2.8`.** New branch (from main) for a **Personal ⇄ Business**
  account switcher (a toggle up top) and a new **My Business** page (`mybusiness`) where
  companies build their **own dependency map**. (User said "business page 2.2" → numbered
  **2.8** per the running counter; 2.2 already used by `supply-chain-live-2.2`.)
- **Personal⇄Business switcher + My Business map builder (`business-page-2.8`). Merged to main + live.**
  - **Switcher** (`chrome.jsx`/`app.jsx`): segmented **Personal/Business** toggle at the top
    of the rail; `accountMode` persisted to `localStorage` (`vm_account_mode`). Switching
    navigates to that mode's home (My Account / My Business). The You group shows the
    account item matching the mode; **My Business** also a rail item (briefcase icon).
  - **My Business** (`MyBusiness.jsx`, route `/my-business`, signed-in gated): interactive
    **dependency-map builder** — centre company node (editable), draggable supplier/external/
    customer nodes, live curved SVG connectors, right-hand editor panel, add/clear/reset, Save
    to `localStorage` (`vm_business_map`), seeded starter map, mobile list-editor fallback.
    Registered in `index.html`. Design Qs still open: optional link-node-to-real-company,
    multi-map/team storage (AWS later), draggable centre node. Mock.

- **Started `financials-2.7`.** New branch (from main) for financials work. (User
  said "financials.2.*" → numbered 2.7 per the running counter; 2.1–2.6 already
  used.)
- **Financials export + educational Calendar events (`financials-2.7`). Merged to main + live.**
  - **Financials Export** (`Dashboard.jsx`): green **Export** button by the Legend on
    the Financials tab → two-step popup (`FinExportModal`). Step 1 picks **CSV/Excel**;
    step 2 **multi-selects** statements (Income/Balance/Cash flow, Select-all), toggles
    **%Δ/$Δ** columns, and shows a live **preview**. Multi-sheet → Excel **separate
    tabs** (Office `x:ExcelWorksheets` HTML-workbook, dependency-free `.xls`), CSV
    **stacked sections**. **%Δ stored as a fraction** + `mso-number-format:'0.0%'` so
    Excel shows `1.5%` not `150%`. `downloadBlob` helper does client-side download.
  - **Calendar event education** (`Calendar.jsx`): each event has an **ⓘ** (list view:
    reveal on row hover / always on mobile; month day-panel: always shown) → `CalEduModal`
    explaining what it is, how it moves markets, and **bullish vs bearish** (or a
    neutral "what to watch" note). Content in `CAL_EDU` registry; `calEduFor()` maps
    events by type + title keywords with a generic fallback. All mock.

### 2026-06-08

- **Started `indices-2.6`.** New branch (from main) for indices work (the index
  ticker / index data). (User said "indicies.2.1" → correct spelling "indices",
  numbered 2.6 per the running counter; 2.1–2.5 already used.)
- **Indices/commodities/forex in search + asset-class maps + dashboard polish (`indices-2.6`). Merged to main + live.**
  - **Search list:** added SPX, GOLD, WTI, EURUSD/GBPUSD/USDJPY to `VM_COMPANIES`
    (mock prices). Search heading → **"Search."**, breadcrumb "Company search" → "Search".
    Search rows: **ticker/name now clickable** to open the dashboard; action buttons
    are **large squares that turn green on hover**.
  - **Asset-class-aware Dependency map (`SCN_DB` + `mode`):** commodities/forex reuse
    the bipartite map with their own group labels (left = production/drivers,
    right = consuming **sectors**); **indices** render a **family tree** of
    constituents by GICS sector (`ScnIndexTree`). Tapping a constituent opens a
    **preview popup** (the shared `Preview`, now with a **News** tab + the **full
    `DashFinancials`** statements). Threaded `go` into the embedded map so
    **Open dashboard** works.
  - **Breadcrumb = drill trail.** Lifted the dashboard tab to app state; the trail
    is `{co, tab}` per crumb (Search › SPX › Supply chain › AAPL › Financials), each
    clickable to step back.
  - **Dashboard tabs** highlight (green tint) on hover. **Financials:** controls row
    no longer overlaps the sheet sub-tabs (wraps cleanly).
  - **Connector arrows fixed (the inconsistency):** the per-render `nodeEls` reset was
    wiping freshly-set refs post-commit → no arrows until a later re-render; now refs
    self-clean (delete on unmount) + a ResizeObserver/fonts-ready re-measure. Also
    guarded `scnGet` against the index entry (no inputs/customers) and gave the
    generic placeholder proper groups so drilled-to companies render + connect.

- **Started `dependency-map-2.5`.** New branch (from main) for further updates to the
  Dependency map (`ScnLiveDemo.jsx`). (User said "dependancy map" → correct spelling,
  numbered 2.5 per the running counter; 2.2–2.4 already used.)
- **Dependency-map tabs + News filters + Financials deltas + AI assistant (`dependency-map-2.5`). Merged to main + live.**
  - **Full-screen map tabs:** removed the redundant "Supply chain" tab (the map is
    always on top) and default-select **Overview** instead.
  - **News (map view):** two-tier filter mirroring the map — key filters **Upstream**
    (Principal/Manufacturing/Commodity/Materials/Geopolitics) and **Customers**
    (carriers/retail/warehouse/online/distributors), each with sub-category chips;
    driven by a categorized mock set (`DNEWS_GROUPS`/`DNEWS_ITEMS`). Gated by an `scn`
    prop so the plain dashboard News tab is unchanged; removed the duplicate kicker.
  - **Financials:** new **%Δ** and **$Δ** toggle buttons → change-vs-prior-period
    columns inserted between periods, with a two-row merged header (range on top,
    %Δ/$Δ below). Negative = orange, positive = green. The (wide) table is now
    **drag-to-scroll** with the mouse. Added a **Legend** popup ("Reading the
    financials" — statements/rows/columns/buttons), key-icon, like the Calendar one.
  - **AI assistant:** global sticky **dark-green bubble** bottom-right that expands
    left into an "Ask Veridian AI…" bar (the icon is a **Times New Roman "Q"**; send
    arrow once typing). Placeholder responder — `TODO(Phase 3)` marks the Claude API
    call. Sits above the mobile Download-App bar.

- **Started `calendar-update-2.4`.** New branch (from main) for calendar work.
  (User asked for "calendarupdate2.2"; 2.2/2.3 already used, so numbered 2.4 per
  the restart-each-foundation running counter.)
- **Calendar: List view, Legend popup, month + week/month navigation (`calendar-update-2.4`). Merged to main + live.**
  - **Month / List toggle** in the filter row. **List** renders an economic-calendar
    table (Date · Time · Region · Impact · Event · Actual · Forecast · Previous),
    grouped by day, today tinted; mobile scrolls inside its box. Enriched
    `CAL_EVENTS` with region/impact/forecast/previous (Actual = — until release).
  - **Legend** button (key icon) → modal explaining every column, the Impact key
    (High/Med/Low) and the event types — data-driven from `CAL_TYPES`/`CAL_IMPACT`
    (`desc` added) + `CAL_COL_HELP`. Closes on ×/backdrop/Esc.
  - **Month grid nav:** the ‹ › arrows now work (state `ym`); dynamic month label;
    events stay in the June-2026 seed month; "Today" link to jump back.
  - **List nav:** independent **Week / Month** window with ‹ › arrows + range label
    ("June 2026" / "Jun 7 – Jun 13, 2026"); "Today" reset. All mock data still
    seeded in June 2026 (events keyed by day), so other periods read empty.

### 2026-06-07

- **Started `mobile-compatibility-2.3`.** New branch (from main) to continue the
  mobile pass started in `supply-chain-live-2.2` — make every remaining page work
  on phones and stay within the display width (next likely targets: History
  sub-panels, Memoir/Learn, Calendar, News, Settings, My Account, front page).
- **Made every page mobile-compatible (`mobile-compatibility-2.3`).** Threaded
  `isMobile` into the last components missing it (`Memoir`, `AdminPanel`, `SignIn`)
  and did a responsive pass across **every page**: stack multi-column grids to one
  column, wrap control rows, scale down headings, reduce side padding, and add
  ~80px bottom padding so content clears the fixed mobile "Download App" bar. Wide
  data tables (Admin users, Financials) now scroll **inside their box**
  (`overflowX:auto`) instead of widening the page. Specifics: **AdminPanel** (KPI/
  charts/country grids stack, users table scrolls, course form stacks); **Dashboard
  History** sub-panels (Past/Present/Future) + Ask-History row + DashNews grid stack;
  **MyPortfolio** (risk-tier cards, range buttons wrap); **AccountSettings** (isMobile
  threaded to sub-pages); **SignIn** (full-width card); **Memoir** (smaller quote
  glyph); **Calendar/News/History/FrontPage/Learn** already responsive — bottom-bar
  clearance + minor fixes. All gated on `isMobile`; desktop untouched. Mock data.

- **Built out the Dependency map + a broad mobile pass (`supply-chain-live-2.2`). Merged to main + live.**
  - **Dependency map (was "supply chain live").** DB-ready grouped taxonomy —
    suppliers by `company / manufacturing / commodity / materials`, customers by
    `mobile_carrier / electronics_retail / warehouse_club / online_reseller / …`
    (grouping lives on the relationship, schema sketched in `ScnLiveDemo.jsx`).
    Per-node hover now shows **P** (make principle) + **eye** (preview tab); removed
    the Risk row and the **5Y Lens** filter; compacted/consolidated nodes.
  - **Full screen** fills only the content area (`#vm-main`, not the OS/window).
    Inside it: **Filters** pinned across the top, the drill **breadcrumb** in the
    top-left, and the company **dashboard tabs** (Overview…News) rendered **inline
    below the map** — scroll down to read; the tab bar is sticky at the top
    ("position 2", between map and content), data from the same `resolveCompany`.
  - **Copy/menu:** rail "Supply chain network" → **Dependency map**; page title
    "The dependency map." → **"Dependency map."**; dropped "Explore ›" breadcrumb.
  - **Mobile pass.** Dependency map → stacked principle + **tap-to-open** node cards
    (no SVG/columns). Search/screener rows → contained cards: **tap once to select,
    tap again** for Preview / Dashboard. Company dashboard responsive (header stacks,
    Overview/Patents grids stack, embedded map uses the mobile layout). Company tabs
    now **drag-scroll** horizontally with the scrollbar hidden (`.vm-noscroll`), like
    the index ticker. New app-wide mobile **"Download App for Complete Experience"**
    bottom CTA (placeholder → store link later).

### 2026-06-01

- **Cleanup: deleted the original archive** — `scraps/`, `uploads/` (original
  wireframes + brief PDF), and `Veridian Memoir UI Kit (preview).html` (~19M total,
  all unreferenced). **Kept** `SupplyChain.jsx` (retired but per request), `preview/`
  (design-system pages) and `data_exports/`. Note: deleting committed files doesn't
  shrink the clone (git history retains blobs) — a history rewrite would be needed.
- **Settled open agendas (user decisions).** (1) **Branch numbering = restart each
  foundation** → Foundation-2 branches are `…-2.<n>`; next free = `…-2.2`. (2)
  **History page** stays at `/history` but **off the rail** (current). (3) **My
  Account** (portfolio dashboard) and **Settings** (preferences) **stay as two
  separate** rail items. (4) **Auth bypasses stay for testing** — `/portfolio`
  remains open without sign-in and the placeholder admin login stays until AWS
  Cognito. No code changes from these except this record.
- **Built Calendar + News pages and lots of home/search refinement (`calendar-and-news-pages-1.1`).**
  New **Calendar** (`/calendar`) + **News** (`/news`) pages, added to the Explore
  rail. **News:** search, category pills, lead + card grid, **article overlay**
  (`ArticleModal`) — reused on the home "Global News" tiles and a new company
  dashboard **News tab**. **Home:** learning "Resume/Start" banner up top; Market-
  recap aligned to the news tiles; "See more" (News) + Mini-calendar external-link
  box (Calendar). **Search/screener:** rows now hover/pop-out + reveal eye+arrow
  exactly like the home list (removed the affiliate icon; fixed the `overflow:hidden`
  clip); filter chips are **dropdowns** (`FILTER_DEFS`, → DB) with add/remove +
  **Clear all**. **Rail:** removed History; My portfolio → **My Account**; Settings
  + Sign-out pinned to the **bottom** when signed in. **Company page:** breadcrumb
  → `Search › TICKER › Tab` (Search links to screener). All mock data.
- **Started `calendar-and-news-pages-1.1`.** New branch (from main) for building a
  **Calendar** page and a **News** page (the "Global News" front-page kicker hints
  at the latter). User explicitly named it `…-1.1` (not `…-2.2`); honoured.
- **Front-page refinement (`home-page-2.1`).** "Find a company" list: removed the
  supply-chain (affiliate) action button; fixed header↔data column alignment and
  left-aligned Price + added a **CHANGE** column label; the **eye** button now
  opens the same inline `<Preview>` the Screener uses (tabs + supply-chain +
  history); rows lift into a hover-box (and added the same hover-box to the
  Screener rows for consistency). Copy: heading "Find a company." → **"Search."**,
  dropped "EXPLORE ·" from the company-count kicker, and "LEAD · 5-YEAR LENS" →
  **"Global News"**.
- **Entered Foundation 2 — the refinement phase.** Branch numbering moves to
  `…-2.<n>` (counter restarts at `.1`). Focus now: polish every page for
  consistency + functionality. First branch: `home-page-2.1` (front-page
  refinement). See [[project-phase2-roadmap]].
- **Started the iOS kit (`ui_kits/iOS/`).** User is building the native app in
  **Xcode (SwiftUI)** — web app is the visual reference, not ported. Added a
  README (Xcode/SwiftUI setup, fonts, bottom-tab nav) + `VeridianTheme.swift`
  (the VM palette + serif/mono font helpers ported to SwiftUI). No app yet.

### 2026-05-31

- **Turned OFF the auto-admin bypass (safety).** Removed `DEV_ADMIN_USER` auto
  sign-in from `app.jsx`; the live site no longer auto-signs visitors in as admin
  — everyone starts **signed out** and must sign in for settings/portfolio/admin.
  (`/sign-in` still redirects home when already signed in, and the portfolio guard
  stays disabled — both harmless.)
- **Account settings page + TEMPORARY auth bypass (`account-settings-1.17`).** New
  `AccountSettings.jsx` (`settings` route): a grouped settings list (Instagram
  pattern, VM editorial style) — profile summary + Your account / How you use
  Veridian / Privacy & data / Support / danger — each row drilling into its own
  designed sub-page (internal state + back arrow; toggles, forms, plan cards).
  Rail "Settings" item shows **only when signed in**. ⚠️ **Temporary testing
  bypasses in `app.jsx`** (revert before real auth): (1) auto sign-in as the admin
  when no session is stored (`DEV_ADMIN_USER`), (2) `/sign-in` redirects home when
  already signed in, (3) portfolio sign-in guard still disabled. Mock/scaffold.
- **Started `account-settings-1.17`.** New branch (from main) for an account
  settings page. (Reused iteration 1.17, freed when the abandoned `tier-levels-1.17`
  was deleted.) Also tidied the stale/duplicated "Next free iteration" lines left
  by the parallel-merge reconciliation → now cleanly `1.18`. No feature code yet.
- **Added `MOBILE.md` (`docs/mobile-plan`).** Planning doc for the native apps:
  Expo/React Native recommended, Figma optional (build-on-simulator), one-repo →
  monorepo (don't duplicate), GitHub workflow shifts for app releases, Mac setup,
  first milestone. Phase order: polish pages → apps → APIs/AWS/Stripe. No app code.
- **Data export tool (`database-infrastructure-1.16`).** Added `tools/export-data.mjs`
  (no-dep Node): loads the mock data files in a fake `window` and writes flat
  tables to `data_exports/` — `users.csv` (100 users + personal-profit columns),
  `companies.csv`, `courses.csv`, plus `users.md` (Markdown table for VS Code
  preview) and a README. `.vscode/extensions.json` recommends Edit CSV + Rainbow
  CSV for a grid/column view. Re-run `node tools/export-data.mjs` after data
  changes. Snapshot/read-only — feeds the database work, not wired back to the app.
  **Merged to main.**
- **Started `database-infrastructure-1.16`.** New branch (from main) for the real
  data/database layer — replacing the mock seams (`data.jsx`, the `localStorage`
  course store, the in-memory `VM_USERS`, placeholder auth) with a proper backend
  (AWS direction). No code yet.
- **Merged laptop's parallel work into main** (`company-profiles-1.13`,
  `learn-1.14`, `learn-1.15`): full Dashboard tabs + Screener preview tabs,
  MyPortfolio redesign, an interactive **course viewer with lesson content** on
  Learn, a Home item in the rail, and a temporary **sign-in guard bypass** for
  `/portfolio` (`gatedFromPortfolio = false` in `app.jsx` — restore later).
  Reconciled with the admin panel: kept the laptop's Learn (course viewer) and
  re-applied the admin **course store** on top (`vmGetCourses`/`vmAddCourse`/
  `vmDeleteCourse` now wrap the laptop's `LEARN_COURSES`); admin-added courses
  appear on Learn and fall back to the viewer's no-lessons layout. Kept admin
  role-gating + the admin rail item alongside the laptop's Home item.
- **Admin control panel (`admin-backend-access-1.13`).** Built an admin-only
  control panel: new `admin` route (gated to `role:'admin'`), rail item shown
  only to admins, and `AdminPanel.jsx` with three tabs — **Overview** (user-metrics
  dashboard: KPIs, signups bar chart, plan donut, top countries), **Users** (a
  temporary 100-user DB from new `admin_data.jsx`; searchable/filterable table;
  each row has a ⋮ menu → details modal with all account info + **personal
  profits** (per-user seeded mock), **Access account** = simulated impersonation
  banner, plus mock reset/suspend/delete/email/change-plan), and **Courses**
  (add/remove Learn courses). Refactored `Learn.jsx` to a localStorage **course
  store** (`vmGetCourses`/`vmAddCourse`/`vmDeleteCourse`) so admin-added courses
  show up live on the Learn page. All data is mock — stand-in for the real AWS
  backend this branch targets. **Merged to main + live.**
- **Started `admin-backend-access-1.13`.** New branch (from main) for real
  admin/backend access — the move off the client-side placeholder login toward a
  proper backend (AWS Cognito auth, etc.). User initially said "1.1"; kept the
  running counter (1.1 was taken) → `…-1.13`.
- **Built the My Portfolio dashboard (`portfolio-1.12`).** Replaced the blank
  portfolio scaffold with a **customisable widget dashboard**: a Connect-accounts
  bar (Trading 212 featured + IBKR/Robinhood/Coinbase/Vanguard/Binance, mock
  toggle), Summary KPIs, Performance area chart with range toggles, Allocation
  donut, Holdings table, Watchlist, and Analogue alerts (→ History). **Customise
  mode** toggles/reorders/resizes widgets; layout + connections persist to
  `localStorage`. Maths derived from `VM_COMPANIES`; all data is mock. Passed
  `isMobile` into `<MyPortfolio>`. **Merged to main + live.**
- **Published `backend-update-1.10` → main + live; started `portfolio-1.12`.** The
  full app (clean per-page URLs, root-served app, placeholder admin login) is now
  on veridianmarkets.ai. New branch `portfolio-1.12` to build out the **My
  Portfolio Page** (currently a gated scaffold that unlocks on sign-in).
- **URL router + app at the site root + placeholder auth (`backend-update-1.10`).**
  (1) **Routing:** root `index.html` is now the app itself (was a redirect to
  `/ui_kits/web/`); added a History-API router in `app.jsx` (`ROUTE_PATHS` /
  `pathToState` / `stateToPath`, `pushState` in `go()`, `popstate` sync, per-route
  titles) so every Toolbar page has a clean URL (`/`, `/sign-in`, `/portfolio`,
  `/supply-chain`, `/search`, `/history`, `/memoir`, `/learn`, `/company/<ticker>`).
  Deep links survive refresh on GitHub Pages via a standard `404.html` SPA
  redirect; `dev-server.mjs` got a matching SPA fallback. Old `/ui_kits/web/`
  path → redirect to `/`. (2) **Auth:** `SignIn.jsx` now authenticates against
  `VM_ACCOUNTS` (admin: `veridianmarkets.ai@gmail.com`, password stored as a
  SHA-256 hash, **not** plaintext), session in `localStorage`; rail shows the
  signed-in email + Sign-out. **Client-side only — not real security; replace
  with AWS Cognito.** Later **merged `main` into this branch** so the router now
  also carries the new search-hub History + Learn (the old branch copies were
  pre-rebuild). Still **not merged to main** until the owner publishes.
- **History prompts → plain bullet list (`history-page-1.11`).** Restyled the
  History search hub's example prompts from boxed cards to a simple hand-sketch
  bullet list (filled dot + serif text, underline/teal on hover), and made the
  "Prompts" label a written-out serif heading. Page structure + the four prompts
  unchanged. **Merged to main + live.**

- **Built the Learn page (`learn-1.9`).** Replaced the blank `Learn.jsx` scaffold
  with a course/guide catalogue — learn finance/markets/business management and
  how to use Veridian. Coursera-style "Most popular" rail reimagined in the VM
  editorial style: a "New here?" guided-path banner (links into the app), live
  search, a broad set of **category pills**, **Level/Format** filter groups, a
  responsive card grid (colour-coded topic visuals + badges + level/length) and a
  **Show more** pager. "App tutorial" cards carry a `route` and `go()` into the
  relevant screen. All 18 courses/categories are **mock scaffold data** kept
  inline (promote to `data.jsx` later); categories deliberately broad to cull.
  Also passed `isMobile` into `<Learn>` in `app.jsx`. **Merged to main + live.**

### 2026-05-30

- **21:38 — History page → search/"ask" hub (`history-page-1.8`, not merged).**
  Replaced the analogue engine with a Search page: hint pill, "Search." title,
  search bar (scaffold, no backend), clickable example Prompts. History route no
  longer takes a company. Then started `learn-1.9` (Learn page work).
- **18:59 — Merged `scn-live-demo-1.6` → main; SCN dependency map is live.** Shipped
  to veridianmarkets.ai despite being WIP (user chose to publish now, refine later:
  breadcrumbs + company-page entry points). Also note `api-link-beta-1.7` is open
  (empty, branched from main) for the Finnhub/data-provider side project — paused.
- **18:39 — Built the SCN dependency map (`scn-live-demo-1.6`).**
  New interactive page `ScnLiveDemo.jsx` (ported from the user's HTML example):
  principle centre, inputs/external left + customers right, curved SVG connectors,
  hover tooltips, click-to-drill with breadcrumb, All/Companies/External filters
  (5Y Lens placeholder); data for AAPL/SONY/TSM/QCOM/AMZN. **Swapped it in as the
  SCN Page** — the "Supply chain network" rail item (route `supply`) now opens this
  map; old `SupplyChain.jsx` retired. **Next up (deferred):** fix the in-page
  breadcrumbs and how users access company/dashboard pages (entry points like
  `go('supply', company)` and `go('dashboard', company)` need sorting). See
  [[project_scn_next_breadcrumbs]].
- **14:50 — Front page + chrome polish & mobile (`update-front-page-1.5`).**
  Time-based greeting moved into the Toolbar Menu (above "You"); ticker back at the
  very top; greeting subtitle removed; "Open full screener" boxed. Mobile pass:
  stacked grid, single-column story tiles (pager → 9 pages), simplified company
  rows. Ticker is now an auto-scrolling (right→left), drag-to-move marquee; removed
  the UTC·LIVE chip.
- **14:20 — Front page overhaul (`update-front-page-1.4`).** Greeting moved above
  the ticker (+ ticker top border); lead story → a 3×3 paged story-tile grid with
  a centred "More ↓ / ↑ Up" pager that scrolls tiles between pages; right column
  is now a Market-recap / Mini-calendar accordion (boxed chevrons, hover shades);
  "Find a company" shows 10 rows with a live search box and hover-reveal action
  icons. Tiles and rows pop out on hover.
- **12:48 — Merged 1.2 + 1.3 to main; started `update-front-page-1.4`.** Both
  feature branches published to `main` (→ veridianmarkets.ai). New branch is
  `update-front-page-1.4` — iteration keeps the global per-foundation counter
  (1.1 → 1.2 → 1.3 → 1.4), confirmed auto-bump.
- **12:23 — Gated the My Portfolio Page.** New `myportfolio` route + scaffold
  (`MyPortfolio.jsx`); a placeholder `signedIn=false` in `app.jsx` reroutes
  logged-out visitors to the Sign in page. AWS auth wiring captured in
  `Businessplan.md`. (`create-sign-in-page-1.3`)
- **12:17 — Created the Sign in Page.** New `signin` route + `SignIn.jsx`:
  chromeless layout (green header + footer only, no rail/ticker) with a centered
  login box — visual scaffold, no auth yet. (`create-sign-in-page-1.3`)
- **12:10 — Removed the Toolbar Menu search field.** Deleted the dashed
  "search tickers, eras" input at the top of the rail; nav now starts at the
  *You* group. (`update-global-header-1.2`)
- **12:05 — Added the global header + mobile support.** New full-width green top
  bar (`GlobalHeader`) with the wordmark as the Home button on every screen size;
  below ~768px the Toolbar Menu collapses into a hamburger / slide-in drawer, and
  the rail's duplicate wordmark was removed. (`update-global-header-1.2`)
- **11:58 — Started the branch scheme: `update-toolbar-and-setup-1.1` (1.1).** First
  branch under the new convention; bundles the Toolbar Menu overhaul, the blank
  Learn page, the brand rename, and the docs/setup (this file, `Businessplan.md`,
  README data section). Next branch: `update-global-header-1.2`.
- **11:47 — Brand sweep "Veridian Memoir" → "Veridian Markets."** Updated all live
  files (`ui_kits/web/`, both `index.html`s, `README.md`, `SKILL.md`); archive
  HTMLs left untouched. The Read memoir / Memoir Page feature keeps its name.
- **11:47 — Locked decisions.** Branch slug form `update-global-header-1.1`;
  `ui_kits/web/` is the only edit target (rest = archive); veridianmarkets.ai is
  the **real product** (external APIs + AWS backend); recorded the roadmap (global
  header/mobile → Sign in → My portfolio); created `Businessplan.md`.
- **11:31 — Defined branch & iteration naming.** Branches are
  `<Code Name> - <foundation>.<iteration>` (e.g. `Update Global Header - 1.1`).
  6 foundations = the deploy pipeline (`1 → 2 → 3 → 4 → 5 → 6`); the site is on
  **Foundation 1**. Iteration is a running counter within the foundation that
  **I auto-increment** (`.1, .2, .3 …`). See *Branch & iteration conventions*.
- **11:18 — Added a blank Learn VM page.** New `learn` route + blank scaffold
  ([`ui_kits/web/Learn.jsx`](ui_kits/web/Learn.jsx)); wired the "Learn" rail item
  to it (`id:'learn'`) and registered the script in `index.html`. Section:
  **Learn VM** — content TBD.
- **11:12 — Named the left rail the "Toolbar Menu."** Anything added to that rail
  is part of the Toolbar Menu, and gets a canonical Section identifier (see the
  registry above).
- **11:12 — Logo is now the Home Page button.** Made the top-left "Veridian
  Markets" wordmark clickable → `front` route, and deleted the separate "Front
  page" text item. Section: **Home Page**.
- **11:12 — "Watchlist" → "My portfolio."** Renamed the rail item. Section:
  **My Portfolio Page** (no route yet).
- **11:12 — Deleted "Saved stories."** Removed from the rail.
- **11:12 — "Company search" → "Search."** Renamed the rail item (route unchanged:
  `screener`). Section: **Main Search Page**.
- **11:12 — Moved "Supply chain network" above "Search" + added a Live-Demo badge.**
  A small green-bordered box with a green bullet reading "• Live Demo" now sits
  beside the label. Section: **SCN Page**.
- **11:12 — Recorded Section identifiers** for the remaining items: Sign in Page,
  History Page, Learn VM, Memoir Page.
- **11:12 — Created this file (`CLAUDEMemory.md`).** Conventions source of truth;
  renamed from the originally-proposed `CLAUDE.md` per request.

---

## Roadmap — what's next (Foundation 1)

Planned, in order (each becomes its own `…-1.N` branch):
1. **Global header / mobile** — responsive pass: collapse the Toolbar Menu into a
   **hamburger** on small screens, and add a **green top bar with branding** across
   the top of the page. (Likely the `update-global-header-1.1` branch.)
2. **Sign in Page** — real auth on **AWS**; signing in unlocks My Portfolio.
3. **My Portfolio Page** — gated; if the visitor isn't signed in, redirect to Sign in.

---

## Branch & iteration conventions

**Branch name format (lowercase kebab-case slug):**
`<code-name>-<foundation>.<iteration>`  →  e.g. `update-global-header-1.1`

The human-readable **Code Name** (e.g. "Update Global Header") goes in the
**commit/PR title** and the **change log**; the *branch* uses the slug so git and
GitHub URLs stay clean (no spaces).

- **Foundation** — which of the product's **6 foundations** the work belongs to.
  The 6 foundations are the deployment pipeline; every change progresses through
  them in order on its way to production: `1 → 2 → 3 → 4 → 5 → 6`.
  **As of 2026-06-01 the product moved to Foundation 2** (the refinement phase —
  polishing every page for consistency + functionality; see [[project-phase2-roadmap]]).
  New branch names are now `…-2.<iteration>`. Foundation 1 work (1.1–1.17) is done
  + merged.
- **Iteration** — a running counter *within the current foundation*. It
  increments by 1 for **each new branch** (`1.1, 1.2, 1.3, …`). **Claude adds
  this automatically** — the user trusts me to bump `.1 → .2 → .3`.

**How Claude picks the next branch name (do this automatically):**
1. Foundation = the current foundation (today: **2**).
2. Iteration = the highest existing `…-<foundation>.N` across all branches,
   **+ 1**. If none exist yet for this foundation, start at `.1`.
3. New branch (slug) = `<code-name>-<foundation>.<iteration>`.
4. After creating it, update **"Latest branch"** below and log it in the change
   log (Code Name + full slug + timestamp).

**Current foundation:** 2 *(refinement phase, began 2026-06-01)*
**Latest branch (this scheme):** `payments-1.1` (payment/paywall + real Stripe test loop — webhook + status Lambdas; **merged to main**). Previous: `backend-signin-AWS-1.1` (real AWS Cognito sign-in; merged), `analysis-tools-2.1` (Admin Analytics tab; merged), `code-cleanup-2.1` (code quality pass across 23 JSX files; merged). Recent: `admin-refinement-2.1` (clickable KPI/chart modals + CSV download; merged), `my-business-2.1` (Tidy button + UX polish + Analysis/Impact/Signals tabs + Import; merged), `learn-veridian-markets-2.2` (tutorial overlays for Dependency Map + Admin; merged), `learn-veridian-markets-2.1` (tutorial overlays on every page; merged), `business-page-2.8` (Personal⇄Business rail switcher + My Business map builder; merged), `financials-2.7` (Financials export CSV/Excel + Calendar ⓘ modals; merged), `indices-2.6` (indices/commodities/forex + asset-class maps + breadcrumb drill; merged), `dependency-map-2.5` (map tabs + News filters + Financials deltas + AI assistant; merged). Note: recent branches (`my-business-2.1`, `learn-veridian-markets-2.1/2.2`, `admin-refinement-2.1`, `code-cleanup-2.1`) use **feature-scoped versioning** rather than the global running counter — the per-feature minor number tracks that feature's iteration.

> ⚠️ **Parallel-work numbering clash (2026-05-31):** a laptop worked in parallel and
> reused the counter — `company-profiles-1.13` (alongside `admin-backend-access-1.13`),
> then `learn-1.14`, `learn-1.15`. All merged to main and reconciled here.
> When working on two machines, pull main first to pick the next number, or
> namespace by machine.

**Next free iteration:** For global-counter branches: `<code-name>-2.9`. For feature-scoped branches: use `<feature-name>-2.<n>` (or the backend track `<code-name>-1.<n>`, e.g. `payments-1.2`). *In progress:* none — `payments-1.1` + `backend-signin-AWS-1.1` merged to main.

> ✅ Confirmed (2026-06-01): **restart each foundation.** The iteration is a
> running counter *within* a foundation (`x.1, x.2, x.3 …` across all code names)
> and **resets to `.1` when a new foundation begins**. So Foundation 1 ran 1.1–1.17;
> Foundation 2 is 2.1, 2.2, …. (Earlier 2026-05-30 note said the same for F1.)
