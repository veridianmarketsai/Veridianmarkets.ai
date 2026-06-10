// Veridian Markets — My Portfolio.
// Sections (top→bottom):
//   1. Connect accounts
//   2. Learn progress
//   3. Portfolio summary (KPIs + performance chart)
//   4. Risk & trajectory (donut + table)
//   5. Holdings
//   6. Portfolio supply chain
const { useState: useStateMP, useEffect: useEffectMP, useMemo: useMemoMP } = React;

// ── helpers ───────────────────────────────────────────────────────────────────
const num     = s => parseFloat(String(s).replace(/[^0-9.\-]/g,'')) || 0;
const pctNum  = s => parseFloat(String(s).replace(/[^0-9.\-]/g,'')) || 0;
const money   = (n, dec=0) => '$' + Number(n).toLocaleString('en-US',{minimumFractionDigits:dec,maximumFractionDigits:dec});
const signPct = n => (n>=0?'+':'')+n.toFixed(2)+'%';
function walk(seed,n,drift=0){
  const out=[]; let y=0.5;
  for(let i=0;i<n;i++){y+=Math.sin(i*0.6+seed)*0.06+(((seed*9301+i*49297)%233280)/233280-0.5)*0.07+drift;y=Math.max(0.06,Math.min(0.94,y));out.push(y);}
  return out;
}
function linePath(vals,w,h,pad=4){
  const mn=Math.min(...vals),mx=Math.max(...vals),rng=(mx-mn)||1;
  return vals.map((v,i)=>`${i?'L':'M'} ${(i/(vals.length-1))*w} ${pad+(1-(v-mn)/rng)*(h-pad*2)}`).join(' ');
}

// ── mock data ─────────────────────────────────────────────────────────────────
const PF_HOLDINGS_RAW = [
  { ticker:'AAPL', shares:120, avg:181.40 }, { ticker:'MSFT', shares:60,  avg:301.20 },
  { ticker:'NVDA', shares:25,  avg:512.00 }, { ticker:'AMZN', shares:80,  avg:139.10 },
  { ticker:'GOOGL',shares:90,  avg:131.80 }, { ticker:'JPM',  shares:70,  avg:184.50 },
  { ticker:'V',    shares:40,  avg:232.00 },
];
const PF_CASH = 18450;

const PF_RISK = {
  AAPL: { tier:'medium', score:2, note:'China ops · EU DMA regulatory exposure'    },
  MSFT: { tier:'low',    score:1, note:'Diversified cloud revenue · strong moat'   },
  NVDA: { tier:'high',   score:3, note:'AI cycle · valuation · export controls'    },
  AMZN: { tier:'low',    score:1, note:'AWS dominance · consumer diversification'  },
  GOOGL:{ tier:'medium', score:2, note:'Search disruption risk · antitrust'        },
  JPM:  { tier:'medium', score:2, note:'Rate sensitivity · credit cycle exposure'  },
  V:    { tier:'low',    score:1, note:'Payment rails moat · low capex'            },
};
const RISK_COLOR = { high:VM.down, medium:VM.terra, low:VM.up };
const RISK_BG    = { high:'rgba(192,86,59,0.10)', medium:'rgba(196,106,59,0.10)', low:'rgba(29,158,117,0.10)' };

const PF_BROKERS = [
  { id:'t212', name:'Trading 212',         icon:'trending-up',    color:'#1E5BD6', featured:true },
  { id:'ibkr', name:'Interactive Brokers', icon:'building-bank',  color:'#A8512A' },
  { id:'rh',   name:'Robinhood',           icon:'feather',        color:'#1D9E75' },
  { id:'cb',   name:'Coinbase',            icon:'currency-bitcoin',color:'#185FA5' },
  { id:'vg',   name:'Vanguard',            icon:'shield-half',    color:'#7A1F2B' },
  { id:'bin',  name:'Binance',             icon:'coin',           color:'#C49A3B' },
];
const PF_BROKERS_KEY = 'vm_pf_brokers';

const LEARN_PROGRESS = {
  course:   'Using Veridian Markets',
  module:   'Reading a supply chain map',
  pct:      62,
  next:     'How to drill down from the principle company',
  timeLeft: '12 min left',
  streak:   4,
  done:     3,
  total:    11,
};

