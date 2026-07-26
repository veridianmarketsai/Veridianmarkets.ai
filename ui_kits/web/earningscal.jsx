// Veridian Markets — earnings calendar (Finnhub via vm-earnings-cal Lambda).
//
// useVMEarningsMonth(y, m) → { events, loading, live } where each event is shaped
// like a Calendar event ({ d, date, time, title, type:'earn', ticker, forecast,
// previous, impact, live }) so it drops straight into the month grid, day panel
// and list view. With no symbol filter the Lambda returns the biggest reporters
// (by revenue estimate) for the month. See finnhub-roadmap.md.

const VM_EARNCAL = { url: 'https://xfbakrglfc4auebwwahjbty7va0quqyh.lambda-url.us-east-1.on.aws/' };
const _vmEarnCalCache = {};
const VM_EARNCAL_TTL = 30 * 60 * 1000;   // client cache 30 min

const _ymd = (d) => d.toISOString().slice(0, 10);

async function vmEarningsCal(from, to) {
  if (!VM_EARNCAL.url) return [];
  const key = `${from}#${to}`;
  const hit = _vmEarnCalCache[key];
  if (hit && (Date.now() - hit.t) < VM_EARNCAL_TTL) return hit.data;
  try {
    const res  = await fetch(`${VM_EARNCAL.url}?from=${from}&to=${to}`);
    const data = await res.json();
    const out  = Array.isArray(data.earnings) ? data.earnings : [];
    _vmEarnCalCache[key] = { t: Date.now(), data: out };
    return out;
  } catch { return []; }
}

// Finnhub 'hour' code → human label.
function _earnTime(h) {
  return h === 'bmo' ? 'Pre-open' : h === 'amc' ? 'After close' : h === 'dmh' ? 'Mid-day' : '—';
}

// One earnings row → a Calendar-shaped event (for month y / month-index m).
function _mapEarn(e, y, m) {
  if (!e.date) return null;
  const dd = parseInt(String(e.date).slice(8, 10), 10);
  if (!dd) return null;
  return {
    d: dd, y, m, date: new Date(y, m, dd),
    time: _earnTime(e.hour),
    title: `${e.symbol} earnings${e.quarter ? ` · Q${e.quarter}` : ''}`,
    type: 'earn', region: 'US', impact: 'high',
    forecast: e.epsEstimate != null ? `EPS $${Number(e.epsEstimate).toFixed(2)}` : '—',
    previous: e.epsActual != null ? `EPS $${Number(e.epsActual).toFixed(2)}` : '—',
    ticker: e.symbol, live: true,
    revenueEstimate: e.revenueEstimate,
  };
}

// Live earnings events for one month (y, m = 0-indexed month).
function useVMEarningsMonth(y, m) {
  const [state, setState] = React.useState({ events: [], loading: false, live: false });
  React.useEffect(() => {
    if (!VM_EARNCAL.url || y == null || m == null) { setState({ events: [], loading: false, live: false }); return; }
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    const from = _ymd(new Date(y, m, 1));
    const to   = _ymd(new Date(y, m + 1, 0));
    vmEarningsCal(from, to).then((rows) => {
      if (!alive) return;
      const events = rows.map((e) => _mapEarn(e, y, m)).filter(Boolean);
      setState({ events, loading: false, live: events.length > 0 });
    }).catch(() => { if (alive) setState({ events: [], loading: false, live: false }); });
    return () => { alive = false; };
  }, [y, m]);
  return state;
}

Object.assign(window, { VM_EARNCAL, vmEarningsCal, useVMEarningsMonth });
