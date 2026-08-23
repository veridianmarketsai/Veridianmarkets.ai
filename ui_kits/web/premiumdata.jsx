// Veridian Markets — premium Finnhub endpoints (leadership, dividends, press
// releases, news sentiment, ownership, fund ownership, revenue breakdown,
// price target, sector metrics, supply chain). All requests go through the
// existing vm-finnhub generic proxy — see vmFinnhub()/VM_FINNHUB in
// calendars.jsx, and the EP map in lambda/marketdata/vm-finnhub/index.mjs.
// Requires a paid Finnhub plan; falls back to null/mock like every other
// live-data hook in the app when a call fails or the plan lacks access.
//
// NOTE: endpoint PATHS below are verified against Finnhub's official SDK
// source. Response FIELD NAMES for the newer endpoints (dividend2,
// revenue-breakdown2, press-releases, supply-chain, ownership/fund-ownership)
// are best-effort from public examples — Finnhub's docs site is a JS app we
// can't scrape, so if a panel stays empty after deploying, paste one real
// `?endpoint=<key>&symbol=AAPL` JSON response and the candidate-key lists
// below can be corrected quickly.

function _pick(obj, keys) { for (const k of keys) if (obj && obj[k] !== undefined) return obj[k]; return undefined; }

// Shared shape for every single-ticker "?endpoint=X&symbol=TICKER" premium
// lookup: fetch via the shared vmFinnhub() proxy (already client-cached),
// map the raw payload, expose {data,loading,live} like useVMFinancials.
function useVMPremium(endpoint, ticker, mapFn) {
  const sym = ticker ? String(ticker).toUpperCase() : '';
  const [state, setState] = React.useState({ data: null, loading: false, live: false });
  React.useEffect(() => {
    if (!sym || (typeof VM_IS_EQUITY === 'function' && !VM_IS_EQUITY(sym)) || typeof vmFinnhub !== 'function') {
      setState({ data: null, loading: false, live: false }); return;
    }
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    vmFinnhub(endpoint, { symbol: sym }).then((raw) => {
      if (!alive) return;
      const mapped = raw ? mapFn(raw) : null;
      const live = Array.isArray(mapped) ? mapped.length > 0 : !!mapped;
      setState({ data: mapped, loading: false, live });
    }).catch(() => { if (alive) setState({ data: null, loading: false, live: false }); });
    return () => { alive = false; };
  }, [endpoint, sym]);
  return state;
}

// ── Leadership ────────────────────────────────────────────────────────────
// Raw: { symbol, executive: [ { name, title/position, since, compensation, currency } ] }
function _mapExecutives(raw) {
  const rows = _pick(raw, ['executive', 'data']) || [];
  return rows.map((r) => ({
    role: _pick(r, ['title', 'position', 'role']) || '—',
    since: _pick(r, ['since', 'startDate']) || '—',
    name: r.name || '—',
    note: r.compensation ? `${r.currency || '$'}${Number(r.compensation).toLocaleString()} comp.` : '',
  }));
}
function useVMExecutives(ticker) { return useVMPremium('executives', ticker, _mapExecutives); }

// ── Dividends ─────────────────────────────────────────────────────────────
// Raw: { data: [ { exDate, amount, adjustedAmount, payDate, currency } ] }
function _mapDividends(raw) {
  const rows = _pick(raw, ['data']) || [];
  return rows
    .slice()
    .sort((a, b) => new Date(b.exDate || 0) - new Date(a.exDate || 0))
    .map((r) => ({ exDate: r.exDate, amount: r.adjustedAmount ?? r.amount, payDate: r.payDate, currency: r.currency || 'USD' }));
}
function useVMDividends(ticker) { return useVMPremium('dividends', ticker, _mapDividends); }

// ── Press releases ────────────────────────────────────────────────────────
// Raw: { majorDevelopment: [ { title, description, datetime } ] } (or {data:[...]})
function _mapPressReleases(raw) {
  const rows = _pick(raw, ['majorDevelopment', 'data']) || [];
  return rows.slice(0, 20).map((r) => ({
    title: r.title || r.headline || '—',
    summary: r.description || r.summary || '',
    date: r.datetime || r.date || '',
    url: r.url || '',
  }));
}
function useVMPressReleases(ticker) { return useVMPremium('press-releases', ticker, _mapPressReleases); }

