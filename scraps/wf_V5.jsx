// V5 — Sidebar dashboard. Persistent left nav (workspace feel). Main canvas
// is a 2-col reading layout: hero story + adjustable side modules. This is
// the "app-like" alternative to the other four (which all use top nav).

function V5_Sidebar({ palette }) {
  const W = 1280;
  const SIDE = 200;

  const nav = [
    { sec: 'YOU', items: [
      { l: 'Sign in', accent: true },
      { l: 'Watchlist' },
      { l: 'Saved stories' },
    ]},
    { sec: 'EXPLORE', items: [
      { l: 'Front page', active: true },
      { l: 'Company search' },
      { l: 'Supply chain network' },
      { l: 'History' },
      { l: 'Learn',       dividerAbove: true },
      { l: 'Read memoir', accent: true },
    ]},
  ];

  return (
    <div style={{ width: W, background: WF_PAPER, fontFamily: 'var(--wf-body)', color: WF_INK, display: 'grid', gridTemplateColumns: `${SIDE}px 1fr`, minHeight: 980 }}>
      {/* SIDEBAR */}
      <div style={{ background: palette.tint, borderRight: `1.6px solid ${WF_INK}`, padding: '20px 14px', display: 'flex', flexDirection: 'column' }}>
        {/* logo block */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--wf-serif)', fontStyle: 'italic', fontWeight: 700, fontSize: 22, color: palette.accent, lineHeight: 1 }}>Veridian</div>
          <div style={{ fontFamily: 'var(--wf-display)', fontSize: 26, color: WF_INK, lineHeight: 1, marginTop: -2 }}>Memoir</div>
          <Mono size={9} color={WF_INK_FAINT} style={{ display: 'block', marginTop: 6 }}>history-led finance</Mono>
        </div>

        {/* search */}
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
                  marginLeft: -4,
                  marginRight: -4,
                  marginBottom: 1,
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
        {/* Top strip — indices + greeting */}
        <div style={{ padding: '14px 22px', borderBottom: `1.4px solid ${WF_INK}`, display: 'flex', alignItems: 'center', gap: 14 }}>
          <Scribble size={20} weight={700}>Good morning.</Scribble>
          <Scribble size={16} color={WF_INK_SOFT}>Three things on the tape — and one from 1973.</Scribble>
          <div style={{ flex: 1 }} />
          <Mono size={10} color={WF_INK_FAINT}>14:32 UTC · LIVE ●</Mono>
        </div>
        <IndexStrip palette={palette} items={[
          { sym: 'S&P 500',  val: '5,247.10', chg: '+0.42%', dir: 'up' },
          { sym: 'NASDAQ',   val: '16,542',   chg: '+0.71%', dir: 'up' },
          { sym: 'DOW',      val: '38,991',   chg: '-0.18%', dir: 'down' },
          { sym: 'GOLD',     val: '2,341',    chg: '+0.88%', dir: 'up' },
          { sym: 'OIL',      val: '$78.14',   chg: '+1.40%', dir: 'up' },
          { sym: '10Y UST',  val: '4.21%',    chg: '-0.03',  dir: 'down' },
          { sym: 'EUR/USD',  val: '1.0842',   chg: '-0.09%', dir: 'down' },
          { sym: 'BTC',      val: '69,420',   chg: '-2.31%', dir: 'down' },
        ]} />

        {/* Two-column: lead story + modules */}
        <div style={{ padding: '22px', display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 22 }}>
          <div>
            <Mono size={11} color={palette.accent} weight={700}>LEAD · 5-YEAR LENS</Mono>
            <Scribble size={42} weight={700} style={{ display: 'block', marginTop: 6, lineHeight: 1.0 }}>
              Oil at $83 — and an echo from 1973 we'd rather not hear.
            </Scribble>
            <Scribble size={18} color={WF_INK_SOFT} style={{ display: 'block', marginTop: 8, lineHeight: 1.25 }}>
              Two charts, one pattern, and the three things that didn't happen back then but might this time.
            </Scribble>
            <div style={{ marginTop: 14 }}>
              <ChartPlaceholder width={660} height={320} accent={palette.accent} label="Brent · 1973 overlay" overlayHistory />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 16, alignItems: 'center' }}>
              <Mono size={10} color={WF_INK_FAINT}>Veridian AI · 6 min · 4 sources</Mono>
              <div style={{ flex: 1 }} />
              <Scribble size={15} color={palette.accent}>Open story →</Scribble>
            </div>

            {/* FIND A COMPANY + TOP 10 \u2014 unified teal panel. The screener entry
                point and the by-marketcap list visually belong together. */}
            <SketchBox style={{ marginTop: 26, padding: 18, background: palette.tint }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
                <Mono size={10} color={palette.accent} weight={700}>EXPLORE · 4,904 PUBLIC COMPANIES</Mono>
                <div style={{ flex: 1 }} />
                <Scribble size={13} color={palette.accent}>Open full screener →</Scribble>
              </div>
              <Scribble size={28} weight={700} style={{ display: 'block', lineHeight: 1.0, marginTop: 4 }}>Find a company.</Scribble>
              <Scribble size={14} color={WF_INK_SOFT} style={{ display: 'block', marginTop: 4, lineHeight: 1.3 }}>
                Search by ticker, name, person, or 5-year historical analogue.
              </Scribble>

              {/* Search + filter bar */}
              <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 160px 48px 48px', gap: 8, alignItems: 'center' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 14px',
                  background: WF_PAPER,
                  border: `1.5px solid ${WF_INK}`,
                  borderRadius: 24,
                }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={WF_INK} strokeWidth={1.8} strokeLinecap="round">
                    <circle cx="11" cy="11" r="7" />
                    <line x1="21" y1="21" x2="16.5" y2="16.5" />
                  </svg>
                  <Scribble size={14} color={WF_INK_FAINT}>search ticker, company, person, era</Scribble>
                  <div style={{ flex: 1 }} />
                  <Mono size={9} color={WF_INK_FAINT} weight={700}>⌘ K</Mono>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 12px', background: WF_PAPER, border: `1.5px solid ${WF_INK}`, borderRadius: 24 }}>
                  <Scribble size={13} weight={600}>Filter</Scribble>
                  <div style={{ flex: 1 }} />
                  <Mono size={10} weight={700}>▾</Mono>
                </div>
                <div style={{ width: 48, height: 40, background: WF_PAPER, border: `1.5px solid ${WF_INK}`, borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mono size={12} weight={700}>A↕</Mono>
                </div>
                <div style={{ width: 48, height: 40, background: WF_PAPER, border: `1.5px solid ${WF_INK}`, borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={WF_INK} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="11" width="14" height="10" rx="2" />
                    <path d="M8 11V7a4 4 0 1 1 8 0v4" />
                  </svg>
                </div>
              </div>

              {/* TOP 10 list \u2014 inside the same teal panel */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 20, marginBottom: 10 }}>
                <Mono size={11} color={palette.accent} weight={700}>TOP 10 · US COMPANIES BY MARKET CAP</Mono>
                <div style={{ flex: 1, borderBottom: `1.2px dashed ${WF_INK_FAINT}`, marginBottom: 5 }}></div>
                <Scribble size={13} color={palette.accent}>See all 4,904 →</Scribble>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  ['AAPL',  'Apple Inc.',          'Tech \u00b7 Consumer',    '$308.82', '+1.26%', '$4.54T', 'up',   true ],
                  ['MSFT',  'Microsoft Corp.',     'Tech \u00b7 Software',    '$427.15', '+0.84%', '$3.17T', 'up',   false],
                  ['NVDA',  'NVIDIA Corp.',        'Tech \u00b7 Semis',       '$945.10', '+3.40%', '$2.32T', 'up',   false],
                  ['GOOGL', 'Alphabet Inc.',       'Tech \u00b7 Ads',         '$172.04', '-0.42%', '$2.13T', 'down', false],
                  ['AMZN',  'Amazon.com',          'Retail \u00b7 Cloud',     '$185.30', '+0.91%', '$1.93T', 'up',   false],
                  ['META',  'Meta Platforms',      'Tech \u00b7 Social',      '$498.22', '+1.87%', '$1.27T', 'up',   false],
                  ['BRK.B', 'Berkshire Hathaway',  'Conglomerate',            '$418.92', '+0.31%', '$903B',  'up',   false],
                  ['LLY',   'Eli Lilly',           'Pharma',                  '$762.40', '+0.56%', '$724B',  'up',   false],
                  ['AVGO',  'Broadcom',            'Tech \u00b7 Semis',       '$1342.0', '+2.10%', '$623B',  'up',   false],
                  ['JPM',   'JPMorgan Chase',      'Finance \u00b7 Banking',  '$215.40', '+0.18%', '$615B',  'up',   false],
                ].map(([sym, name, sec, price, chg, mcap, d, watching], i) => (
                  <div key={sym} style={{
                    display: 'grid',
                    gridTemplateColumns: '22px 1fr 100px 70px 56px 60px 116px',
                    gap: 10,
                    padding: '8px 14px',
                    background: WF_PAPER,
                    border: `1.4px solid ${WF_INK}`,
                    borderRadius: 5,
                    alignItems: 'center',
                    boxShadow: '1.5px 1.5px 0 rgba(31,29,26,0.06)',
                  }}>
                    <Mono size={10} color={WF_INK_FAINT} weight={700}>{String(i+1).padStart(2,'0')}</Mono>
                    <div>
                      <Scribble size={17} weight={700} style={{ lineHeight: 1 }}>{sym}</Scribble>
                      <div><Mono size={9} color={WF_INK_SOFT} style={{ display: 'block', marginTop: 2 }}>{name}</Mono></div>
                    </div>
                    <Mono size={10} color={palette.accent} weight={600}>{sec}</Mono>
                    <Mono size={12} weight={600} style={{ textAlign: 'right' }}>{price}</Mono>
                    <Mono size={11} weight={700} color={d === 'up' ? '#4a7c59' : '#b35a3a'} style={{ textAlign: 'right' }}>{chg}</Mono>
                    <Sparkline width={56} height={18} trend={d} color={d === 'up' ? '#4a7c59' : '#b35a3a'} strokeWidth={1.3} />
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      <IconButton icon={IconWatch} palette={palette} active={watching} title="Watch" size={26} />
                      <IconButton icon={IconChain} palette={palette} title="Supply chain" size={26} />
                      <IconButton icon={IconOpen}  palette={palette} title="Open dashboard" size={26} />
                    </div>
                  </div>
                ))}
              </div>
            </SketchBox>
          </div>

          {/* Right modules */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SketchBox style={{ padding: 14 }}>
              <SectionHead num="A">Market recap</SectionHead>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {[
                  ['Forex',       '+0.12%', 'up'],
                  ['Bonds',       '-0.08%', 'down'],
                  ['Commodities', '+0.94%', 'up'],
                  ['Stocks',      '+0.41%', 'up'],
                  ['Crypto',      '-2.31%', 'down'],
                  ['Funds',       '+0.27%', 'up'],
                ].map(([n, c, d]) => (
                  <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', borderBottom: `1px dashed ${WF_INK_FAINT}` }}>
                    <Scribble size={14}>{n}</Scribble>
                    <div style={{ flex: 1 }} />
                    <Sparkline width={42} height={13} trend={d} color={d === 'up' ? '#4a7c59' : '#b35a3a'} strokeWidth={1.1} />
                    <Mono size={10} weight={600} color={d === 'up' ? '#4a7c59' : '#b35a3a'}>{c}</Mono>
                  </div>
                ))}
              </div>
            </SketchBox>

            <SketchBox style={{ padding: 14 }}>
              <SectionHead num="B">Watchlist · placeholder</SectionHead>
              <Scribble size={13} color={WF_INK_SOFT} style={{ display: 'block', marginBottom: 8 }}>Sign in to track tickers. Or browse:</Scribble>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  ['AAPL', '308.82', '+1.26%', 'up'],
                  ['NVDA', '945.10', '+3.40%', 'up'],
                  ['TSLA', '182.04', '-2.14%', 'down'],
                  ['MSFT', '427.15', '+0.84%', 'up'],
                ].map(([s, p, c, d]) => (
                  <div key={s} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 28px 50px', gap: 4, alignItems: 'center' }}>
                    <Mono size={10} weight={700}>{s}</Mono>
                    <Mono size={10} color={WF_INK_SOFT}>{p}</Mono>
                    <Sparkline width={24} height={11} trend={d} color={d === 'up' ? '#4a7c59' : '#b35a3a'} strokeWidth={1.1} />
                    <Mono size={10} weight={600} color={d === 'up' ? '#4a7c59' : '#b35a3a'}>{c}</Mono>
                  </div>
                ))}
              </div>
            </SketchBox>

            <SketchBox style={{ padding: 14 }}>
              <SectionHead num="C">Mini calendar</SectionHead>
              {/* mini month grid */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Mono size={10}>‹</Mono>
                <Mono size={11} weight={700}>May 2026</Mono>
                <div style={{ flex: 1 }} />
                <Mono size={10}>›</Mono>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 6 }}>
                {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <Mono key={d} size={9} color={WF_INK_FAINT} weight={700} style={{ textAlign: 'center' }}>{d}</Mono>)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                {Array.from({ length: 35 }).map((_, i) => {
                  const d = i - 4;
                  const today = d === 14;
                  const hasEvent = [3, 7, 12, 14, 21, 28].includes(d);
                  return (
                    <div key={i} style={{
                      aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: today ? palette.accent : 'transparent',
                      color: today ? WF_PAPER : d < 1 || d > 31 ? WF_INK_FAINT : WF_INK,
                      border: hasEvent && !today ? `1.2px solid ${palette.accent2}` : '1.2px solid transparent',
                      borderRadius: 2,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                      fontWeight: today ? 700 : 500,
                    }}>{d >= 1 && d <= 31 ? d : ''}</div>
                  );
                })}
              </div>
              <div style={{ marginTop: 8, paddingTop: 6, borderTop: `1px dashed ${WF_INK_FAINT}` }}>
                <Mono size={9} color={WF_INK_FAINT} weight={700} style={{ display: 'block', marginBottom: 3 }}>TODAY</Mono>
                <Scribble size={13}>14:00 · FOMC minutes</Scribble>
                <br/>
                <Scribble size={13}>15:30 · US jobless claims</Scribble>
              </div>
            </SketchBox>

            <SketchBox style={{ padding: 14, background: palette.tint }}>
              <Scribble size={16} weight={700} style={{ display: 'block', marginBottom: 4 }}>From the memoir</Scribble>
              <Scribble size={14} color={WF_INK_SOFT} style={{ display: 'block', lineHeight: 1.2 }}>
                "Big finance has the resources. You deserve them too."
              </Scribble>
              <div style={{ marginTop: 8, textAlign: 'right' }}>
                <Scribble size={13} color={palette.accent}>Read →</Scribble>
              </div>
            </SketchBox>
          </div>
        </div>
      </div>
    </div>
  );
}

window.V5_Sidebar = V5_Sidebar;
