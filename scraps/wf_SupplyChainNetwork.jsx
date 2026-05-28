// V6 — Company Dashboard. Reached by clicking a company on V5.
// The supply chain network is the main attraction. Sidebar from V5 stays —
// same workspace shell, just a different main canvas.

// ── Supply-chain network ───────────────────────────────────────────────────

function SupplyChainNetwork({ palette, width = 1020, height = 540 }) {
  // Static coords for nodes. Each node knows its x,y,w,h so we can compute
  // edge points for the SVG connector layer without measuring DOM.
  // Coords sized for a 1020×540 frame — fits inside the dashboard's main
  // column (page 1280 − sidebar 200 − padding 44 ≈ 1036).
  const apple = { x: 410, y: 210, w: 190, h: 120 };

  const suppliers = [
    { id: 'tsm',   label: 'TSM',     sub: 'TSMC · chips',       weight: 'heavy' },
    { id: 'hnhpf', label: '2317.TW', sub: 'Hon Hai · assembly',  weight: 'heavy' },
    { id: 'lpl',   label: 'LPL',     sub: 'LG Display · OLED',   weight: 'med'   },
    { id: 'sony',  label: 'SONY',    sub: 'Sony · sensors',      weight: 'med'   },
    { id: 'qcom',  label: 'QCOM',    sub: 'Qualcomm · modems',   weight: 'med'   },
  ].map((s, i) => ({ ...s, x: 50, y: 70 + i * 44, w: 200, h: 34 }));

  const externals = [
    { id: 'maersk', label: 'MAERSK.B', sub: 'Maersk · shipping',      weight: 'med'   },
    { id: 'xom',    label: 'XOM',      sub: 'ExxonMobil · energy',    weight: 'med'   },
    { id: 'mp',     label: 'MP',       sub: 'MP Materials · rare-earth', weight: 'heavy' },
    { id: 'alb',    label: 'ALB',      sub: 'Albemarle · battery',    weight: 'light' },
  ].map((s, i) => ({ ...s, x: 50, y: 320 + i * 44, w: 200, h: 34 }));

  const outputs = [
    { id: 'tmus',  label: 'TMUS', sub: 'T-Mobile · carrier',   weight: 'heavy' },
    { id: 'vz',    label: 'VZ',   sub: 'Verizon · carrier',    weight: 'heavy' },
    { id: 'ts',    label: 'T',    sub: 'AT&T · carrier',       weight: 'med'   },
    { id: 'bby',   label: 'BBY',  sub: 'Best Buy · retail',    weight: 'med'   },
    { id: 'cost',  label: 'COST', sub: 'Costco · retail',      weight: 'med'   },
    { id: 'amzn',  label: 'AMZN', sub: 'Amazon · retail+cloud',weight: 'med'   },
  ].map((s, i) => ({ ...s, x: 770, y: 70 + i * 50, w: 200, h: 40 }));

  const competitors = [
    { id: 'ssnlf', label: '005930.KS', sub: 'Samsung'   },
    { id: 'xiaomi', label: '1810.HK',  sub: 'Xiaomi'    },
    { id: 'googl', label: 'GOOGL',     sub: 'Alphabet'  },
    { id: 'msft',  label: 'MSFT',      sub: 'Microsoft' },
  ].map((s, i) => ({ ...s, x: 355 + i * 125, y: 480, w: 110, h: 36 }));

  // Build edges: each input → apple's left edge at a vertical slice that
  // matches the input's vertical position, so lines don't all crowd one point.
  const appleLeft = apple.x;
  const appleRight = apple.x + apple.w;
  const appleMidY = apple.y + apple.h / 2;

  const strokeFor = w => (w === 'heavy' ? 2 : w === 'med' ? 1.4 : 1);

  // Returns an SVG path string for a curved connector
  const curve = (x1, y1, x2, y2) => {
    const dx = (x2 - x1) * 0.55;
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
  };

  const inputEdges  = [...suppliers, ...externals].map(s => ({
    from: { x: s.x + s.w, y: s.y + s.h / 2 },
    to:   { x: appleLeft, y: appleMidY + (s.y + s.h / 2 - (apple.y + apple.h / 2)) * 0.18 },
    weight: s.weight,
    dashed: externals.includes(s),
  }));

  const outputEdges = outputs.map(o => ({
    from: { x: appleRight, y: appleMidY + (o.y + o.h / 2 - (apple.y + apple.h / 2)) * 0.18 },
    to:   { x: o.x, y: o.y + o.h / 2 },
    weight: o.weight,
    dashed: false,
  }));

  const compEdges = competitors.map(c => ({
    from: { x: apple.x + apple.w / 2 + (c.x + c.w / 2 - (apple.x + apple.w / 2)) * 0.15, y: apple.y + apple.h },
    to:   { x: c.x + c.w / 2, y: c.y },
    weight: 'light',
    dashed: 'dotted',
  }));

  return (
    <div style={{ position: 'relative', width, height, background: WF_PAPER, border: `1.6px solid ${WF_INK}`, borderRadius: 3 }}>

      {/* Column headers */}
      <div style={{ position: 'absolute', top: 14, left: 50, width: 200, textAlign: 'center' }}>
        <Mono size={9} color={WF_INK_FAINT} weight={700} style={{ display: 'block' }}>01</Mono>
        <Scribble size={20} weight={700}>Inputs · dependencies</Scribble>
      </div>
      <div style={{ position: 'absolute', top: 14, left: 410, width: 190, textAlign: 'center' }}>
        <Mono size={9} color={WF_INK_FAINT} weight={700} style={{ display: 'block' }}>02</Mono>
        <Scribble size={20} weight={700} color={palette.accent}>Principle</Scribble>
      </div>
      <div style={{ position: 'absolute', top: 14, left: 770, width: 200, textAlign: 'center' }}>
        <Mono size={9} color={WF_INK_FAINT} weight={700} style={{ display: 'block' }}>03</Mono>
        <Scribble size={20} weight={700}>Customers</Scribble>
      </div>

      {/* Group labels — horizontal, sitting above each sub-section of the
          Inputs column. (Vertical bracket bars removed.) */}
      <div style={{ position: 'absolute', top: 54, left: 50, width: 200, display: 'flex', alignItems: 'baseline', gap: 6, paddingBottom: 4, borderBottom: `1.2px dashed ${WF_INK_FAINT}` }}>
        <Mono size={9} color={WF_INK_FAINT} weight={700}>GROUP 1 ·</Mono>
        <Scribble size={13} weight={600} color={WF_INK_SOFT}>Companies (direct)</Scribble>
      </div>

      <div style={{ position: 'absolute', top: 296, left: 50, width: 200, display: 'flex', alignItems: 'baseline', gap: 6, paddingBottom: 4, borderBottom: `1.2px dashed ${palette.accent2}` }}>
        <Mono size={9} color={palette.accent2} weight={700}>GROUP 2 ·</Mono>
        <Scribble size={13} weight={600} color={WF_INK_SOFT}>External factors</Scribble>
      </div>

      {/* Connection lines (SVG behind nodes) */}
      <svg width={width} height={height} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {[...inputEdges, ...outputEdges].map((e, i) => (
          <path key={'e'+i}
                d={curve(e.from.x, e.from.y, e.to.x, e.to.y)}
                stroke={WF_INK}
                strokeWidth={strokeFor(e.weight)}
                strokeDasharray="5 4"
                fill="none"
                opacity={e.weight === 'light' ? 0.5 : 0.85} />
        ))}
        {/* Competitor rivalry lines — squiggly dotted */}
        {compEdges.map((e, i) => (
          <path key={'c'+i}
                d={curve(e.from.x, e.from.y, e.to.x, e.to.y)}
                stroke={palette.accent2}
                strokeWidth={1.2}
                strokeDasharray="2 4"
                fill="none"
                opacity={0.6} />
        ))}
      </svg>

      {/* Suppliers */}
      {suppliers.map(s => <ChainNode key={s.id} {...s} kind="supplier" />)}
      {/* Externals */}
      {externals.map(s => <ChainNode key={s.id} {...s} kind="external" palette={palette} />)}

      {/* Apple — the principle */}
      <div style={{
        position: 'absolute',
        left: apple.x, top: apple.y, width: apple.w, height: apple.h,
        background: palette.accent,
        color: WF_PAPER,
        border: `2px solid ${WF_INK}`,
        borderRadius: 4,
        boxShadow: '3px 3px 0 rgba(31,29,26,0.18)',
        padding: 14,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
      }}>
        <Mono size={10} color={palette.tint} weight={700}>NYSE · TECH · LARGE-CAP</Mono>
        <Scribble size={30} weight={700} color={WF_PAPER} style={{ display: 'block', marginTop: 4, lineHeight: 1 }}>Apple Inc.</Scribble>
        <Scribble size={14} color={palette.tint} style={{ display: 'block', marginTop: 4 }}>The principle · AAPL</Scribble>
      </div>

      {/* Output nodes */}
      {outputs.map(o => <ChainNode key={o.id} {...o} kind="output" palette={palette} />)}

      {/* Competitors row */}
      <div style={{ position: 'absolute', left: 355, top: 446, width: 570, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Scribble size={14} weight={700} color={palette.accent2} style={{ marginRight: 4 }}>Competitors</Scribble>
        <Mono size={10} color={WF_INK_FAINT}>· same wallet share · all public</Mono>
      </div>
      {competitors.map(c => (
        <div key={c.id} style={{
          position: 'absolute', left: c.x, top: c.y, width: c.w, height: c.h,
          border: `1.4px dashed ${palette.accent2}`,
          background: WF_PAPER,
          borderRadius: 4,
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
          padding: '2px 4px',
        }}>
          <Mono size={10} weight={700} color={WF_INK}>{c.label}</Mono>
          <Scribble size={12} color={WF_INK_SOFT}>{c.sub}</Scribble>
        </div>
      ))}

      {/* Floating annotation */}
      <Pin style={{ right: 18, top: 380, color: WF_INK_SOFT }} side="left">stroke width = dependency strength</Pin>
    </div>
  );
}

// A single node in the chain
function ChainNode({ x, y, w, h, label, sub, kind, palette }) {
  const styles = {
    supplier: { bg: WF_PAPER,         border: WF_INK,           accent: WF_INK },
    external: { bg: WF_PAPER,         border: palette?.accent2 || '#b35a3a', accent: palette?.accent2 || '#b35a3a', dashed: true },
    output:   { bg: palette?.tint || '#e6efed', border: WF_INK,  accent: palette?.accent || '#2d5e5a' },
  }[kind] || { bg: WF_PAPER, border: WF_INK, accent: WF_INK };

  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: w, height: h,
      background: styles.bg,
      border: `1.6px ${styles.dashed ? 'dashed' : 'solid'} ${styles.border}`,
      borderRadius: 3,
      padding: '4px 10px',
      display: 'flex', alignItems: 'center', gap: 8,
      boxShadow: '1.5px 1.5px 0 rgba(31,29,26,0.08)',
    }}>
      <Scribble size={15} weight={700} color={styles.accent}>{label}</Scribble>
      {sub && <>
        <div style={{ flex: 1 }} />
        <Mono size={9} color={WF_INK_SOFT}>{sub}</Mono>
      </>}
    </div>
  );
}

