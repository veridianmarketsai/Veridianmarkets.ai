// Veridian Markets — Company search / screener with eye-preview.

// Does a live consensus score satisfy the chosen ANALYST filter value?
// Unknown score (still loading / no coverage) → keep the row (don't hide).
function analystMatch(score, v) {
  if (score == null) return true;
  if (v === 'Strong buy')     return score >= 4.3;
  if (v === 'Buy or better')  return score >= 3.5;
  if (v === 'Hold or better') return score >= 2.5;
  if (v === 'Underperform')   return score < 2.5;
  return true;
}

function Screener({ go, isMobile }) {
  const [open, setOpen] = React.useState(null);
  const [filters, setFilters] = React.useState([
    { k:'SECTOR', v:'Technology' }, { k:'MARKET CAP', v:'> $10B' },
    { k:'P/E', v:'< 40' }, { k:'ANALYST', v:'Buy or better' },
  ]);
  const setFilterVal = (i, v) => setFilters(fs => fs.map((f, j) => j === i ? { ...f, v } : f));
  const removeFilter = (i) => setFilters(fs => fs.filter((_, j) => j !== i));
  const addFilter = (k) => setFilters(fs => [...fs, { k, v: FILTER_DEFS[k][0] }]);
  const [query, setQuery] = React.useState('');   // search box (ticker/name filter + symbol dropdown)
  const ql = query.trim().toLowerCase();
  const searched = ql ? VM_COMPANIES.filter(c => c.ticker.toLowerCase().includes(ql) || (c.name || '').toLowerCase().includes(ql)) : VM_COMPANIES;
  // Real analyst filter: when an ANALYST chip is active, fetch each company's
  // live consensus and keep only those that meet the threshold.
  const analystFilter = filters.find(f => f.k === 'ANALYST');
  const consensus = typeof useVMConsensus === 'function' ? useVMConsensus(analystFilter ? searched.map(c => c.ticker) : []) : {};
  const shown = analystFilter ? searched.filter(c => analystMatch(consensus[c.ticker], analystFilter.v)) : searched;
  const liveMap = useVMQuotes(shown.map(c => c.ticker));   // live quotes overlay

  // No curated match — look up the query against the whole US listing universe
  // (same lookup the search box's own dropdown uses) and show any hit as a row
  // right here instead of only in a floating dropdown.
  const { results: symbolResults, loading: symbolLoading } = typeof useVMSymbolSearch === 'function' ? useVMSymbolSearch(query) : { results: [], loading: false };
  const liveMatches = (shown.length === 0 && ql) ? symbolResults.slice(0, 8) : [];
  const liveQuoteMap = useVMQuotes(liveMatches.map(r => r.ticker));

  return (
    <div style={{ padding: isMobile ? '16px 14px 80px' : '26px 32px 60px', maxWidth:1120, margin:'0 auto' }}>
      <Mono size={11} color={VM.ink3} style={{ letterSpacing:'0.04em' }}>Explore  ›  <b style={{color:VM.ink}}>Search</b></Mono>
      <div style={{ marginTop:14 }}><Kicker>EXPLORE · 4,904 PUBLIC COMPANIES</Kicker></div>
      <h1 style={{ fontFamily:VM.serif, fontWeight:700, fontSize: isMobile ? 28 : 38, margin:'8px 0 6px' }}>Search.</h1>
      <p style={{ fontFamily:VM.serif, fontSize: isMobile ? 14 : 16, color:VM.ink3, margin:'0 0 18px' }}>Search by ticker, name, or person. Filter by sector, size, fundamentals, or which 5-year historical analogue matches today.</p>

      <div data-tour="vm-screener-search" style={{ display:'flex', gap:9, alignItems:'center', flexWrap:'wrap', marginBottom:14 }}>
        <div style={{ flex:1, minWidth:220 }}>
          <SymbolSearchBox value={query} onChange={setQuery} go={go} round noDropdown
            placeholder="Search any US stock — ticker or company name…" />
        </div>
        <Btn style={{ borderRadius:999 }}>Filter <i className="ti ti-chevron-down" style={{fontSize:12}}></i></Btn>
        <IconBtn icon="arrows-sort" round size={38} title="Sort" />
        <IconBtn icon="lock" round size={38} title="Saved" />
      </div>

      <div data-tour="vm-screener-filters" style={{ display:'flex', gap:7, alignItems:'center', flexWrap:'wrap', marginBottom:14 }}>
        <Label style={{marginRight:2}}>Filters:</Label>
        {filters.map((f,i)=>(
          <FilterPill key={f.k} k={f.k} v={f.v} options={FILTER_DEFS[f.k] || []}
            onChange={(v)=>setFilterVal(i, v)} onRemove={()=>removeFilter(i)} />
        ))}
        <AddFilter active={filters.map(f=>f.k)} onAdd={addFilter} />
        {filters.length > 0 && (
          <span onClick={()=>setFilters([])} title="Remove all filters"
            style={{ fontFamily:VM.mono, fontSize:11, color:VM.ink3, cursor:'pointer', padding:'6px 8px', whiteSpace:'nowrap', display:'inline-flex', alignItems:'center', gap:5 }}>
            <i className="ti ti-x" style={{ fontSize:12 }}></i>Clear all
          </span>
        )}
      </div>
      <Mono size={10} color={VM.ink3} style={{ display:'block', marginBottom:8 }}>showing {shown.length} of {VM_COMPANIES.length} companies{ql ? ` · “${query}”` : ''}{analystFilter ? ` · analyst: ${analystFilter.v} (live)` : ''} · sort: 5Y analogue match</Mono>

      <div data-tour="vm-screener-results" style={{ background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:12 }}>
        {!isMobile && (
          <div style={{ display:'grid', gridTemplateColumns:GRID, padding:'7px 18px', background:VM.paperWarm, borderBottom:`1px solid ${VM.borderSoft}`, borderRadius:'12px 12px 0 0' }}>
            <Label>Ticker</Label><Label>Company</Label><Label style={{textAlign:'right'}}>Price</Label>
            <Label style={{textAlign:'right'}}>Chg</Label><Label></Label><Label style={{textAlign:'right'}}>Actions</Label>
          </div>
        )}
        {shown.length === 0 && ql && symbolLoading && (
          <div style={{ padding:'18px', fontFamily:VM.mono, fontSize:11, color:VM.ink3 }}>
            <i className="ti ti-loader-2" style={{ fontSize:13 }}></i> Searching all US listings for “{query}”…
          </div>
        )}
        {shown.length === 0 && ql && !symbolLoading && liveMatches.length > 0 && (
          <>
            <div style={{ padding:'12px 18px 0', fontFamily:VM.serif, fontSize:13, color:VM.ink3 }}>
              “{query}” isn't in our curated list, but it's a real US listing:
            </div>
            {liveMatches.map((r, i) => (
              <LiveMatchRow key={r.ticker} r={r} liveMap={liveQuoteMap} go={go} last={i === liveMatches.length - 1} isMobile={isMobile} />
            ))}
          </>
        )}
        {shown.length === 0 && ql && !symbolLoading && liveMatches.length === 0 && (
          <div style={{ padding:'18px', fontFamily:VM.serif, fontSize:14, color:VM.ink3 }}>No listings found for “{query}”.</div>
        )}
        {shown.length === 0 && !ql && (
          <div style={{ padding:'18px', fontFamily:VM.serif, fontSize:14, color:VM.ink3 }}>No companies match the current filters.</div>
        )}
        {shown.map((c,i)=>{
          const lc = vmApply(c, liveMap);
          return (
            <Row key={c.ticker} c={lc} open={open===c.ticker} last={i===shown.length-1} isMobile={isMobile}
              onEye={()=>setOpen(open===c.ticker?null:c.ticker)}
              onNet={()=>go('supply', lc)} onOpen={()=>go('dashboard', lc)} />
          );
        })}
      </div>
    </div>
  );
}
const GRID = '92px 1fr 90px 68px 76px 104px';