const PF_RANGES = { '1W':7,'1M':24,'3M':36,'1Y':52,'5Y':60,'MAX':72 };

const PF_STEPS = [
  { sel:'[data-tour="vm-pf-connect"]',
    title:'Connect a broker.',
    body:'Link a brokerage account to import your holdings automatically. Click any card to connect or disconnect. Veridian requests read-only access only — it cannot place trades or move funds on your behalf.' },
  { sel:'[data-tour="vm-pf-learning"]',
    title:'Your learning progress.',
    body:'Picks up where you left off. The progress bar tracks your current module; the streak counter shows consecutive days of activity. Hit Continue to go straight back in, or go to the Learn page to browse all courses.' },
  { sel:'[data-tour="vm-pf-overview"]',
    title:'Portfolio summary.',
    body:'Total value, today\'s change, total return since cost basis, and available cash on the left. The performance chart on the right shows the full portfolio trajectory — switch time ranges to zoom into a specific period.' },
  { sel:'[data-tour="vm-pf-risk"]',
    title:'Risk and trajectory.',
    body:'Holdings are bucketed into Low, Medium, and High risk tiers. The donut shows concentration by position value — a large slice in High means your biggest positions carry the most risk. The notes column explains the specific exposure for each holding.' },
  { sel:'[data-tour="vm-pf-holdings"]',
    title:'Holdings.',
    body:'Each row shows shares, current price, position value, today\'s move, portfolio weight, and risk tier. Click any row to open that company\'s full dashboard — financials, supply chain, patents, and history.' },
  { sel:'[data-tour="vm-pf-scn"]',
    title:'Portfolio supply chain.',
    body:'Select any holding to load its dependency map. See who it buys from and who it sells to — and how that overlaps across your other positions. Add any ticker to the view even if it\'s not in your portfolio.' },
];

