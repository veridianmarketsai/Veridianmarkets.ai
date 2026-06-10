// Veridian Markets — SCN Live Demo: interactive supply-chain dependency map.
// The "principle" company sits centre; inputs/dependencies on the left, customers/channels
// on the right, joined by curved SVG connectors. Hover a node for detail; click to set it as
// the new principle (drill down) with breadcrumb navigation. Filters narrow the left column.

// ── Supply-chain taxonomy (DB-ready reference tables) ────────────────────────
// Every node carries a `group`. Suppliers/inputs use SCN_SUP_GROUPS; customers
// use SCN_CUST_GROUPS. The group is RELATIONSHIP-specific (lives on the edge, not
// the company) — the same firm can be a 'company' supplier to one principal and a
// 'materials' supplier to another — so it's stored per relationship.
//
// Eventual database shape:
//   companies(ticker PK, name, meta)
//   node_groups(id PK, side ['supplier'|'customer'], label)        ← the arrays below
//   relationships(principal_ticker FK, node_ticker, direction ['in'|'out'],
//                 group FK→node_groups, role, note, risk)
//
// `cat` is kept as a derived convenience for the canvas/filters: 'a' = company
// (direct), 'b' = everything else (external). Rule: cat = group==='company'?'a':'b'.
const SCN_SUP_GROUPS = [
  { id:'company',       label:'Companies',     desc:'Direct strategic suppliers' },
  { id:'manufacturing', label:'Manufacturing', desc:'Assembly, logistics, freight' },
  { id:'commodity',     label:'Commodity',     desc:'Energy, power, fuel, water' },
  { id:'materials',     label:'Materials',     desc:'Raw materials — silicon, rare earth, lithium' },
];
const SCN_CUST_GROUPS = [
  { id:'mobile_carrier',     label:'Mobile carriers' },
  { id:'electronics_retail', label:'Electronics retail' },
  { id:'warehouse_club',     label:'Warehouse clubs' },
  { id:'online_reseller',    label:'Online resellers' },
  { id:'distributor',        label:'Distributors' },
  { id:'oem_buyer',          label:'OEM · component buyers' },
  { id:'cloud',              label:'Cloud customers' },
  { id:'content',            label:'Content & licensing' },
  { id:'internal',           label:'Internal divisions' },
];

