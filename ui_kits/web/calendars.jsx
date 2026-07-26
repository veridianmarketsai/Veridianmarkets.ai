// Veridian Markets — extra calendars (IPO, FDA, market holidays) via the generic
// vm-finnhub proxy. useVMCalendars(y, m) returns Calendar-shaped events so they
// drop onto the month grid / day panel / list beside earnings. See finnhub-roadmap.md.

const VM_FINNHUB = { url: 'https://uy2vzizhd6cgtj3rwvjjgppaeu0qwznt.lambda-url.us-east-1.on.aws/' };
const _vmFhCache = {};
const VM_FH_TTL = 30 * 60 * 1000;   // client cache 30 min

const _calYmd = (d) => d.toISOString().slice(0, 10);
const _sameMonth = (dateStr, y, m) => { const s = String(dateStr); return Number(s.slice(0, 4)) === y && (Number(s.slice(5, 7)) - 1) === m; };
const _dayOf = (dateStr) => parseInt(String(dateStr).slice(8, 10), 10);

async function vmFinnhub(endpoint, params = {}) {
  if (!VM_FINNHUB.url) return null;
  const qs = Object.keys(params).sort().map((k) => `${k}=${encodeURIComponent(params[k])}`).join('&');
  const key = `${endpoint}#${qs}`;
  const hit = _vmFhCache[key];
  if (hit && (Date.now() - hit.t) < VM_FH_TTL) return hit.data;
  try {
    const res  = await fetch(`${VM_FINNHUB.url}?endpoint=${encodeURIComponent(endpoint)}${qs ? '&' + qs : ''}`);
    const data = await res.json();
    _vmFhCache[key] = { t: Date.now(), data };
    return data;
  } catch { return null; }
}

function _mapIpo(ipo, y, m) {
  const rows = (ipo && ipo.ipoCalendar) || [];
  return rows.filter((r) => r.date && _sameMonth(r.date, y, m)).slice(0, 20).map((r) => {
    const d = _dayOf(r.date);
    return {
      d, y, m, date: new Date(y, m, d), time: '—',
      title: `${r.symbol || r.name} IPO`, type: 'ipo', region: 'US', impact: 'med',
      forecast: r.price ? `$${r.price}` : '—', previous: '—',
      ticker: (r.symbol && /^[A-Z.]{1,6}$/.test(r.symbol)) ? r.symbol : null, live: true, sub: r.name,
    };
  });
}
function _mapFda(fda, y, m) {
  const rows = (fda && fda.data) || [];
  return rows.filter((r) => r.fromDate && _sameMonth(r.fromDate, y, m)).slice(0, 20).map((r) => {
    const d = _dayOf(r.fromDate);
    const desc = String(r.eventDescription || 'FDA advisory committee');
    const title = (desc.split(' - ')[0] || desc).slice(0, 70);
    return {
      d, y, m, date: new Date(y, m, d), time: r.fromDate.length >= 16 ? r.fromDate.slice(11, 16) : '—',
      title, type: 'fda', region: 'US', impact: 'med', forecast: '—', previous: '—', live: true, url: r.url,
    };
  });
}
function _mapHolidays(hol, y, m) {
  const rows = (hol && hol.data) || [];
  return rows.filter((r) => r.atDate && _sameMonth(r.atDate, y, m)).map((r) => {
    const d = _dayOf(r.atDate);
    const closed = !r.tradingHour;
    return {
      d, y, m, date: new Date(y, m, d), time: closed ? '—' : (r.tradingHour || '—'),
      title: `${r.eventName} — ${closed ? 'market closed' : 'early close'}`,
      type: 'holiday', region: 'US', impact: 'low', forecast: '—', previous: '—', live: true, closed,
    };
  });
}

// IPO + FDA + holiday events for one month (y, m 0-indexed). IPO is fetched for
// the month; FDA and holidays return everything and are filtered client-side.
function useVMCalendars(y, m) {
  const [state, setState] = React.useState({ events: [], loading: false, live: false });
  React.useEffect(() => {
    if (!VM_FINNHUB.url || y == null || m == null) { setState({ events: [], loading: false, live: false }); return; }
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    const from = _calYmd(new Date(y, m, 1));
    const to   = _calYmd(new Date(y, m + 1, 0));
    Promise.all([
      vmFinnhub('ipo-calendar', { from, to }),
      vmFinnhub('fda-calendar'),
      vmFinnhub('market-holiday'),
    ]).then(([ipo, fda, hol]) => {
      if (!alive) return;
      const events = [..._mapIpo(ipo, y, m), ..._mapFda(fda, y, m), ..._mapHolidays(hol, y, m)];
      setState({ events, loading: false, live: events.length > 0 });
    }).catch(() => { if (alive) setState({ events: [], loading: false, live: false }); });
    return () => { alive = false; };
  }, [y, m]);
  return state;
}

Object.assign(window, { VM_FINNHUB, vmFinnhub, useVMCalendars });