function Row({ c, open, last, onEye, onNet, onOpen, isMobile }) {
  const [hover, setHover] = React.useState(false);
  const [sel, setSel] = React.useState(false);   // mobile: first tap selects the row & reveals the actions
  const pop = hover && !open;   // lift into a box on hover (matches the home page)

  // ── Mobile: a contained card. Tap once to select (reveals Preview / Dashboard),
  //    tap again to choose one. No wide grid, no off-screen buttons.
  if (isMobile) {
    const active = sel || open;
    return (
      <div style={{ borderBottom: last && !open ? 'none' : `1px solid ${VM.borderSoft}`, background: open ? VM.tealTint : 'transparent' }}>
        <div onClick={()=>setSel(s=>!s)} style={{ padding:'12px 15px', cursor:'pointer', background: (sel && !open) ? VM.paperWarm : 'transparent' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontFamily:VM.serif, fontWeight:700, fontSize:20, flexShrink:0 }}>{c.ticker}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <Mono size={11.5} color={VM.ink2} style={{ display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</Mono>
              <Label>{c.sector}</Label>
            </div>
            <div style={{ textAlign:'right', flexShrink:0 }}>
              <Mono size={13} weight={700}>${c.price}</Mono>
              <div><Chg dir={c.dir}>{c.chg}</Chg></div>
            </div>
          </div>
          {active && (
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:11 }}>
              <button onClick={(e)=>{ e.stopPropagation(); onEye(); }}
                style={{ display:'inline-flex', alignItems:'center', gap:6, fontFamily:VM.serif, fontSize:13, padding:'8px 14px', borderRadius:999,
                  border:`1px solid ${open ? VM.forest : VM.border}`, background: open ? VM.tealTint : VM.paper, color:VM.ink, cursor:'pointer' }}>
                <i className="ti ti-eye" style={{ fontSize:14 }}></i> Preview
              </button>
              <button onClick={(e)=>{ e.stopPropagation(); onOpen(); }}
                style={{ display:'inline-flex', alignItems:'center', gap:6, fontFamily:VM.serif, fontSize:13, padding:'8px 14px', borderRadius:999,
                  border:`1px solid ${VM.forest}`, background:VM.forest, color:VM.paperWarm, cursor:'pointer' }}>
                Dashboard <i className="ti ti-arrow-right" style={{ fontSize:14 }}></i>
              </button>
            </div>
          )}
        </div>
        <div style={{ maxHeight: open ? 900 : 0, overflow:'hidden', transition:'max-height .35s ease' }}>
          <Preview c={c} onOpen={onOpen} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ borderBottom: last&&!open?'none':`1px solid ${VM.borderSoft}`, background: open?VM.tealTint:'transparent', position:'relative', zIndex: pop?2:1 }}>
      <div onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
        style={{ display:'grid', gridTemplateColumns:GRID, alignItems:'center', gap:10, padding:'12px 18px',
          background: pop?VM.paperWarm:'transparent',
          transform: pop?'scale(1.012)':'scale(1)',
          boxShadow: pop?'0 6px 18px rgba(31,29,26,0.10)':'none',
          borderRadius: pop?10:0,
          transition:'transform .16s ease, box-shadow .16s ease, background .16s ease' }}>
        <span onClick={onOpen} title={`Open ${c.ticker} dashboard`}
          style={{ fontFamily:VM.serif, fontWeight:700, fontSize:22, cursor:'pointer',
            textDecoration: hover ? 'underline' : 'none', textUnderlineOffset:3, textDecorationColor:VM.teal }}>{c.ticker}</span>
        <div onClick={onOpen} title={`Open ${c.ticker} dashboard`} style={{ cursor:'pointer' }}>
          <Mono size={11.5} color={VM.ink2}>{c.name}</Mono><div><Label>{c.sector}</Label></div></div>
        <Mono size={13} weight={700} style={{textAlign:'right'}}>${c.price}</Mono>
        <span style={{textAlign:'right'}}><Chg dir={c.dir}>{c.chg}</Chg></span>
        <Sparkline dir={c.dir} w={64} h={22} />
        {/* actions reveal on hover (or while open) — large squares that go green on hover. */}
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end',
          opacity: (hover || open) ? 1 : 0, pointerEvents: (hover || open) ? 'auto' : 'none', transition:'opacity .16s ease' }}>
          <SqBtn icon="eye" active={open} onAct={onEye} title="Preview" />
          <SqBtn icon="arrow-right" onAct={onOpen} title="Open dashboard" />
        </div>
      </div>
      <div style={{ maxHeight: open?540:0, overflow:'hidden', transition:'max-height .35s ease' }}>
        <Preview c={c} onOpen={onOpen} />
      </div>
    </div>
  );
}

