// V12 — Company search · WITH EYE PREVIEW.
// Demonstrates what happens when the user clicks the Watch (eye) icon on a
// row. A floating preview popover appears anchored to that row, showing:
//   Box 1 — a compact supply-chain network for that ticker
//   Box 2 — the dashboard's tab strip (clickable mini-tabs)
//   Box 3 — a History tab snippet (analogue + 5Y outlook stub)
// Other rows stay legible under a dim wash so context isn't lost.

// ── Mini supply-chain network ─────────────────────────────────────────────

function MiniSupplyChain({ palette, width = 380, height = 220 }) {
  const apple = { x: 152, y: 84, w: 76, h: 52 };
  const suppliers = [
    { id: 'tsm',  label: 'TSM',     y: 20  },
    { id: '2317', label: '2317',    y: 56  },
    { id: 'lpl',  label: 'LPL',     y: 92  },
    { id: 'sony', label: 'SONY',    y: 128 },
    { id: 'qcom', label: 'QCOM',    y: 164 },
  ].map(s => ({ ...s, x: 14, w: 80, h: 24 }));
  const customers = [
    { id: 'tmus', label: 'TMUS',  y: 20  },
    { id: 'vz',   label: 'VZ',    y: 56  },
    { id: 'bby',  label: 'BBY',   y: 92  },
    { id: 'cost', label: 'COST',  y: 128 },
    { id: 'amzn', label: 'AMZN',  y: 164 },
  ].map(c => ({ ...c, x: 286, w: 80, h: 24 }));

  const appleMidY = apple.y + apple.h / 2;
  const curve = (x1, y1, x2, y2) => {
    const dx = (x2 - x1) * 0.55;
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
  };
  const inputs = suppliers.map(s => ({
    from: { x: s.x + s.w, y: s.y + s.h / 2 },
    to:   { x: apple.x, y: appleMidY + (s.y + s.h / 2 - appleMidY) * 0.25 },
  }));
  const outputs = customers.map(c => ({
    from: { x: apple.x + apple.w, y: appleMidY + (c.y + c.h / 2 - appleMidY) * 0.25 },
    to:   { x: c.x, y: c.y + c.h / 2 },
  }));

  return (
    <div style={{ position: 'relative', width, height, background: WF_PAPER, border: `1.4px solid ${WF_INK}`, borderRadius: 4 }}>
      <svg width={width} height={height} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {[...inputs, ...outputs].map((e, i) => (
          <path key={i} d={curve(e.from.x, e.from.y, e.to.x, e.to.y)}
                fill="none" stroke={WF_INK} strokeWidth={1.1} strokeDasharray="4 3" opacity={0.7} />
        ))}
      </svg>

      {suppliers.map(s => (
        <div key={s.id} style={{
          position: 'absolute', left: s.x, top: s.y, width: s.w, height: s.h,
          border: `1.2px solid ${WF_INK}`, background: WF_PAPER, borderRadius: 3,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><Mono size={10} weight={700}>{s.label}</Mono></div>
      ))}

      <div style={{
        position: 'absolute', left: apple.x, top: apple.y, width: apple.w, height: apple.h,
        background: palette.accent, border: `1.6px solid ${WF_INK}`, borderRadius: 4,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        boxShadow: '2px 2px 0 rgba(31,29,26,0.18)',
      }}>
        <Scribble size={16} weight={700} color={WF_PAPER} style={{ lineHeight: 1 }}>AAPL</Scribble>
        <Mono size={8} color={palette.tint} weight={700} style={{ marginTop: 2 }}>PRINCIPLE</Mono>
      </div>

      {customers.map(c => (
        <div key={c.id} style={{
          position: 'absolute', left: c.x, top: c.y, width: c.w, height: c.h,
          border: `1.2px solid ${WF_INK}`, background: palette.tint, borderRadius: 3,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><Mono size={10} weight={700}>{c.label}</Mono></div>
      ))}
    </div>
  );
}

// ── Mini fan chart for History preview ────────────────────────────────────

function MiniFan({ palette, width = 320, height = 110 }) {
  const pad = 16;
  const w = width - pad * 2;
  const h = height - pad * 2;
  const yToPx = pct => pad + (1 - (pct + 30) / 200) * h;
  const xToPx = yr => pad + (yr / 5) * w;

  const median = [0, 1, 2, 3, 4, 5].map(yr => [xToPx(yr), yToPx(yr * 12)]);
  const top    = [0, 1, 2, 3, 4, 5].map(yr => [xToPx(yr), yToPx(yr * 28)]);
  const bot    = [0, 1, 2, 3, 4, 5].map(yr => [xToPx(yr), yToPx(yr * -4)]);

  const bandPath = `M ${top.map(p => p.join(' ')).join(' L ')} L ${[...bot].reverse().map(p => p.join(' ')).join(' L ')} Z`;
  const medPath = 'M ' + median.map(p => p.join(' ')).join(' L ');

  return (
    <svg width={width} height={height}>
      <line x1={pad} y1={yToPx(0)} x2={width - pad} y2={yToPx(0)} stroke={WF_INK_FAINT} strokeWidth={0.8} strokeDasharray="2 3" />
      <path d={bandPath} fill={palette.accent} opacity={0.16} />
      <path d={medPath} fill="none" stroke={palette.accent} strokeWidth={2} />
      {[0, 5].map(yr => (
        <text key={yr} x={xToPx(yr)} y={height - 3} textAnchor={yr === 0 ? 'start' : 'end'} fontSize="8" fontFamily="var(--wf-mono)" fill={WF_INK_FAINT} fontWeight={700}>
          {yr === 0 ? 'TODAY' : '+5Y'}
        </text>
      ))}
    </svg>
  );
}

// ── Preview popover ───────────────────────────────────────────────────────

function PreviewPopover({ palette, ticker = 'AAPL', name = 'Apple Inc.', anchorTop }) {
  const tabs = ['Overview', 'Supply chain', 'Financials', 'Patents', 'History'];

  return (
    <div style={{
      position: 'absolute',
      left: 280,
      top: anchorTop,
      width: 820,
      background: WF_PAPER,
      border: `2px solid ${WF_INK}`,
      borderRadius: 8,
      boxShadow: '6px 6px 0 rgba(31,29,26,0.18), 0 4px 24px rgba(31,29,26,0.10)',
      padding: 18,
      zIndex: 10,
    }}>
      {/* connector triangle pointing left toward the eye icon */}
      <div style={{
        position: 'absolute', left: -14, top: 32,
        width: 0, height: 0,
        borderTop: '10px solid transparent',
        borderBottom: '10px solid transparent',
        borderRight: `14px solid ${WF_INK}`,
      }} />
      <div style={{
        position: 'absolute', left: -11, top: 33,
        width: 0, height: 0,
        borderTop: '9px solid transparent',
        borderBottom: '9px solid transparent',
        borderRight: `12px solid ${WF_PAPER}`,
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
        <Mono size={10} color={palette.accent} weight={700}>PREVIEW</Mono>
        <Scribble size={26} weight={700} style={{ lineHeight: 1 }}>{ticker}</Scribble>
        <Scribble size={15} color={WF_INK_SOFT}>{name}</Scribble>
        <Mono size={10} color={WF_INK_FAINT}>· $308.82</Mono>
        <Mono size={10} weight={700} color="#4a7c59">+1.26%</Mono>
        <div style={{ flex: 1 }} />
        <Scribble size={13} color={palette.accent} weight={700}>Open dashboard →</Scribble>
        <div style={{
          width: 24, height: 24, marginLeft: 10,
          border: `1.4px solid ${WF_INK}`, borderRadius: 4,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: WF_PAPER,
        }}>
          <Mono size={12} weight={700}>×</Mono>
        </div>
      </div>

      {/* Box 2: Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: `1.4px solid ${WF_INK}`, marginBottom: 14, position: 'relative' }}>
        {tabs.map(t => (
          <div key={t} style={{
            padding: '6px 12px',
            borderBottom: '2.5px solid transparent',
            marginBottom: -1,
          }}>
            <Scribble size={13} weight={500} color={WF_INK_SOFT}>{t}</Scribble>
          </div>
        ))}
        <div style={{ position: 'absolute', top: -16, left: 0 }}>
          <Mono size={9} color={palette.accent2} weight={700}>BOX 2 · TABS</Mono>
        </div>
      </div>

      {/* Two-column preview body */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 14 }}>
        {/* Box 1: Mini supply chain */}
        <div>
          <Mono size={9} color={palette.accent2} weight={700} style={{ display: 'block', marginBottom: 4 }}>BOX 1 · SUPPLY CHAIN PREVIEW</Mono>
          <MiniSupplyChain palette={palette} width={420} height={210} />
          <Mono size={9} color={WF_INK_FAINT} style={{ display: 'block', marginTop: 4 }}>5 suppliers · 5 customers · all public · click to expand</Mono>
        </div>

        {/* Box 3: History snippet */}
        <div>
          <Mono size={9} color={palette.accent2} weight={700} style={{ display: 'block', marginBottom: 4 }}>BOX 3 · HISTORY</Mono>
          <div style={{ padding: 12, border: `1.4px solid ${WF_INK}`, borderRadius: 4, background: palette.tint }}>
            <Mono size={9} color={palette.accent} weight={700}>CLOSEST ANALOGUE · 87%</Mono>
            <Scribble size={17} weight={700} style={{ display: 'block', marginTop: 2, lineHeight: 1.1 }}>
              Reads like MSFT in 2014.
            </Scribble>
            <Scribble size={12} color={WF_INK_SOFT} style={{ display: 'block', marginTop: 4, lineHeight: 1.25 }}>
              Services pivot lit. Capital return story. Margin expanding.
            </Scribble>
            <div style={{ marginTop: 8 }}>
              <MiniFan palette={palette} width={320} height={90} />
            </div>
            <div style={{ marginTop: 6, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {[
                ['Bull P75', '+148%', '#4a7c59'],
                ['Base P50', '+62%',  palette.accent],
                ['Bear P25', '-18%',  '#b35a3a'],
              ].map(([l, v, c]) => (
                <div key={l} style={{ padding: '4px 6px', background: WF_PAPER, border: `1px solid ${WF_INK}`, borderRadius: 3 }}>
                  <Mono size={8} color={WF_INK_FAINT} weight={700}>{l.toUpperCase()}</Mono>
                  <Mono size={12} weight={700} color={c}>{v}</Mono>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

function V12_PreviewOverlay({ palette }) {
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

  const companies = [
    { ticker: 'AAPL', name: 'Apple Inc.',         price: '$308.82', chg: '+1.26%', dir: 'up',   sector: 'Tech · Consumer',     mcap: '$4.54T',  match: '87% MSFT \'14', watching: true },
    { ticker: 'NVDA', name: 'NVIDIA Corp.',       price: '$945.10', chg: '+3.40%', dir: 'up',   sector: 'Tech · Semis',        mcap: '$2.32T' },
    { ticker: 'MSFT', name: 'Microsoft Corp.',    price: '$427.15', chg: '+0.84%', dir: 'up',   sector: 'Tech · Software',     mcap: '$3.17T' },
    { ticker: 'GOOGL',name: 'Alphabet Inc.',      price: '$172.04', chg: '-0.42%', dir: 'down', sector: 'Tech · Ads',          mcap: '$2.13T' },
    { ticker: 'AMZN', name: 'Amazon.com',         price: '$185.30', chg: '+0.91%', dir: 'up',   sector: 'Retail · Cloud',      mcap: '$1.93T' },
    { ticker: 'META', name: 'Meta Platforms',     price: '$498.22', chg: '+1.87%', dir: 'up',   sector: 'Tech · Social',       mcap: '$1.27T' },
    { ticker: 'TSLA', name: 'Tesla, Inc.',        price: '$182.04', chg: '-2.14%', dir: 'down', sector: 'Auto · EVs',          mcap: '$580B' },
    { ticker: 'BRK.B',name: 'Berkshire Hathaway', price: '$418.92', chg: '+0.31%', dir: 'up',   sector: 'Conglomerate',         mcap: '$903B' },
    { ticker: 'AVGO', name: 'Broadcom Inc.',      price: '$1342.0', chg: '+2.10%', dir: 'up',   sector: 'Tech · Semis',        mcap: '$623B' },
    { ticker: 'JPM',  name: 'JPMorgan Chase',     price: '$215.40', chg: '+0.18%', dir: 'up',   sector: 'Finance · Banking',   mcap: '$615B' },
  ];

  return (
    <div style={{ width: W, background: WF_PAPER, fontFamily: 'var(--wf-body)', color: WF_INK, display: 'grid', gridTemplateColumns: `${SIDE}px 1fr`, minHeight: 1280, position: 'relative' }}>
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
      </div>

      {/* MAIN */}
      <div style={{ minWidth: 0, position: 'relative' }}>
        {/* Breadcrumb */}
        <div style={{ padding: '14px 22px 10px', borderBottom: `1.2px dashed ${WF_INK_FAINT}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Scribble size={14} color={WF_INK_SOFT}>Explore</Scribble>
          <Mono size={11} color={WF_INK_FAINT}>›</Mono>
          <Scribble size={14} weight={700}>Company search</Scribble>
          <div style={{ flex: 1 }} />
          <Mono size={10} color={WF_INK_FAINT}>14:32 UTC · LIVE ●</Mono>
        </div>

        {/* Header */}
        <div style={{ padding: '20px 22px 0' }}>
          <Mono size={11} color={palette.accent} weight={700}>EYE PRESSED → PREVIEW STATE</Mono>
          <Scribble size={36} weight={700} style={{ display: 'block', marginTop: 6, lineHeight: 1.0 }}>Find a company.</Scribble>
          <Scribble size={15} color={WF_INK_SOFT} style={{ display: 'block', marginTop: 6, lineHeight: 1.3 }}>
            Hovering or clicking the <b style={{ color: palette.accent }}>eye icon</b> on a row opens a preview popover \u2014 a quick look at the company without leaving the list.
          </Scribble>
        </div>

        {/* Search bar (static) */}
        <div style={{ padding: '20px 22px 0', display: 'grid', gridTemplateColumns: '1fr 200px 56px 56px', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: WF_PAPER, border: `1.6px solid ${WF_INK}`, borderRadius: 28 }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={WF_INK} strokeWidth={1.8} strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.5" y2="16.5" />
            </svg>
            <Scribble size={16} color={WF_INK_FAINT}>search ticker, company, person, era</Scribble>
            <div style={{ flex: 1 }} />
            <Mono size={9} color={WF_INK_FAINT} weight={700}>⌘ K</Mono>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', background: WF_PAPER, border: `1.6px solid ${WF_INK}`, borderRadius: 28 }}>
            <Scribble size={15} weight={600}>Filter</Scribble>
            <div style={{ flex: 1 }} />
            <Mono size={11} weight={700}>▾</Mono>
          </div>
          <div style={{ width: 56, height: 48, border: `1.6px solid ${WF_INK}`, borderRadius: 28, background: WF_PAPER, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Mono size={14} weight={700}>A↕</Mono>
          </div>
          <div style={{ width: 56, height: 48, border: `1.6px solid ${WF_INK}`, borderRadius: 28, background: WF_PAPER, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={WF_INK} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 1 1 8 0v4" />
            </svg>
          </div>
        </div>

        {/* Filter chips */}
        <div style={{ padding: '14px 22px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Mono size={10} color={WF_INK_FAINT} weight={700}>FILTERS:</Mono>
          {[['Sector','Technology'],['Market cap','> $10B'],['P/E','< 40'],['Analyst','Buy or better']].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', border: `1.3px solid ${palette.accent}`, borderRadius: 14, background: palette.tint }}>
              <Mono size={10} color={palette.accent} weight={700}>{k.toUpperCase()}</Mono>
              <Scribble size={13} weight={600}>{v}</Scribble>
              <Mono size={11} color={WF_INK_SOFT} weight={700} style={{ marginLeft: 2 }}>×</Mono>
            </div>
          ))}
        </div>

        {/* Rows — dimmed via wrapper opacity except AAPL which keeps focus */}
        <div style={{ padding: '14px 22px 22px', display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
          {companies.map((c, i) => {
            const isAapl = c.ticker === 'AAPL';
            return (
              <div key={c.ticker} style={{
                background: palette.tint,
                border: isAapl ? `2px solid ${palette.accent}` : `1.4px solid ${WF_INK}`,
                borderRadius: 6,
                padding: '10px 14px',
                display: 'grid',
                gridTemplateColumns: '110px 1fr 200px 130px',
                gap: 14,
                alignItems: 'center',
                boxShadow: isAapl ? '3px 3px 0 rgba(31,29,26,0.14)' : '1.5px 1.5px 0 rgba(31,29,26,0.06)',
                opacity: isAapl ? 1 : 0.45,
              }}>
                <div>
                  <Scribble size={22} weight={700} style={{ lineHeight: 1 }}>{c.ticker}</Scribble>
                  <div><Mono size={10} color={WF_INK_SOFT} style={{ display: 'block', marginTop: 2 }}>{c.name}</Mono></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 18 }}>
                  <Mono size={13} weight={600}>{c.price}</Mono>
                  <Mono size={12} weight={700} color={c.dir === 'up' ? '#4a7c59' : '#b35a3a'}>{c.chg}</Mono>
                  <Mono size={11} color={WF_INK_SOFT}>{c.sector}</Mono>
                  <Mono size={11} color={WF_INK_FAINT}>{c.mcap}</Mono>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Sparkline width={150} height={26} trend={c.dir} color={c.dir === 'up' ? '#4a7c59' : '#b35a3a'} strokeWidth={1.6} />
                </div>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                  <IconButton icon={IconWatch} palette={palette} active={isAapl} size={32} />
                  <IconButton icon={IconChain} palette={palette} size={32} />
                  <IconButton icon={IconOpen}  palette={palette} size={32} />
                </div>
              </div>
            );
          })}

          {/* PREVIEW POPOVER — anchored above the AAPL row, projecting downward
              into the dimmed rows. */}
          <PreviewPopover palette={palette} anchorTop={68} />
        </div>
      </div>
    </div>
  );
}

window.V12_PreviewOverlay = V12_PreviewOverlay;
