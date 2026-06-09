# Veridian Markets — Charts

Charts are central to the product. Every number should be readable visually, not just as a table.
All charts are built with plain SVG (no library) inside React components, inline styles using VM tokens.

---

## Existing primitives (`primitives.jsx`)

| Component | Purpose | Props |
|-----------|---------|-------|
| `Sparkline` | Tiny inline trend line | `dir`, `w`, `h`, `sw` |
| `OverlayChart` | NOW (solid) vs THEN (dashed) analogue overlay | `w`, `h`, `label`, `legend`, `thenYear` |
| `ProgressBar` | Single horizontal fill bar | `v` (0–100), `w`, `color` |

These are shared across all pages. Keep them generic — no company-specific logic.

---

## Financials charts (`Dashboard.jsx → DashFinancials`)

### Currently built
- **Financial statement table** — Income / Balance / Cash flow, annual & quarterly, with %Δ and $Δ columns
- **CSV / Excel export** — client-side, mirrors the on-screen table
- **PatentFilingChart** — bar chart of patent filings by year (SVG)
- **ProgressBar rows** — segment breakdown bars inside the legend popup

### To build on this branch

#### 1. Revenue bar chart
Multi-period bar chart. Annual or quarterly toggle. Overlays gross profit as a filled area.
```
Data shape: { label: '2023', revenue: 38_000, grossProfit: 17_000 }[]
Component:  <RevenueChart periods={data.periods} rows={data.income} />
```

#### 2. Earnings per share (EPS) line chart
Single line. Dots at each period. Positive = green, negative = red dot.
```
Data shape: pulled from income rows where fmtType === 'eps'
Component:  <EpsChart periods={data.periods} rows={data.income} />
```

#### 3. Margin trend chart
Three lines: gross margin, operating margin, net margin. Percentages. Legend top-right.
```
Component:  <MarginChart periods={data.periods} rows={data.income} />
```

#### 4. Balance sheet waterfall
Assets vs liabilities vs equity — stacked horizontal bars per period.
```
Component:  <BalanceWaterfall periods={data.periods} rows={data.balance} />
```

#### 5. Free cash flow chart
Bar chart. FCF = Operating cash flow − CapEx. Color: green if positive, orange if negative.
```
Component:  <FCFChart periods={data.periods} rows={data.cashflow} />
```

#### 6. Analogue overlay (financials edition)
Extends the existing `OverlayChart` primitive. Plots a chosen metric (e.g. revenue growth)
against the closest historical analogue company at the same stage. Dashed = historical.
```
Component:  <AnalogueMetricChart metric="revenue" company={c} analogue={closestAnalogue} />
```

---

## Chart design rules

- **Chart engine** — ECharts 5 via CDN (`window.echarts`). Loaded in `index.html` before Analysis.jsx. Wrapped in `EChartsCanvas` component with ResizeObserver and proper dispose on unmount.
- **No chart libraries for primitives** — `Sparkline`, `OverlayChart`, `ProgressBar` stay plain SVG.
- **Always use VM tokens** — colors from `VM.teal`, `VM.terra`, `VM.up`, `VM.down`, etc.
- **Axes are minimal** — left y-axis labels only, hairline grid lines (`VM.borderHair`), no box border.
- **Responsive width** — use `width="100%"` with `viewBox` and `preserveAspectRatio="none"` for stretch. Fixed height.
- **Tooltips** — hover state via React `useState`, position relative to SVG bounding rect.
- **Dark mode** — all colors via VM tokens so they automatically inherit theme switches.
- **Labels** — use `VM.mono` font, 10–11px, `VM.ink3` color.

---

## Data shape (mock, `data.jsx`)

Financials data lives on each company object:
```js
company.financials = {
  periods:  ['2024', '2023', '2022', '2021'],   // newest first
  income:   [{ k: 'Revenue', v: [60_000, 52_000, 43_000, 36_000], fmt: 'usd' }, ...],
  balance:  [{ k: 'Total assets', v: [...], fmt: 'usd' }, ...],
  cashflow: [{ k: 'Operating cash flow', v: [...], fmt: 'usd' }, ...],
}
```

