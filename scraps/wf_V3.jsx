// V3 — Terminal Grid. Dense, panel-of-equals, Bloomberg-leaning. Every
// module gets ~equal real estate. Power-user feel; news pushed down.

function V3_Terminal({ palette }) {
  const W = 1280;

  const panel = { padding: 12, minHeight: 230 };

  return (
    <div style={{ width: W, background: WF_PAPER, fontFamily: 'var(--wf-body)', color: WF_INK }}>
      <TopNav palette={palette} variant="bracket" activeItem="Dashboard" />
      <IndexStrip palette={palette} />

      {/* Top control row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 22px',
        borderBottom: `1.2px dashed ${WF_INK_FAINT}`,
        background: WF_PAPER,
      }}>
        <Mono size={11} color={WF_INK_FAINT} weight={700}>LAYOUT:</Mono>
        {['Default', 'Macro', 'Earnings', 'My grid'].map((l, i) => (
          <Mono key={l} size={11} weight={i === 0 ? 700 : 500} color={i === 0 ? palette.accent : WF_INK_SOFT}>
            {i === 0 ? `[${l}]` : l}
          </Mono>
        ))}
        <div style={{ flex: 1 }} />
        <Mono size={11} color={WF_INK_FAINT}>AS OF · 14:32 UTC · LIVE ●</Mono>
      </div>

      {/* Main grid — 4 col × 2 row */}
      <div style={{ padding: '14px 22px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>

        {/* MARKET RECAP — tabbed */}
        <SketchBox style={panel}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
            <Scribble size={18} weight={700}>Market recap</Scribble>
            <div style={{ flex: 1 }} />
            <Mono size={9} color={WF_INK_FAINT}>1D ▾</Mono>
          </div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 10, borderBottom: `1px solid ${WF_INK}` }}>
            {['Stocks', 'Forex', 'Bonds', 'Crypto', 'Funds'].map((t, i) => (
              <div key={t} style={{
                padding: '4px 7px',
                borderBottom: i === 0 ? `2px solid ${palette.accent}` : '2px solid transparent',
                marginBottom: -1,
              }}>
                <Mono size={10} weight={i === 0 ? 700 : 500} color={i === 0 ? palette.accent : WF_INK_SOFT}>{t}</Mono>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {[
              ['S&P 500', '5247.10', '+0.42', 'up'],
              ['NASDAQ',  '16542.0', '+0.71', 'up'],
              ['DOW',     '38991.5', '-0.18', 'down'],
              ['R 2000',  '2104.30', '+0.11', 'up'],
              ['FTSE',    '8011.20', '+0.05', 'up'],
              ['DAX',     '18495.7', '-0.34', 'down'],
              ['NIKKEI',  '40168.0', '-1.12', 'down'],
              ['HSI',     '17240.4', '+0.66', 'up'],
            ].map(([s, p, c, d]) => (
              <div key={s} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 36px 40px', gap: 4, alignItems: 'center' }}>
                <Mono size={10} weight={600}>{s}</Mono>
                <Mono size={10} color={WF_INK_SOFT}>{p}</Mono>
                <Sparkline width={32} height={11} trend={d} color={d === 'up' ? '#4a7c59' : '#b35a3a'} strokeWidth={1.1} />
                <Mono size={10} weight={600} color={d === 'up' ? '#4a7c59' : '#b35a3a'}>{c}%</Mono>
              </div>
            ))}
          </div>
        </SketchBox>

        {/* TOP MOVERS */}
        <SketchBox style={panel}>
          <Scribble size={18} weight={700} style={{ display: 'block', marginBottom: 8 }}>Top movers · S&P</Scribble>
          <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
            {['Gainers', 'Losers', 'Active'].map((t, i) => (
              <Mono key={t} size={10} weight={i === 0 ? 700 : 500} color={i === 0 ? palette.accent : WF_INK_SOFT}
                    style={{ padding: '2px 6px', border: `1px solid ${i === 0 ? palette.accent : WF_INK_FAINT}`, borderRadius: 10 }}>
                {t}
              </Mono>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {[
              ['NVDA', '+3.40%', '945.10'],
              ['SMCI', '+2.91%', '824.50'],
              ['AVGO', '+2.10%', '1342.0'],
              ['META', '+1.87%', '498.22'],
              ['AMD',  '+1.66%', '162.30'],
              ['AAPL', '+1.26%', '308.82'],
              ['MSFT', '+0.84%', '427.15'],
              ['BRK.B','+0.31%', '418.92'],
            ].map(([s, c, p]) => (
              <div key={s} style={{ display: 'grid', gridTemplateColumns: '50px 1fr 56px', gap: 6, alignItems: 'center' }}>
                <Mono size={10} weight={700}>{s}</Mono>
                <Mono size={10} weight={600} color="#4a7c59">{c}</Mono>
                <Mono size={10} color={WF_INK_SOFT} style={{ textAlign: 'right' }}>{p}</Mono>
              </div>
            ))}
          </div>
        </SketchBox>

        {/* CENTRAL BANK RATES */}
        <SketchBox style={panel}>
          <Scribble size={18} weight={700} style={{ display: 'block', marginBottom: 8 }}>Central bank rates</Scribble>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {[
              ['AUD · RBA',  '4.35%', 'flat'],
              ['USD · FED',  '5.25%', 'flat'],
              ['GBP · BoE',  '5.25%', 'flat'],
              ['CAD · BoC',  '4.75%', 'down'],
              ['NZD · RBNZ', '5.50%', 'flat'],
              ['EUR · ECB',  '4.00%', 'down'],
              ['JPY · BoJ',  '0.10%', 'up'],
              ['CHF · SNB',  '1.50%', 'down'],
            ].map(([n, r, d]) => (
              <div key={n} style={{ display: 'grid', gridTemplateColumns: '1fr 48px 16px', gap: 4, alignItems: 'center' }}>
                <Mono size={10} weight={600}>{n}</Mono>
                <Mono size={10}>{r}</Mono>
                <Mono size={11} color={d === 'up' ? '#4a7c59' : d === 'down' ? '#b35a3a' : WF_INK_FAINT}>
                  {d === 'up' ? '↑' : d === 'down' ? '↓' : '·'}
                </Mono>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8, paddingTop: 6, borderTop: `1px dashed ${WF_INK_FAINT}` }}>
            <Scribble size={13} color={palette.accent}>Hike/cut calendar →</Scribble>
          </div>
        </SketchBox>

        {/* ECONOMIC CALENDAR */}
        <SketchBox style={panel}>
          <Scribble size={18} weight={700} style={{ display: 'block', marginBottom: 8 }}>Calendar · this week</Scribble>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              ['MON', 'US · ISM Manuf.',  '48.4 ', 'low'],
              ['TUE', 'EU · CPI flash',   '2.6%',  'med'],
              ['WED', 'FED · minutes',    '14:00', 'high'],
              ['THU', 'BoE · rate decn',  '5.25%', 'high'],
              ['THU', 'US · jobless',     '218k',  'low'],
              ['FRI', 'US · NFP',         '180k',  'high'],
              ['FRI', 'CA · employment',  '20k',   'med'],
            ].map(([d, e, v, sev], i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '34px 1fr 50px 12px', gap: 4, alignItems: 'center' }}>
                <Mono size={9} color={WF_INK_FAINT} weight={700}>{d}</Mono>
                <Scribble size={13}>{e}</Scribble>
                <Mono size={10} color={WF_INK_SOFT} style={{ textAlign: 'right' }}>{v}</Mono>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: sev === 'high' ? '#b35a3a' : sev === 'med' ? palette.accent2 : WF_INK_FAINT,
                  border: `1px solid ${WF_INK}`,
                }}></div>
              </div>
            ))}
          </div>
        </SketchBox>

        {/* COMPANY SCREENER PREVIEW (row 2 — span 2) */}
        <SketchBox style={{ ...panel, gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
            <Scribble size={18} weight={700}>Companies · screener</Scribble>
            <div style={{ flex: 1 }} />
            <Mono size={10} color={WF_INK_FAINT}>4,904 LISTED · filter ▾</Mono>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '24px 60px 1fr 60px 50px 56px 70px 70px', gap: 6, padding: '6px 0', borderBottom: `1.4px solid ${WF_INK}` }}>
            {['#','SYM','NAME','PRICE','CHG%','VOL','MKT CAP','SECTOR'].map(h => <Mono key={h} size={9} color={WF_INK_FAINT} weight={700}>{h}</Mono>)}
          </div>
          {[
            ['1', 'A',    'Agilent Tech.',        '114.96', '+0.15', '2.04M', '32.49B', 'Health'],
            ['2', 'AA',   'Alcoa Corp.',          '71.38',  '+7.71', '6.95M', '18.84B', 'Materials'],
            ['3', 'AACB', 'Artius II Acq.',       '10.44',  '0.00',  '1.76K', '288M',   'Finance'],
            ['4', 'AAL',  'American Airlines',    '13.85',  '+1.91', '99.28M','9.16B',  'Transport'],
            ['5', 'AAPL', 'Apple Inc.',           '308.82', '+1.26', '43.67M','4.54T',  'Tech'],
            ['6', 'AAON', 'AAON, Inc.',           '134.60', '+1.67', '944K',  '11.03B', 'Mfg'],
          ].map((r, i) => {
            const chg = r[4];
            const pos = chg.startsWith('+');
            const zero = chg === '0.00';
            return (
              <div key={r[1]} style={{ display: 'grid', gridTemplateColumns: '24px 60px 1fr 60px 50px 56px 70px 70px', gap: 6, padding: '6px 0', borderBottom: `1px dashed ${WF_INK_FAINT}`, alignItems: 'center' }}>
                <Mono size={10} color={WF_INK_FAINT}>{r[0]}</Mono>
                <Mono size={10} weight={700}>{r[1]}</Mono>
                <Scribble size={13}>{r[2]}</Scribble>
                <Mono size={10}>{r[3]}</Mono>
                <Mono size={10} weight={600} color={zero ? WF_INK_FAINT : pos ? '#4a7c59' : '#b35a3a'}>{chg}%</Mono>
                <Mono size={10} color={WF_INK_SOFT}>{r[5]}</Mono>
                <Mono size={10} color={WF_INK_SOFT}>{r[6]}</Mono>
                <Mono size={10} color={WF_INK_SOFT}>{r[7]}</Mono>
              </div>
            );
          })}
          <Pin style={{ top: 8, right: -8 }} side="right">links to per-company dashboard</Pin>
        </SketchBox>

        {/* NEWS / 5-YEAR LENS COMBO (row 2 — span 2) */}
        <SketchBox style={{ ...panel, gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <Scribble size={18} weight={700} style={{ display: 'block', marginBottom: 6 }}>Today · in plain English</Scribble>
            {[
              ['MACRO',    'Powell pause — the 2018 echo',     '6m'],
              ['OIL',      'Brent +24% YTD vs the 1973 curve', '4m'],
              ['EARNINGS', 'AAPL services pivot ≈ IBM 1992',    '3m'],
              ['EU',       'Gas storage full — like 1980',     '2m'],
              ['CHINA',    'Property unwind, 90s-Japan pace',  '3m'],
            ].map(([k, t, len], i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '64px 1fr 30px', gap: 6, padding: '5px 0', borderBottom: `1px dashed ${WF_INK_FAINT}`, alignItems: 'baseline' }}>
                <Mono size={9} color={palette.accent} weight={700}>{k}</Mono>
                <Scribble size={14}>{t}</Scribble>
                <Mono size={9} color={WF_INK_FAINT} style={{ textAlign: 'right' }}>{len}</Mono>
              </div>
            ))}
          </div>
          <div>
            <Scribble size={18} weight={700} style={{ display: 'block', marginBottom: 6 }}>5-year lens · pick a chart</Scribble>
            <ChartPlaceholder width={290} height={170} accent={palette.accent} label="S&P · now vs '73" overlayHistory />
            <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
              {['Oil', 'CPI', 'Yields', 'USD', 'Gold'].map((c, i) => (
                <Mono key={c} size={9} weight={i === 0 ? 700 : 500} color={i === 0 ? palette.accent : WF_INK_SOFT}
                      style={{ padding: '2px 6px', border: `1px solid ${i === 0 ? palette.accent : WF_INK_FAINT}`, borderRadius: 8 }}>
                  {c}
                </Mono>
              ))}
            </div>
          </div>
        </SketchBox>
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
}

window.V3_Terminal = V3_Terminal;
