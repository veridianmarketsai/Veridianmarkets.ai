// Veridian Markets — Supply chain network ("the principle").

const SC_STEPS = [
  { sel:'[data-tour="vm-sc-intro"]',
    title:'The supply chain in one view.',
    body:'This tab maps the full chain: who a company depends on (inputs, left), the company itself (principle, centre), and who it sells to (customers, right). Read it left to right like a flow of value.' },
  { sel:'[data-tour="vm-sc-legend"]',
    title:'Reading the nodes.',
    body:'Blue border = direct company supplier. Dashed terra border = external macro factor (oil, FX, shipping). Green = the principle. Blue fill = customer or channel. Stroke width signals dependency strength — thicker means more critical.' },
  { sel:'[data-tour="vm-sc-filters"]',
    title:'Filter what you see.',
    body:'Switch between All, Companies only, External factors only, or the 5Y Lens which overlays historical stress events on the network. Useful for isolating geopolitical exposure or macro sensitivity.' },
  { sel:'[data-tour="vm-sc-network"]',
    title:'The network diagram.',
    body:'Bezier curves connect each node to the principle. Click any node to explore that company or factor in detail. The curve routing groups inputs on the left and customers on the right so you can trace a single relationship end-to-end.' },
  { sel:'[data-tour="vm-sc-competitors"]',
    title:'Competitors — same wallet.',
    body:'These companies compete for the same customer spend. They often share overlapping supply chains too, meaning a disruption upstream hits all of them. Use this section to think about relative exposure.' },
  { sel:'[data-tour="vm-sc-summary"]',
    title:'Chain summary.',
    body:'A plain-English read on what the structure implies — concentration risk, customer diversity, and the historical analogue match. The tags at the bottom are the dimensions scored behind the scenes.' },
];

