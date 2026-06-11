// Veridian Markets — app chrome: masthead, left rail, index strip.
const { useState } = React;

const VM_HEADER_H = 52; // height of the green global top bar

// Full-width green top bar: branding (= home button) + hamburger on mobile.
function GlobalHeader({ go, isMobile, menuOpen, onToggleMenu, hideMenuButton }) {
  return (
    <header data-tour="vm-header" style={{ height:VM_HEADER_H, flexShrink:0, background:VM.forest, display:'flex', alignItems:'center',
      gap:12, padding:'0 14px', borderBottom:'1px solid rgba(0,0,0,0.20)', zIndex:50 }}>
      {isMobile && !hideMenuButton && (
        <button onClick={onToggleMenu} aria-label="Toggle menu" title="Menu" style={{ width:34, height:34, borderRadius:8,
          border:'1px solid rgba(255,255,255,0.25)', background:'rgba(255,255,255,0.08)', color:'#F2EFE8',
          display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', padding:0, flexShrink:0 }}>
          <i className={'ti ti-'+(menuOpen?'x':'menu-2')} style={{ fontSize:18 }}></i>
        </button>
      )}
      <div onClick={()=>go&&go('front')} title="Home page" style={{ display:'flex', alignItems:'baseline', gap:6,
        cursor:'pointer', whiteSpace:'nowrap', lineHeight:1 }}>
        <span style={{ fontFamily:VM.serif, fontStyle:'italic', fontWeight:700, fontSize:20, color:'#B8DDD0', letterSpacing:'-0.01em' }}>Veridian</span>
        <span style={{ fontFamily:VM.serif, fontWeight:500, fontSize:20, color:'#F2EFE8' }}>Markets</span>
      </div>
      <span style={{ marginLeft:'auto', fontFamily:VM.mono, fontSize:9.5, letterSpacing:'0.14em', textTransform:'uppercase', color:'rgba(225,241,236,0.78)' }}>history-led finance</span>
    </header>
  );
}

function Masthead({ go }) {
  return (
    <div onClick={()=>go&&go('front')} title="Home page" style={{ padding:'18px 16px 14px', cursor:'pointer' }}>
      <div style={{ fontFamily:VM.serif, lineHeight:1, display:'flex', alignItems:'baseline', gap:6, whiteSpace:'nowrap' }}>
        <span style={{ fontStyle:'italic', fontWeight:700, fontSize:20, color:VM.teal, letterSpacing:'-0.01em' }}>Veridian</span>
        <span style={{ fontWeight:500, fontSize:20, color:VM.ink }}>Markets</span>
      </div>
      <div style={{ fontFamily:VM.mono, fontSize:9.5, letterSpacing:'0.14em', textTransform:'uppercase', color:VM.ink3, marginTop:6 }}>history-led finance</div>
    </div>
  );
}

const RAIL_GROUPS = [
  { head:null, items:[ {id:'search', label:'Search', icon:'search', isSearch:true } ] },
  { head:'You', items:[ {id:'signin', label:'Sign in'}, {id:'myportfolio', label:'My Account'}, {id:'mybusiness', label:'My Business', icon:'briefcase'}, {id:'settings', label:'Settings', icon:'settings'} ] },
  { head:'Explore', items:[ {id:'front', label:'Home'}, {id:'screener', label:'Search'}, {id:'news', label:'News'}, {id:'calendar', label:'Calendar'}, {id:'supply', label:'Dependency map', badge:'Live Demo'} ] },
  { head:null, items:[ {id:'learn', label:'Learn'}, {id:'memoir', label:'Read memoir', tone:'teal'} ] },
];

function Rail({ route, go, mobile, open, onClose, signedIn, user, onSignOut, isAdmin, accountMode, onModeChange }) {
  // The You group is personalised. When signed in, Sign-out + Settings drop to a
  // pinned bottom group; admins get an "Admin" item. Signed out: keep Sign in,
  // hide Settings. The You account item follows the Personal/Business mode.
  const groups = RAIL_GROUPS.slice(1).map(g => {
    if (g.head !== 'You') return g;
    let items = g.items.filter(it => it.id !== 'settings' && (!signedIn || it.id !== 'signin'));
    // Show the account page that matches the current mode (the other is a tap on
    // the toggle away), so the You group stays focused.
    items = items.filter(it => !(it.id === 'myportfolio' && accountMode === 'business') && !(it.id === 'mybusiness' && accountMode !== 'business'));
    if (isAdmin) items = [...items, { id:'admin', label:'Admin', tone:'teal', icon:'shield-half' }];
    return { ...g, items };
  });
  if (signedIn) {
    groups.push({ head:null, bottom:true, items:[ { id:'settings', label:'Settings', icon:'settings' }, { id:'signin', label:'Sign out' } ] });
  }
  // Greeting changes with the time of day (11pm–6am gets a wry late-night line).
  const hour = new Date().getHours();
  const firstName = signedIn && user && user.name ? user.name.split(' ')[0] : null;
  const greetBase = (hour >= 23 || hour < 6) ? "It's a bit late, isn't it?"
    : hour < 12 ? 'Good morning'
    : hour < 17 ? 'Good afternoon'
    : 'Good evening';
  const greeting = firstName ? `${greetBase}, ${firstName}.` : `${greetBase}.`;
  const base = { width:208, flexShrink:0, background:VM.rail, borderRight:`1px solid ${VM.borderSoft}`, overflowY:'auto', display:'flex', flexDirection:'column' };
  const style = mobile
    ? { ...base, width:248, position:'fixed', top:VM_HEADER_H, left:0, bottom:0, zIndex:40,
        transform: open?'translateX(0)':'translateX(-110%)', transition:'transform .22s ease',
        boxShadow: open?'2px 0 18px rgba(31,29,26,0.18)':'none' }
    : { ...base, height:'100%' };
  return (
    <React.Fragment>
      {mobile && open && (
        <div onClick={onClose} style={{ position:'fixed', top:VM_HEADER_H, left:0, right:0, bottom:0, background:'rgba(31,29,26,0.34)', zIndex:39 }}></div>
      )}
      <aside data-tour="vm-nav-rail" style={style}>
      {/* Time-of-day greeting, pinned above the 'You' group. */}
      <div style={{ padding:'16px 16px 4px' }}>
        <span style={{ fontFamily:VM.serif, fontWeight:700, fontSize:18, color:VM.ink, lineHeight:1.18 }}>{greeting}</span>
        {signedIn && user && (
          <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:4 }}>
            <i className="ti ti-circle-check-filled" style={{ fontSize:12, color:VM.upInk }}></i>
            <span style={{ fontFamily:VM.mono, fontSize:10, color:VM.ink3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.email}</span>
          </div>
        )}
      </div>

      {/* Personal ⇄ Business account switcher */}
      {onModeChange && (
        <div style={{ padding:'8px 16px 2px' }}>
          <div style={{ display:'flex', background:VM.paper, border:`1px solid ${VM.border}`, borderRadius:999, padding:3 }}>
            {[['personal','Personal','user'],['business','Business','briefcase']].map(([m, lbl, icon]) => {
              const on = (accountMode||'personal') === m;
              return (
                <button key={m} onClick={()=>onModeChange(m)} title={`${lbl} account`} style={{
                  flex:1, display:'inline-flex', alignItems:'center', justifyContent:'center', gap:5,
                  fontFamily:VM.mono, fontSize:10, letterSpacing:'0.03em', textTransform:'uppercase', fontWeight:700,
                  padding:'6px 8px', borderRadius:999, border:'none', cursor:'pointer',
                  background: on ? VM.forest : 'transparent', color: on ? '#F2EFE8' : VM.ink3 }}>
                  <i className={'ti ti-'+icon} style={{ fontSize:12 }}></i>{lbl}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <nav style={{ padding:'8px 8px 14px', display:'flex', flexDirection:'column', gap:2, flex:1 }}>
        {groups.map((g,gi)=>(
          <div key={gi} style={{ marginBottom:10, ...(g.bottom ? { marginTop:'auto', marginBottom:0 } : null) }}>
            {g.head && <div style={{ fontFamily:VM.mono, fontSize:9, letterSpacing:'0.1em', textTransform:'uppercase', color:VM.faint, padding:'8px 10px 5px' }}>{g.head}</div>}
            {g.items.map((it,ii)=>{
              // The Sign-in item flips to "Sign out" once authenticated.
              const isAuth = it.id==='signin';
              const showSignOut = isAuth && signedIn;
              const active = it.id && it.id===route && !showSignOut;
              const clickable = !!it.id;
              const label = showSignOut ? 'Sign out' : it.label;
              const onItemClick = showSignOut ? onSignOut : (clickable ? ()=>go(it.id) : undefined);
              return (
                <div key={ii} onClick={onItemClick} style={{
                  fontFamily:VM.serif, fontSize:15, padding:'6px 10px', borderRadius:7, cursor: clickable?'pointer':'default',
                  background: active?VM.paper:'transparent',
                  border: active?`1px solid ${VM.border}`:'1px solid transparent',
                  color: it.tone==='teal'?VM.teal : active?VM.ink:VM.ink2, fontWeight: active?600:400,
                  display:'flex', alignItems:'center', flexWrap:'wrap', gap:6,
                }}>
                  {it.icon && <i className={'ti ti-'+it.icon} style={{ fontSize:14 }}></i>}
                  <span>{label}</span>
                  {showSignOut && <i className="ti ti-logout" style={{ fontSize:13, color:VM.ink3 }}></i>}
                  {it.badge && (
                    <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontFamily:VM.mono, fontSize:8.5,
                      letterSpacing:'0.04em', lineHeight:1, color:VM.upInk, background:VM.tealTint,
                      border:`1px solid ${VM.up}`, borderRadius:5, padding:'2px 6px', whiteSpace:'nowrap' }}>
                      <span style={{ width:5, height:5, borderRadius:999, background:VM.up, display:'inline-block' }}></span>
                      {it.badge}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>
      </aside>
    </React.Fragment>
  );
}

// Auto-scrolling marquee (right → left, steady pace). Grab and drag with the mouse/finger to move
// it manually; auto-scroll resumes on release. The item set is rendered twice for a seamless loop.
function IndexStrip() {
  const wrapRef = React.useRef(null);
  const trackRef = React.useRef(null);
  const offsetRef = React.useRef(0);   // current translateX (negative = scrolled left)
  const halfRef = React.useRef(0);     // width of one copy of the items
  const dragRef = React.useRef(null);  // { x, off } while dragging; null = auto-scrolling

  React.useEffect(() => {
    const wrap = wrapRef.current, track = trackRef.current;
    if (!wrap || !track) return;
    halfRef.current = track.scrollWidth / 2;          // one copy = half the doubled track

    let raf, last = performance.now();
    const SPEED = 45;                                 // px/sec, right → left
    const tick = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05); last = now;
      if (!dragRef.current) offsetRef.current -= SPEED * dt;
      const half = halfRef.current || 1;
      while (offsetRef.current <= -half) offsetRef.current += half;   // seamless wrap
      while (offsetRef.current > 0) offsetRef.current -= half;
      track.style.transform = `translateX(${offsetRef.current}px)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onDown = (e) => { dragRef.current = { x: e.clientX, off: offsetRef.current }; wrap.setPointerCapture && wrap.setPointerCapture(e.pointerId); wrap.style.cursor = 'grabbing'; };
    const onMove = (e) => { if (dragRef.current) offsetRef.current = dragRef.current.off + (e.clientX - dragRef.current.x); };
    const onUp = (e) => { if (dragRef.current) { dragRef.current = null; wrap.style.cursor = 'grab'; wrap.releasePointerCapture && wrap.releasePointerCapture(e.pointerId); } };
    wrap.addEventListener('pointerdown', onDown);
    wrap.addEventListener('pointermove', onMove);
    wrap.addEventListener('pointerup', onUp);
    wrap.addEventListener('pointercancel', onUp);
    return () => {
      cancelAnimationFrame(raf);
      wrap.removeEventListener('pointerdown', onDown);
      wrap.removeEventListener('pointermove', onMove);
      wrap.removeEventListener('pointerup', onUp);
      wrap.removeEventListener('pointercancel', onUp);
    };
  }, []);

  const set = (p) => (
    <React.Fragment>
      {VM_INDEX.map((t,i)=>(
        <div key={p+i} style={{ flexShrink:0, display:'flex', alignItems:'center', gap:7, padding:'8px 14px', borderLeft:`1px dashed rgba(31,29,26,0.18)`, whiteSpace:'nowrap' }}>
          <Mono size={11} weight={700}>{t.sym}</Mono>
          <Mono size={11} color={VM.ink3}>{t.val}</Mono>
          <Sparkline dir={t.dir} w={34} h={13} sw={1.2} />
          <Mono size={10} weight={600} color={t.dir==='up'?VM.upInk:VM.downInk}>{t.chg}</Mono>
        </div>
      ))}
    </React.Fragment>
  );

  return (
    <div data-tour="vm-market-strip" ref={wrapRef} style={{ overflow:'hidden', background:VM.tealTint, borderTop:`1px solid ${VM.borderSoft}`, borderBottom:`1px solid ${VM.borderSoft}`, cursor:'grab', userSelect:'none', touchAction:'pan-y' }}>
      <div ref={trackRef} style={{ display:'flex', width:'max-content', willChange:'transform' }}>
        {set('a')}
        {set('b')}
      </div>
    </div>
  );
}

// Shared editorial footer — rendered once in App so it sits at the foot of every page.
function Footer() {
  return (
    <footer style={{ borderTop:`1px solid ${VM.borderSoft}`, padding:'30px 24px 40px', textAlign:'center', background:VM.paperWarm }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:14, marginBottom:16 }}>
        <span style={{ width:64, height:1, background:`linear-gradient(90deg, transparent, ${VM.faint})` }}></span>
        <span style={{ width:5, height:5, transform:'rotate(45deg)', background:VM.terra }}></span>
        <span style={{ width:64, height:1, background:`linear-gradient(90deg, ${VM.faint}, transparent)` }}></span>
      </div>
      <div style={{ fontFamily:VM.serif, display:'flex', alignItems:'baseline', justifyContent:'center', gap:6, marginBottom:8 }}>
        <span style={{ fontStyle:'italic', fontWeight:700, fontSize:16, color:VM.teal, letterSpacing:'-0.01em' }}>Veridian</span>
        <span style={{ fontWeight:500, fontSize:16, color:VM.ink }}>Markets</span>
      </div>
      <div style={{ fontFamily:VM.mono, fontSize:10.5, letterSpacing:'0.1em', textTransform:'uppercase', color:VM.ink3 }}>
        History, read forward
      </div>
    </footer>
  );
}

Object.assign(window, { Masthead, Rail, IndexStrip, Footer, GlobalHeader });
