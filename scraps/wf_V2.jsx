// V2 — Time Machine. The unique angle (5-year lens) leads with a huge hero
// chart. Everything else supports the thesis: "history → today → pattern".

function V2_TimeMachine({ palette }) {
  const W = 1280;
  return (
    <div style={{ width: W, background: WF_PAPER, fontFamily: 'var(--wf-body)', color: WF_INK }}>
      <TopNav palette={palette} variant="underline" activeItem="Markets" />

      {/* Mission strap */}
      <div style={{ padding: '20px 28px 0', display: 'flex', alignItems: 'baseline', gap: 14 }}>
        <Scribble size={42} weight={700} style={{ lineHeight: 1 }}>The 5-year lens.</Scribble>
        <Scribble size={20} color={WF_INK_SOFT}>We don't forecast next week — we read the long arc.</Scribble>
        <div style={{ flex: 1 }} />
        <Mono size={11} color={WF_INK_FAINT}>UPDATED · today 14:32 UTC</Mono>
      </div>

      {/* Hero chart */}
      <div style={{ padding: '14px 28px 0', position: 'relative' }}>
        <ChartPlaceholder width={W - 56} height={360} accent={palette.accent} label="S&P 500 · today vs the 1973–75 oil-shock analogue" overlayHistory />
        <Pin style={{ top: 28, right: 200 }} side="right">overlay any 2 eras</Pin>
        {/* time-range chips */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
          <Mono size={11} color={WF_INK_FAINT}>COMPARE ERA:</Mono>
          {['1973–75', '1987', '2000–02', '2008–09', '2018', '2020', '2022'].map((era, i) => (
            <div key={era} style={{
              padding: '4px 10px',
              border: `1.3px solid ${i === 0 ? palette.accent : WF_INK_FAINT}`,
              borderRadius: 12,
              background: i === 0 ? palette.tint : 'transparent',
            }}>
              <Mono size={10} weight={i === 0 ? 700 : 500} color={i === 0 ? palette.accent : WF_INK_SOFT}>{era}</Mono>
            </div>
          ))}
          <div style={{ flex: 1 }} />
          <Mono size={11} color={WF_INK_FAINT}>SECTOR: ENERGY ▾</Mono>
        </div>
      </div>

      {/* Three columns — THEN / NOW / PATTERN */}
      <div style={{ padding: '28px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18 }}>
        {[
          { num: '01', head: 'THEN', sub: '1973 — Oil embargo', body: 'OPEC cuts 4 mb/d. Brent triples in 6 months. S&P −48% peak to trough. Stagflation begins.', ink: WF_INK },
          { num: '02', head: 'NOW',  sub: '2026 — Red-Sea + sanctions', body: 'Supply squeeze + Iran-route risk. Brent +24% YTD. Headline CPI sticky at 3.4%.', ink: palette.accent },
          { num: '03', head: 'PATTERN', sub: 'What is similar (and not)', body: 'Both: supply-side, geo-political. Different: USD reserve role, shale flex capacity, demand peak in sight.', ink: '#b35a3a' },
        ].map(c => (
          <SketchBox key={c.num} style={{ padding: 18, minHeight: 200 }}>
            <Mono size={10} color={WF_INK_FAINT} weight={700}>{c.num}</Mono>
            <Scribble size={32} weight={700} color={c.ink} style={{ display: 'block', marginTop: 4 }}>{c.head}</Scribble>
            <Mono size={11} color={WF_INK_SOFT} weight={600} style={{ display: 'block', marginTop: 6 }}>{c.sub}</Mono>
            <Scribble size={17} color={WF_INK} style={{ display: 'block', marginTop: 10, lineHeight: 1.25 }}>{c.body}</Scribble>
            <div style={{ marginTop: 14, paddingTop: 8, borderTop: `1px dashed ${WF_INK_FAINT}` }}>
              <Scribble size={14} color={palette.accent}>Open the data →</Scribble>
            </div>
          </SketchBox>
        ))}
      </div>

      {/* Index strip — secondary */}
      <div style={{ padding: '0 28px' }}>
        <SectionHead num="04">Today's tape · for context</SectionHead>
        <IndexStrip palette={palette} />
      </div>

      {/* News + recap */}
      <div style={{ padding: '20px 28px 28px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 22 }}>
        <div>
          <SectionHead num="05">Today's stories, linked to history</SectionHead>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              ['FED · 2018 ECHO', 'Powell\'s pause: the playbook from late 2018', '+ 1995, 2007 analogues'],
              ['CHINA · 90s JAPAN', 'Property unwind in slow motion — Tokyo \'90 vs Shanghai \'25', '+ debt-to-GDP overlay'],
              ['AAPL · CASH CYCLE', 'Apple\'s services pivot looks like IBM\'s 1992 turn', '+ revenue mix chart'],
              ['EU · ENERGY', 'Gas storage is full. So was 1980. Then this happened →', '+ winter draw curve'],
            ].map(([k, t, sub], i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '16px 1fr 90px', gap: 14, padding: '10px 0', borderTop: `1.2px dashed ${WF_INK_FAINT}`, alignItems: 'baseline' }}>
                <Mono size={11} color={WF_INK_FAINT} weight={700}>{String(i+1).padStart(2,'0')}</Mono>
                <div>
                  <Mono size={10} color={palette.accent} weight={700}>{k}</Mono>
                  <Scribble size={22} weight={600} style={{ display: 'block', marginTop: 2, lineHeight: 1.15 }}>{t}</Scribble>
                  <Scribble size={14} color={WF_INK_SOFT} style={{ display: 'block', marginTop: 2 }}>{sub}</Scribble>
                </div>
                <Mono size={10} color={WF_INK_FAINT} style={{ textAlign: 'right' }}>{6 - i*2}h ago</Mono>
              </div>
            ))}
          </div>
        </div>

        <SketchBox style={{ padding: 16, alignSelf: 'flex-start' }}>
          <SectionHead num="06">Central bank rates</SectionHead>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              ['AUD', 'RBA', '4.35%', 'flat'],
              ['USD', 'FED', '5.25%', 'flat'],
              ['GBP', 'BoE', '5.25%', 'flat'],
              ['CAD', 'BoC', '4.75%', 'down'],
              ['NZD', 'RBNZ','5.50%', 'flat'],
              ['EUR', 'ECB', '4.00%', 'down'],
              ['JPY', 'BoJ', '0.10%', 'up'],
              ['CHF', 'SNB', '1.50%', 'down'],
            ].map(([c, b, r, d]) => (
              <div key={c} style={{ display: 'grid', gridTemplateColumns: '36px 1fr 50px 16px', gap: 6, alignItems: 'center', padding: '3px 0', borderBottom: `1px dashed ${WF_INK_FAINT}` }}>
                <Mono size={11} weight={700}>{c}</Mono>
                <Mono size={10} color={WF_INK_SOFT}>{b}</Mono>
                <Mono size={11} weight={600}>{r}</Mono>
                <Mono size={11} color={d === 'up' ? '#4a7c59' : d === 'down' ? '#b35a3a' : WF_INK_FAINT}>{d === 'up' ? '↑' : d === 'down' ? '↓' : '·'}</Mono>
              </div>
            ))}
          </div>
        </SketchBox>
      </div>
    </div>
  );
}

window.V2_TimeMachine = V2_TimeMachine;
