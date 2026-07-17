// Veridian Markets — Company dashboard.
// resolveCompany() is called once here; all tabs receive data as props.
// No tab reads VM_COMPANY_DATA or any VM_ global directly.
function Dashboard({ company, go, isMobile, trail, tab, onTabChange }) {
  const c    = company || VM_COMPANIES[0];
  const data = resolveCompany(c.ticker);
  // A ticker reached via symbol search may not be one of our curated companies.
  // For those we still show the real live price (header) + as-reported financials,
  // but the mock-only tabs get an honest "not yet available" placeholder instead
  // of another company's data (resolveCompany falls back to AAPL for unknowns).
  const known = typeof VM_COMPANY_DATA !== 'undefined' && !!VM_COMPANY_DATA[c.ticker];
  const EMPTY_FIN = { periods:[], income:[], balance:[], cashflow:[] };
  // Tab is lifted to the app so the breadcrumb trail can record it; fall back to
  // local state if a parent doesn't supply it.
  const [tabLocal, setTabLocal] = React.useState('Overview');
  const curTab = tab || tabLocal;
  const setTab = onTabChange || setTabLocal;

  return (
    <div style={{ padding: isMobile ? '16px 14px 80px' : '22px 32px 60px', maxWidth:1180, margin:'0 auto', overflowX: isMobile ? 'hidden' : 'visible' }}>
      <CompanyHead c={c} tab={curTab} onTabChange={setTab} go={go} isMobile={isMobile} trail={trail} />

      {curTab === 'Overview'     && (known ? <DashOverview   c={c} data={data} isMobile={isMobile} /> : <TabUnavailable ticker={c.ticker} what="Company profile" />)}
      {curTab === 'Supply chain' && (known ? <DashScn        c={c} go={go} isMobile={isMobile} /> : <TabUnavailable ticker={c.ticker} what="Supply-chain map" />)}
      {curTab === 'Financials'   && <DashFinancials data={known ? data.financials : EMPTY_FIN} c={c} isMobile={isMobile} />}
      {curTab === 'Patents'      && (known ? <DashPatents    data={data.patents} isMobile={isMobile} /> : <TabUnavailable ticker={c.ticker} what="Patent portfolio" />)}
      {curTab === 'History'      && (known ? <DashHistory    c={c} data={data.history} isMobile={isMobile} /> : <TabUnavailable ticker={c.ticker} what="Historical analogues" />)}
      {curTab === 'News'         && (known ? <DashNews        c={c} go={go} isMobile={isMobile} /> : <TabUnavailable ticker={c.ticker} what="Company news" />)}
    </div>
  );
}

// Honest empty state for a searched-but-not-curated ticker: live price + real
// financials are available elsewhere; this mock-only tab has no data yet.
function TabUnavailable({ ticker, what }) {
  return (
    <div style={{ marginTop:36, border:`1px solid ${VM.borderSoft}`, borderRadius:12, background:VM.paper, padding:'48px 24px', textAlign:'center' }}>
      <i className="ti ti-file-search" style={{ fontSize:30, color:VM.ink3 }}></i>
      <div style={{ fontFamily:VM.serif, fontWeight:700, fontSize:18, color:VM.ink, marginTop:14 }}>{what} not yet available</div>
      <div style={{ fontFamily:VM.serif, fontSize:14, color:VM.ink3, marginTop:8, maxWidth:440, margin:'8px auto 0', lineHeight:1.6 }}>
        <b>{ticker}</b> isn’t one of our curated companies yet. Its <b>live price</b> (header) and
        <b> as-reported financials</b> (Financials tab) are available — the rest is coming.
      </div>
    </div>
  );
}

const TUTORIAL_BTN_STYLE = {
  display:'inline-flex', alignItems:'center', gap:6, fontFamily:VM.mono, fontSize:10,
  letterSpacing:'0.04em', textTransform:'uppercase', padding:'4px 11px', borderRadius:5,
  border:`1px solid ${VM.terra}`, background:'transparent', color:VM.terra, cursor:'pointer',
};

// ── News ──────────────────────────────────────────────────────────────────────
// Company-specific news; reuses the News page's card + article overlay.

const NEWS_STEPS = [
  { sel:'[data-tour="vm-news-header"]',
    title:'Stories read through history.',
    body:'This tab surfaces news about the company filtered and framed by historical context — not a raw feed. Each story is tagged to the part of the supply chain it touches: the principal, upstream inputs, or downstream customers.' },
  { sel:'[data-tour="vm-news-first-card"]',
    title:'Anatomy of a card.',
    body:'The terra kicker tells you which part of the chain or theme this story touches. Headline and summary give you the signal. Source and time are bottom-left. The teal ticker badge (if present) links to that company\'s dashboard — click it to jump.' },
  { sel:'[data-tour="vm-news-grid"]',
    title:'The full feed.',
    body:'Cards are ordered most-recent first. Click any card to open the full article in an overlay. The overlay includes a "View dashboard" link for any company mentioned — so you can move from a news signal straight into the financials or supply chain without losing context.' },
];
// In the dependency-map context (scn=true) it gains a two-tier filter that mirrors
// the map: two key sides (Upstream supply / Customers demand), each with
// sub-categories. (Mock data — these tags will come from the database later.)
const DNEWS_GROUPS = [
  { id: 'up',   label: 'Upstream',  subs: [
    { id: 'principal',     label: 'Principal news' },
    { id: 'manufacturing', label: 'Manufacturing' },
    { id: 'commodity',     label: 'Commodity' },
    { id: 'materials',     label: 'Materials' },
    { id: 'geopolitics',   label: 'Geopolitics' },
  ] },
  { id: 'down', label: 'Customers', subs: [
    { id: 'carriers',     label: 'Mobile carriers' },
    { id: 'retail',       label: 'Electronics retail' },
    { id: 'warehouse',    label: 'Warehouse clubs' },
    { id: 'online',       label: 'Online resellers' },
    { id: 'distributors', label: 'Distributors' },
  ] },
];
const DNEWS_ITEMS = [
  // upstream · principal
  { side:'up', sub:'principal', cat:'Principal', kicker:'AAPL · ANALOGUE', source:'The Ledger', time:'4h ago', ticker:'AAPL',
    headline:"Apple's services pivot draws the MSFT-2014 comparison again.", summary:'Capital-light, margin-expanding, re-rating slowly — the closest historical match still reads constructive, with caveats on China.' },
  { side:'up', sub:'principal', cat:'Principal', kicker:'AAPL · PRODUCT', source:'Veridian', time:'9h ago', ticker:'AAPL',
    headline:'The iPhone cycle lengthens — echoes of the 2016 plateau.', summary:'Upgrade cadence stretches as the installed base matures; the install-base annuity is the story, not unit growth.' },
  // upstream · manufacturing
  { side:'up', sub:'manufacturing', cat:'Manufacturing', kicker:'TSM · FOUNDRY', source:'Veridian', time:'5h ago', ticker:'TSM',
    headline:"TSMC's 2nm ramp tightens the leading-edge supply.", summary:"Capacity is spoken for years out; pricing power sits upstream. The fabless model's oldest dependency, revisited." },
  { side:'up', sub:'manufacturing', cat:'Manufacturing', kicker:'FOXCONN · ASSEMBLY', source:'The Ledger', time:'11h ago', ticker:'2317.TW',
    headline:'Foxconn shifts more assembly to India.', summary:'Diversification away from a single geography — slow, costly, strategically overdue. A 1990s-style supply migration.' },
  { side:'up', sub:'manufacturing', cat:'Logistics', kicker:'MAERSK · FREIGHT', source:'Bretton House', time:'1d ago', ticker:'MAERSK',
    headline:'Container rates spike as Red Sea reroutes persist.', summary:'Longer routes, higher costs — logistics re-enters the margin conversation the way it did in 2021.' },
  // upstream · commodity
  { side:'up', sub:'commodity', cat:'Commodity', kicker:'OIL · 5-YEAR LENS', source:'Veridian', time:'2h ago', ticker:'XOM',
    headline:'Oil at $78 feeds into freight and input costs.', summary:'Energy is the quiet variable in every hardware bill of materials. Past spikes were less dramatic than the headlines.' },
  // upstream · materials
  { side:'up', sub:'materials', cat:'Materials', kicker:'RARE EARTH · MP', source:'Bretton House', time:'7h ago', ticker:'MP',
    headline:'Rare-earth magnets back in the policy crosshairs.', summary:'Concentrated supply, strategic demand — the materials layer is where geopolitics meets the bill of materials.' },
  { side:'up', sub:'materials', cat:'Materials', kicker:'LITHIUM · ALB', source:'Veridian', time:'13h ago', ticker:'ALB',
    headline:'Lithium prices base after a brutal de-stocking.', summary:'The cure for low prices is low prices; the cycle rhymes with past commodity troughs.' },
  // upstream · geopolitics
  { side:'up', sub:'geopolitics', cat:'Geopolitics', kicker:'CHINA · EXPORT CONTROLS', source:'Bretton House', time:'3h ago',
    headline:'New chip export controls ripple up the supply chain.', summary:'Each tightening reshapes where things get made. The cost is paid in inventory and lead times, not headlines.' },
  { side:'up', sub:'geopolitics', cat:'Geopolitics', kicker:'TARIFFS · TRADE', source:'The Ledger', time:'15h ago',
    headline:'Tariff threats revive the reshoring debate.', summary:'A 1980s-style trade fight, re-staged. The map of dependencies is the real exposure, not the ticker.' },
  // customers
  { side:'down', sub:'carriers', cat:'Mobile carriers', kicker:'CARRIERS · DEMAND', source:'Veridian', time:'6h ago', ticker:'TMUS',
    headline:'Carrier promo intensity cools — a tailwind for handset margins.', summary:'Subsidy discipline at the big three shapes the upgrade pulse downstream. Demand-side oxygen for the principle.' },
  { side:'down', sub:'retail', cat:'Electronics retail', kicker:'RETAIL · BBY', source:'The Ledger', time:'10h ago', ticker:'BBY',
    headline:'Electronics retail stabilises after the pandemic hangover.', summary:"Best Buy's footfall normalises; the channel read-through is steadier sell-through, not a boom." },
  { side:'down', sub:'warehouse', cat:'Warehouse clubs', kicker:'WAREHOUSE · COST', source:'Veridian', time:'12h ago', ticker:'COST',
    headline:"Costco's membership engine keeps humming.", summary:'A warehouse-club channel that sells volume on thin markup — a different demand signal than premium retail.' },
  { side:'down', sub:'online', cat:'Online resellers', kicker:'ONLINE · AMZN', source:'Bretton House', time:'1d ago', ticker:'AMZN',
    headline:'Marketplace pricing pressure tests brand control.', summary:'Online resale widens reach but compresses pricing discipline; the 2010s channel-conflict question, again.' },
  { side:'down', sub:'distributors', cat:'Distributors', kicker:'DISTRIBUTION · CHANNEL', source:'The Ledger', time:'1d ago',
    headline:'Distributor inventories run lean into the cycle.', summary:'Lean channels mean less cushion but cleaner signals — the bullwhip works both ways.' },
];