// ── News sentiment ────────────────────────────────────────────────────────
// Raw: { sentiment: { bullishPercent, bearishPercent }, companyNewsScore, sectorAverageNewsScore, buzz:{buzz} }
function _mapSentiment(raw) {
  if (!raw) return null;
  const s = raw.sentiment || {};
  const has = s.bullishPercent != null || s.bearishPercent != null || raw.companyNewsScore != null;
  if (!has) return null;
  return {
    bullishPct: s.bullishPercent != null ? Math.round(s.bullishPercent * 100) : null,
    bearishPct: s.bearishPercent != null ? Math.round(s.bearishPercent * 100) : null,
    companyScore: raw.companyNewsScore,
    sectorScore: raw.sectorAverageNewsScore,
    buzz: raw.buzz && raw.buzz.buzz,
  };
}
function useVMNewsSentiment(ticker) { return useVMPremium('news-sentiment', ticker, _mapSentiment); }

// ── Ownership / fund ownership ───────────────────────────────────────────
// Raw: { ownership: [ { name, share, change, filingDate } ] } — same shape family for both.
function _mapOwnership(raw) {
  // Confirmed shape (live): { ownership: [ { name, share (raw share count),
  // portfolioPercent (fund-ownership only — % of THAT FUND's own portfolio,
  // not % of the company), change, filingDate } ] }. There's no "% of company
  // owned" field on either endpoint, so institutional rows show a share count
  // and fund rows show portfolioPercent when present.
  const rows = _pick(raw, ['ownership', 'data']) || [];
  return rows.slice(0, 20).map((r) => ({
    name: r.name || r.investorName || '—',
    shares: r.share != null ? Number(r.share) : null,
    portfolioPct: r.portfolioPercent != null ? Math.round(r.portfolioPercent * 10) / 10 : null,
    change: r.change,
    filingDate: r.filingDate,
  }));
}
function useVMOwnership(ticker) { return useVMPremium('ownership', ticker, _mapOwnership); }
function useVMFundOwnership(ticker) { return useVMPremium('fund-ownership', ticker, _mapOwnership); }

