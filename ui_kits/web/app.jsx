// Veridian Markets — app shell + URL router (History API).
const { useState: useStateApp, useEffect: useEffectApp, useRef: useRefApp } = React;

// ── Routing ────────────────────────────────────────────────────────────────
// Each Toolbar Menu page gets its own clean URL. The company dashboard is
// /company/<ticker>. Everything is served from the site root (see index.html +
// 404.html for the GitHub Pages SPA deep-link handling).
const ROUTE_PATHS = {
  front:       '/',
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
  front:'Veridian Markets · history-led finance', signin:'Sign in · Veridian Markets',
  myportfolio:'My Account · Veridian Markets', mybusiness:'My Business · Veridian Markets',
  supply:'Supply chain network · Veridian Markets',
  screener:'Search · Veridian Markets', history:'History · Veridian Markets',
  learn:'Learn · Veridian Markets', memoir:'Read memoir · Veridian Markets',
  admin:'Admin · Veridian Markets', settings:'Settings · Veridian Markets',
  calendar:'Calendar · Veridian Markets', news:'News · Veridian Markets', dashboard:'Veridian Markets',
};

// Turn the current URL into { route, company }.
function pathToState(pathname) {
  let p = pathname.replace(/\/+$/, '') || '/';   // trim trailing slash(es)
  const m = p.match(/^\/company\/([^/]+)/i);
  if (m) {
    const ticker = decodeURIComponent(m[1]).toUpperCase();
    const company = VM_COMPANIES.find(c => c.ticker.toUpperCase() === ticker);
    return { route:'dashboard', company: company || null };
  }
  if (p.startsWith('/settings')) return { route: 'settings', company: null };
  return { route: PATH_ROUTES[p] || 'front', company: null };
}
// Turn a route (+ company for the dashboard) into a URL.
function stateToPath(route, company) {
  if (route === 'dashboard') return '/company/' + encodeURIComponent((company && company.ticker) || '').toLowerCase();
  return ROUTE_PATHS[route] || '/';
}

// ── Auth (PLACEHOLDER — client-side only, NOT real security) ─────────────────
// This static prototype has no backend yet, so this login is a convenience for
// the owner, not a security boundary: the account list below ships in public
// client code. The password is kept as a SHA-256 hash so the literal string
// isn't in the repo, but anyone could still read this and sign in. Replace the
// whole block with real AWS Cognito auth before this matters. See README.
const VM_ACCOUNTS = [
  { email:'Admin', name:'Admin', role:'admin',
    passHash:'60fe74406e7f353ed979f350f2fbb6a2e8690a5fa7d1b0c32983d1d8b3f95f67' }, // Admin1234
];
async function sha256Hex(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
// Returns a user object on success, or null. Async because hashing is async.
async function verifyCredentials(email, password) {
  const acct = VM_ACCOUNTS.find(a => a.email.toLowerCase() === String(email).trim().toLowerCase());
  if (!acct) return null;
  if (await sha256Hex(password) !== acct.passHash) return null;
  return { email:acct.email, name:acct.name, role:acct.role };
}
const VM_SESSION_KEY = 'vm_session';
function loadSession() {
  try { return JSON.parse(localStorage.getItem(VM_SESSION_KEY)) || null; } catch { return null; }
}

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

  const openIt = () => { setOpen(true); setTimeout(() => inputRef.current && inputRef.current.focus(), 80); };
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

  const hasQ = q.trim().length > 0;
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
      {/* the bubble button → search bar */}
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

  // Mobile "download the app" CTA — always shown on mobile.
  const showAppCta = isMobile;

  const scrollTop = () => { window.scrollTo&&window.scrollTo(0,0); const main=document.getElementById('vm-main'); if(main) main.scrollTop=0; };
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
  // Back/forward buttons → sync state from the URL (no new history entry).
  useEffectApp(() => {
    const onPop = () => { const s = pathToState(window.location.pathname); setRoute(s.route); if (s.company) setCompany(s.company); syncTrail(s.route, s.company); scrollTop(); };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  // Keep the document title in step with the route.
  useEffectApp(() => { document.title = ROUTE_TITLES[route] || ROUTE_TITLES.front; }, [route]);

  // Session — restored from localStorage so a refresh keeps you signed in.
  // (Auto-admin testing bypass removed for safety — visitors start signed out and
  // must sign in to reach settings/portfolio/admin.)
  const [user, setUser] = useStateApp(loadSession);
  const signedIn = !!user;
  const signIn = async (email, password) => {            // returns true on success
    const u = await verifyCredentials(email, password);
    if (!u) return false;
    setUser(u);
    try { localStorage.setItem(VM_SESSION_KEY, JSON.stringify(u)); } catch {}
    return true;
  };
  const signOut = () => {
    setUser(null);
    try { localStorage.removeItem(VM_SESSION_KEY); } catch {}
    setAccountMode('personal');
    go('front');
  };

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
  const gatedFromPortfolio = false; // temporarily disabled — restore: route==='myportfolio' && !signedIn
  const gatedFromBusiness = route==='mybusiness' && !signedIn;   // My Business is signed-in only
  const gatedFromAdmin = route==='admin' && !isAdmin;            // signed-out → sign in; signed-in non-admin → home
  const effRoute = gatedFromPortfolio || gatedFromBusiness ? 'signin'
    : gatedFromAdmin ? (signedIn ? 'front' : 'signin')
    : (route==='signin' && signedIn) ? 'front'   // already signed in → never show the sign-in page (temporary)
    : route;

  // map rail ids to routes (rail uses 'screener' & 'supply' & 'history' & 'front')
  const railRoute = effRoute==='dashboard' ? 'screener' : effRoute;

  let screen;
  if(effRoute==='front') screen = <FrontPage go={go} isMobile={isMobile} />;
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

  return (
    <div key={'app-'+theme} style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden', background:VM.paperWarm }}>
      <GlobalHeader go={go} isMobile={isMobile} menuOpen={menuOpen} onToggleMenu={()=>setMenuOpen(o=>!o)} hideMenuButton={bare} />
      {bare ? (
        <main id="vm-main" style={{ flex:1, overflowY:'auto', minHeight:0, background:VM.paperWarm, paddingBottom: showAppCta ? 76 : 0 }}>
          {screen}
          <Footer />
        </main>
      ) : (
        <div style={{ flex:1, display:'flex', minHeight:0 }}>
          <Rail route={railRoute} go={go} mobile={isMobile} open={menuOpen} onClose={()=>setMenuOpen(false)} signedIn={signedIn} user={user} onSignOut={signOut} isAdmin={isAdmin} accountMode={accountMode} onModeChange={switchMode} />
          <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, minHeight:0 }}>
            <IndexStrip />
            <main id="vm-main" style={{ flex:1, overflowY:'auto', background:VM.paperWarm, paddingBottom: showAppCta ? 76 : 0 }}>
              {screen}
              <Footer />
            </main>
          </div>
        </div>
      )}
      {showAppCta && <MobileAppCta />}
      <AiAssistant isMobile={isMobile} bottom={showAppCta ? 86 : (isMobile ? 16 : 24)} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
