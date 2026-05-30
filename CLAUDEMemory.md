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
  `Veridian Memoir UI Kit (preview).html`, `uploads/`, `scraps/`.
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
| Sign in                        | **Sign in Page**     | `signin`   | Chromeless page (`SignIn.jsx`): green header + footer + centered login box, **no rail/ticker**. Auth (AWS) wiring TBD. |
| My portfolio                   | **My Portfolio Page**| `myportfolio` | Gated scaffold (`MyPortfolio.jsx`): reroutes to Sign in when logged out (placeholder `signedIn=false` in `app.jsx`). |
| Supply chain network           | **SCN Page**         | `supply`   | Now the **interactive dependency map** (`ScnLiveDemo.jsx`): principle centre node, inputs/external left, customers right, curved SVG connectors, hover tooltips, click-to-drill + breadcrumb, All/Companies/External filters (5Y Lens = placeholder). Carries the **"• Live Demo"** badge. Old `SupplyChain.jsx` is **retired** (file kept, unreferenced). **Merged to main + live** (2026-05-30 18:59) via `scn-live-demo-1.6`; still WIP (breadcrumbs + company-page entry points to come). |
| Search                         | **Main Search Page** | `screener` | Renamed from "Company search". |
| History                        | **History Page**     | `history`  | Now a **search / "ask" hub** (`History.jsx`): hint pill, big "Search." title, search bar (submit is a scaffold — no backend), and clickable example **Prompts**. Replaced the old analogue-engine layout (analogue data still in `data.jsx`). Built on `history-page-1.8` (not yet merged). |
| Learn                          | **Learn VM**         | `learn`    | Blank scaffold page (`Learn.jsx`); content TBD. |
| Read memoir                    | **Memoir Page**      | `memoir`   | |

Routes map to screens in [`ui_kits/web/app.jsx`](ui_kits/web/app.jsx); labels live
in `RAIL_GROUPS` in `chrome.jsx`. Items with no route are non-clickable
placeholders until their page exists.

---

## Change log

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
  **The entire website is currently on Foundation 1**, so all branch names are
  `…-1.<iteration>` until the product moves to Foundation 2.
- **Iteration** — a running counter *within the current foundation*. It
  increments by 1 for **each new branch** (`1.1, 1.2, 1.3, …`). **Claude adds
  this automatically** — the user trusts me to bump `.1 → .2 → .3`.

**How Claude picks the next branch name (do this automatically):**
1. Foundation = the current foundation (today: **1**).
2. Iteration = the highest existing `…-<foundation>.N` across all branches,
   **+ 1**. If none exist yet for this foundation, start at `.1`.
3. New branch (slug) = `<code-name>-<foundation>.<iteration>`.
4. After creating it, update **"Latest branch"** below and log it in the change
   log (Code Name + full slug + timestamp).

**Current foundation:** 1
**Latest branch (this scheme):** `history-page-1.8` (search hub, not merged). Open branches: `api-link-beta-1.7` (empty, paused), `history-page-1.8`, `learn-1.9`. Merged to main: `scn-live-demo-1.6`. **Next free iteration: `<code-name>-1.10`.**

> ✅ Confirmed (2026-05-30): *iteration* is a **running counter for the whole
> foundation** — `1.1, 1.2, 1.3 …` increment across **all** code names within
> Foundation 1, regardless of which feature the branch is for.
