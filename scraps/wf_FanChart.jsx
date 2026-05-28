// V7 — Company dashboard · History tab.
// Same shell as V6 (sidebar + AAPL header + tabs) but the "History" tab is
// active. This is where Veridian's brand thesis lives at the page-level:
// past patterns → similar events → risk/reward forecast.

// ── Fan / probability chart ────────────────────────────────────────────────

function FanChart({ width = 980, height = 280, palette }) {
  const pad = 32;
  const w = width - pad * 2;
  const h = height - pad * 2;

  // Y axis: -50% to +200% over 5 years
  const yToPx = pct => pad + (1 - (pct + 50) / 250) * h;
  const xToPx = yr => pad + (yr / 5) * w;

  // Historical analogue paths (each is a possible future based on a past match)
  const analogues = React.useMemo(() => {
    const seeds = [
      { name: 'MSFT \'14', endPct: 145, weight: 0.30, color: palette.accent },
      { name: 'IBM \'92',  endPct: 58,  weight: 0.18, color: WF_INK },
      { name: 'CSCO \'00', endPct: -35, weight: 0.12, color: '#b35a3a' },
      { name: 'INTC \'02', endPct: 12,  weight: 0.10, color: WF_INK_SOFT },
      { name: 'GE \'00',   endPct: -28, weight: 0.08, color: '#b35a3a' },
      { name: 'JNJ \'10',  endPct: 90,  weight: 0.12, color: palette.accent },
      { name: 'XOM \'08',  endPct: 22,  weight: 0.10, color: WF_INK_SOFT },
    ];
    return seeds.map((s, i) => {
      const n = 30;
      const pts = [];
      for (let j = 0; j <= n; j++) {
        const t = j / n;
        const noise = Math.sin(j * 0.6 + i * 1.3) * 6 + (Math.random() - 0.5) * 4;
        const pct = t * s.endPct + noise * (1 - t);
        pts.push([xToPx(t * 5), yToPx(pct)]);
      }
      return { ...s, pts };
    });
  }, [width, height, palette.accent]);

  // Probability bands — based on the weighted distribution of analogues
  // (here just two static envelopes for the wireframe)
  const bandPath = (loPct, hiPct) => {
    const n = 30;
    const top = [], bot = [];
    for (let j = 0; j <= n; j++) {
      const t = j / n;
      top.push([xToPx(t * 5), yToPx(hiPct * t)]);
      bot.push([xToPx(t * 5), yToPx(loPct * t)]);
    }
    const tPath = top.map((p, i) => `${i ? 'L' : 'M'} ${p[0]} ${p[1]}`).join(' ');
    const bPath = bot.reverse().map(p => `L ${p[0]} ${p[1]}`).join(' ');
    return `${tPath} ${bPath} Z`;
  };

  return (
    <div style={{ position: 'relative', width, height, background: WF_PAPER, border: `1.6px solid ${WF_INK}`, borderRadius: 3 }}>
      <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
        {/* Axes */}
        <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke={WF_INK} strokeWidth={1.2} />
        <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke={WF_INK} strokeWidth={1.2} />
        {/* Y gridlines */}
        {[-50, 0, 50, 100, 150, 200].map(g => (
          <g key={g}>
            <line x1={pad} y1={yToPx(g)} x2={width - pad} y2={yToPx(g)} stroke={WF_INK_FAINT} strokeWidth={0.6} strokeDasharray={g === 0 ? '0' : '2 4'} />
            <text x={pad - 6} y={yToPx(g) + 3} textAnchor="end" fontSize="10" fontFamily='var(--wf-mono)' fill={WF_INK_FAINT}>{g > 0 ? '+' : ''}{g}%</text>
          </g>
        ))}
        {/* X labels */}
        {[0, 1, 2, 3, 4, 5].map(yr => (
          <g key={yr}>
            <line x1={xToPx(yr)} y1={height - pad} x2={xToPx(yr)} y2={height - pad + 4} stroke={WF_INK} strokeWidth={1} />
            <text x={xToPx(yr)} y={height - pad + 16} textAnchor="middle" fontSize="10" fontFamily='var(--wf-mono)' fill={WF_INK_FAINT}>+{yr}Y</text>
          </g>
        ))}
        {/* 90% band (light) */}
        <path d={bandPath(-30, 175)} fill={palette.accent} opacity={0.07} />
        {/* 50% band (darker) */}
        <path d={bandPath(-10, 110)} fill={palette.accent} opacity={0.14} />
        {/* Analogue paths */}
        {analogues.map((a, i) => (
          <path key={i} d={a.pts.map((p, j) => `${j ? 'L' : 'M'} ${p[0]} ${p[1]}`).join(' ')}
                fill="none" stroke={a.color} strokeWidth={1 + a.weight * 4} opacity={0.55 + a.weight} />
        ))}
        {/* Median (base case) */}
        <path d={[0, 1, 2, 3, 4, 5].map((yr, i) => `${i ? 'L' : 'M'} ${xToPx(yr)} ${yToPx(yr * 14)}`).join(' ')}
              fill="none" stroke={palette.accent} strokeWidth={2.4} />
        {/* Today vertical */}
        <line x1={xToPx(0)} y1={pad} x2={xToPx(0)} y2={height - pad} stroke={WF_INK} strokeWidth={1.4} strokeDasharray="4 3" />
      </svg>

      {/* Legend */}
      <div style={{ position: 'absolute', top: 12, right: 16, display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'var(--wf-display)', fontSize: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 16, borderTop: `2.4px solid ${palette.accent}` }}></span>
          <Scribble size={12} weight={700}>Base case · weighted median</Scribble>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 16, height: 10, background: palette.accent, opacity: 0.14, border: `1px solid ${WF_INK_FAINT}` }}></span>
          <Scribble size={12}>50% band</Scribble>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 16, height: 10, background: palette.accent, opacity: 0.07, border: `1px solid ${WF_INK_FAINT}` }}></span>
          <Scribble size={12}>90% band</Scribble>
        </div>
      </div>
      <div style={{ position: 'absolute', top: 12, left: 16 }}>
        <Mono size={9} color={WF_INK_FAINT} weight={700} style={{ display: 'block' }}>FORWARD · 5Y</Mono>
        <Scribble size={16} weight={700}>AAPL outlook · analogue-weighted</Scribble>
      </div>
      {/* Today marker label */}
      <div style={{ position: 'absolute', left: pad + 4, top: 50 }}>
        <Mono size={9} color={WF_INK} weight={700}>TODAY</Mono>
      </div>
    </div>
  );
}