function DashNews({ c, go, isMobile, scn }) {
  const [article, setArticle] = React.useState(null);
  const [nkey, setNkey] = React.useState('all');   // 'all' | 'up' | 'down'
  const [nsub, setNsub] = React.useState('all');
  const [tutorialOpen, setTutorialOpen] = React.useState(false);
  const openTicker = (t) => { const co = VM_COMPANIES.find(x => x.ticker === t); if (co) go && go('dashboard', co); };

  let list;
  if (scn) {
    list = DNEWS_ITEMS;
    if (nkey !== 'all') list = list.filter(n => n.side === nkey);
    if (nsub !== 'all') list = list.filter(n => n.sub === nsub);
  } else {
    const tagged = NEWS.filter(n => n.ticker === c.ticker);
    list = tagged.length ? tagged : NEWS.slice(0, 4);   // fallback to general market stories
  }
  const activeGroup = DNEWS_GROUPS.find(g => g.id === nkey);
  const subChip = (on) => ({ fontFamily: VM.mono, fontSize: 10, letterSpacing: '0.03em', textTransform: 'uppercase',
    padding: '4px 11px', borderRadius: 999, cursor: 'pointer', whiteSpace: 'nowrap',
    border: `1px solid ${on ? VM.forest : VM.border}`, background: on ? VM.tealTint : VM.paper, color: on ? VM.forest : VM.ink3 });
  return (
    <div style={{ marginTop:24 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
        <div data-tour="vm-news-header">
          {!scn && <Mono size={10} color={VM.terra} weight={700} style={{ display:'block', marginBottom:8 }}>NEWS · {c.ticker}</Mono>}
          <h2 style={{ fontFamily:VM.serif, fontWeight:700, fontSize: isMobile?22:28, margin:'0 0 4px' }}>What's moving {c.name.split(' ')[0]}.</h2>
          <p style={{ fontFamily:VM.serif, fontSize:15, color:VM.ink3, margin:'0 0 18px' }}>{scn ? 'Filtered by where it sits in the dependency map — upstream supply and downstream demand.' : 'Stories read through the lens of the past.'}</p>
        </div>
        <button onClick={()=>setTutorialOpen(true)} title="Interactive tutorial — learn this tab" style={{...TUTORIAL_BTN_STYLE, flexShrink:0}}>
          <i className="ti ti-graduation-cap" style={{ fontSize:12 }}></i>Tutorial
        </button>
      </div>

      {scn && (
        <div style={{ marginBottom: 18 }}>
          {/* two key filters */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <Pill active={nkey === 'all'} onClick={() => { setNkey('all'); setNsub('all'); }}>All news</Pill>
            {DNEWS_GROUPS.map(g => (
              <Pill key={g.id} active={nkey === g.id} onClick={() => { setNkey(g.id); setNsub('all'); }}>{g.label}</Pill>
            ))}
          </div>
          {/* sub-categories of the chosen key filter */}
          {activeGroup && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
              <button onClick={() => setNsub('all')} style={subChip(nsub === 'all')}>All {activeGroup.label.toLowerCase()}</button>
              {activeGroup.subs.map(s => (
                <button key={s.id} onClick={() => setNsub(s.id)} style={subChip(nsub === s.id)}>{s.label}</button>
              ))}
            </div>
          )}
        </div>
      )}

      <div data-tour="vm-news-grid" style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap:16 }}>
        {list.length === 0 && <Mono size={12} color={VM.ink3} style={{ padding: '8px 0' }}>No stories in this filter.</Mono>}
        {list.map((n,i) => (
          <div key={i} {...(i===0 ? {'data-tour':'vm-news-first-card'} : {})}>
            <NewsCard n={n} onOpen={()=>setArticle(n)} />
          </div>
        ))}
      </div>
      {article && <ArticleModal article={article} onClose={()=>setArticle(null)} onTicker={openTicker} isMobile={isMobile} />}
      {tutorialOpen && <TutorialOverlay steps={NEWS_STEPS} label="News tutorial" onClose={()=>setTutorialOpen(false)} />}
    </div>
  );
}

// ── Overview ──────────────────────────────────────────────────────────────────

const OV_STEPS = [
  { sel:'[data-tour="vm-overview-about"]',
    title:'What they actually do.',
    body:"Every company page starts with a plain-English summary of the business model — no jargon. What do they make or sell, who buys it, and what is the dominant revenue engine? Read this before any number." },
  { sel:'[data-tour="vm-overview-meta"]',
    title:'Sector and index context.',
    body:'Sector, sub-industry, index membership, and country tell you which peer group to compare against and which passive funds automatically own this stock. Index inclusion affects liquidity and flows.' },
  { sel:'[data-tour="vm-overview-chart"]',
    title:'Price history in context.',
    body:'The chart gives you the stock trajectory before you read any fundamentals. Use the time-range buttons to zoom in on a specific event or cycle. Dividends and splits are included in the return.' },
  { sel:'[data-tour="vm-overview-quickfacts"]',
    title:'Quick facts.',
    body:'Key reference data: founding year, headquarters, headcount, fiscal year end, exchange, auditor, lead bank, and next earnings date. Useful orientation before going deeper into any other tab.' },
  { sel:'[data-tour="vm-overview-revmix"]',
    title:'Revenue mix.',
    body:'Where the money comes from — broken down by segment or product line. The dominant bar is the primary earnings driver. Smaller segments show diversification or emerging bets worth tracking separately.' },
  { sel:'[data-tour="vm-overview-leadership"]',
    title:'Leadership today.',
    body:'Who runs the company, how long they have been in seat, and their background. Tenure correlates with execution continuity. Note whether key roles are internal promotes or outside hires — it often signals strategy shifts.' },
];

function DashOverview({ c, data, isMobile }) {
  const [tutorialOpen, setTutorialOpen] = React.useState(false);
  const { overview, quick, revenueMix, revenueMixMeta, leaders } = data;
  return (
    <div style={{ marginTop:24 }}>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:8 }}>
        <button onClick={()=>setTutorialOpen(true)} title="Interactive tutorial — learn this tab" style={TUTORIAL_BTN_STYLE}>
          <i className="ti ti-graduation-cap" style={{ fontSize:12 }}></i>Tutorial
        </button>
      </div>
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr', gap: isMobile?20:32 }}>
        <div>
          <div data-tour="vm-overview-about">
            <Mono size={10} color={VM.terra} weight={700} style={{ display:'block', marginBottom:8 }}>ABOUT THIS COMPANY</Mono>
            <h2 style={{ fontFamily:VM.serif, fontWeight:700, fontSize:28, margin:'0 0 12px', textWrap:'balance' }}>
              {c.name.split(' ')[0]} — what they actually do.
            </h2>
            <p style={{ fontFamily:VM.serif, fontSize:16, lineHeight:1.55, color:VM.ink2, margin:0 }}>
              {overview.description}
            </p>
          </div>
          <div data-tour="vm-overview-meta" style={{ display:'flex', flexWrap:'wrap', gap:'4px 18px', margin:'20px 0' }}>
            <MetaPair k="Sector"       v={overview.sector}      />
            <MetaPair k="Sub-industry" v={overview.subIndustry} />
            <MetaPair k="Index"        v={overview.index}       />
            <MetaPair k="Country"      v={overview.country}     />
          </div>
          <div data-tour="vm-overview-chart" style={{ background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:12, padding:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <h3 style={{ fontFamily:VM.serif, fontWeight:700, fontSize:16, margin:0 }}>
                Price · 5Y <span style={{ color:VM.upInk, fontWeight:400, fontSize:13 }}>+218%</span>{' '}
                <span style={{ fontFamily:VM.mono, fontSize:11, color:VM.ink3 }}>· split-adjusted</span>
              </h3>
              <div style={{ display:'flex', gap:4 }}>
                {['1D','5D','1M','6M','1Y','5Y','Max'].map((t,i) => (
                  <span key={t} style={{ fontFamily:VM.mono, fontSize:10, padding:'3px 8px', borderRadius:5,
                    border:`1px solid ${i===5 ? VM.teal : VM.borderSoft}`, color:i===5 ? VM.teal : VM.ink3 }}>{t}</span>
                ))}
              </div>
            </div>
            <OverlayChart h={170} legend={false} />
            <Mono size={11} color={VM.ink3} style={{ fontStyle:'italic', marginTop:4, display:'block' }}>
              {c.ticker} · 5Y with dividends, splits, key events
            </Mono>
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
          <div data-tour="vm-overview-quickfacts">
            <Panel title="Quick facts">
              {quick.map(([k,v],i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', gap:10, padding:'6px 0',
                  borderBottom: i < quick.length-1 ? `1px dotted ${VM.border}` : 'none' }}>
                  <Label style={{ flexShrink:0 }}>{k}</Label>
                  <span style={{ fontFamily:VM.serif, fontSize:13, color:VM.ink, textAlign:'right' }}>{v}</span>
                </div>
              ))}
            </Panel>
          </div>
          <div data-tour="vm-overview-revmix">
            <Panel title="Revenue mix" meta={revenueMixMeta}>
              {revenueMix.map((r,i) => (
                <div key={i} style={{ display:'grid', gridTemplateColumns:'70px 1fr 32px', alignItems:'center', gap:8, padding:'4px 0' }}>
                  <span style={{ fontFamily:VM.serif, fontSize:13, color:VM.ink2 }}>{r.k}</span>
                  <ProgressBar v={r.v} color={r.c} />
                  <Mono size={11} weight={600} style={{ textAlign:'right' }}>{r.v}%</Mono>
                </div>
              ))}
            </Panel>
          </div>
          <div data-tour="vm-overview-leadership">
            <Panel title="Leadership today">
              {leaders.map((p,i) => (
                <div key={i} style={{ display:'flex', gap:10, padding:'7px 0',
                  borderBottom: i < leaders.length-1 ? `1px dotted ${VM.border}` : 'none' }}>
                  <Hatch w={34} h={34} style={{ borderRadius:999, flexShrink:0 }} />
                  <div>
                    <Label>{p.role} · since {p.since}</Label>
                    <div style={{ fontFamily:VM.serif, fontWeight:600, fontSize:14 }}>{p.name}</div>
                    <Mono size={9.5} color={VM.ink3}>{p.note}</Mono>
                  </div>
                </div>
              ))}
            </Panel>
          </div>
        </div>
      </div>
      {tutorialOpen && <TutorialOverlay steps={OV_STEPS} label="Overview tutorial" onClose={()=>setTutorialOpen(false)} />}
    </div>
  );
}

