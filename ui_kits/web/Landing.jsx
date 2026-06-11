// Veridian Markets — marketing landing site (will replace the public root later).
// Standalone from the app: its own light marketing chrome (nav + footer), a few
// simple pages, and an embed of the real dependency-map live demo (ScnLiveDemo,
// compact mode). Reuses the global VM theme tokens + primitives. All top-level
// names are prefixed `Ld`/`LD_` to avoid clashing with the shared script bundle.
const { useState: useStateL, useEffect: useEffectL, useRef: useRefL } = React;

// ── small local helpers ──────────────────────────────────────────────────────
function ldUseMobile(bp = 860) {
  const [m, setM] = useStateL(typeof window !== 'undefined' && window.innerWidth <= bp);
  useEffectL(() => {
    const on = () => setM(window.innerWidth <= bp);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, [bp]);
  return m;
}

const LD_PAGES = [
  { id:'home',    label:'Home' },
  { id:'product', label:'Product' },
  { id:'why',     label:'Why Veridian' },
];

// Where landing CTAs send people into the real app (served at site root for now).
function ldAppUrl(route, co) {
  if (route === 'dashboard') return '/company/' + encodeURIComponent((co && co.ticker || '').toLowerCase());
  const map = { supply:'/supply-chain', learn:'/learn', memoir:'/memoir', news:'/news', front:'/home', signin:'/sign-in' };
  return map[route] || '/home';
}

// Editorial section kicker (mono, uppercase, teal) — matches the app's voice.
function LdKicker({ children, tone }) {
  return (
    <div style={{ fontFamily:VM.mono, fontSize:11.5, letterSpacing:'0.34em', textTransform:'uppercase',
      color: tone === 'paper' ? 'rgba(241,241,232,0.72)' : VM.teal, paddingLeft:'0.34em' }}>{children}</div>
  );
}

// terra diamond between two hairlines — the recurring brand divider.
function LdDivider({ pale }) {
  const line = pale ? 'rgba(241,241,232,0.28)' : VM.faint;
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:14, margin:'6px 0' }}>
      <span style={{ width:54, height:1, background:`linear-gradient(90deg, transparent, ${line})` }} />
      <span style={{ width:5, height:5, transform:'rotate(45deg)', background:VM.terra }} />
      <span style={{ width:54, height:1, background:`linear-gradient(90deg, ${line}, transparent)` }} />
    </div>
  );
}

// Solid/ghost pill button used across the marketing pages.
function LdBtn({ children, solid, light, cream, href, onClick, big }) {
  const [h, setH] = useStateL(false);
  const base = {
    display:'inline-flex', alignItems:'center', gap:9, cursor:'pointer', textDecoration:'none',
    fontFamily:VM.serif, fontSize: big ? 17 : 15, fontWeight:600, lineHeight:1,
    padding: big ? '14px 26px' : '11px 20px', borderRadius:999, transition:'all .18s ease',
    border:'1.4px solid transparent', whiteSpace:'nowrap',
  };
  let style;
  if (cream) style = { ...base, background: h ? '#FFFFFF' : VM.paperWarm, color:VM.forest, borderColor:'transparent', boxShadow: h ? '0 10px 24px rgba(0,0,0,0.22)' : '0 6px 16px rgba(0,0,0,0.16)' };
  else if (solid) style = { ...base, background: h ? VM.teal : VM.forest, color:VM.paperWarm, borderColor:'transparent' };
  else if (light) style = { ...base, background: h ? 'rgba(241,241,232,0.12)' : 'transparent', color:VM.paperWarm, borderColor:'rgba(241,241,232,0.5)' };
  else style = { ...base, background: h ? VM.forest : 'transparent', color: h ? VM.paperWarm : VM.forest, borderColor:VM.forest };
  const props = { style, onMouseEnter:()=>setH(true), onMouseLeave:()=>setH(false), onClick };
  return href ? <a href={href} {...props}>{children}</a> : <button {...props}>{children}</button>;
}

