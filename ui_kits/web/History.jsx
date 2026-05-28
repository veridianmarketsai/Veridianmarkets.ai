// Veridian Memoir — History / the Memoir (analogue engine).
function History({ company, go }) {
  const c = company || VM_COMPANIES[0];
  const outColor = (o)=> o==='CLOSEST'?VM.teal : o==='ECHO'?VM.tealInk : o==='MIXED'?VM.ink2 : VM.rustDeep;
  const outBg = (o)=> o==='CLOSEST'?VM.tealTint : o==='ECHO'?'#E7EDE9' : o==='MIXED'?'#EFEAE1' : '#F6E5DC';

  return (
    <div style={{ padding:'22px 32px 60px', maxWidth:1180, margin:'0 auto' }}>
      <CompanyHead c={c} tab="History" go={go} />

      <div style={{ marginTop:18 }}>
        <Mono size={11} color={VM.teal} weight={700} style={{letterSpacing:'0.1em'}}>5-YEAR LENS · WHAT HISTORY SAYS</Mono>
        <h1 style={{ fontFamily:VM.serif, fontWeight:700, fontSize:34, margin:'8px 0 6px', textWrap:'balance', maxWidth:760 }}>When other companies looked like {c.ticker} does today — here's what happened next.</h1>
        <p style={{ fontFamily:VM.serif, fontSize:15.5, color:VM.ink3, margin:'0 0 20px', maxWidth:680 }}>We find the closest historical pattern matches and weight their outcomes. Not a forecast — a base rate.</p>
      </div>

      {/* analogue + base rate */}
      <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:24 }}>
        <div style={{ background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:12, padding:18 }}>
          <Mono size={10} color={VM.terra} weight={700}>CLOSEST ANALOGUE · {c.match}% MATCH</Mono>
          <h2 style={{ fontFamily:VM.serif, fontWeight:700, fontSize:24, margin:'8px 0 4px' }}>{c.ticker} today reads like <span style={{color:VM.teal}}>{c.analogue} in {c.analogueYear}</span>.</h2>
          <p style={{ fontFamily:VM.serif, fontSize:14.5, color:VM.ink2, margin:'0 0 14px' }}>Cash-rich. Services flywheel just lit. Capital-return story trumps growth. Margin expanding on software mix. The market hadn't re-rated it yet.</p>
          <OverlayChart h={170} thenYear={c.analogueYear+" "+c.analogue} label={`${c.ticker} today (solid) vs ${c.analogue} '${c.analogueYear.slice(2)} (dashed) · 5Y indexed`} />
        </div>
        {/* base rate card */}
        <div style={{ background:VM.tealTint, border:`1px solid ${VM.tealTint2}`, borderRadius:12, padding:18 }}>
          <Mono size={10} color={VM.terra} weight={700}>RISK / REWARD · ANALOGUE-WEIGHTED</Mono>
          <h3 style={{ fontFamily:VM.serif, fontWeight:700, fontSize:20, margin:'8px 0 14px' }}>The base rate</h3>
          {[['Bull case · P75','+148%','follow '+c.analogue+" '"+c.analogueYear.slice(2)+' path',VM.upInk],['Base case · P50','+62%','weighted median',VM.teal],['Bear case · P25','-18%','CSCO/NOK-style miss',VM.downInk]].map((r,i)=>(
            <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', padding:'8px 0', borderBottom:`1px solid ${VM.tealTint2}` }}>
              <div><Label style={{color:VM.ink2}}>{r[0]}</Label><div><Mono size={10} color={VM.ink3}>{r[2]}</Mono></div></div>
              <Mono size={22} weight={700} color={r[3]}>{r[1]}</Mono>
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginTop:12 }}>
            <Label>5-Year expected CAGR</Label><Mono size={20} weight={700} color={VM.ink}>+10.1% <span style={{fontSize:12,color:VM.ink3}}>· ±9.2%</span></Mono>
          </div>
          <Mono size={9.5} color={VM.ink3} style={{ display:'block', marginTop:10, fontStyle:'italic' }}>Base rates only. Not advice. Not a target — a base rate.</Mono>
        </div>
      </div>

      {/* similar events table */}
      <div style={{ marginTop:28 }}>
        <Mono size={10} color={VM.ink3} weight={700} style={{display:'block',marginBottom:10}}>SIMILAR EVENTS · TOP 8</Mono>
        <div style={{ background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:12, overflow:'hidden' }}>
          <div style={{ display:'grid', gridTemplateColumns:'36px 70px 56px 90px 1fr 80px 72px 84px', padding:'8px 16px', background:VM.paperWarm, borderBottom:`1px solid ${VM.borderSoft}`, gap:10 }}>
            {['#','Ticker','Year','Match','What was similar','5Y','Return','Outcome'].map(h=> <Label key={h}>{h}</Label>)}
          </div>
          {VM_ANALOGUES.map((a,i)=>(
            <div key={i} style={{ display:'grid', gridTemplateColumns:'36px 70px 56px 90px 1fr 80px 72px 84px', alignItems:'center', gap:10, padding:'11px 16px', borderBottom: i<VM_ANALOGUES.length-1?`1px solid ${VM.borderSoft}`:'none', background: i===0?VM.tealTint:'transparent' }}>
              <Mono size={10} color={VM.ink3}>{a.n}</Mono>
              <Mono size={13} weight={700}>{a.ticker}</Mono>
              <Mono size={12} color={VM.ink2}>{a.year}</Mono>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}><Mono size={11} weight={600}>{a.match}%</Mono><ProgressBar v={a.match} w={34} color={a.dir==='up'?VM.teal:VM.rust} /></div>
              <span style={{ fontFamily:VM.serif, fontSize:13, color:VM.ink2 }}>{a.what}</span>
              <Sparkline dir={a.dir} w={64} h={20} />
              <Chg dir={a.dir}>{a.ret}</Chg>
              <span><span style={{ fontFamily:VM.mono, fontSize:9, fontWeight:700, letterSpacing:'0.06em', padding:'3px 8px', borderRadius:4, background:outBg(a.outcome), color:outColor(a.outcome) }}>{a.outcome}</span></span>
            </div>
          ))}
        </div>
      </div>

      {/* pattern breakdown */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginTop:28 }}>
        <div>
          <Mono size={10} color={VM.ink3} weight={700} style={{display:'block',marginBottom:4}}>WHAT MATCHES</Mono>
          <h3 style={{ fontFamily:VM.serif, fontWeight:700, fontSize:18, margin:'0 0 12px' }}>The pattern is real</h3>
          {VM_PATTERN_MATCH.map((p,i)=>(<div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 110px 34px', alignItems:'center', gap:10, padding:'6px 0' }}>
            <span style={{ fontFamily:VM.serif, fontSize:14, color:VM.ink2 }}>{p.k}</span>
            <Mono size={9} color={VM.ink3} style={{textAlign:'right'}}>{p.note}</Mono>
            <span style={{ display:'flex', alignItems:'center', gap:5 }}><ProgressBar v={p.v} w={20} color={VM.teal} /><Mono size={10} weight={600}>{p.v}</Mono></span></div>))}
        </div>
        <div>
          <Mono size={10} color={VM.terra} weight={700} style={{display:'block',marginBottom:4}}>WHAT'S DIFFERENT</Mono>
          <h3 style={{ fontFamily:VM.serif, fontWeight:700, fontSize:18, margin:'0 0 12px' }}>And why the analogue could break</h3>
          {VM_PATTERN_DIFF.map((p,i)=>(<div key={i} style={{ padding:'7px 0', borderBottom: i<VM_PATTERN_DIFF.length-1?`1px dotted ${VM.border}`:'none' }}>
            <div style={{ fontFamily:VM.serif, fontWeight:600, fontSize:14 }}>{p.k}</div>
            <span style={{ fontFamily:VM.serif, fontSize:13, color:VM.ink2 }}>{p.note}</span></div>))}
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { History });
