# Veridian Markets — Design System

> **"history-led finance."** Veridian Markets is a markets-research web product
> with an editorial, almanac-like voice. Its signature idea: for any company,
> find the *closest historical analogue* — "AAPL today reads like MSFT in 2014"
> — and show what happened next as a **base rate, not a forecast**. The whole
> surface reads like a beautifully typeset financial newspaper crossed with a
> Bloomberg terminal.

This folder is a self-contained design system: brand voice, color + type
tokens, the iconography approach, and a high-fidelity UI kit that recreates the
product's core screens. Use it to build new Veridian Markets screens, marketing,
prototypes, or branded artifacts.

---

## The product, in one paragraph

Veridian Markets is organized as a left **rail** (You: Sign in / Watchlist /
Saved stories · Explore: Front page / Company search / Supply chain network /
History · Learn / Read memoir) sitting on a cool blue-grey field, with the warm
"paper" content area to its right. A persistent **index strip** ticks across the
top (S&P 500, NASDAQ, DOW, GOLD, OIL, BTC, EUR/USD, 10Y UST). The core surfaces:

1. **Front page** — an editorial home: greeting ("Good morning."), a lead story
   with a *NOW vs THEN (historical overlay)* chart, a Market recap card, a
   Watchlist placeholder, a Mini calendar of events, and a top-companies screener
   preview.
2. **Company search / screener** — a filterable list ("4,904 public companies").
   Each row carries ticker, name, price, change, a sparkline, and action icons.
   Hovering/clicking the **eye** opens an inline *preview popover* with a
   mini supply-chain and a history-analogue read.
3. **Supply chain network** — the product's signature diagram: **"the
   principle"** (the company you're looking at) sits centered as a forest-green
   block, with **inputs/dependencies** on the left (suppliers, plus dashed
   *external factors* like oil, FX, shipping) and **customers/channels** on the
   right. Stroke width encodes dependency strength; competitors hang below.
