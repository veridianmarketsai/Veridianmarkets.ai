// V1 — News-Forward (Editorial). The story is biggest. Market data is a thin
// strip up top + a right rail. Beginner-friendly: feels like a magazine.

function V1_Editorial({ palette }) {
  const W = 1280;
  return (
    <div style={{ width: W, background: WF_PAPER, fontFamily: 'var(--wf-body)', color: WF_INK }}>
      <TopNav palette={palette} variant="pill" activeItem="Markets" />
      <IndexStrip palette={palette} />

      {/* Hero row: feature article + right rail */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 22, padding: '22px 28px 0' }}>
        <div style={{ position: 'relative' }}>
          <Mono size={11} color={palette.accent} weight={700} style={{ display: 'block', marginBottom: 6 }}>TODAY · 5-YEAR LENS</Mono>
          <Scribble size={48} weight={700} style={{ lineHeight: 1.0, display: 'block' }}>
            What 1973 tells us<br/>about today's oil shock.
          </Scribble>
          <Scribble size={20} weight={400} color={WF_INK_SOFT} style={{ display: 'block', marginTop: 10 }}>
            Three patterns from the embargo era are repeating. Here's the chart, the cause, and the cost — in plain English.
          </Scribble>

          <div style={{ marginTop: 16 }}>
            <ChartPlaceholder width={(W - 28 - 28 - 22 - 360)} height={300} accent={palette.accent} label="Brent crude · NOW vs 1973–75" overlayHistory />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 12, alignItems: 'center' }}>
            <Mono size={11} color={WF_INK_FAINT}>Written by Veridian AI · reviewed · 6 min</Mono>
            <div style={{ flex: 1 }} />
            <div style={{ padding: '5px 12px', border: `1.4px solid ${WF_INK}`, borderRadius: 16 }}>
              <Mono size={11} weight={600}>READ →</Mono>
            </div>
            <div style={{ padding: '5px 12px', border: `1.4px solid ${WF_INK_FAINT}`, borderRadius: 16 }}>
              <Mono size={11} color={WF_INK_SOFT}>SAVE</Mono>
            </div>
          </div>

          <Pin style={{ top: -10, right: 12 }} side="top">AI-written but cited</Pin>
        </div>

        {/* Right rail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <SketchBox style={{ padding: 14 }}>
            <SectionHead num="01">Market recap</SectionHead>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                ['Forex',       '+0.12%', 'up'],
                ['Bonds',       '-0.08%', 'down'],
                ['Commodities', '+0.94%', 'up'],
                ['Stocks',      '+0.41%', 'up'],
                ['Crypto',      '-2.31%', 'down'],
                ['Funds',       '+0.27%', 'up'],
              ].map(([n, c, d]) => (
                <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: `1px dashed ${WF_INK_FAINT}` }}>
                  <Scribble size={16}>{n}</Scribble>
                  <div style={{ flex: 1 }} />
                  <Sparkline width={50} height={16} trend={d} color={d === 'up' ? '#4a7c59' : '#b35a3a'} />
                  <Mono size={11} weight={600} color={d === 'up' ? '#4a7c59' : '#b35a3a'}>{c}</Mono>
                </div>
              ))}
            </div>
          </SketchBox>

          <SketchBox style={{ padding: 14 }}>
            <SectionHead num="02">Trending top 10</SectionHead>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                ['AAPL', 'Apple Inc.',     '$308.82', '+1.26%', 'up'],
                ['NVDA', 'NVIDIA Corp.',   '$945.10', '+3.40%', 'up'],
                ['TSLA', 'Tesla',          '$182.04', '-2.14%', 'down'],
                ['MSFT', 'Microsoft',      '$427.15', '+0.84%', 'up'],
                ['AMD',  'Adv. Micro Dev', '$162.30', '-1.07%', 'down'],
                ['BRK.B','Berkshire',      '$418.92', '+0.31%', 'up'],
              ].map(([s, n, p, c, d]) => (
                <div key={s} style={{ display: 'grid', gridTemplateColumns: '52px 1fr 60px 30px 56px', gap: 6, alignItems: 'center', padding: '3px 0' }}>
                  <Mono size={11} weight={700}>{s}</Mono>
                  <Scribble size={13} color={WF_INK_SOFT}>{n}</Scribble>
                  <Mono size={10} color={WF_INK_SOFT}>{p}</Mono>
                  <Sparkline width={28} height={12} trend={d} color={d === 'up' ? '#4a7c59' : '#b35a3a'} strokeWidth={1.1} />
                  <Mono size={10} weight={600} color={d === 'up' ? '#4a7c59' : '#b35a3a'}>{c}</Mono>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 8, paddingTop: 6, borderTop: `1px dashed ${WF_INK_FAINT}`, textAlign: 'right' }}>
              <Scribble size={13} color={palette.accent}>See all 10 →</Scribble>
            </div>
          </SketchBox>

          <SketchBox style={{ padding: 14, background: palette.tint }} tilt={-0.4}>
            <Scribble size={18} weight={700} style={{ display: 'block', marginBottom: 4 }}>From the founder</Scribble>
            <Scribble size={16} color={WF_INK_SOFT} style={{ display: 'block', lineHeight: 1.2 }}>
              "We don't predict next week. We connect five years. Read why."
            </Scribble>
            <div style={{ marginTop: 8, textAlign: 'right' }}>
              <Scribble size={14} color={palette.accent}>Read memoir →</Scribble>
            </div>
          </SketchBox>
        </div>
      </div>

      {/* Secondary stories */}
      <div style={{ padding: '28px' }}>
        <SectionHead num="03">More from this week</SectionHead>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <ArticleCard width="100%" height={210} kind="small" kicker="FED · 2018 ECHO" title="Why rate paths rhyme — not repeat." accent={palette.accent} />
          <ArticleCard width="100%" height={210} kind="small" kicker="EARNINGS · INPUTS" title="Apple's silicon bill, then vs now." accent={palette.accent} />
          <ArticleCard width="100%" height={210} kind="small" kicker="MACRO · CHINA" title="Property unwind: '90s Japan, in slow motion?" accent={palette.accent} />
          <ArticleCard width="100%" height={210} kind="small" kicker="ENERGY · SUPPLY" title="The shale curve and what '14 forgot." accent={palette.accent} />
        </div>
      </div>

      <div style={{ height: 28 }} />
    </div>
  );
}

window.V1_Editorial = V1_Editorial;