const SCN_DB = {
  AAPL: {
    name:'Apple Inc.', ticker:'AAPL', meta:'NASDAQ · TECH · LARGE-CAP',
    inputs:[
      {id:'TSM',  name:'Taiwan Semiconductor', ticker:'TSM',     group:'company',       cat:'a', role:'Chip fabrication', note:'~90% of Apple silicon', risk:'Geopolitical'},
      {id:'FOXC', name:'Hon Hai / Foxconn',    ticker:'2317.TW', group:'company',       cat:'a', role:'Device assembly', note:'~70% of iPhones', risk:'Labour, China ops'},
      {id:'LPL',  name:'LG Display',           ticker:'LPL',     group:'company',       cat:'a', role:'OLED displays', note:'iPhone screens', risk:'Competitive margins'},
      {id:'SONY', name:'Sony Semiconductor',   ticker:'SONY',    group:'company',       cat:'a', role:'Image sensors', note:'~50% global sensor mkt', risk:'Supply concentration'},
      {id:'QCOM', name:'Qualcomm',             ticker:'QCOM',    group:'company',       cat:'a', role:'5G modems', note:'Apple building in-house', risk:'Transition risk'},
      {id:'MAERSK',name:'A.P. Møller-Mærsk',   ticker:'MAERSK',  group:'manufacturing', cat:'b', role:'Global freight', note:'Ocean shipping', risk:'Port delays, rates'},
      {id:'XOM',  name:'ExxonMobil',           ticker:'XOM',     group:'commodity',     cat:'b', role:'Mfg energy costs', note:'Indirect dependency', risk:'Oil price volatility'},
      {id:'MP',   name:'MP Materials',         ticker:'MP',      group:'materials',     cat:'b', role:'Rare earth magnets', note:'Motors & haptics', risk:'China supply chain'},
      {id:'ALB',  name:'Albemarle',            ticker:'ALB',     group:'materials',     cat:'b', role:'Lithium supply', note:'Battery materials', risk:'EV demand competition'},
    ],
    customers:[
      {id:'TMUS', name:'T-Mobile',  ticker:'TMUS', group:'mobile_carrier',     role:'Carrier distribution', note:'~18% device revenue', risk:'Subsidy dependence'},
      {id:'VZ',   name:'Verizon',   ticker:'VZ',   group:'mobile_carrier',     role:'Carrier distribution', note:'~15% device revenue', risk:'Contract renewal'},
      {id:'T',    name:'AT&T',      ticker:'T',    group:'mobile_carrier',     role:'Carrier distribution', note:'~12% device revenue', risk:'Competition'},
      {id:'BBY',  name:'Best Buy',  ticker:'BBY',  group:'electronics_retail', role:'Electronics retail', note:'~30% of BBY revenue', risk:'Retail footprint'},
      {id:'COST', name:'Costco',    ticker:'COST', group:'warehouse_club',     role:'Warehouse retail', note:'High-volume iPhone', risk:'Margin pressure'},
      {id:'AMZN', name:'Amazon',    ticker:'AMZN', group:'online_reseller',    role:'Marketplace + AWS', note:'Also cloud competitor', risk:'Dual-role tension'},
    ]
  },
  SONY: {
    name:'Sony Group Corp.', ticker:'SONY', meta:'NYSE · TECH · LARGE-CAP',
    inputs:[
      {id:'SUMCO', name:'SUMCO Corp',      ticker:'SUMCO', group:'company',   cat:'a', role:'Silicon wafers', note:'Key sensor substrate', risk:'Supply tightness'},
      {id:'ASML',  name:'ASML Holding',   ticker:'ASML',  group:'company',   cat:'a', role:'Lithography machines', note:'Critical for fab', risk:'Export controls'},
      {id:'TDK',   name:'TDK Corp',       ticker:'TDK',   group:'company',   cat:'a', role:'Electronic components', note:'Passives & sensors', risk:'Pricing cycles'},
      {id:'MP',    name:'Rare earth supply', ticker:'MP', group:'materials', cat:'b', role:'Rare earth materials', note:'Magnets & actuators', risk:'China dependency'},
      {id:'ENERGY',name:'Energy markets', ticker:'—',     group:'commodity', cat:'b', role:'Fab energy costs', note:'Power-intensive process', risk:'Price volatility'},
    ],
    customers:[
      {id:'AAPL', name:'Apple Inc.',      ticker:'AAPL', group:'oem_buyer', role:'Image sensor buyer', note:'Largest single customer', risk:'Concentration risk'},
      {id:'SAMS', name:'Samsung',         ticker:'005930.KS', group:'oem_buyer', role:'Sensor + component buyer', note:'Smartphone cameras', risk:'Competitor dynamic'},
      {id:'PS',   name:'PlayStation',     ticker:'Internal', group:'internal', role:'Internal gaming division', note:'Console + peripherals', risk:'Gaming cycle'},
      {id:'NFLX', name:'Netflix',         ticker:'NFLX', group:'content', role:'Content licensing', note:'Sony Pictures deals', risk:'Streaming wars'},
    ]
  },
  TSM: {
    name:'Taiwan Semiconductor', ticker:'TSM', meta:'NYSE · SEMI · LARGE-CAP',
    inputs:[
      {id:'ASML',  name:'ASML Holding',       ticker:'ASML', group:'company',   cat:'a', role:'EUV lithography', note:'Sole EUV supplier', risk:'Export controls'},
      {id:'AMAT',  name:'Applied Materials',  ticker:'AMAT', group:'company',   cat:'a', role:'Deposition tools', note:'Wafer processing', risk:'Lead times'},
      {id:'LRCX',  name:'Lam Research',       ticker:'LRCX', group:'company',   cat:'a', role:'Etch equipment', note:'Advanced nodes', risk:'Cyclicality'},
      {id:'UMC',   name:'UMC',                ticker:'UMC',  group:'company',   cat:'a', role:'Mature node overflow', note:'Capacity sharing', risk:'Competitor'},
      {id:'WATER', name:'Water supply',       ticker:'—',    group:'commodity', cat:'b', role:'Fab operations', note:'Ultra-pure water', risk:'Taiwan drought risk'},
      {id:'PWR',   name:'Taiwan Power',       ticker:'—',    group:'commodity', cat:'b', role:'Electricity supply', note:'Grid dependency', risk:'Stability concerns'},
    ],
    customers:[
      {id:'AAPL', name:'Apple Inc.', ticker:'AAPL', group:'oem_buyer', role:'Logic chip buyer', note:'~25% of TSM revenue', risk:'Largest concentration'},
      {id:'NVDA', name:'NVIDIA',     ticker:'NVDA', group:'oem_buyer', role:'GPU fabrication', note:'H100/B100 chips', risk:'AI demand swings'},
      {id:'AMD',  name:'AMD',        ticker:'AMD',  group:'oem_buyer', role:'CPU/GPU fabrication', note:'EPYC & Instinct', risk:'Intel competition'},
      {id:'QCOM', name:'Qualcomm',   ticker:'QCOM', group:'oem_buyer', role:'Modem fabrication', note:'Snapdragon chips', risk:'In-house threat'},
    ]
  },
  QCOM: {
    name:'Qualcomm Inc.', ticker:'QCOM', meta:'NASDAQ · SEMI · LARGE-CAP',
    inputs:[
      {id:'TSM', name:'Taiwan Semiconductor', ticker:'TSM', group:'company',       cat:'a', role:'Chip fabrication', note:'Fabless model', risk:'Geopolitical, capacity'},
      {id:'ARM', name:'ARM Holdings',  ticker:'ARM', group:'company',       cat:'a', role:'CPU architecture license', note:'Core IP dependency', risk:'Royalty model'},
      {id:'RF',  name:'RF suppliers',  ticker:'—',   group:'manufacturing', cat:'b', role:'RF front-end components', note:'Antenna modules', risk:'Supply diversification'},
    ],
    customers:[
      {id:'SAMS', name:'Samsung',      ticker:'005930.KS', group:'oem_buyer', role:'Android flagship chips', note:'Snapdragon flagship', risk:'Exynos competition'},
      {id:'XIAO', name:'Xiaomi',       ticker:'1810.HK',   group:'oem_buyer', role:'Snapdragon devices', note:'Large volume', risk:'China market exposure'},
      {id:'AAPL', name:'Apple Inc.',   ticker:'AAPL', group:'oem_buyer', role:'5G modems (declining)', note:'Building in-house', risk:'Customer exit risk'},
      {id:'MSFT', name:'Microsoft',    ticker:'MSFT', group:'oem_buyer', role:'Copilot+ PC chips', note:'Snapdragon X Elite', risk:'New segment dependency'},
    ]
  },
  AMZN: {
    name:'Amazon.com Inc.', ticker:'AMZN', meta:'NASDAQ · TECH · MEGA-CAP',
    inputs:[
      {id:'UPS',  name:'UPS',            ticker:'UPS',  group:'manufacturing', cat:'b', role:'Last-mile delivery', note:'Partial, declining share', risk:'Amazon building own fleet'},
      {id:'FDX',  name:'FedEx',          ticker:'FDX',  group:'manufacturing', cat:'b', role:'Freight & express', note:'Supplements Amazon Logistics', risk:'Margin pressure'},
      {id:'MSFT', name:'Microsoft Azure',ticker:'MSFT', group:'company',       cat:'a', role:'Cloud competitor/partner', note:'Indirect via enterprise', risk:'AWS vs Azure battle'},
      {id:'TSM',  name:'Chip foundries', ticker:'TSM',  group:'company',       cat:'a', role:'Graviton chip fab', note:'Custom AWS silicon', risk:'Supply lead times'},
    ],
    customers:[
      {id:'SMB',  name:'SMB sellers',    ticker:'—',    group:'distributor', role:'3P marketplace revenue', note:'~60% of units sold', risk:'Seller concentration'},
      {id:'NFLX', name:'Netflix',        ticker:'NFLX', group:'cloud', role:'AWS cloud customer', note:'Largest AWS tenant', risk:'Competitive tension'},
      {id:'AAPL', name:'Apple Inc.',     ticker:'AAPL', group:'cloud', role:'iCloud on AWS', note:'Hybrid arrangement', risk:'Strategic sensitivity'},
      {id:'META', name:'Meta Platforms', ticker:'META', group:'cloud', role:'AWS infrastructure', note:'Partial cloud workloads', risk:'Multi-cloud hedging'},
    ]
  },

  // ── Non-equities: creative, asset-class-specific maps ──────────────────────
  // Commodities/forex reuse the bipartite map but with their own group labels:
  // left = what it takes to produce it, right = the SECTORS that consume it.
  GOLD: {
    name:'Gold · spot', ticker:'GOLD', meta:'COMMODITY · PRECIOUS METAL', mode:'commodity',
    leftLabel:'Extraction & supply', rightLabel:'Consuming sectors',
    supGroups:[
      {id:'producer',  label:'Producers'},
      {id:'energy',    label:'Energy & power'},
      {id:'reagents',  label:'Reagents'},
      {id:'equipment', label:'Equipment'},
      {id:'capital',   label:'Capital & labour'},
    ],
    custGroups:[
      {id:'jewellery',  label:'Jewellery'},
      {id:'investment', label:'Investment'},
      {id:'official',   label:'Central banks'},
      {id:'technology', label:'Technology'},
      {id:'industrial', label:'Industrial'},
    ],
    inputs:[
      {id:'NEM', name:'Newmont',            ticker:'NEM', group:'producer',  cat:'a', role:'Largest producer',  note:'Primary mined supply'},
      {id:'AEM', name:'Agnico Eagle',       ticker:'AEM', group:'producer',  cat:'a', role:'Tier-one mines',    note:'North America'},
      {id:'ABX', name:'Barrick / AngloGold',ticker:'—',   group:'producer',  cat:'a', role:'Major producers',   note:'Mined output'},
      {id:'PWR', name:'Diesel & grid power',ticker:'—',   group:'energy',    cat:'b', role:'Energy-intensive',  note:'~1/3 of cash cost'},
      {id:'CYN', name:'Cyanide & lime',     ticker:'—',   group:'reagents',  cat:'b', role:'Ore leaching',      note:'Heap-leach extraction'},
      {id:'CAT', name:'Haul trucks & drills',ticker:'CAT',group:'equipment', cat:'b', role:'Mining equipment',  note:'Caterpillar, Komatsu'},
      {id:'LAB', name:'Labour & financing', ticker:'—',   group:'capital',   cat:'b', role:'Capital-intensive', note:'Mine development'},
    ],
    customers:[
      {id:'JWL', name:'Jewellery demand',      ticker:'—', group:'jewellery',  role:'~45% of demand', note:'India & China led'},
      {id:'INV', name:'Bars, coins & ETFs',    ticker:'—', group:'investment', role:'~25% of demand', note:'Safe-haven flows'},
      {id:'CB',  name:'Central-bank reserves', ticker:'—', group:'official',   role:'~23% of demand', note:'Official buying'},
      {id:'TEC', name:'Electronics & semis',   ticker:'—', group:'technology', role:'Conductive contacts', note:'Bonding wire'},
      {id:'IND', name:'Dentistry & catalysis', ticker:'—', group:'industrial', role:'Industrial uses', note:'Small share'},
    ],
  },
  WTI: {
    name:'Crude Oil · WTI', ticker:'WTI', meta:'COMMODITY · ENERGY', mode:'commodity',
    leftLabel:'Production & supply', rightLabel:'Consuming sectors',
    supGroups:[
      {id:'producer',  label:'Producers'},
      {id:'opec',      label:'OPEC+'},
      {id:'services',  label:'Oilfield services'},
      {id:'transport', label:'Transport'},
    ],
    custGroups:[
      {id:'transport',  label:'Transportation'},
      {id:'petrochem',  label:'Petrochemicals'},
      {id:'power',      label:'Power & heating'},
      {id:'industrial', label:'Industrial'},
    ],
    inputs:[
      {id:'XOM',  name:'ExxonMobil',        ticker:'XOM', group:'producer',  cat:'a', role:'Integrated major', note:'Upstream output'},
      {id:'CVX',  name:'Chevron',           ticker:'CVX', group:'producer',  cat:'a', role:'Integrated major', note:'Permian focus'},
      {id:'OPEC', name:'OPEC+ quotas',      ticker:'—',   group:'opec',      cat:'b', role:'Supply discipline', note:'Sets the floor'},
      {id:'SLB',  name:'SLB (Schlumberger)',ticker:'SLB', group:'services',  cat:'a', role:'Drilling & completion', note:'Service intensity'},
      {id:'PIPE', name:'Pipelines & tankers',ticker:'—',  group:'transport', cat:'b', role:'Midstream logistics', note:'Cushing hub'},
    ],
    customers:[
      {id:'TRAN', name:'Gasoline, diesel & jet', ticker:'—', group:'transport',  role:'~60% of demand', note:'Road & air'},
      {id:'PCH',  name:'Plastics & chemicals',   ticker:'—', group:'petrochem',  role:'Feedstock',      note:'Naphtha, ethylene'},
      {id:'HEAT', name:'Heating & power',        ticker:'—', group:'power',      role:'Heating oil',    note:'Seasonal'},
      {id:'AILU', name:'Asphalt & lubricants',   ticker:'—', group:'industrial', role:'Industrial uses', note:'Residuals'},
    ],
  },
  EURUSD: {
    name:'Euro / US Dollar', ticker:'EURUSD', meta:'FOREX · MAJOR PAIR', mode:'forex',
    leftLabel:'What moves it', rightLabel:'Where it flows',
    supGroups:[
      {id:'policy',    label:'Monetary policy'},
      {id:'inflation', label:'Inflation'},
      {id:'growth',    label:'Growth'},
      {id:'risk',      label:'Risk sentiment'},
    ],
    custGroups:[
      {id:'trade',    label:'Trade settlement'},
      {id:'reserves', label:'Reserves'},
      {id:'tourism',  label:'Tourism & remittance'},
      {id:'specs',    label:'Speculation'},
    ],
    inputs:[
      {id:'RATES', name:'Fed vs ECB rate gap', ticker:'—', group:'policy',    cat:'a', role:'Rate differential', note:'Drives carry & flows'},
      {id:'CPI',   name:'US–EZ inflation gap', ticker:'—', group:'inflation', cat:'b', role:'Real-yield driver',  note:'Policy expectations'},
      {id:'GDP',   name:'Growth differential', ticker:'—', group:'growth',    cat:'b', role:'Relative momentum',  note:'PMIs, jobs'},
      {id:'RISK',  name:'Risk-on / risk-off',  ticker:'—', group:'risk',      cat:'b', role:'Dollar haven bid',   note:'The “USD smile”'},
    ],
    customers:[
      {id:'TRD', name:'Cross-border trade', ticker:'—', group:'trade',    role:'Invoicing & settlement', note:'EU–US flows'},
      {id:'RES', name:'FX reserves',        ticker:'—', group:'reserves', role:'Central-bank holdings',  note:'EUR ~20% of reserves'},
      {id:'TUR', name:'Tourism & remittance',ticker:'—',group:'tourism',  role:'Retail flows',           note:'Seasonal'},
      {id:'SPC', name:'Carry & speculation',ticker:'—', group:'specs',    role:'Leveraged positioning',  note:'The most-traded pair'},
    ],
  },
  // Indices get a "family tree" of constituents instead of a supply chain.
  SPX: {
    name:'S&P 500 Index', ticker:'SPX', meta:'INDEX · US LARGE-CAP', mode:'index',
    constituents:[
      {sector:'Information Technology',   weight:'31%',  members:[{t:'AAPL',n:'Apple',w:'7.0%'},{t:'MSFT',n:'Microsoft',w:'6.5%'},{t:'NVDA',n:'NVIDIA',w:'6.1%'},{t:'AVGO',n:'Broadcom',w:'1.6%'}]},
      {sector:'Communication Services',   weight:'9%',   members:[{t:'GOOGL',n:'Alphabet',w:'4.0%'},{t:'META',n:'Meta',w:'2.6%'}]},
      {sector:'Consumer Discretionary',   weight:'10%',  members:[{t:'AMZN',n:'Amazon',w:'3.9%'},{t:'TSLA',n:'Tesla',w:'1.4%'}]},
      {sector:'Financials',               weight:'13%',  members:[{t:'BRK.B',n:'Berkshire',w:'1.7%'},{t:'JPM',n:'JPMorgan',w:'1.3%'},{t:'V',n:'Visa',w:'1.0%'}]},
      {sector:'Health Care',              weight:'12%',  members:[{t:'LLY',n:'Eli Lilly',w:'1.4%'},{t:'UNH',n:'UnitedHealth',w:'1.1%'},{t:'JNJ',n:'J&J',w:'0.8%'}]},
      {sector:'Industrials',              weight:'8%',   members:[{t:'CAT',n:'Caterpillar',w:'0.5%'},{t:'GE',n:'GE Aerospace',w:'0.5%'},{t:'HON',n:'Honeywell',w:'0.4%'}]},
      {sector:'Consumer Staples',         weight:'6%',   members:[{t:'WMT',n:'Walmart',w:'0.7%'},{t:'COST',n:'Costco',w:'0.8%'},{t:'PG',n:'P&G',w:'0.7%'}]},
      {sector:'Energy',                   weight:'4%',   members:[{t:'XOM',n:'ExxonMobil',w:'0.9%'},{t:'CVX',n:'Chevron',w:'0.6%'}]},
      {sector:'Utilities',                weight:'2.5%', members:[{t:'NEE',n:'NextEra',w:'0.3%'}]},
      {sector:'Materials',                weight:'2.2%', members:[{t:'LIN',n:'Linde',w:'0.4%'}]},
      {sector:'Real Estate',              weight:'2.2%', members:[{t:'PLD',n:'Prologis',w:'0.3%'}]},
    ],
  },
};

