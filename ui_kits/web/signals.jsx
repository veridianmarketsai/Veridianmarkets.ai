// Veridian Markets — company signals (Finnhub via vm-signals Lambda).
//
// Four free per-company signals, each cached: analyst recommendation, EPS
// earnings surprise, peers, insider transactions. useVMSignal(ticker, type)
// fetches one; SignalsPanel renders all four in the Overview tab. US equities
// only; a type with no data hides its card. See finnhub-roadmap.md.

const VM_SIGNALS = { url: 'https://wcdmnzg3wulxj2yu6hzi42dbzm0tryzu.lambda-url.us-east-1.on.aws/' };
const _vmSignalCache = {};
const VM_SIGNAL_TTL = 6 * 60 * 60 * 1000;   // client cache 6h

async function vmSignal(symbol, type) {
  const sym = String(symbol || '').toUpperCase();
  if (!VM_SIGNALS.url || !sym || !type) return [];
  const key = `${sym}#${type}`;
  const hit = _vmSignalCache[key];
  if (hit && (Date.now() - hit.t) < VM_SIGNAL_TTL) return hit.data;
  try {
    const res  = await fetch(`${VM_SIGNALS.url}?symbol=${encodeURIComponent(sym)}&type=${encodeURIComponent(type)}`);
    const data = await res.json();
    const out  = Array.isArray(data.data) ? data.data : [];
    _vmSignalCache[key] = { t: Date.now(), data: out };
    return out;
  } catch { return []; }
}

function useVMSignal(ticker, type) {
  const [state, setState] = React.useState({ data: [], loading: false });
  React.useEffect(() => {
    if (!ticker || (typeof VM_IS_EQUITY === 'function' && !VM_IS_EQUITY(ticker))) { setState({ data: [], loading: false }); return; }
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    vmSignal(ticker, type).then((d) => { if (alive) setState({ data: d, loading: false }); });
    return () => { alive = false; };
  }, [ticker, type]);
  return state;
}

// Weighted analyst consensus score (5=strong buy … 1=strong sell), or null.
function consensusScore(rows) {
  const r = rows && rows[0];
  if (!r) return null;
  const total = (r.strongBuy || 0) + (r.buy || 0) + (r.hold || 0) + (r.sell || 0) + (r.strongSell || 0);
  if (!total) return null;
  return (5 * (r.strongBuy || 0) + 4 * (r.buy || 0) + 3 * (r.hold || 0) + 2 * (r.sell || 0) + 1 * (r.strongSell || 0)) / total;
}

// Fetch consensus for many tickers → { ticker: score }. Used by the screener's
// Analyst filter (only when active). Unknown/loading tickers are simply absent.
function useVMConsensus(tickers) {
  const list = (tickers || []).filter((t) => t && (typeof VM_IS_EQUITY !== 'function' || VM_IS_EQUITY(t)));
  const key = list.join(',');
  const [map, setMap] = React.useState({});
  React.useEffect(() => {
    if (!list.length) { setMap({}); return; }
    let alive = true;
    Promise.all(list.map((t) => vmSignal(t, 'recommendation').then((rows) => [t, consensusScore(rows)]).catch(() => [t, null])))
      .then((pairs) => { if (!alive) return; const m = {}; pairs.forEach(([t, s]) => { if (s != null) m[t] = s; }); setMap(m); });
    return () => { alive = false; };
  }, [key]);
  return map;
}