// ── Revenue breakdown ─────────────────────────────────────────────────────
// Target shape matches the existing "Revenue mix" panel: [{k,v,c}], v = percent-of-total.
const _SEGMENT_COLORS = ['#4f9dde', '#7fc8a9', '#e0b354', '#c97b7b', '#9b8bd6', '#6bbfbf', '#d68fb0', '#a3a3a3'];
// Confirmed shape (live): { data: { annual: { revenue_by_product: [ [ { label,
// data: [{period, value}, …oldest→newest] }, … ] ], revenue_by_geography: […],
// ebit_by_geography: […], grossIncome_by_product: […] } }, currency }. We take
// the latest period's value per product segment and turn it into % of total.
function _mapRevenueBreakdown(raw) {
  const seriesArr = raw && raw.data && raw.data.annual && raw.data.annual.revenue_by_product;
  const list = Array.isArray(seriesArr) && Array.isArray(seriesArr[0]) ? seriesArr[0] : null;
  if (!list || !list.length) return null;
  const rows = list
    .map((s) => { const pts = s.data || []; const latest = pts[pts.length - 1]; return { label: s.label, value: latest ? Number(latest.value) : 0 }; })
    .filter((r) => r.label && r.value > 0);
  const total = rows.reduce((a, r) => a + r.value, 0);
  if (!total) return null;
  return rows
    .map((r, i) => ({ k: r.label, v: Math.round((r.value / total) * 1000) / 10, c: _SEGMENT_COLORS[i % _SEGMENT_COLORS.length] }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 8);
}
function useVMRevenueBreakdown(ticker) { return useVMPremium('revenue-breakdown', ticker, _mapRevenueBreakdown); }

// ── Price target ──────────────────────────────────────────────────────────
// Raw: { targetHigh, targetLow, targetMean, targetMedian, lastUpdated }
function _mapPriceTarget(raw) {
  if (!raw || raw.targetMean == null) return null;
  return { high: raw.targetHigh, low: raw.targetLow, mean: raw.targetMean, median: raw.targetMedian, updated: raw.lastUpdated };
}
function useVMPriceTarget(ticker) { return useVMPremium('price-target', ticker, _mapPriceTarget); }

// ── Sector metrics (region-wide, not per-ticker) ─────────────────────────
function useVMSectorMetrics(region) {
  const [state, setState] = React.useState({ data: null, loading: false, live: false });
  React.useEffect(() => {
    if (!region || typeof vmFinnhub !== 'function') { setState({ data: null, loading: false, live: false }); return; }
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    vmFinnhub('sector-metrics', { region }).then((raw) => {
      if (!alive) return;
      const rows = (raw && (raw.data || raw.sectorMetrics)) || null;
      setState({ data: rows, loading: false, live: !!(rows && rows.length) });
    }).catch(() => { if (alive) setState({ data: null, loading: false, live: false }); });
    return () => { alive = false; };
  }, [region]);
  return state;
}

// ── Supply chain ──────────────────────────────────────────────────────────
// Target shape matches ScnLiveDemo.jsx's SCN_DB node shape: {id,name,ticker,role,note,risk}.
// Confirmed shape (live): { data: [ { symbol, name, industry, country,
// customer, supplier (booleans), oneWeek/oneMonth/…/twoYearCorrelation } ] } —
// a FLAT list of relationships (not nested under a sub-key), no revenue-%
// field, so "note" carries industry + price correlation instead. This is a
// broad correlation-based dataset (hundreds of rows for a large-cap), not a
// short curated list, so we keep only the strongest MAX_NODES per side —
// otherwise ScnLiveDemo's map (built for ~6-9 nodes/side) would be unusable.
// Ranked by raw (signed) correlation, not magnitude: strong *positive*
// correlation (moves with the company — e.g. a retailer that resells its
// products) surfaces far more recognizable, intuitive names than strong
// negative correlation does, which verified against live AAPL data.
const _SCN_MAX_NODES = 8;
function _mapSupplyChain(raw) {
  const rel = _pick(raw, ['data']) || [];
  if (!Array.isArray(rel) || !rel.length) return null;
  const inputs = [], customers = [];
  rel.forEach((r, i) => {
    const ticker = r.symbol || null;
    const name = r.name || ticker;
    if (!ticker && !name) return;
    const corr = r.oneYearCorrelation ?? r.sixMonthCorrelation ?? r.oneMonthCorrelation ?? null;
    const role = r.customer && r.supplier ? 'Customer & supplier' : r.customer ? 'Customer' : 'Supplier';
    const note = [r.industry, corr != null ? `${Math.round(corr * 100)}% price correlation` : null].filter(Boolean).join(' · ');
    const node = { id: ticker || `${name}-${i}`, name, ticker, group: 'company', cat: 'a', role, note, risk: '', _corr: corr == null ? -2 : corr };
    if (r.customer) customers.push(node); else inputs.push(node);
  });
  const top = (arr) => arr.sort((a, b) => b._corr - a._corr).slice(0, _SCN_MAX_NODES).map(({ _corr, ...n }) => n);
  const outInputs = top(inputs), outCustomers = top(customers);
  return (outInputs.length || outCustomers.length) ? { inputs: outInputs, customers: outCustomers } : null;
}
function useVMSupplyChain(ticker) { return useVMPremium('supply-chain', ticker, _mapSupplyChain); }

// ── Batch trailing dividend yield, for the Screener DIVIDEND filter pill ──
// TTM yield % = sum of last 4 dividend payments / current price. Only fetches
// when the DIVIDEND pill is active (caller passes tickers = [] otherwise).
async function _vmTrailingYield(ticker, price) {
  if (!price || typeof vmFinnhub !== 'function') return null;
  const raw = await vmFinnhub('dividends', { symbol: ticker });
  const rows = raw ? _mapDividends(raw) : [];
  if (!rows.length) return 0;
  const ttm = rows.slice(0, 4).reduce((a, r) => a + (Number(r.amount) || 0), 0);
  return (ttm / price) * 100;
}
function useVMDividendYield(tickers) {
  const list = (tickers || []).filter((t) => t && (typeof VM_IS_EQUITY !== 'function' || VM_IS_EQUITY(t)));
  const key = list.join(',');
  const quotes = typeof useVMQuotes === 'function' ? useVMQuotes(list) : {};
  const priceKey = list.map((t) => (quotes[t] && quotes[t].price) || 0).join(',');
  const [map, setMap] = React.useState({});
  React.useEffect(() => {
    if (!list.length) { setMap({}); return; }
    let alive = true;
    Promise.all(list.map((t) => _vmTrailingYield(t, quotes[t] && quotes[t].price).then((y) => [t, y]).catch(() => [t, null])))
      .then((pairs) => { if (!alive) return; const m = {}; pairs.forEach(([t, y]) => { if (y != null) m[t] = y; }); setMap(m); });
    return () => { alive = false; };
  }, [key, priceKey]);
  return map;
}

Object.assign(window, {
  useVMExecutives, useVMDividends, useVMPressReleases, useVMNewsSentiment,
  useVMOwnership, useVMFundOwnership, useVMRevenueBreakdown, useVMPriceTarget,
  useVMSectorMetrics, useVMSupplyChain, useVMDividendYield,
});
