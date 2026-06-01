// Veridian Markets — app shell + URL router (History API).
const { useState: useStateApp, useEffect: useEffectApp } = React;

// ── Routing ────────────────────────────────────────────────────────────────
// Each Toolbar Menu page gets its own clean URL. The company dashboard is
// /company/<ticker>. Everything is served from the site root (see index.html +
// 404.html for the GitHub Pages SPA deep-link handling).
const ROUTE_PATHS = {
  front:       '/',
  signin:      '/sign-in',
  myportfolio: '/portfolio',
  supply:      '/supply-chain',
  screener:    '/search',
  history:     '/history',
  learn:       '/learn',
  memoir:      '/memoir',
  admin:       '/admin',
  settings:    '/settings',
};
const PATH_ROUTES = Object.fromEntries(Object.entries(ROUTE_PATHS).map(([r, p]) => [p, r]));
const ROUTE_TITLES = {
  front:'Veridian Markets · history-led finance', signin:'Sign in · Veridian Markets',
  myportfolio:'My portfolio · Veridian Markets', supply:'Supply chain network · Veridian Markets',
  screener:'Search · Veridian Markets', history:'History · Veridian Markets',
  learn:'Learn · Veridian Markets', memoir:'Read memoir · Veridian Markets',
  admin:'Admin · Veridian Markets', settings:'Settings · Veridian Markets', dashboard:'Veridian Markets',
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
  { email:'veridianmarkets.ai@gmail.com', name:'Admin', role:'admin',
    passHash:'0b63006babadddf7c11b2cb9ec1d614931b2ed266413717b7b7dc601d0bda2fa' }, // VDMAI123
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

function App() {
  // Seed route + company from the current URL so deep links / refreshes land on
  // the right page (front | screener | supply | dashboard | history | memoir |
  // learn | signin | myportfolio).
  const initial = pathToState(window.location.pathname);
  const [route, setRoute] = useStateApp(initial.route);
  const [company, setCompany] = useStateApp(initial.company || VM_COMPANIES[0]);
  const [menuOpen, setMenuOpen] = useStateApp(false);
  const isMobile = useIsMobile(768);
  useEffectApp(()=>{ if(!isMobile) setMenuOpen(false); }, [isMobile]);

  const scrollTop = () => { window.scrollTo&&window.scrollTo(0,0); const main=document.getElementById('vm-main'); if(main) main.scrollTop=0; };
  // Navigate: update state AND push a real URL so every page is linkable.
  const go = (r, c) => {
    const nextCompany = c || company;
    if (c) setCompany(c);
    setRoute(r); setMenuOpen(false);
    const path = stateToPath(r, nextCompany);
    if (path !== window.location.pathname) window.history.pushState({}, '', path);
    scrollTop();
  };
  // Back/forward buttons → sync state from the URL (no new history entry).
  useEffectApp(() => {
    const onPop = () => { const s = pathToState(window.location.pathname); setRoute(s.route); if (s.company) setCompany(s.company); scrollTop(); };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  // Keep the document title in step with the route.
  useEffectApp(() => { document.title = ROUTE_TITLES[route] || ROUTE_TITLES.front; }, [route]);

  // Session — restored from localStorage so a refresh keeps you signed in.
  // TEMPORARY (testing): auto sign-in as the admin when nothing is stored, so
  // logged-in features (settings, portfolio, admin) are reachable without the
  // sign-in flow. To restore the real gate: const [user, setUser] = useStateApp(loadSession);
  const DEV_ADMIN_USER = { name:'Admin', email:'veridianmarkets.ai@gmail.com', role:'admin', tier:'Business' };
  const [user, setUser] = useStateApp(() => loadSession() || DEV_ADMIN_USER);
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
    go('front');
  };

  // Protected routes. Portfolio sign-in guard is temporarily disabled (laptop:
  // learn-1.14 "sign-in guard bypass"); Admin still needs the admin role.
  const isAdmin = !!(user && user.role === 'admin');
  const gatedFromPortfolio = false; // temporarily disabled — restore: route==='myportfolio' && !signedIn
  const gatedFromAdmin = route==='admin' && !isAdmin;            // signed-out → sign in; signed-in non-admin → home
  const effRoute = gatedFromPortfolio ? 'signin'
    : gatedFromAdmin ? (signedIn ? 'front' : 'signin')
    : (route==='signin' && signedIn) ? 'front'   // already signed in → never show the sign-in page (temporary)
    : route;

  // map rail ids to routes (rail uses 'screener' & 'supply' & 'history' & 'front')
  const railRoute = effRoute==='dashboard' ? 'screener' : effRoute;

  let screen;
  if(effRoute==='front') screen = <FrontPage go={go} isMobile={isMobile} />;
  else if(effRoute==='screener') screen = <Screener go={go} />;
  else if(effRoute==='supply') screen = <ScnLiveDemo go={go} isMobile={isMobile} />;
  else if(effRoute==='dashboard') screen = <Dashboard company={company} go={go} />;
  else if(effRoute==='history') screen = <History go={go} isMobile={isMobile} />;
  else if(effRoute==='memoir') screen = <Memoir go={go} />;
  else if(effRoute==='learn') screen = <Learn go={go} isMobile={isMobile} />;
  else if(effRoute==='myportfolio') screen = <MyPortfolio go={go} user={user} isMobile={isMobile} />;
  else if(effRoute==='admin') screen = <AdminPanel go={go} user={user} />;
  else if(effRoute==='settings') screen = <AccountSettings go={go} user={user} onSignOut={signOut} isMobile={isMobile} />;
  else if(effRoute==='signin') screen = <SignIn go={go} signIn={signIn} redirectTo={gatedFromAdmin ? 'admin' : 'myportfolio'} />;

  const bare = effRoute==='signin';   // chromeless: green header + footer only (no rail / ticker)

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden', background:VM.paperWarm }}>
      <GlobalHeader go={go} isMobile={isMobile} menuOpen={menuOpen} onToggleMenu={()=>setMenuOpen(o=>!o)} hideMenuButton={bare} />
      {bare ? (
        <main id="vm-main" style={{ flex:1, overflowY:'auto', minHeight:0, background:VM.paperWarm }}>
          {screen}
          <Footer />
        </main>
      ) : (
        <div style={{ flex:1, display:'flex', minHeight:0 }}>
          <Rail route={railRoute} go={go} mobile={isMobile} open={menuOpen} onClose={()=>setMenuOpen(false)} signedIn={signedIn} user={user} onSignOut={signOut} isAdmin={isAdmin} />
          <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, minHeight:0 }}>
            {/* Ticker runs along the very top of every page, just under the green header. */}
            <IndexStrip />
            <main id="vm-main" style={{ flex:1, overflowY:'auto', background:VM.paperWarm }}>
              {screen}
              <Footer />
            </main>
          </div>
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
