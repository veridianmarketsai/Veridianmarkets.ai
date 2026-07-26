// Veridian Markets — live market quotes (Finnhub, via our cached Lambda).
// The Lambda (vm-quote) already caches per symbol for 2 min in DynamoDB; this
// adds a tiny in-browser cache so components sharing a symbol don't refetch in
// the same window. Components use `useVMQuote(ticker)` and fall back to the mock
// price when live data isn't available. See marketdataapi.md.

const VM_MARKET = {
  // vm-quote Lambda Function URL. Empty → components just use the mock prices.
  quoteUrl: 'https://li5qssqgo6sk7fpubrxk2yehuq0tykub.lambda-url.us-east-1.on.aws/',
};

const _vmQuoteCache = {};            // SYM -> { data, at }
const VM_QUOTE_TTL = 120000;         // 2 min, mirrors the server TTL

// Fetch quotes for one or more symbols → { SYM: { price, change, pct, dir } }.
// Deduplicates via the client cache; missing/unsupported symbols are simply absent
// (so the caller keeps its mock value).
async function vmQuotes(symbols) {
  if (!VM_MARKET.quoteUrl || !symbols || !symbols.length) return {};
  const want = [...new Set(symbols.map(s => String(s).toUpperCase()))];
  const now = Date.now();
  const out = {}, need = [];
  want.forEach(s => {
    const c = _vmQuoteCache[s];
    if (c && now - c.at < VM_QUOTE_TTL) out[s] = c.data; else need.push(s);
  });
  if (need.length) {
    try {
      const res = await fetch(`${VM_MARKET.quoteUrl}?symbols=${encodeURIComponent(need.join(','))}`);
      const data = await res.json();
      const q = data.quotes || {};
      need.forEach(s => {
        const r = q[s];
        if (r && r.price != null && r.price !== 0) {
          const item = { price: r.price, change: r.change, pct: r.pct, dir: (r.change ?? 0) >= 0 ? 'up' : 'down' };
          _vmQuoteCache[s] = { data: item, at: now };
          out[s] = item;
        }
      });
    } catch (e) { /* network/CORS → callers keep their mock values */ }
  }
  return out;
}

// React hook: live quote for one ticker, or null until it loads / if unsupported.
function useVMQuote(ticker) {
  const [q, setQ] = React.useState(null);
  React.useEffect(() => {
    let alive = true;
    if (ticker) vmQuotes([ticker]).then(m => { if (alive) setQ(m[String(ticker).toUpperCase()] || null); });
    return () => { alive = false; };
  }, [ticker]);
  return q;
}

// React hook: live quotes for a LIST of tickers → { SYM: {price,change,pct,dir} }.
// One batched request; only real equity tickers are worth sending (index/commodity/
// forex pseudo-tickers aren't on Finnhub's free tier — they just stay mock).
function useVMQuotes(tickers) {
  const wanted = (tickers || []).filter(t => t && VM_IS_EQUITY(t));
  const key = wanted.join(',');
  const [map, setMap] = React.useState({});
  React.useEffect(() => {
    let alive = true;
    if (wanted.length) vmQuotes(wanted).then(m => { if (alive) setMap(m); });
    return () => { alive = false; };
  }, [key]);
  return map;
}

// Skip the non-equity pseudo-tickers so we don't waste Finnhub calls on symbols it
// won't price. (Everything else is treated as a US equity.)
const VM_NON_EQUITY = new Set(['SPX','NDX','DJI','GOLD','WTI','BRENT','EURUSD','GBPUSD','USDJPY','BTC','ETH','US10Y']);
function VM_IS_EQUITY(t) { return !VM_NON_EQUITY.has(String(t).toUpperCase()); }