// ── Company Dashboard page ─────────────────────────────────────────────────

function V6_CompanyDash({ palette }) {
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
    { l: 'Supply chain', active: true },
    { l: 'Financials' },
    { l: 'Patents' },
    { l: 'History' },
  ];

  return (
    <div style={{ width: W, background: WF_PAPER, fontFamily: 'var(--wf-body)', color: WF_INK, display: 'grid', gridTemplateColumns: `${SIDE}px 1fr`, minHeight: 1280 }}>

      {/* SIDEBAR (same shell as V5) */}
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

        {/* Breadcrumb + company header */}
        <div style={{ padding: '14px 22px 10px', borderBottom: `1.2px dashed ${WF_INK_FAINT}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Scribble size={14} color={WF_INK_SOFT}>Companies</Scribble>
          <Mono size={11} color={WF_INK_FAINT}>›</Mono>
          <Scribble size={14} color={WF_INK_SOFT}>Tech</Scribble>
          <Mono size={11} color={WF_INK_FAINT}>›</Mono>
          <Scribble size={14} weight={700}>AAPL</Scribble>
          <div style={{ flex: 1 }} />
          <Mono size={10} color={WF_INK_FAINT}>14:32 UTC · LIVE ●</Mono>
        </div>

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
          {tabs.map((t, i) => (
            <div key={t.l} style={{
              padding: '8px 14px',
              borderBottom: t.active ? `3px solid ${palette.accent}` : '3px solid transparent',
              marginBottom: -1,
            }}>
              <Scribble size={15} weight={t.active ? 700 : 500} color={t.active ? palette.accent : WF_INK_SOFT}>{t.l}</Scribble>
            </div>
          ))}
        </div>

        {/* HERO — supply chain network */}
        <div style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
            <Mono size={11} color={palette.accent} weight={700}>HERO · INPUTS → PRINCIPLE → CUSTOMERS</Mono>
            <div style={{ flex: 1, borderBottom: `1.2px dashed ${WF_INK_FAINT}`, marginBottom: 5 }}></div>
            <Mono size={10} color={WF_INK_FAINT}>last updated · Q4 '25 filings</Mono>
          </div>
          <Scribble size={36} weight={700} style={{ display: 'block', lineHeight: 1.0, marginBottom: 4 }}>
            Who Apple buys from — and who Apple sells to.
          </Scribble>
          <Scribble size={18} color={WF_INK_SOFT} style={{ display: 'block', lineHeight: 1.25, marginBottom: 18 }}>
            Click any node to open that side of the chain. Toggle external factors to see fragility from oil, FX, and shipping.
          </Scribble>

          {/* Network legend bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 14, paddingBottom: 10, borderBottom: `1px dashed ${WF_INK_FAINT}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 16, height: 12, border: `1.4px solid ${WF_INK}`, background: WF_PAPER, display: 'inline-block' }}></span>
              <Scribble size={13}>Company (direct)</Scribble>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 16, height: 12, border: `1.4px dashed ${palette.accent2}`, background: WF_PAPER, display: 'inline-block' }}></span>
              <Scribble size={13}>External factor</Scribble>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 16, height: 12, background: palette.accent, display: 'inline-block', border: `1.4px solid ${WF_INK}` }}></span>
              <Scribble size={13}>The principle</Scribble>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 16, height: 12, background: palette.tint, border: `1.4px solid ${WF_INK}`, display: 'inline-block' }}></span>
              <Scribble size={13}>Customer / channel</Scribble>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <Mono size={10} color={WF_INK_FAINT} weight={700}>FILTERS:</Mono>
              {['All', 'Companies', 'External', '5Y lens'].map((f, i) => (
                <div key={f} style={{ padding: '3px 8px', border: `1.2px solid ${i === 0 ? palette.accent : WF_INK_FAINT}`, borderRadius: 10 }}>
                  <Mono size={10} weight={i === 0 ? 700 : 500} color={i === 0 ? palette.accent : WF_INK_SOFT}>{f}</Mono>
                </div>
              ))}
            </div>
          </div>

          <SupplyChainNetwork palette={palette} width={1020} height={540} />
        </div>

        {/* Summary + News + History — exactly as in user's sketch */}
        <div style={{ padding: '8px 22px 22px' }}>
          <SketchBox style={{ padding: 18, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
              <Mono size={10} color={WF_INK_FAINT} weight={700}>SUMMARY</Mono>
              <Scribble size={22} weight={700}>What this chain tells us</Scribble>
              <div style={{ flex: 1 }} />
              <Mono size={10} color={WF_INK_FAINT}>generated · cited · 4 sources</Mono>
            </div>
            <Scribble size={16} color={WF_INK_SOFT} style={{ display: 'block', lineHeight: 1.35 }}>
              Apple's revenue is unusually <b>consumer-direct</b> compared to its peers (~70% sold to end users, not channel partners),
              which is why retail margin is so high. But on the supply side it is <b>concentrated</b> in <b>Taiwan</b> (TSMC chips),
              <b>China assembly</b> (Foxconn), and <b>rare-earth</b> supply (~85% from one country). The 1992 IBM analogue says:
              <i> watch the consumer segment's renewal cycle, not the unit count.</i>
            </Scribble>
            <div style={{ marginTop: 12, display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              {[
                ['Supplier concentration', '0.62',  'high'],
                ['Customer diversity',     '0.74',  'med'],
                ['5Y analogue match',      'IBM \'92', 'note'],
                ['External fragility',     'Red Sea · oil', 'watch'],
              ].map(([k, v, sev], i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingRight: 18, borderRight: i < 3 ? `1px dashed ${WF_INK_FAINT}` : 'none' }}>
                  <Mono size={10} color={WF_INK_FAINT} weight={700}>{k.toUpperCase()}</Mono>
                  <Scribble size={20} weight={700} color={sev === 'high' ? '#b35a3a' : sev === 'med' ? palette.accent2 : palette.accent}>{v}</Scribble>
                </div>
              ))}
            </div>
          </SketchBox>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {/* NEWS */}
            <SketchBox style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                <Mono size={10} color={WF_INK_FAINT} weight={700}>NEWS</Mono>
                <Scribble size={20} weight={700}>This week, on the chain</Scribble>
              </div>
              {[
                ['TSM',       'CoWoS capacity booked through \'27',           'supply',  '4h'],
                ['2317.TW',   'Hon Hai India build-out hits 20% of output',   'supply',  '1d'],
                ['TMUS',      'T-Mobile renewal cycle — upgrade rate ↑',       'customer','1d'],
                ['MAERSK.B',  'Red Sea reroute adds 14 days, $0.40/unit',     'external','2d'],
                ['1810.HK',   'Xiaomi 15 launch · China premium share',        'compete', '3d'],
              ].map(([tag, t, kind, when], i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '78px 1fr 30px', gap: 6, padding: '6px 0', borderBottom: `1px dashed ${WF_INK_FAINT}`, alignItems: 'baseline' }}>
                  <Mono size={9} color={palette.accent} weight={700}>{tag}</Mono>
                  <Scribble size={14}>{t}</Scribble>
                  <Mono size={9} color={WF_INK_FAINT} style={{ textAlign: 'right' }}>{when}</Mono>
                </div>
              ))}
            </SketchBox>

            {/* HISTORY */}
            <SketchBox style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                <Mono size={10} color={WF_INK_FAINT} weight={700}>HISTORY</Mono>
                <Scribble size={20} weight={700}>5-year lens · this chain</Scribble>
              </div>
              <Scribble size={14} color={WF_INK_SOFT} style={{ display: 'block', marginBottom: 8 }}>
                When a similar dependency map appeared before — and what happened next.
              </Scribble>
              {[
                ['IBM',  '1992', 'services pivot saved margins',           'echo'],
                ['NOK',  '2007', 'one-product concentration · then iPhone', 'warning'],
                ['6758', '2005', 'platform fragmentation · long flat',     'caution'],
                ['MSFT', '2014', 'services pivot worked · stock 6×',       'echo'],
              ].map(([co, yr, note, kind]) => (
                <div key={co + yr} style={{ display: 'grid', gridTemplateColumns: '60px 50px 1fr 70px', gap: 8, padding: '8px 0', borderBottom: `1px dashed ${WF_INK_FAINT}`, alignItems: 'center' }}>
                  <Mono size={11} weight={700}>{co}</Mono>
                  <Mono size={11} color={WF_INK_SOFT}>{yr}</Mono>
                  <Scribble size={14}>{note}</Scribble>
                  <Mono size={9} weight={700} color={kind === 'echo' ? '#4a7c59' : kind === 'warning' ? '#b35a3a' : palette.accent2} style={{ textAlign: 'right' }}>
                    {kind.toUpperCase()}
                  </Mono>
                </div>
              ))}
              <div style={{ marginTop: 8, textAlign: 'right' }}>
                <Scribble size={13} color={palette.accent}>Open the 5Y lens →</Scribble>
              </div>
            </SketchBox>
          </div>
        </div>
      </div>
    </div>
  );
}

window.V6_CompanyDash = V6_CompanyDash;
