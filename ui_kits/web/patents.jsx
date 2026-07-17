// Veridian Markets — real USPTO patents (Finnhub via vm-patents Lambda).
//
// useVMPatents(ticker) → { stats, byYear, recent, live, loading }.
// PatentsLive renders the Patents tab from real filings: a stat row, an
// approximate technology breakdown (keyword-classified from titles), a filing
// trend, and the recent patents list. If no real data, renders `fallback`.
// See finnhub-roadmap.md.

const VM_PATENTS = { url: 'https://adw6qigcencqugmypvjjolmjjy0hotns.lambda-url.us-east-1.on.aws/' };
const _vmPatentsCache = {};
const VM_PATENTS_TTL = 6 * 60 * 60 * 1000;   // client cache 6h

async function vmPatents(symbol) {
  const sym = String(symbol || '').toUpperCase();
  if (!VM_PATENTS.url || !sym) return null;
  const hit = _vmPatentsCache[sym];
  if (hit && (Date.now() - hit.t) < VM_PATENTS_TTL) return hit.data;
  try {
    const res  = await fetch(`${VM_PATENTS.url}?symbol=${encodeURIComponent(sym)}`);
    const data = await res.json();
    if (!data || data.error) return null;
    _vmPatentsCache[sym] = { t: Date.now(), data };
    return data;
  } catch { return null; }
}

function useVMPatents(ticker) {
  const [state, setState] = React.useState({ stats: null, byYear: [], recent: [], loading: false, live: false });
  React.useEffect(() => {
    if (!ticker || (typeof VM_IS_EQUITY === 'function' && !VM_IS_EQUITY(ticker))) {
      setState({ stats: null, byYear: [], recent: [], loading: false, live: false }); return;
    }
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    vmPatents(ticker).then((d) => {
      if (!alive) return;
      const live = !!(d && d.stats && d.stats.total);
      setState({ stats: d && d.stats || null, byYear: d && d.byYear || [], recent: d && d.recent || [], loading: false, live });
    }).catch(() => { if (alive) setState({ stats: null, byYear: [], recent: [], loading: false, live: false }); });
    return () => { alive = false; };
  }, [ticker]);
  return state;
}

// Approximate technology buckets from patent titles (keyword match, first wins).
const PATENT_BUCKETS = [
  { k: 'Semiconductor · circuits', c: '#1D4E3A', re: /semiconduc|transistor|circuit|processor|\bchip|wafer|fabricat|logic gate/i },
  { k: 'Display · optical',        c: '#C46A3B', re: /display|oled|lcd|\blens|optical|pixel|screen|projection/i },
  { k: 'Wireless · RF',            c: '#185FA5', re: /wireless|antenna|\brf\b|5g|cellular|bluetooth|\bradio|sidelink|network|modem/i },
  { k: 'AI · on-device ML',        c: '#2D5E5A', re: /neural|machine learning|inference|\bmodel\b|deep learning|\bai\b/i },
  { k: 'Battery · power',          c: '#B35A3A', re: /battery|\bpower\b|charging|thermal|energy stor/i },
  { k: 'Camera · imaging',         c: '#8A857D', re: /camera|imaging|\bimage|photograph|depth sens/i },
  { k: 'Audio · acoustic',         c: '#B6AFA2', re: /audio|acoustic|speaker|microphone|\bsound/i },
  { k: 'Health · sensors',         c: '#1F1D1A', re: /health|biometric|\bheart|physiolog|\bsensor/i },
];
function classifyPatents(recent) {
  const counts = {};
  (recent || []).forEach((p) => {
    const b = PATENT_BUCKETS.find((x) => x.re.test(p.title || ''));
    const k = b ? b.k : 'Other';
    counts[k] = (counts[k] || 0) + 1;
  });
  const total = (recent || []).length || 1;
  return Object.keys(counts)
    .map((k) => { const b = PATENT_BUCKETS.find((x) => x.k === k); return { k, n: counts[k], pct: Math.round((counts[k] / total) * 100), c: b ? b.c : '#B6AFA2' }; })
    .sort((a, b) => b.n - a.n);
}

const _pcard = (extra) => ({ background: VM.paper, border: `1px solid ${VM.borderSoft}`, borderRadius: 12, padding: 16, ...extra });

