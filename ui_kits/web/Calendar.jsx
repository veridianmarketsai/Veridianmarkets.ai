// Veridian Markets — Calendar page.
// An economic / events calendar: month grid with type-coded event dots, a
// type filter, and a day panel that lists the selected day's events. Mock data.
const { useState: useStateCal } = React;

const CAL_YEAR = 2026, CAL_MONTH = 5; // June 2026 (0-indexed month)
const CAL_MONTH_NAME = 'June 2026';
const CAL_TODAY = 1;                  // app's mock "today" = 1 June 2026

const CAL_TYPES = {
  earn: { label: 'Earnings',     color: VM.teal,   desc: "A company's quarterly results — revenue, EPS, guidance." },
  econ: { label: 'Economic',     color: VM.terra,  desc: 'Macro data releases — inflation, jobs, growth, sentiment.' },
  cb:   { label: 'Central bank', color: VM.forest, desc: 'Central-bank actions — rate decisions, minutes, speeches.' },
  div:  { label: 'Dividend',     color: VM.ink3,   desc: 'Dividend dates — ex-dividend and payment.' },
  mkt:  { label: 'Markets',      color: VM.rust,   desc: 'Structural market events — options expiry, holidays, index changes.' },
};
// Column meanings, shown in the Legend popup.
const CAL_COL_HELP = [
  ['Date',     'The day of the release. Events are grouped by day; today is highlighted.'],
  ['Time',     'Local release time (24h). “—” means all-day or no set time.'],
  ['Region',   'The economy or currency the release covers (e.g. USD).'],
  ['Impact',   'Expected market reaction — see the impact key below.'],
  ['Event',    'The release or corporate event. A ticker link opens that company.'],
  ['Actual',   'The figure once published — blank (—) until release.'],
  ['Forecast', 'Consensus expectation going into the release.'],
  ['Previous', 'The prior period’s figure, for trend comparison.'],
];
// Expected market impact — drives the colour dot in the list view.
const CAL_IMPACT = {
  high: { label: 'High', color: '#C0563B', desc: 'Market-moving. Can swing rates, FX and indices.' },
  med:  { label: 'Med',  color: '#C99A2E', desc: 'Notable — usually a smaller or sector-level reaction.' },
  low:  { label: 'Low',  color: VM.ink3,   desc: 'Minor — rarely moves the broad market.' },
};
// region/impact/forecast/previous power the list (table) view. These are upcoming
// events, so `actual` posts on release (shown as — until then). Mock data.
const CAL_EVENTS = [
  { d: 3,  time: '14:00', title: 'FOMC minutes',            type: 'cb',   region: 'USD', impact: 'high', forecast: '—',         previous: '—' },
  { d: 3,  time: '15:30', title: 'US jobless claims',       type: 'econ', region: 'USD', impact: 'med',  forecast: '230K',      previous: '229K' },
  { d: 5,  time: '13:30', title: 'US non-farm payrolls',    type: 'econ', region: 'USD', impact: 'high', forecast: '+190K',     previous: '+175K' },
  { d: 6,  time: '—',     title: 'AAPL ex-dividend',        type: 'div',  region: 'US',  impact: 'low',  forecast: '$0.25',     previous: '$0.24', ticker: 'AAPL' },
  { d: 10, time: '21:00', title: 'NVIDIA earnings · Q1',    type: 'earn', region: 'US',  impact: 'high', forecast: 'EPS $0.84', previous: 'EPS $0.61', ticker: 'NVDA' },
  { d: 12, time: '13:30', title: 'US CPI · May',            type: 'econ', region: 'USD', impact: 'high', forecast: '3.3%',      previous: '3.4%' },
  { d: 17, time: '19:00', title: 'FOMC rate decision',      type: 'cb',   region: 'USD', impact: 'high', forecast: '5.25%',     previous: '5.50%' },
  { d: 18, time: '21:00', title: 'Microsoft earnings · Q4', type: 'earn', region: 'US',  impact: 'high', forecast: 'EPS $2.93', previous: 'EPS $2.69', ticker: 'MSFT' },
  { d: 20, time: '—',     title: 'Quadruple witching',      type: 'mkt',  region: 'US',  impact: 'med',  forecast: '—',         previous: '—' },
  { d: 25, time: '13:30', title: 'US GDP · final Q1',       type: 'econ', region: 'USD', impact: 'med',  forecast: '1.6%',      previous: '1.6%' },
  { d: 27, time: '13:30', title: 'US PCE inflation',        type: 'econ', region: 'USD', impact: 'high', forecast: '2.7%',      previous: '2.8%' },
];

