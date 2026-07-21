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
// as they come up via search.
const VM_ETF_TICKERS = new Set([
  'SPY','VOO','IVV','VTI','QQQ','DIA','IWM','VUG','VTV','VEA','VWO','EFA','EEM',
  'AGG','BND','TLT','GLD','SLV','ARKK','VYM','SCHD','JEPI','VIG','VNQ','USMV',
  'XLK','XLF','XLE','XLV','XLY','XLP','XLI','XLU','XLB','XLRE','XLC',
]);
function VM_IS_ETF(t) { return VM_ETF_TICKERS.has(String(t).toUpperCase()); }

// Format a live percent (number) like the mock strings: "+1.26%".
function vmFmtPct(pct) { return `${pct >= 0 ? '+' : ''}${Number(pct).toFixed(2)}%`; }

// Overlay a live quote onto a mock company object → live price/chg/dir with fallback.
function vmApply(c, liveMap) {
  const q = liveMap && liveMap[String(c.ticker).toUpperCase()];
  if (!q) return c;
  return { ...c, price: q.price.toFixed(2), chg: vmFmtPct(q.pct), dir: q.dir, live: true };
}

Object.assign(window, { VM_MARKET, vmQuotes, useVMQuote, useVMQuotes, vmFmtPct, vmApply, VM_IS_EQUITY, VM_IS_ETF });
