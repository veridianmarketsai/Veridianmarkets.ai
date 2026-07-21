// Veridian Markets — symbol search box with live dropdown (Finnhub symbol lookup).
//
// vmSearchSymbols(q) proxies the vm-search Lambda (Finnhub /search, cached). The
// SymbolSearchBox is a controlled input + results dropdown used on the Home and
// Search pages: it merges our curated companies (full dashboards) with the whole
// US listing universe from Finnhub, and navigates to a company dashboard on click.
//
// Until VM_SEARCH.url is set, remote lookup no-ops and the box still surfaces
// local (curated) matches — so nothing breaks before the Lambda is deployed.

const VM_SEARCH = { url: 'https://s7gvjup7o222m2khevipbybaty0muiec.lambda-url.us-east-1.on.aws/' };   // vm-search Lambda
const _vmSearchCache = {};
const VM_SEARCH_TTL = 10 * 60 * 1000;   // client cache 10 min

// Query → [{ ticker, name, type }] from the vm-search Lambda (client-cached).
async function vmSearchSymbols(query) {
  const q = String(query || '').trim();
  if (!VM_SEARCH.url || !q) return [];
  const key = q.toLowerCase();
  const hit = _vmSearchCache[key];
  if (hit && (Date.now() - hit.t) < VM_SEARCH_TTL) return hit.data;
  try {
    const res  = await fetch(`${VM_SEARCH.url}?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    const out  = (data.result || []).map((r) => ({ ticker: r.symbol, name: r.description, type: r.type })).filter((r) => r.ticker);
    _vmSearchCache[key] = { t: Date.now(), data: out };
    return out;
  } catch { return []; }
}

// Debounced remote lookup hook → { results, loading }.
function useVMSymbolSearch(query) {
  const [state, setState] = React.useState({ results: [], loading: false });
  React.useEffect(() => {
    const q = String(query || '').trim();
    if (!VM_SEARCH.url || q.length < 1) { setState({ results: [], loading: false }); return; }
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    const t = setTimeout(() => {
      vmSearchSymbols(q).then((r) => { if (alive) setState({ results: r, loading: false }); });
    }, 250);
    return () => { alive = false; clearTimeout(t); };
  }, [query]);
  return state;
}

// Controlled search input + dropdown. Parent owns `value` so it can also filter
// its own table; the dropdown is a quick-jump to any symbol. Pass `noDropdown`
// when the parent renders live/unmatched-ticker results itself (e.g. Screener's
// results table) instead of this box's own floating suggestion list.
function SymbolSearchBox({ value, onChange, go, placeholder, round, autoFocus, noDropdown }) {
  const [focused, setFocused] = React.useState(false);
  const blurTimer = React.useRef(null);
  const q  = String(value || '');
  const ql = q.trim().toLowerCase();

  // Curated matches (full dashboards) come first.
  const local = ql
    ? (typeof VM_COMPANIES !== 'undefined' ? VM_COMPANIES : [])
        .filter((c) => c.ticker.toLowerCase().includes(ql) || (c.name || '').toLowerCase().includes(ql))
        .slice(0, 6)
    : [];
  const localSet = new Set(local.map((c) => c.ticker.toUpperCase()));

  const { results: remote, loading } = useVMSymbolSearch(q);
  const remoteOnly = remote.filter((r) => !localSet.has(r.ticker.toUpperCase())).slice(0, 8);

  const open = !noDropdown && focused && ql.length >= 1;

  const pick = (co) => {
    setFocused(false);
    if (typeof vmCapture === 'function') vmCapture('search_select', { query: q.trim(), ticker: co.ticker });
    if (go) go('dashboard', co);
  };

  const rad = round ? 999 : 10;
  const rowStyle = { display:'flex', alignItems:'center', gap:10, padding:'9px 14px', cursor:'pointer' };
  const tickStyle = { fontFamily:VM.mono, fontSize:12, fontWeight:700, color:VM.ink, minWidth:58 };
  const nameStyle = { fontFamily:VM.serif, fontSize:13, color:VM.ink2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', flex:1 };

  return (
    <div style={{ position:'relative' }}
      onFocus={() => { if (blurTimer.current) clearTimeout(blurTimer.current); setFocused(true); }}
      onBlur={() => { blurTimer.current = setTimeout(() => setFocused(false), 160); }}>
      <div style={{ display:'flex', alignItems:'center', gap:9, background:VM.paper, border:`1px solid ${VM.border}`, borderRadius:rad, padding: round ? '9px 16px' : '10px 14px' }}>
        <i className="ti ti-search" style={{ fontSize:15, color:VM.ink3 }}></i>
        <input value={q} autoFocus={autoFocus} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || 'Search by ticker or company name…'}
          style={{ flex:1, border:'none', outline:'none', background:'transparent', fontFamily:VM.serif, fontSize:15, color:VM.ink }} />
        {loading && <i className="ti ti-loader-2" style={{ fontSize:13, color:VM.ink3 }}></i>}
        {q && <i onMouseDown={(e) => { e.preventDefault(); onChange(''); }} className="ti ti-x" style={{ fontSize:14, color:VM.ink3, cursor:'pointer' }} title="Clear"></i>}
      </div>

      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, right:0, zIndex:60,
          background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:12, overflow:'hidden',
          boxShadow:'0 16px 40px rgba(20,18,14,0.16)', maxHeight:360, overflowY:'auto' }}>
          {local.length > 0 && (
            <>
              <div style={{ padding:'7px 14px 4px', fontFamily:VM.mono, fontSize:9, letterSpacing:'0.08em', textTransform:'uppercase', color:VM.ink3 }}>Your companies</div>
              {local.map((c) => (
                <div key={c.ticker} onMouseDown={(e) => { e.preventDefault(); pick(c); }} style={rowStyle}
                  onMouseEnter={(e) => e.currentTarget.style.background = VM.tealTint}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <span style={tickStyle}>{c.ticker}</span>
                  <span style={nameStyle}>{c.name}</span>
                  <i className="ti ti-arrow-right" style={{ fontSize:13, color:VM.teal }}></i>
                </div>
              ))}
            </>
          )}
          {remoteOnly.length > 0 && (
            <>
              <div style={{ padding:'7px 14px 4px', fontFamily:VM.mono, fontSize:9, letterSpacing:'0.08em', textTransform:'uppercase', color:VM.ink3, borderTop: local.length ? `1px solid ${VM.borderHair}` : 'none' }}>All US listings</div>
              {remoteOnly.map((r) => (
                <div key={r.ticker} onMouseDown={(e) => { e.preventDefault(); pick({ ticker: r.ticker, name: r.name, cap: '—' }); }} style={rowStyle}
                  onMouseEnter={(e) => e.currentTarget.style.background = VM.tealTint}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <span style={tickStyle}>{r.ticker}</span>
                  <span style={nameStyle}>{r.name}</span>
                  {r.type && <span style={{ fontFamily:VM.mono, fontSize:9, color:VM.ink3, whiteSpace:'nowrap' }}>{r.type}</span>}
                  <i className="ti ti-arrow-right" style={{ fontSize:13, color:VM.teal }}></i>
                </div>
              ))}
            </>
          )}
          {!local.length && !remoteOnly.length && loading && (
            <div style={{ padding:'12px 14px', fontFamily:VM.serif, fontSize:13, color:VM.ink3 }}>Searching…</div>
          )}
          {!local.length && !remoteOnly.length && !loading && (
            <div style={{ padding:'12px 14px', fontFamily:VM.serif, fontSize:13, color:VM.ink3 }}>No matches for “{q}”.</div>
          )}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { VM_SEARCH, vmSearchSymbols, useVMSymbolSearch, SymbolSearchBox });