// ── marketing nav ────────────────────────────────────────────────────────────
function LdNav({ page, setPage, isMobile }) {
  const [scrolled, setScrolled] = useStateL(false);
  const [open, setOpen] = useStateL(false);
  useEffectL(() => {
    const on = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', on, { passive:true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  const link = (p) => (
    <button key={p.id} onClick={()=>{ setPage(p.id); setOpen(false); }}
      style={{ background:'none', border:'none', cursor:'pointer', padding:'6px 2px',
        fontFamily:VM.serif, fontSize:15.5, color: page===p.id ? VM.ink : VM.ink2,
        fontWeight: page===p.id ? 600 : 400, borderBottom: page===p.id ? `2px solid ${VM.terra}` : '2px solid transparent' }}>
      {p.label}
    </button>
  );
  return (
    <header style={{ position:'fixed', top:0, left:0, right:0, zIndex:50,
      background: scrolled ? 'rgba(244,241,232,0.86)' : 'rgba(244,241,232,0.0)',
      backdropFilter: scrolled ? 'saturate(180%) blur(12px)' : 'none',
      borderBottom: `1px solid ${scrolled ? VM.borderHair : 'transparent'}`, transition:'all .25s ease' }}>
      <div style={{ maxWidth:1180, margin:'0 auto', padding: isMobile ? '12px 18px' : '14px 32px',
        display:'flex', alignItems:'center', gap:18 }}>
        {/* wordmark */}
        <button onClick={()=>{ setPage('home'); setOpen(false); }}
          style={{ display:'flex', alignItems:'baseline', gap:9, background:'none', border:'none', cursor:'pointer', padding:0 }}>
          <span style={{ fontFamily:VM.serif, fontStyle:'italic', fontWeight:700, fontSize:21, color:VM.forest, letterSpacing:'-0.01em' }}>Veridian</span>
          <span style={{ fontFamily:VM.mono, fontSize:10, letterSpacing:'0.24em', textTransform:'uppercase', color:VM.ink3 }}>Markets</span>
        </button>

        <div style={{ flex:1 }} />

        {!isMobile && <nav style={{ display:'flex', alignItems:'center', gap:26 }}>{LD_PAGES.map(link)}</nav>}
        {!isMobile && <span style={{ width:1, height:22, background:VM.borderSoft, margin:'0 4px' }} />}
        {!isMobile && <a href={ldAppUrl('signin')} style={{ fontFamily:VM.serif, fontSize:15, color:VM.ink2, textDecoration:'none' }}>Sign in</a>}
        {!isMobile && <LdBtn solid href={ldAppUrl('signin')}>Sign in <i className="ti ti-arrow-right" /></LdBtn>}

        {isMobile && (
          <button onClick={()=>setOpen(o=>!o)} aria-label="Menu"
            style={{ background:'none', border:'none', cursor:'pointer', color:VM.ink, fontSize:24, lineHeight:1, padding:4 }}>
            <i className={'ti ti-' + (open ? 'x' : 'menu-2')} />
          </button>
        )}
      </div>

      {isMobile && open && (
        <div style={{ background:'rgba(244,241,232,0.97)', borderBottom:`1px solid ${VM.borderHair}`, padding:'8px 18px 18px',
          display:'flex', flexDirection:'column', gap:6 }}>
          {LD_PAGES.map(p => (
            <button key={p.id} onClick={()=>{ setPage(p.id); setOpen(false); }}
              style={{ textAlign:'left', background:'none', border:'none', cursor:'pointer', padding:'10px 2px',
                fontFamily:VM.serif, fontSize:18, color: page===p.id ? VM.ink : VM.ink2, fontWeight: page===p.id ? 600 : 400 }}>
              {p.label}
            </button>
          ))}
          <div style={{ display:'flex', gap:10, marginTop:8 }}>
            <LdBtn href={ldAppUrl('signin')}>Sign in</LdBtn>
            <LdBtn solid href={ldAppUrl('signin')}>Sign in</LdBtn>
          </div>
        </div>
      )}
    </header>
  );
}

// ── HOME ─────────────────────────────────────────────────────────────────────

// Hand-drawn underline accent (terra) beneath a word in the headline.
function LdUnderline({ children, color }) {
  return (
    <span style={{ position:'relative', display:'inline-block', whiteSpace:'nowrap' }}>
      {children}
      <svg viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden="true"
        style={{ position:'absolute', left:'-1%', bottom:'-0.18em', width:'102%', height:'0.4em', overflow:'visible' }}>
        <path d="M3 9 C 46 3, 150 3, 197 8" fill="none" stroke={color || VM.terra} strokeWidth="4.5" strokeLinecap="round" />
      </svg>
    </span>
  );
}

// A small floating asset "chip" used in the hero mini-map. `principle` = the
// centre node (filled forest); others are paper chips that depend on it.
function LdChip({ icon, label, sub, principle, anim, delay, style }) {
  return (
    <div style={{ position:'absolute', display:'flex', alignItems:'center', gap:9, padding:'9px 13px 9px 9px',
      borderRadius:999, animation:`${anim} 6s ease-in-out ${delay}s infinite`, willChange:'transform',
      background: principle ? VM.forest : VM.paper, color: principle ? VM.paperWarm : VM.ink,
      border: principle ? 'none' : `1px solid ${VM.borderSoft}`,
      boxShadow: principle ? '0 16px 34px rgba(29,78,58,0.35)' : '0 10px 24px rgba(31,29,26,0.12)', ...style }}>
      <span style={{ width:30, height:30, borderRadius:8, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:16, background: principle ? 'rgba(241,241,232,0.16)' : VM.tealTint, color: principle ? VM.paperWarm : VM.forest }}>
        <i className={'ti ti-'+icon} />
      </span>
      <div style={{ lineHeight:1.15 }}>
        <div style={{ fontFamily:VM.serif, fontWeight:600, fontSize:14 }}>{label}</div>
        <div style={{ fontFamily:VM.mono, fontSize:9.5, letterSpacing:'0.06em', textTransform:'uppercase',
          color: principle ? 'rgba(241,241,232,0.66)' : VM.ink3, marginTop:1 }}>{sub}</div>
      </div>
    </div>
  );
}

// The hero's right-hand visual: a tiny live dependency map — three inputs
// drifting toward Apple as the principle node, over a faint dotted grid.
function LdHeroMap({ isMobile }) {
  const dot = 'radial-gradient(rgba(31,29,26,0.10) 1.1px, transparent 1.1px)';
  return (
    <div style={{ position:'relative', width:'100%', height: isMobile ? 300 : 380,
      backgroundImage:dot, backgroundSize:'22px 22px', backgroundPosition:'center' }}>
      {/* connectors (drawn behind the chips) */}
      <svg viewBox="0 0 400 380" preserveAspectRatio="none" aria-hidden="true"
        style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}>
        {[[64,78],[330,150],[150,322]].map((p, i) => (
          <path key={i} d={`M${p[0]} ${p[1]} Q ${(p[0]+200)/2} ${(p[1]+196)/2 + (i===2?40:-30)}, 200 196`}
            fill="none" stroke={VM.teal} strokeOpacity="0.5" strokeWidth="1.6"
            strokeDasharray="2 6" strokeLinecap="round" style={{ animation:'ldDash 1.2s linear infinite' }} />
        ))}
      </svg>
      {/* principle + inputs */}
      <LdChip principle icon="brand-apple" label="Apple" sub="AAPL · principle" anim="ldFloatC" delay={0.2}
        style={{ left:'50%', top:'52%', transform:'translate(-50%,-50%)' }} />
      <LdChip icon="droplet" label="Brent Crude" sub="Energy" anim="ldFloatA" delay={0} style={{ left:'4%', top:'14%' }} />
      <LdChip icon="cpu" label="TSMC" sub="Chips" anim="ldFloatB" delay={0.6} style={{ right:'2%', top:'34%' }} />
      <LdChip icon="diamond" label="Gold" sub="Metals" anim="ldFloatA" delay={1.1} style={{ left:'18%', bottom:'10%' }} />
    </div>
  );
}

