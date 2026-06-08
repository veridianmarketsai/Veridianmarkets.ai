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

function Calendar({ go, isMobile }) {
  const [filter, setFilter] = useStateCal('all');
  const [ym, setYm] = useStateCal({ y: CAL_YEAR, m: CAL_MONTH });   // month being viewed
  const [sel, setSel] = useStateCal(CAL_TODAY);
  const [view, setView] = useStateCal('month');   // 'month' grid | 'list' table
  const [legend, setLegend] = useStateCal(false); // legend / how-to-read popup
  const [listAnchor, setListAnchor] = useStateCal(() => new Date(CAL_YEAR, CAL_MONTH, CAL_TODAY));
  const [range, setRange] = useStateCal('month'); // list view window: 'week' | 'month'

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
    .sort((a, b) => a.date - b.date || (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));
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

  return (
    <div style={{ padding: isMobile ? '16px 16px 80px' : '26px 32px 60px', maxWidth: 1120, margin: '0 auto' }}>
      <Kicker>Calendar · {CAL_EVENTS.length} events</Kicker>
      <h1 style={{ fontFamily: VM.serif, fontWeight: 700, fontSize: isMobile ? 27 : 32, lineHeight: 1.05, margin: '8px 0 0' }}>Calendar.</h1>
      <p style={{ fontFamily: VM.serif, fontSize: isMobile ? 15 : 16, color: VM.ink2, maxWidth: 620, margin: '8px 0 0' }}>
        Earnings, economic releases and central-bank decisions — the week ahead, read against history.
      </p>

      {/* type filter + view toggle */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 18 }}>
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
        {/* month grid */}
        <div style={{ background: VM.paper, border: `1px solid ${VM.borderSoft}`, borderRadius: 14, padding: isMobile ? '14px' : '16px 18px' }}>
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

        {/* selected-day panel */}
        <div style={{ background: VM.paper, border: `1px solid ${VM.borderSoft}`, borderRadius: 14, overflow: 'hidden' }}>
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
                    <div style={{ fontFamily: VM.serif, fontSize: 15, color: VM.ink }}>{e.title}</div>
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
          {/* week / month navigator */}
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
                    <tr key={i} style={{ borderTop: `1px solid ${firstOfDay ? VM.borderSoft : VM.borderHair}`,
                      background: e.d === CAL_TODAY ? VM.tealTint : 'transparent' }}>
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
        {/* header */}
        <div style={{ position: 'sticky', top: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', borderBottom: `1px solid ${VM.borderSoft}`, background: VM.paperWarm }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <i className="ti ti-key" style={{ fontSize: 16, color: VM.teal }}></i>
            <span style={{ fontFamily: VM.serif, fontWeight: 700, fontSize: 17 }}>Legend &amp; how to read it.</span>
          </div>
          <i className="ti ti-x" onClick={onClose} title="Close" style={{ fontSize: 18, color: VM.ink3, cursor: 'pointer' }}></i>
        </div>

        <div style={{ padding: '16px 18px 20px' }}>
          {/* columns */}
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

          {/* impact */}
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

          {/* event types */}
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