// Resolve a principle by key; build a generic placeholder for nodes without their own entry.
function scnGet(id) {
  if (SCN_DB[id]) return SCN_DB[id];
  for (const k in SCN_DB) {
    for (const n of [...(SCN_DB[k].inputs || []), ...(SCN_DB[k].customers || [])]) {
      if (n.id === id || n.ticker === id) {
        if (SCN_DB[n.ticker]) return SCN_DB[n.ticker];
        return { name:n.name, ticker:n.ticker, meta:'MARKET · EQUITY', generic:true,
          inputs:[{id:'g1', name:'Upstream suppliers', ticker:'—', group:'company', cat:'a', role:'Supply chain', note:'Detailed map not yet loaded', risk:'—'}],
          customers:[{id:'g2', name:'End markets', ticker:'—', group:'distributor', role:'Distribution channels', note:'Detailed map not yet loaded', risk:'—'}] };
      }
    }
  }
  return SCN_DB.AAPL;
}

const SCN = { blue:'#185FA5', blueLine:'#378ADD', coral:'#C0563B', tealLine:'#1D9E75', cust:'#0F6E56' };

// Index "family tree" — the index at top, then constituents grouped by sector.
// Tapping a constituent pops the company up in a preview (tabs: Overview, Supply
// chain, Financials, Patents, History) with an "Open dashboard" button.
function ScnIndexTree({ data, go, isMobile }) {
  const [preview, setPreview] = React.useState(null);   // company being previewed (popup)
  React.useEffect(() => {
    if (!preview) return;
    const onKey = (e) => { if (e.key === 'Escape') setPreview(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [preview]);
  return (
    <div style={{ marginTop:14 }}>
      {/* the index */}
      <div style={{ borderRadius:13, background:VM.forest, padding: isMobile ? '16px 18px' : '18px 22px', textAlign:'center', marginBottom:18 }}>
        <div style={{ fontFamily:VM.mono, fontSize:8, color:'#9FE1CB', letterSpacing:'1px', textTransform:'uppercase', marginBottom:5 }}>{data.meta}</div>
        <div style={{ fontFamily:VM.serif, fontSize: isMobile ? 22 : 26, fontWeight:600, color:'#E1F5EE', lineHeight:1.2 }}>{data.name}</div>
        <div style={{ fontFamily:VM.mono, fontSize:9.5, color:'#5DCAA5', marginTop:4 }}>{data.ticker} · the index · 500 constituents</div>
      </div>
      <div style={{ fontFamily:VM.mono, fontSize:10, color:VM.ink3, letterSpacing:'0.5px', textTransform:'uppercase', marginBottom:10 }}>Family tree · by GICS sector · tap a company to preview</div>
      {data.constituents.map((s, i) => (
        <div key={i} style={{ marginBottom:14 }}>
          <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:7 }}>
            <span style={{ fontFamily:VM.serif, fontWeight:700, fontSize:15, color:VM.ink }}>{s.sector}</span>
            <Mono size={10} color={VM.terra} weight={700}>{s.weight}</Mono>
            <span style={{ flex:1, height:1, background:VM.borderSoft }}></span>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {s.members.map(m => {
              const co = VM_COMPANIES.find(x => x.ticker === m.t);
              return (
                <button key={m.t} onClick={()=> co && setPreview(co)} title={co ? `Preview ${m.t}` : m.n}
                  style={{ display:'inline-flex', alignItems:'baseline', gap:6, padding:'7px 11px', borderRadius:8,
                    border:`1px solid ${VM.border}`, background:VM.paper, cursor: co ? 'pointer' : 'default' }}>
                  <Mono size={11.5} weight={700} color={VM.ink}>{m.t}</Mono>
                  <span style={{ fontFamily:VM.serif, fontSize:12, color:VM.ink3 }}>{m.n}</span>
                  <Mono size={9.5} color={VM.ink3}>{m.w}</Mono>
                  {co && <i className="ti ti-eye" style={{ fontSize:12, color:VM.teal, alignSelf:'center' }}></i>}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <Mono size={9.5} color={VM.faint} style={{ display:'block', marginTop:6 }}>Top names by weight · a 500-name index · illustrative mock data</Mono>

      {/* company preview popup */}
      {preview && (
        <div onClick={()=>setPreview(null)} style={{ position:'fixed', inset:0, zIndex:80, background:'rgba(31,29,26,0.45)',
          display:'flex', alignItems:'flex-start', justifyContent:'center', padding: isMobile ? '12px' : '40px 20px', overflowY:'auto' }}>
          <div onClick={(e)=>e.stopPropagation()} style={{ position:'relative', width:'100%', maxWidth:760, background:VM.paper,
            borderRadius:16, boxShadow:'0 24px 60px rgba(31,29,26,0.3)', overflow:'hidden' }}>
            <div style={{ display:'flex', justifyContent:'flex-end', padding:'8px 10px 0' }}>
              <button onClick={()=>setPreview(null)} title="Close" style={{ width:30, height:30, borderRadius:999,
                border:`1px solid ${VM.border}`, background:VM.paper, color:VM.ink2, cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', padding:0 }}><i className="ti ti-x" style={{ fontSize:15 }}></i></button>
            </div>
            <Preview c={preview} onOpen={()=>{ const co = preview; setPreview(null); go && go('dashboard', co); }} />
          </div>
        </div>
      )}
    </div>
  );
}

function ScnLiveDemo({ go, isMobile, initialTicker, compact }) {
  const [history, setHistory] = React.useState([initialTicker || 'AAPL']);
  const current = history[history.length - 1];
  const [filter, setFilter] = React.useState('all');     // all | companies | external | lens
  const [hovered, setHovered] = React.useState(null);
  const [previewId, setPreviewId] = React.useState(null);   // node whose preview tab is open
  const [paths, setPaths] = React.useState([]);
  const canvasRef = React.useRef(null);
  const mapRef = React.useRef(null);        // the map region — connectors measure against this
  const principleRef = React.useRef(null);
  const nodeEls = React.useRef({});
  // "Full screen" = fill the main content area (#vm-main, i.e. right of the rail,
  // below the header/ticker) via a fixed overlay sized to that region — NOT the
  // whole viewport and NOT OS fullscreen.
  const [isFull, setIsFull] = React.useState(false);
  const [fullRect, setFullRect] = React.useState(null);
  const [dashTab, setDashTab] = React.useState('Overview');   // bottom tabs — full screen only
  const toggleFull = () => setIsFull(f => !f);
  React.useEffect(() => {
    if (!isFull) { setFullRect(null); setDashTab('Overview'); return; }
    const compute = () => {
      const main = document.getElementById('vm-main');
      const r = main && main.getBoundingClientRect();
      setFullRect(r ? { top:r.top, left:r.left, width:r.width, height:r.height }
                    : { top:0, left:0, width:window.innerWidth, height:window.innerHeight });
    };
    compute();
    const onKey = (e) => { if (e.key === 'Escape') setIsFull(false); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', compute);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('resize', compute); };
  }, [isFull]);

  const data = scnGet(current);
  // Per-instrument groups + column labels (commodities/forex override the equity defaults).
  const supGroups  = data.supGroups  || SCN_SUP_GROUPS;
  const custGroups = data.custGroups || SCN_CUST_GROUPS;
  const leftLabel  = data.leftLabel  || 'Inputs · dependencies';
  const rightLabel = data.rightLabel || 'Customers · channels';
  const inputs = (data.inputs || []).filter(n =>
    filter === 'companies' ? n.cat === 'a' :
    filter === 'external'  ? n.cat === 'b' : true);
  const customers = data.customers || [];

  const measure = React.useCallback(() => {
    const canvas = mapRef.current, p = principleRef.current;
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

  // Stable handle to the latest measure() (it's re-created each render).
  const measureRef = React.useRef(measure); measureRef.current = measure;
  const remeasure = React.useCallback(() => { measureRef.current && measureRef.current(); }, []);

  // Re-measure on data/filter changes AND on entering/exiting fullscreen (layout
  // moves). Double rAF so we measure after layout + the new node refs have settled.
  // (We do NOT clear nodeEls here — the ref callbacks add/remove entries themselves;
  // clearing post-commit was wiping the freshly-set refs and dropping the arrows.)
  React.useLayoutEffect(() => {
    let raf2;
    const raf1 = requestAnimationFrame(() => { raf2 = requestAnimationFrame(remeasure); });
    return () => { cancelAnimationFrame(raf1); if (raf2) cancelAnimationFrame(raf2); };
  }, [current, filter, isMobile, isFull, fullRect, dashTab, remeasure]);
  // Robust against late layout shifts: re-measure on element/window resize and once
  // web fonts finish loading (the node cards reflow when the fonts swap in).
  React.useEffect(() => {
    const on = () => remeasure();
    window.addEventListener('resize', on);
    let ro;
    if (typeof ResizeObserver !== 'undefined' && canvasRef.current) { ro = new ResizeObserver(on); ro.observe(canvasRef.current); }
    let cancelled = false;
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!cancelled) remeasure(); });
    return () => { cancelled = true; window.removeEventListener('resize', on); if (ro) ro.disconnect(); };
  }, [remeasure]);

  const drill = (n) => {
    setPreviewId(null);
    const key = SCN_DB[n.ticker] ? n.ticker : n.id;
    if (history[history.length - 1] === key) return;
    setHistory(h => [...h, key]);
    setHovered(null);
  };
  const jumpTo = (i) => { setHistory(h => h.slice(0, i + 1)); setHovered(null); setPreviewId(null); };

  // The full-screen view also exposes the principle company's dashboard tabs along
  // the bottom; selecting one renders that company's matching dashboard view inline,
  // right here, from the exact same data (resolveCompany) the dashboard uses.
  const principleCo = VM_COMPANIES.find(c => c.ticker === data.ticker) || { ticker:data.ticker, name:data.name, sector:'—' };
  const DASH_TABS = ['Overview','Financials','Patents','History','News'];   // Supply chain = the map itself (always shown), so not a tab
  // The map always shows; on a non-map tab the dashboard view stacks BELOW it (scroll down).
  const dashData = isFull ? resolveCompany(data.ticker) : null;

  // The drill trail (AAPL › TSM › …) — shown above the canvas, and again inside the
  // canvas in full screen (where the page-level trail is hidden by the overlay).
  const renderCrumbs = () => history.map((id, i) => {
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
  });

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
    const isPrev = previewId === n.id;
    const edge = side === 'right' ? { borderRight:`3px solid ${accent}` } : { borderLeft:`3px solid ${accent}` };
    const ttSide  = side === 'right' ? { right:'calc(100% + 10px)' } : { left:'calc(100% + 10px)' };
    const innerEdge = side === 'right' ? { left:6 } : { right:6 };                       // toward the centre
    const prevSide  = side === 'right' ? { right:'calc(100% + 12px)' } : { left:'calc(100% + 12px)' };
    const co = VM_COMPANIES.find(c => c.ticker === n.ticker);
    return (
      <div key={n.id} ref={el => { if (el) nodeEls.current[n.id] = el; else delete nodeEls.current[n.id]; }}
        onMouseEnter={()=>setHovered(n.id)} onMouseLeave={()=>setHovered(h => h===n.id ? null : h)}
        onClick={()=>drill(n)}
        style={{ position:'relative', padding:'4px 10px', background: (hl || isPrev) ? VM.paperWarm : VM.paper,
          border:`1px solid ${VM.border}`, ...edge, cursor:'pointer', zIndex: isPrev ? 30 : (hl ? 5 : 2),
          textAlign: side === 'right' ? 'right' : 'left',
          transform: hl ? `scale(1.05) translateX(${side==='right' ? -4 : 4}px)` : 'none',
          boxShadow: (hl || isPrev) ? '0 6px 16px rgba(31,29,26,0.12)' : 'none',
          transition:'transform .18s cubic-bezier(.34,1.56,.64,1), background .15s ease, box-shadow .15s ease' }}>
        <div style={{ fontFamily:VM.mono, fontSize:11, fontWeight:600, color:VM.ink }}>
          {n.ticker} <span style={{ fontSize:8.5, color:VM.ink3, fontWeight:400 }}>· {n.role.split(' ')[0].toLowerCase()}</span>
        </div>
        <div style={{ fontFamily:VM.serif, fontSize:9.5, color:VM.ink3, marginTop:0 }}>{n.name}</div>

        {/* hover actions: P = make principle, eye = preview */}
        {hl && (
          <div style={{ position:'absolute', top:'50%', transform:'translateY(-50%)', ...innerEdge, zIndex:8, display:'flex', gap:5 }}>
            <button title="Make principle" onClick={(e)=>{ e.stopPropagation(); drill(n); }}
              style={{ width:24, height:24, borderRadius:999, border:`1px solid ${VM.forest}`, background:VM.forest, color:VM.paperWarm,
                cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', padding:0, fontFamily:VM.serif, fontWeight:700, fontSize:12 }}>P</button>
            <button title="Preview" onClick={(e)=>{ e.stopPropagation(); setPreviewId(p => p===n.id ? null : n.id); }}
              style={{ width:24, height:24, borderRadius:999, border:`1px solid ${isPrev?VM.forest:VM.border}`, background:isPrev?VM.tealTint:VM.paper, color:VM.ink2,
                cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', padding:0 }}><i className="ti ti-eye" style={{ fontSize:13 }}></i></button>
          </div>
        )}

        {/* hover tooltip — detail only (risk removed); hidden while the preview is open */}
        {hl && !isPrev && n.note && (
          <div style={{ position:'absolute', top:'50%', transform:'translateY(-50%)', ...ttSide,
            width:172, zIndex:20, background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:8,
            padding:'9px 11px', fontSize:11, color:VM.ink, lineHeight:1.5, textAlign:'left',
            boxShadow:'0 10px 28px rgba(31,29,26,0.16)' }}>
            <div style={{ fontFamily:VM.serif, fontWeight:700, fontSize:12, marginBottom:4 }}>{n.ticker} — {n.role}</div>
            <div style={{ display:'flex', justifyContent:'space-between', gap:8 }}><span style={{ color:VM.ink3 }}>Detail</span><span style={{ fontWeight:500, textAlign:'right' }}>{n.note}</span></div>
          </div>
        )}

        {/* preview tab — opens beside the box on eye click; persists until closed */}
        {isPrev && (
          <div onClick={(e)=>e.stopPropagation()} style={{ position:'absolute', top:'50%', transform:'translateY(-50%)', ...prevSide,
            width:250, zIndex:26, background:VM.paper, border:`1px solid ${VM.border}`, borderRadius:10,
            boxShadow:'0 14px 34px rgba(31,29,26,0.2)', padding:'12px 14px', textAlign:'left', cursor:'default' }}>
            <div style={{ display:'flex', alignItems:'baseline', gap:7 }}>
              <Mono size={14} weight={700}>{n.ticker}</Mono>
              <span style={{ fontFamily:VM.serif, fontSize:12, color:VM.ink3, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{n.name}</span>
              <i className="ti ti-x" onClick={()=>setPreviewId(null)} title="Close" style={{ fontSize:14, color:VM.ink3, cursor:'pointer' }}></i>
            </div>
            {co && <div style={{ marginTop:5 }}><Mono size={11} weight={700}>${co.price}</Mono> <Chg dir={co.dir}>{co.chg}</Chg> <Mono size={9.5} color={VM.ink3}>· {co.sector}</Mono></div>}
            <div style={{ marginTop:8, paddingTop:8, borderTop:`1px solid ${VM.borderHair}` }}>
              <Label>Role</Label>
              <div style={{ fontFamily:VM.serif, fontSize:13, color:VM.ink, marginTop:2 }}>{n.role}</div>
              {n.note && <div style={{ fontFamily:VM.serif, fontSize:12.5, color:VM.ink2, marginTop:6, lineHeight:1.45 }}>{n.note}</div>}
            </div>
            <div style={{ display:'flex', gap:7, marginTop:11 }}>
              <button onClick={()=>drill(n)} style={{ fontFamily:VM.serif, fontSize:12, padding:'6px 11px', borderRadius:999, border:`1px solid ${VM.forest}`, background:VM.forest, color:VM.paperWarm, cursor:'pointer', whiteSpace:'nowrap' }}>Make principle →</button>
              {co && <button onClick={()=>go && go('dashboard', co)} style={{ fontFamily:VM.serif, fontSize:12, padding:'6px 11px', borderRadius:999, border:`1px solid ${VM.border}`, background:VM.paper, color:VM.ink, cursor:'pointer', whiteSpace:'nowrap' }}>Dashboard →</button>}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Mobile node — no hover/connectors; a full-width card that taps open to reveal
  // price + role + the same Make-principle / Dashboard actions as the desktop preview.
  const mobileNode = (n, side) => {
    const isExt = n.cat === 'b';
    const accent = side === 'right' ? SCN.cust : (isExt ? SCN.coral : SCN.blue);
    const open = previewId === n.id;
    const co = VM_COMPANIES.find(c => c.ticker === n.ticker);
    return (
      <div key={n.id} style={{ border:`1px solid ${VM.border}`, borderLeft:`3px solid ${accent}`, borderRadius:9,
        background: open ? VM.paperWarm : VM.paper, marginBottom:8, overflow:'hidden' }}>
        <div onClick={()=>setPreviewId(p => p===n.id ? null : n.id)} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 13px', cursor:'pointer' }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:VM.mono, fontSize:12.5, fontWeight:600, color:VM.ink }}>{n.ticker} <span style={{ fontSize:9.5, color:VM.ink3, fontWeight:400 }}>· {n.role.split(' ')[0].toLowerCase()}</span></div>
            <div style={{ fontFamily:VM.serif, fontSize:12.5, color:VM.ink3, marginTop:1 }}>{n.name}</div>
          </div>
          <i className={'ti ti-chevron-' + (open ? 'up' : 'down')} style={{ fontSize:17, color:VM.ink3 }}></i>
        </div>
        {open && (
          <div style={{ padding:'2px 13px 13px', borderTop:`1px solid ${VM.borderHair}` }}>
            {co && <div style={{ marginTop:9 }}><Mono size={13} weight={700}>${co.price}</Mono> <Chg dir={co.dir}>{co.chg}</Chg> <Mono size={10} color={VM.ink3}>· {co.sector}</Mono></div>}
            <div style={{ marginTop:9 }}><Label>Role</Label><div style={{ fontFamily:VM.serif, fontSize:13.5, color:VM.ink, marginTop:2 }}>{n.role}</div></div>
            {n.note && <div style={{ fontFamily:VM.serif, fontSize:13, color:VM.ink2, marginTop:6, lineHeight:1.45 }}>{n.note}</div>}
            <div style={{ display:'flex', gap:8, marginTop:12, flexWrap:'wrap' }}>
              <button onClick={()=>drill(n)} style={{ fontFamily:VM.serif, fontSize:13, padding:'8px 13px', borderRadius:999, border:`1px solid ${VM.forest}`, background:VM.forest, color:VM.paperWarm, cursor:'pointer' }}>Make principle →</button>
              {co && <button onClick={()=>go && go('dashboard', co)} style={{ fontFamily:VM.serif, fontSize:13, padding:'8px 13px', borderRadius:999, border:`1px solid ${VM.border}`, background:VM.paper, color:VM.ink, cursor:'pointer' }}>Dashboard →</button>}
            </div>
          </div>
        )}
      </div>
    );
  };

  const colW = 196;
  // In full screen the map region gains a filters bar across the top, so the node
  // columns + principle inset down to clear it.
  const colInset = isFull ? { top:44, height:'calc(100% - 44px)' } : { top:0, height:'100%' };

  // An index isn't a supply chain — render its family tree of constituents instead.
  if (data.mode === 'index') {
    return (
      <div style={{ padding: compact ? '0' : (isMobile ? '14px 16px 80px' : '26px 32px 60px'), maxWidth:1180, margin:'0 auto' }}>
        {!compact && <>
          <Mono size={11} color={VM.ink3} style={{ letterSpacing:'0.04em' }}><b style={{color:VM.ink}}>Index family tree</b></Mono>
          <div style={{ marginTop:14 }}><Kicker>INDEX · CONSTITUENTS</Kicker></div>
          <h1 style={{ fontFamily:VM.serif, fontWeight:700, fontSize: isMobile ? 28 : 38, margin:'8px 0 6px' }}>{data.name}.</h1>
          <p style={{ fontFamily:VM.serif, fontSize:16, color:VM.ink3, margin:'0 0 18px', maxWidth:640 }}>
            An index isn’t a supply chain — it’s a basket. Here’s its <i>family tree</i>: the constituent companies, grouped by sector and weight.
          </p>
        </>}
        <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:14, minHeight:26 }}>
          {renderCrumbs()}
        </div>
        <ScnIndexTree data={data} go={go} isMobile={isMobile} />
      </div>
    );
  }

  return (
    <div style={{ padding: compact ? '0' : (isMobile ? '14px 16px 48px' : '26px 32px 60px'), maxWidth:1180, margin:'0 auto' }}>
      {!compact && <>
        <Mono size={11} color={VM.ink3} style={{ letterSpacing:'0.04em' }}><b style={{color:VM.ink}}>Supply chain network</b></Mono>
        <div style={{ marginTop:14 }}><Kicker>SUPPLY CHAIN NETWORK · DEPENDENCY MAP</Kicker></div>
        <h1 style={{ fontFamily:VM.serif, fontWeight:700, fontSize: isMobile ? 28 : 38, margin:'8px 0 6px' }}>Dependency map.</h1>
        <p style={{ fontFamily:VM.serif, fontSize:16, color:VM.ink3, margin:'0 0 18px', maxWidth:640 }}>
          Every public company sits between who it <i>depends on</i> and who <i>depends on it</i>. {isMobile ? 'Tap' : 'Hover'} any node for detail, then make it the principle to trace the chain.
        </p>
      </>}

      {/* breadcrumb (drill trail) */}
      <div data-tour="vm-supply-crumbs" style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:14, minHeight:26 }}>
        {renderCrumbs()}
      </div>

      {/* filters */}
      <div data-tour="vm-supply-filters" style={{ display:'flex', alignItems:'center', gap:7, flexWrap:'wrap', marginBottom:6 }}>
        <Label style={{ marginRight:2 }}>Filters:</Label>
        {tab('all','All')}{tab('companies','Companies')}{tab('external','External')}
      </div>

      {/* desktop canvas — 3-column map + SVG connectors (full-screen lives here) */}
      {!isMobile && (
      <div data-tour="vm-supply-canvas" ref={canvasRef} style={{ background:VM.paper, border:`1px solid ${VM.borderSoft}`,
        ...(isFull && fullRect
          ? { position:'fixed', top:fullRect.top, left:fullRect.left, width:fullRect.width, height:fullRect.height, zIndex:30, borderRadius:0, minWidth:0, overflowY:'auto', overflowX:'hidden' }
          : { position:'relative', height: isMobile ? 560 : 500, minWidth:640, marginTop:14, borderRadius:14, overflow:'hidden' }) }}>

        {/* MAP region — the dependency map. In full screen it fills the view above the
            tab bar; selecting a non-map tab stacks that view below it (scroll down). */}
        <div ref={mapRef} style={{ position:'relative', width:'100%',
          height: isFull && fullRect ? Math.max(360, fullRect.height - 48) : '100%' }}>
        {/* full-screen toggle */}
        <button onClick={toggleFull} title={isFull ? 'Exit full screen' : 'Full screen'}
          style={{ position:'absolute', top:10, right:10, zIndex:12, width:30, height:30, borderRadius:7,
            border:`1px solid ${VM.border}`, background:VM.paper, color:VM.ink2, cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', padding:0 }}>
          <i className={'ti ti-' + (isFull ? 'arrows-minimize' : 'arrows-maximize')} style={{ fontSize:16 }}></i>
        </button>

        {/* full screen: filters along the top edge (mirrors the page filters above) */}
        {isFull && (
          <div style={{ position:'absolute', top:0, left:0, right:0, zIndex:11, display:'flex', alignItems:'center', gap:7,
            padding:'8px 50px 8px 16px', background:VM.paper, borderBottom:`1px solid ${VM.borderSoft}` }}>
            <Label style={{ marginRight:2 }}>Filters:</Label>
            {tab('all','All')}{tab('companies','Companies')}{tab('external','External')}
          </div>
        )}

        {/* full screen: drill trail in the top-left (the page-level one is hidden here) */}
        {isFull && (
          <div style={{ position:'absolute', top:52, left:18, zIndex:5, display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
            {renderCrumbs()}
          </div>
        )}

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
        <div data-tour="vm-supply-inputs" style={{ position:'absolute', left:18, width:colW, ...colInset, display:'flex', flexDirection:'column', justifyContent:'center', gap:5 }}>
          <div style={{ fontFamily:VM.mono, fontSize:9, color:VM.ink3, letterSpacing:'0.5px', textTransform:'uppercase' }}>{leftLabel}</div>
          {supGroups.map((g, gi) => {
            const ns = inputs.filter(n => (n.group || (n.cat === 'a' ? 'company' : 'manufacturing')) === g.id);
            if (!ns.length) return null;
            return (
              <React.Fragment key={g.id}>
                <div style={{ fontFamily:VM.mono, fontSize:8, color:VM.faint, textTransform:'uppercase', opacity:.8, marginTop: gi ? 4 : 0 }}>{g.label}</div>
                {ns.map(n => node(n, 'left'))}
              </React.Fragment>
            );
          })}
        </div>

        {/* centre — the principle */}
        <div style={{ position:'absolute', left:'50%', transform:'translateX(-50%)', ...colInset, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div data-tour="vm-supply-principle" ref={principleRef} style={{ width:152, height:152, borderRadius:13, background:VM.forest,
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:14, zIndex:2 }}>
            <div style={{ fontFamily:VM.mono, fontSize:8, color:'#9FE1CB', letterSpacing:'1px', textTransform:'uppercase', marginBottom:5 }}>{data.meta}</div>
            <div style={{ fontFamily:VM.serif, fontSize:19, fontWeight:600, color:'#E1F5EE', lineHeight:1.2 }}>{data.name}</div>
            <div style={{ fontFamily:VM.mono, fontSize:9, color:'#5DCAA5', marginTop:4 }}>{data.ticker} · the principle</div>
          </div>
        </div>

        {/* right column — customers / channels */}
        <div data-tour="vm-supply-customers" style={{ position:'absolute', right:18, width:colW, ...colInset, display:'flex', flexDirection:'column', justifyContent:'center', gap:5 }}>
          <div style={{ fontFamily:VM.mono, fontSize:9, color:VM.ink3, letterSpacing:'0.5px', textTransform:'uppercase', textAlign:'right' }}>{rightLabel}</div>
          {custGroups.map((g, gi) => {
            const ns = customers.filter(n => n.group === g.id);
            if (!ns.length) return null;
            return (
              <React.Fragment key={g.id}>
                <div style={{ fontFamily:VM.mono, fontSize:8, color:VM.faint, textTransform:'uppercase', opacity:.8, marginTop: gi ? 4 : 0, textAlign:'right' }}>{g.label}</div>
                {ns.map(n => node(n, 'right'))}
              </React.Fragment>
            );
          })}
        </div>
        </div>{/* /map region */}

        {/* full screen: dashboard tabs — sit just below the map, and stick to the top
            of the (scrolling) view once you scroll down into the stacked dashboard view. */}
        {isFull && (
          <div style={{ position:'sticky', top:0, zIndex:13, display:'flex', alignItems:'center',
            justifyContent:'center', gap:4, padding:'10px 16px', background:VM.paper,
            borderTop:`1px solid ${VM.borderSoft}`, borderBottom:`1px solid ${VM.borderSoft}`, overflowX:'auto' }}>
            {DASH_TABS.map(t => {
              const here = t === dashTab;
              return (
                <span key={t} onClick={()=> setDashTab(t)}
                  style={{ fontFamily:VM.mono, fontSize:11.5, whiteSpace:'nowrap', padding:'4px 11px', borderRadius:6,
                    cursor:'pointer', color: here ? VM.ink : VM.ink3, fontWeight: here ? 600 : 400,
                    background: here ? VM.paperDeep : 'transparent', border:`1px solid ${here ? VM.border : 'transparent'}` }}>{t}</span>
              );
            })}
          </div>
        )}

        {/* full screen, non-map tab: that dashboard view, stacked below the map.
            Same company, same data (resolveCompany) the dashboard itself uses. */}
        {isFull && dashData && (
          <div style={{ background:VM.paper, borderTop:`1px solid ${VM.borderSoft}`, padding:'20px 30px 80px' }}>
            <Mono size={10} color={VM.terra} weight={700} style={{ display:'block', marginBottom:6 }}>{principleCo.ticker} · {dashTab.toUpperCase()}</Mono>
            {dashTab === 'Overview'   && <DashOverview   c={principleCo} data={dashData} />}
            {dashTab === 'Financials' && <DashFinancials data={dashData.financials} />}
            {dashTab === 'Patents'    && <DashPatents    data={dashData.patents} />}
            {dashTab === 'History'    && <DashHistory    c={principleCo} data={dashData.history} />}
            {dashTab === 'News'       && <DashNews       c={principleCo} go={go} scn={true} />}
          </div>
        )}
      </div>
      )}

      {/* mobile — stacked map: principle on top, then dependencies + customers as
          tap-to-open cards (the desktop canvas/connectors don't fit a phone). */}
      {isMobile && (
        <div style={{ marginTop:14 }}>
          {/* the principle */}
          <div style={{ borderRadius:13, background:VM.forest, padding:'16px 18px', textAlign:'center', marginBottom:18 }}>
            <div style={{ fontFamily:VM.mono, fontSize:8, color:'#9FE1CB', letterSpacing:'1px', textTransform:'uppercase', marginBottom:5 }}>{data.meta}</div>
            <div style={{ fontFamily:VM.serif, fontSize:22, fontWeight:600, color:'#E1F5EE', lineHeight:1.2 }}>{data.name}</div>
            <div style={{ fontFamily:VM.mono, fontSize:9.5, color:'#5DCAA5', marginTop:4 }}>{data.ticker} · the principle</div>
          </div>

          {/* inputs · dependencies */}
          <div style={{ fontFamily:VM.mono, fontSize:10, color:VM.ink3, letterSpacing:'0.5px', textTransform:'uppercase', marginBottom:6 }}>{leftLabel}</div>
          {supGroups.map(g => {
            const ns = inputs.filter(n => (n.group || (n.cat === 'a' ? 'company' : 'manufacturing')) === g.id);
            if (!ns.length) return null;
            return (
              <React.Fragment key={g.id}>
                <div style={{ fontFamily:VM.mono, fontSize:8.5, color:VM.faint, textTransform:'uppercase', opacity:.8, margin:'10px 0 5px' }}>{g.label}</div>
                {ns.map(n => mobileNode(n, 'left'))}
              </React.Fragment>
            );
          })}

          {/* customers · channels */}
          <div style={{ fontFamily:VM.mono, fontSize:10, color:VM.ink3, letterSpacing:'0.5px', textTransform:'uppercase', margin:'22px 0 6px' }}>{rightLabel}</div>
          {custGroups.map(g => {
            const ns = customers.filter(n => n.group === g.id);
            if (!ns.length) return null;
            return (
              <React.Fragment key={g.id}>
                <div style={{ fontFamily:VM.mono, fontSize:8.5, color:VM.faint, textTransform:'uppercase', opacity:.8, margin:'10px 0 5px' }}>{g.label}</div>
                {ns.map(n => mobileNode(n, 'right'))}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* legend */}
      <div data-tour="vm-supply-legend" style={{ display:'flex', gap:16, flexWrap:'wrap', marginTop:10 }}>
        {[['Company (direct)', { borderLeft:`3px solid ${SCN.blue}`, background:VM.paper }],
          ['External factor', { borderLeft:`3px solid ${SCN.coral}`, background:VM.paper }],
          ['The principle', { background:VM.forest, borderRadius:3 }],
          ['Customer / channel', { borderRight:`3px solid ${SCN.cust}`, background:VM.paper }]].map(([lbl, sw]) => (
          <div key={lbl} style={{ display:'flex', alignItems:'center', gap:6, fontFamily:VM.serif, fontSize:11, color:VM.ink3 }}>
            <span style={{ width:11, height:11, border:`1px solid ${VM.border}`, ...sw }}></span>{lbl}
          </div>
        ))}
        {!isMobile && <span style={{ marginLeft:'auto', fontFamily:VM.mono, fontSize:9.5, color:VM.faint }}>stroke = dependency strength · colour = relationship</span>}
      </div>
    </div>
  );
}

Object.assign(window, { ScnLiveDemo });