// Plain-English education for each kind of event: what it is, how it moves
// markets, and what a bullish vs bearish reading looks like. Keyed by a kind
// resolved from the event (see calEduFor). Mechanical events use `note` instead
// of good/bad. Illustrative — not financial advice.
const CAL_EDU = {
  fomcdec: {
    what: "The Federal Reserve sets the federal-funds target rate — the base interest rate that ripples out into every mortgage, loan and bond yield in the economy.",
    moves: "Rates are the single biggest macro lever. Cheaper money pushes investors toward stocks and lifts bond prices; pricier money does the opposite and strengthens the dollar. Markets react less to the move itself than to whether the Fed sounds more hawkish (rate-supportive) or dovish (cut-leaning) than expected.",
    good: { label: 'Dovish — a cut or softer tone', text: 'Cheaper money ahead. Equities, bonds and gold tend to rally and the dollar weakens. Bullish for risk assets.' },
    bad:  { label: 'Hawkish — a hike or "higher for longer"', text: 'Tighter conditions. Equities and bonds usually fall and the dollar firms. A headwind for risk assets.' },
  },
  fomcmin: {
    what: "The detailed minutes of the Fed's most recent meeting, published three weeks after the decision. They expose the debate behind the move and how individual members lean.",
    moves: "Traders comb the wording for clues to the next move. A hawkish tone (focused on inflation) lifts yields and the dollar; a dovish tone (open to cuts) supports stocks and bonds.",
    good: { label: 'Dovish tilt', text: 'Hints at easing ahead — supportive for equities and bonds, softer dollar.' },
    bad:  { label: 'Hawkish tilt', text: 'Signals rates stay high — pressure on equities, firmer yields and dollar.' },
  },
  cpi: {
    what: "The Consumer Price Index — the headline inflation gauge, tracking the change in prices across a basket of everyday goods and services.",
    moves: "Inflation dictates Fed policy. Hot CPI forces the Fed to keep rates high, which weighs on stocks and bonds; cooling CPI opens the door to cuts and fuels rallies. What matters is the surprise versus the forecast.",
    good: { label: 'Cooler than forecast', text: 'Eases rate-hike pressure — stocks and bonds rally, yields fall. Risk-on.' },
    bad:  { label: 'Hotter than forecast', text: 'Keeps rates higher for longer — stocks and bonds sell off, yields and the dollar rise. Risk-off.' },
  },
  pce: {
    what: "The Personal Consumption Expenditures price index — the Fed's preferred inflation measure, and the number it actually targets at 2%. Broader than CPI.",
    moves: "Because it's the Fed's chosen gauge, a surprise carries extra weight for the rate outlook. The market reaction mirrors CPI.",
    good: { label: 'Cooler than forecast', text: 'Strengthens the case for rate cuts — bullish for stocks and bonds, softer dollar.' },
    bad:  { label: 'Hotter than forecast', text: 'Argues for tighter policy — bearish for stocks and bonds, firmer dollar.' },
  },
  nfp: {
    what: "Non-farm payrolls — the monthly change in US jobs outside farming, released the first Friday of each month. The marquee read on the labour market.",
    moves: "It's a two-sided number. A strong jobs market is good for growth and earnings, but if it runs too hot it can push the Fed to hold rates higher for longer. Markets weigh 'strong economy' against 'higher rates' depending on the inflation backdrop.",
    good: { label: 'In-line, moderate growth', text: 'A healthy but not overheating jobs market — the "Goldilocks" zone. Generally supportive for stocks.' },
    bad:  { label: 'Extreme in either direction', text: 'Far too hot revives rate-hike fears (yields and dollar up, stocks down); far too weak revives recession fears. Both unsettle markets.' },
  },
  claims: {
    what: "Initial jobless claims — the number of people filing for unemployment benefits for the first time each week. A timely, high-frequency pulse on the labour market.",
    moves: "Being weekly, it's an early-warning signal. Rising claims hint the economy is cooling; falling claims show resilience. It usually moves markets only on a sharp deviation from trend.",
    good: { label: 'Low / falling claims', text: 'Tight labour market and economic strength — broadly supportive, though very low can feed rate worries.' },
    bad:  { label: 'High / rising claims', text: 'Labour market softening — raises slowdown risk, but can also lift rate-cut hopes.' },
  },
  gdp: {
    what: "Gross Domestic Product — the total value of everything an economy produces, reported as an annualised growth rate. The broadest scorecard of economic health.",
    moves: "Strong growth supports corporate earnings and risk appetite; weak or negative growth signals a slowdown or recession. Revisions to earlier estimates can move markets too.",
    good: { label: 'Above forecast', text: 'A robust economy — supportive for equities, though very strong prints can lift rate expectations.' },
    bad:  { label: 'Below forecast', text: 'A slowing economy — weighs on cyclical stocks; two negative quarters mark a recession.' },
  },
  earnings: {
    what: "A company's quarterly results — revenue, earnings per share (EPS) and forward guidance, all measured against analyst estimates.",
    moves: "Earnings drive the individual stock and often ripple out to its sector, suppliers and customers. The reaction hinges on the surprise versus consensus and — crucially — the guidance for the quarters ahead.",
    good: { label: 'Beat + strong guidance', text: 'Results top estimates and the outlook is raised — shares typically jump, lifting peers.' },
    bad:  { label: 'Miss + weak guidance', text: 'Results fall short or guidance is cut — shares usually drop, dragging the sector.' },
  },
  exdiv: {
    what: "The ex-dividend date — the first day a stock trades without the right to the upcoming dividend. To receive the payout you must own the shares before this date.",
    moves: "This is a mechanical event, not a signal. On the ex-date the share price typically opens lower by roughly the dividend amount, because new buyers no longer collect that payment.",
    note: "Not bullish or bearish in itself — it simply marks the cut-off for dividend eligibility. A steady, growing dividend is a sign of company health.",
  },
  witching: {
    what: "Quadruple witching — the quarterly moment (third Friday of Mar/Jun/Sep/Dec) when stock-index futures, index options, single-stock options and single-stock futures all expire together.",
    moves: "The simultaneous expiry forces traders to roll or close huge positions, spiking volume and volatility — especially in the final hour. The moves are often technical and short-lived rather than driven by fundamentals.",
    note: "Expect choppier prices and heavier volume; the swings usually fade afterwards. Not a directional good/bad signal.",
  },
};
// Resolve an event to its educational entry, falling back to a generic note.
function calEduFor(e) {
  const t = (e.title || '').toLowerCase();
  let key = null;
  if (e.type === 'earn') key = 'earnings';
  else if (e.type === 'div') key = 'exdiv';
  else if (t.includes('payroll') || t.includes('non-farm')) key = 'nfp';
  else if (t.includes('jobless') || t.includes('claims')) key = 'claims';
  else if (t.includes('cpi')) key = 'cpi';
  else if (t.includes('pce')) key = 'pce';
  else if (t.includes('gdp')) key = 'gdp';
  else if (t.includes('rate decision')) key = 'fomcdec';
  else if (t.includes('minutes')) key = 'fomcmin';
  else if (t.includes('witching')) key = 'witching';
  if (key) return CAL_EDU[key];
  return { what: (CAL_TYPES[e.type] || {}).desc || 'A scheduled market event.',
    moves: 'Watch the Actual against the Forecast — a surprise versus consensus is what tends to move markets.',
    note: 'See the Legend for what each column and impact level means.' };
}

