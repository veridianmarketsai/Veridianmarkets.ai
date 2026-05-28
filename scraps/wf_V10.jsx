// V10 — Company dashboard · Patents tab.
// IP portfolio view. The differentiator: ties patents back to the supply chain
// (which suppliers does this company's IP protect against?) and to history
// (when other companies' patent-to-R&D ratios looked like this, here's what
// happened to their margins).

function V10_Patents({ palette }) {
  // Patent categories — for the treemap-ish breakdown
  const categories = [
    { name: 'Semiconductor design',    pct: 22, color: palette.accent,  cnt: 515  },
    { name: 'Display · optical',        pct: 16, color: palette.accent2, cnt: 374  },
    { name: 'Wireless · RF',            pct: 13, color: WF_INK,          cnt: 305  },
    { name: 'AI · on-device ML',        pct: 12, color: '#4a7c59',       cnt: 281  },
    { name: 'Battery · power',          pct: 10, color: '#b35a3a',       cnt: 234  },
    { name: 'Health · sensors',         pct: 9,  color: WF_INK_SOFT,     cnt: 211  },
    { name: 'Camera · imaging',         pct: 8,  color: palette.accent,  cnt: 187  },
    { name: 'Audio · spatial',          pct: 5,  color: WF_INK_FAINT,    cnt: 117  },
    { name: 'Other · UX, materials',    pct: 5,  color: WF_INK_FAINT,    cnt: 117  },
  ];

  // Recent grants — top 8
  const recentGrants = [
    { id: 'US 12,043,891', title: 'Sub-pixel rendering for foldable OLED at high refresh',  cat: 'Display',       inv: 'Lin · Patel · Vasquez', date: 'Mar 14 \'26' },
    { id: 'US 12,041,778', title: 'On-device LLM compression with sparse mixture routing',  cat: 'AI · ML',       inv: 'Chen · Brown',          date: 'Mar 11 \'26' },
    { id: 'US 12,040,612', title: 'Variable-aperture optical stack for compact telephoto',  cat: 'Camera',        inv: 'Ko · Singh',            date: 'Mar 04 \'26' },
    { id: 'US 12,038,201', title: 'Silicon-anode lithium cell with stress-relief geometry', cat: 'Battery',       inv: 'Park · Williams',       date: 'Feb 26 \'26' },
    { id: 'US 12,034,890', title: 'Heart-rhythm classifier with off-body verification',     cat: 'Health',        inv: 'Kim · Adler · Mehta',   date: 'Feb 19 \'26' },
    { id: 'US 12,031,556', title: 'Beam-forming arbitration for 6E + 7 coexistence',        cat: 'Wireless',      inv: 'Garcia · Tao',          date: 'Feb 12 \'26' },
    { id: 'US 12,028,431', title: 'Photonic chip-to-chip interconnect within SiP',          cat: 'Semiconductor', inv: 'Nakamura · Hassan',     date: 'Feb 05 \'26' },
    { id: 'US 12,024,008', title: 'Spatial-audio beamforming with head-pose prediction',    cat: 'Audio',         inv: 'Klein · Russo',         date: 'Jan 29 \'26' },
  ];

  return (
    <CompanyDashShell palette={palette} activeTab="Patents" height={1820}>
      {/* HERO */}
      <div style={{ padding: '22px' }}>
        <Mono size={11} color={palette.accent} weight={700}>INTELLECTUAL PROPERTY · 5Y</Mono>
        <Scribble size={34} weight={700} style={{ display: 'block', marginTop: 6, lineHeight: 1.0 }}>
          11,580 patents in five years — and where they're aimed.
        </Scribble>
        <Scribble size={16} color={WF_INK_SOFT} style={{ display: 'block', marginTop: 6, lineHeight: 1.3 }}>
          Apple's IP isn't a moat by itself; it's a map of what they're worried about. The clusters tell you which
          supplier they want to replace, which competitor they want to block, and which product they haven't shipped yet.
        </Scribble>
      </div>

      {/* AT A GLANCE — 5 stat cards */}
      <div style={{ padding: '0 22px 22px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {[
            { label: 'Active patents',  v: '78,920', sub: 'granted · global',   dir: 'up'    },
            { label: 'Granted 2025',    v: '2,341',  sub: '+8.4% YoY',           dir: 'up'    },
            { label: 'R&D spend · TTM', v: '$32.1B', sub: '8.1% of revenue',    dir: 'up'    },
            { label: 'Cost / patent',   v: '$13.7M', sub: 'rev / grant ratio',  dir: 'flat'  },
            { label: 'Active lawsuits', v: '14',     sub: '6 plaintiff · 8 def',dir: 'down'  },
          ].map(s => (
            <SketchBox key={s.label} style={{ padding: 12 }}>
              <Mono size={9} color={WF_INK_FAINT} weight={700}>{s.label.toUpperCase()}</Mono>
              <Scribble size={26} weight={700} style={{ display: 'block', marginTop: 4 }}>{s.v}</Scribble>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Mono size={10} color={s.dir === 'up' ? '#4a7c59' : s.dir === 'down' ? '#b35a3a' : WF_INK_FAINT} weight={700}>
                  {s.dir === 'up' ? '↑' : s.dir === 'down' ? '↓' : '·'}
                </Mono>
                <Mono size={10} color={WF_INK_SOFT}>{s.sub}</Mono>
              </div>
            </SketchBox>
          ))}
        </div>
      </div>

      {/* PATENT MIX — categories with bars + R&D vs grants chart */}
      <div style={{ padding: '0 22px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
          <Mono size={11} color={palette.accent} weight={700}>WHERE THE PATENTS ARE AIMED</Mono>
          <div style={{ flex: 1, borderBottom: `1.2px dashed ${WF_INK_FAINT}`, marginBottom: 5 }}></div>
          <Mono size={10} color={WF_INK_FAINT}>FY2025 · 2,341 grants</Mono>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {/* Category breakdown */}
          <SketchBox style={{ padding: 14 }}>
            <Scribble size={17} weight={700} style={{ display: 'block', marginBottom: 8 }}>By tech category</Scribble>
            {categories.map(c => (
              <div key={c.name} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 36px 44px', gap: 8, padding: '5px 0', borderBottom: `1px dashed ${WF_INK_FAINT}`, alignItems: 'center' }}>
                <Scribble size={13}>{c.name}</Scribble>
                <div style={{ height: 8, background: WF_PAPER, border: `1px solid ${WF_INK_FAINT}` }}>
                  <div style={{ width: c.pct + '%', height: '100%', background: c.color }}></div>
                </div>
                <Mono size={10} weight={700} style={{ textAlign: 'right' }}>{c.pct}%</Mono>
                <Mono size={10} color={WF_INK_SOFT} style={{ textAlign: 'right' }}>{c.cnt}</Mono>
              </div>
            ))}
            <div style={{ marginTop: 8, paddingTop: 6, borderTop: `1px dashed ${WF_INK_FAINT}` }}>
              <Mono size={9} color={WF_INK_FAINT}>Fastest grower 5Y: AI · on-device ML (+340% \u00b7 nothing in '21)</Mono>
            </div>
          </SketchBox>

          {/* R&D vs grants over time */}
          <SketchBox style={{ padding: 14 }}>
            <Scribble size={17} weight={700} style={{ display: 'block', marginBottom: 4 }}>R&amp;D dollars vs patent grants</Scribble>
            <Mono size={10} color={WF_INK_SOFT} style={{ display: 'block', marginBottom: 10 }}>
              R&amp;D outgrew grants 2:1 over 5Y \u2014 cost per patent is rising. Software focus.
            </Mono>
            <RDvsGrants palette={palette} />
          </SketchBox>
        </div>
      </div>

      {/* RECENT GRANTS — list */}
      <div style={{ padding: '0 22px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
          <Mono size={11} color={palette.accent} weight={700}>RECENT GRANTS</Mono>
          <div style={{ flex: 1, borderBottom: `1.2px dashed ${WF_INK_FAINT}`, marginBottom: 5 }}></div>
          <Mono size={10} color={WF_INK_FAINT}>last 90 days · 211 total · filter ▾</Mono>
        </div>

        <SketchBox style={{ padding: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr 130px 200px 90px', gap: 10, padding: '10px 16px', borderBottom: `1.4px solid ${WF_INK}` }}>
            {['PATENT', 'TITLE', 'CATEGORY', 'INVENTORS', 'DATE'].map(h => <Mono key={h} size={9} color={WF_INK_FAINT} weight={700}>{h}</Mono>)}
          </div>
          {recentGrants.map((g, i) => (
            <div key={g.id} style={{
              display: 'grid', gridTemplateColumns: '130px 1fr 130px 200px 90px',
              gap: 10, padding: '8px 16px',
              borderBottom: i < recentGrants.length - 1 ? `1px dashed ${WF_INK_FAINT}` : 'none',
              alignItems: 'center',
            }}>
              <Mono size={10} weight={700}>{g.id}</Mono>
              <Scribble size={13}>{g.title}</Scribble>
              <Mono size={10} color={palette.accent} weight={600}>{g.cat}</Mono>
              <Scribble size={12} color={WF_INK_SOFT}>{g.inv}</Scribble>
              <Mono size={10} color={WF_INK_FAINT}>{g.date}</Mono>
            </div>
          ))}
        </SketchBox>
      </div>

      {/* PATENTS × SUPPLY CHAIN — the differentiator */}
      <div style={{ padding: '0 22px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
          <Mono size={11} color={palette.accent} weight={700}>PATENTS × SUPPLY CHAIN · WHO ARE THEY TRYING TO REPLACE?</Mono>
          <div style={{ flex: 1, borderBottom: `1.2px dashed ${WF_INK_FAINT}`, marginBottom: 5 }}></div>
        </div>
        <Scribble size={14} color={WF_INK_SOFT} style={{ display: 'block', marginBottom: 12, lineHeight: 1.3 }}>
          Each patent cluster maps to a supplier dependency. Heavy IP investment in a category usually precedes
          either replacing the supplier (in-house silicon) or pressuring their margin.
        </Scribble>

        <SketchBox style={{ padding: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '180px 100px 1fr 100px 1fr', gap: 10, padding: '10px 16px', borderBottom: `1.4px solid ${WF_INK}` }}>
            {['CATEGORY', 'GRANTS · 5Y', 'TRAJECTORY', 'SUPPLIER', 'WHAT THIS SUGGESTS'].map(h => <Mono key={h} size={9} color={WF_INK_FAINT} weight={700}>{h}</Mono>)}
          </div>
          {[
            { cat: 'Semiconductor',  grants: 2840, dir: 'up',   sup: 'TSM · QCOM',  note: 'In-housing modem (Qualcomm replacement) and SoC scaling.', flag: 'replace' },
            { cat: 'Display',        grants: 1820, dir: 'up',   sup: 'LPL · 005930',note: 'microLED R&D \u2014 long path to LG/Samsung independence.',  flag: 'replace' },
            { cat: 'AI · ML',        grants: 1140, dir: 'up',   sup: '(none direct)',note: 'On-device inference \u2014 reduce server-side dep.',         flag: 'build' },
            { cat: 'Battery',        grants:  980, dir: 'flat', sup: 'ALB · 1810',  note: 'Silicon-anode geometries \u2014 capacity, not chemistry.',   flag: 'optimize' },
            { cat: 'Camera',         grants:  720, dir: 'up',   sup: 'SONY',        note: 'Variable-aperture stack \u2014 closing gap to Sony sensors.',  flag: 'pressure' },
            { cat: 'Wireless',       grants:  690, dir: 'flat', sup: 'QCOM',        note: 'Coexistence claims \u2014 owning modem-adjacent IP.',         flag: 'pressure' },
          ].map((r, i) => (
            <div key={r.cat} style={{ display: 'grid', gridTemplateColumns: '180px 100px 1fr 100px 1fr', gap: 10, padding: '8px 16px', borderBottom: i < 5 ? `1px dashed ${WF_INK_FAINT}` : 'none', alignItems: 'center' }}>
              <Scribble size={13} weight={700}>{r.cat}</Scribble>
              <Mono size={11} weight={600}>{r.grants.toLocaleString()}</Mono>
              <Sparkline width={120} height={18} trend={r.dir} color={r.dir === 'up' ? '#4a7c59' : '#b35a3a'} strokeWidth={1.3} />
              <Mono size={10} weight={700} color={palette.accent}>{r.sup}</Mono>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Mono size={9} weight={700}
                      color={r.flag === 'replace' ? '#b35a3a' : r.flag === 'pressure' ? palette.accent2 : r.flag === 'build' ? '#4a7c59' : WF_INK_SOFT}
                      style={{ padding: '2px 6px', border: `1.2px solid ${r.flag === 'replace' ? '#b35a3a' : r.flag === 'pressure' ? palette.accent2 : r.flag === 'build' ? '#4a7c59' : WF_INK_FAINT}`, borderRadius: 8 }}>
                  {r.flag.toUpperCase()}
                </Mono>
                <Scribble size={12} color={WF_INK_SOFT}>{r.note}</Scribble>
              </div>
            </div>
          ))}
        </SketchBox>
      </div>

      {/* LITIGATION */}
      <div style={{ padding: '0 22px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
          <Mono size={11} color={palette.accent} weight={700}>LITIGATION · ACTIVE</Mono>
          <div style={{ flex: 1, borderBottom: `1.2px dashed ${WF_INK_FAINT}`, marginBottom: 5 }}></div>
          <Mono size={10} color={WF_INK_FAINT}>14 active cases · est. aggregate exposure $3.2B</Mono>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <SketchBox style={{ padding: 14 }}>
            <Mono size={10} color={WF_INK_FAINT} weight={700} style={{ display: 'block', marginBottom: 4 }}>AAPL AS DEFENDANT</Mono>
            <Scribble size={17} weight={700} style={{ display: 'block', marginBottom: 8 }}>Being sued</Scribble>
            {[
              { v: 'MASI',     n: 'Masimo',        area: 'Watch pulse-ox',   status: 'appeal · ITC ruling discharged', exp: '$0.4B' },
              { v: 'PNCSY',   n: 'Optis Wireless', area: 'LTE/5G FRAND',     status: 'damages phase \u00b7 UK',           exp: '$0.5B' },
              { v: 'QCOM',    n: 'Qualcomm',      area: 'Modem royalty II', status: 'discovery',                       exp: '$0.9B' },
              { v: 'CIRRUS', n: 'Cirrus Logic',   area: 'Audio DSP',        status: 'pre-trial',                       exp: '$0.2B' },
            ].map((c, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 80px 60px', gap: 6, padding: '6px 0', borderBottom: `1px dashed ${WF_INK_FAINT}`, alignItems: 'center' }}>
                <Mono size={10} weight={700}>{c.v}</Mono>
                <Scribble size={13}>{c.area}</Scribble>
                <Scribble size={11} color={WF_INK_SOFT}>{c.status}</Scribble>
                <Mono size={10} weight={700} color="#b35a3a" style={{ textAlign: 'right' }}>{c.exp}</Mono>
              </div>
            ))}
          </SketchBox>

          <SketchBox style={{ padding: 14 }}>
            <Mono size={10} color={WF_INK_FAINT} weight={700} style={{ display: 'block', marginBottom: 4 }}>AAPL AS PLAINTIFF</Mono>
            <Scribble size={17} weight={700} style={{ display: 'block', marginBottom: 8 }}>Suing others</Scribble>
            {[
              { v: 'EPIC',    n: 'Epic Games',    area: 'App Store fee',     status: 'remand · 9th Cir.',  exp: '\u2014' },
              { v: 'GOOGL',   n: 'Alphabet',      area: 'AI on-device',      status: 'pre-trial',           exp: '\u2014' },
              { v: 'NUVIA',  n: 'NUVIA · ARM',    area: 'Trade-secret',       status: 'mediation',           exp: '\u2014' },
              { v: '\u2014',  n: 'Counterfeit ring (CN)', area: 'Trade-dress', status: 'settled (sealed)',    exp: '\u2014' },
            ].map((c, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 80px 60px', gap: 6, padding: '6px 0', borderBottom: `1px dashed ${WF_INK_FAINT}`, alignItems: 'center' }}>
                <Mono size={10} weight={700}>{c.v}</Mono>
                <Scribble size={13}>{c.area}</Scribble>
                <Scribble size={11} color={WF_INK_SOFT}>{c.status}</Scribble>
                <Mono size={10} weight={700} color={WF_INK_FAINT} style={{ textAlign: 'right' }}>{c.exp}</Mono>
              </div>
            ))}
          </SketchBox>
        </div>
      </div>
    </CompanyDashShell>
  );
}

// ── R&D vs Grants chart ────────────────────────────────────────────────────

function RDvsGrants({ palette }) {
  const W = 460, H = 220, pad = 36;
  const innerW = W - pad * 2;
  const innerH = H - pad - 24;

  const years = ['FY21', 'FY22', 'FY23', 'FY24', 'FY25'];
  const rd     = [19, 22, 27, 30, 32];        // $B
  const grants = [1820, 1980, 2120, 2160, 2341];

  const rdMax = 35;
  const grMax = 2500;
  const yToPxA = v => pad + (1 - v / rdMax) * innerH;   // R&D scale (left)
  const yToPxB = v => pad + (1 - v / grMax) * innerH;   // grants scale (right)
  const step = innerW / 4;

  return (
    <svg width={W} height={H + 24}>
      {/* axes */}
      <line x1={pad} y1={pad} x2={pad} y2={pad + innerH} stroke={WF_INK} strokeWidth={1} />
      <line x1={W - pad} y1={pad} x2={W - pad} y2={pad + innerH} stroke={WF_INK} strokeWidth={1} />
      <line x1={pad} y1={pad + innerH} x2={W - pad} y2={pad + innerH} stroke={WF_INK} strokeWidth={1} />

      {/* left y axis labels (R&D) */}
      {[0, 10, 20, 30].map(g => (
        <g key={g}>
          <line x1={pad} y1={yToPxA(g)} x2={W - pad} y2={yToPxA(g)} stroke={WF_INK_FAINT} strokeWidth={0.5} strokeDasharray="2 3" />
          <text x={pad - 4} y={yToPxA(g) + 3} textAnchor="end" fontSize="9" fontFamily="var(--wf-mono)" fill={palette.accent} fontWeight={700}>${g}B</text>
        </g>
      ))}
      {/* right y axis labels (grants) */}
      {[0, 1000, 2000].map(g => (
        <text key={g} x={W - pad + 4} y={yToPxB(g) + 3} fontSize="9" fontFamily="var(--wf-mono)" fill={WF_INK} fontWeight={700}>{g}</text>
      ))}

      {/* R&D bars */}
      {years.map((y, i) => {
        const barW = 28;
        const x = pad + step * i - barW / 2;
        return <rect key={'rd'+i} x={x} y={yToPxA(rd[i])} width={barW} height={(pad + innerH) - yToPxA(rd[i])} fill={palette.accent} opacity={0.7} stroke={WF_INK} strokeWidth={0.6} />;
      })}

      {/* Grants line */}
      <path
        d={grants.map((v, i) => `${i ? 'L' : 'M'} ${pad + i * step} ${yToPxB(v)}`).join(' ')}
        fill="none" stroke={WF_INK} strokeWidth={2} />
      {grants.map((v, i) => <circle key={'g'+i} cx={pad + i * step} cy={yToPxB(v)} r={3} fill={WF_PAPER} stroke={WF_INK} strokeWidth={1.5} />)}

      {/* X labels */}
      {years.map((y, i) => (
        <text key={y} x={pad + step * i} y={pad + innerH + 14} textAnchor="middle" fontSize="10" fontFamily="var(--wf-mono)" fill={WF_INK_FAINT} fontWeight={700}>{y}</text>
      ))}

      {/* legend */}
      <g transform={`translate(${pad}, ${H + 12})`}>
        <rect width={12} height={10} fill={palette.accent} opacity={0.7} stroke={WF_INK} strokeWidth={0.6} />
        <text x={16} y={9} fontSize="10" fontFamily="var(--wf-display)" fill={WF_INK}>R&amp;D · $B</text>
        <line x1={120} y1={5} x2={136} y2={5} stroke={WF_INK} strokeWidth={2} />
        <circle cx={128} cy={5} r={3} fill={WF_PAPER} stroke={WF_INK} strokeWidth={1.2} />
        <text x={142} y={9} fontSize="10" fontFamily="var(--wf-display)" fill={WF_INK}>Patents granted</text>
      </g>
    </svg>
  );
}

window.V10_Patents = V10_Patents;