// A real US listing that isn't in our curated set (no analogue data, no
// Preview) — same grid as Row, just a live quote (if the ticker prices) and a
// straight "open dashboard" action instead of the eye-preview.
function LiveMatchRow({ r, liveMap, go, last, isMobile }) {
  const [hover, setHover] = React.useState(false);
  const q = liveMap && liveMap[String(r.ticker).toUpperCase()];
  const price = q ? q.price.toFixed(2) : null;
  const chg = q ? vmFmtPct(q.pct) : null;
  const openIt = () => go('dashboard', { ticker: r.ticker, name: r.name, cap: '—' });

  if (isMobile) {
    return (
      <div onClick={openIt} style={{ padding:'12px 15px', cursor:'pointer', borderBottom: last ? 'none' : `1px solid ${VM.borderSoft}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontFamily:VM.serif, fontWeight:700, fontSize:20, flexShrink:0 }}>{r.ticker}</span>
          <div style={{ flex:1, minWidth:0 }}>
            <Mono size={11.5} color={VM.ink2} style={{ display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.name}</Mono>
            <Label>{r.type || 'US listing'}</Label>
          </div>
          {price != null && (
            <div style={{ textAlign:'right', flexShrink:0 }}>
              <Mono size={13} weight={700}>${price}</Mono>
              <div><Chg dir={q.dir}>{chg}</Chg></div>
            </div>
          )}
          <i className="ti ti-arrow-right" style={{ fontSize:16, color:VM.teal, flexShrink:0 }}></i>
        </div>
      </div>
    );
  }

  return (
    <div onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} onClick={openIt}
      style={{ display:'grid', gridTemplateColumns:GRID, alignItems:'center', gap:10, padding:'12px 18px', cursor:'pointer',
        borderBottom: last ? 'none' : `1px solid ${VM.borderSoft}`,
        background: hover ? VM.paperWarm : 'transparent', transition:'background .14s ease' }}>
      <span style={{ fontFamily:VM.serif, fontWeight:700, fontSize:22,
        textDecoration: hover ? 'underline' : 'none', textUnderlineOffset:3, textDecorationColor:VM.teal }}>{r.ticker}</span>
      <div><Mono size={11.5} color={VM.ink2}>{r.name}</Mono><div><Label>{r.type || 'US listing'}</Label></div></div>
      <Mono size={13} weight={700} style={{textAlign:'right'}}>{price != null ? `$${price}` : '—'}</Mono>
      <span style={{textAlign:'right'}}>{chg != null ? <Chg dir={q.dir}>{chg}</Chg> : <Mono size={12} color={VM.ink3}>—</Mono>}</span>
      <span></span>
      <div style={{ display:'flex', gap:8, justifyContent:'flex-end', opacity: hover ? 1 : 0, pointerEvents: hover ? 'auto' : 'none', transition:'opacity .16s ease' }}>
        <SqBtn icon="arrow-right" onAct={openIt} title={`Open ${r.ticker} dashboard`} />
      </div>
    </div>
  );
}

// Row action — a large square button that turns green on hover (or while active).
function SqBtn({ icon, active, onAct, title }) {
  const [h, setH] = React.useState(false);
  const on = h || active;
  return (
    <button onClick={(e)=>{ e.stopPropagation(); onAct(); }} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} title={title}
      style={{ width:40, height:40, borderRadius:9, cursor:'pointer', padding:0,
        border:`1px solid ${on ? VM.forest : VM.border}`, background: on ? VM.forest : VM.paper, color: on ? VM.paperWarm : VM.ink2,
        display:'flex', alignItems:'center', justifyContent:'center',
        transition:'background .14s ease, color .14s ease, border-color .14s ease' }}>
      <i className={'ti ti-' + icon} style={{ fontSize:18 }}></i>
    </button>
  );
}

function Preview({ c, onOpen }) {
  const [tab, setTab] = React.useState('Overview');
  const data = resolveCompany(c.ticker);
  const tabs = ['Overview','Supply chain','Financials','Patents','History','News'];

  return (
    <div style={{ margin:'0 18px 16px', background:VM.paper, border:`1px solid ${VM.border}`, borderRadius:12, overflow:'hidden' }}>
      {/* header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 16px', background:VM.paperWarm, borderBottom:`1px solid ${VM.borderSoft}` }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
          <Mono size={16} weight={700}>{c.ticker}</Mono>
          <span style={{ fontFamily:VM.serif, fontSize:13, color:VM.ink3 }}>{c.name}</span>
          <Mono size={12} color={VM.ink3}>· ${c.price}</Mono>
          <Chg dir={c.dir}>{c.chg}</Chg>
        </div>
        <Btn solid style={{ padding:'5px 12px', fontSize:12 }} onClick={onOpen}>
          <i className="ti ti-external-link" style={{fontSize:11}}></i> Open dashboard
        </Btn>
      </div>

      {/* tab bar */}
      <div style={{ display:'flex', padding:'0 16px', borderBottom:`1px solid ${VM.borderSoft}`, gap:4 }}>
        {tabs.map(t => (
          <span key={t} onClick={()=>setTab(t)} style={{
            fontFamily:VM.serif, fontSize:12, padding:'7px 9px', cursor:'pointer',
            color: tab===t ? VM.ink : VM.ink3,
            fontWeight: tab===t ? 600 : 400,
            borderBottom: tab===t ? `2px solid ${VM.ink}` : '2px solid transparent',
            marginBottom:-1,
          }}>{t}</span>
        ))}
      </div>

      {/* content */}
      <div style={{ padding:14 }}>
        {tab === 'Overview'     && <PreviewOverview     c={c} />}
        {tab === 'Supply chain' && <PreviewScn          c={c} />}
        {tab === 'Financials'   && <DashFinancials      data={data.financials} />}
        {tab === 'Patents'      && <PreviewPatents      data={data.patents} />}
        {tab === 'History'      && <PreviewHistory      c={c} data={data.history} />}
        {tab === 'News'         && <PreviewNews         c={c} />}
      </div>
    </div>
  );
}

// ── Overview (existing two-box layout) ────────────────────────────────────────
function PreviewOverview({ c }) {
  const hasScn = c.inputs && c.customers;
  return (
    <div style={{ display:'grid', gridTemplateColumns: hasScn ? '1.4fr 1fr' : '1fr', gap:14 }}>
      {hasScn && (
        <div>
          <Label style={{color:VM.terra}}>SUPPLY CHAIN PREVIEW</Label>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:10, gap:6 }}>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              {c.inputs.slice(0,4).map(n => <Node key={n.t} kind="input" t={n.t} />)}
            </div>
            <div style={{ width:60, height:60, borderRadius:8, background:VM.forest, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Mono size={12} weight={700} color={VM.tealTint}>{c.ticker}</Mono>
              <span style={{ fontFamily:VM.mono, fontSize:7, color:'#5DCAA5', marginTop:2 }}>principle</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              {c.customers.slice(0,4).map(n => <Node key={n.t} kind="customer" t={n.t} />)}
            </div>
          </div>
          <Mono size={9} color={VM.ink3} style={{ display:'block', marginTop:8 }}>
            {c.inputs.length} suppliers · {c.customers.length} customers · all public
          </Mono>
        </div>
      )}
      <div style={{ borderLeft: hasScn ? `1px solid ${VM.borderSoft}` : 'none', paddingLeft: hasScn ? 14 : 0 }}>
        <Label style={{color:VM.terra}}>HISTORY</Label>
        <div style={{ fontFamily:VM.serif, fontWeight:700, fontSize:16, margin:'8px 0 4px' }}>
          Reads like {c.analogue} in {c.analogueYear}.
        </div>
        <Mono size={9} color={VM.ink3}>CLOSEST ANALOGUE · {c.match}%</Mono>
        <div style={{ marginTop:8 }}><OverlayChart h={70} legend={false} thenYear={c.analogueYear} /></div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:8 }}>
          <div><Label>Bear P25</Label><div><Mono size={13} weight={700} color={VM.downInk}>-18%</Mono></div></div>
          <div style={{textAlign:'center'}}><Label>Base P50</Label><div><Mono size={13} weight={700} color={VM.teal}>+62%</Mono></div></div>
          <div style={{textAlign:'right'}}><Label>Bull P75</Label><div><Mono size={13} weight={700} color={VM.upInk}>+148%</Mono></div></div>
        </div>
      </div>
    </div>
  );
}

// ── Supply chain preview ──────────────────────────────────────────────────────
function PreviewScn({ c }) {
  if (!c.inputs) return (
    <Mono size={11} color={VM.ink3} style={{ display:'block', padding:'16px 0' }}>
      Supply chain data not yet loaded for {c.ticker}.
    </Mono>
  );
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 52px 1fr', gap:12, alignItems:'start' }}>
      <div>
        <Label style={{ display:'block', marginBottom:8 }}>Inputs · suppliers</Label>
        {c.inputs.map(n => (
          <div key={n.t} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:`1px dotted ${VM.border}` }}>
            <Mono size={10} weight={600}>{n.t}</Mono>
            <Mono size={10} color={VM.ink3}>{n.d}</Mono>
          </div>
        ))}
        {(c.external||[]).length > 0 && <>
          <Label style={{ display:'block', marginTop:10, marginBottom:6 }}>External factors</Label>
          {c.external.map(n => (
            <div key={n.t} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:`1px dotted ${VM.border}` }}>
              <Mono size={10} weight={600} color={VM.terra}>{n.t}</Mono>
              <Mono size={10} color={VM.ink3}>{n.d}</Mono>
            </div>
          ))}
        </>}
      </div>
      <div style={{ display:'flex', justifyContent:'center', paddingTop:22 }}>
        <div style={{ width:52, height:52, borderRadius:7, background:VM.forest, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          <Mono size={10} weight={700} color={VM.tealTint}>{c.ticker}</Mono>
          <span style={{ fontFamily:VM.mono, fontSize:7, color:'#5DCAA5', marginTop:1 }}>principle</span>
        </div>
      </div>
      <div>
        <Label style={{ display:'block', marginBottom:8 }}>Customers · channels</Label>
        {c.customers.map(n => (
          <div key={n.t} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:`1px dotted ${VM.border}` }}>
            <Mono size={10} weight={600} color={VM.tealInk}>{n.t}</Mono>
            <Mono size={10} color={VM.ink3}>{n.d}</Mono>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Patents preview ───────────────────────────────────────────────────────────
function PreviewPatents({ data }) {
  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8, marginBottom:14 }}>
        {data.stats.map(([k,v]) => (
          <div key={k} style={{ background:VM.paperWarm, border:`1px solid ${VM.borderSoft}`, borderRadius:8, padding:'8px 10px' }}>
            <Label>{k}</Label>
            <div style={{ fontFamily:VM.mono, fontSize:16, fontWeight:700, color:VM.ink, marginTop:3 }}>{v}</div>
          </div>
        ))}
      </div>
      <Label style={{ display:'block', marginBottom:8 }}>Top technology areas</Label>
      {data.cats.slice(0, 4).map((r, i) => (
        <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 80px 32px', alignItems:'center', gap:8, padding:'4px 0' }}>
          <span style={{ fontFamily:VM.serif, fontSize:12, color:VM.ink2 }}>{r.k}</span>
          <ProgressBar v={r.pct} color={r.c} />
          <Mono size={10} weight={600} style={{ textAlign:'right' }}>{r.pct}%</Mono>
        </div>
      ))}
    </div>
  );
}

// ── History preview ───────────────────────────────────────────────────────────
function PreviewHistory({ c, data }) {
  const col = { CLOSEST:VM.teal, ECHO:VM.tealInk, MIXED:VM.terra, WARNING:VM.downInk };
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:14 }}>
      <div>
        <Label style={{ display:'block', marginBottom:8, color:VM.terra }}>ANALOGUE MATCHES</Label>
        {data.analogues.slice(0, 5).map((a, i) => (
          <div key={i} style={{ display:'flex', gap:8, alignItems:'center', padding:'5px 0', borderBottom:`1px dotted ${VM.border}` }}>
            <Mono size={11} weight={700} color={col[a.outcome]} style={{ minWidth:36 }}>{a.ticker}</Mono>
            <Mono size={10} color={VM.ink3} style={{ minWidth:32 }}>{a.year}</Mono>
            <Mono size={10} color={VM.ink3} style={{ minWidth:30 }}>{a.match}%</Mono>
            <Mono size={11} weight={600} color={a.dir==='up' ? VM.upInk : VM.downInk} style={{ flex:1, textAlign:'right' }}>{a.ret}</Mono>
            <span style={{ fontFamily:VM.mono, fontSize:8, fontWeight:700, color:col[a.outcome], letterSpacing:'0.05em', minWidth:50, textAlign:'right' }}>{a.outcome}</span>
          </div>
        ))}
      </div>
      <div style={{ borderLeft:`1px solid ${VM.borderSoft}`, paddingLeft:14 }}>
        <Label style={{color:VM.terra}}>SCENARIO RANGE · 5Y</Label>
        <div style={{ marginTop:8 }}><OverlayChart h={70} legend={false} thenYear={c.analogueYear} /></div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:8 }}>
          <div><Label>Bear P25</Label><div><Mono size={13} weight={700} color={VM.downInk}>-18%</Mono></div></div>
          <div style={{textAlign:'center'}}><Label>Base P50</Label><div><Mono size={13} weight={700} color={VM.teal}>+62%</Mono></div></div>
          <div style={{textAlign:'right'}}><Label>Bull P75</Label><div><Mono size={13} weight={700} color={VM.upInk}>+148%</Mono></div></div>
        </div>
      </div>
    </div>
  );
}

// ── News preview ──────────────────────────────────────────────────────────────
function PreviewNews({ c }) {
  const tagged = NEWS.filter(n => n.ticker === c.ticker);
  const list = tagged.length ? tagged : NEWS.slice(0, 3);   // fallback to general stories
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <Label style={{ display:'block', color:VM.terra }}>{tagged.length ? `Tagged ${c.ticker}` : 'Latest market stories'}</Label>
      {list.map((n, i) => (
        <div key={i} style={{ border:`1px solid ${VM.borderSoft}`, borderRadius:10, padding:'11px 13px' }}>
          <Mono size={9} color={VM.terra} weight={700} style={{ letterSpacing:'0.06em', textTransform:'uppercase' }}>{n.kicker}</Mono>
          <div style={{ fontFamily:VM.serif, fontWeight:700, fontSize:14, lineHeight:1.2, margin:'5px 0 0' }}>{n.headline}</div>
          <p style={{ fontFamily:VM.serif, fontSize:12.5, color:VM.ink2, lineHeight:1.45, margin:'6px 0 0' }}>{n.summary}</p>
          <Mono size={9.5} color={VM.ink3} style={{ display:'block', marginTop:7 }}>{n.source} · {n.time}</Mono>
        </div>
      ))}
    </div>
  );
}

function Node({ kind, t }) {
  if (kind==='customer') return (
    <div style={{ padding:'4px 9px', borderRadius:'5px 0 0 5px', border:`1px solid #B5D4F4`,
      borderRight:'2px solid #0C447C', background:'#E6F1FB',
      fontFamily:VM.mono, fontSize:10, fontWeight:600, color:'#0C447C', textAlign:'right', minWidth:54 }}>{t}</div>
  );
  return (
    <div style={{ padding:'4px 9px', borderRadius:'0 5px 5px 0', border:`1px solid ${VM.border}`,
      borderLeft:'2px solid #185FA5', background:VM.paper,
      fontFamily:VM.mono, fontSize:10, fontWeight:600, minWidth:54 }}>{t}</div>
  );
}

// Filter option lists — mock for now; these will eventually come from a database.
const FILTER_DEFS = {
  'SECTOR':       ['Technology','Healthcare','Financials','Energy','Consumer','Industrials','Materials','Utilities','Real estate','Communications'],
  'MARKET CAP':   ['> $1B','> $10B','> $100B','> $1T','< $10B','< $2B'],
  'P/E':          ['< 10','< 20','< 40','< 60','> 40'],
  'ANALYST':      ['Strong buy','Buy or better','Hold or better','Underperform'],
  'DIVIDEND':     ['Any','> 1%','> 2%','> 4%'],
  '5Y ANALOGUE':  ['Any','> 60% match','> 80% match'],
  'COUNTRY':      ['United States','United Kingdom','Germany','Japan','China','India'],
};

// Small dropdown menu shared by the filter pills.
function FilterMenu({ items, value, onPick, onClose }) {
  return (
    <React.Fragment>
      <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:30 }}></div>
      <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, zIndex:31, minWidth:180, maxHeight:260, overflowY:'auto',
        background:VM.paper, border:`1px solid ${VM.border}`, borderRadius:10, boxShadow:'0 12px 30px rgba(31,29,26,0.18)', padding:5 }}>
        {items.map(opt => (
          <button key={opt} onClick={()=>{ onPick(opt); onClose(); }} style={{ display:'flex', alignItems:'center', gap:8, width:'100%', textAlign:'left',
            padding:'7px 10px', borderRadius:7, border:'none', cursor:'pointer', fontFamily:VM.serif, fontSize:13.5,
            background: opt===value ? VM.tealTint : 'transparent', color:VM.ink }}>
            <i className="ti ti-check" style={{ fontSize:13, color:VM.tealInk, visibility: opt===value ? 'visible' : 'hidden' }}></i>{opt}
          </button>
        ))}
      </div>
    </React.Fragment>
  );
}

