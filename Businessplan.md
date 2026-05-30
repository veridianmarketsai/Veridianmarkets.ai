# Veridian Markets — Business Plan

> Living document. Capture the *why*, *who*, and *how* of the product so Claude
> (and collaborators) build with the right context. Fill in the `_TBD_` fields;
> rough notes are fine. Keep the change log at the bottom timestamped, like the
> README.

---

## 1. One-liner
*History-led finance — for any company or market, find the closest historical
analogue and show what happened next as a base rate, not a forecast.*

_(Refine in your own words: _TBD_)_

## 2. The problem
- _TBD — what's broken / missing in how people read markets today?_

## 3. The solution / product
- A hybrid of Yahoo Finance, Bloomberg SPLC GO, TradingView, Forex Factory, and
  Trading Economics, with **history as the interpretive lens**.
- Core surfaces (see README): Front page, Search, Supply chain network, Company
  dashboard, History/analogue engine, Learn, Read memoir.
- _What's the single most important thing it does better than anything else? _TBD_

## 4. Target users & market
- Primary users: _TBD (retail investors? analysts? students? advisors?)_
- Market size / segment: _TBD_

## 5. Differentiation
| Competitor | What they do | Where Veridian wins |
|---|---|---|
| Yahoo Finance | _TBD_ | _TBD_ |
| Bloomberg (SPLC GO) | _TBD_ | _TBD_ |
| TradingView | _TBD_ | _TBD_ |
| Forex Factory | _TBD_ | _TBD_ |
| Trading Economics | _TBD_ | _TBD_ |

## 6. Data & technology
- **Data sources:** external APIs (market quotes, fundamentals, supply-chain,
  historical series) — _list intended providers: _TBD_._
- **Backend:** AWS (auth, API proxying/keys, caching). _Specifics: _TBD_._
- **Frontend:** React (currently CDN+Babel prototype → real build as it matures).
- See [`README.md`](README.md) → *Data & architecture* for engineering notes.

## 7. Business model
- How it makes money: _TBD (subscription tiers? freemium? data add-ons?)_
- Pricing sketch: _TBD_

## 8. Go-to-market
- _TBD — how do the first 100 / 1,000 users find it?_

## 9. Roadmap — the 6 foundations
The product ships through **6 foundations** (deploy pipeline `1 → 6`); currently on
**Foundation 1**. (Branch/iteration scheme lives in `CLAUDEMemory.md`.)

| Foundation | Theme / goal | Status |
|---|---|---|
| 1 | _TBD (current — UI surfaces + structure)_ | In progress |
| 2 | _TBD_ | Planned |
| 3 | _TBD_ | Planned |
| 4 | _TBD_ | Planned |
| 5 | _TBD_ | Planned |
| 6 | _TBD (production / launch?)_ | Planned |

Near-term pages: **Sign in** (AWS auth) → unlocks **My Portfolio** (gated; redirect
to Sign in when logged out).

## 10. Risks & open questions
- _TBD (data licensing? compliance / "not advice" framing? cost of data APIs?)_

## 11. Illustrations & assets
Drop images that illustrate ideas here and reference them inline, e.g.
`![Concept — supply chain](assets/concept-scn.png)`. Suggested home for files:
an `assets/` folder at repo root. _(See the chat note on how to share images.)_

---

## Change log

### 2026-05-30
- **11:47 — Created this business-plan scaffold.** Template with `_TBD_` fields for
  us to fill in.
