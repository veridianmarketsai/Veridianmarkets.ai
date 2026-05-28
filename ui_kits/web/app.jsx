// Veridian Memoir — app shell + simple router.
const { useState: useStateApp } = React;

function App() {
  const [route, setRoute] = useStateApp('front');     // front | screener | supply | dashboard | history | memoir
  const [company, setCompany] = useStateApp(VM_COMPANIES[0]);
  const go = (r, c) => { if(c) setCompany(c); setRoute(r); window.scrollTo&&window.scrollTo(0,0);
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

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:VM.paperWarm }}>
      <Rail route={railRoute} go={go} />
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        <IndexStrip />
        <main id="vm-main" style={{ flex:1, overflowY:'auto', background:VM.paperWarm }}>
          {screen}
          <Footer />
        </main>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
