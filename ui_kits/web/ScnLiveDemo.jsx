// Veridian Markets — SCN Live Demo: interactive supply-chain dependency map.
// The "principle" company sits centre; inputs/dependencies on the left, customers/channels
// on the right, joined by curved SVG connectors. Hover a node for detail; click to set it as
// the new principle (drill down) with breadcrumb navigation. Filters narrow the left column.

const SCN_DB = {
  AAPL: {
    name:'Apple Inc.', ticker:'AAPL', meta:'NASDAQ · TECH · LARGE-CAP',
    inputs:[
      {id:'TSM',  name:'Taiwan Semiconductor', ticker:'TSM',     cat:'a', role:'Chip fabrication', note:'~90% of Apple silicon', risk:'Geopolitical'},
      {id:'FOXC', name:'Hon Hai / Foxconn',    ticker:'2317.TW', cat:'a', role:'Device assembly', note:'~70% of iPhones', risk:'Labour, China ops'},
      {id:'LPL',  name:'LG Display',           ticker:'LPL',     cat:'a', role:'OLED displays', note:'iPhone screens', risk:'Competitive margins'},
      {id:'SONY', name:'Sony Semiconductor',   ticker:'SONY',    cat:'a', role:'Image sensors', note:'~50% global sensor mkt', risk:'Supply concentration'},
      {id:'QCOM', name:'Qualcomm',             ticker:'QCOM',    cat:'a', role:'5G modems', note:'Apple building in-house', risk:'Transition risk'},
      {id:'MAERSK',name:'A.P. Møller-Mærsk',   ticker:'MAERSK',  cat:'b', role:'Global freight', note:'Ocean shipping', risk:'Port delays, rates'},
      {id:'XOM',  name:'ExxonMobil',           ticker:'XOM',     cat:'b', role:'Mfg energy costs', note:'Indirect dependency', risk:'Oil price volatility'},
      {id:'MP',   name:'MP Materials',         ticker:'MP',      cat:'b', role:'Rare earth magnets', note:'Motors & haptics', risk:'China supply chain'},
      {id:'ALB',  name:'Albemarle',            ticker:'ALB',     cat:'b', role:'Lithium supply', note:'Battery materials', risk:'EV demand competition'},
    ],
    customers:[
      {id:'TMUS', name:'T-Mobile',  ticker:'TMUS', role:'Carrier distribution', note:'~18% device revenue', risk:'Subsidy dependence'},
      {id:'VZ',   name:'Verizon',   ticker:'VZ',   role:'Carrier distribution', note:'~15% device revenue', risk:'Contract renewal'},
      {id:'T',    name:'AT&T',      ticker:'T',    role:'Carrier distribution', note:'~12% device revenue', risk:'Competition'},
      {id:'BBY',  name:'Best Buy',  ticker:'BBY',  role:'Electronics retail', note:'~30% of BBY revenue', risk:'Retail footprint'},
      {id:'COST', name:'Costco',    ticker:'COST', role:'Warehouse retail', note:'High-volume iPhone', risk:'Margin pressure'},
      {id:'AMZN', name:'Amazon',    ticker:'AMZN', role:'Marketplace + AWS', note:'Also cloud competitor', risk:'Dual-role tension'},
    ]
  },
  SONY: {
    name:'Sony Group Corp.', ticker:'SONY', meta:'NYSE · TECH · LARGE-CAP',
    inputs:[
      {id:'SUMCO', name:'SUMCO Corp',      ticker:'SUMCO', cat:'a', role:'Silicon wafers', note:'Key sensor substrate', risk:'Supply tightness'},
      {id:'ASML',  name:'ASML Holding',   ticker:'ASML',  cat:'a', role:'Lithography machines', note:'Critical for fab', risk:'Export controls'},
      {id:'TDK',   name:'TDK Corp',       ticker:'TDK',   cat:'a', role:'Electronic components', note:'Passives & sensors', risk:'Pricing cycles'},
      {id:'MP',    name:'Rare earth supply', ticker:'MP', cat:'b', role:'Rare earth materials', note:'Magnets & actuators', risk:'China dependency'},
      {id:'ENERGY',name:'Energy markets', ticker:'—',     cat:'b', role:'Fab energy costs', note:'Power-intensive process', risk:'Price volatility'},
    ],
    customers:[
      {id:'AAPL', name:'Apple Inc.',      ticker:'AAPL', role:'Image sensor buyer', note:'Largest single customer', risk:'Concentration risk'},
      {id:'SAMS', name:'Samsung',         ticker:'005930.KS', role:'Sensor + component buyer', note:'Smartphone cameras', risk:'Competitor dynamic'},
      {id:'PS',   name:'PlayStation',     ticker:'Internal', role:'Internal gaming division', note:'Console + peripherals', risk:'Gaming cycle'},
      {id:'NFLX', name:'Netflix',         ticker:'NFLX', role:'Content licensing', note:'Sony Pictures deals', risk:'Streaming wars'},
    ]
  },
  TSM: {
    name:'Taiwan Semiconductor', ticker:'TSM', meta:'NYSE · SEMI · LARGE-CAP',
    inputs:[
      {id:'ASML',  name:'ASML Holding',       ticker:'ASML', cat:'a', role:'EUV lithography', note:'Sole EUV supplier', risk:'Export controls'},
      {id:'AMAT',  name:'Applied Materials',  ticker:'AMAT', cat:'a', role:'Deposition tools', note:'Wafer processing', risk:'Lead times'},
      {id:'LRCX',  name:'Lam Research',       ticker:'LRCX', cat:'a', role:'Etch equipment', note:'Advanced nodes', risk:'Cyclicality'},
      {id:'UMC',   name:'UMC',                ticker:'UMC',  cat:'a', role:'Mature node overflow', note:'Capacity sharing', risk:'Competitor'},
      {id:'WATER', name:'Water supply',       ticker:'—',    cat:'b', role:'Fab operations', note:'Ultra-pure water', risk:'Taiwan drought risk'},
      {id:'PWR',   name:'Taiwan Power',       ticker:'—',    cat:'b', role:'Electricity supply', note:'Grid dependency', risk:'Stability concerns'},
    ],
    customers:[
      {id:'AAPL', name:'Apple Inc.', ticker:'AAPL', role:'Logic chip buyer', note:'~25% of TSM revenue', risk:'Largest concentration'},
      {id:'NVDA', name:'NVIDIA',     ticker:'NVDA', role:'GPU fabrication', note:'H100/B100 chips', risk:'AI demand swings'},
      {id:'AMD',  name:'AMD',        ticker:'AMD',  role:'CPU/GPU fabrication', note:'EPYC & Instinct', risk:'Intel competition'},
      {id:'QCOM', name:'Qualcomm',   ticker:'QCOM', role:'Modem fabrication', note:'Snapdragon chips', risk:'In-house threat'},
    ]
  },
  QCOM: {
    name:'Qualcomm Inc.', ticker:'QCOM', meta:'NASDAQ · SEMI · LARGE-CAP',
    inputs:[
      {id:'TSM', name:'Taiwan Semiconductor', ticker:'TSM', cat:'a', role:'Chip fabrication', note:'Fabless model', risk:'Geopolitical, capacity'},
      {id:'ARM', name:'ARM Holdings',  ticker:'ARM', cat:'a', role:'CPU architecture license', note:'Core IP dependency', risk:'Royalty model'},
      {id:'RF',  name:'RF suppliers',  ticker:'—',   cat:'b', role:'RF front-end components', note:'Antenna modules', risk:'Supply diversification'},
    ],
    customers:[
      {id:'SAMS', name:'Samsung',      ticker:'005930.KS', role:'Android flagship chips', note:'Snapdragon flagship', risk:'Exynos competition'},
      {id:'XIAO', name:'Xiaomi',       ticker:'1810.HK',   role:'Snapdragon devices', note:'Large volume', risk:'China market exposure'},
      {id:'AAPL', name:'Apple Inc.',   ticker:'AAPL', role:'5G modems (declining)', note:'Building in-house', risk:'Customer exit risk'},
      {id:'MSFT', name:'Microsoft',    ticker:'MSFT', role:'Copilot+ PC chips', note:'Snapdragon X Elite', risk:'New segment dependency'},
    ]
  },
  AMZN: {
    name:'Amazon.com Inc.', ticker:'AMZN', meta:'NASDAQ · TECH · MEGA-CAP',
    inputs:[
      {id:'UPS',  name:'UPS',            ticker:'UPS',  cat:'a', role:'Last-mile delivery', note:'Partial, declining share', risk:'Amazon building own fleet'},
      {id:'FDX',  name:'FedEx',          ticker:'FDX',  cat:'a', role:'Freight & express', note:'Supplements Amazon Logistics', risk:'Margin pressure'},
      {id:'MSFT', name:'Microsoft Azure',ticker:'MSFT', cat:'b', role:'Cloud competitor/partner', note:'Indirect via enterprise', risk:'AWS vs Azure battle'},
      {id:'TSM',  name:'Chip foundries', ticker:'TSM',  cat:'b', role:'Graviton chip fab', note:'Custom AWS silicon', risk:'Supply lead times'},
    ],
    customers:[
      {id:'SMB',  name:'SMB sellers',    ticker:'—',    role:'3P marketplace revenue', note:'~60% of units sold', risk:'Seller concentration'},
      {id:'NFLX', name:'Netflix',        ticker:'NFLX', role:'AWS cloud customer', note:'Largest AWS tenant', risk:'Competitive tension'},
      {id:'AAPL', name:'Apple Inc.',     ticker:'AAPL', role:'iCloud on AWS', note:'Hybrid arrangement', risk:'Strategic sensitivity'},
      {id:'META', name:'Meta Platforms', ticker:'META', role:'AWS infrastructure', note:'Partial cloud workloads', risk:'Multi-cloud hedging'},
    ]
  },
};