// One active filter rendered as a pill that opens a value dropdown; × removes it.
function FilterPill({ k, v, options, onChange, onRemove }) {
  const [open, setOpen] = React.useState(false);
  return (
    <span style={{ position:'relative', display:'inline-block' }}>
      <span onClick={()=>setOpen(o=>!o)} style={{ fontFamily:VM.mono, fontSize:11, padding:'6px 11px', borderRadius:999,
        border:`1px solid ${open?VM.forest:VM.border}`, background: open?VM.tealTint:VM.paper, color:VM.ink2,
        display:'inline-flex', alignItems:'center', gap:6, cursor:'pointer', whiteSpace:'nowrap' }}>
        <b style={{ color:VM.ink, fontWeight:700 }}>{k}</b><span>{v}</span>
        <i className="ti ti-chevron-down" style={{ fontSize:12, transform: open?'rotate(180deg)':'none', transition:'transform .2s' }}></i>
        <i className="ti ti-x" title="Remove" onClick={(e)=>{ e.stopPropagation(); onRemove(); }} style={{ fontSize:12, color:VM.ink3, marginLeft:1 }}></i>
      </span>
      {open && <FilterMenu items={options} value={v} onPick={onChange} onClose={()=>setOpen(false)} />}
    </span>
  );
}

// "+ ADD FILTER" — opens a list of filter types not already active.
function AddFilter({ active, onAdd }) {
  const [open, setOpen] = React.useState(false);
  const avail = Object.keys(FILTER_DEFS).filter(k => !active.includes(k));
  return (
    <span style={{ position:'relative', display:'inline-block' }}>
      <span onClick={()=> avail.length && setOpen(o=>!o)} style={{ fontFamily:VM.mono, fontSize:11, padding:'6px 11px', borderRadius:999,
        border:`1px dashed ${VM.border}`, background:VM.paper, color: avail.length?VM.ink2:VM.faint, cursor: avail.length?'pointer':'default',
        display:'inline-flex', alignItems:'center', gap:6, whiteSpace:'nowrap' }}>
        <i className="ti ti-plus" style={{ fontSize:12 }}></i>ADD FILTER
      </span>
      {open && <FilterMenu items={avail} value={null} onPick={onAdd} onClose={()=>setOpen(false)} />}
    </span>
  );
}

Object.assign(window, { Screener });
