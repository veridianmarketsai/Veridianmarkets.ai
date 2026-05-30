// Veridian Markets — Front page (editorial home).
function FrontPage({ go }) {
  const recap = [
    { k:'Forex', chg:'+0.12%', dir:'up' }, { k:'Bonds', chg:'-0.08%', dir:'down' },
    { k:'Commodities', chg:'+0.94%', dir:'up' }, { k:'Stocks', chg:'+0.41%', dir:'up' },
    { k:'Crypto', chg:'-2.31%', dir:'down' }, { k:'Funds', chg:'+0.27%', dir:'up' },
  ];
  return (
    <div style={{ padding:'26px 32px 60px', maxWidth:1180, margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'baseline', gap:10, marginBottom:22 }}>
        <span style={{ fontFamily:VM.serif, fontWeight:700, fontSize:24 }}>Good morning.</span>
        <span style={{ fontFamily:VM.serif, fontSize:17, color:VM.ink3 }}>Three things on the tape — and one from 1973.</span>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1.7fr 1fr', gap:32 }}>
        {/* LEAD STORY */}
        <article>
          <Kicker>LEAD · 5-YEAR LENS</Kicker>
          <h1 style={{ fontFamily:VM.serif, fontWeight:700, fontSize:38, lineHeight:1.07, letterSpacing:'-0.005em', margin:'10px 0 14px', textWrap:'balance' }}>
            Oil at $83 — and an echo from 1973 we'd rather not hear.
          </h1>
          <p style={{ fontFamily:VM.serif, fontSize:17, lineHeight:1.5, color:VM.ink2, margin:'0 0 18px' }}>
            Two charts, one pattern, and the three things that didn't happen back then but might this time.
          </p>
          <div style={{ background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:12, padding:16 }}>
            <OverlayChart h={200} label="Brent · 1973 overlay" thenYear="1973" />
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:12 }}>
            <Mono size={11} color={VM.ink3}>Veridian AI · 6 min · 4 sources</Mono>
            <span onClick={()=>go('history')} style={{ fontFamily:VM.serif, fontSize:14, color:VM.teal, cursor:'pointer' }}>Open story →</span>
          </div>
        </article>

        {/* RIGHT CARDS */}
        <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
          <Card letter="A" title="Market recap">
            {recap.map((r,i)=>(
              <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 60px 60px', alignItems:'center', gap:8, padding:'7px 0', borderBottom: i<recap.length-1?`1px dotted ${VM.border}`:'none' }}>
                <span style={{ fontFamily:VM.serif, fontSize:14, color:VM.ink2 }}>{r.k}</span>
                <Sparkline dir={r.dir} w={56} h={16} />
                <span style={{ textAlign:'right' }}><Chg dir={r.dir}>{r.chg}</Chg></span>
              </div>
            ))}
          </Card>
          <Card letter="B" title="Watchlist · placeholder">
            <p style={{ fontFamily:VM.serif, fontSize:13, color:VM.ink3, margin:'0 0 10px' }}>Sign in to track tickers. Or browse:</p>
            {VM_COMPANIES.slice(0,4).map((c,i)=>(
              <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0' }}>
                <Mono size={12} weight={700}>{c.ticker}</Mono>
                <span><Mono size={12} color={VM.ink3} style={{marginRight:10}}>{c.price}</Mono><Chg dir={c.dir}>{c.chg}</Chg></span>
              </div>
            ))}
          </Card>
          <Card letter="C" title="Mini calendar">
            <MiniCalendar />
          </Card>
        </div>
      </div>

      {/* TOP COMPANIES PREVIEW */}
      <div style={{ marginTop:44 }}>
        <Kicker>EXPLORE · 4,904 PUBLIC COMPANIES</Kicker>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', margin:'8px 0 4px' }}>
          <h2 style={{ fontFamily:VM.serif, fontWeight:700, fontSize:27, margin:0 }}>Find a company.</h2>
          <span onClick={()=>go('screener')} style={{ fontFamily:VM.serif, fontSize:14, color:VM.teal, cursor:'pointer' }}>Open full screener →</span>
        </div>
        <p style={{ fontFamily:VM.serif, fontSize:15, color:VM.ink3, margin:'0 0 16px' }}>Search by ticker, name, person, or which 5-year historical analogue matches today.</p>
        <div style={{ background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:12, overflow:'hidden' }}>
          <div style={{ display:'grid', gridTemplateColumns:'80px 1fr 90px', padding:'6px 16px', background:VM.paperWarm, borderBottom:`1px solid ${VM.borderSoft}` }}>
            <Label>Ticker</Label><Label>Sector · Market cap</Label><Label style={{textAlign:'right'}}>Price</Label>
          </div>
          {VM_COMPANIES.slice(0,3).map((c,i)=>(
            <div key={i} onClick={()=>go('dashboard', c)} style={{ display:'grid', gridTemplateColumns:'80px 1fr 90px 70px', alignItems:'center', gap:10, padding:'12px 16px', borderBottom: i<2?`1px solid ${VM.borderSoft}`:'none', cursor:'pointer' }}>
              <span style={{ fontFamily:VM.serif, fontWeight:700, fontSize:20 }}>{c.ticker}</span>
              <div><Mono size={11} color={VM.ink2}>{c.name}</Mono><div><Label>{c.sector} · {c.cap}</Label></div></div>
              <Mono size={13} weight={700} style={{textAlign:'right'}}>${c.price}</Mono>
              <span style={{textAlign:'right'}}><Chg dir={c.dir}>{c.chg}</Chg></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Card({ letter, title, children }) {
  return (
    <div style={{ background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:12, padding:'14px 16px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
        {letter && <span style={{ fontFamily:VM.mono, fontSize:9, color:VM.ink3, border:`1px solid ${VM.border}`, borderRadius:3, width:16, height:16, display:'flex', alignItems:'center', justifyContent:'center' }}>{letter}</span>}
        <h3 style={{ fontFamily:VM.serif, fontWeight:700, fontSize:18, margin:0 }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function MiniCalendar() {
  const days = Array.from({length:35},(_,i)=>i-2); // start offset
  const events=[7,12,21,28], today=14;
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
        <Mono size={12} weight={600} color={VM.ink}>May 2026</Mono><Mono size={11} color={VM.ink3}>‹  ›</Mono>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3, textAlign:'center' }}>
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d=> <Mono key={d} size={9} color={VM.ink3} style={{paddingBottom:3}}>{d}</Mono>)}
        {days.map((n,i)=>{
          if(n<1||n>31) return <div key={i}></div>;
          const ev=events.includes(n), isToday=n===today;
          return <div key={i} style={{ fontFamily:VM.mono, fontSize:10.5, padding:'5px 0', borderRadius:5,
            background:isToday?VM.forest:'transparent', color:isToday?VM.paperWarm:VM.ink2,
            border: ev&&!isToday?`1px solid ${VM.terra}`:'1px solid transparent' }}>{n}</div>;
        })}
      </div>
      <div style={{ marginTop:10, paddingTop:8, borderTop:`1px dotted ${VM.border}` }}>
        <Label>Today</Label>
        <div style={{ fontFamily:VM.serif, fontSize:13, color:VM.ink2, marginTop:4 }}>14:00 · FOMC minutes</div>
        <div style={{ fontFamily:VM.serif, fontSize:13, color:VM.ink2 }}>15:30 · US jobless claims</div>
      </div>
    </div>
  );
}

Object.assign(window, { FrontPage });