// Resolve a principle by key; build a generic placeholder for nodes without their own entry.
function scnGet(id) {
  if (SCN_DB[id]) return SCN_DB[id];
  for (const k in SCN_DB) {
    for (const n of [...SCN_DB[k].inputs, ...SCN_DB[k].customers]) {
      if (n.id === id || n.ticker === id) {
        if (SCN_DB[n.ticker]) return SCN_DB[n.ticker];
        return { name:n.name, ticker:n.ticker, meta:'MARKET · EQUITY', generic:true,
          inputs:[{id:'g1', name:'Upstream dependencies', ticker:'—', cat:'a', role:'Supply chain', note:'Data not yet loaded', risk:'—'}],
          customers:[{id:'g2', name:'End markets', ticker:'—', role:'Distribution channels', note:'Data not yet loaded', risk:'—'}] };
      }
    }
  }
  return SCN_DB.AAPL;
}

const SCN = { blue:'#185FA5', blueLine:'#378ADD', coral:'#C0563B', tealLine:'#1D9E75', cust:'#0F6E56' };

function ScnLiveDemo({ go, isMobile, initialTicker, compact }) {
  const [history, setHistory] = React.useState([initialTicker || 'AAPL']);
  const current = history[history.length - 1];
  const [filter, setFilter] = React.useState('all');     // all | companies | external | lens
  const [hovered, setHovered] = React.useState(null);
  const [paths, setPaths] = React.useState([]);
  const canvasRef = React.useRef(null);
  const principleRef = React.useRef(null);
  const nodeEls = React.useRef({});

  const data = scnGet(current);
  const inputs = data.inputs.filter(n =>
    filter === 'companies' ? n.cat === 'a' :
    filter === 'external'  ? n.cat === 'b' : true);
  const customers = data.customers;

  const measure = React.useCallback(() => {
    const canvas = canvasRef.current, p = principleRef.current;
    if (!canvas || !p) return;
    const cr = canvas.getBoundingClientRect();
    const ctr = el => { const r = el.getBoundingClientRect(); return { x: r.left - cr.left + r.width/2, y: r.top - cr.top + r.height/2 }; };
    const pc = ctr(p);
    const out = [];
    inputs.forEach(n => {
      const el = nodeEls.current[n.id]; if (!el) return;
      const c = ctr(el); const mid = (c.x + pc.x) / 2;
      out.push({ id:n.id, side:'in', cat:n.cat, d:`M${c.x},${c.y} C${mid},${c.y} ${mid},${pc.y} ${pc.x-78},${pc.y}` });
    });
    customers.forEach(n => {
      const el = nodeEls.current[n.id]; if (!el) return;
      const c = ctr(el); const mid = (c.x + pc.x) / 2;
      out.push({ id:n.id, side:'out', d:`M${pc.x+78},${pc.y} C${mid},${pc.y} ${mid},${c.y} ${c.x},${c.y}` });
    });
    setPaths(out);
  });

  React.useLayoutEffect(() => { nodeEls.current = {}; }, [current]);
  React.useLayoutEffect(() => { const id = requestAnimationFrame(measure); return () => cancelAnimationFrame(id); }, [current, filter, isMobile]);
  React.useEffect(() => {
    const on = () => measure();
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  });

  const drill = (n) => {
    const key = SCN_DB[n.ticker] ? n.ticker : n.id;
    if (history[history.length - 1] === key) return;
    setHistory(h => [...h, key]);
    setHovered(null);
  };
  const jumpTo = (i) => { setHistory(h => h.slice(0, i + 1)); setHovered(null); };

  const tab = (id, label) => (
    <button key={id} onClick={()=>setFilter(id)}
      style={{ fontFamily:VM.mono, fontSize:10, letterSpacing:'0.04em', textTransform:'uppercase',
        padding:'6px 13px', borderRadius:999, cursor:'pointer', whiteSpace:'nowrap',
        border:`1px solid ${filter===id ? VM.forest : VM.border}`,
        background: filter===id ? VM.forest : VM.paper, color: filter===id ? VM.paper : VM.ink2,
        transition:'background .15s ease, border-color .15s ease' }}>{label}</button>
  );

  const node = (n, side) => {
    const isExt = n.cat === 'b';
    const accent = side === 'right' ? SCN.cust : (isExt ? SCN.coral : SCN.blue);
    const hl = hovered === n.id;
    const edge = side === 'right' ? { borderRight:`3px solid ${accent}` } : { borderLeft:`3px solid ${accent}` };
    const ttSide = side === 'right' ? { right:'calc(100% + 10px)' } : { left:'calc(100% + 10px)' };
    return (
      <div key={n.id} ref={el => { if (el) nodeEls.current[n.id] = el; }}
        onMouseEnter={()=>setHovered(n.id)} onMouseLeave={()=>setHovered(h => h===n.id ? null : h)}
        onClick={()=>drill(n)}
        style={{ position:'relative', padding:'7px 11px', background: hl ? VM.paperWarm : VM.paper,
          border:`1px solid ${VM.border}`, ...edge, cursor:'pointer', zIndex: hl ? 5 : 2,
          textAlign: side === 'right' ? 'right' : 'left',
          transform: hl ? `scale(1.05) translateX(${side==='right' ? -4 : 4}px)` : 'none',
          boxShadow: hl ? '0 6px 16px rgba(31,29,26,0.12)' : 'none',
          transition:'transform .18s cubic-bezier(.34,1.56,.64,1), background .15s ease, box-shadow .15s ease' }}>
        <div style={{ fontFamily:VM.mono, fontSize:12, fontWeight:600, color:VM.ink }}>
          {n.ticker} <span style={{ fontSize:9, color:VM.ink3, fontWeight:400 }}>· {n.role.split(' ')[0].toLowerCase()}</span>
        </div>
        <div style={{ fontFamily:VM.serif, fontSize:10.5, color:VM.ink3, marginTop:1 }}>{n.name}</div>
        {hl && (
          <div style={{ position:'absolute', top:'50%', transform:'translateY(-50%)', ...ttSide,
            width:172, zIndex:20, background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:8,
            padding:'9px 11px', fontSize:11, color:VM.ink, lineHeight:1.5, textAlign:'left',
            boxShadow:'0 10px 28px rgba(31,29,26,0.16)' }}>
            <div style={{ fontFamily:VM.serif, fontWeight:700, fontSize:12, marginBottom:4 }}>{n.ticker} — {n.role}</div>
            {n.note && <div style={{ display:'flex', justifyContent:'space-between', gap:8 }}><span style={{ color:VM.ink3 }}>Detail</span><span style={{ fontWeight:500, textAlign:'right' }}>{n.note}</span></div>}
            {n.risk && <div style={{ display:'flex', justifyContent:'space-between', gap:8 }}><span style={{ color:VM.ink3 }}>Risk</span><span style={{ fontWeight:500, textAlign:'right' }}>{n.risk}</span></div>}
            <div style={{ marginTop:6, paddingTop:6, borderTop:`1px solid ${VM.border}`, fontSize:10, color:SCN.blue, fontStyle:'italic' }}>click to set as principle →</div>
          </div>
        )}
      </div>
    );
  };

  const companyInputs = inputs.filter(n => n.cat === 'a');
  const extInputs = inputs.filter(n => n.cat === 'b');
  const colW = 196;

  return (
    <div style={{ padding: compact ? '0' : (isMobile ? '14px 16px 48px' : '26px 32px 60px'), maxWidth:1180, margin:'0 auto' }}>
      {!compact && <>
        <Mono size={11} color={VM.ink3} style={{ letterSpacing:'0.04em' }}>Explore  ›  <b style={{color:VM.ink}}>Supply chain network</b></Mono>
        <div style={{ marginTop:14 }}><Kicker>SUPPLY CHAIN NETWORK · DEPENDENCY MAP</Kicker></div>
        <h1 style={{ fontFamily:VM.serif, fontWeight:700, fontSize: isMobile ? 28 : 38, margin:'8px 0 6px' }}>The dependency map.</h1>
        <p style={{ fontFamily:VM.serif, fontSize:16, color:VM.ink3, margin:'0 0 18px', maxWidth:640 }}>
          Every public company sits between who it <i>depends on</i> and who <i>depends on it</i>. Hover any node for detail; click to set it as the principle and trace the chain.
        </p>
      </>}

      {/* breadcrumb (drill trail) */}
      <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:14, minHeight:26 }}>
        {history.map((id, i) => {
          const last = i === history.length - 1;
          const tk = (SCN_DB[id] && SCN_DB[id].ticker) || id;
          return (
            <React.Fragment key={i}>
              <span onClick={()=> last ? null : jumpTo(i)}
                style={{ fontFamily:VM.mono, fontSize:11.5, padding:'3px 9px', borderRadius:5,
                  border:`1px solid ${VM.border}`, background: last ? VM.paperDeep : VM.paper,
                  color: last ? VM.ink : VM.ink3, fontWeight: last ? 600 : 400, cursor: last ? 'default' : 'pointer' }}>{tk}</span>
              {!last && <span style={{ fontSize:11, color:VM.faint }}>›</span>}
            </React.Fragment>
          );
        })}
      </div>

      {/* filters */}
      <div style={{ display:'flex', alignItems:'center', gap:7, flexWrap:'wrap', marginBottom:6 }}>
        <Label style={{ marginRight:2 }}>Filters:</Label>
        {tab('all','All')}{tab('companies','Companies')}{tab('external','External')}{tab('lens','5Y Lens')}
      </div>
      {filter === 'lens' && (
        <div style={{ fontFamily:VM.serif, fontSize:12.5, color:VM.terra, fontStyle:'italic', margin:'8px 0 0' }}>
          5-year analogue lens — historical overlay in development.
        </div>
      )}

      {/* canvas */}
      <div ref={canvasRef} style={{ position:'relative', height: isMobile ? 560 : 500, minWidth:640, marginTop:14,
        background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:14, overflow:'hidden' }}>
        <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:0 }}>
          <defs>
            {[['scn-blue', SCN.blueLine], ['scn-coral', SCN.coral], ['scn-teal', SCN.tealLine]].map(([mid, c]) => (
              <marker key={mid} id={mid} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill={c} />
              </marker>
            ))}
          </defs>
          {paths.map(p => {
            const hl = hovered === p.id;
            const color = p.side === 'out' ? SCN.tealLine : (p.cat === 'b' ? SCN.coral : SCN.blueLine);
            const marker = p.side === 'out' ? 'url(#scn-teal)' : (p.cat === 'b' ? 'url(#scn-coral)' : 'url(#scn-blue)');
            return <path key={p.id} d={p.d} stroke={color} strokeWidth={hl ? 2.5 : 1} fill="none" opacity={hl ? 0.9 : 0.3} markerEnd={marker} />;
          })}
        </svg>

        {/* left column — inputs / dependencies */}
        <div style={{ position:'absolute', top:0, left:18, width:colW, height:'100%', display:'flex', flexDirection:'column', justifyContent:'center', gap:8 }}>
          <div style={{ fontFamily:VM.mono, fontSize:9, color:VM.ink3, letterSpacing:'0.5px', textTransform:'uppercase' }}>Inputs · dependencies</div>
          {companyInputs.length > 0 && <div style={{ fontFamily:VM.mono, fontSize:8, color:VM.faint, textTransform:'uppercase', opacity:.8 }}>companies</div>}
          {companyInputs.map(n => node(n, 'left'))}
          {extInputs.length > 0 && <div style={{ fontFamily:VM.mono, fontSize:8, color:VM.faint, textTransform:'uppercase', opacity:.8, marginTop:4 }}>external</div>}
          {extInputs.map(n => node(n, 'left'))}
        </div>

        {/* centre — the principle */}
        <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div ref={principleRef} style={{ width:152, height:152, borderRadius:13, background:VM.forest,
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:14, zIndex:2 }}>
            <div style={{ fontFamily:VM.mono, fontSize:8, color:'#9FE1CB', letterSpacing:'1px', textTransform:'uppercase', marginBottom:5 }}>{data.meta}</div>
            <div style={{ fontFamily:VM.serif, fontSize:19, fontWeight:600, color:'#E1F5EE', lineHeight:1.2 }}>{data.name}</div>
            <div style={{ fontFamily:VM.mono, fontSize:9, color:'#5DCAA5', marginTop:4 }}>{data.ticker} · the principle</div>
          </div>
        </div>

        {/* right column — customers / channels */}
        <div style={{ position:'absolute', top:0, right:18, width:colW, height:'100%', display:'flex', flexDirection:'column', justifyContent:'center', gap:8 }}>
          <div style={{ fontFamily:VM.mono, fontSize:9, color:VM.ink3, letterSpacing:'0.5px', textTransform:'uppercase', textAlign:'right' }}>Customers · channels</div>
          {customers.map(n => node(n, 'right'))}
        </div>
      </div>

      {/* legend */}
      <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginTop:10 }}>
        {[['Company (direct)', { borderLeft:`3px solid ${SCN.blue}`, background:VM.paper }],
          ['External factor', { borderLeft:`3px solid ${SCN.coral}`, background:VM.paper }],
          ['The principle', { background:VM.forest, borderRadius:3 }],
          ['Customer / channel', { borderRight:`3px solid ${SCN.cust}`, background:VM.paper }]].map(([lbl, sw]) => (
          <div key={lbl} style={{ display:'flex', alignItems:'center', gap:6, fontFamily:VM.serif, fontSize:11, color:VM.ink3 }}>
            <span style={{ width:11, height:11, border:`1px solid ${VM.border}`, ...sw }}></span>{lbl}
          </div>
        ))}
        <span style={{ marginLeft:'auto', fontFamily:VM.mono, fontSize:9.5, color:VM.faint }}>stroke = dependency strength · colour = relationship</span>
      </div>
    </div>
  );
}

Object.assign(window, { ScnLiveDemo });
