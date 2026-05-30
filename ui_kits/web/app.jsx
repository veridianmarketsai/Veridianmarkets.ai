// Veridian Markets — app shell + simple router.
const { useState: useStateApp, useEffect: useEffectApp } = React;

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
  const [route, setRoute] = useStateApp('front');     // front | screener | supply | dashboard | history | memoir | learn
  const [company, setCompany] = useStateApp(VM_COMPANIES[0]);
  const [menuOpen, setMenuOpen] = useStateApp(false);
  const isMobile = useIsMobile(768);
  useEffectApp(()=>{ if(!isMobile) setMenuOpen(false); }, [isMobile]);
  const go = (r, c) => { if(c) setCompany(c); setRoute(r); setMenuOpen(false); window.scrollTo&&window.scrollTo(0,0);
    const main = document.getElementById('vm-main'); if(main) main.scrollTop=0; };

  // map rail ids to routes (rail uses 'screener' & 'supply' & 'history' & 'front')
  const railRoute = route==='dashboard' ? 'screener' : route;

  let screen;
  if(route==='front') screen = <FrontPage go={go} />;
  else if(route==='screener') screen = <Screener go={go} />;
  else if(route==='supply') screen = <SupplyChain company={company} go={go} />;
  else if(route==='dashboard') screen = <Dashboard company={company} go={go} />;
  else if(route==='history') screen = <History company={company} go={go} />;
  else if(route==='memoir') screen = <Memoir go={go} />;
  else if(route==='learn') screen = <Learn go={go} />;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden', background:VM.paperWarm }}>
      <GlobalHeader go={go} isMobile={isMobile} menuOpen={menuOpen} onToggleMenu={()=>setMenuOpen(o=>!o)} />
      <div style={{ flex:1, display:'flex', minHeight:0 }}>
        <Rail route={railRoute} go={go} mobile={isMobile} open={menuOpen} onClose={()=>setMenuOpen(false)} />
        <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, minHeight:0 }}>
          <IndexStrip />
          <main id="vm-main" style={{ flex:1, overflowY:'auto', background:VM.paperWarm }}>
            {screen}
            <Footer />
          </main>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
