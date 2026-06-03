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
  there. Everything else is **reference/archive — do not edit unless asked**:
  `Veridian Memoir UI Kit (preview).html`, `uploads/` (original wireframes + brief
  PDF). (`scraps/` was deleted 2026-06-01 as throwaway setup files.)
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
| Sign in                        | **Sign in Page**     | `signin`   | Chromeless page (`SignIn.jsx`): green header + footer + centered login box, **no rail/ticker**. Now wired to a **placeholder client-side auth** (`VM_ACCOUNTS` in `app.jsx`; admin account; SHA-256 hash; session in `localStorage`). **Not real security** — to be replaced by AWS Cognito. |
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

### 2026-06-01

- **Cleanup: deleted `scraps/`** (~6.2M of setup screenshots + extracted PDF page
  images; unreferenced). Kept `uploads/` (original wireframes + brief PDF) and the
  `Veridian Memoir UI Kit (preview).html` as archive. Note: deleting committed
  files doesn't shrink the clone (git history retains blobs) — a history rewrite
  would be needed for that.
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
**Latest branch (this scheme):** `calendar-and-news-pages-1.1` (Calendar + News pages + home/search refinement; **merged to main + live**). ⚠️ Off-scheme name — it was the 2nd Foundation-2 effort so should have been `…-2.2`; the `1.1` is a one-off. Per the **2026-06-01 decision (restart each foundation)**, Foundation-2 branches are strictly `…-2.<n>` from here. Previous: `home-page-2.1` (front page, merged + live). All Foundation-1 branches (through `account-settings-1.17`) merged.

> ⚠️ **Parallel-work numbering clash (2026-05-31):** a laptop worked in parallel and
> reused the counter — `company-profiles-1.13` (alongside `admin-backend-access-1.13`),
> then `learn-1.14`, `learn-1.15`. All merged to main and reconciled here.
> When working on two machines, pull main first to pick the next number, or
> namespace by machine.

**Next free iteration: `<code-name>-2.2`.**  *(Foundation 2 restarts the iteration counter at `.1`.)*

> ✅ Confirmed (2026-06-01): **restart each foundation.** The iteration is a
> running counter *within* a foundation (`x.1, x.2, x.3 …` across all code names)
> and **resets to `.1` when a new foundation begins**. So Foundation 1 ran 1.1–1.17;
> Foundation 2 is 2.1, 2.2, …. (Earlier 2026-05-30 note said the same for F1.)