function LdSplitHero({ isMobile, onSeeDemo }) {
  const badge = (
    <div style={{ display:'inline-flex', alignItems:'center', gap:9, padding:'7px 14px', borderRadius:999,
      border:'1px solid rgba(241,241,232,0.28)', background:'rgba(241,241,232,0.08)' }}>
      <span style={{ width:6, height:6, transform:'rotate(45deg)', background:VM.terra }} />
      <span style={{ fontFamily:VM.mono, fontSize:10.5, letterSpacing:'0.22em', textTransform:'uppercase', color:'rgba(241,241,232,0.82)' }}>For investors &amp; businesses</span>
    </div>
  );
  const copy = (
    <div style={{ position:'relative', zIndex:2 }}>
      {badge}
      <h1 style={{ fontFamily:VM.serif, fontWeight:400, color:VM.paperWarm, margin:'22px 0 0',
        fontSize: isMobile ? 'clamp(28px, 8vw, 38px)' : 'clamp(34px, 4.8vw, 58px)',
        lineHeight:1.1, letterSpacing:'-0.015em', textWrap:'balance', overflowWrap:'break-word' }}>
        Read the market like a <LdUnderline>map</LdUnderline>,{!isMobile && <br/>} not a feed.
      </h1>
      <p style={{ fontFamily:VM.serif, fontSize: isMobile ? 16.5 : 19, lineHeight:1.6, color:'rgba(241,241,232,0.82)',
        maxWidth:480, margin:'22px 0 0' }}>
        Veridian draws the hidden dependencies behind every company, commodity and currency — then reads
        today against everything history already knows.
      </p>
      <div style={{ display:'flex', flexWrap:'wrap', gap:12, marginTop:30 }}>
        <LdBtn cream big onClick={onSeeDemo}>See it live <i className="ti ti-arrow-down" /></LdBtn>
        <LdBtn light big href={ldAppUrl('signin')}>Sign in <i className="ti ti-arrow-right" /></LdBtn>
      </div>
    </div>
  );

  return (
    <section style={{ padding: isMobile ? '34px 16px 8px' : '64px 32px 16px', background:VM.paperWarm }}>
      <div style={{ maxWidth:1180, margin:'0 auto', position:'relative', borderRadius:24, overflow:'hidden',
        background:VM.paper, border:`1px solid ${VM.borderSoft}`, boxShadow:'0 34px 80px rgba(31,29,26,0.14)' }}>

        {isMobile ? (
          <div>
            <div style={{ background:VM.forest, padding:'34px 22px 30px' }}>{copy}</div>
            <div style={{ padding:'10px 8px 4px' }}><LdHeroMap isMobile /></div>
          </div>
        ) : (
          <div style={{ position:'relative', display:'grid', gridTemplateColumns:'1.04fr 0.96fr', minHeight:498 }}>
            {/* two-tone: forest panel with a diagonal seam over the paper panel */}
            <div style={{ position:'absolute', inset:0, width:'60%', background:VM.forest, zIndex:1,
              clipPath:'polygon(0 0, 100% 0, 87% 100%, 0 100%)' }} />
            <div style={{ position:'relative', zIndex:2, padding:'58px 52px', display:'flex', flexDirection:'column', justifyContent:'center' }}>
              {copy}
            </div>
            <div style={{ position:'relative', zIndex:2, display:'flex', alignItems:'center', padding:'40px 36px 40px 8px' }}>
              <LdHeroMap />
            </div>
          </div>
        )}
      </div>

      {/* honest "what Veridian maps" strip (no fake partner logos) */}
      <div style={{ maxWidth:1180, margin:'0 auto', padding: isMobile ? '26px 4px 6px' : '34px 8px 8px',
        display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'center', gap: isMobile ? '8px 16px' : '10px 26px' }}>
        <span style={{ fontFamily:VM.mono, fontSize:10.5, letterSpacing:'0.2em', textTransform:'uppercase', color:VM.ink3 }}>What Veridian maps</span>
        <span style={{ width:5, height:5, transform:'rotate(45deg)', background:VM.terra }} />
        {['Equities','Commodities','Currencies','Rates','Supply chains'].map((t, i, a) => (
          <React.Fragment key={t}>
            <span style={{ fontFamily:VM.serif, fontSize: isMobile ? 15 : 17, color:VM.ink2 }}>{t}</span>
            {i < a.length - 1 && <span style={{ color:VM.faint }}>·</span>}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}

function LdDemoSection({ isMobile, demoRef, go, lead }) {
  return (
    <section ref={demoRef} style={{ padding: lead
        ? (isMobile ? '104px 16px 54px' : '150px 32px 92px')
        : (isMobile ? '54px 16px' : '92px 32px'), background:VM.paperWarm }}>
      <div style={{ maxWidth:1180, margin:'0 auto', textAlign:'center', marginBottom: isMobile ? 26 : 40 }}>
        <LdKicker>Live demo · the dependency map</LdKicker>
        <h2 style={{ fontFamily:VM.serif, fontWeight:400, color:VM.ink, margin:'14px 0 0',
          fontSize:'clamp(26px, 3.6vw, 40px)', lineHeight:1.18, letterSpacing:'-0.01em', textWrap:'balance' }}>
          Trace the web behind any company — <em style={{ fontStyle:'italic', color:VM.teal }}>in real time.</em>
        </h2>
        <p style={{ fontFamily:VM.serif, fontSize: isMobile ? 16 : 18, color:VM.ink2, maxWidth:600, margin:'16px auto 0', lineHeight:1.55 }}>
          Inputs flow in from the left, customers branch out to the right. Click any node to make it
          the centre and keep pulling the thread.
        </p>
      </div>

      {/* framed "browser" embed of the real demo */}
      <div style={{ maxWidth:1180, margin:'0 auto', background:VM.paper, border:`1px solid ${VM.borderSoft}`,
        borderRadius:16, boxShadow:'0 30px 70px rgba(31,29,26,0.12)', overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 16px', borderBottom:`1px solid ${VM.borderHair}`, background:VM.paperWarm }}>
          <span style={{ width:11, height:11, borderRadius:99, background:'#E0B0A0' }} />
          <span style={{ width:11, height:11, borderRadius:99, background:'#E8D2A0' }} />
          <span style={{ width:11, height:11, borderRadius:99, background:VM.tealTint2 }} />
          <span style={{ fontFamily:VM.mono, fontSize:11, letterSpacing:'0.08em', color:VM.ink3, marginLeft:8 }}>veridianmarkets.ai / dependency-map</span>
        </div>
        <div style={{ padding: isMobile ? '14px 12px 8px' : '24px 24px 12px' }}>
          <ScnLiveDemo go={go} isMobile={isMobile} initialTicker="AAPL" compact />
        </div>
      </div>

      <div style={{ textAlign:'center', marginTop:28 }}>
        <LdBtn solid big href={ldAppUrl('supply')}>Open the full demo <i className="ti ti-arrow-right" /></LdBtn>
      </div>
    </section>
  );
}

function LdPillars({ isMobile }) {
  const items = [
    { i:'sitemap', k:'Dependency map', t:'See the whole chain.',
      d:'Inputs, the company, its customers — the entire web of relationships on a single screen, drillable node by node.' },
    { i:'history', k:'History, read forward', t:'Markets rhyme.',
      d:'We line today up against its closest moments in history, so you can see what tended to happen next.' },
    { i:'users', k:'For everyone', t:'First £100 to whole businesses.',
      d:'Built for people just starting out and for companies modelling how global economics hit their bottom line.' },
  ];
  return (
    <section style={{ padding: isMobile ? '54px 18px' : '88px 32px', background:VM.paper, borderTop:`1px solid ${VM.borderHair}` }}>
      <div style={{ maxWidth:1180, margin:'0 auto' }}>
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: isMobile ? 18 : 28 }}>
          {items.map((it) => (
            <div key={it.k}>
              <span style={{ width:46, height:46, borderRadius:13, background:VM.tealTint, color:VM.forest,
                display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:23 }}><i className={'ti ti-'+it.i} /></span>
              <div style={{ marginTop:16 }}><LdKicker>{it.k}</LdKicker></div>
              <h3 style={{ fontFamily:VM.serif, fontWeight:400, fontSize:23, color:VM.ink, margin:'8px 0 0', letterSpacing:'-0.01em' }}>{it.t}</h3>
              <p style={{ fontFamily:VM.serif, fontSize:16, lineHeight:1.6, color:VM.ink2, margin:'10px 0 0' }}>{it.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── EXPLORE: "boxes" showcase — News / Learn / Impacts ───────────────────────
function LdExploreCard({ headerBg, visual, icon, title, sub, href }) {
  const [h, setH] = useStateL(false);
  return (
    <a href={href} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{ display:'block', textDecoration:'none', borderRadius:20, overflow:'hidden',
        border:`1px solid ${VM.borderSoft}`, background:VM.paper,
        boxShadow: h ? '0 26px 52px rgba(31,29,26,0.17)' : '0 14px 32px rgba(31,29,26,0.08)',
        transform: h ? 'translateY(-6px)' : 'none', transition:'all .22s ease' }}>
      <div style={{ position:'relative', height:208, background:headerBg, overflow:'hidden' }}>{visual}</div>
      <div style={{ padding:'17px 19px 20px', display:'flex', alignItems:'center', gap:12 }}>
        <span style={{ width:40, height:40, borderRadius:11, flexShrink:0, background:VM.tealTint, color:VM.forest,
          display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:20 }}><i className={'ti ti-'+icon} /></span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:VM.serif, fontWeight:600, fontSize:18, color:VM.ink, lineHeight:1.2 }}>{title}</div>
          <div style={{ fontFamily:VM.serif, fontSize:14, color:VM.ink2, marginTop:2 }}>{sub}</div>
        </div>
        <i className="ti ti-arrow-right" style={{ fontSize:18, color: h ? VM.forest : VM.ink3, transform: h ? 'translateX(3px)' : 'none', transition:'all .2s ease' }} />
      </div>
    </a>
  );
}

function LdExplore({ isMobile }) {
  // News card visual — a faux headline feed over the deep paper tone.
  const newsVisual = (
    <div style={{ position:'absolute', inset:0, padding:'18px 18px', display:'flex', flexDirection:'column', gap:10 }}>
      <span style={{ display:'inline-flex', alignItems:'center', gap:6, alignSelf:'flex-start', padding:'4px 9px', borderRadius:999,
        background:VM.paper, border:`1px solid ${VM.borderHair}`, fontFamily:VM.mono, fontSize:9, letterSpacing:'0.12em', color:VM.terra }}>
        <span style={{ width:5, height:5, borderRadius:99, background:VM.terra }} /> LIVE
      </span>
      {[['Oil jumps as supply tightens','2m','down'],['Fed holds rates steady','1h','up'],['Chips rally on AI demand','3h','up']].map((r) => (
        <div key={r[0]} style={{ display:'flex', alignItems:'center', gap:9, background:VM.paper, border:`1px solid ${VM.borderHair}`,
          borderRadius:10, padding:'8px 10px' }}>
          <span style={{ width:6, height:6, borderRadius:99, background: r[2]==='up'?VM.up:VM.down, flexShrink:0 }} />
          <span style={{ flex:1, fontFamily:VM.serif, fontSize:13, color:VM.ink, lineHeight:1.2, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{r[0]}</span>
          <span style={{ fontFamily:VM.mono, fontSize:9.5, color:VM.ink3 }}>{r[1]}</span>
        </div>
      ))}
    </div>
  );
  // Learn card visual — a lesson tile with a progress bar.
  const learnVisual = (
    <div style={{ position:'absolute', inset:0, padding:'22px 20px', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:'100%', background:VM.paper, border:`1px solid ${VM.borderHair}`, borderRadius:14, padding:'16px 16px 18px', boxShadow:'0 10px 24px rgba(31,29,26,0.08)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ width:34, height:34, borderRadius:9, background:VM.forest, color:VM.paperWarm, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:17 }}><i className="ti ti-player-play-filled" /></span>
          <div style={{ fontFamily:VM.serif, fontWeight:600, fontSize:14.5, color:VM.ink, lineHeight:1.2 }}>Reading a supply-chain map</div>
        </div>
        <div style={{ height:7, borderRadius:99, background:VM.tealTint2, marginTop:15, overflow:'hidden' }}>
          <div style={{ width:'62%', height:'100%', borderRadius:99, background:VM.forest }} />
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, fontFamily:VM.mono, fontSize:9.5, letterSpacing:'0.08em', color:VM.ink3 }}>
          <span>3 / 11 MODULES</span><span>62%</span>
        </div>
      </div>
    </div>
  );
  // Impacts card visual — concentric ripples from an event to what it touches.
  const impactVisual = (
    <div style={{ position:'absolute', inset:0 }}>
      <svg viewBox="0 0 360 208" preserveAspectRatio="xMidYMid slice" style={{ position:'absolute', inset:0, width:'100%', height:'100%' }} aria-hidden="true">
        {[34,66,98].map((r) => <circle key={r} cx="120" cy="104" r={r} fill="none" stroke={VM.tealTint2} strokeOpacity={0.5} strokeWidth="1.4" />)}
        {[[250,52],[280,104],[250,158]].map((p, i) => (
          <line key={i} x1="120" y1="104" x2={p[0]} y2={p[1]} stroke={VM.tealTint2} strokeOpacity="0.55" strokeWidth="1.3" strokeDasharray="2 5" />
        ))}
      </svg>
      <span style={{ position:'absolute', left:120, top:104, transform:'translate(-50%,-50%)', width:46, height:46, borderRadius:999,
        background:VM.terra, color:VM.paperWarm, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:20, boxShadow:'0 10px 22px rgba(196,106,59,0.45)' }}><i className="ti ti-bolt" /></span>
      {[['Suppliers',250,52],['Currencies',280,104],['Your portfolio',250,158]].map((p) => (
        <span key={p[0]} style={{ position:'absolute', left:p[1], top:p[2], transform:'translate(-50%,-50%)', whiteSpace:'nowrap',
          background:VM.paper, border:`1px solid ${VM.borderHair}`, borderRadius:999, padding:'4px 10px', fontFamily:VM.serif, fontSize:12.5, color:VM.ink }}>{p[0]}</span>
      ))}
    </div>
  );

  const cards = [
    { headerBg:VM.paperDeep, visual:newsVisual, icon:'news', title:'Market news', sub:'The day’s moves, in context.', href: ldAppUrl('news') },
    { headerBg:VM.tealTint, visual:learnVisual, icon:'school', title:'Learn investing', sub:'Guided lessons, at your pace.', href: ldAppUrl('learn') },
    { headerBg:VM.tealTint, visual:impactVisual, icon:'radar-2', title:'Review impacts', sub:'See what each event touches.', href: ldAppUrl('supply') },
  ];

  return (
    <section style={{ padding: isMobile ? '54px 18px' : '20px 32px 88px', background:VM.paper }}>
      <div style={{ maxWidth:1180, margin:'0 auto' }}>
        <div style={{ display:'grid', gap: isMobile ? 18 : 24,
          gridTemplateColumns: isMobile ? '1fr' : '0.92fr 1fr 1fr 1fr' }}>

          {/* lead title card (two-tone forest) with a rotating accent ring */}
          <div style={{ borderRadius:20, background:VM.forest, color:VM.paperWarm, padding:'26px 24px 24px',
            display:'flex', flexDirection:'column', justifyContent:'space-between', minHeight: isMobile ? 200 : 'auto', overflow:'hidden', position:'relative' }}>
            <div>
              <LdKicker tone="paper">More to explore</LdKicker>
              <h2 style={{ fontFamily:VM.serif, fontWeight:400, color:VM.paperWarm, margin:'14px 0 0',
                fontSize:'clamp(24px, 2.4vw, 30px)', lineHeight:1.16, letterSpacing:'-0.01em' }}>
                Not just a map.
              </h2>
              <p style={{ fontFamily:VM.serif, fontSize:15, lineHeight:1.55, color:'rgba(241,241,232,0.78)', margin:'12px 0 0' }}>
                News, lessons and impact analysis — the whole picture, in one place.
              </p>
            </div>
            {/* rotating ring */}
            <div style={{ alignSelf:'flex-end', marginTop:18, position:'relative', width:84, height:84 }}>
              <svg viewBox="0 0 100 100" style={{ width:84, height:84, animation:'spin 18s linear infinite' }} aria-hidden="true">
                <defs><path id="ldExploreRing" d="M50,50 m-36,0 a36,36 0 1,1 72,0 a36,36 0 1,1 -72,0" /></defs>
                <text fill="rgba(241,241,232,0.7)" style={{ fontFamily:VM.mono, fontSize:9.5, letterSpacing:'0.18em' }}>
                  <textPath href="#ldExploreRing">EXPLORE · MORE · EXPLORE · MORE · </textPath>
                </text>
              </svg>
              <span style={{ position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)', color:VM.paperWarm, fontSize:22 }}><i className="ti ti-arrow-down-right" /></span>
            </div>
          </div>

          {cards.map((c) => <LdExploreCard key={c.title} {...c} />)}
        </div>
      </div>
    </section>
  );
}

function LdCtaBand({ isMobile }) {
  return (
    <section style={{ background:VM.forest, padding: isMobile ? '56px 18px' : '92px 32px' }}>
      <div style={{ maxWidth:780, margin:'0 auto', textAlign:'center' }}>
        <LdKicker tone="paper">Start where the world connects</LdKicker>
        <h2 style={{ fontFamily:VM.serif, fontWeight:400, color:VM.paperWarm, margin:'16px 0 0',
          fontSize:'clamp(28px, 4vw, 46px)', lineHeight:1.14, letterSpacing:'-0.01em', textWrap:'balance' }}>
          Understand how the world moves your money.
        </h2>
        <p style={{ fontFamily:VM.serif, fontSize: isMobile ? 16 : 18.5, color:'rgba(241,241,232,0.78)', margin:'18px auto 0', maxWidth:540, lineHeight:1.55 }}>
          Explore the live dependency map, then go deeper in the full Veridian app — free to look around.
        </p>
        <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:12, marginTop:30 }}>
          <LdBtn solid big href={ldAppUrl('signin')} >Sign in <i className="ti ti-arrow-right" /></LdBtn>
          <LdBtn light big href={ldAppUrl('supply')}>See the live demo</LdBtn>
        </div>
      </div>
    </section>
  );
}

function LdHome({ isMobile, demoRef, go }) {
  const onSeeDemo = () => { if (demoRef.current) demoRef.current.scrollIntoView({ behavior:'smooth', block:'start' }); };
  return (
    <>
      <LdSplitHero isMobile={isMobile} onSeeDemo={onSeeDemo} />
      <LdDemoSection isMobile={isMobile} demoRef={demoRef} go={go} />
      <LdPillars isMobile={isMobile} />
      <LdExplore isMobile={isMobile} />
      <LdCtaBand isMobile={isMobile} />
    </>
  );
}

// ── PRODUCT (what it does) ───────────────────────────────────────────────────
function LdFeatureRow({ isMobile, flip, kicker, title, body, points, icon, cta }) {
  const visual = (
    <div style={{ flex:'1 1 0', minWidth:0, background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:16,
      minHeight: isMobile ? 200 : 280, display:'flex', alignItems:'center', justifyContent:'center',
      boxShadow:'0 18px 44px rgba(31,29,26,0.08)', overflow:'hidden', position:'relative' }}>
      <i className={'ti ti-'+icon} style={{ fontSize: isMobile ? 92 : 132, color:VM.tealTint2 }} />
      <i className={'ti ti-'+icon} style={{ position:'absolute', fontSize: isMobile ? 40 : 56, color:VM.forest }} />
    </div>
  );
  const text = (
    <div style={{ flex:'1 1 0', minWidth:0 }}>
      <LdKicker>{kicker}</LdKicker>
      <h3 style={{ fontFamily:VM.serif, fontWeight:400, fontSize:'clamp(24px, 3vw, 32px)', color:VM.ink,
        margin:'12px 0 0', letterSpacing:'-0.01em', lineHeight:1.2 }}>{title}</h3>
      <p style={{ fontFamily:VM.serif, fontSize:17, lineHeight:1.62, color:VM.ink2, margin:'14px 0 0' }}>{body}</p>
      <ul style={{ listStyle:'none', padding:0, margin:'16px 0 0', display:'flex', flexDirection:'column', gap:9 }}>
        {points.map((p) => (
          <li key={p} style={{ display:'flex', gap:10, fontFamily:VM.serif, fontSize:15.5, color:VM.ink2 }}>
            <i className="ti ti-check" style={{ color:VM.teal, marginTop:3 }} /> {p}
          </li>
        ))}
      </ul>
      {cta && <div style={{ marginTop:22 }}><LdBtn href={cta.href}>{cta.label} <i className="ti ti-arrow-right" /></LdBtn></div>}
    </div>
  );
  return (
    <div style={{ display:'flex', gap: isMobile ? 22 : 56, alignItems:'center',
      flexDirection: isMobile ? 'column' : (flip ? 'row-reverse' : 'row') }}>
      {visual}{text}
    </div>
  );
}

function LdProduct({ isMobile }) {
  const rows = [
    { kicker:'Dependency map', icon:'sitemap', title:'Pull the thread on any company.',
      body:'Start at one company and watch its inputs and customers fan out. Click any node to recentre the map and keep going — the way the world actually connects.',
      points:['Inputs, principle and customers, side by side', 'Drill from a company to its suppliers in one click', 'Filter to companies, external forces, or everything'],
      cta:{ label:'Open the live demo', href: ldAppUrl('supply') } },
    { kicker:'History, read forward', icon:'history', title:'Compare today to what came before.',
      body:'Every market moment has rhymes in the past. Veridian overlays the present against its closest historical analogues so the next move is less of a surprise.',
      points:['Then-vs-now overlay charts', 'Base rates: what tended to happen next', 'Context drawn from decades of market history'] },
    { kicker:'Ask Veridian AI', icon:'sparkles', title:'A history-led answer, on demand.',
      body:'Ask a plain-English question and get an answer grounded in analogues and base rates — not vibes. Powered by Claude.',
      points:['Natural-language questions about any market', 'Answers cite the historical context', 'Always one tap away, anywhere in the app'] },
    { kicker:'Learn', icon:'school', title:'Go from curious to confident.',
      body:'Short, guided lessons teach you to read a supply-chain map, interpret history and manage your own money — at your own pace.',
      points:['Bite-size modules with progress tracking', 'Built around the tools you actually use', 'For first-timers and seasoned investors alike'],
      cta:{ label:'Browse the lessons', href: ldAppUrl('learn') } },
  ];
  return (
    <>
      <section style={{ padding: isMobile ? '116px 18px 40px' : '160px 32px 56px', background:`radial-gradient(120% 80% at 15% -10%, ${VM.tealTint} 0%, ${VM.paperWarm} 50%)` }}>
        <div style={{ maxWidth:820, margin:'0 auto', textAlign:'center' }}>
          <LdKicker>What it does</LdKicker>
          <h1 style={{ fontFamily:VM.serif, fontWeight:400, color:VM.ink, margin:'18px 0 0',
            fontSize:'clamp(32px, 4.6vw, 54px)', lineHeight:1.1, letterSpacing:'-0.015em', textWrap:'balance' }}>
            One place to see the forces behind the price.
          </h1>
          <p style={{ fontFamily:VM.serif, fontSize: isMobile ? 17 : 19, color:VM.ink2, margin:'20px auto 0', maxWidth:560, lineHeight:1.6 }}>
            A hybrid of the tools the professionals pay thousands for — dependency mapping, historical
            context and an AI that explains it — made simple enough for everyone.
          </p>
        </div>
      </section>
      <section style={{ padding: isMobile ? '20px 18px 56px' : '36px 32px 96px', background:VM.paperWarm }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', flexDirection:'column', gap: isMobile ? 48 : 84 }}>
          {rows.map((r, i) => <LdFeatureRow key={r.kicker} isMobile={isMobile} flip={i % 2 === 1} {...r} />)}
        </div>
      </section>
      <LdCtaBand isMobile={isMobile} />
    </>
  );
}

// ── WHY (why it exists / the problem) ────────────────────────────────────────
function LdWhy({ isMobile }) {
  const problems = [
    { i:'affiliate', t:'The world is more connected than ever', d:'A war, a drought or a chip shortage on one side of the planet reprices assets on the other. Most people invest blind to those links.' },
    { i:'lock', t:'The tools that show it are locked away', d:'The terminals that map these dependencies cost thousands a month — built for institutions, not for you or your business.' },
    { i:'puzzle', t:'Everything else is scattered', d:'Prices here, news there, history somewhere else. Nobody stitches it into a picture of how it all moves together.' },
  ];
  return (
    <>
      <section style={{ padding: isMobile ? '116px 18px 44px' : '160px 32px 64px',
        background:`radial-gradient(120% 80% at 85% -10%, ${VM.tealTint} 0%, ${VM.paperWarm} 52%)` }}>
        <div style={{ maxWidth:760, margin:'0 auto', textAlign:'center' }}>
          <LdKicker>Why it exists</LdKicker>
          <h1 style={{ fontFamily:VM.serif, fontWeight:400, color:VM.ink, margin:'18px 0 0',
            fontSize:'clamp(32px, 4.6vw, 54px)', lineHeight:1.1, letterSpacing:'-0.015em', textWrap:'balance' }}>
            The world runs on dependencies. <em style={{ fontStyle:'italic', color:VM.teal }}>So should the tools.</em>
          </h1>
          <p style={{ fontFamily:VM.serif, fontSize: isMobile ? 17 : 19.5, color:VM.ink2, margin:'22px auto 0', maxWidth:560, lineHeight:1.6 }}>
            Veridian Markets exists to give individuals and businesses the same situational
            awareness the institutions have — at a price that makes sense.
          </p>
        </div>
      </section>

      {/* the problem */}
      <section style={{ padding: isMobile ? '44px 18px' : '72px 32px', background:VM.paper, borderTop:`1px solid ${VM.borderHair}` }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom: isMobile ? 28 : 44 }}>
            <LdKicker tone="rust">The problem</LdKicker>
            <h2 style={{ fontFamily:VM.serif, fontWeight:400, fontSize:'clamp(26px, 3.4vw, 38px)', color:VM.ink, margin:'12px 0 0', letterSpacing:'-0.01em' }}>
              Three things stand between people and clarity.
            </h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: isMobile ? 16 : 26 }}>
            {problems.map((p) => (
              <div key={p.t} style={{ background:VM.paperWarm, border:`1px solid ${VM.borderHair}`, borderRadius:14, padding:'24px 22px' }}>
                <span style={{ width:44, height:44, borderRadius:12, background:VM.paper, border:`1px solid ${VM.borderSoft}`,
                  color:VM.terra, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:22 }}><i className={'ti ti-'+p.i} /></span>
                <h3 style={{ fontFamily:VM.serif, fontWeight:600, fontSize:19, color:VM.ink, margin:'16px 0 0', lineHeight:1.25 }}>{p.t}</h3>
                <p style={{ fontFamily:VM.serif, fontSize:15.5, lineHeight:1.6, color:VM.ink2, margin:'10px 0 0' }}>{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* the belief + mission */}
      <section style={{ padding: isMobile ? '52px 18px' : '88px 32px', background:VM.paperWarm }}>
        <div style={{ maxWidth:720, margin:'0 auto', textAlign:'center' }}>
          <LdDivider />
          <p style={{ fontFamily:VM.serif, fontStyle:'italic', fontWeight:400, fontSize:'clamp(22px, 3vw, 32px)',
            lineHeight:1.4, color:VM.ink, margin:'20px 0 0', letterSpacing:'-0.005em', textWrap:'balance' }}>
            We believe history is the best guide we have — and that
            <em style={{ color:VM.teal }}> everything depends on everything</em>. Veridian is built to
            make both legible to anyone.
          </p>
          <p style={{ fontFamily:VM.serif, fontSize:17, lineHeight:1.65, color:VM.ink2, margin:'26px 0 0' }}>
            It started with one investor trying to understand why the world moved the way it did — and
            realising the picture was hiding in plain sight, just never drawn. This platform is that picture,
            for everyone building a healthier, wealthier, happier future: for themselves, their families and
            their businesses.
          </p>
          <div style={{ marginTop:30, display:'flex', justifyContent:'center', gap:12, flexWrap:'wrap' }}>
            <LdBtn href={ldAppUrl('memoir')}>Read the founder&rsquo;s memoir <i className="ti ti-arrow-right" /></LdBtn>
            <LdBtn solid href={ldAppUrl('signin')}>Sign in</LdBtn>
          </div>
        </div>
      </section>
      <LdCtaBand isMobile={isMobile} />
    </>
  );
}

// ── footer ───────────────────────────────────────────────────────────────────
function LdFooter({ isMobile, setPage }) {
  const col = (title, links) => (
    <div>
      <div style={{ fontFamily:VM.mono, fontSize:10.5, letterSpacing:'0.18em', textTransform:'uppercase', color:VM.ink3, marginBottom:12 }}>{title}</div>
      <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
        {links.map((l) => l.page
          ? <button key={l.label} onClick={()=>setPage(l.page)} style={{ textAlign:'left', background:'none', border:'none', cursor:'pointer', padding:0, fontFamily:VM.serif, fontSize:15, color:VM.ink2 }}>{l.label}</button>
          : <a key={l.label} href={l.href} style={{ fontFamily:VM.serif, fontSize:15, color:VM.ink2, textDecoration:'none' }}>{l.label}</a>)}
      </div>
    </div>
  );
  return (
    <footer style={{ background:VM.paper, borderTop:`1px solid ${VM.borderHair}`, padding: isMobile ? '44px 18px 32px' : '64px 32px 40px' }}>
      <div style={{ maxWidth:1180, margin:'0 auto', display:'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : '2fr 1fr 1fr 1fr', gap: isMobile ? 28 : 40 }}>
        <div style={{ gridColumn: isMobile ? '1 / -1' : 'auto' }}>
          <div style={{ display:'flex', alignItems:'baseline', gap:9 }}>
            <span style={{ fontFamily:VM.serif, fontStyle:'italic', fontWeight:700, fontSize:22, color:VM.forest }}>Veridian</span>
            <span style={{ fontFamily:VM.mono, fontSize:10, letterSpacing:'0.24em', textTransform:'uppercase', color:VM.ink3 }}>Markets</span>
          </div>
          <p style={{ fontFamily:VM.serif, fontSize:15, color:VM.ink2, margin:'12px 0 0', maxWidth:300, lineHeight:1.55 }}>
            History-led finance. See how the world connects — and what it tends to do next.
          </p>
        </div>
        {col('Product', [{ label:'Dependency map', href: ldAppUrl('supply') }, { label:'What it does', page:'product' }, { label:'Learn', href: ldAppUrl('learn') }])}
        {col('Company', [{ label:'Why Veridian', page:'why' }, { label:'Founder memoir', href: ldAppUrl('memoir') }, { label:'Sign in', href: ldAppUrl('signin') }])}
        {col('Get started', [{ label:'Sign in', href: ldAppUrl('signin') }, { label:'See the live demo', href: ldAppUrl('supply') }])}
      </div>
      <div style={{ maxWidth:1180, margin:'36px auto 0' }}>
        <LdDivider />
        <div style={{ textAlign:'center', fontFamily:VM.mono, fontSize:11, letterSpacing:'0.12em', textTransform:'uppercase', color:VM.ink3, marginTop:14 }}>
          History, read forward · © Veridian Markets AI
        </div>
      </div>
    </footer>
  );
}

// ── root ─────────────────────────────────────────────────────────────────────
function VMLanding() {
  const isMobile = ldUseMobile(860);
  const [page, setPageRaw] = useStateL('home');
  const demoRef = useRefL(null);

  const setPage = (p) => { setPageRaw(p); window.scrollTo({ top:0, behavior:'auto' }); };
  // Demo CTAs / node clicks funnel into the real app (served at root for now).
  const go = (route, co) => { window.location.href = ldAppUrl(route, co); };

  return (
    <div style={{ background:VM.paperWarm, minHeight:'100vh', width:'100%', maxWidth:'100%', overflowX:'hidden' }}>
      {page === 'home' && <LdHome isMobile={isMobile} demoRef={demoRef} go={go} />}
      {page === 'product' && <LdProduct isMobile={isMobile} />}
      {page === 'why' && <LdWhy isMobile={isMobile} />}
      <LdFooter isMobile={isMobile} setPage={setPage} />
    </div>
  );
}

Object.assign(window, { VMLanding });
// Self-mount ONLY on the standalone landing page (landing/index.html sets this
// flag). Inside the main app, app.jsx renders <VMLanding/> for the root route,
// so we must not race it for #root here.
if (window.__VM_LANDING_STANDALONE) {
  ReactDOM.createRoot(document.getElementById('root')).render(<VMLanding />);
}
