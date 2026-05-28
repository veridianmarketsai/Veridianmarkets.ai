// V9 — Company dashboard · Financials tab.
// Yahoo-Finance-style multi-year statement, with Veridian's 5-year-lens overlay:
// every line item shows how it compares to the same line at a historical
// analogue (e.g. MSFT 2014). This is what differentiates from a vanilla finance
// terminal — the past is sitting on the page next to the present.

function V9_Financials({ palette }) {
  // Income-statement-ish line items (USD billions, rounded for wireframe)
  const rows = [
    { item: 'Revenue',                    vals: [325, 365, 394, 383, 397], delta: '+3.7%', cagr: '+4.0%', anal: '+8.1%', kind: 'major' },
    { item: '\u00a0\u00a0iPhone',         vals: [192, 205, 200, 201, 206], delta: '+2.5%', cagr: '+1.4%', anal: '\u2014',     kind: 'sub'   },
    { item: '\u00a0\u00a0Services',       vals: [54,  68,  78,  85,  88 ], delta: '+12.5%',cagr: '+13.0%',anal: '+10.4%',kind: 'sub'   },
    { item: '\u00a0\u00a0Mac',            vals: [29,  36,  37,  29,  34 ], delta: '+5.4%', cagr: '+3.2%', anal: '\u2014',     kind: 'sub'   },
    { item: '\u00a0\u00a0iPad',           vals: [28,  31,  28,  26,  29 ], delta: '+5.2%', cagr: '+0.7%', anal: '\u2014',     kind: 'sub'   },
    { item: '\u00a0\u00a0Wearables',      vals: [22,  25,  51,  62,  40 ], delta: '\u20131.8%','cagr': '+16.0%',anal: '\u2014',kind: 'sub'},
    { item: 'Cost of revenue',            vals: [193, 213, 224, 213, 218], delta: '+2.3%', cagr: '+2.5%', anal: '+6.1%', kind: 'major' },
    { item: 'Gross profit',               vals: [132, 152, 170, 170, 179], delta: '+5.3%', cagr: '+6.3%', anal: '+11.8%',kind: 'totalA' },
    { item: '\u00a0\u00a0Gross margin %', vals: ['40.6','41.6','43.2','44.4','45.1'], delta: '+70bp', cagr: '+450bp', anal: '+520bp', kind: 'pct' },
    { item: 'Operating expenses',         vals: [38,  43,  51,  54,  57 ], delta: '+5.6%', cagr: '+8.3%', anal: '+9.4%', kind: 'major' },
    { item: '\u00a0\u00a0R&D',            vals: [19,  22,  27,  30,  32 ], delta: '+6.7%', cagr: '+10.9%','anal': '+11.0%', kind: 'sub' },
    { item: '\u00a0\u00a0SG&A',           vals: [19,  21,  24,  24,  25 ], delta: '+4.2%', cagr: '+5.7%', anal: '+8.0%', kind: 'sub' },
    { item: 'Operating income',           vals: [94,  109, 119, 116, 122], delta: '+5.2%', cagr: '+5.4%', anal: '+12.8%',kind: 'totalA' },
    { item: '\u00a0\u00a0Operating margin', vals: ['28.9','29.8','30.3','30.3','30.7'], delta: '+40bp', cagr: '+180bp', anal: '+580bp', kind: 'pct' },
    { item: 'Net income',                 vals: [74,  100, 95,  97,  103], delta: '+6.2%', cagr: '+6.8%', anal: '+14.1%',kind: 'totalB' },
    { item: 'Diluted EPS',                vals: ['$4.45','$6.11','$5.95','$6.43','$6.91'], delta: '+7.5%', cagr: '+9.2%', anal: '+13.0%',kind: 'totalB' },
  ];

  const years = ['FY21', 'FY22', 'FY23', 'FY24', 'FY25'];

  return (
    <CompanyDashShell palette={palette} activeTab="Financials" height={1820}>
      {/* SUB-NAV + period controls */}
      <div style={{ padding: '14px 22px 0', display: 'flex', alignItems: 'center', gap: 14, borderBottom: `1.2px dashed ${WF_INK_FAINT}` }}>
        <Mono size={10} color={WF_INK_FAINT} weight={700}>STATEMENT:</Mono>
        {['Income', 'Balance sheet', 'Cash flow', 'Ratios', 'Segment'].map((s, i) => (
          <div key={s} style={{ padding: '6px 10px', borderBottom: i === 0 ? `2.5px solid ${palette.accent}` : '2.5px solid transparent', marginBottom: -1 }}>
            <Scribble size={14} weight={i === 0 ? 700 : 500} color={i === 0 ? palette.accent : WF_INK_SOFT}>{s}</Scribble>
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 4 }}>
          {['Annual', 'Quarterly', 'TTM'].map((p, i) => (
            <Mono key={p} size={10} weight={i === 0 ? 700 : 500} color={i === 0 ? palette.accent : WF_INK_SOFT}
                  style={{ padding: '4px 8px', border: `1.2px solid ${i === 0 ? palette.accent : WF_INK_FAINT}`, borderRadius: 10 }}>
              {p}
            </Mono>
          ))}
        </div>
        <Mono size={10} color={WF_INK_FAINT}>currency: USD bn ▾</Mono>
      </div>

      {/* HERO claim */}
      <div style={{ padding: '20px 22px 0' }}>
        <Mono size={11} color={palette.accent} weight={700}>FY2025 · INCOME STATEMENT · 5Y</Mono>
        <Scribble size={32} weight={700} style={{ display: 'block', marginTop: 6, lineHeight: 1.0 }}>
          The hardware company that quietly became a software company.
        </Scribble>
        <Scribble size={16} color={WF_INK_SOFT} style={{ display: 'block', marginTop: 6, lineHeight: 1.3 }}>
          Five-year revenue CAGR of 4% looks flat. The Services CAGR of 13% — and 450bp of gross-margin expansion — is the story underneath.
        </Scribble>
      </div>

      {/* 5-Y LENS comparison toggle */}
      <div style={{ padding: '14px 22px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Mono size={10} color={WF_INK_FAINT} weight={700}>OVERLAY 5-YEAR LENS:</Mono>
        <Scribble size={13} weight={700} color={palette.accent}>MSFT · 2014</Scribble>
        <Mono size={9} color={WF_INK_FAINT}>(closest analogue · 87% match)</Mono>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 4 }}>
          {['MSFT \'14', 'IBM \'92', 'JNJ \'10', 'INTC \'02', 'off'].map((a, i) => (
            <Mono key={a} size={9} weight={i === 0 ? 700 : 500} color={i === 0 ? palette.accent : WF_INK_SOFT}
                  style={{ padding: '3px 7px', border: `1px solid ${i === 0 ? palette.accent : WF_INK_FAINT}`, borderRadius: 8 }}>
              {a}
            </Mono>
          ))}
        </div>
      </div>

      {/* MAIN STATEMENT TABLE */}
      <div style={{ padding: '14px 22px 0' }}>
        <SketchBox style={{ padding: 0 }}>
          {/* header row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2.2fr repeat(5, 0.8fr) 0.9fr 0.9fr 1.1fr',
            gap: 6, padding: '10px 14px',
            borderBottom: `1.6px solid ${WF_INK}`,
            alignItems: 'center',
          }}>
            <Mono size={10} color={WF_INK_FAINT} weight={700}>LINE ITEM</Mono>
            {years.map(y => <Mono key={y} size={10} color={WF_INK_FAINT} weight={700} style={{ textAlign: 'right' }}>{y}</Mono>)}
            <Mono size={10} color={WF_INK_FAINT} weight={700} style={{ textAlign: 'right' }}>YoY</Mono>
            <Mono size={10} color={WF_INK_FAINT} weight={700} style={{ textAlign: 'right' }}>5Y CAGR</Mono>
            <Mono size={10} color={palette.accent} weight={700} style={{ textAlign: 'right' }}>vs MSFT \u201914</Mono>
          </div>

          {rows.map((r, i) => {
            const isTotal = r.kind === 'totalA' || r.kind === 'totalB';
            const isMajor = r.kind === 'major';
            const isSub   = r.kind === 'sub';
            const isPct   = r.kind === 'pct';

            const bg = r.kind === 'totalB' ? palette.tint : isTotal ? 'rgba(45,94,90,0.04)' : 'transparent';

            return (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: '2.2fr repeat(5, 0.8fr) 0.9fr 0.9fr 1.1fr',
                gap: 6, padding: '8px 14px',
                borderBottom: `1px dashed ${WF_INK_FAINT}`,
                alignItems: 'center',
                background: bg,
              }}>
                <Scribble size={isTotal ? 14 : 13} weight={isTotal || isMajor ? 700 : isSub ? 500 : 600}
                          color={isPct ? WF_INK_SOFT : WF_INK} style={{ fontStyle: isPct ? 'italic' : 'normal' }}>
                  {r.item}
                </Scribble>
                {r.vals.map((v, vi) => (
                  <Mono key={vi}
                        size={isTotal ? 12 : 11}
                        weight={isTotal || isMajor ? 700 : 500}
                        color={isPct ? WF_INK_SOFT : WF_INK}
                        style={{ textAlign: 'right' }}>
                    {v}
                  </Mono>
                ))}
                <Mono size={11} weight={600} color={String(r.delta).startsWith('\u2013') || String(r.delta).startsWith('-') ? '#b35a3a' : '#4a7c59'} style={{ textAlign: 'right' }}>
                  {r.delta}
                </Mono>
                <Mono size={11} weight={600} color={WF_INK} style={{ textAlign: 'right' }}>
                  {r.cagr}
                </Mono>
                <Mono size={11} weight={700} color={r.anal === '\u2014' ? WF_INK_FAINT : palette.accent} style={{ textAlign: 'right' }}>
                  {r.anal}
                </Mono>
              </div>
            );
          })}
        </SketchBox>
        <Mono size={9} color={WF_INK_FAINT} style={{ display: 'block', marginTop: 6 }}>
          Values in USD billions unless noted. Apple FY ends late September. Source: 10-K / 10-Q · audited by EY.
        </Mono>
      </div>

      {/* VISUALS — revenue mix stack + margin trend */}
      <div style={{ padding: '22px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <SketchBox style={{ padding: 14 }}>
            <Scribble size={18} weight={700} style={{ display: 'block', marginBottom: 4 }}>Revenue mix · 5Y</Scribble>
            <Mono size={10} color={WF_INK_SOFT} style={{ display: 'block', marginBottom: 10 }}>Services share has doubled. Hardware concentration in iPhone unchanged.</Mono>
            <RevenueStack palette={palette} />
          </SketchBox>

          <SketchBox style={{ padding: 14 }}>
            <Scribble size={18} weight={700} style={{ display: 'block', marginBottom: 4 }}>Margin trend · 5Y</Scribble>
            <Mono size={10} color={WF_INK_SOFT} style={{ display: 'block', marginBottom: 10 }}>Gross +450bp \u00b7 operating +180bp \u00b7 net +250bp \u2014 software mix at work.</Mono>
            <MarginLines palette={palette} />
          </SketchBox>
        </div>
      </div>

      {/* WHAT TO WATCH — anomalies / flags from Veridian */}
      <div style={{ padding: '0 22px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
          <Mono size={11} color={palette.accent} weight={700}>WHAT TO WATCH</Mono>
          <div style={{ flex: 1, borderBottom: `1.2px dashed ${WF_INK_FAINT}`, marginBottom: 5 }}></div>
          <Mono size={10} color={WF_INK_FAINT}>flags surfaced by Veridian \u00b7 cited</Mono>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {[
            { tag: 'ECHO',    color: '#4a7c59', head: 'Services margin path matches MSFT \'14 within 5%',  body: 'Services gross margin trajectory mapped onto MSFT \'14 sits inside historical noise. This is the strongest single match.' },
            { tag: 'WATCH',   color: palette.accent2, head: 'Wearables down 36% from \'23 peak',                  body: 'Vision Pro pulled into the segment one-time bump. Underlying Watch unit sales likely flat. Re-read FY26 Q1.' },
            { tag: 'CAUTION', color: '#b35a3a', head: 'iPhone unit count flat for 4 straight years',          body: 'Revenue +2.5% YoY on ASP, not units. Pricing power has limits \u2014 Nokia \'08 had two more years before the cliff.' },
          ].map(f => (
            <SketchBox key={f.head} style={{ padding: 14 }}>
              <Mono size={9} color={f.color} weight={700}>{f.tag}</Mono>
              <Scribble size={17} weight={700} style={{ display: 'block', marginTop: 4, lineHeight: 1.15 }}>{f.head}</Scribble>
              <div style={{ fontFamily: 'var(--wf-body)', fontSize: 13, color: WF_INK_SOFT, lineHeight: 1.3, marginTop: 6 }}>{f.body}</div>
            </SketchBox>
          ))}
        </div>
      </div>
    </CompanyDashShell>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function RevenueStack({ palette }) {
  const W = 460, H = 220, pad = 28;
  const years = ['FY21', 'FY22', 'FY23', 'FY24', 'FY25'];
  // Each year is [iPhone, Services, Wearables, Mac, iPad] as % of revenue
  const data = [
    [59, 17, 7,  9, 9],
    [56, 19, 7, 10, 8],
    [51, 22, 13, 9, 7],
    [52, 22, 16, 8, 7],
    [52, 22, 10, 9, 7],
  ];
  const colors = [palette.accent, palette.accent2, WF_INK, WF_INK_SOFT, WF_INK_FAINT];
  const cats = ['iPhone', 'Services', 'Wear', 'Mac', 'iPad'];

  const barW = 56;
  const innerW = W - pad * 2;
  const innerH = H - pad - 30;
  const step = innerW / (years.length);

  return (
    <svg width={W} height={H + 30}>
      {/* y axis */}
      <line x1={pad} y1={pad} x2={pad} y2={pad + innerH} stroke={WF_INK} strokeWidth={1} />
      {[0, 25, 50, 75, 100].map(g => (
        <g key={g}>
          <line x1={pad} y1={pad + innerH * (1 - g/100)} x2={W - pad} y2={pad + innerH * (1 - g/100)} stroke={WF_INK_FAINT} strokeWidth={0.5} strokeDasharray="2 3" />
          <text x={pad - 4} y={pad + innerH * (1 - g/100) + 3} textAnchor="end" fontSize="9" fontFamily="var(--wf-mono)" fill={WF_INK_FAINT}>{g}%</text>
        </g>
      ))}
      {years.map((y, yi) => {
        const xCenter = pad + step * (yi + 0.5);
        let cumY = pad + innerH;
        return (
          <g key={y}>
            {data[yi].map((v, ci) => {
              const segH = (v / 100) * innerH;
              cumY -= segH;
              return <rect key={ci} x={xCenter - barW/2} y={cumY} width={barW} height={segH} fill={colors[ci]} stroke={WF_INK} strokeWidth={0.6} />;
            })}
            <text x={xCenter} y={pad + innerH + 14} textAnchor="middle" fontSize="10" fontFamily="var(--wf-mono)" fill={WF_INK_FAINT} fontWeight={700}>{y}</text>
          </g>
        );
      })}
      {/* legend */}
      {cats.map((c, i) => (
        <g key={c} transform={`translate(${pad + i * 78}, ${H + 18})`}>
          <rect width={12} height={10} fill={colors[i]} stroke={WF_INK} strokeWidth={0.6} />
          <text x={16} y={9} fontSize="10" fontFamily="var(--wf-display)" fill={WF_INK}>{c}</text>
        </g>
      ))}
    </svg>
  );
}

function MarginLines({ palette }) {
  const W = 460, H = 220, pad = 32;
  const innerW = W - pad * 2;
  const innerH = H - pad - 24;
  const series = [
    { name: 'Gross',     values: [40.6, 41.6, 43.2, 44.4, 45.1], color: palette.accent, weight: 2.4 },
    { name: 'Operating', values: [28.9, 29.8, 30.3, 30.3, 30.7], color: WF_INK,         weight: 2 },
    { name: 'Net',       values: [25.6, 25.3, 24.7, 25.3, 25.9], color: palette.accent2,weight: 2 },
  ];
  const minY = 20, maxY = 50;
  const yToPx = v => pad + (1 - (v - minY) / (maxY - minY)) * innerH;
  const step = innerW / 4;

  return (
    <svg width={W} height={H + 24}>
      <line x1={pad} y1={pad} x2={pad} y2={pad + innerH} stroke={WF_INK} strokeWidth={1} />
      <line x1={pad} y1={pad + innerH} x2={W - pad} y2={pad + innerH} stroke={WF_INK} strokeWidth={1} />
      {[20, 30, 40, 50].map(g => (
        <g key={g}>
          <line x1={pad} y1={yToPx(g)} x2={W - pad} y2={yToPx(g)} stroke={WF_INK_FAINT} strokeWidth={0.5} strokeDasharray="2 3" />
          <text x={pad - 4} y={yToPx(g) + 3} textAnchor="end" fontSize="9" fontFamily="var(--wf-mono)" fill={WF_INK_FAINT}>{g}%</text>
        </g>
      ))}
      {['FY21','FY22','FY23','FY24','FY25'].map((y, i) => (
        <text key={y} x={pad + step * i} y={pad + innerH + 14} textAnchor="middle" fontSize="10" fontFamily="var(--wf-mono)" fill={WF_INK_FAINT} fontWeight={700}>{y}</text>
      ))}
      {series.map(s => {
        const path = s.values.map((v, i) => `${i ? 'L' : 'M'} ${pad + i * step} ${yToPx(v)}`).join(' ');
        return (
          <g key={s.name}>
            <path d={path} fill="none" stroke={s.color} strokeWidth={s.weight} />
            {s.values.map((v, i) => <circle key={i} cx={pad + i * step} cy={yToPx(v)} r={2.5} fill={s.color} />)}
          </g>
        );
      })}
      {/* legend */}
      {series.map((s, i) => (
        <g key={s.name} transform={`translate(${pad + i * 100}, ${H + 14})`}>
          <line x1={0} y1={5} x2={16} y2={5} stroke={s.color} strokeWidth={s.weight} />
          <text x={20} y={9} fontSize="10" fontFamily="var(--wf-display)" fill={WF_INK}>{s.name} margin</text>
        </g>
      ))}
    </svg>
  );
}

window.V9_Financials = V9_Financials;