function SupplyChain({ company, go }) {
  const [tutorialOpen, setTutorialOpen] = React.useState(false);
  const c = company || VM_COMPANIES[0];
  const inputs = c.inputs || VM_COMPANIES[0].inputs;
  const external = c.external || VM_COMPANIES[0].external;
  const customers = c.customers || VM_COMPANIES[0].customers;
  const competitors = c.competitors || VM_COMPANIES[0].competitors;
  const allInputs = [...inputs.map(x=>({...x,ext:false})), ...external.map(x=>({...x,ext:true}))];
  const shortName = c.name.split(' ')[0];

  // fixed network geometry (so SVG connectors land exactly)
  const NW = 860, ROW = 44, NODE_W = 172, PR = 150;
  const rows = Math.max(allInputs.length, customers.length);
  const NH = Math.max(380, rows*ROW + 36);
  const cy = NH/2;
  const prL = NW/2 - PR/2, prR = NW/2 + PR/2;
  const yFor = (n,i) => (NH - n*ROW)/2 + ROW/2 + i*ROW;

  const tutBtn = {
    display:'inline-flex', alignItems:'center', gap:6, fontFamily:VM.mono, fontSize:10,
    letterSpacing:'0.04em', textTransform:'uppercase', padding:'4px 11px', borderRadius:5,
    border:`1px solid ${VM.terra}`, background:'transparent', color:VM.terra, cursor:'pointer',
  };

  return (
    <div style={{ padding:'22px 32px 60px', maxWidth:1180, margin:'0 auto' }}>
      <CompanyHead c={c} tab="Supply chain" go={go} />
      <div data-tour="vm-sc-intro" style={{ marginTop:18 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
          <div>
            <Mono size={11} color={VM.terra} weight={700} style={{letterSpacing:'0.1em'}}>HERO · INPUTS → PRINCIPLE → CUSTOMERS</Mono>
            <h1 style={{ fontFamily:VM.serif, fontWeight:700, fontSize:34, margin:'8px 0 6px', textWrap:'balance' }}>Who {shortName} buys from — and who they sell to.</h1>
            <p style={{ fontFamily:VM.serif, fontSize:15, color:VM.ink3, margin:'0 0 16px' }}>Click any node to open that side of the chain. Toggle external factors to see fragility from oil, FX, and shipping.</p>
          </div>
          <button onClick={()=>setTutorialOpen(true)} title="Interactive tutorial — learn this tab" style={{...tutBtn, flexShrink:0, marginTop:8}}>
            <i className="ti ti-graduation-cap" style={{ fontSize:12 }}></i>Tutorial
          </button>
        </div>
      </div>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12, marginBottom:14 }}>
        <div data-tour="vm-sc-legend" style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
          <Leg swatch={<span style={{width:14,height:14,border:`1px solid ${VM.border}`,borderLeft:'3px solid #185FA5',display:'inline-block',background:VM.paper}}/>}>Company (direct)</Leg>
          <Leg swatch={<span style={{width:14,height:14,border:`1.4px dashed ${VM.terra}`,display:'inline-block'}}/>}>External factor</Leg>
          <Leg swatch={<span style={{width:14,height:14,background:VM.forest,borderRadius:3,display:'inline-block'}}/>}>The principle</Leg>
          <Leg swatch={<span style={{width:14,height:14,border:`1px solid #B5D4F4`,background:'#E6F1FB',display:'inline-block'}}/>}>Customer / channel</Leg>
        </div>
        <div data-tour="vm-sc-filters" style={{ display:'flex', gap:6, alignItems:'center' }}>
          <Label>Filters:</Label>
          {['All','Companies','External','5Y Lens'].map((f,i)=>(<Pill key={f} active={i===0}>{f}</Pill>))}
        </div>
      </div>

      <div data-tour="vm-sc-network" style={{ background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:14, padding:'24px 20px', overflowX:'auto' }}>
        <div style={{ position:'relative', width:NW, height:NH, margin:'0 auto' }}>
          <svg style={{ position:'absolute', inset:0, pointerEvents:'none' }} width={NW} height={NH} viewBox={`0 0 ${NW} ${NH}`}>
            {allInputs.map((n,i)=>{
              const y=yFor(allInputs.length,i);
              const col = n.ext?VM.terra:'#185FA5';
              return <path key={'l'+i} d={`M ${NODE_W+8} ${y} C ${prL-70} ${y} ${prL-50} ${cy} ${prL} ${cy}`} fill="none" stroke={col} strokeWidth={i===0?2.2:1.4} strokeDasharray="4 4" opacity="0.8" />;
            })}
            {customers.map((n,i)=>{
              const y=yFor(customers.length,i);
              return <path key={'r'+i} d={`M ${prR} ${cy} C ${prR+50} ${cy} ${NW-NODE_W-50} ${y} ${NW-NODE_W-8} ${y}`} fill="none" stroke="#0C447C" strokeWidth={i===0?2:1.4} strokeDasharray="4 4" opacity="0.75" />;
            })}
          </svg>
          <Mono size={10} color={VM.ink3} weight={700} style={{ position:'absolute', left:0, top:-2 }}>01 · INPUTS · DEPENDENCIES</Mono>
          <Mono size={10} color={VM.teal} weight={700} style={{ position:'absolute', left:'50%', top:-2, transform:'translateX(-50%)' }}>02 · PRINCIPLE</Mono>
          <Mono size={10} color={VM.ink3} weight={700} style={{ position:'absolute', right:0, top:-2 }}>03 · CUSTOMERS</Mono>
          {allInputs.map((n,i)=>{
            const y=yFor(allInputs.length,i);
            return <div key={n.t} style={{ position:'absolute', left:8, top:y-15, zIndex:1 }}><BigNode kind={n.ext?'external':'input'} t={n.t} d={n.d} /></div>;
          })}
          {customers.map((n,i)=>{
            const y=yFor(customers.length,i);
            return <div key={n.t} style={{ position:'absolute', right:8, top:y-15, zIndex:1 }}><BigNode kind="customer" t={n.t} d={n.d} /></div>;
          })}
          <div style={{ position:'absolute', left:prL, top:cy-PR/2, width:PR, height:PR, background:VM.forest, borderRadius:14, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', boxShadow:'0 8px 24px -10px rgba(31,29,26,0.45)', padding:14, zIndex:2 }}>
            <span style={{ fontFamily:VM.mono, fontSize:8, letterSpacing:'0.1em', color:'#9FE1CB' }}>NYSE · TECH · LARGE-CAP</span>
            <span style={{ fontFamily:VM.serif, fontWeight:700, fontSize:30, color:VM.tealTint, margin:'6px 0 2px' }}>{c.ticker}</span>
            <span style={{ fontFamily:VM.serif, fontSize:11, color:'#9FE1CB' }}>The principle · {c.ticker}</span>
          </div>
        </div>
        <div style={{ textAlign:'center', marginTop:8 }}><Mono size={10} color={VM.ink3} style={{fontStyle:'italic'}}>← stroke width = dependency strength · color = relationship</Mono></div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1.4fr', gap:24, marginTop:24 }}>
        <div data-tour="vm-sc-competitors">
          <Mono size={10} color={VM.terra} weight={700} style={{display:'block',marginBottom:10}}>COMPETITORS · SAME WALLET SHARE</Mono>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {competitors.map(n=>(<div key={n.t} style={{ padding:'7px 12px', border:`1.2px dotted ${VM.border}`, borderRadius:6 }}>
              <Mono size={11} weight={700}>{n.t}</Mono><div><Label>{n.d}</Label></div></div>))}
          </div>
        </div>
        <div data-tour="vm-sc-summary">
          <Mono size={10} color={VM.ink3} weight={700} style={{display:'block',marginBottom:8}}>SUMMARY · WHAT THIS CHAIN TELLS US</Mono>
          <h3 style={{ fontFamily:VM.serif, fontWeight:700, fontSize:18, margin:'0 0 8px' }}>What this chain tells us</h3>
          <p style={{ fontFamily:VM.serif, fontSize:14.5, lineHeight:1.5, color:VM.ink2, margin:0 }}>
            {shortName}'s revenue is unusually <b>consumer-direct</b> compared to its peers (~70% sold to end users, not channel partners), which is why retail margin is so high. But on the supply side it is <b>concentrated</b> in Taiwan (TSMC chips), China assembly (Foxconn), and rare-earth supply (~85% from one country).
          </p>
          <div style={{ display:'flex', gap:14, flexWrap:'wrap', marginTop:12 }}>
            {['SUPPLIER CONCENTRATION','CUSTOMER DIVERSITY','5Y ANALOGUE MATCH','EXTERNAL FRAGILITY'].map(t=> <Mono key={t} size={9} color={VM.ink3}>{t}</Mono>)}
          </div>
        </div>
      </div>

      {tutorialOpen && <TutorialOverlay steps={SC_STEPS} label="Supply chain tutorial" onClose={()=>setTutorialOpen(false)} />}
    </div>
  );
}

function Leg({ swatch, children }) {
  return <span style={{ display:'flex', alignItems:'center', gap:6, fontFamily:VM.serif, fontSize:12, color:VM.ink2 }}>{swatch}{children}</span>;
}
function BigNode({ kind, t, d }) {
  if(kind==='customer') return (
    <div style={{ width:172, padding:'8px 12px', borderRadius:'7px 0 0 7px', border:`1px solid #B5D4F4`, borderRight:'3px solid #0C447C', background:'#E6F1FB', display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
      <Mono size={12} weight={700} color="#0C447C">{t}</Mono><span style={{ fontFamily:VM.mono, fontSize:8.5, color:'#0C447C', opacity:0.7 }}>{d}</span></div>);
  const ext = kind==='external';
  return (
    <div style={{ width:172, padding:'8px 12px', borderRadius:'0 7px 7px 0', border:`1px solid ${VM.border}`, borderLeft:`3px ${ext?'dashed':'solid'} ${ext?VM.terra:'#185FA5'}`, background:VM.paper, display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
      <Mono size={12} weight={700} color={ext?VM.rustDeep:VM.ink}>{t}</Mono><span style={{ fontFamily:VM.mono, fontSize:8.5, color:VM.ink3 }}>{d}</span></div>);
}

Object.assign(window, { SupplyChain });