// ── Supply chain ──────────────────────────────────────────────────────────────

const SCN_STEPS = [
  { sel:'[data-tour="vm-supply-crumbs"]',
    title:'The drill trail.',
    body:'This breadcrumb tracks your path as you drill down the chain. Click any company node to make it the new principle — the trail lets you navigate back. Start at AAPL, drill into TSM, then drill into ASML: three levels in three clicks.' },
  { sel:'[data-tour="vm-supply-filters"]',
    title:'Filter by relationship type.',
    body:'All shows every node. Companies shows direct strategic suppliers only. External isolates macro factors — shipping rates, oil prices, FX moves — that hit the company indirectly but can be just as disruptive.' },
  { sel:'[data-tour="vm-supply-inputs"]',
    title:'Inputs and dependencies.',
    body:'Every node on the left is something the company depends on to operate. Blue left border = direct company supplier. Coral = external factor. Stroke weight on the connector reflects how critical the dependency is.' },
  { sel:'[data-tour="vm-supply-principle"]',
    title:'The principle.',
    body:'The company at the centre of the current view. Hover any input or customer node to see detail, then click "Make principle" to re-centre the map on that company and trace its own chain.' },
  { sel:'[data-tour="vm-supply-customers"]',
    title:'Customers and channels.',
    body:'Every node on the right is a buyer or distribution channel. Grouped by type: carriers, retailers, cloud customers, OEM buyers. The thickness of the connector shows revenue concentration — a thick line to one customer is a risk to watch.' },
  { sel:'[data-tour="vm-supply-legend"]',
    title:'Reading the colours.',
    body:'Blue = direct company. Coral = external factor. Green = the principle. Teal arrow = output to customer. Stroke weight signals dependency strength. Hover any node for role, note, and risk detail without losing your place in the map.' },
];

function DashScn({ c, go, isMobile }) {
  const [tutorialOpen, setTutorialOpen] = React.useState(false);
  return (
    <div style={{ marginTop:16 }}>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:8 }}>
        <button onClick={()=>setTutorialOpen(true)} title="Interactive tutorial — learn this tab" style={TUTORIAL_BTN_STYLE}>
          <i className="ti ti-graduation-cap" style={{ fontSize:12 }}></i>Tutorial
        </button>
      </div>
      <ScnLiveDemo go={go} compact={true} initialTicker={c.ticker} isMobile={isMobile} />
      {tutorialOpen && <TutorialOverlay steps={SCN_STEPS} label="Supply chain tutorial" onClose={()=>setTutorialOpen(false)} />}
    </div>
  );
}

// ── Financials ────────────────────────────────────────────────────────────────

const FIN_STEPS = [
  { sel:'[data-tour="vm-fin-subtabs"]',
    title:'Three statements, one company.',
    body:'Income statement shows earnings. Balance sheet shows what the company owns and owes at period end. Cash flow shows cash actually generated — independent of accounting choices. Each tab reveals something the others hide.' },
  { sel:'[data-tour="vm-fin-delta-btns"]',
    title:'See how numbers are moving.',
    body:'%Δ inserts a percentage-change column between every adjacent period — instantly shows whether growth is accelerating or fading. $Δ adds the raw dollar difference. Toggle one or both; they stack side by side.' },
  { sel:'[data-tour="vm-fin-period-toggle"]',
    title:'Annual or Quarterly.',
    body:'Annual shows full fiscal-year totals — cleaner for long-run trend. Quarterly breaks it into four-period slices, useful for spotting whether a recovery is actually underway or a slowdown is accelerating within a year.' },
  { sel:'[data-tour="vm-fin-legend-btn"]',
    title:'Legend: one read, then obvious.',
    body:'Explains bold rows (subtotals), indented rows (components), what parentheses mean, the difference between $B and $M, and how the Δ columns work. Two minutes here makes every other part of the table self-explanatory.' },
  { sel:'[data-tour="vm-fin-export-btn"]',
    title:'Download to CSV or Excel.',
    body:'Export any combination of the three statements with optional change columns. The Excel version creates a separate tab per statement and pre-formats %Δ columns as percentages — ready for your own model.' },
  { sel:'[data-tour="vm-analysis-btn"]',
    title:'Visual analysis.',
    body:'Opens a chart view of revenue trend, gross and operating margin, and EPS across all periods. Same numbers as the table, easier to read as trend lines — useful for spotting inflection points at a glance.' },
  { sel:'[data-tour="vm-fin-table"]',
    title:'Reading the table.',
    body:'Bold rows are totals: Gross profit, Operating income, Net income. Indented grey rows are the components that feed into the bold line above them. Numbers in (parentheses) are negative — outflows or losses, shown in red.' },
];

