// V11 — Company Search page.
// Reached from the sidebar's "Company search" item. The screener-style list
// view that mirrors the user's hand-drawn sketch: search + filter bar up top,
// teal-tinted result rows with action icons (Watch / Supply chain / Open) on
// the right of each row, expanded preview of the focused row.

// ── Action icons (small inline SVG, monospace size ~22px square) ───────────

function IconWatch({ size = 18, color = WF_INK, active }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z" fill={active ? color : 'none'} fillOpacity={active ? 0.15 : 0} />
      <circle cx="12" cy="12" r="3" fill={active ? color : WF_PAPER} />
    </svg>
  );
}

function IconChain({ size = 18, color = WF_INK }) {
  // Three nodes joined like a small graph
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="6" x2="12" y2="12" />
      <line x1="18" y1="6" x2="12" y2="12" />
      <line x1="12" y1="12" x2="12" y2="20" />
      <circle cx="6"  cy="6"  r="2.5" fill={WF_PAPER} />
      <circle cx="18" cy="6"  r="2.5" fill={WF_PAPER} />
      <circle cx="12" cy="20" r="2.5" fill={WF_PAPER} />
      <circle cx="12" cy="12" r="2.5" fill={color} />
    </svg>
  );
}

function IconOpen({ size = 18, color = WF_INK }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9,6 15,12 9,18" />
    </svg>
  );
}

// ── Row component ──────────────────────────────────────────────────────────

