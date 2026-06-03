// Veridian Markets — shared company header (breadcrumb, ticker lockup, tabs, quote).
function CompanyHead({ c, tab, onTabChange, go }) {
  const tabs = ['Overview','Supply chain','Financials','Patents','History','News'];
  return (
    <div>
      <Mono size={11} color={VM.ink3} style={{ letterSpacing:'0.04em' }}>
        <span onClick={()=>go&&go('screener')} style={{ color:VM.teal, cursor: go?'pointer':'default' }}>Search</span>  ›  <b style={{color:VM.ink}}>{c.ticker}</b>  ›  <span style={{color:VM.teal}}>{tab}</span>
      </Mono>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginTop:10 }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:14 }}>
          <span style={{ fontFamily:VM.serif, fontWeight:700, fontSize:52, lineHeight:0.9, letterSpacing:'0.01em' }}>{c.ticker}</span>
          <span style={{ fontFamily:VM.serif, fontSize:20, color:VM.ink3 }}>{c.name}</span>
        </div>
        <div style={{ display:'flex', gap:26, alignItems:'flex-start' }}>
          <div><Label>Price</Label><div style={{ display:'flex', alignItems:'baseline', gap:8 }}><Mono size={22} weight={700}>${c.price}</Mono><Chg dir={c.dir}>{c.chg}</Chg></div></div>
          <div><Label>Mkt cap</Label><div><Mono size={22} weight={700}>{c.cap}</Mono></div><Mono size={10} color={VM.ink3}>P/E 37.36 · div 0.34%</Mono></div>
        </div>
      </div>
      {/* tabs */}
      <div style={{ display:'flex', gap:22, marginTop:16, borderBottom:`1px solid ${VM.borderSoft}` }}>
        {tabs.map(t=>{
          const active = t===tab;
          return <span key={t} onClick={()=> onTabChange(t)} style={{
            fontFamily:VM.serif, fontSize:16, padding:'4px 2px 10px', cursor:'pointer',
            color: active?VM.ink:VM.ink2, fontWeight: active?700:400,
            borderBottom: active?`2.5px solid ${VM.teal}`:'2.5px solid transparent', marginBottom:-1,
          }}>{t}</span>;
        })}
      </div>
    </div>
  );
}
Object.assign(window, { CompanyHead });
