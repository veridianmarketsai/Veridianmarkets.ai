// Veridian Markets — "Read memoir" page (the founding note).
function Memoir({ go, isMobile }) {
  // Green highlight, matching the editorial accent used across the brand.
  const hi = { fontStyle:'normal', color:VM.teal, fontWeight:600 };
  // Shared paragraph styling for the letter body.
  const p = { fontFamily:VM.serif, fontWeight:400, fontSize: isMobile ? 17 : 19, lineHeight:1.75,
    color:VM.ink2, margin:'0 0 22px', textWrap:'pretty' };

  return (
    <div style={{ minHeight:'100%', display:'flex', flexDirection:'column', alignItems:'center',
      padding: isMobile ? '40px 16px 80px' : '72px 24px 96px', maxWidth:920, margin:'0 auto' }}>

      <div style={{ fontFamily:VM.mono, fontSize:12, letterSpacing:'0.42em', textTransform:'uppercase',
        color:VM.teal, marginBottom:30, paddingLeft:'0.42em' }}>Founder&rsquo;s Memoir</div>

      <article style={{ maxWidth:680, width:'100%', textAlign:'left' }}>
        <p style={{ ...p, fontStyle:'italic', fontSize: isMobile ? 18 : 21, color:VM.ink }}>Dear reader,</p>

        <p style={p}>Firstly, thank you for taking the time to read my memoir.</p>

        <p style={p}>For as long as I remember I have been <span style={hi}>curious about the world</span>. When I
          started my career (16&nbsp;years old) in <span style={hi}>manufacturing and design engineering</span> I was
          able to fulfill a lot of my ambitions and scratched a lot of itches.</p>

        <p style={p}>When I turned 18 I was able to start investing. Long story short, <span style={hi}>I lost money</span>.</p>

        <p style={p}>At the age of 19, specifically in the month of <span style={hi}>February&nbsp;2022</span>, I had my
          first great financial success because I found the world&rsquo;s dependency of commodities when the
          Ukraine&ndash;Russia war started (again&hellip;)&hellip;</p>

        <p style={p}>Although this was short lived due to greed, my subconscious was bothered as I had
          <span style={hi}> profited off war</span>. This foreshadows my life in 4&nbsp;years time.</p>

        <p style={p}>Even though I was still working full time, I never stopped being interested in finance and the
          dependence of the world it has on trends; commodities like <span style={hi}>oil, gold, and silver</span>; as
          well as public companies like the now famous <span style={hi}>Tesla, Space&nbsp;X</span>.</p>

        <p style={p}>I experienced a lot of challenges and it took me years to grasp the
          <span style={hi}> atomic structure of investment finance</span>, finance management and personal investing.</p>

        <p style={p}>So, here we are, today, where I built a platform to support the people starting off, to the
          businesses who want to understand <span style={hi}>how global economics affect their business</span>.</p>

        <p style={p}>As a proud citizen of Earth, I would be honoured to earn your trust as we embark on this journey
          together, helping each other build a <span style={hi}>healthy, wealthy, happy future</span>. For ourselves,
          families, and businesses.</p>

        <p style={{ ...p, marginBottom:0 }}>&lsquo;Till next time,</p>
      </article>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:14, alignSelf:'center', margin: isMobile ? '32px 0 24px' : '40px 0 28px' }}>
        <span style={{ width:64, height:1, background:`linear-gradient(90deg, transparent, ${VM.faint})` }}></span>
        <span style={{ width:5, height:5, transform:'rotate(45deg)', background:VM.terra }}></span>
        <span style={{ width:64, height:1, background:`linear-gradient(90deg, ${VM.faint}, transparent)` }}></span>
      </div>

      <p style={{ fontFamily:VM.serif, fontStyle:'italic', fontSize:18, color:VM.ink2, margin:0, textAlign:'center' }}>
        <span style={{ fontStyle:'normal', fontWeight:600, color:VM.ink }}>Carlos</span>
        <span style={{ display:'block', fontFamily:VM.mono, fontStyle:'normal', fontSize:10.5, letterSpacing:'0.16em',
          textTransform:'uppercase', color:VM.ink3, marginTop:10 }}>Founder · Veridian Markets AI</span>
      </p>

      <button onClick={()=>go('front')} style={{ display:'inline-flex', alignItems:'center', gap:10, marginTop: isMobile ? 38 : 52,
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