// ── main component ────────────────────────────────────────────────────────────
function MyPortfolio({ go, user, isMobile }) {
  const [tutorialOpen, setTutorialOpen] = useStateMP(false);
  const [connected, setConnected] = useStateMP(() => {
    try { return new Set(JSON.parse(localStorage.getItem(PF_BROKERS_KEY))||[]); } catch { return new Set(); }
  });
  useEffectMP(()=>{ try{localStorage.setItem(PF_BROKERS_KEY,JSON.stringify([...connected]));}catch{} },[connected]);
  const toggleBroker = id => setConnected(s=>{ const n=new Set(s); n.has(id)?n.delete(id):n.add(id); return n; });

  const pf = useMemoMP(()=>{
    const rows = PF_HOLDINGS_RAW.map(h=>{
      const c = VM_COMPANIES.find(x=>x.ticker===h.ticker)||{};
      const price=num(c.price), value=price*h.shares, cost=h.avg*h.shares, dayPct=pctNum(c.chg);
      const risk = PF_RISK[h.ticker] || { tier:'medium', score:2, note:'—' };
      return {...h, name:c.name||h.ticker, sector:c.sector||'—', dir:c.dir, price, value, cost,
        pl:value-cost, plPct:((value-cost)/cost)*100, dayPct, dayChg:value*dayPct/100, risk };
    });
    const invested = rows.reduce((s,r)=>s+r.value,0);
    const total    = invested+PF_CASH;
    rows.forEach(r=>{ r.weight=(r.value/invested)*100; });
    const dayChg    = rows.reduce((s,r)=>s+r.dayChg,0);
    const totalCost = rows.reduce((s,r)=>s+r.cost,0);
    const totalPL   = invested-totalCost;
    // risk donut slices
    const riskSlices = rows.map(r=>({ label:r.ticker, value:r.value, color:RISK_COLOR[r.risk.tier]||VM.faint }));
    return { rows, invested, total, dayChg, dayPct:dayChg/invested*100, totalPL, totalPLPct:totalPL/totalCost*100, riskSlices };
  },[]);

  return (
    <div style={{ padding: isMobile?'16px 16px 88px':'26px 32px 72px', maxWidth:1180, margin:'0 auto' }}>

      {/* header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
        <div>
          <Kicker>Your account</Kicker>
          <h1 style={{ fontFamily:VM.serif, fontWeight:700, fontSize:isMobile?27:32, lineHeight:1.05, margin:'8px 0 0' }}>My Account.</h1>
          {user && <div style={{ fontFamily:VM.serif, fontSize:14, color:VM.ink3, marginTop:4 }}>Signed in as <strong style={{color:VM.ink2}}>{user.name||user.email}</strong></div>}
        </div>
        <button onClick={()=>setTutorialOpen(true)} title="Interactive tutorial — learn this page"
          style={{ display:'inline-flex', alignItems:'center', gap:6, fontFamily:VM.mono, fontSize:10,
            letterSpacing:'0.04em', textTransform:'uppercase', padding:'4px 11px', borderRadius:5, flexShrink:0, marginTop:8,
            border:`1px solid ${VM.terra}`, background:'transparent', color:VM.terra, cursor:'pointer' }}>
          <i className="ti ti-graduation-cap" style={{ fontSize:12 }}></i>Tutorial
        </button>
      </div>

      {/* ── 1. Connect accounts ─────────────────────────────────────────── */}
      <PfSection title="Connect accounts" icon="plug-connected" dataTour="vm-pf-connect" style={{ marginTop:24 }}>
        <div style={{ display:'grid', gridTemplateColumns:`repeat(auto-fill, minmax(${isMobile?'100%':'200px'},1fr))`, gap:10 }}>
          {PF_BROKERS.map(b=><BrokerButton key={b.id} b={b} on={connected.has(b.id)} onToggle={()=>toggleBroker(b.id)} />)}
          <button onClick={()=>alert('Additional broker connections arrive with the backend.')}
            style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'12px 14px',
              cursor:'pointer', border:`1px dashed ${VM.border}`, borderRadius:10, background:'transparent',
              color:VM.ink2, fontFamily:VM.serif, fontSize:14 }}>
            <i className="ti ti-plus" style={{fontSize:16}}></i>Add account
          </button>
        </div>
        {connected.size > 0 && (
          <Mono size={10} color={VM.upInk} style={{ display:'block', marginTop:10 }}>
            <i className="ti ti-circle-check-filled" style={{fontSize:11,marginRight:4}}></i>
            {connected.size} account{connected.size>1?'s':''} linked · data sync coming with backend
          </Mono>
        )}
      </PfSection>

      {/* ── 2. Learn progress ───────────────────────────────────────────── */}
      <PfSection title="Learning" icon="school" dataTour="vm-pf-learning" style={{ marginTop:18 }}>
        <div style={{ display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
          <div style={{ flex:1, minWidth:240 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6 }}>
              <div>
                <Mono size={9.5} color={VM.terra} weight={700} style={{ letterSpacing:'0.06em' }}>{LEARN_PROGRESS.course.toUpperCase()}</Mono>
                <div style={{ fontFamily:VM.serif, fontWeight:600, fontSize:15, color:VM.ink, marginTop:2 }}>{LEARN_PROGRESS.module}</div>
              </div>
              <Mono size={10} color={VM.ink3}>{LEARN_PROGRESS.timeLeft}</Mono>
            </div>
            <div style={{ height:6, background:VM.paperDeep, borderRadius:3, overflow:'hidden', marginBottom:6 }}>
              <div style={{ width:`${LEARN_PROGRESS.pct}%`, height:'100%', background:VM.teal, borderRadius:3 }}></div>
            </div>
            <div style={{ display:'flex', flexDirection: isMobile?'column':'row', justifyContent:'space-between', alignItems: isMobile?'flex-start':'center', gap: isMobile?2:0 }}>
              <Mono size={10} color={VM.ink3}>{LEARN_PROGRESS.pct}% · Next: {LEARN_PROGRESS.next}</Mono>
              <Mono size={10} color={VM.ink3}>{LEARN_PROGRESS.done}/{LEARN_PROGRESS.total} modules</Mono>
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8, alignItems:'flex-end', flexShrink:0 }}>
            <Btn solid onClick={()=>go('learn')} style={{ fontSize:13, padding:'8px 16px', whiteSpace:'nowrap' }}>
              <i className="ti ti-player-play" style={{fontSize:13}}></i> Continue
            </Btn>
            <Mono size={10} color={VM.teal}>
              <i className="ti ti-flame" style={{fontSize:11,marginRight:3}}></i>
              {LEARN_PROGRESS.streak}-day streak
            </Mono>
          </div>
        </div>
      </PfSection>

      {/* ── 3. Portfolio summary ────────────────────────────────────────── */}
      <div data-tour="vm-pf-overview" style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1.6fr', gap:18, marginTop:18 }}>
        <PfSection title="Summary" icon="wallet">
          <PfKPIs pf={pf} />
        </PfSection>
        <PfSection title="Performance" icon="chart-line">
          <PfPerformance pf={pf} />
        </PfSection>
      </div>

      {/* ── 4. Risk & trajectory ────────────────────────────────────────── */}
      <PfSection title="Risk & trajectory" icon="shield-half" dataTour="vm-pf-risk" style={{ marginTop:18 }}>
        <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'200px 1fr', gap:24, alignItems:'start' }}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
            <RiskDonut slices={pf.riskSlices} />
            <div style={{ display:'flex', gap:12 }}>
              {[['low','Low'],['medium','Medium'],['high','High']].map(([tier,lbl])=>(
                <div key={tier} style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <span style={{ width:8, height:8, borderRadius:2, background:RISK_COLOR[tier] }}></span>
                  <Mono size={9.5} color={VM.ink3}>{lbl}</Mono>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'repeat(3,1fr)', gap:8, marginBottom:14 }}>
              {['high','medium','low'].map(tier=>{
                const holdings = pf.rows.filter(r=>r.risk.tier===tier);
                return (
                  <div key={tier} style={{ background:RISK_BG[tier], border:`1px solid ${RISK_COLOR[tier]}33`, borderRadius:10, padding:'10px 12px' }}>
                    <Mono size={9} weight={700} color={RISK_COLOR[tier]} style={{ letterSpacing:'0.07em', textTransform:'uppercase', display:'block', marginBottom:6 }}>{tier} risk</Mono>
                    {holdings.length===0
                      ? <Mono size={10} color={VM.ink3}>None</Mono>
                      : holdings.map(r=>(
                          <div key={r.ticker} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'3px 0', borderBottom:`1px dotted ${VM.borderHair}` }}>
                            <Mono size={11} weight={700}>{r.ticker}</Mono>
                            <Chg dir={r.dayPct>=0?'up':'down'}>{signPct(r.dayPct)}</Chg>
                          </div>
                        ))
                    }
                  </div>
                );
              })}
            </div>
            <div>
              <Mono size={9.5} color={VM.ink3} weight={600} style={{ display:'block', marginBottom:8, letterSpacing:'0.05em', textTransform:'uppercase' }}>Risk notes</Mono>
              {pf.rows.sort((a,b)=>b.risk.score-a.risk.score).map((r,i)=>(
                <div key={r.ticker} style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'5px 0', borderBottom:`1px dotted ${VM.borderHair}` }}>
                  <span style={{ width:6, height:6, borderRadius:999, background:RISK_COLOR[r.risk.tier], flexShrink:0, marginTop:5 }}></span>
                  <Mono size={11} weight={700} style={{ minWidth:42 }}>{r.ticker}</Mono>
                  <span style={{ fontFamily:VM.serif, fontSize:12, color:VM.ink3, flex:1 }}>{r.risk.note}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PfSection>

      {/* ── 5. Holdings ─────────────────────────────────────────────────── */}
      <PfSection title="Holdings" icon="list" dataTour="vm-pf-holdings" style={{ marginTop:18 }}>
        <PfHoldings pf={pf} go={go} isMobile={isMobile} />
      </PfSection>

      {/* ── 6. Portfolio supply chain ────────────────────────────────────── */}
      <PfSection title="Portfolio supply chain" icon="affiliate" dataTour="vm-pf-scn" style={{ marginTop:18 }}>
        <PortfolioScn pf={pf} />
      </PfSection>

      {tutorialOpen && <TutorialOverlay steps={PF_STEPS} label="My Account tutorial" onClose={()=>setTutorialOpen(false)} />}

    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function PfSection({ title, icon, children, style, dataTour }) {
  return (
    <div data-tour={dataTour} style={{ background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:14, overflow:'hidden', ...style }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 16px', borderBottom:`1px solid ${VM.borderHair}` }}>
        {icon && <i className={`ti ti-${icon}`} style={{ fontSize:14, color:VM.teal }}></i>}
        <Mono size={9.5} weight={700} color={VM.ink3} style={{ letterSpacing:'0.1em', textTransform:'uppercase' }}>{title}</Mono>
      </div>
      <div style={{ padding:'14px 16px 16px' }}>{children}</div>
    </div>
  );
}

// ── Broker buttons ────────────────────────────────────────────────────────────
function BrokerButton({ b, on, onToggle }) {
  const [hover, setHover] = useStateMP(false);
  return (
    <button onClick={onToggle} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{ display:'flex', alignItems:'center', gap:11, padding:'11px 13px', cursor:'pointer', textAlign:'left',
        border:`1.5px solid ${on?VM.up:(hover?VM.border:VM.borderSoft)}`, borderRadius:10,
        background: on?VM.tealTint:(hover?VM.paperWarm:VM.paper), transition:'all .14s ease' }}>
      <span style={{ width:32, height:32, borderRadius:8, flexShrink:0, background:b.color, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <i className={`ti ti-${b.icon}`} style={{fontSize:17}}></i>
      </span>
      <span style={{ flex:1, minWidth:0 }}>
        <span style={{ display:'block', fontFamily:VM.serif, fontWeight:600, fontSize:14, color:VM.ink, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{b.name}</span>
        <span style={{ display:'flex', alignItems:'center', gap:4, fontFamily:VM.mono, fontSize:9.5, color:on?VM.upInk:VM.ink3 }}>
          {on ? <><i className="ti ti-circle-check-filled" style={{fontSize:11}}></i>Connected</>
              : <>{b.featured?'Recommended · Connect':'Connect'}</>}
        </span>
      </span>
      {b.featured&&!on && <span style={{ fontFamily:VM.mono, fontSize:8, fontWeight:700, letterSpacing:'0.05em', color:VM.paperWarm, background:VM.forest, borderRadius:4, padding:'2px 5px' }}>★</span>}
    </button>
  );
}

// ── KPIs ──────────────────────────────────────────────────────────────────────
function PfKPIs({ pf }) {
  const kpis = [
    { label:'Total value',    value:money(pf.total)  },
    { label:'Today',          value:(pf.dayChg>=0?'+':'')+money(pf.dayChg), dir:pf.dayChg>=0?'up':'down', extra:signPct(pf.dayPct) },
    { label:'Total return',   value:(pf.totalPL>=0?'+':'')+money(pf.totalPL), dir:pf.totalPL>=0?'up':'down', extra:signPct(pf.totalPLPct) },
    { label:'Cash available', value:money(PF_CASH), sub:'Buying power' },
  ];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {kpis.map((k,i)=>(
        <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', padding:'4px 0', borderBottom:i<kpis.length-1?`1px dotted ${VM.border}`:'none' }}>
          <Label>{k.label}</Label>
          <div style={{ textAlign:'right' }}>
            <Mono size={16} weight={700} color={k.dir==='down'?VM.downInk:(k.dir==='up'?VM.upInk:VM.ink)}>{k.value}</Mono>
            {k.extra && <div><Chg dir={k.dir}>{k.extra}</Chg></div>}
            {k.sub   && <div><Mono size={10} color={VM.ink3}>{k.sub}</Mono></div>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Performance chart ─────────────────────────────────────────────────────────
function PfPerformance({ pf }) {
  const [range, setRange] = useStateMP('1Y');
  const n    = PF_RANGES[range];
  const vals = useMemoMP(()=>walk(range.length+n,n,0.012),[range]);
  const w=700, h=140;
  const change = ((vals[vals.length-1]-vals[0])/(vals[0]||1))*100;
  const up  = change>=0;
  const col = up?VM.up:VM.down, ink=up?VM.upInk:VM.downInk;
  const lp  = linePath(vals,w,h);
  return (
    <div>
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:8, marginBottom:10 }}>
        <div>
          <Mono size={22} weight={700} color={VM.ink}>{money(pf.total)}</Mono>
          <div style={{ marginTop:2 }}><Chg dir={up?'up':'down'}>{(up?'▲ ':'▼ ')+signPct(change)}</Chg> <Mono size={10} color={VM.ink3}>over {range}</Mono></div>
        </div>
        <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
          {Object.keys(PF_RANGES).map(r=>(
            <button key={r} onClick={()=>setRange(r)} style={{ fontFamily:VM.mono, fontSize:10, padding:'4px 9px', borderRadius:6, cursor:'pointer',
              border:`1px solid ${range===r?VM.forest:VM.border}`, background:range===r?VM.forest:VM.paper, color:range===r?VM.paperWarm:VM.ink2 }}>{r}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width:'100%', height:140, display:'block' }}>
        <defs><linearGradient id="pfg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={col} stopOpacity="0.18"/><stop offset="100%" stopColor={col} stopOpacity="0"/>
        </linearGradient></defs>
        {[0.25,0.5,0.75].map(g=><line key={g} x1="0" y1={g*h} x2={w} y2={g*h} stroke={VM.borderHair} strokeWidth="1" strokeDasharray="2 6"/>)}
        <path d={`${lp} L ${w} ${h} L 0 ${h} Z`} fill="url(#pfg)"/>
        <path d={lp} fill="none" stroke={ink} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round"/>
      </svg>
    </div>
  );
}

// ── Risk donut ────────────────────────────────────────────────────────────────
function RiskDonut({ slices }) {
  const size=180, thick=22, r=(size-thick)/2, c=2*Math.PI*r;
  const total = slices.reduce((s,d)=>s+d.value,0)||1;
  let acc=0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`rotate(-90 ${size/2} ${size/2})`}>
        {slices.map((d,i)=>{
          const len=(d.value/total)*c, off=-acc; acc+=len;
          return <circle key={i} cx={size/2} cy={size/2} r={r} fill="none" stroke={d.color} strokeWidth={thick}
            strokeDasharray={`${len} ${c-len}`} strokeDashoffset={off}/>;
        })}
      </g>
      <text x="50%" y="44%" textAnchor="middle" style={{fontFamily:VM.mono,fontSize:9,fill:VM.ink3,letterSpacing:'0.06em'}}>BY RISK</text>
      <text x="50%" y="58%" textAnchor="middle" style={{fontFamily:VM.mono,fontWeight:700,fontSize:22,fill:VM.ink}}>{slices.length}</text>
      <text x="50%" y="70%" textAnchor="middle" style={{fontFamily:VM.mono,fontSize:9,fill:VM.ink3}}>positions</text>
    </svg>
  );
}

// ── Holdings table ────────────────────────────────────────────────────────────
function PfHoldings({ pf, go, isMobile }) {
  return (
    <div>
      {!isMobile && (
        <div style={{ display:'grid', gridTemplateColumns:'1.6fr 0.7fr 0.9fr 1fr 0.8fr 1.1fr 0.7fr', gap:8, padding:'0 4px 8px', borderBottom:`1px solid ${VM.borderSoft}` }}>
          {['Holding','Shares','Price','Value','Today','Weight','Risk'].map((h,i)=>(
            <Label key={h} style={{ textAlign:i>0?'right':'left' }}>{h}</Label>
          ))}
        </div>
      )}
      {pf.rows.map((r,i)=>{
        const c = VM_COMPANIES.find(x=>x.ticker===r.ticker);
        if(isMobile) return (
          <div key={r.ticker} onClick={()=>c&&go('dashboard',c)}
            style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:10,
              padding:'11px 2px', cursor:'pointer', borderBottom:i<pf.rows.length-1?`1px dotted ${VM.border}`:'none' }}>
            <div>
              <span style={{ fontFamily:VM.serif, fontWeight:700, fontSize:16 }}>{r.ticker}</span>
              <div><Mono size={10} color={VM.ink3}>{r.shares} sh · {r.weight.toFixed(0)}%</Mono></div>
            </div>
            <div style={{ textAlign:'right' }}>
              <Mono size={13} weight={700}>{money(r.value)}</Mono>
              <div><Chg dir={r.dayPct>=0?'up':'down'}>{signPct(r.dayPct)}</Chg></div>
            </div>
          </div>
        );
        return (
          <div key={r.ticker} onClick={()=>c&&go('dashboard',c)}
            style={{ display:'grid', gridTemplateColumns:'1.6fr 0.7fr 0.9fr 1fr 0.8fr 1.1fr 0.7fr', gap:8, alignItems:'center',
              padding:'11px 4px', cursor:'pointer', borderBottom:i<pf.rows.length-1?`1px dotted ${VM.border}`:'none' }}>
            <div>
              <span style={{ fontFamily:VM.serif, fontWeight:700, fontSize:15 }}>{r.ticker}</span>{' '}
              <Mono size={10} color={VM.ink3}>{r.name}</Mono>
            </div>
            <Mono size={12} color={VM.ink2} style={{ textAlign:'right' }}>{r.shares}</Mono>
            <Mono size={12} weight={600} style={{ textAlign:'right' }}>${r.price.toFixed(2)}</Mono>
            <Mono size={12} weight={700} style={{ textAlign:'right' }}>{money(r.value)}</Mono>
            <span style={{ textAlign:'right' }}><Chg dir={r.dayPct>=0?'up':'down'}>{signPct(r.dayPct)}</Chg></span>
            <div style={{ display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end' }}>
              <div style={{ flex:1, maxWidth:60 }}><ProgressBar v={r.weight}/></div>
              <Mono size={11} color={VM.ink2} style={{ minWidth:32, textAlign:'right' }}>{r.weight.toFixed(0)}%</Mono>
            </div>
            <div style={{ textAlign:'right' }}>
              <span style={{ fontFamily:VM.mono, fontSize:9, fontWeight:700, color:RISK_COLOR[r.risk.tier], letterSpacing:'0.05em', textTransform:'uppercase' }}>{r.risk.tier}</span>
            </div>
          </div>
        );
      })}
      <div style={{ marginTop:10, paddingTop:10, borderTop:`1px solid ${VM.borderHair}`, display:'flex', justifyContent:'space-between' }}>
        <Label>Cash</Label>
        <Mono size={13} weight={700}>{money(PF_CASH)}</Mono>
      </div>
    </div>
  );
}

// ── Portfolio supply chain ────────────────────────────────────────────────────
function PortfolioScn({ pf }) {
  const tickers  = pf.rows.map(r=>r.ticker);
  const [active, setActive] = useStateMP(tickers[0]||'AAPL');
  const [input,  setInput]  = useStateMP('');
  const [extra,  setExtra]  = useStateMP([]);

  function addTicker() {
    const t = input.trim().toUpperCase();
    if(!t || extra.includes(t) || tickers.includes(t)) { setInput(''); return; }
    setExtra(e=>[...e,t]);
    setInput('');
  }

  const all = [...tickers, ...extra];

  return (
    <div>
      <p style={{ fontFamily:VM.serif, fontSize:14, color:VM.ink3, margin:'0 0 14px', maxWidth:560 }}>
        Select a holding to explore its dependency map. Add any company to see how it connects to your portfolio.
      </p>

      {/* holding selector */}
      <div style={{ display:'flex', gap:7, flexWrap:'wrap', marginBottom:16 }}>
        {all.map(t=>(
          <button key={t} onClick={()=>setActive(t)} style={{
            fontFamily:VM.mono, fontSize:11, padding:'5px 12px', borderRadius:999, cursor:'pointer',
            border:`1px solid ${active===t?VM.forest:VM.border}`,
            background: active===t?VM.forest:VM.paper, color: active===t?VM.paperWarm:VM.ink2,
          }}>{t}{extra.includes(t) && <span style={{marginLeft:6, opacity:0.6}} onClick={e=>{e.stopPropagation();setExtra(x=>x.filter(i=>i!==t));if(active===t)setActive(tickers[0]);}}> ×</span>}</button>
        ))}
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          <input value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&addTicker()}
            placeholder="Add ticker…"
            style={{ fontFamily:VM.mono, fontSize:11, padding:'5px 12px', borderRadius:999,
              border:`1px solid ${VM.border}`, background:VM.paper, outline:'none', color:VM.ink, width:110 }} />
          <Btn onClick={addTicker} style={{ padding:'5px 12px', fontSize:12 }}>Add</Btn>
        </div>
      </div>

      {/* SCN canvas */}
      <ScnLiveDemo compact={true} initialTicker={active} key={active} />
    </div>
  );
}

Object.assign(window, { MyPortfolio });
