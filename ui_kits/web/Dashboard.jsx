// Veridian Markets — Company dashboard.
// resolveCompany() is called once here; all tabs receive data as props.
// No tab reads VM_COMPANY_DATA or any VM_ global directly.
function Dashboard({ company, go, isMobile }) {
  const c    = company || VM_COMPANIES[0];
  const data = resolveCompany(c.ticker);
  const [tab, setTab] = React.useState('Overview');

  return (
    <div style={{ padding: isMobile ? '16px 14px 80px' : '22px 32px 60px', maxWidth:1180, margin:'0 auto', overflowX: isMobile ? 'hidden' : 'visible' }}>
      <CompanyHead c={c} tab={tab} onTabChange={setTab} go={go} isMobile={isMobile} />

      {tab === 'Overview'     && <DashOverview   c={c} data={data} isMobile={isMobile} />}
      {tab === 'Supply chain' && <DashScn        c={c} isMobile={isMobile} />}
      {tab === 'Financials'   && <DashFinancials data={data.financials} />}
      {tab === 'Patents'      && <DashPatents    data={data.patents} isMobile={isMobile} />}
      {tab === 'History'      && <DashHistory    c={c} data={data.history} isMobile={isMobile} />}
      {tab === 'News'         && <DashNews        c={c} go={go} />}
    </div>
  );
}

// ── News ──────────────────────────────────────────────────────────────────────
// Company-specific news; reuses the News page's card + article overlay.
function DashNews({ c, go }) {
  const [article, setArticle] = React.useState(null);
  const tagged = NEWS.filter(n => n.ticker === c.ticker);
  const list = tagged.length ? tagged : NEWS.slice(0, 4);   // fallback to general market stories
  const openTicker = (t) => { const co = VM_COMPANIES.find(x => x.ticker === t); if (co) go('dashboard', co); };
  return (
    <div style={{ marginTop:24 }}>
      <Mono size={10} color={VM.terra} weight={700} style={{ display:'block', marginBottom:8 }}>NEWS · {c.ticker}</Mono>
      <h2 style={{ fontFamily:VM.serif, fontWeight:700, fontSize:28, margin:'0 0 4px' }}>What’s moving {c.name.split(' ')[0]}.</h2>
      <p style={{ fontFamily:VM.serif, fontSize:15, color:VM.ink3, margin:'0 0 18px' }}>{tagged.length ? `Stories tagged ${c.ticker}, read through the lens of the past.` : 'Latest market stories.'}</p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:16 }}>
        {list.map((n,i) => <NewsCard key={i} n={n} onOpen={()=>setArticle(n)} />)}
      </div>
      {article && <ArticleModal article={article} onClose={()=>setArticle(null)} onTicker={openTicker} isMobile={false} />}
    </div>
  );
}