Quarterly periods use `'Q1 2024'` labels. Same shape, more columns.

---

## Backend (future — see `backend.md`)

- Source: Alpha Vantage / Polygon.io for OHLCV + fundamentals
- Lambda fetches + caches in RDS; CloudFront caches the API response (TTL 24h for fundamentals)
- Streaming tick data for price charts via WebSocket (Phase 4)

---

## Analysis modal (`Analysis.jsx`)

The Analysis button lives in the DashFinancials toolbar (next to Export). It opens a full modal with:
- **Left sidebar** — all chart types grouped by category, with search filter
- **Control bar** — context-aware toggles (only renders what the active chart declares in `CHART_TOGGLES`)
- **ECharts canvas** — `EChartsCanvas` wrapper with ResizeObserver
- **"Explain this"** — mock AI interpretation panel (real Anthropic API call in Phase 3)

Chart options are built by `buildXxxOption(data, toggles)` functions. Each returns a plain ECharts option object using VM tokens for all colors. `getChartOption(id, data, toggles)` routes to the right builder.

---

## What it takes to implement each chart

### Sprint 1 — build now (data already exists in `data.jsx`)

| Chart | Data source | Notes |
|-------|-------------|-------|
| Free cash flow | `cashflow` rows | Bar, green/orange by sign |
| Balance sheet | `balance` rows | Grouped bars: assets / liabilities / equity |
| CapEx vs depreciation | `cashflow` rows | Dual bar + line overlay |
| DuPont decomposition | `income` + `balance` rows | Net margin × asset turnover × leverage = ROE |
| Actual vs forecast | `income` rows | Solid history + dashed projected continuation |
| Scenario paths | `income` rows | Base/bull/bear lines from last period |
| Relative performance | `income` rows | Revenue growth indexed to 100 |
| Working capital cycle | `balance` rows | DSO / DIO / DPO trend lines |

Just needs `buildXxxOption()` functions added to `Analysis.jsx`. Zero new data work.

---

### Sprint 2 — add mock data to `data.jsx` first

| Chart | New data needed |
|-------|----------------|
| Segment revenue | Apple's iPhone / Services / Mac / iPad / Wearables split by year |
| Share buybacks & dilution | Share count per year, buyback $ per year |
| Dividend history | Dividend per share + payout ratio per year |
| Historical multiples | P/E, EV/EBITDA over time (price ÷ earnings each period) |
| Football field | Valuation range inputs per method (DCF, comps, precedent) |
| Sum-of-the-parts | Segment values building to EV |

Mock data shape additions go on the company object in `data.jsx`.

---

### Phase 3 — needs real data APIs (can't meaningfully mock)

| Chart | Data source |
|-------|-------------|
| Candlestick / OHLC | Daily price history — Polygon.io |
| Volume profile | Daily volume — Polygon.io |
| Moving averages / indicators | Derived from price history |
| Yield curve | FRED API (daily Treasury yields by maturity) |
| Credit spreads | FRED or Bloomberg |
| Correlation matrix | Multi-asset daily returns |
| VaR / Monte Carlo | Return distribution computation |
| Options payoff / vol surface | Options chain data — Polygon.io |
| Choropleth map | Geographic revenue data per company |
| Economic time series | FRED API |

These unlock in Phase 3 when the backend data layer is built (see `backend.md`).

---

## Build order

1. ✅ Revenue & gross profit — done
2. ✅ Margin trends — done
3. ✅ EPS diluted — done
4. Free cash flow (Sprint 1)
5. Balance sheet (Sprint 1)
6. CapEx vs depreciation (Sprint 1)
7. DuPont decomposition (Sprint 1)
8. Segment revenue (Sprint 2 — needs mock data)
9. Historical multiples (Sprint 2 — needs mock data)
10. Price / technical charts (Phase 3 — needs real API)
