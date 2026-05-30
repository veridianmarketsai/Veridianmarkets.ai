// Veridian Markets — Company dashboard · Overview tab.
function Dashboard({ company, go }) {
  const c = company || VM_COMPANIES[0];
  const quick = [
    ['Founded','1 April 1976'], ['HQ','Cupertino, CA'], ['Employees','161,000'],
    ['Fiscal year','Ends Sep · FY = Oct–Sep'], ['Exchange','NASDAQ · since Dec 1980'],
    ['Auditor','Ernst & Young'], ['Lead bank','Goldman Sachs · JPM'], ['Next earnings','Jan 28 · FY26 Q1'],
  ];
  return (
    <div style={{ padding:'22px 32px 60px', maxWidth:1180, margin:'0 auto' }}>
      <CompanyHead c={c} tab="Overview" go={go} />

      <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:32, marginTop:24 }}>
        {/* left: about + chart */}
        <div>
          <Mono size={10} color={VM.terra} weight={700} style={{display:'block',marginBottom:8}}>ABOUT THIS COMPANY</Mono>
          <h2 style={{ fontFamily:VM.serif, fontWeight:700, fontSize:28, margin:'0 0 12px', textWrap:'balance' }}>{c.name.split(' ')[0]} — what they actually do.</h2>
          <p style={{ fontFamily:VM.serif, fontSize:16, lineHeight:1.55, color:VM.ink2, margin:'0 0 16px' }}>
            {c.name} designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories. It also operates one of the world's largest software-services businesses — App Store, iCloud, Apple Music, advertising — now ~22% of revenue and growing roughly twice as fast as hardware.
          </p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'4px 18px', marginBottom:20 }}>
            <MetaPair k="Sector" v="Technology · Consumer electronics" />
            <MetaPair k="Sub-industry" v="Mobile hardware + Services" />
            <MetaPair k="Index" v="S&P 500 · NDX 100 · DJIA" />
            <MetaPair k="Country" v="United States" />
          </div>

          <div style={{ background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:12, padding:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <h3 style={{ fontFamily:VM.serif, fontWeight:700, fontSize:16, margin:0 }}>Price · 5Y <span style={{color:VM.upInk,fontWeight:400,fontSize:13}}>+218%</span> <span style={{fontFamily:VM.mono,fontSize:11,color:VM.ink3}}>· split-adjusted</span></h3>
              <div style={{ display:'flex', gap:4 }}>
                {['1D','5D','1M','6M','1Y','5Y','Max'].map((t,i)=>(<span key={t} style={{ fontFamily:VM.mono, fontSize:10, padding:'3px 8px', borderRadius:5, border:`1px solid ${i===5?VM.teal:VM.borderSoft}`, color:i===5?VM.teal:VM.ink3 }}>{t}</span>))}
              </div>
            </div>
            <OverlayChart h={170} legend={false} />
            <Mono size={11} color={VM.ink3} style={{ fontStyle:'italic', marginTop:4, display:'block' }}>{c.ticker} · 5Y with dividends, splits, key events</Mono>
          </div>
        </div>

        {/* right: quick facts, revenue mix, people */}
        <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
          <Panel title="Quick facts">
            {quick.map(([k,v],i)=>(<div key={i} style={{ display:'flex', justifyContent:'space-between', gap:10, padding:'6px 0', borderBottom: i<quick.length-1?`1px dotted ${VM.border}`:'none' }}>
              <Label style={{flexShrink:0}}>{k}</Label><span style={{ fontFamily:VM.serif, fontSize:13, color:VM.ink, textAlign:'right' }}>{v}</span></div>))}
          </Panel>
          <Panel title="Revenue mix" meta="FY2025 · $397B">
            {VM_REVENUE_MIX.map((r,i)=>(<div key={i} style={{ display:'grid', gridTemplateColumns:'70px 1fr 32px', alignItems:'center', gap:8, padding:'4px 0' }}>
              <span style={{ fontFamily:VM.serif, fontSize:13, color:VM.ink2 }}>{r.k}</span>
              <ProgressBar v={r.v} color={r.c} /><Mono size={11} weight={600} style={{textAlign:'right'}}>{r.v}%</Mono></div>))}
          </Panel>
          <Panel title="Leadership today">
            {VM_LEADERS.map((p,i)=>(<div key={i} style={{ display:'flex', gap:10, padding:'7px 0', borderBottom: i<VM_LEADERS.length-1?`1px dotted ${VM.border}`:'none' }}>
              <Hatch w={34} h={34} style={{ borderRadius:999, flexShrink:0 }} />
              <div><Label>{p.role} · since {p.since}</Label><div style={{ fontFamily:VM.serif, fontWeight:600, fontSize:14 }}>{p.name}</div><Mono size={9.5} color={VM.ink3}>{p.note}</Mono></div>
            </div>))}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function MetaPair({ k, v }) {
  return <span style={{ display:'inline-flex', gap:6, alignItems:'baseline' }}><Label>{k}</Label><span style={{ fontFamily:VM.serif, fontSize:13, fontWeight:600, color:VM.ink }}>{v}</span></span>;
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
