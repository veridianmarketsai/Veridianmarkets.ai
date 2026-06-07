// Veridian Markets — Calendar page.
// An economic / events calendar: month grid with type-coded event dots, a
// type filter, and a day panel that lists the selected day's events. Mock data.
const { useState: useStateCal } = React;

const CAL_YEAR = 2026, CAL_MONTH = 5; // June 2026 (0-indexed month)
const CAL_MONTH_NAME = 'June 2026';
const CAL_TODAY = 1;                  // app's mock "today" = 1 June 2026

const CAL_TYPES = {
  earn: { label: 'Earnings',     color: VM.teal },
  econ: { label: 'Economic',     color: VM.terra },
  cb:   { label: 'Central bank', color: VM.forest },
  div:  { label: 'Dividend',     color: VM.ink3 },
  mkt:  { label: 'Markets',      color: VM.rust },
};
const CAL_EVENTS = [
  { d: 3,  time: '14:00', title: 'FOMC minutes',           type: 'cb' },
  { d: 3,  time: '15:30', title: 'US jobless claims',      type: 'econ' },
  { d: 5,  time: '13:30', title: 'US non-farm payrolls',   type: 'econ' },
  { d: 6,  time: '—',     title: 'AAPL ex-dividend',       type: 'div',  ticker: 'AAPL' },
  { d: 10, time: '21:00', title: 'NVIDIA earnings · Q1',   type: 'earn', ticker: 'NVDA' },
  { d: 12, time: '13:30', title: 'US CPI · May',           type: 'econ' },
  { d: 17, time: '19:00', title: 'FOMC rate decision',     type: 'cb' },
  { d: 18, time: '21:00', title: 'Microsoft earnings · Q4',type: 'earn', ticker: 'MSFT' },
  { d: 20, time: '—',     title: 'Quadruple witching',     type: 'mkt' },
  { d: 25, time: '13:30', title: 'US GDP · final Q1',      type: 'econ' },
  { d: 27, time: '13:30', title: 'US PCE inflation',       type: 'econ' },
];

function Calendar({ go, isMobile }) {
  const [filter, setFilter] = useStateCal('all');
  const [sel, setSel] = useStateCal(CAL_TODAY);

  const events = CAL_EVENTS.filter(e => filter === 'all' || e.type === filter);
  const dayEvents = (d) => events.filter(e => e.d === d);
  const selEvents = dayEvents(sel);

  const firstDow = new Date(CAL_YEAR, CAL_MONTH, 1).getDay();         // 0=Sun
  const daysIn = new Date(CAL_YEAR, CAL_MONTH + 1, 0).getDate();      // 30
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysIn; d++) cells.push(d);

  return (
    <div style={{ padding: isMobile ? '16px 16px 80px' : '26px 32px 60px', maxWidth: 1120, margin: '0 auto' }}>
      <Kicker>Calendar · {CAL_EVENTS.length} events</Kicker>
      <h1 style={{ fontFamily: VM.serif, fontWeight: 700, fontSize: isMobile ? 27 : 32, lineHeight: 1.05, margin: '8px 0 0' }}>Calendar.</h1>
      <p style={{ fontFamily: VM.serif, fontSize: isMobile ? 15 : 16, color: VM.ink2, maxWidth: 620, margin: '8px 0 0' }}>
        Earnings, economic releases and central-bank decisions — the week ahead, read against history.
      </p>

      {/* type filter */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 18 }}>
        <Pill active={filter === 'all'} onClick={() => setFilter('all')}>All</Pill>
        {Object.entries(CAL_TYPES).map(([k, t]) => (
          <Pill key={k} active={filter === k} onClick={() => setFilter(k)}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: t.color, display: 'inline-block' }}></span>{t.label}
          </Pill>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.6fr 1fr', gap: isMobile ? 16 : 20, marginTop: 20, alignItems: 'start' }}>
        {/* month grid */}
        <div style={{ background: VM.paper, border: `1px solid ${VM.borderSoft}`, borderRadius: 14, padding: isMobile ? '14px' : '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontFamily: VM.serif, fontWeight: 700, fontSize: 18 }}>{CAL_MONTH_NAME}</span>
            <span style={{ fontFamily: VM.mono, fontSize: 13, color: VM.ink3 }}>‹  ›</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <Mono key={d} size={9.5} color={VM.ink3} style={{ textAlign: 'center', paddingBottom: 4 }}>{d}</Mono>)}
            {cells.map((d, i) => {
              if (!d) return <div key={i}></div>;
              const evs = dayEvents(d);
              const isToday = d === CAL_TODAY, isSel = d === sel;
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
            <Label>{sel === CAL_TODAY ? 'Today' : 'Selected'}</Label>
            <div style={{ fontFamily: VM.serif, fontWeight: 700, fontSize: 17, marginTop: 2 }}>{sel} June 2026</div>
          </div>
          <div style={{ padding: '6px 16px 14px' }}>
            {selEvents.length === 0 && <div style={{ padding: '22px 0', textAlign: 'center', fontFamily: VM.serif, fontSize: 14, color: VM.ink3 }}>No events on this day.</div>}
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
    </div>
  );
}

Object.assign(window, { Calendar });