4. **Company dashboard** — tabbed: **Overview · Supply chain · Financials ·
   Patents · History**. Each tab leads with an editorial headline ("Apple Inc. —
   what they actually do.") then quick-facts, charts, revenue mix, leadership.
5. **History / the Memoir** — the analogue engine. "When other companies looked
   like AAPL does today — here's what happened next." A ranked table of similar
   historical events (MSFT '14, JNJ '10, IBM '92…) with match %, 5Y return, and
   an outcome label (CLOSEST / ECHO / MIXED / WARNING), plus a base-rate card
   (Bull P75 / Base P50 / Bear P25) and a "what matches / what's different" split.
6. **Read memoir** — the founding note: a centered, broadsheet-quiet statement of
   *why the product exists* (history as the lens on today's markets), set as a
   pull-quote with a byline. Reached from the *Read memoir* rail item.

A shared **footer** (divider · *Veridian Markets* wordmark · `HISTORY, READ
FORWARD`) closes every surface.

---

## CONTENT FUNDAMENTALS — how Veridian writes

Veridian's voice is the heart of the brand. It sounds like a **literate markets
columnist** who happens to have a terminal open — confident, dry, faintly
literary, never hype. The product name says it: a *memoir* of the markets.

**Voice & tone**
- **Editorial, declarative, story-first.** Headlines are full sentences with a
  point of view, often with an em-dash turn: *"Oil at $83 — and an echo from
  1973 we'd rather not hear."* · *"Apple Inc. — what they actually do."* ·
  *"The hardware company that quietly became a software company."*
- **Plain-spoken, slightly wry.** It explains, it doesn't sell. *"Click any node
  to open that side of the chain."* · *"Not a forecast — a base rate."*
- **History as the through-line.** Almost every screen reaches backward: "5-YEAR
  LENS", "THEN (1973)", "reads like MSFT in 2014", "the 1992 IBM analogue says…".
- **Honest about uncertainty.** Disclaimers are part of the voice, not legal
  boilerplate: *"Base rates only. Not advice. Not a target — a base rate."*

**Person & address**
- Speaks **to the reader as "you"** and about itself sparingly. Greets directly
  ("Good morning."). Uses "we" for the product's own method: *"We find the
  closest historical pattern matches and weight their outcomes."*

**Casing & punctuation**
- **Headlines:** sentence case, serif, end in a period like a printed lede.
- **Kickers / eyebrows:** ALL-CAPS monospace, dot-separated, tracked —
  `LEAD · 5-YEAR LENS`, `EXPLORE · 4,904 PUBLIC COMPANIES`,
  `CLOSEST ANALOGUE · 87% MATCH`, `RISK / REWARD · ANALOGUE-WEIGHTED`.
- **Labels:** tiny ALL-CAPS mono — `PRICE`, `MKT CAP`, `QUICK FACTS`, `SECTOR`.
- **The middle dot ` · `** is the workhorse separator everywhere (metadata,
  breadcrumbs, captions). Em-dashes carry the editorial turns.
- Numbers are **terse and real**: `$308.82`, `+1.26%`, `$4.54T`, `P/E 37.36`,
  `87% match`, `+612%`. Tickers are bare and uppercase (`AAPL`, `2317.TW`).

**Vibe**
- Almanac / broadsheet / archival. Calm, warm paper, ink, and one good green.
  Think *Financial Times* meets a Moleskine meets a quant's notebook.

**Emoji:** none. Ever. The brand's "emoji" is the monospace middle-dot and the
sparkline.

**Worked examples** (lift these patterns):
- Kicker → headline → lede:
  `5-YEAR LENS · WHAT HISTORY SAYS` / **"When other companies looked like AAPL
  does today — here's what happened next."** / *"We find the closest historical
  pattern matches and weight their outcomes. Not a forecast — a base rate."*
- Outcome labels: `CLOSEST` · `ECHO` · `MIXED` · `WARNING` (rust for the bad
  ones).
- Caption under a chart: *"Brent · 1973 overlay"* / *"AAPL · 5Y with dividends,
  splits, key events"*.

---

## VISUAL FOUNDATIONS

The look is **warm editorial print**: cream paper, warm-black ink, a single deep
teal, and a terracotta accent. It deliberately avoids the cold neon of a typical
trading UI. Almost everything is type, hairline rules, and line-art charts.

**Color**
- **Paper, not white.** Surfaces are warm creams: page `#F4F1E8`, cards
  `#FBF9F3`, inset bands `#ECE7DB`. The left chrome rail is a cool blue-grey
  `#E7ECED` — the only cool note, which makes the paper feel warmer.
- **Ink, not black.** Text is `#1F1D1A` (warm near-black) → `#4A4640` →
  `#8A857D` → faint `#B6AFA2`.
- **One green does the heavy lifting.** Brand teal `#2D5E5A` for links/active;
  the deep forest `#1D4E3A` is reserved for **"the principle"** block and hero
  fills; `#0F6E56` for positive numerals.
- **Terracotta `#C46A3B`** is the only warm accent — kickers, external-factor
  nodes, the calendar "today" outline, warnings.
- **Market semantics:** up = green (`#1D9E75` line / `#0F6E56` text), down =
  rust-red (`#C0563B` line / `#A32D2D` text). Never bright red/green.
- **Supply-chain node colors:** inputs = plain paper card with a **blue**
  left-rule (`#185FA5`); customers = **blue tint** (`#E6F1FB`); external factors
  = **dashed terracotta** outline; the principle = **forest fill** with cream
  text; competitors = faint dotted outline.

**Type** (see `colors_and_type.css`)
- **Spectral** (literary transitional serif) for *everything editorial* —
  oversized tickers, headlines, ledes, prose, italic captions.
- **JetBrains Mono** for *everything machine* — tickers in tables, prices,
  percentages, ALL-CAPS kickers, labels, eras, the index strip.
- The serif↔mono pairing **is** the brand. Serif = story; mono = data.

**Spacing & layout**
- 4px base scale. Generous editorial margins; content sits on an implied
  multi-column grid (broadsheet). Dashboards use a 2–3 column card mosaic.
- A persistent **rail (≈190px)** + **index strip** frame every screen.
- Layout rules are drawn with **hairline and dashed/dotted rules** rather than
  filled dividers — very newspaper. `repeating` dotted leaders connect a label
  to its value.

**Backgrounds**
- Flat warm paper. **No gradients, no photos, no textures, no blur.** Imagery is
  represented by **diagonal-hatch placeholders** (`repeating-linear-gradient`)
  and by **line-art charts** (sparklines, fan charts, NOW/THEN overlays). The
  product ships essentially illustration-free.

**Charts & data-viz**
- Thin strokes (1.2–2px). Solid line = NOW, **dashed** line = THEN/history.
- Fan charts for base rates (bull/base/bear bands in teal tint).
- Sparklines everywhere (green up / rust down). Tabular-nums always.

**Borders, cards & elevation**
- Cards: thin warm-ink hairline border (`rgba(31,29,26,0.10–0.18)`), small
  radius. Two radius personalities coexist in the source: **square-ish (4–6px)**
  for terminal/table chrome and **rounded (10–12px)** for the "rounded" variant.
  Default to `--vm-radius-md (8px)`; use 12px for soft cards, 0–4px for dense
  data tables.
- Elevation is **low and papery**: either a 2px hard "printed" offset shadow
  (`--vm-shadow-flat`) or a soft card shadow. Only the **preview popover** lifts
  meaningfully (`--vm-shadow-pop`).
- Pills: fully-rounded (`999px`) for search, filters, and toggles.

**Motion**
- Restrained and functional. Preview rows expand with an eased `max-height`
  transition (~0.28s). Nodes do a tiny spring nudge (`cubic-bezier(.34,1.56,.64,1)`)
  and fade-in on mount. No bounce on UI chrome, no parallax, no decorative loops.

**Hover / press states**
- **Hover:** background lifts one paper step (`paper → paper-warm`) and/or border
  darkens one step. List rows tint to `paper-warm`. Icon buttons gain a border
  and ink up.
- **Active/selected:** filled with brand teal (white text) for primary toggles
  (e.g. the active eye/target button), or a teal tint + teal left-edge for
  selected rows; nav items use a teal underline or a teal pill.
- **Press:** subtle — slight darken; node action buttons scale ~1.1 on hover,
  not press.

**Transparency / blur:** essentially unused. The system is opaque paper. The
only translucency is in border colors (ink at low alpha) and chart fills
(`fill-opacity ~0.12`).

---

## ICONOGRAPHY

Veridian uses **[Tabler Icons](https://tabler.io/icons)** — a 24×24, ~1.6px
stroke, rounded-join outline set, rendered via the Tabler **icon webfont**
(`<i class="ti ti-eye">`, `ti ti-search`, `ti ti-adjustments-horizontal`,
`ti ti-external-link`, `ti ti-currency-dollar`, `ti ti-lock`,
`ti ti-arrow-right`, `ti ti-chevron-down`).

- **Stroke style:** thin (1.6px), outline only, rounded caps/joins — it matches
  the hairline, line-art feel of the charts. Icons are inked in `--vm-ink-2`,
  going to `--vm-ink` on hover, or cream on filled teal buttons.
- **Signature glyphs:** `ti-eye` / `ti-target` (the *preview* affordance),
  a **network/share node** glyph (`ti-binary-tree` / `ti-affiliate` — the supply
  chain), `ti-chevron-right` (open/expand), `ti-search`, `ti-adjustments-horizontal`
  (filter), `ti-calendar`, `ti-lock`, `ti-currency-dollar`.
- **Sizing:** 14–18px inside pills/rows, drawn in ~30px square icon-buttons with
  a hairline border.
- **No emoji. No unicode pictographs** beyond functional arrows (`→ ↑ ↓ ›`),
  the **middle dot `·`**, the keyboard glyph `⌘`, and the search `⌕`.

**How to use icons in this system:** link Tabler from CDN —
`<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3/dist/tabler-icons.min.css">`
then `<i class="ti ti-eye"></i>`. The UI kit (`ui_kits/web/`) does exactly this.

**Brand mark:** there is no logo image. The brand is a **typeset wordmark** —
*Veridian* in italic Spectral teal + **Memoir** in roman Spectral ink, with the
mono tagline `history-led finance` beneath. See `.vm-wordmark` in
`colors_and_type.css` and the `Masthead` component in the UI kit.

---

## FONTS — note

The product's two families, **Spectral** (literary serif) and **JetBrains Mono**,
are both on Google Fonts and load from there at the top of `colors_and_type.css`.
An uploaded `fonts/times.ttf` is kept in the repo as an alternate serif option but
is **not** currently wired in — the system uses Spectral. To self-host, drop
licensed `woff2` files in `fonts/` and swap the `@import` for `@font-face` rules.

---

## DATA & ARCHITECTURE — forward plan

veridianmarkets.ai is the **real product**, not a throwaway demo. Two things follow
from that and should shape how new code is written:

**Real data, via external APIs.** Every number in the kit today is mock /
illustrative (`ui_kits/web/data.jsx`, *"not market data"*). Live quotes,
fundamentals, supply-chain links, and the historical-analogue series will come from
**external APIs**. Therefore:
- Keep all data access behind a **clean seam** — components read from the `VM_*`
  data module, never from hard-coded literals inline. That lets mock data be
  swapped for live API calls (and later, server responses) without touching views.
- Assume data is **async and can fail** — design for loading and empty/error states
  even while we're still on mock data.

**Backend on AWS.** Auth (Sign in → gated My Portfolio), API keys / request
proxying, and caching will live on **AWS**. **No secrets or API keys in the
client** — they belong behind an AWS endpoint. Treat the current CDN-React +
in-browser-Babel setup as a prototype shell that will graduate to a real build
(e.g. Vite) and a proper backend as the foundations progress.

> Day-to-day working conventions, the section / **Toolbar Menu** registry, and the
> branch-naming scheme live in [`CLAUDEMemory.md`](CLAUDEMemory.md). Product and
> business context lives in [`Businessplan.md`](Businessplan.md).

---

## RUNNING & PREVIEWING LOCALLY

The product surface (`ui_kits/web/index.html`) is a **CDN React + in-browser
Babel** prototype: it loads React from a CDN and pulls the local `.jsx`
components in over HTTP. That means it **must be served over HTTP** — opening the
file directly (`file://`) fails, because the browser blocks the `.jsx` fetches.

A dependency-free static server ships at repo root: `dev-server.mjs`. It uses
only Node's built-in modules (no `npm install`).

**To preview:**
```bash
node dev-server.mjs            # serves the repo root on http://localhost:3000
node dev-server.mjs 8080       # optional: pick another port
```
Then open **http://localhost:3000/ui_kits/web/index.html** (design-system
specimen cards live at **/preview/**).

**Iteration loop — no build step.** Edit any `.jsx` in `ui_kits/web/` or the
tokens in `colors_and_type.css`, **save**, then **refresh the browser**. Babel
transpiles the JSX in-browser on load, so a refresh is all that's needed. (There
is no auto-reload yet; a Vite migration would add that plus real bundling when
the prototype outgrows the CDN/Babel approach.)

**Environment notes (recorded 2026-05-28):**
- **Node.js 24.16.0** was installed locally for this (npm 11.13.0).
- This network does **TLS interception**, so `npm install` fails with
  `UNABLE_TO_VERIFY_LEAF_SIGNATURE` and `winget`'s `msstore` source throws a cert
  error. Workarounds: prefer Node built-ins (as `dev-server.mjs` does); for npm
  use `NODE_OPTIONS=--use-system-ca` or `npm config set cafile <corp-root-ca>`;
  for winget pin `--source winget`.
- **Workflow:** changes are made on **feature branches** (not committed straight
  to `main`).

---

## INDEX — what's in this folder

| Path | What it is |
|---|---|
| `README.md` | This file — context, voice, visual foundations, iconography, index |
| `index.html` | Repo-root entry point — redirects into `ui_kits/web/` (the site's front door when served from the root) |
| `dev-server.mjs` | Zero-dependency Node static server for local preview (see *Running & previewing locally*) |
| `colors_and_type.css` | All design tokens (color, type, spacing, radius, shadow) + semantic type classes and the original product's token aliases |
| `fonts/times.ttf` | The brand serif (Times New Roman), wired as `VM Serif` via `@font-face` |
| `SKILL.md` | Agent-Skills manifest so this system can be used as a downloadable skill |
| `preview/` | Small HTML specimen cards that populate the Design System tab (color, type, components, etc.) |
| `ui_kits/web/` | High-fidelity, click-through recreation of the Veridian Markets web product — `index.html` plus modular JSX components |
| `scraps/` | Raw extraction working files (PDF page renders, decoded wireframe JSX). Reference only — not part of the system |

### UI kits
- **`ui_kits/web/`** — the one product surface. Front page, Company search +
  eye-preview, Supply chain network, Company dashboard (Overview), the
  History / Memoir analogue view, and the Read-memoir founding note — as an
  interactive prototype with a shared footer on every screen.

---

## Changelog

### 2026-07-18 (payments-1.2 — portal + admin access)

- **Billing portal (cancel / switch).** New **`vm-billing-portal`** Lambda
  ([`lambda/billing/portal/`](lambda/billing/portal/)) verifies the Cognito JWT, looks
  up the user's stored `stripeCustomerId`, and opens a **Stripe Customer Portal**
  session. Wired to a **"Manage / cancel subscription"** button in Settings
  ([`billing.jsx`](ui_kits/web/billing.jsx) `vmOpenPortal` + [`AccountSettings.jsx`](ui_kits/web/AccountSettings.jsx)).
- **Admins bypass the paywall** — `isPaying` now also true for admins, so News /
  Calendar / Dependency map open regardless of plan.
- **Fixed** a pre-existing crash: `StList` used `planTier` without receiving it as a
  prop (blanked the Settings menu on direct `/settings` load). _(branch: `payments-1.2`)_

### 2026-07-17 (generic Finnhub proxy + extra calendars)

- **`vm-finnhub` — one generic caching proxy** for many free Finnhub GET endpoints
  ([`lambda/marketdata/vm-finnhub/`](lambda/marketdata/vm-finnhub/)): call `?endpoint=<key>`;
  per-endpoint TTL baked in (no env var), one table `vm-finnhub` (key `pk`). Serves
  ipo-calendar, fda-calendar, market-status, market-holiday, insider-sentiment,
  usa-spending, lobbying, sec-filings.
- **Extra calendars on the Calendar page** ([`calendars.jsx`](ui_kits/web/calendars.jsx)):
  **IPO**, **FDA** advisory committees, and **market holidays** now render as their own
  colour-coded event types (filter chips, legend, day panel, ⓘ education) alongside
  earnings. _(branch: `api-links-2.1.1`)_

### 2026-07-17 (Finnhub data build-out)

Six cached Lambdas + frontend wiring, all read-through DynamoDB caches (key `pk`,
Function-URL CORS off, 30s timeout). See [`finnhub-roadmap.md`](finnhub-roadmap.md).

- **Symbol search.** `vm-search` (Finnhub `/search`) → [`symbolsearch.jsx`](ui_kits/web/symbolsearch.jsx)
  `SymbolSearchBox` live dropdown on Home + Search: curated companies then the whole
  US universe. Any ticker opens a dashboard — non-curated ones get real price +
  financials, honest placeholders elsewhere. _(branch: `symbolsearch`)_
- **Company profile + metrics.** `vm-profile` (`/stock/profile2` + `/stock/metric`) →
  [`profile.jsx`](ui_kits/web/profile.jsx): real header mkt cap · P/E · yield (kills the
  hardcoded `37.36`), `LiveMetrics` panel on every Overview, `ProfileOverview` for
  searched tickers. _(branch: `profile`)_
- **Market + company news.** `vm-news` (`/news` + `/company-news`) →
  [`newsfeed.jsx`](ui_kits/web/newsfeed.jsx): real Home story tiles, News page (links to
  source), company News tab + a live "Latest headlines" strip. _(branch: `news`)_
- **Company signals.** `vm-signals` (recommendation · earnings · peers · insider) →
  [`signals.jsx`](ui_kits/web/signals.jsx) `SignalsPanel` in the Overview; the Screener
  **Analyst filter is now live** (`useVMConsensus`). _(branch: `signals`)_
- **Real patents.** `vm-patents` (`/stock/uspto-patent`) → [`patents.jsx`](ui_kits/web/patents.jsx)
  `PatentsLive`: stat row, title-classified technology breakdown, filing trend, recent
  patents. _(branch: `patents`)_
- **Earnings calendar.** `vm-earnings-cal` (`/calendar/earnings`, ranked by revenue) →
  [`earningscal.jsx`](ui_kits/web/earningscal.jsx): the month's biggest reporters on the
  Calendar grid + day panel + list. _(branch: `earnings-calendar`)_

### 2026-07-14 (financials as reported)

- **Real financial statements (SEC filings via Finnhub).** The company **Financials**
  tab now shows **as-reported** Income / Balance / Cash-flow figures (USD millions)
  when available, falling back to the illustrative mock otherwise (a source line marks
  which). New [`financials.jsx`](ui_kits/web/financials.jsx) maps raw **us-gaap concepts**
  → the curated rows (by concept, so periods/companies line up), so the existing %Δ/$Δ
  toggles and CSV/Excel export work unchanged. Backed by a **read-through cache**:
  **`vm-financials`** Lambda ([`lambda/marketdata/vm-financials/`](lambda/marketdata/vm-financials/))
  caches Finnhub `/stock/financials-reported` in DynamoDB (`vm-financials`, 24h TTL,
  8 latest filings, payload as one JSON attr). US filers only. _(branch: `financials-1.1`)_

### 2026-07-14 (market data: live quotes)

- **Live prices (Finnhub, cached).** Real-time US-equity quotes now drive the
  company header, **Home**, and **Search**, shown in **USD** with a green live dot.
  New [`marketdata.jsx`](ui_kits/web/marketdata.jsx) (`vmQuotes` / `useVMQuotes` /
  `vmApply`, 2-min client cache, non-equities left as mock). Backed by a
  **read-through cache**: **`vm-quote`** Lambda ([`lambda/marketdata/vm-quote/`](lambda/marketdata/vm-quote/))
  serves a DynamoDB-cached quote (`vm-quotes`, 2-min TTL) or fetches from Finnhub on
  a miss — one fetch serves every user, ≤1 Finnhub call per symbol per 2 min. Finnhub
  key stays server-side; CORS handled in code (Function URL CORS off); Lambda timeout
  30s for bulk requests. Guide: [`marketdataapi.md`](marketdataapi.md). _(branch: `marketdata-1.1`)_

### 2026-06-30 (backend: auth + payments)

- **Real sign-in (AWS Cognito).** Replaced the client-side placeholder auth with
  real Cognito: new [`auth.jsx`](ui_kits/web/auth.jsx) (`VM_AUTH` + `cognito()` REST
  helper, public app client, no SDK/build step) and a five-mode [`SignIn.jsx`](ui_kits/web/SignIn.jsx)
  (sign in / sign up / confirm code / forgot / reset). `app.jsx` session/refresh now
  Cognito-driven; sign-out returns to the landing page; admin role = Cognito group.
  Guide: [`backend-signin.md`](backend-signin.md). _(branch: `backend-signin-AWS-1.1`)_
- **Payments & paywall (Stripe).** News / Calendar / Dependency map are now gated
  behind a paying plan — non-payers see a lock and hit an **/upgrade** page
  ([`Pricing.jsx`](ui_kits/web/Pricing.jsx)); Settings → Subscription wired to the same
  flow. Shared [`billing.jsx`](ui_kits/web/billing.jsx) config. **Real Stripe** (test):
  Payment Links → **`vm-billing-webhook`** Lambda records the plan in DynamoDB →
  **`vm-billing-status`** Lambda returns it → the app unlocks. Lambdas in
  [`lambda/billing/`](lambda/billing/); guide: [`payment.md`](payment.md). Portal +
  single-customer checkout deferred to pre-launch. _(branch: `payments-1.1`)_

### 2026-06-30 (analysis-tools)

- **Admin Analytics tab — operator analytics suite.** Replaced the Admin **Heatmap**
  tab with an **Analytics** tab (the heatmap lives on as a sub-tool inside it). Seven
  sub-tools, all derived deterministically from the mock `VM_USERS` dataset: **Retention**
  (cohort grid + average curve), **Growth** (growth accounting — Retained/New/Resurrected/
  Churned with the Quick Ratio), **Funnel** (visitor→signup→activated→paying→retained),
  **Revenue** (MRR/ARPU/LTV/LTV:CAC, MRR-movement waterfall, 12-mo trend, NRR/GRR, plan
  movement), **Engagement** (DAU/WAU/MAU, stickiness, L28 power-user curve, top pages),
  **Churn risk** (scored "save list" of at-risk paying accounts + CSV export), and the
  existing **Heatmap**. _(branch: `analysis-tools-2.1`)_

### 2026-06-11

- **Code cleanup 2.1.** Multi-file cleanup pass across all 23 JSX source files —
  no feature changes, only code quality. Highlights: hoisted `TUTORIAL_BTN_STYLE`
  constant (removed 5 identical inline definitions in Dashboard); extracted `catLabel`
  and `initials` helpers to module scope in Learn/AccountSettings; added `A_PLAN_PRICE`
  and `DAY_MS` constants to AdminPanel module scope; fixed `riskTier`/`risk` field name
  inconsistency in MyBusiness import; fixed import-legend dedup to filter by label not
  type key; removed `previewIds` alias, several unused parameters, and duplicate JSX
  comments; simplified `deltaCols` arithmetic and a redundant nested `if` guard; added
  `patternMatch[0]?.note` optional chain. Data fixes: AAPL patents.cats now sum to 100,
  AMZN revenueMix sums to 100, NVDA analogue match corrected 64 → 70, "Grovee's" typo
  fixed to "Grove's", GOOGL/AMZN filings last entries flagged `partial:true`.
  _(branch: `code-cleanup-2.1`)_

- **Admin refinement 2.1 — clickable KPI/chart cards + CSV download.** The Admin
  Overview tab's KPI tiles and chart sections are now **clickable**: each opens a
  focused drill-down modal with the full breakdown (e.g. the "Paying accounts" card
  opens a modal with revenue by plan, conversion rate, ARPU, ARR, and a list of recent
  paying signups; the "Est. MRR" card breaks down MRR by plan and country; chart modals
  show the underlying distribution data). All admin modals now include a **Download CSV**
  button so the data can be exported. _(branch: `admin-refinement-2.1`)_

- **My Business 2.1 — UX polish, Analysis / Impact / Signals tabs, and Import.**
  The My Business page received a UX pass and three new editor-panel tabs:
  **Signals** (mock market signals relevant to each node — news, price, risk flags),
  **Impact** (how each dependency flows back to your principle — concentration,
  contract risk, upstream/downstream exposure), and **Analysis** (an AI-ready panel
  that will call the Claude API to analyse the full map; placeholder text for now).
  A new **Import** button opens a spreadsheet-import flow: drag a CSV/Excel file, see
  it parsed into a preview table with inline error highlighting (required-field errors,
  invalid values, duplicates, format warnings), and confirm to add valid rows as nodes.
  _(branch: `my-business-2.1`)_

### 2026-06-10

- **My Business 2.1 — Tidy button.** Added a **Tidy** button to the My Business
  toolbar that auto-arranges all nodes into evenly-spaced columns (suppliers/external
  on the left, customers on the right) so the canvas snaps to a clean layout in one
  click. _(branch: `my-business-2.1`)_

- **Learn 2.2 — Tutorial overlays for Dependency Map and Admin panel.** Extended the
  interactive tutorial system to the **Dependency Map** (supply-chain canvas, node
  controls, full-screen mode, breadcrumb drill) and the **Admin panel** (Overview KPIs,
  Users table, Courses tab). Each gains a terracotta "Tutorial" button that steps
  through the relevant `[data-tour="…"]` targets with highlight boxes and explanatory
  text. _(branch: `learn-veridian-markets-2.2`)_

- **Learn 2.1 — Tutorial overlays on every major page and tab.** Added interactive
  **step-by-step tutorial overlays** (`TutorialOverlay`) to every major page: Front
  page, Search/screener, Company dashboard (all tabs — Overview, Supply chain,
  Financials, Patents, History), News, Calendar, History, Learn, My Portfolio, Account
  Settings, and My Business. Each page gets a terracotta "Tutorial" button that walks
  users through the interface one stop at a time, with a spotlight highlight and a
  short explanation per step. _(branch: `learn-veridian-markets-2.1`)_

### 2026-06-09 (business)

- **Personal ⇄ Business mode + My Business map builder.** The left rail gains a
  **Personal / Business** toggle (persisted) and a new **My Business** item. Business
  mode opens a new **signed-in-only** page (`/my-business`) where a company builds its
  **own dependency map**: the firm sits at the centre with **draggable** supplier
  (blue), external-factor (coral) and customer (teal) nodes, **curved connectors that
  redraw live**, and a side-panel editor (name / ticker / role / note / type + delete).
  Add / clear / reset, plus **Save** to `localStorage`. Mobile gets a tap-to-edit list
  fallback. Mock persistence until the AWS backend. _(branch: `business-page-2.8`)_

### 2026-06-09 (financials)

- **Financials export + educational Calendar events.** The company **Financials**
  tab gains an **Export** button → a two-step popup: pick **CSV** or **Excel**, then
  choose which statement(s) — Income / Balance sheet / Cash flow, **multi-select**
  with Select-all — toggle the **%Δ / $Δ** change columns, and see a live **preview**
  of the output. Exporting multiple statements writes **separate tabs** in Excel and
  **stacked sections** in CSV; **%Δ** is stored as a fraction (pre-formatted as `%`
  in Excel) so a "%" cell format reads `1.5%`, not `150%`. On the **Calendar** (List
  + Month views) each event now has an **ⓘ** button that opens a plain-English
  explainer: what the event is, how it moves markets, and a **bullish vs bearish**
  (or "what to watch") breakdown with the impact level. All mock data.
  _(branch: `financials-2.7`)_

### 2026-06-08 (indices)

- **Indices, commodities & forex — asset-class-aware maps + search.** Added the S&P
  500, gold, oil and major FX pairs to **Search** (the heading is now "Search."). The
  Dependency map adapts to what you're looking at: **commodities/forex** show what it
  takes to produce them and the **sectors** that consume them; an **index** shows a
  **family tree** of its constituents by sector — tap any company to preview it (now
  with full financial statements) or open its dashboard. The dashboard **breadcrumb**
  records your drill path (Search › SPX › Supply chain › AAPL › Financials), each step
  clickable. Plus: clickable tickers in Search, bigger green-on-hover row actions,
  tab hover highlights, and a fix for the dependency-map connector arrows not always
  drawing. _(branch: `indices-2.6`)_

### 2026-06-08 (later)

- **Dependency-map tabs, news filters, financials deltas, and a global AI assistant.**
  The full-screen dependency map drops the redundant "Supply chain" tab and defaults
  to Overview. Its **News** view gains a two-tier filter (Upstream supply vs Customer
  demand, each with sub-categories). The **Financials** table adds **%Δ** and **$Δ**
  toggles that insert change-vs-prior-period columns (green up / orange down) under a
  merged range header, can be **dragged with the mouse** to scroll, and gets a
  **Legend** popup. Plus a sticky bottom-right **AI assistant** bubble (a Times New
  Roman "Q") that expands into an "Ask Veridian AI…" bar — placeholder for now, ready
  for the Claude API. _(branch: `dependency-map-2.5`)_

### 2026-06-08

- **Calendar: list view, legend, and month/week navigation.** The Calendar gains a
  **Month / List** toggle — List shows an economic-calendar-style table (date, time,
  region, impact, event, actual, forecast, previous) grouped by day. A **Legend**
  button (key icon) opens a popup explaining every column, the impact levels, and the
  event types. The month grid's **‹ ›** arrows now change month, and the list view has
  its own **Week / Month** period navigator. Mock data (events seeded in June 2026).
  _(branch: `calendar-update-2.4`)_

### 2026-06-07

- **Every page made mobile-compatible.** A responsive pass across the whole app so
  each page fits a phone without horizontal scrolling: multi-column layouts stack to
  a single column, control rows wrap, headings scale down, and wide data tables
  (admin users, financial statements) scroll inside their own box. Covers the admin
  panel, company dashboard (incl. the History sub-panels and News), portfolio,
  account settings, sign-in, memoir, calendar, news, search, learn and the front
  page — plus a bottom-bar "Download App" prompt on mobile. Desktop is unchanged.
  _(branch: `mobile-compatibility-2.3`)_

- **Dependency map + a broad mobile pass.** The supply-chain page became the
  **Dependency map**: suppliers/customers are grouped into database-ready categories
  (companies, manufacturing, commodity, materials · carriers, retail, resellers…),
  each node has **preview** + **make-principle** actions, and there's a **full-screen**
  view (fills just the content area) with filters and the drill breadcrumb up top and
  the company's **dashboard tabs** (Overview…News) stacked **below the map** — scroll
  down to read them, tabs stay pinned at the top. **Mobile:** the map becomes a stacked
  tap-to-open list; **Search** rows become cards (tap once to select, again for
  Preview/Dashboard); the **company dashboard** is fully responsive (stacked header,
  drag-scroll tabs with no scrollbar, mobile map); and a **"Download App for Complete
  Experience"** bar shows on mobile. All mock data. _(branch: `supply-chain-live-2.2`)_

### 2026-06-01

- **Calendar + News pages, plus home/search refinement.** New **Calendar** and
  **News** pages (in the Explore menu, clean URLs). News is an editorial feed with
  search, category filters, a featured lead, and an **article overlay**; it's
  reused on the home "Global News" tiles and a new company-dashboard **News tab**.
  Home gains a **learning banner** (Resume/Start). The Search page's rows now hover
  exactly like the home list, and its filter chips became **dropdowns** (add /
  remove / clear all). Rail tidy-up: removed History, "My portfolio" → **My
  Account**, Settings + Sign out pinned to the bottom when signed in. Company-page
  breadcrumb → `Search › TICKER › Tab`. All mock data. _(branch:
  `calendar-and-news-pages-1.1`)_

- **Front-page refinement (Foundation 2).** The home "Find a company" list:
  removed the supply-chain action button; aligned the header columns with the
  data + added a **CHANGE** label; the **eye** button now opens the same inline
  company preview as the Search/screener page (tabs, supply-chain, history); rows
  lift into a hover-box (also applied to the Search page rows for consistency).
  Copy tweaks: heading → **"Search."**, kicker → "4,904 public companies" and
  **"Global News"**. _(branch: `home-page-2.1`)_

### 2026-05-31

- **Account settings page.** A grouped settings list (Instagram "Settings and
  activity" pattern, in our editorial style): profile summary + sections (Your
  account, How you use Veridian, Privacy & data, Support, danger), each row opening
  its own sub-page (profile, password & security, subscription/plans, connected
  accounts, notifications, appearance, privacy, and more). The rail **Settings**
  item shows only when signed in. **Temporary testing bypass:** the app
  auto-signs-in as admin and skips the sign-in page (clearly marked in `app.jsx`,
  to be reverted before real auth). _(branch: `account-settings-1.17`)_

- **Added `MOBILE.md` — the plan for taking the app to iOS/Android.** Captures the
  recommended path (Expo / React Native), the design/Figma approach, the
  one-repo-→-monorepo strategy (don't duplicate), how the GitHub workflow changes
  for app releases, the Mac setup checklist, and the first running milestone.
  Planning only — no app code yet. _(branch: `docs/mobile-plan`)_

- **Data export tool.** `tools/export-data.mjs` (no dependencies) turns the mock
  database into flat tables in `data_exports/` — `users.csv` (100 users + profit
  columns), `companies.csv`, `courses.csv`, plus a `users.md` Markdown table for
  a quick column view in VS Code's preview. Recommended VS Code CSV extensions are
  in `.vscode/extensions.json`. Run `node tools/export-data.mjs` to refresh.
  _(branch: `database-infrastructure-1.16`)_

- **Admin control panel (admin-only).** A role-gated `/admin` page with three
  tabs: **Overview** (user-metrics dashboard — KPIs, signups chart, plan donut,
  top countries), **Users** (a temporary 100-user database; searchable table where
  each row's ⋮ menu opens a full account-details modal with **personal profits**,
  a simulated **Access account** impersonation banner, and mock admin actions),
  and **Courses** (add/remove courses that appear live on the Learn page via a new
  localStorage course store). All data is mock — a stand-in for the real AWS
  backend. _(branch: `admin-backend-access-1.13`)_

- **My Portfolio — customisable dashboard.** Built out the gated portfolio page:
  a **Connect-accounts** bar (Trading 212 + Interactive Brokers, Robinhood,
  Coinbase, Vanguard, Binance — mock connect), then widgets for **Summary** KPIs,
  a **Performance** area chart with range toggles, an **Allocation** donut,
  **Holdings**, **Watchlist**, and **Analogue alerts**. A **Customise** mode lets
  you show/hide, reorder and resize widgets; the layout and connections persist
  in `localStorage`. All figures are mock data. _(branch: `portfolio-1.12`)_

- **Real per-page URLs + the app now lives at the site root.** The root
  `index.html` is the app (was a redirect to `/ui_kits/web/`); each Toolbar Menu
  page has its own clean URL via the History API — `/`, `/sign-in`, `/portfolio`,
  `/supply-chain`, `/search`, `/history`, `/memoir`, `/learn`, and
  `/company/<ticker>`. Back/forward and document titles track the route. Deep
  links survive a hard refresh on GitHub Pages via the standard `404.html` SPA
  redirect; the local `dev-server.mjs` got a matching fallback. The old
  `/ui_kits/web/` path now redirects to `/`. _(branch: `backend-update-1.10`)_
- **Placeholder sign-in (admin account).** The Sign-in form now authenticates
  against a client-side account list and persists the session in `localStorage`
  (survives refresh); the rail shows the signed-in email and a Sign-out action,
  and `/portfolio` unlocks once signed in. **This is not real security** — the
  account ships in public client code (password stored only as a SHA-256 hash);
  it is a stopgap until AWS Cognito. _(branch: `backend-update-1.10`)_
- **History page — prompts restyled to a plain bullet list.** The History
  search/"ask" hub now shows its example prompts as a simple bullet list (was
  boxed cards), with a written-out "Prompts" heading, to match the agreed design.
  Bullets underline + turn teal on hover and drop into the search box on click;
  the four prompts (oil↔Apple, Apple share-price, Apple supply-chain history,
  residential construction costs) are unchanged. _(branch: `history-page-1.11`)_
- **Built the Learn page.** Filled the blank Learn scaffold with a course/guide
  catalogue: learn finance, markets and business management — plus how to use
  Veridian itself. A "New here?" guided-path banner links into the app; a live
  **search**, **category pills** (All · Using Veridian · Markets 101 · Finance ·
  Investing · Business management · Economics · Trading · Personal finance ·
  Supply chains · Risk & strategy · Data & charts) and **Level / Format** filters
  drive a responsive **card grid** (colour-coded topic visuals, provider, badge,
  level + length) with **Show more** paging. "App tutorial" cards navigate into
  the relevant screen via `go()`. All 18 courses are mock scaffold data (inline in
  `Learn.jsx`); categories are intentionally broad to cull later. Wired `isMobile`
  into Learn. _(branch: `learn-1.9`)_

### 2026-05-30

- **21:38 — Reworked the History page into a search/"ask" hub.** Replaced the
  analogue-engine layout with a centred **Search** page: a "you can search at any
  time" hint pill, a rounded search bar (submit is a scaffold — no backend yet),
  and a **Prompts** list of clickable example questions that fill the box. The
  analogue data stays in `data.jsx`. _(branch: `history-page-1.8`, not yet on main)_
- **18:59 — Shipped the SCN dependency map to main** (live on veridianmarkets.ai;
  still a work-in-progress — breadcrumbs + company-page entry points to follow).
  _(branch: `scn-live-demo-1.6`)_
- **18:39 — New interactive Supply-chain dependency map.** New page `ScnLiveDemo.jsx`:
  a "principle" company centre node with
  inputs/external dependencies on the left and customers/channels on the right,
  joined by curved SVG connectors. **Hover** for detail tooltips + line highlight;
  **click** any node to make it the principle (drill-down) with a **breadcrumb**
  trail; **filters** (All / Companies / External; 5Y Lens placeholder). It now
  **replaces the old Supply chain network page** — the "Supply chain network" menu
  item (route `supply`) opens this map; `SupplyChain.jsx` is retired.
  _(branch: `scn-live-demo-1.6`)_
- **14:50 — Auto-scrolling, draggable ticker.** The market ticker is now a marquee
  that **auto-scrolls right→left** at a steady pace and **loops seamlessly**; you
  can **grab and drag it** with mouse or finger (pointer-capture, `touch-action`),
  and auto-scroll resumes on release. Removed the `UTC · LIVE` chip.
  _(branch: `update-front-page-1.5`)_
- **14:40 — Mobile pass (front page + chrome).** Below 768px the two-column grid
  **stacks**, padding tightens, story tiles go **single-column** (the pager
  generalises to 9 pages and clamps on resize), and "Find a company" rows simplify
  to ticker · name · price (hover-only icons are desktop-only). Toolbar Menu was
  already a hamburger drawer. _(branch: `update-front-page-1.5`)_
- **14:30 — Time-based greeting moved into the Toolbar Menu.** "Good morning /
  afternoon / evening" (and "It's a bit late, isn't it?" between 11pm–6am) now sits
  **above the "You" group** in the rail. Moved the ticker back to the very top,
  removed the greeting subtitle, and boxed the "Open full screener" link (hover
  shade). _(branch: `update-front-page-1.5`)_
- **14:20 — Front page: "Find a company" preview reworked.** Now shows up to 10
  companies with a live **search box** (filters by ticker/name). Each row reveals
  `eye / supply-chain / open` action icons and **pops out on hover** (scale +
  shadow + highlight), matching the screener. Removed the old subtitle line.
  _(branch: `update-front-page-1.4`)_
- **14:20 — Front page: story-tile grid (3×3) with a centred pager.** Replaced the
  single lead story with a 3×3 grid of 27 tiles across 3 pages. A pager **slides
  the tiles up/down** between pages (same `.38s` easing as the accordion); the
  control keeps **"More ↓" pinned to the centre** while **"↑ Up"** reveals to its
  left with a separator. Tiles **pop out on hover**. _(branch: `update-front-page-1.4`)_
- **14:20 — Front page: right column is now an accordion.** Removed the Watchlist
  card. **Market recap** and **Mini calendar** are mutually-exclusive collapsible
  cards (exactly one open, exact-height animation so the section below never
  bounces); each chevron sits in a **boxed control** that shades on hover.
  _(branch: `update-front-page-1.4`)_
- **14:20 — Front page: greeting/ticker swap + ticker border.** "Good morning."
  now sits **above** the market ticker (front page only); the ticker gained a top
  border to match its bottom. _(branch: `update-front-page-1.4`)_
- **12:23 — Gated *My Portfolio* behind sign-in.** New `myportfolio` route +
  scaffold (`MyPortfolio.jsx`), wired the rail item, and added a placeholder
  `signedIn` flag in `app.jsx`: logged-out visitors are **rerouted to Sign in**.
  The gate is UX-only — see `Businessplan.md` for the AWS (Cognito + API Gateway)
  work needed to make it real. _(branch: `create-sign-in-page-1.3`)_
- **12:17 — New chromeless *Sign in* page.** `signin` route + `SignIn.jsx`:
  renders with **only the green header + footer** (no Toolbar Menu / ticker) and a
  centered login box (email, password, sign-in button — visual scaffold, no auth
  yet). The rail "Sign in" item is wired up. _(branch: `create-sign-in-page-1.3`)_
- **12:10 — Removed the rail's "search tickers, eras" field.** The dashed search
  input at the top of the Toolbar Menu is gone; the nav now starts at the *You*
  group. (The *Search* nav link is unaffected.) _(branch: `update-global-header-1.2`)_
- **12:05 — Added a global header + mobile support.** New full-width **green top
  bar** (`GlobalHeader`) with the Veridian Markets wordmark (= home button) on all
  screen sizes. Below ~768px the **Toolbar Menu collapses into a hamburger** that
  opens it as a slide-in drawer; the duplicate wordmark was removed from the rail.
  The live ticker now sits just under the green bar. (Source: `chrome.jsx`,
  `app.jsx`.) _(branch: `update-global-header-1.2`)_
- **11:47 — Brand rename "Veridian Memoir" → "Veridian Markets" (live files).**
  Swept the product name across `ui_kits/web/`, both `index.html`s, this README,
  and `SKILL.md`. The *Read memoir / Memoir Page* feature keeps its name; archive
  HTMLs were left untouched.
- **11:47 — Added the *DATA & ARCHITECTURE — forward plan* section.** Records that
  the site is the real product, data comes from external APIs behind a clean seam,
  and the backend (incl. auth) runs on AWS — no secrets in the client.

### 2026-05-28

- **21:20 — New "Read memoir" page.** Wired up the previously inert *Read memoir*
  rail item to a new route/page: a centered editorial *founding note* (kicker →
  oversized quote glyph → the founder's statement with teal emphasis →
  rule/diamond/rule divider → byline → "Back to the front page"), built with the
  existing `VM` design tokens and rendered inside `<main>` so the rail + index
  strip stay.
  Source: [`ui_kits/web/Memoir.jsx`](ui_kits/web/Memoir.jsx) (new page),
  [`ui_kits/web/chrome.jsx`](ui_kits/web/chrome.jsx) (rail item),
  [`ui_kits/web/app.jsx`](ui_kits/web/app.jsx) (route),
  [`ui_kits/web/index.html`](ui_kits/web/index.html) (script tag).

- **21:20 — Shared footer on every screen.** Added a `Footer` (divider motif ·
  *Veridian Markets* wordmark · `HISTORY, READ FORWARD`) rendered once in `App`
  so it now sits at the foot of **every** surface.
  Source: [`ui_kits/web/chrome.jsx`](ui_kits/web/chrome.jsx) (`Footer`),
  [`ui_kits/web/app.jsx`](ui_kits/web/app.jsx) (footer mount).

- **20:33 — Masthead wordmark: "Veridian Markets" → "Veridian Markets."** Updated
  the `Masthead` component so the sidebar logo reads *Veridian* (italic teal) +
  **Markets** (roman ink), keeping the same Spectral serif and brand colors.
  Reduced the type from 26px to 20px and tightened the gap/padding so the longer
  name fits inside the 208px left rail instead of overflowing.
  Source: [`ui_kits/web/chrome.jsx`](ui_kits/web/chrome.jsx).