// Common ETF tickers — Finnhub's free tier has no holdings endpoint for these
// (/etf/holdings is premium-gated, confirmed 2026-07-21), so the Overview tab
// redirects out to a holdings aggregator instead. Not exhaustive; add tickers
// as they come up via search. Names are kept alongside so a keyword search like
// "index fund" or "etf" can surface this list as real rows (see vmTopicTickers).
const VM_ETF_INFO = {
  SPY:'SPDR S&P 500 ETF Trust', VOO:'Vanguard S&P 500 ETF', IVV:'iShares Core S&P 500 ETF',
  VTI:'Vanguard Total Stock Market ETF', QQQ:'Invesco QQQ Trust', DIA:'SPDR Dow Jones Industrial Average ETF',
  IWM:'iShares Russell 2000 ETF', VUG:'Vanguard Growth ETF', VTV:'Vanguard Value ETF',
  VEA:'Vanguard FTSE Developed Markets ETF', VWO:'Vanguard FTSE Emerging Markets ETF',
  EFA:'iShares MSCI EAFE ETF', EEM:'iShares MSCI Emerging Markets ETF',
  AGG:'iShares Core U.S. Aggregate Bond ETF', BND:'Vanguard Total Bond Market ETF',
  TLT:'iShares 20+ Year Treasury Bond ETF', GLD:'SPDR Gold Shares', SLV:'iShares Silver Trust',
  ARKK:'ARK Innovation ETF', VYM:'Vanguard High Dividend Yield ETF', SCHD:'Schwab US Dividend Equity ETF',
  JEPI:'JPMorgan Equity Premium Income ETF', VIG:'Vanguard Dividend Appreciation ETF',
  VNQ:'Vanguard Real Estate ETF', USMV:'iShares MSCI USA Min Vol Factor ETF',
  XLK:'Technology Select Sector SPDR Fund', XLF:'Financial Select Sector SPDR Fund',
  XLE:'Energy Select Sector SPDR Fund', XLV:'Health Care Select Sector SPDR Fund',
  XLY:'Consumer Discretionary Select Sector SPDR Fund', XLP:'Consumer Staples Select Sector SPDR Fund',
  XLI:'Industrial Select Sector SPDR Fund', XLU:'Utilities Select Sector SPDR Fund',
  XLB:'Materials Select Sector SPDR Fund', XLRE:'Real Estate Select Sector SPDR Fund',
  XLC:'Communication Services Select Sector SPDR Fund',
};
const VM_ETF_TICKERS = new Set(Object.keys(VM_ETF_INFO));
function VM_IS_ETF(t) { return VM_ETF_TICKERS.has(String(t).toUpperCase()); }

// Keyword → curated ticker rows, for search queries that name a fund *category*
// rather than a specific ticker (Finnhub's /search only matches literal name/
// symbol text, so "index fund" only turns up listings with that exact phrase in
// their name — e.g. "Sumcoin Index Fund" — not SPY or VOO). Mutual funds are
// deliberately NOT mapped here: Finnhub has no mutual-fund quote/profile
// endpoint at any tier, so listing tickers we can't actually price would be
// misleading (see feature-ideas.md, 2026-07-21).
function vmTopicTickers(query) {
  const ql = String(query || '').trim().toLowerCase();
  if (!ql) return [];
  if (ql.includes('index') || /\betfs?\b/.test(ql)) {
    return Object.keys(VM_ETF_INFO).map((t) => ({ ticker: t, name: VM_ETF_INFO[t], type: 'ETP' }));
  }
  return [];
}

// Format a live percent (number) like the mock strings: "+1.26%".
function vmFmtPct(pct) { return `${pct >= 0 ? '+' : ''}${Number(pct).toFixed(2)}%`; }

// Overlay a live quote onto a mock company object → live price/chg/dir with fallback.
function vmApply(c, liveMap) {
  const q = liveMap && liveMap[String(c.ticker).toUpperCase()];
  if (!q) return c;
  return { ...c, price: q.price.toFixed(2), chg: vmFmtPct(q.pct), dir: q.dir, live: true };
}

Object.assign(window, { VM_MARKET, vmQuotes, useVMQuote, useVMQuotes, vmFmtPct, vmApply, VM_IS_EQUITY, VM_IS_ETF, VM_ETF_INFO, vmTopicTickers });