function SigCard({ title, children }) {
  return (
    <div style={{ background: VM.paper, border: `1px solid ${VM.borderSoft}`, borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ fontFamily: VM.mono, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: VM.ink3, marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}

// Analyst buy/hold/sell → consensus label + stacked bar.
function RecommendationCard({ rows }) {
  const r = rows[0];
  const total = (r.strongBuy || 0) + (r.buy || 0) + (r.hold || 0) + (r.sell || 0) + (r.strongSell || 0);
  if (!total) return null;
  const score = (5 * (r.strongBuy || 0) + 4 * (r.buy || 0) + 3 * (r.hold || 0) + 2 * (r.sell || 0) + 1 * (r.strongSell || 0)) / total;
  const label = score >= 4.3 ? 'Strong Buy' : score >= 3.5 ? 'Buy' : score >= 2.5 ? 'Hold' : score >= 1.5 ? 'Sell' : 'Strong Sell';
  const labelColor = score >= 3.5 ? VM.teal : score >= 2.5 ? VM.ink3 : VM.terra;
  const segs = [
    { n: (r.strongBuy || 0) + (r.buy || 0), c: VM.teal,  k: 'Buy' },
    { n: r.hold || 0,                        c: VM.border, k: 'Hold' },
    { n: (r.sell || 0) + (r.strongSell || 0), c: VM.terra, k: 'Sell' },
  ];
  return (
    <SigCard title="Analyst consensus">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
        <span style={{ fontFamily: VM.serif, fontWeight: 700, fontSize: 20, color: labelColor }}>{label}</span>
        <span style={{ fontFamily: VM.mono, fontSize: 11, color: VM.ink3 }}>· {total} analysts</span>
      </div>
      <div style={{ display: 'flex', height: 10, borderRadius: 999, overflow: 'hidden', background: VM.paperWarm }}>
        {segs.map((s, i) => s.n > 0 && <div key={i} style={{ width: `${(s.n / total) * 100}%`, background: s.c }} title={`${s.k}: ${s.n}`} />)}
      </div>
      <div style={{ display: 'flex', gap: 14, marginTop: 10 }}>
        {segs.map((s, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: VM.mono, fontSize: 10, color: VM.ink2 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: s.c }} />{s.k} {s.n}
          </span>
        ))}
      </div>
    </SigCard>
  );
}

// Last few quarters of EPS actual vs estimate.
function EarningsCard({ rows }) {
  // Take the 4 most recent quarters, then show them in chronological order
  // (oldest → newest) so they read in sequence instead of newest-first.
  const list = rows.slice(0, 4).sort((a, b) => (a.year - b.year) || (a.quarter - b.quarter));
  if (!list.length) return null;
  return (
    <SigCard title="Earnings — EPS surprise">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {list.map((e, i) => {
          const beat = (e.surprise || 0) >= 0;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ fontFamily: VM.mono, fontSize: 11, color: VM.ink3, minWidth: 62 }}>{e.year} Q{e.quarter}</span>
              <span style={{ fontFamily: VM.mono, fontSize: 12, color: VM.ink }}>${Number(e.actual).toFixed(2)}<span style={{ color: VM.ink3 }}> vs ${Number(e.estimate).toFixed(2)}</span></span>
              <span style={{ fontFamily: VM.mono, fontSize: 11, fontWeight: 700, color: beat ? VM.teal : VM.terra, minWidth: 58, textAlign: 'right' }}>
                {beat ? '▲' : '▼'} {e.surprisePercent == null ? '—' : `${Number(e.surprisePercent).toFixed(1)}%`}
              </span>
            </div>
          );
        })}
      </div>
    </SigCard>
  );
}

