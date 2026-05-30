// Veridian Markets — "Read memoir" page (the founding note).
// Centered editorial statement; lives inside <main> so the rail + index strip stay.
function Memoir({ go }) {
  return (
    <div style={{ minHeight:'100%', display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', textAlign:'center', padding:'72px 24px 96px', maxWidth:920, margin:'0 auto' }}>

      {/* kicker */}
      <div style={{ fontFamily:VM.mono, fontSize:12, letterSpacing:'0.42em', textTransform:'uppercase',
        color:VM.teal, marginBottom:30, paddingLeft:'0.42em' }}>The Memoir</div>

      {/* oversized opening quote */}
      <div aria-hidden="true" style={{ fontFamily:VM.serif, fontStyle:'italic', fontSize:120, lineHeight:0.5,
        color:VM.teal, opacity:0.28, marginBottom:6, userSelect:'none' }}>&#10077;</div>

      {/* the statement */}
      <h1 style={{ fontFamily:VM.serif, fontWeight:400, fontSize:'clamp(28px, 4.4vw, 50px)', lineHeight:1.28,
        letterSpacing:'-0.005em', color:VM.ink, textWrap:'balance', maxWidth:720, margin:0 }}>
        <span style={{ display:'block', maxWidth:'none' }}>
          I want to build software that is a hybrid between Yahoo&nbsp;Finance, Bloomberg's SPLC&nbsp;GO,
          TradingView, Forex&nbsp;Factory, and Trading&nbsp;Economics
        </span>
        {' '}&mdash; using <em style={{ fontStyle:'italic', color:VM.teal }}>history</em> to interpret current
        market trends, comparing them to <em style={{ fontStyle:'italic', color:VM.teal }}>what's happened before.</em>
      </h1>

      {/* ornamental divider */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:14, margin:'44px 0 30px' }}>
        <span style={{ width:64, height:1, background:`linear-gradient(90deg, transparent, ${VM.faint})` }}></span>
        <span style={{ width:5, height:5, transform:'rotate(45deg)', background:VM.terra }}></span>
        <span style={{ width:64, height:1, background:`linear-gradient(90deg, ${VM.faint}, transparent)` }}></span>
      </div>

      {/* byline */}
      <p style={{ fontFamily:VM.serif, fontStyle:'italic', fontSize:18, color:VM.ink2, margin:0 }}>
        <span style={{ fontStyle:'normal', fontWeight:600, color:VM.ink }}>The Founder</span>
        <span style={{ display:'block', fontFamily:VM.mono, fontStyle:'normal', fontSize:10.5, letterSpacing:'0.16em',
          textTransform:'uppercase', color:VM.ink3, marginTop:10 }}>Veridian Markets · Founding Note</span>
      </p>

      {/* return affordance */}
      <button onClick={()=>go('front')} style={{ display:'inline-flex', alignItems:'center', gap:10, marginTop:52,
        padding:'12px 24px', border:`1.4px solid ${VM.teal}`, borderRadius:30, background:'transparent',
        color:VM.teal, fontFamily:VM.serif, fontSize:16, cursor:'pointer', transition:'all .2s ease' }}
        onMouseEnter={e=>{ e.currentTarget.style.background=VM.teal; e.currentTarget.style.color=VM.paper; }}
        onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.color=VM.teal; }}>
        <span style={{ fontFamily:VM.mono, fontSize:14 }}>‹</span> Back to the front page
      </button>
    </div>
  );
}

Object.assign(window, { Memoir });
