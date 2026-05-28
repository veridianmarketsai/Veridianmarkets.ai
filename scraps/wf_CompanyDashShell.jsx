// Shared shell for all Company Dashboard tab pages.
// Centralizes: sidebar, breadcrumb, AAPL header strip, and the tab bar.
// Each tab page (v8 Overview, v9 Financials, v10 Patents, plus eventually
// the rebuilt v6/v7) just passes activeTab + children for the main content.

function CompanyDashShell({ palette, activeTab, height = 1380, children }) {
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

  const tabs = ['Overview', 'Supply chain', 'Financials', 'Patents', 'History']
    .map(l => ({ l, active: l === activeTab }));

  return (
    <div style={{ width: W, background: WF_PAPER, fontFamily: 'var(--wf-body)', color: WF_INK, display: 'grid', gridTemplateColumns: `${SIDE}px 1fr`, minHeight: height }}>
      {/* Sidebar */}
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

      {/* Main */}
      <div style={{ minWidth: 0 }}>
        {/* Breadcrumb */}
        <div style={{ padding: '14px 22px 10px', borderBottom: `1.2px dashed ${WF_INK_FAINT}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Scribble size={14} color={WF_INK_SOFT}>Companies</Scribble>
          <Mono size={11} color={WF_INK_FAINT}>›</Mono>
          <Scribble size={14} color={WF_INK_SOFT}>Tech</Scribble>
          <Mono size={11} color={WF_INK_FAINT}>›</Mono>
          <Scribble size={14} weight={700}>AAPL</Scribble>
          <Mono size={11} color={WF_INK_FAINT}>›</Mono>
          <Scribble size={14} color={palette.accent} weight={700}>{activeTab}</Scribble>
          <div style={{ flex: 1 }} />
          <Mono size={10} color={WF_INK_FAINT}>14:32 UTC · LIVE ●</Mono>
        </div>

        {/* Company header */}
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

        {children}
      </div>
    </div>
  );
}

window.CompanyDashShell = CompanyDashShell;