// Related tickers → a small scrollable table (ticker · company · live price).
// Mouse-wheel scrolls the list naturally (plain overflowY); the ▲/▼ buttons
// step it for anyone who'd rather click than scroll.
function PeersCard({ tickers, self, go }) {
  const list = [...new Set(tickers.filter((t) => t && t !== self))].slice(0, 10);
  const key = list.join(',');
  const [names, setNames] = React.useState({});
  React.useEffect(() => {
    if (!list.length || typeof vmProfile !== 'function') return;
    let alive = true;
    Promise.all(list.map((t) => vmProfile(t).then((d) => [t, d && d.profile && d.profile.name]))).then((pairs) => {
      if (alive) setNames(Object.fromEntries(pairs.filter(([, n]) => n)));
    });
    return () => { alive = false; };
  }, [key]);
  const liveMap = typeof useVMQuotes === 'function' ? useVMQuotes(list) : {};
  const scrollRef = React.useRef(null);
  const ROW_H = 38;
  const scrollBy = (dy) => scrollRef.current && scrollRef.current.scrollBy({ top: dy, behavior: 'smooth' });

  if (!list.length) return null;
  const open = (t) => { const co = (typeof VM_COMPANIES !== 'undefined' ? VM_COMPANIES : []).find((x) => x.ticker === t); if (go) go('dashboard', co || { ticker: t, name: names[t] || t, cap: '—' }); };

  return (
    <SigCard title="Related companies">
      <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr 74px', gap: 8, padding: '0 4px 6px' }}>
        <Label>Ticker</Label><Label>Company</Label><Label style={{ textAlign: 'right' }}>Price</Label>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <div ref={scrollRef} style={{ flex: 1, maxHeight: ROW_H * 4, overflowY: 'auto', borderTop: `1px solid ${VM.borderHair}` }}>
          {list.map((t, i) => {
            const q = liveMap[t];
            return (
              <div key={t} onClick={() => open(t)}
                style={{ display: 'grid', gridTemplateColumns: '52px 1fr 74px', gap: 8, alignItems: 'center',
                  height: ROW_H, padding: '0 4px', cursor: 'pointer',
                  borderBottom: i === list.length - 1 ? 'none' : `1px solid ${VM.borderHair}` }}>
                <span style={{ fontFamily: VM.mono, fontSize: 12, fontWeight: 700, color: VM.teal }}>{t}</span>
                <span style={{ fontFamily: VM.serif, fontSize: 12.5, color: VM.ink2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{names[t] || '—'}</span>
                <span style={{ textAlign: 'right', fontFamily: VM.mono, fontSize: 11.5, fontWeight: 700, color: q ? VM.ink : VM.ink3 }}>{q ? `$${q.price.toFixed(2)}` : '—'}</span>
              </div>
            );
          })}
        </div>
        {list.length > 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
            <button onClick={() => scrollBy(-ROW_H * 2)} title="Scroll up"
              style={{ width: 24, height: 24, borderRadius: 6, border: `1px solid ${VM.border}`, background: VM.paper, color: VM.ink2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-chevron-up" style={{ fontSize: 13 }}></i>
            </button>
            <button onClick={() => scrollBy(ROW_H * 2)} title="Scroll down"
              style={{ width: 24, height: 24, borderRadius: 6, border: `1px solid ${VM.border}`, background: VM.paper, color: VM.ink2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-chevron-down" style={{ fontSize: 13 }}></i>
            </button>
          </div>
        )}
      </div>
    </SigCard>
  );
}

// Recent insider transactions.
const INSIDER_CODE = { P: 'Buy', S: 'Sell', A: 'Grant', M: 'Exercise', G: 'Gift', F: 'Tax', D: 'Disposal', C: 'Conversion', X: 'Exercise' };
function InsiderCard({ rows }) {
  const list = rows.filter((t) => t.change).slice(0, 6);
  if (!list.length) return null;
  return (
    <SigCard title="Insider activity">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {list.map((t, i) => {
          const buy = t.change > 0;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ fontFamily: VM.serif, fontSize: 12.5, color: VM.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{titleCase(t.name)}</span>
              <span style={{ fontFamily: VM.mono, fontSize: 9, color: VM.ink3 }}>{INSIDER_CODE[t.transactionCode] || t.transactionCode || ''}</span>
              <span style={{ fontFamily: VM.mono, fontSize: 11, fontWeight: 700, color: buy ? VM.teal : VM.terra, minWidth: 78, textAlign: 'right' }}>
                {buy ? '+' : '−'}{Math.abs(t.change).toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
      <div style={{ fontFamily: VM.mono, fontSize: 9, color: VM.ink3, marginTop: 10 }}>Shares · most recent filings</div>
    </SigCard>
  );
}
function titleCase(s) {
  return String(s || '').toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());
}

// The full signals block for a company Overview.
function SignalsPanel({ c, go, isMobile }) {
  const rec = useVMSignal(c.ticker, 'recommendation');
  const earn = useVMSignal(c.ticker, 'earnings');
  const peers = useVMSignal(c.ticker, 'peers');
  const insider = useVMSignal(c.ticker, 'insider');

  const cards = [
    rec.data.length && <RecommendationCard key="rec" rows={rec.data} />,
    earn.data.length && <EarningsCard key="earn" rows={earn.data} />,
    peers.data.length && <PeersCard key="peers" tickers={peers.data} self={c.ticker} go={go} />,
    insider.data.length && <InsiderCard key="ins" rows={insider.data} />,
  ].filter(Boolean);

  const anyLoading = rec.loading || earn.loading || peers.loading || insider.loading;
  if (!cards.length) {
    if (anyLoading) return (
      <div style={{ marginTop: 24, padding: '28px', textAlign: 'center', fontFamily: VM.mono, fontSize: 11, color: VM.ink3 }}>
        <i className="ti ti-loader-2" style={{ fontSize: 14 }}></i> Loading signals…
      </div>
    );
    return null;
  }
  return (
    <div style={{ marginTop: 28 }}>
      <div style={{ fontFamily: VM.mono, fontSize: 10, color: VM.terra, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Signals · live</div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        {cards}
      </div>
    </div>
  );
}

Object.assign(window, { VM_SIGNALS, vmSignal, useVMSignal, consensusScore, useVMConsensus, SignalsPanel });
