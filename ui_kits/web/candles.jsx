// Veridian Markets — OHLC candles (Finnhub /stock/candle, via vm-candles
// Lambda). Requires a paid Finnhub plan. Powers the "Chart" tab next to
// Financials — see ChartTab.jsx for the range-button UI + ECharts render.

const VM_CANDLES = { url: 'https://qjhj4zxoqnyysvuewcssz2vedm0ptcmz.lambda-url.us-east-1.on.aws/' };
const _vmCandlesCache = {};
const VM_CANDLES_TTL = 5 * 60 * 1000;   // client cache 5 min (server TTL varies by resolution)

const VM_RANGES = {
  '1D':  { resolution: '5',  seconds: 1 * 86400 },
  '5D':  { resolution: '15', seconds: 5 * 86400 },
  '1M':  { resolution: '60', seconds: 30 * 86400 },
  '6M':  { resolution: 'D',  seconds: 182 * 86400 },
  '1Y':  { resolution: 'D',  seconds: 365 * 86400 },
  '5Y':  { resolution: 'W',  seconds: 5 * 365 * 86400 },
  'Max': { resolution: 'M',  seconds: 20 * 365 * 86400 },
};

// Fetch candles for a symbol + range label (client-cached).
async function vmCandles(symbol, range) {
  if (!VM_CANDLES.url) return null;
  const sym = String(symbol || '').toUpperCase();
  const r = VM_RANGES[range] || VM_RANGES['1Y'];
  const to = Math.floor(Date.now() / 1000);
  const from = to - r.seconds;
  const key = `${sym}#${r.resolution}#${range}`;
  const hit = _vmCandlesCache[key];
  if (hit && (Date.now() - hit.t) < VM_CANDLES_TTL) return hit.data;
  try {
    const res = await fetch(`${VM_CANDLES.url}?symbol=${encodeURIComponent(sym)}&resolution=${r.resolution}&from=${from}&to=${to}`);
    const data = await res.json();
    _vmCandlesCache[key] = { t: Date.now(), data };
    return data;
  } catch { return null; }
}

// Raw vm-candles payload → [{t (ms), o, h, l, c, v}] newest last, or null.
function vmBuildBars(payload) {
  if (!payload || payload.s !== 'ok' || !Array.isArray(payload.t) || !payload.t.length) return null;
  const { t, o, h, l, c, v } = payload;
  return t.map((ts, i) => ({ t: ts * 1000, o: o[i], h: h[i], l: l[i], c: c[i], v: v[i] }));
}

// Hook: real candles for a ticker + range, or {data:null} to fall back to the mock chart.
function useVMCandles(ticker, range) {
  const [state, setState] = React.useState({ data: null, loading: false, live: false });
  React.useEffect(() => {
    if (!ticker || !range || (typeof VM_IS_EQUITY === 'function' && !VM_IS_EQUITY(ticker))) {
      setState({ data: null, loading: false, live: false }); return;
    }
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    vmCandles(ticker, range).then((payload) => {
      const bars = vmBuildBars(payload);
      if (alive) setState({ data: bars, loading: false, live: !!bars });
    }).catch(() => { if (alive) setState({ data: null, loading: false, live: false }); });
    return () => { alive = false; };
  }, [ticker, range]);
  return state;
}

Object.assign(window, { VM_CANDLES, VM_RANGES, vmCandles, vmBuildBars, useVMCandles });