// Shared spotlight tutorial used by every tab. Pass a steps array + short label.
function TutorialOverlay({ steps, label, onClose }) {
  const [step, setStep] = React.useState(0);
  const [rect, setRect] = React.useState(null);
  const total = steps.length;
  const s     = steps[step];

  React.useEffect(() => {
    const el = document.querySelector(s.sel);
    if (!el) { setRect(null); return; }
    el.scrollIntoView({ behavior:'smooth', block:'nearest' });
    const t = setTimeout(() => {
      const r = el.getBoundingClientRect();
      setRect({ top:r.top, left:r.left, width:r.width, height:r.height });
    }, 320);
    return () => clearTimeout(t);
  }, [step]);

  React.useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const pad = 10, rx = 8, TW = 308;
  const vw = window.innerWidth, vh = window.innerHeight;
  const x  = rect ? rect.left - pad / 2 : 0;
  const y  = rect ? rect.top  - pad / 2 : 0;
  const w  = rect ? rect.width  + pad : 0;
  const hh = rect ? rect.height + pad : 0;

  let tTop, tLeft;
  if (rect) {
    const spaceBelow = vh - (rect.top + rect.height + pad);
    tTop  = spaceBelow > 200 ? rect.top + rect.height + pad + 8 : rect.top - 220 - 8;
    tLeft = Math.max(10, Math.min(vw - TW - 10, rect.left + rect.width / 2 - TW / 2));
  } else {
    tTop  = vh / 2 - 110;
    tLeft = vw / 2 - TW / 2;
  }

  return ReactDOM.createPortal(
    <>
      <svg style={{ position:'fixed', inset:0, width:'100%', height:'100%', zIndex:9998, pointerEvents:'none' }}>
        <defs><mask id="vm-tab-tour-mask">
          <rect x="0" y="0" width="100%" height="100%" fill="white" />
          {rect && <rect x={x} y={y} width={w} height={hh} rx={rx} fill="black" />}
        </mask></defs>
        <rect x="0" y="0" width="100%" height="100%" fill="rgba(20,18,14,0.74)" mask="url(#vm-tab-tour-mask)" />
      </svg>
      {rect && <div style={{ position:'fixed', left:x, top:y, width:w, height:hh,
        border:`2px solid ${VM.teal}`, borderRadius:rx, zIndex:9999, pointerEvents:'none',
        boxShadow:`0 0 0 3px ${VM.tealTint}` }} />}
      <div style={{ position:'fixed', top:tTop, left:tLeft, width:TW, zIndex:10000,
        background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:12,
        boxShadow:'0 16px 48px rgba(20,18,14,0.26)' }}>
        <div style={{ height:3, borderRadius:'12px 12px 0 0', background:VM.borderHair, overflow:'hidden' }}>
          <div style={{ height:'100%', background:VM.teal, borderRadius:999,
            width:`${((step+1)/total)*100}%`, transition:'width .25s ease' }} />
        </div>
        <div style={{ padding:'14px 16px 16px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:9 }}>
            <span style={{ fontFamily:VM.mono, fontSize:9, color:VM.ink3, letterSpacing:'0.07em', textTransform:'uppercase' }}>
              {label} · {step+1} / {total}
            </span>
            <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', padding:2, color:VM.ink3, lineHeight:1 }}>
              <i className="ti ti-x" style={{ fontSize:14 }}></i>
            </button>
          </div>
          <div style={{ fontFamily:VM.serif, fontWeight:700, fontSize:15, color:VM.ink, marginBottom:8 }}>{s.title}</div>
          <div style={{ fontFamily:VM.serif, fontSize:13, color:VM.ink2, lineHeight:1.58, marginBottom:16 }}>{s.body}</div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <button onClick={()=>setStep(i=>i-1)} disabled={step===0} style={{
              fontFamily:VM.mono, fontSize:11, padding:'5px 12px', borderRadius:6, cursor:step>0?'pointer':'default',
              border:`1px solid ${VM.border}`, background:VM.paper,
              color:step>0?VM.ink2:VM.faint, opacity:step>0?1:0.35 }}>← Back</button>
            {step < total-1
              ? <button onClick={()=>setStep(i=>i+1)} style={{
                  fontFamily:VM.mono, fontSize:11, fontWeight:700, padding:'5px 16px', borderRadius:6, cursor:'pointer',
                  border:`1px solid ${VM.forest}`, background:VM.forest, color:VM.paperWarm }}>Next →</button>
              : <button onClick={onClose} style={{
                  fontFamily:VM.mono, fontSize:11, fontWeight:700, padding:'5px 16px', borderRadius:6, cursor:'pointer',
                  border:`1px solid ${VM.teal}`, background:VM.teal, color:VM.paperWarm }}>Done ✓</button>
            }
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

// Trigger a client-side file download from an in-memory string (no backend).
function downloadBlob(filename, content, mime) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const SHEET_LABELS = { income:'Income statement', balance:'Balance sheet', cashflow:'Cash flow' };

function DashFinancials({ data, c, isMobile }) {
  const [sheet, setSheet]     = React.useState('income');
  const [period, setPeriod]   = React.useState('annual');
  const [showPct, setShowPct] = React.useState(false);   // %Δ — percentage change vs prior period
  const [showAbs, setShowAbs] = React.useState(false);   // $Δ — absolute change vs prior period
  const [legend, setLegend]   = React.useState(false);   // "reading the financials" popup
  const [exportOpen, setExportOpen] = React.useState(false); // CSV/Excel export popup
  const [analysisOpen, setAnalysisOpen] = React.useState(false);
  const [tutorialOpen, setTutorialOpen] = React.useState(false);
  const analysisBtnRef = React.useRef(null);
  // Real "financials as reported" (SEC filings via Finnhub) when available for
  // this ticker/period; otherwise fall back to the curated mock (data).
  const fin = typeof useVMFinancials === 'function' ? useVMFinancials(c.ticker, period) : { data:null, loading:false, live:false };
  const D = fin.data || data;
  const rows = { income:D.income, balance:D.balance, cashflow:D.cashflow }[sheet];
  const periods = D.periods;
  const showDelta = showPct || showAbs;
  const deltaCols = showPct + showAbs;

  function fmt(v, fmtType) {
    if (fmtType === 'eps') return `$${Math.abs(v).toFixed(2)}`;
    const abs = Math.abs(v);
    const s   = abs >= 1000 ? `$${(abs/1000).toFixed(1)}B` : `$${abs.toFixed(0)}M`;
    return v < 0 ? `(${s})` : s;
  }
  function fmtAbsDelta(diff, fmtType) {
    const sign = diff < 0 ? '-' : '+';
    if (fmtType === 'eps') return `${sign}$${Math.abs(diff).toFixed(2)}`;
    const abs = Math.abs(diff);
    const s   = abs >= 1000 ? `$${(abs/1000).toFixed(1)}B` : `$${abs.toFixed(0)}M`;
    return `${sign}${s}`;
  }
  // negative → orange (terra), positive → green (teal), flat → muted.
  const deltaColor = (x) => x < 0 ? VM.terra : (x > 0 ? VM.teal : VM.ink3);

  // Build a grid ({header, body}) of raw numbers for one statement, with the Δ
  // columns interleaved between periods (so the export mirrors the on-screen
  // table). Values stay computable: USD millions, except per-share rows.
  function buildGrid(sheetId, pct, abs) {
    const sheetRows = { income:D.income, balance:D.balance, cashflow:D.cashflow }[sheetId];
    const header = ['Breakdown'];
    periods.forEach((p, pi) => {
      header.push(p);
      if (pi < periods.length - 1) {
        const range = `${periods[pi + 1]} → ${p}`;
        if (pct) header.push(`%Δ ${range}`);
        if (abs) header.push(`$Δ ${range}`);
      }
    });
    const body = sheetRows.map(r => {
      const line = [r.k];
      periods.forEach((p, pi) => {
        line.push(r.v[pi] == null ? '' : r.v[pi]);
        if (pi < periods.length - 1) {
          const nv = r.v[pi], ov = r.v[pi + 1];
          const diff = (nv == null || ov == null) ? null : nv - ov;
          // Store %Δ as a fraction (2% → 0.02) so a spreadsheet's "%" number
          // format renders it correctly instead of ×100 (200%).
          const frac = (diff == null || ov === 0) ? null : diff / Math.abs(ov);
          if (pct) line.push(frac == null ? '' : +frac.toFixed(4));
          if (abs) line.push(diff == null ? '' : diff);
        }
      });
      return line;
    });
    return { header, body };
  }

  // Export the chosen statement(s) as CSV or Excel.
  //   multiple sheets → CSV: stacked sections (extra rows); Excel: separate tabs.
  function runExport(kind, sheetIds, pct, abs) {
    const perLabel  = period === 'annual' ? 'Annual' : 'Quarterly';
    const tag       = sheetIds.length === 3 ? 'all' : sheetIds.join('-');
    const base      = `${c.ticker}_${tag}_${period}_financials`;
    const pctNote   = pct ? ' · %Δ as fraction (format cell as %)' : '';
    const title     = `${c.ticker} — Financials (${perLabel}) · USD millions, except per-share${pctNote}`;
    if (kind === 'csv') {
      const rowsOut = [[title]];
      sheetIds.forEach((sid, idx) => {
        const { header, body } = buildGrid(sid, pct, abs);
        rowsOut.push([], [SHEET_LABELS[sid]], header, ...body);
      });
      const csv = rowsOut.map(row => row.map(cell => {
        const s = String(cell == null ? '' : cell);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(',')).join('\r\n');
      downloadBlob(`${base}.csv`, '﻿' + csv, 'text/csv;charset=utf-8');
    } else {
      const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const sheetsXml = sheetIds.map(sid =>
        `<x:ExcelWorksheet><x:Name>${esc(SHEET_LABELS[sid])}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet>`).join('');
      const tables = sheetIds.map(sid => {
        const { header, body } = buildGrid(sid, pct, abs);
        const isPctCol = header.map(h => typeof h === 'string' && h.startsWith('%Δ'));
        const head = header.map(h => `<th style="text-align:left;background:#eee;border:1px solid #ccc">${esc(h)}</th>`).join('');
        const tb   = body.map(r => '<tr>' + r.map((cell, i) =>
          `<td style="border:1px solid #ccc;${i === 0 ? '' : 'text-align:right'}${isPctCol[i] ? `;mso-number-format:'0.0%'` : ''}">${esc(cell)}</td>`).join('') + '</tr>').join('');
        return `<table style="border-collapse:collapse"><caption style="text-align:left;font-weight:bold;padding:6px 0">${esc(c.ticker)} — ${esc(SHEET_LABELS[sid])} (${esc(perLabel)})</caption>`
          + `<thead><tr>${head}</tr></thead><tbody>${tb}</tbody></table>`;
      }).join('<br/>');
      const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8">`
        + `<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets>${sheetsXml}</x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>`
        + `<body>${tables}</body></html>`;
      downloadBlob(`${base}.xls`, html, 'application/vnd.ms-excel');
    }
    setExportOpen(false);
  }

  // Column model: each period, with a Δ slot inserted between adjacent periods.
  const cols = [];
  periods.forEach((p, pi) => {
    cols.push({ type:'period', label:p, pi });
    if (showDelta && pi < periods.length - 1) cols.push({ type:'delta', newIdx:pi, oldIdx:pi + 1, range:`${periods[pi + 1]} → ${p}` });
  });
  const hair = `1px solid ${VM.borderHair}`;
  const dPad = { padding:'7px 10px', textAlign:'right', whiteSpace:'nowrap', fontFamily:VM.mono, fontSize:11 };

  // Grab-and-drag to scroll the (wide) table sideways with the mouse, like the ticker.
  const scrollRef = React.useRef(null);
  const dragRef = React.useRef(null);
  const onDragDown = (e) => { const el = scrollRef.current; if (!el) return; dragRef.current = { x: e.clientX, sl: el.scrollLeft }; el.style.cursor = 'grabbing'; if (el.setPointerCapture) el.setPointerCapture(e.pointerId); };
  const onDragMove = (e) => { if (!dragRef.current || !scrollRef.current) return; scrollRef.current.scrollLeft = dragRef.current.sl - (e.clientX - dragRef.current.x); };
  const onDragUp = (e) => { if (!dragRef.current) return; dragRef.current = null; const el = scrollRef.current; if (el) { el.style.cursor = 'grab'; if (el.releasePointerCapture) el.releasePointerCapture(e.pointerId); } };

  return (
    <div style={{ marginTop:24 }}>
      <div data-tour="vm-financials-toolbar" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', columnGap:14, rowGap:8, marginBottom:20 }}>
        <div data-tour="vm-fin-subtabs" style={{ display:'flex', flex:'1 1 240px', borderBottom:`1px solid ${VM.borderSoft}` }}>
        {[['income','Income statement'],['balance','Balance sheet'],['cashflow','Cash flow']].map(([id,lbl]) => (
          <span key={id} onClick={()=>setSheet(id)} style={{
            fontFamily:VM.serif, fontSize:14, padding:'6px 16px 10px', cursor:'pointer', whiteSpace:'nowrap',
            color: sheet===id ? VM.ink : VM.ink3, fontWeight: sheet===id ? 700 : 400,
            borderBottom: sheet===id ? `2px solid ${VM.forest}` : '2px solid transparent', marginBottom:-1,
          }}>{lbl}</span>
        ))}
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap', paddingBottom:8 }}>
          {/* change-vs-prior-period toggles (independent) */}
          {!isMobile && (
            <div data-tour="vm-fin-delta-btns" style={{ display:'inline-flex', gap:6 }}>
              {[['pct','%Δ', showPct, setShowPct, 'Show % change vs prior period'],
                ['abs','$Δ', showAbs, setShowAbs, 'Show $ change vs prior period']].map(([id,lbl,on,set,title]) => (
                <button key={id} onClick={()=>set(v=>!v)} title={title} style={{
                  fontFamily:VM.mono, fontSize:11, fontWeight:700, padding:'4px 11px', borderRadius:5, cursor:'pointer',
                  border:`1px solid ${on ? VM.forest : VM.border}`,
                  background: on ? VM.forest : VM.paper, color: on ? VM.paperWarm : VM.ink3,
                }}>{lbl}</button>
              ))}
            </div>
          )}
          {!isMobile && <span style={{ width:1, height:18, background:VM.border, margin:'0 3px' }}></span>}
          <div data-tour="vm-fin-period-toggle" style={{ display:'inline-flex', gap:4 }}>
            {[['annual','Annual'],['quarterly','Quarterly']].map(([id,lbl]) => (
              <span key={id} onClick={()=>setPeriod(id)} style={{
                fontFamily:VM.mono, fontSize:10, padding:'4px 10px', borderRadius:5, cursor:'pointer',
                border:`1px solid ${period===id ? VM.forest : VM.border}`,
                background: period===id ? VM.forest : VM.paper, color: period===id ? VM.paperWarm : VM.ink3,
              }}>{lbl}</span>
            ))}
          </div>
          <span style={{ width:1, height:18, background:VM.border, margin:'0 3px' }}></span>
          <button data-tour="vm-fin-legend-btn" onClick={()=>setLegend(true)} title="Legend — how to read this" style={{
            display:'inline-flex', alignItems:'center', gap:6, fontFamily:VM.mono, fontSize:10, letterSpacing:'0.04em', textTransform:'uppercase',
            padding:'4px 11px', borderRadius:5, border:`1px solid ${VM.border}`, background:VM.paper, color:VM.ink2, cursor:'pointer' }}>
            <i className="ti ti-key" style={{ fontSize:12 }}></i>Legend
          </button>
          <button data-tour="vm-fin-export-btn" onClick={()=>setExportOpen(true)} title="Export this statement" style={{
            display:'inline-flex', alignItems:'center', gap:6, fontFamily:VM.mono, fontSize:10, letterSpacing:'0.04em', textTransform:'uppercase',
            padding:'4px 11px', borderRadius:5, border:`1px solid ${VM.forest}`, background:VM.forest, color:VM.paperWarm, cursor:'pointer' }}>
            <i className="ti ti-download" style={{ fontSize:12 }}></i>Export
          </button>
          <button data-tour="vm-analysis-btn" ref={analysisBtnRef} onClick={()=>setAnalysisOpen(true)} title="Open chart analysis" style={{
            display:'inline-flex', alignItems:'center', gap:6, fontFamily:VM.mono, fontSize:10, letterSpacing:'0.04em', textTransform:'uppercase',
            padding:'4px 11px', borderRadius:5, border:`1px solid ${VM.teal}`, background:VM.tealTint, color:VM.tealInk, cursor:'pointer' }}>
            <i className="ti ti-chart-bar" style={{ fontSize:12 }}></i>Analysis
          </button>
          <button onClick={()=>setTutorialOpen(true)} title="Interactive tutorial — learn to use the financials tab" style={TUTORIAL_BTN_STYLE}>
            <i className="ti ti-graduation-cap" style={{ fontSize:12 }}></i>Tutorial
          </button>
        </div>
      </div>
      {/* Source line: real SEC filings when available, else the illustrative mock. */}
      <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:12, fontFamily:VM.mono, fontSize:10, letterSpacing:'0.03em', color:VM.ink3 }}>
        {fin.loading
          ? <><i className="ti ti-loader-2" style={{ fontSize:12 }}></i>Loading filings…</>
          : fin.live
            ? <><span style={{ width:7, height:7, borderRadius:'50%', background:VM.teal, display:'inline-block' }}></span>
                As reported · SEC filings via Finnhub{D.filedDate ? ` · latest filed ${String(D.filedDate).slice(0,10)}` : ''} · USD</>
            : <><i className="ti ti-info-circle" style={{ fontSize:12 }}></i>Illustrative figures (live filings unavailable for this ticker)</>}
      </div>
      <div data-tour="vm-fin-table" ref={scrollRef} onPointerDown={onDragDown} onPointerMove={onDragMove} onPointerUp={onDragUp} onPointerLeave={onDragUp} onPointerCancel={onDragUp}
        style={{ overflowX:'auto', cursor:'grab', userSelect:'none', touchAction:'pan-y' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', minWidth: showDelta ? 760 : 600 }}>
          <thead>
            <tr style={{ borderBottom: showDelta ? 'none' : `1.5px solid ${VM.borderSoft}` }}>
              <th rowSpan={showDelta ? 2 : 1} style={{ textAlign:'left', verticalAlign:'bottom', padding:'6px 12px 8px', fontFamily:VM.mono, fontSize:9.5,
                fontWeight:500, color:VM.ink3, textTransform:'uppercase', letterSpacing:'0.06em', width: showDelta ? '24%' : '38%' }}>Breakdown</th>
              {cols.map((col, ci) => col.type === 'period'
                ? <th key={ci} rowSpan={showDelta ? 2 : 1} style={{ textAlign:'right', verticalAlign:'bottom', padding:'6px 12px 8px', fontFamily:VM.mono, fontSize:9.5,
                    fontWeight:500, color:VM.ink3, textTransform:'uppercase', letterSpacing:'0.06em' }}>{col.label}</th>
                : <th key={ci} colSpan={deltaCols} style={{ textAlign:'center', padding:'6px 10px 4px', fontFamily:VM.mono, fontSize:8.5,
                    fontWeight:600, color:VM.ink3, textTransform:'uppercase', letterSpacing:'0.04em', whiteSpace:'nowrap',
                    background:VM.paperWarm, borderLeft:hair, borderRight:hair }}>{col.range}</th>
              )}
            </tr>
            {showDelta && (
              <tr style={{ borderBottom:`1.5px solid ${VM.borderSoft}` }}>
                {cols.filter(c => c.type === 'delta').map((col, di) => (
                  <React.Fragment key={di}>
                    {showPct && <th style={{ ...dPad, padding:'2px 10px 6px', fontSize:8.5, fontWeight:700, color:VM.ink3, background:VM.paperWarm, borderLeft:hair, ...(showAbs ? {} : { borderRight:hair }) }}>%Δ</th>}
                    {showAbs && <th style={{ ...dPad, padding:'2px 10px 6px', fontSize:8.5, fontWeight:700, color:VM.ink3, background:VM.paperWarm, borderRight:hair, ...(showPct ? {} : { borderLeft:hair }) }}>$Δ</th>}
                  </React.Fragment>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ borderBottom:`1px solid ${VM.borderHair}`, background: row.b ? VM.paperWarm : 'transparent' }}>
                <td style={{ padding:'7px 12px', paddingLeft: row.in ? 28 : 12 }}>
                  {row.in
                    ? <span style={{ fontFamily:VM.serif, fontSize:13, color:VM.ink3 }}>{row.k}</span>
                    : <span style={{ fontFamily:VM.serif, fontSize:13, fontWeight: row.b ? 700 : 400, color:VM.ink }}>{row.k}</span>}
                </td>
                {cols.map((col, ci) => {
                  if (col.type === 'period') {
                    const v = row.v[col.pi];
                    return (
                      <td key={ci} style={{ padding:'7px 12px', textAlign:'right', fontFamily:VM.mono, fontSize:12,
                        color: v < 0 ? VM.downInk : (row.b ? VM.ink : VM.ink2), fontWeight: row.b ? 600 : 400 }}>
                        {fmt(v, row.fmt)}
                      </td>
                    );
                  }
                  const nv = row.v[col.newIdx], ov = row.v[col.oldIdx];
                  const diff = (nv == null || ov == null) ? null : nv - ov;
                  const pct  = (diff == null || ov === 0) ? null : (diff / Math.abs(ov)) * 100;
                  return (
                    <React.Fragment key={ci}>
                      {showPct && (
                        <td style={{ ...dPad, fontWeight: row.b ? 700 : 500, color: pct == null ? VM.faint : deltaColor(pct), borderLeft:hair, ...(showAbs ? {} : { borderRight:hair }) }}>
                          {pct == null ? '—' : `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`}
                        </td>
                      )}
                      {showAbs && (
                        <td style={{ ...dPad, fontWeight: row.b ? 700 : 500, color: diff == null ? VM.faint : deltaColor(diff), borderRight:hair, ...(showPct ? {} : { borderLeft:hair }) }}>
                          {diff == null ? '—' : fmtAbsDelta(diff, row.fmt)}
                        </td>
                      )}
                    </React.Fragment>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Mono size={10} color={VM.faint} style={{ display:'block', marginTop:10 }}>
        All figures USD · illustrative mock data · not financial advice{showDelta ? ' · Δ vs prior period' : ''}
      </Mono>
      {legend && <FinLegendModal onClose={()=>setLegend(false)} />}
      {exportOpen && <FinExportModal ticker={c.ticker} curSheet={sheet}
        period={period === 'annual' ? 'Annual' : 'Quarterly'}
        initPct={showPct} initAbs={showAbs} buildGrid={buildGrid} onExport={runExport} onClose={()=>setExportOpen(false)} />}
      {analysisOpen && <AnalysisModal open={analysisOpen} onClose={()=>setAnalysisOpen(false)} data={data} c={c} analysisButtonRef={analysisBtnRef} />}
      {tutorialOpen && <TutorialOverlay steps={FIN_STEPS} label="Financials tutorial" onClose={()=>setTutorialOpen(false)} />}
    </div>
  );
}

// Export wizard — step 1: choose CSV/Excel · step 2: pick sheet + Δ columns,
// preview the output, then download.
function FinExportModal({ ticker, curSheet, period, initPct, initAbs, buildGrid, onExport, onClose }) {
  const SHEET_ORDER = ['income', 'balance', 'cashflow'];
  const [step, setStep]   = React.useState('format');  // 'format' → 'configure'
  const [kind, setKind]   = React.useState(null);      // 'csv' | 'excel'
  const [sheets, setSheets] = React.useState([curSheet]); // multi-select: subset of SHEET_ORDER
  const [pct, setPct]     = React.useState(initPct);
  const [abs, setAbs]     = React.useState(initAbs);
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Toggle a statement on/off; always keep canonical order and ≥1 selected.
  const toggleSheet = (id) => setSheets(prev => {
    if (prev.includes(id)) return prev.length === 1 ? prev : prev.filter(x => x !== id);
    return SHEET_ORDER.filter(x => x === id || prev.includes(x));
  });
  const allOn = sheets.length === 3;

  const formatOpts = [
    ['csv',   'ti-file-text',        'CSV',   'Comma-separated values — opens in Excel, Sheets, Numbers or any text editor.'],
    ['excel', 'ti-file-spreadsheet', 'Excel', 'Formatted workbook (.xls) that opens straight into Microsoft Excel.'],
  ];
  const sheetOpts = [['income','Income statement'],['balance','Balance sheet'],['cashflow','Cash flow']];

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:90, background:'rgba(31,29,26,0.45)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div onClick={(e)=>e.stopPropagation()} style={{ width:'100%', maxWidth: step==='format' ? 440 : 600, maxHeight:'88vh', display:'flex', flexDirection:'column', background:VM.paper, border:`1px solid ${VM.border}`, borderRadius:14, boxShadow:'0 24px 60px rgba(31,29,26,0.3)' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', borderBottom:`1px solid ${VM.borderSoft}`, background:VM.paperWarm, borderRadius:'14px 14px 0 0' }}>
          <div style={{ display:'flex', alignItems:'center', gap:9 }}>
            {step === 'configure' && (
              <i className="ti ti-arrow-left" onClick={()=>setStep('format')} title="Back" style={{ fontSize:18, color:VM.ink3, cursor:'pointer' }}></i>
            )}
            <i className="ti ti-download" style={{ fontSize:16, color:VM.forest }}></i>
            <span style={{ fontFamily:VM.serif, fontWeight:700, fontSize:17 }}>
              {step === 'format' ? 'Export financials.' : `Export to ${kind === 'csv' ? 'CSV' : 'Excel'}.`}
            </span>
          </div>
          <i className="ti ti-x" onClick={onClose} title="Close" style={{ fontSize:18, color:VM.ink3, cursor:'pointer' }}></i>
        </div>

        {/* Step 1 — format */}
        {step === 'format' && (
          <div style={{ padding:'16px 18px 20px' }}>
            <Mono size={10} color={VM.faint} style={{ display:'block', marginBottom:14 }}>{ticker} · {period}</Mono>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {formatOpts.map(([id, icon, lbl, desc]) => (
                <button key={id} onClick={()=>{ setKind(id); setStep('configure'); }} style={{
                  display:'flex', alignItems:'center', gap:13, textAlign:'left', width:'100%',
                  padding:'13px 15px', borderRadius:10, border:`1px solid ${VM.border}`, background:VM.paper, cursor:'pointer' }}
                  onMouseEnter={(e)=>{ e.currentTarget.style.borderColor=VM.forest; e.currentTarget.style.background=VM.paperWarm; }}
                  onMouseLeave={(e)=>{ e.currentTarget.style.borderColor=VM.border; e.currentTarget.style.background=VM.paper; }}>
                  <i className={`ti ${icon}`} style={{ fontSize:24, color:VM.forest, flexShrink:0 }}></i>
                  <span style={{ display:'block' }}>
                    <span style={{ display:'block', fontFamily:VM.serif, fontWeight:700, fontSize:15, color:VM.ink }}>{lbl}</span>
                    <span style={{ display:'block', fontFamily:VM.serif, fontSize:12.5, color:VM.ink3, lineHeight:1.4, marginTop:2 }}>{desc}</span>
                  </span>
                  <i className="ti ti-chevron-right" style={{ fontSize:16, color:VM.ink3, marginLeft:'auto' }}></i>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 — configure + preview */}
        {step === 'configure' && (
          <div style={{ padding:'14px 18px 4px', overflowY:'auto' }}>
            {/* Sheet selector — multi-select */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:7 }}>
              <Label style={{ color:VM.ink3 }}>Statements <span style={{ color:VM.faint, textTransform:'none', letterSpacing:0 }}>— pick one or more</span></Label>
              <span onClick={()=>setSheets(allOn ? [curSheet] : [...SHEET_ORDER])} style={{
                fontFamily:VM.mono, fontSize:10, color:VM.teal, cursor:'pointer', textTransform:'uppercase', letterSpacing:'0.04em' }}>
                {allOn ? 'Clear' : 'Select all'}
              </span>
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:14 }}>
              {sheetOpts.map(([id, lbl]) => {
                const on = sheets.includes(id);
                return (
                  <button key={id} onClick={()=>toggleSheet(id)} style={{
                    display:'inline-flex', alignItems:'center', gap:6, fontFamily:VM.mono, fontSize:10.5, padding:'5px 11px', borderRadius:5, cursor:'pointer',
                    border:`1px solid ${on ? VM.forest : VM.border}`,
                    background: on ? VM.forest : VM.paper, color: on ? VM.paperWarm : VM.ink2 }}>
                    <i className={`ti ${on ? 'ti-square-check-filled' : 'ti-square'}`} style={{ fontSize:13 }}></i>{lbl}
                  </button>
                );
              })}
            </div>

            {/* Δ columns */}
            <Label style={{ display:'block', marginBottom:7, color:VM.ink3 }}>Change columns (vs prior period)</Label>
            <div style={{ display:'flex', gap:6, marginBottom:16 }}>
              {[['%Δ', pct, setPct, 'Percentage change'],['$Δ', abs, setAbs, 'Absolute change']].map(([lbl, on, set, title]) => (
                <button key={lbl} onClick={()=>set(v=>!v)} title={title} style={{
                  fontFamily:VM.mono, fontSize:11, fontWeight:700, padding:'4px 13px', borderRadius:5, cursor:'pointer',
                  border:`1px solid ${on ? VM.forest : VM.border}`,
                  background: on ? VM.forest : VM.paper, color: on ? VM.paperWarm : VM.ink3 }}>{lbl}</button>
              ))}
            </div>

            {/* Preview */}
            <Label style={{ display:'block', marginBottom:7, color:VM.ink3 }}>
              Preview {sheets.length > 1 && <span style={{ color:VM.faint, textTransform:'none', letterSpacing:0 }}>— {kind === 'csv' ? 'stacked into one file' : 'one tab per statement'}</span>}
            </Label>
            <div style={{ border:`1px solid ${VM.borderSoft}`, borderRadius:8, overflow:'auto', maxHeight:240, background:VM.paperWarm }}>
              {sheets.map((sid, idx) => {
                const { header, body } = buildGrid(sid, pct, abs);
                const isPctCol = header.map(h => typeof h === 'string' && h.startsWith('%Δ'));
                // %Δ is stored as a fraction; show it as a percent in the preview.
                const showCell = (cell, ci) => cell === '' ? '—' : (isPctCol[ci] ? `${(cell * 100).toFixed(1)}%` : cell);
                return (
                  <div key={sid} style={{ padding:'10px 12px', borderTop: idx ? `1px solid ${VM.border}` : 'none' }}>
                    <Mono size={9.5} weight={700} color={VM.teal} style={{ display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.05em' }}>{SHEET_LABELS[sid]}</Mono>
                    <table style={{ borderCollapse:'collapse', fontFamily:VM.mono, fontSize:10, whiteSpace:'nowrap' }}>
                      <thead>
                        <tr>{header.map((h, i) => (
                          <th key={i} style={{ textAlign: i ? 'right' : 'left', padding:'3px 8px', color:VM.ink3, fontWeight:600, borderBottom:`1px solid ${VM.border}` }}>{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody>
                        {body.slice(0, 5).map((r, ri) => (
                          <tr key={ri}>{r.map((cell, ci) => (
                            <td key={ci} style={{ textAlign: ci ? 'right' : 'left', padding:'3px 8px', color: ci ? VM.ink2 : VM.ink, borderBottom:`1px solid ${VM.borderHair}` }}>{showCell(cell, ci)}</td>
                          ))}</tr>
                        ))}
                      </tbody>
                    </table>
                    {body.length > 5 && <Mono size={9} color={VM.faint} style={{ display:'block', marginTop:4 }}>+ {body.length - 5} more rows</Mono>}
                  </div>
                );
              })}
            </div>
            <Mono size={9.5} color={VM.faint} style={{ display:'block', margin:'8px 0 0' }}>USD millions, except per-share · {period}{pct ? ' · %Δ exported as a fraction (e.g. 1.5% → 0.015), pre-formatted as % in Excel' : ''}</Mono>
          </div>
        )}

        {/* Footer (step 2 only) */}
        {step === 'configure' && (
          <div style={{ display:'flex', justifyContent:'flex-end', gap:9, padding:'12px 18px', borderTop:`1px solid ${VM.borderSoft}`, background:VM.paperWarm, borderRadius:'0 0 14px 14px' }}>
            <button onClick={()=>setStep('format')} style={{
              fontFamily:VM.mono, fontSize:11, padding:'7px 14px', borderRadius:6, cursor:'pointer',
              border:`1px solid ${VM.border}`, background:VM.paper, color:VM.ink2 }}>Back</button>
            <button onClick={()=>onExport(kind, sheets, pct, abs)} style={{
              display:'inline-flex', alignItems:'center', gap:7, fontFamily:VM.mono, fontSize:11, fontWeight:700, padding:'7px 16px', borderRadius:6, cursor:'pointer',
              border:`1px solid ${VM.forest}`, background:VM.forest, color:VM.paperWarm }}>
              <i className="ti ti-download" style={{ fontSize:13 }}></i>
              Download {kind === 'csv' ? 'CSV' : 'Excel'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// "Reading the financials" — legend popup for the statement table (rows, columns, buttons).
function FinLegendModal({ onClose }) {
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const Section = ({ title, items }) => (
    <React.Fragment>
      <Label style={{ display:'block', margin:'16px 0 8px', color:VM.terra }}>{title}</Label>
      {items.map(([k, d]) => (
        <div key={k} style={{ display:'grid', gridTemplateColumns:'128px 1fr', gap:10, padding:'6px 0', borderBottom:`1px dotted ${VM.border}` }}>
          <Mono size={11} weight={700} color={VM.ink}>{k}</Mono>
          <span style={{ fontFamily:VM.serif, fontSize:13, color:VM.ink2, lineHeight:1.45 }}>{d}</span>
        </div>
      ))}
    </React.Fragment>
  );
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:90, background:'rgba(31,29,26,0.45)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div onClick={(e)=>e.stopPropagation()} style={{ width:'100%', maxWidth:560, maxHeight:'85vh', overflowY:'auto', background:VM.paper, border:`1px solid ${VM.border}`, borderRadius:14, boxShadow:'0 24px 60px rgba(31,29,26,0.3)' }}>
        <div style={{ position:'sticky', top:0, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', borderBottom:`1px solid ${VM.borderSoft}`, background:VM.paperWarm }}>
          <div style={{ display:'flex', alignItems:'center', gap:9 }}>
            <i className="ti ti-key" style={{ fontSize:16, color:VM.teal }}></i>
            <span style={{ fontFamily:VM.serif, fontWeight:700, fontSize:17 }}>Reading the financials.</span>
          </div>
          <i className="ti ti-x" onClick={onClose} title="Close" style={{ fontSize:18, color:VM.ink3, cursor:'pointer' }}></i>
        </div>
        <div style={{ padding:'4px 18px 20px' }}>
          <Section title="Statements (tabs)" items={[
            ['Income statement', 'Revenue down to net income and EPS, for each period.'],
            ['Balance sheet', 'What the company owns and owes at period end — assets, liabilities, equity.'],
            ['Cash flow', 'Cash actually generated and used across the period.'],
          ]} />
          <Section title="Rows" items={[
            ['Bold rows', 'Subtotals & totals (Gross profit, Operating income, Net income…).'],
            ['Indented rows', 'Components that roll up into the bold total above them.'],
            ['(Parentheses)', 'A negative figure or an outflow; shown in red.'],
            ['$B / $M', 'Billions / millions of USD. EPS is per share, e.g. $6.51.'],
          ]} />
          <Section title="Columns" items={[
            ['TTM', 'Trailing twelve months — the most recent rolling year.'],
            ['FY2025…', 'Fiscal-year periods, most recent on the left.'],
            ['%Δ / $Δ', 'Change vs the prior period. Green = up, orange = down. The merged header names the two periods compared.'],
          ]} />
          <Section title="Buttons" items={[
            ['%Δ', 'Toggle the percentage-change column between periods.'],
            ['$Δ', 'Toggle the dollar-change column between periods.'],
            ['Annual / Quarterly', 'Switch the period basis.'],
          ]} />
        </div>
      </div>
    </div>
  );
}

// ── Patents ───────────────────────────────────────────────────────────────────

const PAT_STEPS = [
  { sel:'[data-tour="vm-patents-stats"]',
    title:'Portfolio at a glance.',
    body:'Four headline numbers: total active patents, grants in the last 12 months, pending applications, and the year the earliest filing was made. Together they size the IP position and show whether the company is growing or harvesting its portfolio.' },
  { sel:'[data-tour="vm-patents-portfolio"]',
    title:'Portfolio by technology.',
    body:'Breaks the full portfolio into technology domains — semiconductors, AI/ML, networking, etc. The bar width is the share of total patents; the count is on the right. A concentrated portfolio signals deep specialisation; a broad one signals diversification of IP bets.' },
  { sel:'[data-tour="vm-patents-trend"]',
    title:'Filing trend.',
    body:'Annual new filings from FY20 to FY25. An accelerating trend usually precedes a product cycle — companies file before they ship. A asterisk (*) marks a partial or estimated year. Compare the peak year against the company\'s R&D spend history for context.' },
  { sel:'[data-tour="vm-patents-grants"]',
    title:'Notable recent grants.',
    body:'A curated list of high-signal grants from the last 12–18 months. Patent ID links to the USPTO record. The area tag shows which technology domain each grant falls into — useful for spotting emerging bets before they show up in revenue.' },
];

function DashPatents({ data, isMobile }) {
  const [tutorialOpen, setTutorialOpen] = React.useState(false);
  const { stats, cats, filings, notable } = data;
  return (
    <div style={{ marginTop:24 }}>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:8 }}>
        <button onClick={()=>setTutorialOpen(true)} title="Interactive tutorial — learn this tab" style={TUTORIAL_BTN_STYLE}>
          <i className="ti ti-graduation-cap" style={{ fontSize:12 }}></i>Tutorial
        </button>
      </div>
      <div data-tour="vm-patents-stats" style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap:14, marginBottom:24 }}>
        {stats.map(([k,v]) => (
          <div key={k} style={{ background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:10, padding:'14px 16px' }}>
            <Label>{k}</Label>
            <div style={{ fontFamily:VM.mono, fontSize:26, fontWeight:700, color:VM.ink, marginTop:6 }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:22 }}>
        <div data-tour="vm-patents-portfolio" style={{ background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:12, padding:'16px' }}>
          <h3 style={{ fontFamily:VM.serif, fontWeight:700, fontSize:17, margin:'0 0 14px' }}>Portfolio by technology</h3>
          {cats.map((r, i) => (
            <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 80px 32px 38px', alignItems:'center',
              gap:8, padding:'5px 0', borderBottom: i < cats.length-1 ? `1px dotted ${VM.border}` : 'none' }}>
              <span style={{ fontFamily:VM.serif, fontSize:12, color:VM.ink2 }}>{r.k}</span>
              <ProgressBar v={r.pct} color={r.c} />
              <Mono size={10} weight={600} style={{ textAlign:'right' }}>{r.pct}%</Mono>
              <Mono size={10} color={VM.ink3} style={{ textAlign:'right' }}>{r.n.toLocaleString()}</Mono>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div data-tour="vm-patents-trend" style={{ background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:12, padding:'16px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14 }}>
              <h3 style={{ fontFamily:VM.serif, fontWeight:700, fontSize:17, margin:0 }}>Filing trend</h3>
              <Label>FY20–FY25 ∂</Label>
            </div>
            <PatentFilingChart filings={filings} />
          </div>
          <div data-tour="vm-patents-grants" style={{ background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:12, padding:'16px' }}>
            <h3 style={{ fontFamily:VM.serif, fontWeight:700, fontSize:17, margin:'0 0 12px' }}>Notable recent grants</h3>
            {notable.map((p, i) => (
              <div key={i} style={{ padding:'8px 0', borderBottom: i < notable.length-1 ? `1px dotted ${VM.border}` : 'none' }}>
                <div style={{ display:'flex', justifyContent:'space-between', gap:8, marginBottom:3 }}>
                  <Mono size={10} color={VM.teal}>{p.id}</Mono>
                  <Mono size={10} color={VM.ink3}>{p.granted}</Mono>
                </div>
                <div style={{ fontFamily:VM.serif, fontSize:12.5, color:VM.ink, lineHeight:1.45, marginBottom:3 }}>{p.title}</div>
                <Mono size={9.5} color={VM.terra}>{p.area}</Mono>
              </div>
            ))}
          </div>
        </div>
      </div>
      {tutorialOpen && <TutorialOverlay steps={PAT_STEPS} label="Patents tutorial" onClose={()=>setTutorialOpen(false)} />}
    </div>
  );
}

function PatentFilingChart({ filings }) {
  const max = Math.max(...filings.map(d => d.n));
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:90 }}>
      {filings.map((d, i) => (
        <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-end', height:'100%' }}>
          <Mono size={9} color={d.partial ? VM.ink3 : VM.ink2} style={{ marginBottom:4 }}>
            {d.partial ? `${d.n}*` : d.n.toLocaleString()}
          </Mono>
          <div style={{ width:'100%', height:Math.round((d.n/max)*56), background: d.partial ? VM.borderSoft : VM.teal,
            borderRadius:'2px 2px 0 0', opacity: d.partial ? 0.7 : 1 }}></div>
          <div style={{ marginTop:5 }}><Mono size={9} color={VM.ink3}>{d.y}</Mono></div>
        </div>
      ))}
    </div>
  );
}

// ── History ───────────────────────────────────────────────────────────────────
function DashHistory({ c, data, isMobile }) {
  const [section, setSection] = React.useState('past');
  const [query, setQuery]     = React.useState('');
  const [aiResult, setAiResult] = React.useState(null);
  const [aiLoading, setAiLoading] = React.useState(false);

  function handleAsk() {
    if (!query.trim()) return;
    setAiLoading(true);
    setAiResult(null);
    // TODO: wire to Claude.ai
    setTimeout(() => {
      setAiLoading(false);
      setAiResult('Claude.ai integration coming in the next phase. This will surface pattern matches, historical analogues, and AI-generated insights for ' + c.ticker + ' based on your question.');
    }, 900);
  }

  return (
    <div style={{ marginTop:24 }}>
      <div style={{ display:'flex', gap:0, marginBottom:24, borderBottom:`1px solid ${VM.borderSoft}` }}>
        {[['past','Past'],['present','Present'],['future','Future']].map(([id,lbl]) => (
          <span key={id} onClick={()=>setSection(id)} style={{
            fontFamily:VM.serif, fontSize:15, padding:'5px 24px 10px', cursor:'pointer',
            color: section===id ? VM.ink : VM.ink3, fontWeight: section===id ? 700 : 400,
            borderBottom: section===id ? `2px solid ${VM.terra}` : '2px solid transparent', marginBottom:-1,
          }}>{lbl}</span>
        ))}
      </div>

      {section === 'past'    && <HistoryPast    data={data} />}
      {section === 'present' && <HistoryPresent data={data} c={c} isMobile={isMobile} />}
      {section === 'future'  && <HistoryFuture  data={data} c={c} isMobile={isMobile} />}

      <div style={{ marginTop:40, borderTop:`1px solid ${VM.borderSoft}`, paddingTop:26 }}>
        <Kicker tone="rust">Ask History · AI</Kicker>
        <p style={{ fontFamily:VM.serif, fontSize:15, color:VM.ink2, margin:'8px 0 16px', maxWidth:560 }}>
          Ask what history says about {c.ticker} — analogues, turning points, what happened next.
        </p>
        <div style={{ display:'flex', flexDirection: isMobile?'column':'row', gap:10, maxWidth:640 }}>
          <input value={query} onChange={e=>setQuery(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&handleAsk()}
            placeholder={`e.g. "When ${c.ticker} looked like this, what happened to margins?"`}
            style={{ flex:1, width: isMobile?'100%':undefined, fontFamily:VM.serif, fontSize:14, padding:'10px 14px',
              border:`1px solid ${VM.border}`, borderRadius:8, background:VM.paper,
              outline:'none', color:VM.ink }} />
          <Btn solid onClick={handleAsk} style={isMobile ? { width:'100%' } : undefined}>{aiLoading ? 'Searching…' : 'Ask'}</Btn>
        </div>
        {aiResult && (
          <div style={{ marginTop:14, padding:'14px 16px', background:VM.tealTint,
            border:`1px solid ${VM.tealTint2}`, borderRadius:10, maxWidth:640 }}>
            <Label style={{ display:'block', marginBottom:6 }}>Result</Label>
            <p style={{ fontFamily:VM.serif, fontSize:14, color:VM.ink, lineHeight:1.65, margin:0 }}>{aiResult}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryPast({ data }) {
  const { timeline } = data;
  return (
    <div>
      <Mono size={10} color={VM.terra} weight={700} style={{ display:'block', marginBottom:16 }}>COMPANY TIMELINE · KEY MOMENTS</Mono>
      <div style={{ position:'relative' }}>
        <div style={{ position:'absolute', left:57, top:6, bottom:6, width:1, background:VM.borderSoft }}></div>
        {timeline.map((item, i) => (
          <div key={i} style={{ display:'flex', alignItems:'flex-start', marginBottom:18 }}>
            <Mono size={11} weight={600} color={VM.teal} style={{ minWidth:46, paddingTop:2 }}>{item.y}</Mono>
            <div style={{ width:9, height:9, borderRadius:999, background:VM.teal, flexShrink:0,
              marginTop:3, zIndex:1, marginRight:16, border:`2px solid ${VM.paperWarm}` }}></div>
            <p style={{ fontFamily:VM.serif, fontSize:14, color:VM.ink2, lineHeight:1.6, margin:0, minWidth:0 }}>{item.e}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function HistoryPresent({ data, c, isMobile }) {
  const { closestAnalogue, patternMatch, patternDiff } = data;
  return (
    <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr', gap: isMobile?16:26 }}>
      <div>
        <Mono size={10} color={VM.terra} weight={700} style={{ display:'block', marginBottom:12 }}>CLOSEST ANALOGUE · PATTERN MATCH</Mono>
        <div style={{ background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:12, padding:'16px', marginBottom:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
            <div>
              <div style={{ fontFamily:VM.mono, fontSize:18, fontWeight:700, color:VM.ink }}>
                {closestAnalogue.ticker} · {closestAnalogue.year}
              </div>
              <div style={{ fontFamily:VM.serif, fontSize:13, color:VM.ink3, marginTop:3 }}>{closestAnalogue.what}</div>
            </div>
            <div style={{ background:VM.tealTint, border:`1px solid ${VM.tealTint2}`, borderRadius:8, padding:'6px 12px', textAlign:'center' }}>
              <Mono size={20} weight={700} color={VM.teal}>{closestAnalogue.match}%</Mono>
              <div style={{ fontFamily:VM.mono, fontSize:8, color:VM.teal, letterSpacing:'0.05em' }}>MATCH</div>
            </div>
          </div>
          <OverlayChart h={120} legend={true} thenYear={closestAnalogue.year} />
        </div>
        <div style={{ background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:12, padding:'16px' }}>
          <h3 style={{ fontFamily:VM.serif, fontWeight:700, fontSize:15, margin:'0 0 10px' }}>What matches</h3>
          {patternMatch.map((p, i) => (
            <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 80px 32px', alignItems:'center',
              gap:8, padding:'5px 0', borderBottom: i < patternMatch.length-1 ? `1px dotted ${VM.border}` : 'none' }}>
              <span style={{ fontFamily:VM.serif, fontSize:12, color:VM.ink2 }}>{p.k}</span>
              <ProgressBar v={p.v} color={VM.teal} />
              <Mono size={10} weight={600} style={{ textAlign:'right' }}>{p.v}%</Mono>
            </div>
          ))}
          <Mono size={9.5} color={VM.faint} style={{ display:'block', marginTop:10 }}>
            {c.ticker} · {patternMatch[0]?.note}
          </Mono>
        </div>
      </div>
      <div>
        <Mono size={10} color={VM.terra} weight={700} style={{ display:'block', marginBottom:12 }}>WHERE IT DIVERGES</Mono>
        <div style={{ background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:12, padding:'16px' }}>
          {patternDiff.map((d, i) => (
            <div key={i} style={{ padding:'10px 0', borderBottom: i < patternDiff.length-1 ? `1px dotted ${VM.border}` : 'none' }}>
              <div style={{ fontFamily:VM.mono, fontSize:10.5, fontWeight:600, color:VM.rust, marginBottom:4, letterSpacing:'0.02em' }}>{d.k}</div>
              <div style={{ fontFamily:VM.serif, fontSize:13, color:VM.ink2, lineHeight:1.55 }}>{d.note}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HistoryFuture({ data, c, isMobile }) {
  const { analogues } = data;
  const col = { CLOSEST:VM.teal, ECHO:VM.tealInk, MIXED:VM.terra, WARNING:VM.downInk };
  return (
    <div>
      <Mono size={10} color={VM.terra} weight={700} style={{ display:'block', marginBottom:8 }}>ANALOGUES · WEIGHTED OUTCOMES</Mono>
      <p style={{ fontFamily:VM.serif, fontSize:14, color:VM.ink3, margin:'0 0 20px', maxWidth:560 }}>
        The {analogues.length} closest historical matches for {c.ticker}, ranked by pattern similarity. Not a forecast — a base rate.
      </p>
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:10 }}>
        {analogues.map((a, i) => (
          <div key={i} style={{ background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:10,
            padding:'12px 14px', display:'flex', gap:12, alignItems:'flex-start' }}>
            <div style={{ background:col[a.outcome], borderRadius:7, padding:'6px 10px', minWidth:54, textAlign:'center', flexShrink:0 }}>
              <Mono size={13} weight={700} color="#FBF9F3">{a.ticker}</Mono>
              <div style={{ fontFamily:VM.mono, fontSize:8, color:'rgba(251,249,243,0.75)', marginTop:1 }}>{a.year}</div>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:4 }}>
                <Mono size={10} color={VM.ink3}>{a.match}% match</Mono>
                <Mono size={13} weight={700} color={a.dir==='up' ? VM.upInk : VM.downInk}>{a.ret}</Mono>
              </div>
              <div style={{ fontFamily:VM.serif, fontSize:12, color:VM.ink2, lineHeight:1.45, marginBottom:5 }}>{a.what}</div>
              <span style={{ fontFamily:VM.mono, fontSize:9, fontWeight:700, color:col[a.outcome], letterSpacing:'0.07em' }}>{a.outcome}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Shared helpers ────────────────────────────────────────────────────────────
function MetaPair({ k, v }) {
  return (
    <span style={{ display:'inline-flex', gap:6, alignItems:'baseline' }}>
      <Label>{k}</Label>
      <span style={{ fontFamily:VM.serif, fontSize:13, fontWeight:600, color:VM.ink }}>{v}</span>
    </span>
  );
}
function Panel({ title, meta, children }) {
  return (
    <div style={{ background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:12, padding:'14px 16px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:10 }}>
        <h3 style={{ fontFamily:VM.serif, fontWeight:700, fontSize:17, margin:0 }}>{title}</h3>
        {meta && <Label>{meta}</Label>}
      </div>
      {children}
    </div>
  );
}
Object.assign(window, { Dashboard, TutorialOverlay });