// ── Overview ──────────────────────────────────────────────────────────────────
function DashOverview({ c, data, isMobile }) {
  const { overview, quick, revenueMix, revenueMixMeta, leaders } = data;
  return (
    <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr', gap: isMobile?20:32, marginTop:24 }}>
      <div>
        <Mono size={10} color={VM.terra} weight={700} style={{ display:'block', marginBottom:8 }}>ABOUT THIS COMPANY</Mono>
        <h2 style={{ fontFamily:VM.serif, fontWeight:700, fontSize:28, margin:'0 0 12px', textWrap:'balance' }}>
          {c.name.split(' ')[0]} — what they actually do.
        </h2>
        <p style={{ fontFamily:VM.serif, fontSize:16, lineHeight:1.55, color:VM.ink2, margin:'0 0 16px' }}>
          {overview.description}
        </p>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'4px 18px', marginBottom:20 }}>
          <MetaPair k="Sector"       v={overview.sector}      />
          <MetaPair k="Sub-industry" v={overview.subIndustry} />
          <MetaPair k="Index"        v={overview.index}       />
          <MetaPair k="Country"      v={overview.country}     />
        </div>
        <div style={{ background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:12, padding:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <h3 style={{ fontFamily:VM.serif, fontWeight:700, fontSize:16, margin:0 }}>
              Price · 5Y <span style={{ color:VM.upInk, fontWeight:400, fontSize:13 }}>+218%</span>{' '}
              <span style={{ fontFamily:VM.mono, fontSize:11, color:VM.ink3 }}>· split-adjusted</span>
            </h3>
            <div style={{ display:'flex', gap:4 }}>
              {['1D','5D','1M','6M','1Y','5Y','Max'].map((t,i) => (
                <span key={t} style={{ fontFamily:VM.mono, fontSize:10, padding:'3px 8px', borderRadius:5,
                  border:`1px solid ${i===5 ? VM.teal : VM.borderSoft}`, color:i===5 ? VM.teal : VM.ink3 }}>{t}</span>
              ))}
            </div>
          </div>
          <OverlayChart h={170} legend={false} />
          <Mono size={11} color={VM.ink3} style={{ fontStyle:'italic', marginTop:4, display:'block' }}>
            {c.ticker} · 5Y with dividends, splits, key events
          </Mono>
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
        <Panel title="Quick facts">
          {quick.map(([k,v],i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', gap:10, padding:'6px 0',
              borderBottom: i < quick.length-1 ? `1px dotted ${VM.border}` : 'none' }}>
              <Label style={{ flexShrink:0 }}>{k}</Label>
              <span style={{ fontFamily:VM.serif, fontSize:13, color:VM.ink, textAlign:'right' }}>{v}</span>
            </div>
          ))}
        </Panel>
        <Panel title="Revenue mix" meta={revenueMixMeta}>
          {revenueMix.map((r,i) => (
            <div key={i} style={{ display:'grid', gridTemplateColumns:'70px 1fr 32px', alignItems:'center', gap:8, padding:'4px 0' }}>
              <span style={{ fontFamily:VM.serif, fontSize:13, color:VM.ink2 }}>{r.k}</span>
              <ProgressBar v={r.v} color={r.c} />
              <Mono size={11} weight={600} style={{ textAlign:'right' }}>{r.v}%</Mono>
            </div>
          ))}
        </Panel>
        <Panel title="Leadership today">
          {leaders.map((p,i) => (
            <div key={i} style={{ display:'flex', gap:10, padding:'7px 0',
              borderBottom: i < leaders.length-1 ? `1px dotted ${VM.border}` : 'none' }}>
              <Hatch w={34} h={34} style={{ borderRadius:999, flexShrink:0 }} />
              <div>
                <Label>{p.role} · since {p.since}</Label>
                <div style={{ fontFamily:VM.serif, fontWeight:600, fontSize:14 }}>{p.name}</div>
                <Mono size={9.5} color={VM.ink3}>{p.note}</Mono>
              </div>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  );
}

// ── Supply chain ──────────────────────────────────────────────────────────────
function DashScn({ c, isMobile }) {
  return (
    <div style={{ marginTop:16 }}>
      <ScnLiveDemo compact={true} initialTicker={c.ticker} isMobile={isMobile} />
    </div>
  );
}

// ── Financials ────────────────────────────────────────────────────────────────
function DashFinancials({ data }) {
  const [sheet, setSheet]   = React.useState('income');
  const [period, setPeriod] = React.useState('annual');
  const rows = { income:data.income, balance:data.balance, cashflow:data.cashflow }[sheet];

  function fmt(v, fmtType) {
    if (fmtType === 'eps') return `$${Math.abs(v).toFixed(2)}`;
    const abs = Math.abs(v);
    const s   = abs >= 1000 ? `$${(abs/1000).toFixed(1)}B` : `$${abs.toFixed(0)}M`;
    return v < 0 ? `(${s})` : s;
  }

  return (
    <div style={{ marginTop:24 }}>
      <div style={{ display:'flex', gap:0, marginBottom:20, borderBottom:`1px solid ${VM.borderSoft}` }}>
        {[['income','Income statement'],['balance','Balance sheet'],['cashflow','Cash flow']].map(([id,lbl]) => (
          <span key={id} onClick={()=>setSheet(id)} style={{
            fontFamily:VM.serif, fontSize:14, padding:'6px 18px 10px', cursor:'pointer',
            color: sheet===id ? VM.ink : VM.ink3, fontWeight: sheet===id ? 700 : 400,
            borderBottom: sheet===id ? `2px solid ${VM.forest}` : '2px solid transparent', marginBottom:-1,
          }}>{lbl}</span>
        ))}
        <div style={{ marginLeft:'auto', display:'flex', gap:6, alignItems:'center', paddingBottom:8 }}>
          {[['annual','Annual'],['quarterly','Quarterly']].map(([id,lbl]) => (
            <span key={id} onClick={()=>setPeriod(id)} style={{
              fontFamily:VM.mono, fontSize:10, padding:'4px 10px', borderRadius:5, cursor:'pointer',
              border:`1px solid ${period===id ? VM.forest : VM.border}`,
              background: period===id ? VM.forest : VM.paper, color: period===id ? VM.paperWarm : VM.ink3,
            }}>{lbl}</span>
          ))}
        </div>
      </div>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', minWidth:600 }}>
          <thead>
            <tr style={{ borderBottom:`1.5px solid ${VM.borderSoft}` }}>
              <th style={{ textAlign:'left', padding:'6px 12px 8px', fontFamily:VM.mono, fontSize:9.5,
                fontWeight:500, color:VM.ink3, textTransform:'uppercase', letterSpacing:'0.06em', width:'38%' }}>Breakdown</th>
              {data.periods.map(p => (
                <th key={p} style={{ textAlign:'right', padding:'6px 12px 8px', fontFamily:VM.mono, fontSize:9.5,
                  fontWeight:500, color:VM.ink3, textTransform:'uppercase', letterSpacing:'0.06em' }}>{p}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ borderBottom:`1px solid ${VM.borderHair}`, background: row.b ? VM.paperWarm : 'transparent' }}>
                <td style={{ padding:'7px 12px', paddingLeft: row.in ? 28 : 12 }}>
                  {row.in
                    ? <span style={{ fontFamily:VM.serif, fontSize:13, color:VM.ink3 }}>{row.k}</span>
                    : <span style={{ fontFamily:VM.serif, fontSize:13, fontWeight: row.b ? 700 : 400, color:VM.ink }}>{row.k}</span>}
                </td>
                {row.v.map((v, j) => (
                  <td key={j} style={{ padding:'7px 12px', textAlign:'right', fontFamily:VM.mono, fontSize:12,
                    color: v < 0 ? VM.downInk : (row.b ? VM.ink : VM.ink2), fontWeight: row.b ? 600 : 400 }}>
                    {fmt(v, row.fmt)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Mono size={10} color={VM.faint} style={{ display:'block', marginTop:10 }}>
        All figures USD · illustrative mock data · not financial advice
      </Mono>
    </div>
  );
}

// ── Patents ───────────────────────────────────────────────────────────────────
function DashPatents({ data, isMobile }) {
  const { stats, cats, filings, notable } = data;
  return (
    <div style={{ marginTop:24 }}>
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap:14, marginBottom:24 }}>
        {stats.map(([k,v]) => (
          <div key={k} style={{ background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:10, padding:'14px 16px' }}>
            <Label>{k}</Label>
            <div style={{ fontFamily:VM.mono, fontSize:26, fontWeight:700, color:VM.ink, marginTop:6 }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:22 }}>
        <div style={{ background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:12, padding:'16px' }}>
          <h3 style={{ fontFamily:VM.serif, fontWeight:700, fontSize:17, margin:'0 0 14px' }}>Portfolio by technology</h3>
          {cats.map((r, i) => (
            <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 80px 32px 38px', alignItems:'center',
              gap:8, padding:'5px 0', borderBottom: i < cats.length-1 ? `1px dotted ${VM.border}` : 'none' }}>
              <span style={{ fontFamily:VM.serif, fontSize:12, color:VM.ink2 }}>{r.k}</span>
              <ProgressBar v={r.pct} color={r.c} />
              <Mono size={10} weight={600} style={{ textAlign:'right' }}>{r.pct}%</Mono>
              <Mono size={10} color={VM.ink3} style={{ textAlign:'right' }}>{r.n.toLocaleString()}</Mono>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:12, padding:'16px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14 }}>
              <h3 style={{ fontFamily:VM.serif, fontWeight:700, fontSize:17, margin:0 }}>Filing trend</h3>
              <Label>FY20–FY25 ∂</Label>
            </div>
            <PatentFilingChart filings={filings} />
          </div>
          <div style={{ background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:12, padding:'16px' }}>
            <h3 style={{ fontFamily:VM.serif, fontWeight:700, fontSize:17, margin:'0 0 12px' }}>Notable recent grants</h3>
            {notable.map((p, i) => (
              <div key={i} style={{ padding:'8px 0', borderBottom: i < notable.length-1 ? `1px dotted ${VM.border}` : 'none' }}>
                <div style={{ display:'flex', justifyContent:'space-between', gap:8, marginBottom:3 }}>
                  <Mono size={10} color={VM.teal}>{p.id}</Mono>
                  <Mono size={10} color={VM.ink3}>{p.granted}</Mono>
                </div>
                <div style={{ fontFamily:VM.serif, fontSize:12.5, color:VM.ink, lineHeight:1.45, marginBottom:3 }}>{p.title}</div>
                <Mono size={9.5} color={VM.terra}>{p.area}</Mono>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PatentFilingChart({ filings }) {
  const max = Math.max(...filings.map(d => d.n));
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:90 }}>
      {filings.map((d, i) => (
        <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-end', height:'100%' }}>
          <Mono size={9} color={d.partial ? VM.ink3 : VM.ink2} style={{ marginBottom:4 }}>
            {d.partial ? `${d.n}*` : d.n.toLocaleString()}
          </Mono>
          <div style={{ width:'100%', height:Math.round((d.n/max)*56), background: d.partial ? VM.borderSoft : VM.teal,
            borderRadius:'2px 2px 0 0', opacity: d.partial ? 0.7 : 1 }}></div>
          <div style={{ marginTop:5 }}><Mono size={9} color={VM.ink3}>{d.y}</Mono></div>
        </div>
      ))}
    </div>
  );
}

// ── History ───────────────────────────────────────────────────────────────────
function DashHistory({ c, data }) {
  const [section, setSection] = React.useState('past');
  const [query, setQuery]     = React.useState('');
  const [aiResult, setAiResult] = React.useState(null);
  const [aiLoading, setAiLoading] = React.useState(false);

  function handleAsk() {
    if (!query.trim()) return;
    setAiLoading(true);
    setAiResult(null);
    // TODO: wire to Claude.ai
    setTimeout(() => {
      setAiLoading(false);
      setAiResult('Claude.ai integration coming in the next phase. This will surface pattern matches, historical analogues, and AI-generated insights for ' + c.ticker + ' based on your question.');
    }, 900);
  }

  return (
    <div style={{ marginTop:24 }}>
      <div style={{ display:'flex', gap:0, marginBottom:24, borderBottom:`1px solid ${VM.borderSoft}` }}>
        {[['past','Past'],['present','Present'],['future','Future']].map(([id,lbl]) => (
          <span key={id} onClick={()=>setSection(id)} style={{
            fontFamily:VM.serif, fontSize:15, padding:'5px 24px 10px', cursor:'pointer',
            color: section===id ? VM.ink : VM.ink3, fontWeight: section===id ? 700 : 400,
            borderBottom: section===id ? `2px solid ${VM.terra}` : '2px solid transparent', marginBottom:-1,
          }}>{lbl}</span>
        ))}
      </div>

      {section === 'past'    && <HistoryPast    data={data} />}
      {section === 'present' && <HistoryPresent data={data} c={c} />}
      {section === 'future'  && <HistoryFuture  data={data} c={c} />}

      <div style={{ marginTop:40, borderTop:`1px solid ${VM.borderSoft}`, paddingTop:26 }}>
        <Kicker tone="rust">Ask History · AI</Kicker>
        <p style={{ fontFamily:VM.serif, fontSize:15, color:VM.ink2, margin:'8px 0 16px', maxWidth:560 }}>
          Ask what history says about {c.ticker} — analogues, turning points, what happened next.
        </p>
        <div style={{ display:'flex', gap:10, maxWidth:640 }}>
          <input value={query} onChange={e=>setQuery(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&handleAsk()}
            placeholder={`e.g. "When ${c.ticker} looked like this, what happened to margins?"`}
            style={{ flex:1, fontFamily:VM.serif, fontSize:14, padding:'10px 14px',
              border:`1px solid ${VM.border}`, borderRadius:8, background:VM.paper,
              outline:'none', color:VM.ink }} />
          <Btn solid onClick={handleAsk}>{aiLoading ? 'Searching…' : 'Ask'}</Btn>
        </div>
        {aiResult && (
          <div style={{ marginTop:14, padding:'14px 16px', background:VM.tealTint,
            border:`1px solid ${VM.tealTint2}`, borderRadius:10, maxWidth:640 }}>
            <Label style={{ display:'block', marginBottom:6 }}>Result</Label>
            <p style={{ fontFamily:VM.serif, fontSize:14, color:VM.ink, lineHeight:1.65, margin:0 }}>{aiResult}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryPast({ data }) {
  const { timeline } = data;
  return (
    <div>
      <Mono size={10} color={VM.terra} weight={700} style={{ display:'block', marginBottom:16 }}>COMPANY TIMELINE · KEY MOMENTS</Mono>
      <div style={{ position:'relative' }}>
        <div style={{ position:'absolute', left:57, top:6, bottom:6, width:1, background:VM.borderSoft }}></div>
        {timeline.map((item, i) => (
          <div key={i} style={{ display:'flex', alignItems:'flex-start', marginBottom:18 }}>
            <Mono size={11} weight={600} color={VM.teal} style={{ minWidth:46, paddingTop:2 }}>{item.y}</Mono>
            <div style={{ width:9, height:9, borderRadius:999, background:VM.teal, flexShrink:0,
              marginTop:3, zIndex:1, marginRight:16, border:`2px solid ${VM.paperWarm}` }}></div>
            <p style={{ fontFamily:VM.serif, fontSize:14, color:VM.ink2, lineHeight:1.6, margin:0 }}>{item.e}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function HistoryPresent({ data, c }) {
  const { closestAnalogue, patternMatch, patternDiff } = data;
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr', gap:26 }}>
      <div>
        <Mono size={10} color={VM.terra} weight={700} style={{ display:'block', marginBottom:12 }}>CLOSEST ANALOGUE · PATTERN MATCH</Mono>
        <div style={{ background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:12, padding:'16px', marginBottom:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
            <div>
              <div style={{ fontFamily:VM.mono, fontSize:18, fontWeight:700, color:VM.ink }}>
                {closestAnalogue.ticker} · {closestAnalogue.year}
              </div>
              <div style={{ fontFamily:VM.serif, fontSize:13, color:VM.ink3, marginTop:3 }}>{closestAnalogue.what}</div>
            </div>
            <div style={{ background:VM.tealTint, border:`1px solid ${VM.tealTint2}`, borderRadius:8, padding:'6px 12px', textAlign:'center' }}>
              <Mono size={20} weight={700} color={VM.teal}>{closestAnalogue.match}%</Mono>
              <div style={{ fontFamily:VM.mono, fontSize:8, color:VM.teal, letterSpacing:'0.05em' }}>MATCH</div>
            </div>
          </div>
          <OverlayChart h={120} legend={true} thenYear={closestAnalogue.year} />
        </div>
        <div style={{ background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:12, padding:'16px' }}>
          <h3 style={{ fontFamily:VM.serif, fontWeight:700, fontSize:15, margin:'0 0 10px' }}>What matches</h3>
          {patternMatch.map((p, i) => (
            <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 80px 32px', alignItems:'center',
              gap:8, padding:'5px 0', borderBottom: i < patternMatch.length-1 ? `1px dotted ${VM.border}` : 'none' }}>
              <span style={{ fontFamily:VM.serif, fontSize:12, color:VM.ink2 }}>{p.k}</span>
              <ProgressBar v={p.v} color={VM.teal} />
              <Mono size={10} weight={600} style={{ textAlign:'right' }}>{p.v}%</Mono>
            </div>
          ))}
          <Mono size={9.5} color={VM.faint} style={{ display:'block', marginTop:10 }}>
            {c.ticker} · {patternMatch[0] && patternMatch[0].note}
          </Mono>
        </div>
      </div>
      <div>
        <Mono size={10} color={VM.terra} weight={700} style={{ display:'block', marginBottom:12 }}>WHERE IT DIVERGES</Mono>
        <div style={{ background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:12, padding:'16px' }}>
          {patternDiff.map((d, i) => (
            <div key={i} style={{ padding:'10px 0', borderBottom: i < patternDiff.length-1 ? `1px dotted ${VM.border}` : 'none' }}>
              <div style={{ fontFamily:VM.mono, fontSize:10.5, fontWeight:600, color:VM.rust, marginBottom:4, letterSpacing:'0.02em' }}>{d.k}</div>
              <div style={{ fontFamily:VM.serif, fontSize:13, color:VM.ink2, lineHeight:1.55 }}>{d.note}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HistoryFuture({ data, c }) {
  const { analogues } = data;
  const col = { CLOSEST:VM.teal, ECHO:VM.tealInk, MIXED:VM.terra, WARNING:VM.downInk };
  return (
    <div>
      <Mono size={10} color={VM.terra} weight={700} style={{ display:'block', marginBottom:8 }}>ANALOGUES · WEIGHTED OUTCOMES</Mono>
      <p style={{ fontFamily:VM.serif, fontSize:14, color:VM.ink3, margin:'0 0 20px', maxWidth:560 }}>
        The {analogues.length} closest historical matches for {c.ticker}, ranked by pattern similarity. Not a forecast — a base rate.
      </p>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        {analogues.map((a, i) => (
          <div key={i} style={{ background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:10,
            padding:'12px 14px', display:'flex', gap:12, alignItems:'flex-start' }}>
            <div style={{ background:col[a.outcome], borderRadius:7, padding:'6px 10px', minWidth:54, textAlign:'center', flexShrink:0 }}>
              <Mono size={13} weight={700} color="#FBF9F3">{a.ticker}</Mono>
              <div style={{ fontFamily:VM.mono, fontSize:8, color:'rgba(251,249,243,0.75)', marginTop:1 }}>{a.year}</div>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:4 }}>
                <Mono size={10} color={VM.ink3}>{a.match}% match</Mono>
                <Mono size={13} weight={700} color={a.dir==='up' ? VM.upInk : VM.downInk}>{a.ret}</Mono>
              </div>
              <div style={{ fontFamily:VM.serif, fontSize:12, color:VM.ink2, lineHeight:1.45, marginBottom:5 }}>{a.what}</div>
              <span style={{ fontFamily:VM.mono, fontSize:9, fontWeight:700, color:col[a.outcome], letterSpacing:'0.07em' }}>{a.outcome}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Shared helpers ────────────────────────────────────────────────────────────
function MetaPair({ k, v }) {
  return (
    <span style={{ display:'inline-flex', gap:6, alignItems:'baseline' }}>
      <Label>{k}</Label>
      <span style={{ fontFamily:VM.serif, fontSize:13, fontWeight:600, color:VM.ink }}>{v}</span>
    </span>
  );
}
function Panel({ title, meta, children }) {
  return (
    <div style={{ background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:12, padding:'14px 16px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:10 }}>
        <h3 style={{ fontFamily:VM.serif, fontWeight:700, fontSize:17, margin:0 }}>{title}</h3>
        {meta && <Label>{meta}</Label>}
      </div>
      {children}
    </div>
  );
}
Object.assign(window, { Dashboard });