const CAL_STEPS = [
  { sel:'[data-tour="vm-cal-header"]',
    title:'Earnings, rates, and macro in one place.',
    body:'The Calendar surfaces every market-moving event for the week or month ahead — earnings releases, central-bank decisions, economic data, dividend dates, and structural market events. Each one is read against its historical context.' },
  { sel:'[data-tour="vm-cal-filters"]',
    title:'Filter by event type.',
    body:'Narrow to Earnings, Economic, Central bank, Dividend, or Markets. The colour-coded dots on the grid update instantly. Switch between Month and List views from the right side. Legend explains every column and impact level.' },
  { sel:'[data-tour="vm-cal-grid"]',
    title:'The month grid.',
    body:'Each day with events shows one coloured dot per event — the colour matches the type filter. Today is highlighted in teal. Navigate months with the arrows. Click any day to load its events in the panel on the right.' },
  { sel:'[data-tour="vm-cal-day-panel"]',
    title:'Day panel — and the ⓘ button.',
    body:'Click a day to see its events here. Each event shows time, type badge, and a ticker link if it belongs to a company. Tap the ⓘ circle to open a full explainer: what the release is, how it moves markets, and what a bullish or bearish reading looks like.' },
];

function Calendar({ go, isMobile }) {
  const [filter, setFilter] = useStateCal('all');
  const [ym, setYm] = useStateCal({ y: CAL_YEAR, m: CAL_MONTH });   // month being viewed
  const [sel, setSel] = useStateCal(CAL_TODAY);
  const [view, setView] = useStateCal('month');   // 'month' grid | 'list' table
  const [legend, setLegend] = useStateCal(false); // legend / how-to-read popup
  const [eduEvent, setEduEvent] = useStateCal(null); // event whose "what is this?" info popup is open
  const [hoverRow, setHoverRow] = useStateCal(null);  // list row index under the cursor (reveals the ⓘ)
  const [listAnchor, setListAnchor] = useStateCal(() => new Date(CAL_YEAR, CAL_MONTH, CAL_TODAY));
  const [range, setRange] = useStateCal('month'); // list view window: 'week' | 'month'
  const [tutorialOpen, setTutorialOpen] = useStateCal(false);

  // Mock events are keyed by day only, so they belong to the seed month (June 2026).
  const isEventsMonth = ym.y === CAL_YEAR && ym.m === CAL_MONTH;
  const events = CAL_EVENTS.filter(e => filter === 'all' || e.type === filter);
  const dayEvents = (d) => (isEventsMonth && d != null) ? events.filter(e => e.d === d) : [];
  const selEvents = dayEvents(sel);

  // List view: a navigable week / month window over the events (seeded in June 2026).
  let winStart, winEnd, rangeLabel;
  if (range === 'week') {
    winStart = new Date(listAnchor); winStart.setDate(listAnchor.getDate() - listAnchor.getDay()); winStart.setHours(0, 0, 0, 0);
    winEnd = new Date(winStart); winEnd.setDate(winStart.getDate() + 6); winEnd.setHours(23, 59, 59, 999);
    const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    rangeLabel = `${fmt(winStart)} – ${fmt(winEnd)}, ${winEnd.getFullYear()}`;
  } else {
    winStart = new Date(listAnchor.getFullYear(), listAnchor.getMonth(), 1);
    winEnd = new Date(listAnchor.getFullYear(), listAnchor.getMonth() + 1, 0, 23, 59, 59, 999);
    rangeLabel = listAnchor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
  const inRange = events
    .map(e => ({ ...e, date: new Date(CAL_YEAR, CAL_MONTH, e.d) }))
    .filter(e => e.date >= winStart && e.date <= winEnd)
    .sort((a, b) => a.date - b.date || a.time.localeCompare(b.time));
  const seedToday = new Date(CAL_YEAR, CAL_MONTH, CAL_TODAY);
  const listHasToday = seedToday >= winStart && seedToday <= winEnd;
  const shiftList = (delta) => setListAnchor(prev => { const x = new Date(prev); if (range === 'week') x.setDate(x.getDate() + delta * 7); else x.setMonth(x.getMonth() + delta); return x; });

  const monthLabel = new Date(ym.y, ym.m, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const firstDow = new Date(ym.y, ym.m, 1).getDay();           // 0=Sun
  const daysIn = new Date(ym.y, ym.m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysIn; d++) cells.push(d);
  const shiftMonth = (delta) => {
    setYm(({ y, m }) => { let nm = m + delta, ny = y; if (nm < 0) { nm = 11; ny--; } if (nm > 11) { nm = 0; ny++; } return { y: ny, m: nm }; });
    setSel(null);
  };

  const tutBtn = {
    display:'inline-flex', alignItems:'center', gap:6, fontFamily:VM.mono, fontSize:10,
    letterSpacing:'0.04em', textTransform:'uppercase', padding:'4px 11px', borderRadius:5,
    border:`1px solid ${VM.terra}`, background:'transparent', color:VM.terra, cursor:'pointer',
  };

  return (
    <div style={{ padding: isMobile ? '16px 16px 80px' : '26px 32px 60px', maxWidth: 1120, margin: '0 auto' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
        <div data-tour="vm-cal-header">
          <Kicker>Calendar · {CAL_EVENTS.length} events</Kicker>
          <h1 style={{ fontFamily: VM.serif, fontWeight: 700, fontSize: isMobile ? 27 : 32, lineHeight: 1.05, margin: '8px 0 0' }}>Calendar.</h1>
          <p style={{ fontFamily: VM.serif, fontSize: isMobile ? 15 : 16, color: VM.ink2, maxWidth: 620, margin: '8px 0 0' }}>
            Earnings, economic releases and central-bank decisions — the week ahead, read against history.
          </p>
        </div>
        <button onClick={()=>setTutorialOpen(true)} title="Interactive tutorial — learn this page" style={{...tutBtn, flexShrink:0, marginTop:8}}>
          <i className="ti ti-graduation-cap" style={{ fontSize:12 }}></i>Tutorial
        </button>
      </div>

      {/* type filter + view toggle */}
      <div data-tour="vm-cal-filters" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 18 }}>
        <Pill active={filter === 'all'} onClick={() => setFilter('all')}>All</Pill>
        {Object.entries(CAL_TYPES).map(([k, t]) => (
          <Pill key={k} active={filter === k} onClick={() => setFilter(k)}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: t.color, display: 'inline-block' }}></span>{t.label}
          </Pill>
        ))}
        <div style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setLegend(true)} title="Legend & how to read it" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: VM.mono, fontSize: 11,
            letterSpacing: '0.04em', textTransform: 'uppercase', padding: '6px 12px', borderRadius: 999,
            border: `1px solid ${VM.border}`, background: VM.paper, color: VM.ink2, cursor: 'pointer' }}>
            <i className="ti ti-key" style={{ fontSize: 13 }}></i>Legend
          </button>
          <div style={{ display: 'inline-flex', border: `1px solid ${VM.border}`, borderRadius: 999, overflow: 'hidden' }}>
            {[['month', 'Month'], ['list', 'List']].map(([v, lbl]) => (
              <button key={v} onClick={() => setView(v)} style={{
                fontFamily: VM.mono, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase',
                padding: '6px 14px', border: 'none', cursor: 'pointer',
                background: view === v ? VM.forest : 'transparent', color: view === v ? VM.paperWarm : VM.ink2 }}>{lbl}</button>
            ))}
          </div>
        </div>
      </div>

      {view === 'month' && (
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.6fr 1fr', gap: isMobile ? 16 : 20, marginTop: 20, alignItems: 'start' }}>
        <div data-tour="vm-cal-grid" style={{ background: VM.paper, border: `1px solid ${VM.borderSoft}`, borderRadius: 14, padding: isMobile ? '14px' : '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontFamily: VM.serif, fontWeight: 700, fontSize: 18 }}>{monthLabel}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {!isEventsMonth && (
                <button onClick={() => { setYm({ y: CAL_YEAR, m: CAL_MONTH }); setSel(CAL_TODAY); }} title="Back to current month" style={{
                  fontFamily: VM.mono, fontSize: 10, letterSpacing: '0.04em', textTransform: 'uppercase', color: VM.teal,
                  background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 6px' }}>Today</button>
              )}
              {[['‹', -1, 'Previous month'], ['›', 1, 'Next month']].map(([sym, delta, title]) => (
                <button key={title} onClick={() => shiftMonth(delta)} title={title} style={{
                  width: 28, height: 28, borderRadius: 7, border: `1px solid ${VM.border}`, background: VM.paper,
                  color: VM.ink2, cursor: 'pointer', fontSize: 16, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>{sym}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <Mono key={d} size={9.5} color={VM.ink3} style={{ textAlign: 'center', paddingBottom: 4 }}>{d}</Mono>)}
            {cells.map((d, i) => {
              if (!d) return <div key={i}></div>;
              const evs = dayEvents(d);
              const isToday = isEventsMonth && d === CAL_TODAY, isSel = d === sel;
              return (
                <div key={i} onClick={() => setSel(d)} style={{ minHeight: isMobile ? 44 : 56, padding: '5px 6px', borderRadius: 8, cursor: 'pointer',
                  background: isSel ? VM.forest : (isToday ? VM.tealTint : 'transparent'),
                  border: `1px solid ${isSel ? VM.forest : (isToday ? VM.tealTint2 : 'transparent')}`,
                  transition: 'background .12s' }}>
                  <div style={{ fontFamily: VM.mono, fontSize: 11.5, fontWeight: isToday || isSel ? 700 : 500, color: isSel ? VM.paperWarm : (isToday ? VM.tealInk : VM.ink2) }}>{d}</div>
                  <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 4 }}>
                    {evs.slice(0, 4).map((e, j) => <span key={j} title={e.title} style={{ width: 6, height: 6, borderRadius: 999, background: isSel ? VM.paperWarm : CAL_TYPES[e.type].color }}></span>)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div data-tour="vm-cal-day-panel" style={{ background: VM.paper, border: `1px solid ${VM.borderSoft}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '13px 16px', borderBottom: `1px solid ${VM.borderHair}`, background: VM.paperWarm }}>
            <Label>{sel == null ? 'Select a day' : (isEventsMonth && sel === CAL_TODAY ? 'Today' : 'Selected')}</Label>
            <div style={{ fontFamily: VM.serif, fontWeight: 700, fontSize: 17, marginTop: 2 }}>{sel == null ? monthLabel : `${sel} ${monthLabel}`}</div>
          </div>
          <div style={{ padding: '6px 16px 14px' }}>
            {sel == null && <div style={{ padding: '22px 0', textAlign: 'center', fontFamily: VM.serif, fontSize: 14, color: VM.ink3 }}>Pick a day to see its events.</div>}
            {sel != null && selEvents.length === 0 && <div style={{ padding: '22px 0', textAlign: 'center', fontFamily: VM.serif, fontSize: 14, color: VM.ink3 }}>No events on this day.</div>}
            {selEvents.map((e, i) => {
              const t = CAL_TYPES[e.type];
              return (
                <div key={i} style={{ display: 'flex', gap: 11, padding: '11px 0', borderBottom: i < selEvents.length - 1 ? `1px dotted ${VM.border}` : 'none' }}>
                  <span style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, background: t.color, flexShrink: 0 }}></span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontFamily: VM.serif, fontSize: 15, color: VM.ink }}>{e.title}</span>
                      <i className="ti ti-info-circle" title="What is this event?" onClick={() => setEduEvent(e)}
                        style={{ fontSize: 15, color: VM.teal, cursor: 'pointer', flexShrink: 0 }}></i>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                      <Mono size={10} color={VM.ink3}>{e.time}</Mono>
                      <span style={{ fontFamily: VM.mono, fontSize: 8.5, fontWeight: 700, color: t.color, border: `1px solid ${t.color}`, borderRadius: 4, padding: '1px 5px' }}>{t.label}</span>
                      {e.ticker && <Mono size={10} color={VM.teal} style={{ cursor: 'pointer' }} onClick={() => { const c = VM_COMPANIES.find(x => x.ticker === e.ticker); if (c) go('dashboard', c); }}>{e.ticker} →</Mono>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      )}

      {/* list (table) view — economic-calendar style */}
      {view === 'list' && (
        <div style={{ marginTop: 20, background: VM.paper, border: `1px solid ${VM.borderSoft}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, padding: '11px 14px', borderBottom: `1px solid ${VM.borderSoft}`, background: VM.paperWarm }}>
            <span style={{ fontFamily: VM.serif, fontWeight: 700, fontSize: 16 }}>{rangeLabel}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {!listHasToday && (
                <button onClick={() => setListAnchor(new Date(CAL_YEAR, CAL_MONTH, CAL_TODAY))} title="Back to current period" style={{
                  fontFamily: VM.mono, fontSize: 10, letterSpacing: '0.04em', textTransform: 'uppercase', color: VM.teal,
                  background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 6px' }}>Today</button>
              )}
              <div style={{ display: 'inline-flex', border: `1px solid ${VM.border}`, borderRadius: 999, overflow: 'hidden' }}>
                {[['week', 'Week'], ['month', 'Month']].map(([r, lbl]) => (
                  <button key={r} onClick={() => setRange(r)} style={{
                    fontFamily: VM.mono, fontSize: 10.5, letterSpacing: '0.04em', textTransform: 'uppercase',
                    padding: '5px 12px', border: 'none', cursor: 'pointer',
                    background: range === r ? VM.forest : 'transparent', color: range === r ? VM.paperWarm : VM.ink2 }}>{lbl}</button>
                ))}
              </div>
              {[['‹', -1, 'Previous'], ['›', 1, 'Next']].map(([sym, delta, title]) => (
                <button key={title} onClick={() => shiftList(delta)} title={title} style={{
                  width: 28, height: 28, borderRadius: 7, border: `1px solid ${VM.border}`, background: VM.paper,
                  color: VM.ink2, cursor: 'pointer', fontSize: 16, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>{sym}</button>
              ))}
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
              <thead>
                <tr style={{ background: VM.paperWarm, borderBottom: `1px solid ${VM.borderSoft}` }}>
                  {['Date', 'Time', 'Region', 'Impact', 'Event', 'Actual', 'Forecast', 'Previous'].map((h, i) => (
                    <th key={h} style={{ textAlign: i >= 5 ? 'right' : 'left', padding: '9px 14px', fontFamily: VM.mono,
                      fontSize: 9.5, fontWeight: 500, color: VM.ink3, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inRange.length === 0 && (
                  <tr><td colSpan={8} style={{ padding: '24px', textAlign: 'center', fontFamily: VM.serif, fontSize: 14, color: VM.ink3 }}>No events in this {range}.</td></tr>
                )}
                {inRange.map((e, i) => {
                  const firstOfDay = i === 0 || inRange[i - 1].d !== e.d;
                  const t = CAL_TYPES[e.type];
                  const imp = CAL_IMPACT[e.impact] || CAL_IMPACT.low;
                  const wd = e.date.toLocaleDateString('en-GB', { weekday: 'short' });
                  return (
                    <tr key={i} onMouseEnter={() => setHoverRow(i)} onMouseLeave={() => setHoverRow(h => h === i ? null : h)}
                      style={{ borderTop: `1px solid ${firstOfDay ? VM.borderSoft : VM.borderHair}`,
                      background: e.d === CAL_TODAY ? VM.tealTint : (hoverRow === i ? VM.paperWarm : 'transparent') }}>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', fontFamily: VM.mono, fontSize: 11.5, fontWeight: 600, color: firstOfDay ? VM.ink : 'transparent' }}>{firstOfDay ? `${wd} · ${e.d}` : ''}</td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', fontFamily: VM.mono, fontSize: 11.5, color: VM.ink2 }}>{e.time}</td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', fontFamily: VM.mono, fontSize: 11, color: VM.ink3 }}>{e.region || '—'}</td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 7, height: 7, borderRadius: 999, background: imp.color }}></span>
                          <span style={{ fontFamily: VM.mono, fontSize: 9.5, fontWeight: 700, color: imp.color, textTransform: 'uppercase' }}>{imp.label}</span>
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 6, height: 6, borderRadius: 999, background: t.color, flexShrink: 0 }}></span>
                          <span style={{ fontFamily: VM.serif, fontSize: 14, color: VM.ink }}>{e.title}</span>
                          {e.ticker && <Mono size={10} color={VM.teal} style={{ cursor: 'pointer' }} onClick={() => { const c = VM_COMPANIES.find(x => x.ticker === e.ticker); if (c) go('dashboard', c); }}>{e.ticker} →</Mono>}
                          <i className="ti ti-info-circle" title="What is this event?" onClick={() => setEduEvent(e)}
                            style={{ fontSize: 15, color: VM.teal, cursor: 'pointer', flexShrink: 0,
                              opacity: (isMobile || hoverRow === i) ? 1 : 0, transition: 'opacity .12s' }}></i>
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', whiteSpace: 'nowrap', fontFamily: VM.mono, fontSize: 12, color: VM.ink3 }}>—</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', whiteSpace: 'nowrap', fontFamily: VM.mono, fontSize: 12, color: VM.ink2 }}>{e.forecast || '—'}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', whiteSpace: 'nowrap', fontFamily: VM.mono, fontSize: 12, color: VM.ink3 }}>{e.previous || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '10px 14px', borderTop: `1px solid ${VM.borderHair}`, background: VM.paperWarm }}>
            <Mono size={9.5} color={VM.faint}>Actual posts on release · forecast vs previous · illustrative mock data</Mono>
          </div>
        </div>
      )}

      {legend && <CalLegendModal onClose={() => setLegend(false)} />}
      {eduEvent && <CalEduModal e={eduEvent} onClose={() => setEduEvent(null)} />}
      {tutorialOpen && <TutorialOverlay steps={CAL_STEPS} label="Calendar tutorial" onClose={() => setTutorialOpen(false)} />}
    </div>
  );
}

// "What is this event?" — an educational popup explaining the event, how it
// moves markets, and what a bullish vs bearish reading looks like.
function CalEduModal({ e, onClose }) {
  React.useEffect(() => {
    const onKey = (ev) => { if (ev.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const edu = calEduFor(e);
  const t = CAL_TYPES[e.type] || {};
  const imp = CAL_IMPACT[e.impact] || CAL_IMPACT.low;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 85, background: 'rgba(31,29,26,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={(ev) => ev.stopPropagation()} style={{ width: '100%', maxWidth: 540, maxHeight: '85vh', overflowY: 'auto',
        background: VM.paper, border: `1px solid ${VM.border}`, borderRadius: 14, boxShadow: '0 24px 60px rgba(31,29,26,0.3)' }}>
        <div style={{ position: 'sticky', top: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '14px 18px', borderBottom: `1px solid ${VM.borderSoft}`, background: VM.paperWarm }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <i className="ti ti-info-circle" style={{ fontSize: 17, color: VM.teal, marginTop: 2 }}></i>
            <div>
              <span style={{ fontFamily: VM.serif, fontWeight: 700, fontSize: 17, lineHeight: 1.2 }}>{e.title}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 5 }}>
                <span style={{ fontFamily: VM.mono, fontSize: 8.5, fontWeight: 700, color: t.color, border: `1px solid ${t.color}`, borderRadius: 4, padding: '1px 5px' }}>{t.label}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: 999, background: imp.color }}></span>
                  <Mono size={9.5} weight={700} color={imp.color} style={{ textTransform: 'uppercase' }}>{imp.label} impact</Mono>
                </span>
                {e.region && <Mono size={10} color={VM.ink3}>{e.region}</Mono>}
              </div>
            </div>
          </div>
          <i className="ti ti-x" onClick={onClose} title="Close" style={{ fontSize: 18, color: VM.ink3, cursor: 'pointer', flexShrink: 0 }}></i>
        </div>

        <div style={{ padding: '16px 18px 20px' }}>
          <Label style={{ display: 'block', marginBottom: 6, color: VM.terra }}>What it is</Label>
          <p style={{ fontFamily: VM.serif, fontSize: 14, color: VM.ink2, lineHeight: 1.5, margin: 0 }}>{edu.what}</p>

          <Label style={{ display: 'block', margin: '16px 0 6px', color: VM.terra }}>How it moves markets</Label>
          <p style={{ fontFamily: VM.serif, fontSize: 14, color: VM.ink2, lineHeight: 1.5, margin: 0 }}>{edu.moves}</p>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, marginTop: 14, padding: '10px 12px', background: VM.paperWarm, border: `1px solid ${VM.borderSoft}`, borderRadius: 8 }}>
            <span style={{ width: 9, height: 9, borderRadius: 999, background: imp.color, marginTop: 4, flexShrink: 0 }}></span>
            <span style={{ fontFamily: VM.serif, fontSize: 13, color: VM.ink2, lineHeight: 1.45 }}>
              <b style={{ color: imp.color }}>{imp.label} impact.</b> {imp.desc}
            </span>
          </div>

          {edu.good && edu.bad ? (
            <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
              <div style={{ padding: '11px 13px', background: VM.tealTint, border: `1px solid ${VM.tealTint2}`, borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                  <i className="ti ti-trending-up" style={{ fontSize: 15, color: VM.upInk }}></i>
                  <Mono size={10.5} weight={700} color={VM.upInk} style={{ textTransform: 'uppercase', letterSpacing: '0.03em' }}>Supportive · {edu.good.label}</Mono>
                </div>
                <span style={{ fontFamily: VM.serif, fontSize: 13.5, color: VM.ink2, lineHeight: 1.5 }}>{edu.good.text}</span>
              </div>
              <div style={{ padding: '11px 13px', background: 'rgba(192,86,59,0.08)', border: '1px solid rgba(192,86,59,0.22)', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                  <i className="ti ti-trending-down" style={{ fontSize: 15, color: VM.downInk }}></i>
                  <Mono size={10.5} weight={700} color={VM.downInk} style={{ textTransform: 'uppercase', letterSpacing: '0.03em' }}>Pressure · {edu.bad.label}</Mono>
                </div>
                <span style={{ fontFamily: VM.serif, fontSize: 13.5, color: VM.ink2, lineHeight: 1.5 }}>{edu.bad.text}</span>
              </div>
            </div>
          ) : edu.note ? (
            <div style={{ marginTop: 16, padding: '11px 13px', background: VM.tealTint, border: `1px solid ${VM.tealTint2}`, borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                <i className="ti ti-bulb" style={{ fontSize: 15, color: VM.teal }}></i>
                <Mono size={10.5} weight={700} color={VM.teal} style={{ textTransform: 'uppercase', letterSpacing: '0.03em' }}>What to watch</Mono>
              </div>
              <span style={{ fontFamily: VM.serif, fontSize: 13.5, color: VM.ink2, lineHeight: 1.5 }}>{edu.note}</span>
            </div>
          ) : null}

          <Mono size={9.5} color={VM.faint} style={{ display: 'block', marginTop: 16 }}>Educational summary · illustrative, not financial advice</Mono>
        </div>
      </div>
    </div>
  );
}

// Legend / how-to-read popup for the calendar (columns, impact, event types).
function CalLegendModal({ onClose }) {
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(31,29,26,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 560, maxHeight: '85vh', overflowY: 'auto',
        background: VM.paper, border: `1px solid ${VM.border}`, borderRadius: 14, boxShadow: '0 24px 60px rgba(31,29,26,0.3)' }}>
        <div style={{ position: 'sticky', top: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', borderBottom: `1px solid ${VM.borderSoft}`, background: VM.paperWarm }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <i className="ti ti-key" style={{ fontSize: 16, color: VM.teal }}></i>
            <span style={{ fontFamily: VM.serif, fontWeight: 700, fontSize: 17 }}>Legend &amp; how to read it.</span>
          </div>
          <i className="ti ti-x" onClick={onClose} title="Close" style={{ fontSize: 18, color: VM.ink3, cursor: 'pointer' }}></i>
        </div>

        <div style={{ padding: '16px 18px 20px' }}>
          <Label style={{ display: 'block', marginBottom: 8, color: VM.terra }}>Columns</Label>
          {CAL_COL_HELP.map(([k, d]) => (
            <div key={k} style={{ display: 'grid', gridTemplateColumns: '92px 1fr', gap: 10, padding: '6px 0', borderBottom: `1px dotted ${VM.border}` }}>
              <Mono size={11} weight={700} color={VM.ink}>{k}</Mono>
              <span style={{ fontFamily: VM.serif, fontSize: 13, color: VM.ink2, lineHeight: 1.45 }}>{d}</span>
            </div>
          ))}
          <div style={{ marginTop: 10, padding: '10px 12px', background: VM.tealTint, border: `1px solid ${VM.tealTint2}`, borderRadius: 8 }}>
            <span style={{ fontFamily: VM.serif, fontSize: 13, color: VM.ink2, lineHeight: 1.5 }}>
              <b>How to read it:</b> compare <b>Actual</b> against <b>Forecast</b> — a beat or miss versus consensus drives most of the move; <b>Previous</b> shows the trend.
            </span>
          </div>

          <Label style={{ display: 'block', margin: '18px 0 8px', color: VM.terra }}>Impact</Label>
          {Object.values(CAL_IMPACT).map(im => (
            <div key={im.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '6px 0' }}>
              <span style={{ width: 9, height: 9, borderRadius: 999, background: im.color, marginTop: 4, flexShrink: 0 }}></span>
              <div>
                <Mono size={11} weight={700} color={im.color} style={{ textTransform: 'uppercase' }}>{im.label}</Mono>
                <div style={{ fontFamily: VM.serif, fontSize: 13, color: VM.ink2, lineHeight: 1.45 }}>{im.desc}</div>
              </div>
            </div>
          ))}

          <Label style={{ display: 'block', margin: '18px 0 8px', color: VM.terra }}>Event types</Label>
          {Object.values(CAL_TYPES).map(t => (
            <div key={t.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '6px 0' }}>
              <span style={{ width: 9, height: 9, borderRadius: 999, background: t.color, marginTop: 4, flexShrink: 0 }}></span>
              <div>
                <span style={{ fontFamily: VM.serif, fontWeight: 700, fontSize: 13.5, color: VM.ink }}>{t.label}</span>
                <div style={{ fontFamily: VM.serif, fontSize: 13, color: VM.ink2, lineHeight: 1.45 }}>{t.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Calendar });
