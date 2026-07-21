// Veridian Markets — company profile + metrics (Finnhub via vm-profile Lambda).
//
// vmProfile(symbol) → { profile:{name,industry,country,exchange,ipo,marketCap,
// sharesOut,logo,weburl}, metric:{peTTM,dividendYield,week52High,week52Low,beta,
// epsTTM,roeTTM,grossMarginTTM,netMarginTTM,revenueGrowthYoY} }.
//
// Used by CompanyHead (real P/E · yield · mkt cap) and by the Overview tab of a
// searched-but-not-curated ticker (ProfileOverview). US equities only; a miss
// leaves the existing behaviour untouched. See finnhub-roadmap.md.

const VM_PROFILE = { url: 'https://tdo5iphnrzydye7z37t2ophxga0abiwp.lambda-url.us-east-1.on.aws/' };
const _vmProfileCache = {};
const VM_PROFILE_TTL = 6 * 60 * 60 * 1000;   // client cache 6h

async function vmProfile(symbol) {
  const sym = String(symbol || '').toUpperCase();
  if (!VM_PROFILE.url || !sym) return null;
  const hit = _vmProfileCache[sym];
  if (hit && (Date.now() - hit.t) < VM_PROFILE_TTL) return hit.data;
  try {
    const res  = await fetch(`${VM_PROFILE.url}?symbol=${encodeURIComponent(sym)}`);
    const data = await res.json();
    if (!data || data.error) return null;
    _vmProfileCache[sym] = { t: Date.now(), data };
    return data;
  } catch { return null; }
}

// Hook → { profile, metric, loading, live }.
function useVMProfile(ticker) {
  const [state, setState] = React.useState({ profile: null, metric: null, loading: false, live: false });
  React.useEffect(() => {
    if (!ticker || (typeof VM_IS_EQUITY === 'function' && !VM_IS_EQUITY(ticker))) {
      setState({ profile: null, metric: null, loading: false, live: false }); return;
    }
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    vmProfile(ticker).then((d) => {
      if (!alive) return;
      setState({ profile: d && d.profile || null, metric: d && d.metric || null, loading: false, live: !!(d && d.profile) });
    }).catch(() => { if (alive) setState({ profile: null, metric: null, loading: false, live: false }); });
    return () => { alive = false; };
  }, [ticker]);
  return state;
}

// ── formatters ───────────────────────────────────────────────────────────────
function vmFmtCap(m) {   // m = market cap in USD millions
  if (m == null) return null;
  if (m >= 1e6) return `$${(m / 1e6).toFixed(2)}T`;
  if (m >= 1e3) return `$${(m / 1e3).toFixed(1)}B`;
  return `$${m.toFixed(0)}M`;
}
const vmPct1 = (x) => (x == null ? '—' : `${Number(x).toFixed(2)}%`);
const vmNum2 = (x) => (x == null ? '—' : Number(x).toFixed(2));

