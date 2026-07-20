# Feature ideas

A running list of ideas not yet scheduled to a branch — pulled together from
notes scattered across `CLAUDEMemory.md`'s change log, plus whatever gets
added here going forward. Not a roadmap or a commitment, just a place to
park things so they don't get lost.

---

## Admin / analytics

- Path/flow analysis, event explorer, A/B experiments, virality k-factor —
  all want a real event stream (heatmap pipeline) to feed them.
- Wire more of `vm-finnhub`'s deployed-but-unwired endpoints (insider-sentiment,
  usa-spending, lobbying, sec-filings, market-status) into Signals/Overview/header.
- Search no-results tracking, dwell time, cancel-reason capture.

## SCN / My Business

- Fix in-page breadcrumbs and how users reach company/dashboard pages from
  the dependency map (deferred on `scn-live-demo-1.6`).
- Optional: link a map node to a real company (ticker lookup).
- Multi-map / team storage (needs a real backend).
- Draggable centre node in My Business.

## Payments / billing

- `vm-billing-portal` self-serve cancel/switch (deferred pre-launch).
- GBP → USD price conversion.
- Move off Cognito's default email sender to Amazon SES before real launch
  (deliverability + volume limits).

## Account / security

- Cross-device avatar reconciliation beyond what avatar-sync-1.1 already
  covers, if new gaps show up.
- SMS-based 2FA (explicitly deferred — needs real outside setup).
- Real broker connections for My Portfolio (Trading 212 / IBKR / Robinhood /
  Coinbase / Vanguard / Binance are currently mock-connect only).

## Mobile

- Full mobile pass on every screen (front page already works on mobile;
  everything else deferred "until last" per user).
- Expo/React Native build — see `MOBILE.md` for the agreed strategy.

## Phase 2 (see `CLAUDEMemory.md` roadmap note, ~2026-06-01 target)

- Polish every page for consistency + function.
- Native iOS/Android app.
- Broader API integrations + AWS build-out + Stripe going live (real keys).

## New (2026-07-20)

- Make an updates list for people to see what we do.
- Make the website available on all companies.
- Delete all mock data from Admin.
- How to give different admin permissions to different users in my company.
- Build courses.
- Don't like how the temporary/placeholder text shows while News is loading.
- Company search says "can't find companies" even though it shows up — misleading.
- ETFs — make a list of all the companies in there.
- Mutual funds — same as above.
- Work on the business side of the app.
- Remove the connected-accounts feature.
- Input strategies directly into the company (e.g. look at debt, revenue, growth).
- Make "similar companies" more dominant/prominent.
- In News, make impacted companies more dominant/prominent.
- Remove email from the menu tab.

---

## Log

- 2026-07-20 — File created, seeded from ideas scattered through the
  `CLAUDEMemory.md` change log up to `admin-actions-1.1`.
- 2026-07-20 — Added a fresh batch of raw feature ideas from the user.
