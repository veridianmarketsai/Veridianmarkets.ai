# Veridian Memoir — Design System

> **"history-led finance."** Veridian Memoir is a markets-research web product
> with an editorial, almanac-like voice. Its signature idea: for any company,
> find the *closest historical analogue* — "AAPL today reads like MSFT in 2014"
> — and show what happened next as a **base rate, not a forecast**. The whole
> surface reads like a beautifully typeset financial newspaper crossed with a
> Bloomberg terminal.

This folder is a self-contained design system: brand voice, color + type
tokens, the iconography approach, and a high-fidelity UI kit that recreates the
product's core screens. Use it to build new Veridian Memoir screens, marketing,
prototypes, or branded artifacts.

---

## The product, in one paragraph

Veridian Memoir is organized as a left **rail** (You: Sign in / Watchlist /
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

---

## Sources this system was built from

Everything here was reverse-engineered from artifacts the user supplied. The
reader does **not** need access to these, but they are recorded for provenance:

| Source | What it is | What we took from it |
|---|---|---|
| `uploads/veridian markets pdf.pdf` | 8-page export of the **finished, high-fidelity product** (Front page, Screener, Screener+preview, Dashboard/Overview, Supply chain, Financials, Patents, History) | The authoritative visual reference — layouts, copy, color, type, every dashboard tab |
| `uploads/veridian_v2_rounded.html` | Working HTML of the **screener with eye-preview**, using the product's CSS token names (`--color-text-primary`, etc.) | Token names, row/preview markup, Tabler icon usage |
| `uploads/dependency_map_v4.html` | Working HTML of the **supply-chain network** ("the principle") | Node colors, breadcrumb behavior, connector logic |
| `uploads/Veridian Memoir Wireframes _standalone_.html` | A React design-canvas of **low-fi wireframes + a tweak panel** exploring palettes & fonts | Brand palette names ("Deep Teal", "Ink+Cream", "Forest+Rust"), font system, component inventory, nav labels |

**GitHub repos provided:** `https://github.com/veridianmarketsai/vmtest2`
(referenced as `veridianmarketsai/vmtest2`) and `veridianmarketsai/vmtest1`.
At build time `vmtest2` returned 404 (does not exist / not accessible) and
`vmtest1` contained only a 9-byte placeholder README — **no usable code or
assets**. If you have access to the real Veridian Markets repositories, explore
them at `https://github.com/veridianmarketsai` to ground future work in the
production source rather than these reconstructed tokens. *(Flagged to the user —
see CAVEATS at the bottom.)*

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
stroke, rounded-join outline set. This is confirmed by the source HTML, which
renders them via the Tabler **icon webfont** (`<i class="ti ti-eye">`,
`ti ti-search`, `ti ti-adjustments-horizontal`, `ti ti-external-link`,
`ti ti-currency-dollar`, `ti ti-lock`, `ti ti-arrow-right`, `ti ti-chevron-down`).

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
*(No proprietary icon assets were shipped in the sources, so there were none to
copy in — Tabler is the genuine set, not a substitution.)*

**Brand mark:** there is no logo image. The brand is a **typeset wordmark** —
*Veridian* in italic Spectral teal + **Memoir** in roman Spectral ink, with the
mono tagline `history-led finance` beneath. See `.vm-wordmark` in
`colors_and_type.css` and the `Masthead` component in the UI kit.

---

## FONTS — note

The product's two families, **Spectral** (literary serif) and **JetBrains Mono**,
are both on Google Fonts and load from there at the top of `colors_and_type.css`.
They are the *actual* fonts used in the source bundle, so this is genuine
sourcing, not a visual substitution. An uploaded `fonts/times.ttf` is kept in the
repo as an alternate serif option but is **not** currently wired in — the system
uses Spectral. To self-host, drop licensed `woff2` files in `fonts/` and swap the
`@import` for `@font-face` rules.

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
| `dev-server.mjs` | Zero-dependency Node static server for local preview (see *Running & previewing locally*) |
| `colors_and_type.css` | All design tokens (color, type, spacing, radius, shadow) + semantic type classes and the original product's token aliases |
| `fonts/times.ttf` | The brand serif (Times New Roman), wired as `VM Serif` via `@font-face` |
| `SKILL.md` | Agent-Skills manifest so this system can be used as a downloadable skill |
| `preview/` | Small HTML specimen cards that populate the Design System tab (color, type, components, etc.) |
| `ui_kits/web/` | High-fidelity, click-through recreation of the Veridian Memoir web product — `index.html` plus modular JSX components |
| `scraps/` | Raw extraction working files (PDF page renders, decoded wireframe JSX). Reference only — not part of the system |

### UI kits
- **`ui_kits/web/`** — the one product surface. Front page, Company search +
  eye-preview, Supply chain network, Company dashboard (Overview), and the
  History / Memoir analogue view, as an interactive prototype.

---

## CAVEATS (please read)

- **GitHub repos were empty/inaccessible.** `vmtest2` 404'd and `vmtest1` held
  only a placeholder README. The tokens here are reconstructed from the PDF +
  HTML artifacts, which are high-fidelity but not the production source of truth.
  If you can grant access to the real repo, I can tighten exact hex values,
  spacing, and component internals.
- **Fonts are Google-Fonts-hosted** (Spectral + JetBrains Mono) — the right
  families. An uploaded `fonts/times.ttf` is kept as an alternate but isn't wired
  in. If you want self-hosted licensed `woff2`, share them and I'll bundle them.
- **Exact color hexes are eyedropped** from the artifacts; the production token
  values may differ by a few points. Easy to correct against the real CSS.