// ── History tab page ───────────────────────────────────────────────────────

function V7_History({ palette }) {
  const W = 1280;
  const SIDE = 200;

  const nav = [
    { sec: 'YOU', items: [
      { l: 'Sign in', accent: true },
      { l: 'Watchlist' },
      { l: 'Saved stories' },
    ]},
    { sec: 'EXPLORE', items: [
      { l: 'Front page' },
      { l: 'Company search', active: true },
      { l: 'Supply chain network' },
      { l: 'History' },
      { l: 'Learn',       dividerAbove: true },
      { l: 'Read memoir', accent: true },
    ]},
  ];

  const tabs = [
    { l: 'Overview' },
    { l: 'Supply chain' },
    { l: 'Financials' },
    { l: 'Patents' },
    { l: 'History', active: true },
  ];

  // Eight historical analogues, ranked by match strength
  const analogues = [
    { tk: 'MSFT', yr: '2014', match: 87, sim: 'Services pivot · capital-light shift · margin expansion', ret5y: '+612%', dir: 'up',   tag: 'closest' },
    { tk: 'JNJ',  yr: '2010', match: 72, sim: 'Capital return · brand moat · slow growth · premium P/E', ret5y: '+92%',  dir: 'up',   tag: 'echo'    },
    { tk: 'IBM',  yr: '1992', match: 69, sim: 'Services + hardware mix · ~20% margin · cyclical clients', ret5y: '+158%', dir: 'up',   tag: 'echo'    },
    { tk: 'INTC', yr: '2002', match: 61, sim: 'Dominant platform · supplier concentration · new entrants', ret5y: '+12%',  dir: 'flat', tag: 'mixed'   },
    { tk: 'XOM',  yr: '2008', match: 58, sim: 'Cash cow · capex moderation · commodity exposure',         ret5y: '+22%',  dir: 'up',   tag: 'mixed'   },
    { tk: 'GE',   yr: '2000', match: 47, sim: 'Conglomerate premium · regulatory headwinds',              'ret5y': '-28%', dir: 'down', tag: 'warning' },
    { tk: 'CSCO', yr: '2000', match: 42, sim: 'Platform crowding · forward multiples · single product',    ret5y: '-35%', dir: 'down', tag: 'warning' },
    { tk: 'NOK',  yr: '2007', match: 38, sim: 'Hardware concentration · platform shift risk',              ret5y: '-78%', dir: 'down', tag: 'warning' },
  ];

  return (
    <div style={{ width: W, background: WF_PAPER, fontFamily: 'var(--wf-body)', color: WF_INK, display: 'grid', gridTemplateColumns: `${SIDE}px 1fr`, minHeight: 1620 }}>

      {/* SIDEBAR */}
      <div style={{ background: palette.tint, borderRight: `1.6px solid ${WF_INK}`, padding: '20px 14px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--wf-serif)', fontStyle: 'italic', fontWeight: 700, fontSize: 22, color: palette.accent, lineHeight: 1 }}>Veridian</div>
          <div style={{ fontFamily: 'var(--wf-display)', fontSize: 26, color: WF_INK, lineHeight: 1, marginTop: -2 }}>Memoir</div>
          <Mono size={9} color={WF_INK_FAINT} style={{ display: 'block', marginTop: 6 }}>history-led finance</Mono>
        </div>
        <div style={{ padding: '6px 8px', border: `1.3px dashed ${WF_INK_FAINT}`, borderRadius: 12, marginBottom: 18 }}>
          <Mono size={10} color={WF_INK_FAINT}>⌕  search tickers, eras</Mono>
        </div>
        {nav.map(n => (
          <div key={n.sec} style={{ marginBottom: 14 }}>
            <Mono size={9} color={WF_INK_FAINT} weight={700} style={{ display: 'block', marginBottom: 4 }}>{n.sec}</Mono>
            {n.items.map(it => (
              <React.Fragment key={it.l}>
                {it.dividerAbove && <div style={{ borderTop: `1px dashed ${WF_INK_FAINT}`, margin: '8px 0 6px' }}></div>}
                <div style={{
                  padding: '4px 8px',
                  marginLeft: -4, marginRight: -4, marginBottom: 1,
                  background: it.active ? WF_PAPER : 'transparent',
                  border: it.active ? `1.4px solid ${WF_INK}` : `1.4px solid transparent`,
                  borderRadius: 4,
                }}>
                  <Scribble size={14} weight={it.active ? 700 : 500} color={it.accent ? palette.accent : WF_INK}>{it.l}</Scribble>
                </div>
              </React.Fragment>
            ))}
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ paddingTop: 10, borderTop: `1px dashed ${WF_INK_FAINT}` }}>
          <Mono size={9} color={WF_INK_FAINT} style={{ display: 'block' }}>v0 · build 0014</Mono>
          <Mono size={9} color={WF_INK_FAINT}>AI · cited · open</Mono>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ minWidth: 0 }}>

        {/* Breadcrumb */}
        <div style={{ padding: '14px 22px 10px', borderBottom: `1.2px dashed ${WF_INK_FAINT}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Scribble size={14} color={WF_INK_SOFT}>Companies</Scribble>
          <Mono size={11} color={WF_INK_FAINT}>›</Mono>
          <Scribble size={14} color={WF_INK_SOFT}>Tech</Scribble>
          <Mono size={11} color={WF_INK_FAINT}>›</Mono>
          <Scribble size={14} weight={700}>AAPL</Scribble>
          <Mono size={11} color={WF_INK_FAINT}>›</Mono>
          <Scribble size={14} color={palette.accent} weight={700}>History</Scribble>
          <div style={{ flex: 1 }} />
          <Mono size={10} color={WF_INK_FAINT}>14:32 UTC · LIVE ●</Mono>
        </div>

        {/* Company header — same as v6 */}
        <div style={{ padding: '14px 22px 0', display: 'flex', alignItems: 'flex-end', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <Scribble size={56} weight={700} style={{ lineHeight: 1 }}>AAPL</Scribble>
            <Scribble size={22} color={WF_INK_SOFT}>Apple Inc.</Scribble>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: 28, alignItems: 'flex-end' }}>
            <div>
              <Mono size={10} color={WF_INK_FAINT} weight={700}>PRICE</Mono>
              <div><Mono size={24} weight={700}>$308.82</Mono></div>
              <div><Mono size={11} color="#4a7c59" weight={600}>+3.85  +1.26%</Mono></div>
            </div>
            <div>
              <Mono size={10} color={WF_INK_FAINT} weight={700}>MKT CAP</Mono>
              <div><Mono size={20} weight={600}>$4.54T</Mono></div>
              <div><Mono size={10} color={WF_INK_SOFT}>P/E 37.36 · div 0.34%</Mono></div>
            </div>
            <div>
              <Mono size={10} color={WF_INK_FAINT} weight={700}>1Y</Mono>
              <Sparkline width={120} height={36} trend="up" color={palette.accent} strokeWidth={1.6} fill />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ padding: '14px 22px 0', display: 'flex', gap: 4, borderBottom: `1.4px solid ${WF_INK}`, marginTop: 10 }}>
          {tabs.map(t => (
            <div key={t.l} style={{
              padding: '8px 14px',
              borderBottom: t.active ? `3px solid ${palette.accent}` : '3px solid transparent',
              marginBottom: -1,
            }}>
              <Scribble size={15} weight={t.active ? 700 : 500} color={t.active ? palette.accent : WF_INK_SOFT}>{t.l}</Scribble>
            </div>
          ))}
        </div>

        {/* HERO */}
        <div style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
            <Mono size={11} color={palette.accent} weight={700}>5-YEAR LENS · WHAT HISTORY SAYS</Mono>
            <div style={{ flex: 1, borderBottom: `1.2px dashed ${WF_INK_FAINT}`, marginBottom: 5 }}></div>
            <Mono size={10} color={WF_INK_FAINT}>scanned · 4,904 companies × 50 years</Mono>
          </div>
          <Scribble size={36} weight={700} style={{ display: 'block', lineHeight: 1.0, marginBottom: 4 }}>
            When other companies looked like AAPL does today — here's what happened next.
          </Scribble>
          <Scribble size={18} color={WF_INK_SOFT} style={{ display: 'block', lineHeight: 1.25 }}>
            We find the closest historical pattern matches and weight their outcomes. Not a forecast — a base rate.
          </Scribble>

          {/* CLOSEST ANALOGUE — hero card */}
          <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: '1fr 320px', gap: 18 }}>
            <SketchBox style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
                <Mono size={10} color={palette.accent} weight={700}>CLOSEST ANALOGUE · 87% MATCH</Mono>
                <div style={{ flex: 1 }} />
                <Mono size={10} color={WF_INK_FAINT}>methodology →</Mono>
              </div>
              <Scribble size={30} weight={700} style={{ display: 'block', lineHeight: 1.05 }}>
                AAPL today reads like <span style={{ color: palette.accent }}>MSFT in 2014</span>.
              </Scribble>
              <Scribble size={15} color={WF_INK_SOFT} style={{ display: 'block', lineHeight: 1.3, marginTop: 6 }}>
                Cash-rich. Services flywheel just lit. Capital-return story trumps growth.
                Margin expanding on software mix. The market hadn't re-rated it yet.
              </Scribble>
              <div style={{ marginTop: 14 }}>
                <ChartPlaceholder width={620} height={210} accent={palette.accent} label="AAPL today (solid) vs MSFT '14 (dashed) · 5Y indexed" overlayHistory />
              </div>
            </SketchBox>

            {/* Risk/Reward summary card */}
            <SketchBox style={{ padding: 16, background: palette.tint }}>
              <Mono size={10} color={WF_INK_FAINT} weight={700}>RISK / REWARD · ANALOGUE-WEIGHTED</Mono>
              <Scribble size={20} weight={700} style={{ display: 'block', marginTop: 4, marginBottom: 10 }}>The base rate</Scribble>

              {[
                { label: 'Bull case (P75)',  pct: '+148%', sub: 'follow MSFT \'14 path',  color: '#4a7c59' },
                { label: 'Base case (P50)',  pct: '+62%',  sub: 'weighted median',         color: palette.accent },
                { label: 'Bear case (P25)',  pct: '-18%',  sub: 'CSCO/NOK-style miss',    color: '#b35a3a' },
              ].map(s => (
                <div key={s.label} style={{ padding: '10px 0', borderBottom: `1px dashed ${WF_INK_FAINT}` }}>
                  <Mono size={9} color={WF_INK_FAINT} weight={700} style={{ display: 'block' }}>{s.label.toUpperCase()}</Mono>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
                    <Mono size={22} weight={700} color={s.color}>{s.pct}</Mono>
                    <Scribble size={12} color={WF_INK_SOFT}>{s.sub}</Scribble>
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 12, padding: '8px 10px', background: WF_PAPER, border: `1.2px solid ${WF_INK}`, borderRadius: 3 }}>
                <Mono size={9} color={WF_INK_FAINT} weight={700}>5-YEAR EXPECTED CAGR</Mono>
                <Mono size={18} weight={700} color={palette.accent}>+10.1% · ±9.2%</Mono>
              </div>

              <Scribble size={12} color={WF_INK_FAINT} style={{ display: 'block', marginTop: 10, lineHeight: 1.3 }}>
                Base rates only. Not advice. Not a target. Read the methodology.
              </Scribble>
            </SketchBox>
          </div>
        </div>

        {/* RANKED ANALOGUES TABLE */}
        <div style={{ padding: '0 22px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
            <Mono size={11} color={palette.accent} weight={700}>SIMILAR EVENTS · TOP 8</Mono>
            <div style={{ flex: 1, borderBottom: `1.2px dashed ${WF_INK_FAINT}`, marginBottom: 5 }}></div>
            <Mono size={10} color={WF_INK_FAINT}>filter ▾ · sort by match ▾</Mono>
          </div>

          <SketchBox style={{ padding: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '24px 70px 60px 80px 1fr 90px 80px 80px', gap: 10, padding: '10px 16px', borderBottom: `1.4px solid ${WF_INK}`, alignItems: 'center' }}>
              {['#','TICKER','YEAR','MATCH','WHAT WAS SIMILAR','5Y CHART','5Y RETURN','OUTCOME'].map(h => (
                <Mono key={h} size={9} color={WF_INK_FAINT} weight={700}>{h}</Mono>
              ))}
            </div>
            {analogues.map((a, i) => (
              <div key={a.tk + a.yr} style={{
                display: 'grid',
                gridTemplateColumns: '24px 70px 60px 80px 1fr 90px 80px 80px',
                gap: 10,
                padding: '12px 16px',
                borderBottom: i < analogues.length - 1 ? `1px dashed ${WF_INK_FAINT}` : 'none',
                alignItems: 'center',
                background: i === 0 ? palette.tint : 'transparent',
              }}>
                <Mono size={11} color={WF_INK_FAINT} weight={700}>{String(i+1).padStart(2,'0')}</Mono>
                <Mono size={13} weight={700}>{a.tk}</Mono>
                <Mono size={11} color={WF_INK_SOFT}>{a.yr}</Mono>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Mono size={12} weight={700} color={a.match > 70 ? palette.accent : a.match > 50 ? WF_INK : WF_INK_SOFT}>{a.match}%</Mono>
                  <div style={{ flex: 1, height: 5, background: WF_PAPER, border: `1px solid ${WF_INK_FAINT}`, borderRadius: 2 }}>
                    <div style={{ width: a.match + '%', height: '100%', background: a.match > 70 ? palette.accent : a.match > 50 ? WF_INK_SOFT : WF_INK_FAINT }}></div>
                  </div>
                </div>
                <Scribble size={14}>{a.sim}</Scribble>
                <Sparkline width={80} height={20} trend={a.dir} color={a.dir === 'up' ? '#4a7c59' : a.dir === 'down' ? '#b35a3a' : WF_INK_SOFT} strokeWidth={1.4} fill />
                <Mono size={13} weight={700} color={a.dir === 'up' ? '#4a7c59' : a.dir === 'down' ? '#b35a3a' : WF_INK_SOFT}>{a.ret5y}</Mono>
                <Mono size={9} weight={700} color={a.tag === 'closest' ? palette.accent : a.tag === 'echo' ? '#4a7c59' : a.tag === 'warning' ? '#b35a3a' : palette.accent2}>{a.tag.toUpperCase()}</Mono>
              </div>
            ))}
          </SketchBox>
        </div>

        {/* PATTERN BREAKDOWN — what's similar, what's different */}
        <div style={{ padding: '0 22px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
            <Mono size={11} color={palette.accent} weight={700}>PATTERN BREAKDOWN · MSFT 2014 ↔ AAPL TODAY</Mono>
            <div style={{ flex: 1, borderBottom: `1.2px dashed ${WF_INK_FAINT}`, marginBottom: 5 }}></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <SketchBox style={{ padding: 16 }}>
              <Mono size={10} color="#4a7c59" weight={700}>WHAT MATCHES</Mono>
              <Scribble size={20} weight={700} style={{ display: 'block', marginTop: 2, marginBottom: 10 }}>The pattern is real</Scribble>
              {[
                ['Services revenue mix',  '22% AAPL vs 23% MSFT \'14', 0.94],
                ['Gross margin trajectory', '+340bp / 5Y',              0.91],
                ['Cash return policy',    'buybacks + div',           0.88],
                ['P/E vs growth gap',     'priced for low single-digit', 0.82],
                ['Capex / revenue',       '~2% \u00b7 capital-light',  0.79],
                ['Insider sell pattern',  'matched within 5%',         0.71],
              ].map(([metric, val, sim]) => (
                <div key={metric} style={{ display: 'grid', gridTemplateColumns: '1fr 110px 60px', gap: 8, padding: '6px 0', borderBottom: `1px dashed ${WF_INK_FAINT}`, alignItems: 'center' }}>
                  <Scribble size={13}>{metric}</Scribble>
                  <Mono size={10} color={WF_INK_SOFT}>{val}</Mono>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ flex: 1, height: 4, background: WF_PAPER, border: `1px solid ${WF_INK_FAINT}` }}>
                      <div style={{ width: (sim * 100) + '%', height: '100%', background: '#4a7c59' }}></div>
                    </div>
                    <Mono size={9} weight={700} color="#4a7c59">{(sim * 100).toFixed(0)}</Mono>
                  </div>
                </div>
              ))}
            </SketchBox>

            <SketchBox style={{ padding: 16 }}>
              <Mono size={10} color="#b35a3a" weight={700}>WHAT'S DIFFERENT</Mono>
              <Scribble size={20} weight={700} style={{ display: 'block', marginTop: 2, marginBottom: 10 }}>And why the analogue could break</Scribble>
              {[
                ['Supplier concentration', 'AAPL: 1 country, TSMC. MSFT \'14: diversified.'],
                ['Regulatory backdrop',    'AAPL: EU DMA + DOJ. MSFT had cleared its consent decree.'],
                ['AI capex cycle',         'AAPL is a buyer, not a seller, of compute.'],
                ['Consumer cyclicality',   'iPhone cycle still dominant; MSFT was already enterprise.'],
                ['China exposure',         'AAPL ~17% rev, ~95% assembly. MSFT was ~3%.'],
              ].map(([metric, note]) => (
                <div key={metric} style={{ padding: '8px 0', borderBottom: `1px dashed ${WF_INK_FAINT}` }}>
                  <Scribble size={13} weight={700}>{metric}</Scribble>
                  <Scribble size={13} color={WF_INK_SOFT} style={{ display: 'block', marginTop: 2, lineHeight: 1.3 }}>{note}</Scribble>
                </div>
              ))}
            </SketchBox>
          </div>
        </div>

        {/* 5-YEAR FAN CHART */}
        <div style={{ padding: '0 22px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
            <Mono size={11} color={palette.accent} weight={700}>OUTLOOK · ANALOGUE FAN CHART</Mono>
            <div style={{ flex: 1, borderBottom: `1.2px dashed ${WF_INK_FAINT}`, marginBottom: 5 }}></div>
            <Mono size={10} color={WF_INK_FAINT}>not a target · base rates only</Mono>
          </div>
          <Scribble size={22} weight={700} style={{ display: 'block', marginBottom: 10 }}>
            Where the analogues lead — over the next five years.
          </Scribble>
          <FanChart width={1036} height={300} palette={palette} />
          <Scribble size={14} color={WF_INK_SOFT} style={{ display: 'block', marginTop: 10, lineHeight: 1.3 }}>
            Each line is one historical analogue's actual 5-year path, projected from "today" for AAPL.
            The shaded bands cover 50% and 90% of the weighted distribution. The thick teal line is the weighted median.
          </Scribble>
        </div>
      </div>
    </div>
  );
}

window.V7_History = V7_History;
