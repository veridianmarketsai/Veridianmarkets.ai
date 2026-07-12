// Veridian Markets — app shell + URL router (History API).
const { useState: useStateApp, useEffect: useEffectApp, useRef: useRefApp } = React;

// ── Routing ────────────────────────────────────────────────────────────────
// Each Toolbar Menu page gets its own clean URL. The company dashboard is
// /company/<ticker>. Everything is served from the site root (see index.html +
// 404.html for the GitHub Pages SPA deep-link handling).
const ROUTE_PATHS = {
  landing:     '/',
  front:       '/home',
  signin:      '/sign-in',
  myportfolio: '/portfolio',
  mybusiness:  '/my-business',
  supply:      '/supply-chain',
  screener:    '/search',
  history:     '/history',
  learn:       '/learn',
  memoir:      '/memoir',
  admin:       '/admin',
  settings:    '/settings',
  calendar:    '/calendar',
  news:        '/news',
};
const PATH_ROUTES = Object.fromEntries(Object.entries(ROUTE_PATHS).map(([r, p]) => [p, r]));
const ROUTE_TITLES = {
  landing:'Veridian Markets · history-led finance',
  front:'Home · Veridian Markets', signin:'Sign in · Veridian Markets',
  myportfolio:'My Account · Veridian Markets', mybusiness:'My Business · Veridian Markets',
  supply:'Supply chain network · Veridian Markets',
  screener:'Search · Veridian Markets', history:'History · Veridian Markets',
  learn:'Learn · Veridian Markets', memoir:'Read memoir · Veridian Markets',
  admin:'Admin · Veridian Markets', settings:'Settings · Veridian Markets',
  calendar:'Calendar · Veridian Markets', news:'News · Veridian Markets', dashboard:'Veridian Markets',
};

function pathToState(pathname) {
  let p = pathname.replace(/\/+$/, '') || '/';   // trim trailing slash(es)
  const m = p.match(/^\/company\/([^/]+)/i);
  if (m) {
    const ticker = decodeURIComponent(m[1]).toUpperCase();
    const company = VM_COMPANIES.find(c => c.ticker.toUpperCase() === ticker);
    return { route:'dashboard', company: company || null };
  }
  if (p.startsWith('/settings')) return { route: 'settings', company: null };
  return { route: PATH_ROUTES[p] || 'landing', company: null };
}
function stateToPath(route, company) {
  if (route === 'dashboard') return '/company/' + encodeURIComponent((company && company.ticker) || '').toLowerCase();
  return ROUTE_PATHS[route] || '/';
}

// ── Auth ─────────────────────────────────────────────────────────────────────
// Real sign-in is now AWS Cognito — see auth.jsx (VM_AUTH config + vm* flow
// functions) and backend-signin.md. The old client-side placeholder
// (VM_ACCOUNTS + SHA-256) has been removed. The app consumes the same shapes:
// `user` = { email, name, role } from the ID token; role 'admin' = Cognito
// group membership.

// Track viewport so the Toolbar Menu collapses into a hamburger below `bp`px.
function useIsMobile(bp) {
  const [m, setM] = useStateApp(typeof window!=='undefined' && window.innerWidth<=bp);
  useEffectApp(()=>{
    const on = ()=> setM(window.innerWidth<=bp);
    window.addEventListener('resize', on);
    return ()=> window.removeEventListener('resize', on);
  }, [bp]);
  return m;
}

// Mobile-only nudge toward the (future) native app. Placeholder: there's no store
// listing yet, so tapping it just acknowledges "coming soon".
function MobileAppCta() {
  const [tapped, setTapped] = useStateApp(false);
  return (
    <div style={{ position:'fixed', left:0, right:0, bottom:0, zIndex:60, background:VM.forest,
      display:'flex', alignItems:'center', gap:8, padding:'9px 12px',
      paddingBottom:'calc(9px + env(safe-area-inset-bottom, 0px))', boxShadow:'0 -6px 20px rgba(31,29,26,0.18)' }}>
      <button onClick={()=>setTapped(true)}
        style={{ flex:1, fontFamily:VM.serif, fontSize:14, fontWeight:600, padding:'10px 14px', borderRadius:999,
          border:'none', background:VM.paperWarm, color:VM.forest, cursor:'pointer' }}>
        {tapped ? 'Coming soon — iOS & Android' : 'Download App for Complete Experience'}
      </button>
    </div>
  );
}