function CompanyRow({ palette, c, expanded, onToggle }) {
  return (
    <div style={{
      background: palette.tint,
      border: `1.6px solid ${WF_INK}`,
      borderRadius: 6,
      padding: expanded ? '14px 16px' : '10px 14px',
      display: 'grid',
      gridTemplateColumns: '110px 1fr 200px 120px',
      gap: 14,
      alignItems: 'center',
      boxShadow: expanded ? '3px 3px 0 rgba(31,29,26,0.10)' : '1.5px 1.5px 0 rgba(31,29,26,0.06)',
      cursor: 'pointer',
    }}
    onClick={onToggle}
    >
      {/* Ticker block */}
      <div>
        <Scribble size={expanded ? 28 : 22} weight={700} style={{ lineHeight: 1 }}>{c.ticker}</Scribble>
        <div><Mono size={10} color={WF_INK_SOFT} style={{ display: 'block', marginTop: 2 }}>{c.name}</Mono></div>
      </div>

      {/* Price + change + sector */}
      <div>
        {expanded ? (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
            <div>
              <Mono size={9} color={WF_INK_FAINT} weight={700}>PRICE</Mono>
              <div><Mono size={18} weight={700}>{c.price}</Mono></div>
            </div>
            <div>
              <Mono size={9} color={WF_INK_FAINT} weight={700}>CHANGE</Mono>
              <div><Mono size={14} weight={700} color={c.dir === 'up' ? '#4a7c59' : '#b35a3a'}>{c.chg}</Mono></div>
            </div>
            <div>
              <Mono size={9} color={WF_INK_FAINT} weight={700}>MKT CAP</Mono>
              <div><Mono size={14} weight={600}>{c.mcap}</Mono></div>
            </div>
            <div>
              <Mono size={9} color={WF_INK_FAINT} weight={700}>SECTOR</Mono>
              <div><Scribble size={13} weight={600}>{c.sector}</Scribble></div>
            </div>
            <div>
              <Mono size={9} color={WF_INK_FAINT} weight={700}>5Y MATCH</Mono>
              <div><Mono size={14} weight={700} color={palette.accent}>{c.match}</Mono></div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 18 }}>
            <Mono size={13} weight={600}>{c.price}</Mono>
            <Mono size={12} weight={700} color={c.dir === 'up' ? '#4a7c59' : '#b35a3a'}>{c.chg}</Mono>
            <Mono size={11} color={WF_INK_SOFT}>{c.sector}</Mono>
            <Mono size={11} color={WF_INK_FAINT}>{c.mcap}</Mono>
          </div>
        )}
      </div>

      {/* Sparkline */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        <Sparkline width={expanded ? 180 : 150} height={expanded ? 44 : 26} trend={c.dir} color={c.dir === 'up' ? '#4a7c59' : '#b35a3a'} strokeWidth={1.6} fill={expanded} />
      </div>

      {/* Action icons */}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
        {[
          { icon: IconWatch, title: 'Watch', active: c.watching },
          { icon: IconChain, title: 'Supply chain' },
          { icon: IconOpen,  title: 'Open dashboard' },
        ].map((b, i) => {
          const I = b.icon;
          return (
            <div key={i} title={b.title} style={{
              width: 32, height: 32,
              border: `1.4px solid ${WF_INK}`,
              borderRadius: 4,
              background: b.active ? palette.accent : WF_PAPER,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <I color={b.active ? WF_PAPER : WF_INK} active={b.active} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

function V11_CompanySearch({ palette }) {
  const W = 1280;
  const SIDE = 200;

  // Sidebar nav with Company search active
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
    { ticker: 'AAPL', name: 'Apple Inc.',         price: '$308.82', chg: '+1.26%', dir: 'up',   sector: 'Tech · Consumer electronics', mcap: '$4.54T',  match: '87% MSFT \'14', watching: true },
    { ticker: 'NVDA', name: 'NVIDIA Corp.',       price: '$945.10', chg: '+3.40%', dir: 'up',   sector: 'Tech · Semiconductors',       mcap: '$2.32T',  match: '74% CSCO \'99' },
    { ticker: 'MSFT', name: 'Microsoft Corp.',    price: '$427.15', chg: '+0.84%', dir: 'up',   sector: 'Tech · Software',             mcap: '$3.17T',  match: '69% IBM \'01' },
    { ticker: 'GOOGL',name: 'Alphabet Inc.',      price: '$172.04', chg: '-0.42%', dir: 'down', sector: 'Tech · Advertising',          mcap: '$2.13T',  match: '61% XOM \'08' },
    { ticker: 'AMZN', name: 'Amazon.com',         price: '$185.30', chg: '+0.91%', dir: 'up',   sector: 'Retail · Cloud',              mcap: '$1.93T',  match: '58% WMT \'00' },
    { ticker: 'META', name: 'Meta Platforms',     price: '$498.22', chg: '+1.87%', dir: 'up',   sector: 'Tech · Social',               mcap: '$1.27T',  match: '54% INTC \'02' },
    { ticker: 'TSLA', name: 'Tesla, Inc.',        price: '$182.04', chg: '-2.14%', dir: 'down', sector: 'Auto · EVs',                  mcap: '$580B',   match: '49% GM \'98' },
    { ticker: 'BRK.B',name: 'Berkshire Hathaway', price: '$418.92', chg: '+0.31%', dir: 'up',   sector: 'Conglomerate',                 mcap: '$903B',   match: '78% JNJ \'10' },
    { ticker: 'AVGO', name: 'Broadcom Inc.',      price: '$1342.0', chg: '+2.10%', dir: 'up',   sector: 'Tech · Semiconductors',       mcap: '$623B',   match: '66% TXN \'05' },
    { ticker: 'JPM',  name: 'JPMorgan Chase',     price: '$215.40', chg: '+0.18%', dir: 'up',   sector: 'Finance · Banking',           mcap: '$615B',   match: '71% JPM \'05' },
    { ticker: 'V',    name: 'Visa Inc.',          price: '$275.18', chg: '+0.55%', dir: 'up',   sector: 'Finance · Payments',          mcap: '$560B',   match: '63% AXP \'07' },
    { ticker: 'JNJ',  name: 'Johnson & Johnson',  price: '$158.40', chg: '-0.22%', dir: 'down', sector: 'Healthcare',                  mcap: '$381B',   match: '88% PG \'95'  },
  ];

  const filters = [
    { k: 'Sector',     v: 'Technology' },
    { k: 'Market cap', v: '> $10B' },
    { k: 'P/E',        v: '< 40' },
    { k: 'Analyst',    v: 'Buy or better' },
  ];

  const [expandedIdx, setExpandedIdx] = React.useState(0);

  return (
    <div style={{ width: W, background: WF_PAPER, fontFamily: 'var(--wf-body)', color: WF_INK, display: 'grid', gridTemplateColumns: `${SIDE}px 1fr`, minHeight: 1280 }}>

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
          <Scribble size={14} color={WF_INK_SOFT}>Explore</Scribble>
          <Mono size={11} color={WF_INK_FAINT}>›</Mono>
          <Scribble size={14} weight={700}>Company search</Scribble>
          <div style={{ flex: 1 }} />
          <Mono size={10} color={WF_INK_FAINT}>14:32 UTC · LIVE ●</Mono>
        </div>

        {/* Page header */}
        <div style={{ padding: '20px 22px 0' }}>
          <Mono size={11} color={palette.accent} weight={700}>EXPLORE \u00b7 4,904 PUBLIC COMPANIES</Mono>
          <Scribble size={36} weight={700} style={{ display: 'block', marginTop: 6, lineHeight: 1.0 }}>Find a company.</Scribble>
          <Scribble size={17} color={WF_INK_SOFT} style={{ display: 'block', marginTop: 6, lineHeight: 1.3 }}>
            Search by ticker, name, or person. Filter by sector, size, fundamentals, or which 5-year historical analogue matches today.
          </Scribble>
        </div>

        {/* Search bar */}
        <div style={{ padding: '20px 22px 0', display: 'grid', gridTemplateColumns: '1fr 200px 56px 56px', gap: 10, alignItems: 'center' }}>
          {/* Search input */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 16px',
            background: WF_PAPER,
            border: `1.6px solid ${WF_INK}`,
            borderRadius: 28,
            boxShadow: '2px 2px 0 rgba(31,29,26,0.08)',
          }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={WF_INK} strokeWidth={1.8} strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.5" y2="16.5" />
            </svg>
            <Scribble size={16} color={WF_INK_FAINT}>search ticker, company, person, era</Scribble>
            <div style={{ flex: 1 }} />
            <Mono size={9} color={WF_INK_FAINT} weight={700}>⌘ K</Mono>
          </div>

          {/* Filter dropdown */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 14px',
            background: WF_PAPER,
            border: `1.6px solid ${WF_INK}`,
            borderRadius: 28,
          }}>
            <Scribble size={15} weight={600}>Filter</Scribble>
            <div style={{ flex: 1 }} />
            <Mono size={11} color={WF_INK} weight={700}>▾</Mono>
          </div>

          {/* Sort / Az toggle */}
          <div style={{
            width: 56, height: 48,
            border: `1.6px solid ${WF_INK}`,
            borderRadius: 28,
            background: WF_PAPER,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Mono size={14} weight={700}>A↕</Mono>
          </div>

          {/* Lock / saved-search toggle */}
          <div style={{
            width: 56, height: 48,
            border: `1.6px solid ${WF_INK}`,
            borderRadius: 28,
            background: WF_PAPER,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={WF_INK} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 1 1 8 0v4" />
            </svg>
          </div>
        </div>

        {/* Active filter chips */}
        <div style={{ padding: '14px 22px 0', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Mono size={10} color={WF_INK_FAINT} weight={700}>FILTERS:</Mono>
          {filters.map(f => (
            <div key={f.k} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 10px',
              border: `1.3px solid ${palette.accent}`,
              borderRadius: 14,
              background: palette.tint,
            }}>
              <Mono size={10} color={palette.accent} weight={700}>{f.k.toUpperCase()}</Mono>
              <Scribble size={13} weight={600}>{f.v}</Scribble>
              <Mono size={11} color={WF_INK_SOFT} weight={700} style={{ marginLeft: 2 }}>×</Mono>
            </div>
          ))}
          <div style={{
            padding: '4px 10px',
            border: `1.3px dashed ${WF_INK_FAINT}`,
            borderRadius: 14,
          }}>
            <Mono size={10} color={WF_INK_SOFT} weight={700}>+ ADD FILTER</Mono>
          </div>
          <div style={{ flex: 1 }} />
          <Mono size={10} color={WF_INK_FAINT}>showing 12 of 487 matches \u00b7 sort: 5Y analogue match ▾</Mono>
        </div>

        {/* Results list */}
        <div style={{ padding: '14px 22px 22px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {companies.map((c, i) => (
            <CompanyRow
              key={c.ticker}
              palette={palette}
              c={c}
              expanded={i === expandedIdx}
              onToggle={() => setExpandedIdx(i === expandedIdx ? -1 : i)}
            />
          ))}
        </div>

        {/* Pagination */}
        <div style={{ padding: '0 22px 28px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Mono size={11} color={WF_INK_FAINT}>showing 1–12 of 487</Mono>
          <div style={{ flex: 1 }} />
          {['‹ prev', '1', '2', '3', '...', '41', 'next ›'].map((p, i) => (
            <div key={i} style={{
              padding: '5px 10px',
              border: `1.3px solid ${i === 1 ? WF_INK : WF_INK_FAINT}`,
              borderRadius: 6,
              background: i === 1 ? palette.tint : WF_PAPER,
            }}>
              <Mono size={11} weight={i === 1 ? 700 : 500} color={i === 1 ? palette.accent : WF_INK_SOFT}>{p}</Mono>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.V11_CompanySearch = V11_CompanySearch;
