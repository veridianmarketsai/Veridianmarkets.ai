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
| Sign in                        | **Sign in Page**     | — (TBD)    | Placeholder; no route/page yet. |
| My portfolio                   | **My Portfolio Page**| — (TBD)    | Renamed from "Watchlist". No route/page yet. |
| Supply chain network           | **SCN Page**         | `supply`   | Sits **above** Search. Carries a green-bordered **"• Live Demo"** badge. |
| Search                         | **Main Search Page** | `screener` | Renamed from "Company search". |
| History                        | **History Page**     | `history`  | |
| Learn                          | **Learn VM**         | `learn`    | Blank scaffold page (`Learn.jsx`); content TBD. |
| Read memoir                    | **Memoir Page**      | `memoir`   | |

Routes map to screens in [`ui_kits/web/app.jsx`](ui_kits/web/app.jsx); labels live
in `RAIL_GROUPS` in `chrome.jsx`. Items with no route are non-clickable
placeholders until their page exists.

---

## Change log

### 2026-05-30

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
**Latest branch (this scheme):** `update-toolbar-and-setup-1.1` (next: `update-global-header-1.2`).

> ⚠️ Interpretation to confirm: I've treated *iteration* as a **running counter
> for the whole foundation** (1.1, 1.2, 1.3 across all changes, regardless of
> code name). If you instead meant it **per Code Name** (so "Update Global
> Header" keeps its own 1.1 → 1.2 → 1.3 while a different feature also starts at
> 1.1), tell me and I'll switch the auto-increment rule.