// Floating AI assistant — a sticky dark-green "thinking bubble" at the bottom-right
// that expands leftward into an "Ask Veridian AI" search bar. Placeholder responder
// for now; the submit handler is where the Claude API call will go (Phase 3).
function AiAssistant({ isMobile, bottom }) {
  const [open, setOpen]     = useStateApp(false);
  const [q, setQ]           = useStateApp('');
  const [answer, setAnswer] = useStateApp(null);
  const [busy, setBusy]     = useStateApp(false);
  const inputRef = React.useRef(null);

  const openIt = () => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 80); };
  const close  = () => setOpen(false);
  const ask = () => {
    const query = q.trim();
    if (!query) { close(); return; }
    setBusy(true); setAnswer(null);
    // TODO(Phase 3): replace with a real Claude API call (history-led answer).
    setTimeout(() => {
      setBusy(false);
      setAnswer(`Veridian AI is coming soon. I’ll answer “${query}” with history-led context — analogues, base rates, and what tends to happen next — powered by Claude.`);
    }, 750);
  };
  useEffectApp(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') { setAnswer(null); close(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const hasQ = !!q.trim();
  const rightAction = () => { if (!open) return openIt(); if (hasQ) return ask(); close(); };

  return (
    <div style={{ position:'fixed', right: isMobile ? 16 : 24, bottom, zIndex: 75, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:10 }}>
      {/* answer / thinking bubble (above the bar) */}
      {open && (busy || answer) && (
        <div style={{ maxWidth: isMobile ? '86vw' : 360, background: VM.paper, border:`1px solid ${VM.border}`, borderRadius:14,
          padding:'12px 14px', boxShadow:'0 14px 34px rgba(31,29,26,0.2)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
            <Label style={{ color: VM.terra }}>Veridian AI</Label>
            <i className="ti ti-x" onClick={()=>setAnswer(null)} title="Dismiss" style={{ fontSize:14, color:VM.ink3, cursor:'pointer' }}></i>
          </div>
          {busy
            ? <Mono size={12} color={VM.ink3}>Thinking…</Mono>
            : <span style={{ fontFamily:VM.serif, fontSize:13.5, color:VM.ink2, lineHeight:1.5 }}>{answer}</span>}
        </div>
      )}
      <div onClick={()=> !open && openIt()} style={{ display:'flex', alignItems:'center', height:52,
        width: open ? (isMobile ? 'min(86vw, 360px)' : 360) : 52, borderRadius:999, background: VM.forest,
        boxShadow:'0 10px 30px rgba(31,29,26,0.28)', overflow:'hidden', cursor: open ? 'default' : 'pointer',
        transition:'width .3s cubic-bezier(.4,0,.2,1)' }}>
        {open && (
          <input ref={inputRef} value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=> e.key === 'Enter' && ask()}
            className="vm-ai-input" placeholder="Ask Veridian AI…"
            style={{ flex:1, minWidth:0, border:'none', outline:'none', background:'transparent', fontFamily:VM.serif, fontSize:15, color:VM.paperWarm, padding:'0 6px 0 18px' }} />
        )}
        <button onClick={(e)=>{ e.stopPropagation(); rightAction(); }} title={open ? (hasQ ? 'Ask' : 'Close') : 'Ask Veridian AI'}
          style={{ width:52, height:52, flexShrink:0, border:'none', background:'transparent', color:VM.paperWarm, cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', padding:0 }}>
          {(open && hasQ)
            ? <i className="ti ti-arrow-up" style={{ fontSize:22 }}></i>
            : <span style={{ fontFamily:'"Times New Roman", Times, serif', fontSize:27, fontWeight:700, lineHeight:1 }}>Q</span>}
        </button>
      </div>
    </div>
  );
}

function App() {
  // Seed route + company from the current URL so deep links / refreshes land on
  // the right page (front | screener | supply | dashboard | history | memoir |
  // learn | signin | myportfolio).
  const [theme, setTheme] = useStateApp(() => { try { return localStorage.getItem('vm_theme') || 'light'; } catch(e) { return 'light'; } });
  useEffectApp(() => { window.__vmThemeUpdate = setTheme; }, [setTheme]);

  const initial = pathToState(window.location.pathname);
  const [route, setRoute] = useStateApp(initial.route);
  const [company, setCompany] = useStateApp(initial.company || VM_COMPANIES[0]);
  const [menuOpen, setMenuOpen] = useStateApp(false);
  // Drill trail for the dashboard breadcrumb — each crumb is { co, tab }, so the
  // path reads e.g. SPX › Supply chain › AAPL › Financials. Seeded from a deep link.
  const [dashTrail, setDashTrail] = useStateApp(initial.company ? [{ co: initial.company, tab: 'Overview' }] : []);
  const isMobile = useIsMobile(768);
  useEffectApp(()=>{ if(!isMobile) setMenuOpen(false); }, [isMobile]);

  const [activeTourId, setActiveTourId] = useStateApp(null);
  const goRef = useRefApp(null);

  // "Learn how to use this?" nudge — slides up after 3 clicks anywhere in the app.
  const [nudgeCount, setNudgeCount] = useStateApp(0);
  const [nudgeDismissed, setNudgeDismissed] = useStateApp(() => {
    try { return !!localStorage.getItem('vm_learn_nudge_done'); } catch { return false; }
  });
  const [nudgeIn, setNudgeIn] = useStateApp(false);
  useEffectApp(() => {
    if (nudgeDismissed) return;
    const bump = () => setNudgeCount(n => n + 1);
    document.addEventListener('click', bump);
    return () => document.removeEventListener('click', bump);
  }, [nudgeDismissed]);
  const showNudge = nudgeCount >= 3 && !nudgeDismissed && route !== 'learn';
  useEffectApp(() => {
    if (showNudge) { const t = setTimeout(() => setNudgeIn(true), 60); return () => clearTimeout(t); }
    else setNudgeIn(false);
  }, [showNudge]);
  const dismissNudge = (e) => {
    e.stopPropagation();
    setNudgeDismissed(true);
    setNudgeIn(false);
    try { localStorage.setItem('vm_learn_nudge_done', '1'); } catch {}
  };

  // Keep the trail in step with navigation: drilling into a new company appends a
  // crumb (fresh on Overview); revisiting an earlier crumb truncates back to it
  // (restoring the tab it was on); leaving the dashboard flow clears the trail.
  const syncTrail = (r, c) => setDashTrail(tr => {
    if (r !== 'dashboard') return [];
    if (!c) return tr;
    const i = tr.findIndex(e => e.co.ticker === c.ticker);
    return i >= 0 ? tr.slice(0, i + 1) : [...tr, { co: c, tab: 'Overview' }];
  });
  // Update the current (last) crumb's tab when the user switches dashboard tabs.
  const setDashTab = (t) => setDashTrail(tr => tr.length ? tr.map((e, i) => i === tr.length - 1 ? { ...e, tab: t } : e) : tr);
  const dashTab = dashTrail.length ? dashTrail[dashTrail.length - 1].tab : 'Overview';

  const scrollTop = () => { window.scrollTo(0, 0); const main=document.getElementById('vm-main'); if(main) main.scrollTop=0; };
  // Navigate: update state AND push a real URL so every page is linkable.
  const go = (r, c) => {
    const nextCompany = c || company;
    if (c) setCompany(c);
    syncTrail(r, c);
    setRoute(r); setMenuOpen(false);
    const path = stateToPath(r, nextCompany);
    if (path !== window.location.pathname) window.history.pushState({}, '', path);

    scrollTop();
  };
  goRef.current = go;
  useEffectApp(() => {
    window.__vmStartTour = (id) => setActiveTourId(id);
    window.__vmGoForTour = (r, c) => goRef.current && goRef.current(r, c);
  }, []);
  // Back/forward buttons → sync state from the URL (no new history entry).
  useEffectApp(() => {
    const onPop = () => { const s = pathToState(window.location.pathname); setRoute(s.route); if (s.company) setCompany(s.company); syncTrail(s.route, s.company); scrollTop(); };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  // Keep the document title in step with the route.
  useEffectApp(() => { document.title = ROUTE_TITLES[route] || ROUTE_TITLES.front; }, [route]);

  // Session — seeded from the stored Cognito ID token so a refresh keeps you
  // signed in; a silent token refresh runs on mount (see effect below).
  const [user, setUser] = useStateApp(vmLoadUser);
  const signedIn = !!user;
  // Sign in via Cognito. Returns { ok } or { ok:false, error, code } so SignIn.jsx
  // can show a friendly message (no thrown errors bubbling to the UI).
  const signIn = async (email, password) => {
    try { setUser(await vmSignIn(email.trim(), password)); return { ok: true }; }
    catch (e) { return { ok: false, error: e.message, code: e.code }; }
  };
  const signOut = () => {
    vmClearSession();
    setUser(null);
    setAccountMode('personal');
    go('landing');   // sign-out returns to the marketing landing page
  };
  // On load: if a session exists, refresh the token when near expiry (keeps you
  // logged in across days without re-entering the password).
  useEffectApp(() => { vmEnsureFreshSession().then(u => { if (u) setUser(u); }); }, []);

  // Account mode — Personal ⇄ Business. A persisted preference that the rail
  // toggles; switching jumps to that mode's home (My Account / My Business).
  const [accountMode, setAccountMode] = useStateApp(() => { try { return localStorage.getItem('vm_account_mode') || 'personal'; } catch { return 'personal'; } });
  useEffectApp(() => { try { localStorage.setItem('vm_account_mode', accountMode); } catch {} }, [accountMode]);
  const switchMode = (mode) => { setAccountMode(mode); go(mode === 'business' ? 'mybusiness' : 'myportfolio'); };
  // Keep the rail toggle in step when navigating straight to either page.
  useEffectApp(() => {
    if (route === 'mybusiness' && accountMode !== 'business') setAccountMode('business');
    if (route === 'myportfolio' && accountMode !== 'personal') setAccountMode('personal');
  }, [route]);

  // Protected routes. Portfolio sign-in guard is temporarily disabled (laptop:
  // learn-1.14 "sign-in guard bypass"); Admin still needs the admin role.
  const isAdmin = !!(user && user.role === 'admin');
  const gatedFromBusiness = route==='mybusiness' && !signedIn;
  const gatedFromAdmin = route==='admin' && !isAdmin;
  const effRoute = gatedFromBusiness ? 'signin'
    : gatedFromAdmin ? (signedIn ? 'front' : 'signin')
    : (route==='signin' && signedIn) ? 'front'   // already signed in → never show the sign-in page (temporary)
    : route;

  // map rail ids to routes (rail uses 'screener' & 'supply' & 'history' & 'front')
  const railRoute = effRoute==='dashboard' ? 'screener' : effRoute;

  let screen;
  if(effRoute==='landing') screen = <VMLanding />;
  else if(effRoute==='front') screen = <FrontPage go={go} isMobile={isMobile} />;
  else if(effRoute==='screener') screen = <Screener go={go} isMobile={isMobile} />;
  else if(effRoute==='supply') screen = <ScnLiveDemo go={go} isMobile={isMobile} />;
  else if(effRoute==='dashboard') screen = <Dashboard company={company} go={go} isMobile={isMobile} trail={dashTrail} tab={dashTab} onTabChange={setDashTab} />;
  else if(effRoute==='history') screen = <History go={go} isMobile={isMobile} />;
  else if(effRoute==='memoir') screen = <Memoir go={go} isMobile={isMobile} />;
  else if(effRoute==='learn') screen = <Learn go={go} isMobile={isMobile} />;
  else if(effRoute==='myportfolio') screen = <MyPortfolio go={go} user={user} isMobile={isMobile} />;
  else if(effRoute==='mybusiness') screen = <MyBusiness go={go} user={user} isMobile={isMobile} />;
  else if(effRoute==='admin') screen = <AdminPanel go={go} user={user} isMobile={isMobile} />;
  else if(effRoute==='settings') screen = <AccountSettings go={go} user={user} onSignOut={signOut} isMobile={isMobile} theme={theme} onThemeChange={(n)=>window.applyVMTheme(n)} />;
  else if(effRoute==='calendar') screen = <Calendar go={go} isMobile={isMobile} />;
  else if(effRoute==='news') screen = <News go={go} isMobile={isMobile} />;
  else if(effRoute==='signin') screen = <SignIn go={go} signIn={signIn} redirectTo={gatedFromAdmin ? 'admin' : gatedFromBusiness ? 'mybusiness' : 'myportfolio'} isMobile={isMobile} />;

  const bare = effRoute==='signin';   // chromeless: green header + footer only (no rail / ticker)
  // Full-bleed marketing landing — its own nav/footer, no app chrome at all.
  const chromeless = effRoute==='landing';
  if (chromeless) {
    return (
      <div key={'app-'+theme} id="vm-main" style={{ height:'100vh', overflowY:'auto', overflowX:'hidden', background:VM.paperWarm }}>
        {screen}
      </div>
    );
  }

  return (
    <div key={'app-'+theme} style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden', background:VM.paperWarm }}>
      <GlobalHeader go={go} isMobile={isMobile} menuOpen={menuOpen} onToggleMenu={()=>setMenuOpen(o=>!o)} hideMenuButton={bare} />
      {bare ? (
        <main id="vm-main" style={{ flex:1, overflowY:'auto', minHeight:0, background:VM.paperWarm, paddingBottom: isMobile ? 76 : 0 }}>
          {screen}
          <Footer />
        </main>
      ) : (
        <div style={{ flex:1, display:'flex', minHeight:0 }}>
          <Rail route={railRoute} go={go} mobile={isMobile} open={menuOpen} onClose={()=>setMenuOpen(false)} signedIn={signedIn} user={user} onSignOut={signOut} isAdmin={isAdmin} accountMode={accountMode} onModeChange={switchMode} />
          <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, minHeight:0 }}>
            <IndexStrip />
            <main id="vm-main" style={{ flex:1, overflowY:'auto', background:VM.paperWarm, paddingBottom: isMobile ? 76 : 0 }}>
              {screen}
              <Footer />
            </main>
          </div>
        </div>
      )}
      {isMobile && <MobileAppCta />}
      <AiAssistant isMobile={isMobile} bottom={isMobile ? 86 : (isMobile ? 16 : 24)} />
      {showNudge && (
        <div style={{ position:'fixed', bottom: isMobile ? 148 : 90, left:'50%',
          display:'flex', alignItems:'center', gap:11, padding:'12px 22px 12px 18px',
          background:VM.paper, border:`1px solid ${VM.teal}`, borderRadius:999,
          boxShadow:'0 6px 32px rgba(31,29,26,0.14)', zIndex:61,
          opacity: nudgeIn ? 1 : 0,
          transform: nudgeIn ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(18px)',
          transition:'opacity .38s ease, transform .42s cubic-bezier(.34,1.56,.64,1)',
          pointerEvents: nudgeIn ? 'auto' : 'none' }}>
          <i className="ti ti-graduation-cap" style={{ fontSize:16, color:VM.teal, flexShrink:0 }}></i>
          <span onClick={(e) => { e.stopPropagation(); dismissNudge(e); goRef.current && goRef.current('learn'); }}
            style={{ fontFamily:VM.serif, fontSize:15, color:VM.ink, cursor:'pointer', userSelect:'none' }}>
            Learn how to use this?
          </span>
          <i onClick={dismissNudge} className="ti ti-x"
            style={{ fontSize:13, color:VM.ink3, cursor:'pointer', flexShrink:0, marginLeft:2 }} title="Dismiss"></i>
        </div>
      )}
      {activeTourId && <TourEngine key={activeTourId} tourId={activeTourId} onDone={() => setActiveTourId(null)} />}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