// Real key-metrics grid for any ticker (self-fetches; hides if unavailable).
// Used on both the searched-ticker Overview and the curated company Overview.
function LiveMetrics({ ticker, isMobile, title }) {
  const { profile, metric, live } = useVMProfile(ticker);
  if (!live || !metric) return null;
  const p = profile || {}, m = metric;
  const stats = [
    ['Market cap',     vmFmtCap(p.marketCap)],
    ['P/E (TTM)',      vmNum2(m.peTTM)],
    ['Dividend yield', vmPct1(m.dividendYield)],
    ['52-wk range',    (m.week52Low != null && m.week52High != null) ? `$${m.week52Low.toFixed(2)} – $${m.week52High.toFixed(2)}` : '—'],
    ['Beta',           vmNum2(m.beta)],
    ['EPS (TTM)',      m.epsTTM != null ? `$${m.epsTTM.toFixed(2)}` : '—'],
    ['Gross margin',   vmPct1(m.grossMarginTTM)],
    ['Net margin',     vmPct1(m.netMarginTTM)],
    ['ROE (TTM)',      vmPct1(m.roeTTM)],
    ['Rev growth YoY', vmPct1(m.revenueGrowthYoY)],
  ];
  return (
    <div style={{ background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:12, padding:'18px 20px' }}>
      <div style={{ fontFamily:VM.mono, fontSize:9, letterSpacing:'0.08em', textTransform:'uppercase', color:VM.ink3, marginBottom:12 }}>{title || 'Key metrics · live'}</div>
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(5, 1fr)', gap:'14px 18px' }}>
        {stats.map(([k, v]) => (
          <div key={k}>
            <div style={{ fontFamily:VM.mono, fontSize:9, letterSpacing:'0.05em', textTransform:'uppercase', color:VM.ink3 }}>{k}</div>
            <div style={{ fontFamily:VM.mono, fontSize:15, fontWeight:700, color:VM.ink, marginTop:3 }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ETF holdings aren't on Finnhub's free tier (/etf/holdings is premium-gated,
// confirmed 2026-07-21) — redirect out to a holdings aggregator instead of
// building/maintaining our own constituent data.
function EtfHoldingsLink({ ticker }) {
  if (typeof VM_IS_ETF !== 'function' || !VM_IS_ETF(ticker)) return null;
  const url = `https://stockanalysis.com/etf/${encodeURIComponent(String(ticker).toLowerCase())}/holdings/`;
  return (
    <div style={{ background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:12, padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16 }}>
      <div>
        <div style={{ fontFamily:VM.serif, fontWeight:700, fontSize:14, color:VM.ink }}>Full holdings list</div>
        <div style={{ fontFamily:VM.serif, fontSize:12.5, color:VM.ink3, marginTop:2 }}>Constituent companies aren't available on our current data plan yet.</div>
      </div>
      <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontFamily:VM.mono, fontSize:11, color:VM.teal, textDecoration:'none', whiteSpace:'nowrap', flexShrink:0 }}>
        View holdings ↗
      </a>
    </div>
  );
}

// Overview panel for a non-curated ticker — real Finnhub profile + metrics.
function ProfileOverview({ c, go, isMobile }) {
  const { profile, metric, loading, live } = useVMProfile(c.ticker);

  if (loading) return (
    <div style={{ marginTop:36, padding:'40px 24px', textAlign:'center', fontFamily:VM.mono, fontSize:11, color:VM.ink3 }}>
      <i className="ti ti-loader-2" style={{ fontSize:16 }}></i> Loading company profile…
    </div>
  );
  if (!live) return (
    <div style={{ marginTop:24, display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ border:`1px solid ${VM.borderSoft}`, borderRadius:12, background:VM.paper, padding:'48px 24px', textAlign:'center' }}>
        <i className="ti ti-building" style={{ fontSize:30, color:VM.ink3 }}></i>
        <div style={{ fontFamily:VM.serif, fontWeight:700, fontSize:18, color:VM.ink, marginTop:14 }}>Company profile not yet available</div>
        <div style={{ fontFamily:VM.serif, fontSize:14, color:VM.ink3, marginTop:8 }}>No Finnhub profile for <b>{c.ticker}</b>. Live price and financials are still available.</div>
      </div>
      <EtfHoldingsLink ticker={c.ticker} />
    </div>
  );

  const p = profile, m = metric || {};
  const facts = [
    ['Industry',   p.industry],
    ['Exchange',   p.exchange],
    ['Country',    p.country],
    ['IPO',        p.ipo],
    ['Shares out', p.sharesOut != null ? `${(p.sharesOut / 1000).toFixed(2)}B` : null],
    ['Currency',   p.currency],
  ].filter(([, v]) => v);
  const card = { background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:12, padding:'18px 20px' };

  return (
    <div style={{ marginTop:24, display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ ...card, display:'flex', alignItems:'center', gap:16 }}>
        {p.logo && <img src={p.logo} alt="" style={{ width:44, height:44, borderRadius:8, objectFit:'contain', background:'#fff', border:`1px solid ${VM.borderHair}` }} />}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:VM.serif, fontWeight:700, fontSize:20, color:VM.ink }}>{p.name || c.ticker}</div>
          <div style={{ fontFamily:VM.serif, fontSize:13, color:VM.ink3 }}>{[p.industry, p.exchange].filter(Boolean).join(' · ')}</div>
        </div>
        {p.weburl && <a href={p.weburl} target="_blank" rel="noopener noreferrer" style={{ fontFamily:VM.mono, fontSize:11, color:VM.teal, textDecoration:'none', whiteSpace:'nowrap' }}>Website ↗</a>}
      </div>

      <LiveMetrics ticker={c.ticker} isMobile={isMobile} title="Key metrics" />

      <EtfHoldingsLink ticker={c.ticker} />

      <div style={card}>
        <div style={{ fontFamily:VM.mono, fontSize:9, letterSpacing:'0.08em', textTransform:'uppercase', color:VM.ink3, marginBottom:12 }}>Company facts</div>
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:'8px 24px' }}>
          {facts.map(([k, v]) => (
            <div key={k} style={{ display:'flex', justifyContent:'space-between', gap:12, padding:'5px 0', borderBottom:`1px dotted ${VM.border}` }}>
              <span style={{ fontFamily:VM.serif, fontSize:13, color:VM.ink3 }}>{k}</span>
              <span style={{ fontFamily:VM.serif, fontSize:13, color:VM.ink, textAlign:'right' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ fontFamily:VM.mono, fontSize:9, color:VM.ink3, letterSpacing:'0.03em' }}>Profile · Finnhub · cached ≤24h</div>
      {typeof SignalsPanel === 'function' && <SignalsPanel c={c} go={go} isMobile={isMobile} />}
    </div>
  );
}

Object.assign(window, { VM_PROFILE, vmProfile, useVMProfile, vmFmtCap, vmPct1, vmNum2, LiveMetrics, ProfileOverview });