function PatentsLive({ c, isMobile, fallback }) {
  const { stats, byYear, recent, loading, live } = useVMPatents(c.ticker);

  if (loading) return (
    <div style={{ marginTop: 36, padding: '40px', textAlign: 'center', fontFamily: VM.mono, fontSize: 11, color: VM.ink3 }}>
      <i className="ti ti-loader-2" style={{ fontSize: 16 }}></i> Loading USPTO patents…
    </div>
  );
  if (!live) return fallback || null;

  const cats = classifyPatents(recent);
  const maxYear = Math.max(1, ...byYear.map((d) => d.n));
  const statCards = [
    ['Recent patents', stats.total.toLocaleString()],
    ['Granted',        stats.granted.toLocaleString()],
    ['Pending',        (stats.total - stats.granted).toLocaleString()],
    ['Latest year',    byYear[0] ? byYear[0].y : '—'],
  ];

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {statCards.map(([k, v]) => (
          <div key={k} style={_pcard({ padding: '14px 16px', borderRadius: 10 })}>
            <Label>{k}</Label>
            <div style={{ fontFamily: VM.mono, fontSize: 26, fontWeight: 700, color: VM.ink, marginTop: 6 }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 22 }}>
        <div style={_pcard()}>
          <h3 style={{ fontFamily: VM.serif, fontWeight: 700, fontSize: 17, margin: '0 0 4px' }}>Portfolio by technology</h3>
          <Mono size={9} color={VM.ink3} style={{ display: 'block', marginBottom: 12 }}>Approx · classified from titles</Mono>
          {cats.map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 32px 38px', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: i < cats.length - 1 ? `1px dotted ${VM.border}` : 'none' }}>
              <span style={{ fontFamily: VM.serif, fontSize: 12, color: VM.ink2 }}>{r.k}</span>
              <ProgressBar v={r.pct} color={r.c} />
              <Mono size={10} weight={600} style={{ textAlign: 'right' }}>{r.pct}%</Mono>
              <Mono size={10} color={VM.ink3} style={{ textAlign: 'right' }}>{r.n.toLocaleString()}</Mono>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {byYear.length > 1 && (
            <div style={_pcard()}>
              <h3 style={{ fontFamily: VM.serif, fontWeight: 700, fontSize: 17, margin: '0 0 14px' }}>Filing trend</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 90 }}>
                {byYear.slice().reverse().map((d, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                    <Mono size={9} color={VM.ink2} style={{ marginBottom: 4 }}>{d.n.toLocaleString()}</Mono>
                    <div style={{ width: '100%', height: Math.round((d.n / maxYear) * 56), background: VM.teal, borderRadius: '2px 2px 0 0' }}></div>
                    <div style={{ marginTop: 5 }}><Mono size={9} color={VM.ink3}>{d.y}</Mono></div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={_pcard()}>
            <h3 style={{ fontFamily: VM.serif, fontWeight: 700, fontSize: 17, margin: '0 0 12px' }}>Recent patents</h3>
            {recent.slice(0, 12).map((p, i) => (
              <div key={i} style={{ padding: '8px 0', borderBottom: i < 11 ? `1px dotted ${VM.border}` : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
                  <Mono size={10} color={VM.teal}>{p.patentNumber || 'application'}</Mono>
                  <Mono size={10} color={VM.ink3}>{(p.filingDate || '').slice(0, 10)}</Mono>
                </div>
                <div style={{ fontFamily: VM.serif, fontSize: 12.5, color: VM.ink, lineHeight: 1.45 }}>{titleCasePat(p.title)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ fontFamily: VM.mono, fontSize: 9, color: VM.ink3, marginTop: 14 }}>Patents · USPTO via Finnhub · cached ≤24h</div>
    </div>
  );
}

// Titles come in ALL CAPS or Mixed; normalise long all-caps ones to sentence-ish.
function titleCasePat(t) {
  const s = String(t || '');
  if (s === s.toUpperCase() && s.length > 4) return s.charAt(0) + s.slice(1).toLowerCase();
  return s;
}

Object.assign(window, { VM_PATENTS, vmPatents, useVMPatents, PatentsLive });
