// Veridian Markets — Company search / screener with eye-preview.
const { useState: useStateScr } = React;

function Screener({ go }) {
  const [open, setOpen] = useStateScr(null);
  const filters = [
    { k:'SECTOR', v:'Technology' }, { k:'MARKET CAP', v:'> $10B' },
    { k:'P/E', v:'< 40' }, { k:'ANALYST', v:'Buy or better' },
  ];
  return (
    <div style={{ padding:'26px 32px 60px', maxWidth:1120, margin:'0 auto' }}>
      <Mono size={11} color={VM.ink3} style={{ letterSpacing:'0.04em' }}>Explore  ›  <b style={{color:VM.ink}}>Company search</b></Mono>
      <div style={{ marginTop:14 }}><Kicker>EXPLORE · 4,904 PUBLIC COMPANIES</Kicker></div>
      <h1 style={{ fontFamily:VM.serif, fontWeight:700, fontSize:38, margin:'8px 0 6px' }}>Find a company.</h1>
      <p style={{ fontFamily:VM.serif, fontSize:16, color:VM.ink3, margin:'0 0 18px' }}>Search by ticker, name, or person. Filter by sector, size, fundamentals, or which 5-year historical analogue matches today.</p>

      <div style={{ display:'flex', gap:9, alignItems:'center', marginBottom:14 }}>
        <div style={{ flex:1, display:'flex', alignItems:'center', gap:9, border:`1px solid ${VM.border}`, borderRadius:999, padding:'9px 16px', background:VM.paper }}>
          <i className="ti ti-search" style={{ color:VM.ink3 }}></i>
          <input placeholder="search ticker, company, person, era" style={{ border:0, background:'transparent', outline:0, fontFamily:VM.serif, fontSize:14, color:VM.ink, flex:1 }} />
          <span style={{ fontFamily:VM.mono, fontSize:10, color:VM.ink3, border:`1px solid ${VM.borderSoft}`, borderRadius:4, padding:'2px 6px' }}>⌘ K</span>
        </div>
        <Btn style={{ borderRadius:999 }}>Filter <i className="ti ti-chevron-down" style={{fontSize:12}}></i></Btn>
        <IconBtn icon="arrows-sort" round size={38} title="Sort" />
        <IconBtn icon="lock" round size={38} title="Saved" />
      </div>

      <div style={{ display:'flex', gap:7, alignItems:'center', flexWrap:'wrap', marginBottom:14 }}>
        <Label style={{marginRight:2}}>Filters:</Label>
        {filters.map((f,i)=>(<Pill key={i}><b style={{color:VM.ink,fontWeight:700}}>{f.k}</b> {f.v} ×</Pill>))}
        <Pill dashed>+ ADD FILTER</Pill>
      </div>
      <Mono size={10} color={VM.ink3} style={{ display:'block', marginBottom:8 }}>showing {VM_COMPANIES.length} of 487 matches · sort: 5Y analogue match</Mono>

      <div style={{ background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:12, overflow:'hidden' }}>
        <div style={{ display:'grid', gridTemplateColumns:GRID, padding:'7px 18px', background:VM.paperWarm, borderBottom:`1px solid ${VM.borderSoft}` }}>
          <Label>Ticker</Label><Label>Company</Label><Label style={{textAlign:'right'}}>Price</Label>
          <Label style={{textAlign:'right'}}>Chg</Label><Label></Label><Label style={{textAlign:'right'}}>Actions</Label>
        </div>
        {VM_COMPANIES.map((c,i)=>(
          <Row key={c.ticker} c={c} open={open===c.ticker} last={i===VM_COMPANIES.length-1}
            onEye={()=>setOpen(open===c.ticker?null:c.ticker)}
            onNet={()=>go('supply', c)} onOpen={()=>go('dashboard', c)} />
        ))}
      </div>
    </div>
  );
}
const GRID = '92px 1fr 90px 68px 76px 104px';

function Row({ c, open, last, onEye, onNet, onOpen }) {
  const [hover, setHover] = React.useState(false);
  const pop = hover && !open;   // lift into a box on hover (matches the home page)
  return (
    <div style={{ borderBottom: last&&!open?'none':`1px solid ${VM.borderSoft}`, background: open?VM.tealTint:'transparent', position:'relative', zIndex: pop?2:1 }}>
      <div onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
        style={{ display:'grid', gridTemplateColumns:GRID, alignItems:'center', gap:10, padding:'12px 18px',
          background: pop?VM.paperWarm:'transparent',
          transform: pop?'scale(1.012)':'scale(1)',
          boxShadow: pop?'0 6px 18px rgba(31,29,26,0.10)':'none',
          borderRadius: pop?10:0,
          transition:'transform .16s ease, box-shadow .16s ease, background .16s ease' }}>
        <span style={{ fontFamily:VM.serif, fontWeight:700, fontSize:22 }}>{c.ticker}</span>
        <div><Mono size={11.5} color={VM.ink2}>{c.name}</Mono><div><Label>{c.sector}</Label></div></div>
        <Mono size={13} weight={700} style={{textAlign:'right'}}>${c.price}</Mono>
        <span style={{textAlign:'right'}}><Chg dir={c.dir}>{c.chg}</Chg></span>
        <Sparkline dir={c.dir} w={64} h={22} />
        <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
          <IconBtn icon="eye" round size={28} active={open} onClick={onEye} title="Preview" />
          <IconBtn icon="affiliate" round size={28} onClick={onNet} title="Supply chain" />
          <IconBtn icon="arrow-right" round size={28} onClick={onOpen} title="Open dashboard" />
        </div>
      </div>
      <div style={{ maxHeight: open?540:0, overflow:'hidden', transition:'max-height .35s ease' }}>
        <Preview c={c} onOpen={onOpen} />
      </div>
    </div>
  );
}

function Preview({ c, onOpen }) {
  const [tab, setTab] = React.useState('Overview');
  const data = resolveCompany(c.ticker);
  const tabs = ['Overview','Supply chain','Financials','Patents','History'];

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
        {tab === 'Financials'   && <PreviewFinancials   data={data.financials} />}
        {tab === 'Patents'      && <PreviewPatents      data={data.patents} />}
        {tab === 'History'      && <PreviewHistory      c={c} data={data.history} />}
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

// ── Financials preview ────────────────────────────────────────────────────────
function PreviewFinancials({ data }) {
  function fmt(v, fmtType) {
    if (fmtType === 'eps') return `$${Math.abs(v).toFixed(2)}`;
    const abs = Math.abs(v);
    const s   = abs >= 1000 ? `$${(abs/1000).toFixed(1)}B` : `$${abs.toFixed(0)}M`;
    return v < 0 ? `(${s})` : s;
  }
  const highlights = [
    ...data.income.filter(r => r.b || r.fmt === 'eps'),
    ...data.cashflow.filter(r => r.k === 'Free cash flow'),
  ];
  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8, marginBottom:12 }}>
        {highlights.slice(0,6).map((r, i) => (
          <div key={i} style={{ background:VM.paperWarm, border:`1px solid ${VM.borderSoft}`, borderRadius:8, padding:'8px 10px' }}>
            <Label>{r.k}</Label>
            <div style={{ fontFamily:VM.mono, fontSize:16, fontWeight:700, color: r.v[0] < 0 ? VM.downInk : VM.ink, marginTop:3 }}>
              {fmt(r.v[0], r.fmt)}
            </div>
            <Mono size={9} color={VM.ink3}>TTM</Mono>
          </div>
        ))}
      </div>
      <Mono size={9} color={VM.faint}>Illustrative mock data · open dashboard for full statement</Mono>
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

Object.assign(window, { Screener });
