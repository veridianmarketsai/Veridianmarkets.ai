// V4 — Memoir-First. The thesis leads. A big editorial quote sets tone,
// then ONE chart-led story, then a quiet rail of data. Hierarchy reversed
// vs a trading terminal — feels like an essay with a market sidebar.

function V4_MemoirFirst({ palette }) {
  const W = 1280;
  return (
    <div style={{ width: W, background: WF_PAPER, fontFamily: 'var(--wf-body)', color: WF_INK }}>
      <TopNav palette={palette} variant="underline" activeItem="Memoir" />

      {/* HERO — the founder's stance, big serif quote */}
      <div style={{ padding: '36px 56px 28px', display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32, borderBottom: `1.6px solid ${WF_INK}` }}>
        <div>
          <Mono size={11} color={palette.accent} weight={700}>OUR THESIS</Mono>
          <div style={{ marginTop: 14, fontFamily: 'var(--wf-serif)', fontStyle: 'italic', fontSize: 58, lineHeight: 1.02, color: WF_INK, fontWeight: 500 }}>
            "We don't <span style={{ textDecoration: `wavy underline ${palette.accent2}`, textDecorationStyle: 'wavy' }}>guess</span> next week.
            <br/>We <span style={{ background: palette.tint, padding: '0 6px' }}>read the long arc</span> —
            <br/>and we give it to <em>you</em>, not just the desks."
          </div>
          <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Hatched width={42} height={42} style={{ borderRadius: '50%' }} />
              <div>
                <Scribble size={15} weight={600}>The founder</Scribble>
                <Mono size={10} color={WF_INK_FAINT}>founder@veridian</Mono>
              </div>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ padding: '8px 16px', background: palette.accent, color: WF_PAPER, borderRadius: 18 }}>
              <Scribble size={16} weight={600} color={WF_PAPER}>Read the full memoir →</Scribble>
            </div>
          </div>
          <Pin style={{ top: 30, right: 60 }} side="left">page 3 of the app — but teased here</Pin>
        </div>

        {/* compact today-strip on the side */}
        <SketchBox style={{ padding: 14, alignSelf: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
            <Scribble size={16} weight={700}>The tape, briefly</Scribble>
            <div style={{ flex: 1 }} />
            <Mono size={9} color={WF_INK_FAINT}>14:32 UTC</Mono>
          </div>
          {[
            ['S&P',      '5,247', '+0.42%', 'up'],
            ['NASDAQ',   '16,542','+0.71%', 'up'],
            ['DOW',      '38,991','-0.18%', 'down'],
            ['FTSE',     '8,011', '+0.05%', 'up'],
            ['GOLD',     '2,341', '+0.88%', 'up'],
            ['BRENT',    '$83.20','+1.40%', 'up'],
            ['10Y UST',  '4.21%', '-0.03',  'down'],
            ['EUR/USD',  '1.0842','-0.09%', 'down'],
            ['BTC',      '69,420','-2.31%', 'down'],
          ].map(([s, p, c, d]) => (
            <div key={s} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 28px 48px', gap: 6, padding: '4px 0', borderBottom: `1px dashed ${WF_INK_FAINT}`, alignItems: 'center' }}>
              <Mono size={10} weight={700}>{s}</Mono>
              <Mono size={10} color={WF_INK_SOFT}>{p}</Mono>
              <Sparkline width={24} height={11} trend={d} color={d === 'up' ? '#4a7c59' : '#b35a3a'} strokeWidth={1.1} />
              <Mono size={10} weight={600} color={d === 'up' ? '#4a7c59' : '#b35a3a'}>{c}</Mono>
            </div>
          ))}
          <div style={{ marginTop: 6, textAlign: 'right' }}>
            <Scribble size={13} color={palette.accent}>Full recap →</Scribble>
          </div>
        </SketchBox>
      </div>

      {/* ONE big lens piece */}
      <div style={{ padding: '36px 56px 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <Mono size={11} color={palette.accent} weight={700}>THIS WEEK · 5-YEAR LENS</Mono>
          <div style={{ flex: 1, borderBottom: `1.2px dashed ${WF_INK_FAINT}`, marginBottom: 6 }}></div>
          <Mono size={11} color={WF_INK_FAINT}>chapter 14</Mono>
        </div>
        <Scribble size={44} weight={700} style={{ display: 'block', marginTop: 8, lineHeight: 1.0 }}>
          The 1973 chart everyone forgot — and what it priced in.
        </Scribble>
        <Scribble size={22} color={WF_INK_SOFT} style={{ display: 'block', marginTop: 8, lineHeight: 1.2 }}>
          Brent didn't recover for six years. Equities did, in three. Here's why the gap matters now.
        </Scribble>

        <div style={{ marginTop: 18 }}>
          <ChartPlaceholder width={W - 112} height={300} accent={palette.accent} label="Energy vs equities · 1973–79 then 2022–today" overlayHistory />
        </div>

        <div style={{ marginTop: 14, display: 'flex', gap: 16, alignItems: 'center' }}>
          <Mono size={11} color={WF_INK_FAINT}>Written by Veridian AI · sourced from FRED, BLS, OPEC archives · cited inline</Mono>
          <div style={{ flex: 1 }} />
          <Scribble size={15} color={palette.accent}>Open the data layer →</Scribble>
        </div>
      </div>

      {/* Quiet news rail */}
      <div style={{ padding: '36px 56px' }}>
        <SectionHead num="·">Also today</SectionHead>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
          {[
            ['MACRO',    'Powell pauses. The 2018 echo.',     'The Fed has paused at this level before. Three things happened next.'],
            ['EARNINGS', 'AAPL\'s services pivot ≈ IBM \'92', 'Same margin story, different decade. The chart says yes — partly.'],
            ['CHINA',    'Property unwind, slow Japan',       'Tokyo \'90 vs Shanghai \'25. The debt curve overlay is uncomfortable.'],
          ].map(([k, t, sub], i) => (
            <div key={i}>
              <Mono size={10} color={palette.accent} weight={700}>{k}</Mono>
              <Scribble size={24} weight={700} style={{ display: 'block', marginTop: 4, lineHeight: 1.1 }}>{t}</Scribble>
              <Scribble size={15} color={WF_INK_SOFT} style={{ display: 'block', marginTop: 6, lineHeight: 1.25 }}>{sub}</Scribble>
              <Mono size={10} color={WF_INK_FAINT} style={{ display: 'block', marginTop: 8 }}>{4-i}h · Veridian AI</Mono>
            </div>
          ))}
        </div>
      </div>

      {/* Footer-ish: "what is veridian" */}
      <div style={{ padding: '24px 56px 40px', borderTop: `1.6px solid ${WF_INK}`, background: palette.tint, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 22 }}>
        {[
          ['01', 'Truth',      'Cite everything, including the model.'],
          ['02', 'History',    'Five-year intervals, not five-day.'],
          ['03', 'Plain English', 'No jargon firewall.'],
          ['04', 'For you',    'Tools the desks have. Open.'],
        ].map(([n, h, b]) => (
          <div key={n}>
            <Mono size={11} color={WF_INK_FAINT} weight={700}>{n}</Mono>
            <Scribble size={22} weight={700} style={{ display: 'block', marginTop: 2 }}>{h}</Scribble>
            <Scribble size={14} color={WF_INK_SOFT} style={{ display: 'block', marginTop: 4, lineHeight: 1.25 }}>{b}</Scribble>
          </div>
        ))}
      </div>
    </div>
  );
}

window.V4_MemoirFirst = V4_MemoirFirst;
