// Wireframe primitives — sketchy boxes, sparklines, type, color palettes
// All deliberately low-fi: hand-drawn borders, handwritten labels, hatched
// placeholders. Data is mocked.

const WF_INK = '#1f1d1a';
const WF_INK_SOFT = '#4a4640';
const WF_INK_FAINT = '#8a857d';
const WF_PAPER = '#fbf9f3';

// Palette options for tweak / color exploration
const WF_PALETTES = {
  teal:   { name: 'Deep Teal',   accent: '#2d5e5a', accent2: '#c46a3b', up: '#4a7c59', down: '#b35a3a', tint: '#e6efed' },
  ink:    { name: 'Ink + Cream', accent: '#1f1d1a', accent2: '#b48a3a', up: '#4a6a3a', down: '#a14a36', tint: '#ece8df' },
  forest: { name: 'Forest+Rust', accent: '#3a5a3a', accent2: '#a8512a', up: '#3a5a3a', down: '#a8512a', tint: '#e9ecdf' },
};

// Inject default CSS vars for the font system. Tweaks override these by
// setting --wf-display / --wf-serif / --wf-mono on the root wrapper.
if (typeof document !== 'undefined' && !document.getElementById('wf-font-vars')) {
  const s = document.createElement('style');
  s.id = 'wf-font-vars';
  s.textContent = [
    ':root{',
    '  --wf-display: "Times New Roman", Times, serif;',  // headline + label text (was handwritten)
    '  --wf-body:    "Times New Roman", Times, serif;',  // running prose
    '  --wf-serif:   "Times New Roman", Times, serif;',  // editorial italics in V4 etc.
    '  --wf-mono:    "JetBrains Mono", "Menlo", monospace;',  // numerics stay mono by default
    '  --wf-display-tracking: 0;',  // letter-spacing nudge (TNR likes 0; handwritten likes -0.01em)
    '}',
  ].join('');
  document.head.appendChild(s);
}

// SketchBox — boxy container that looks pen-drawn. Slight rotation for charm
// (parameterized so different elements don't all tilt the same way).
function SketchBox({ children, style = {}, className = '', tilt = 0, fill = WF_PAPER, stroke = WF_INK, strokeWidth = 1.6, dashed = false, ...rest }) {
  const borderStyle = dashed ? 'dashed' : 'solid';
  return (
    <div
      className={'wf-box ' + className}
      style={{
        position: 'relative',
        background: fill,
        border: `${strokeWidth}px ${borderStyle} ${stroke}`,
        borderRadius: 3,
        transform: tilt ? `rotate(${tilt}deg)` : undefined,
        boxShadow: '2px 2px 0 rgba(31,29,26,0.08)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

// Display label — was handwritten, now driven by --wf-display so the tweak
// can swap to TNR, Caveat, Helvetica, etc. The line-height also adapts: TNR
// reads cleaner at 1.15 than the 1.1 we used for the handwritten font.
function Scribble({ children, size = 14, weight = 500, color = WF_INK, style = {}, ...rest }) {
  return (
    <span style={{
      fontFamily: 'var(--wf-display)',
      fontSize: size,
      fontWeight: weight,
      color,
      lineHeight: 1.15,
      letterSpacing: 'var(--wf-display-tracking)',
      ...style,
    }} {...rest}>{children}</span>
  );
}

// Mono label (for data — ticker symbols, percentages)
function Mono({ children, size = 12, weight = 500, color = WF_INK, style = {}, ...rest }) {
  return (
    <span style={{
      fontFamily: 'var(--wf-mono)',
      fontSize: size,
      fontWeight: weight,
      color,
      ...style,
    }} {...rest}>{children}</span>
  );
}

// Wireframe annotation — floating note pointing at a region
function Annot({ children, style = {}, color = '#b35a3a' }) {
  return (
    <div style={{
      fontFamily: 'var(--wf-display)',
      fontStyle: 'italic',
      fontSize: 15,
      color,
      lineHeight: 1.15,
      ...style,
    }}>{children}</div>
  );
}

// Hatched / striped placeholder — represents an image/chart not yet drawn.
function Hatched({ width, height, label, dense = false, style = {}, color = WF_INK_FAINT }) {
  const spacing = dense ? 6 : 10;
  return (
    <div style={{
      width, height,
      backgroundImage: `repeating-linear-gradient(45deg, transparent 0 ${spacing-1.5}px, ${color} ${spacing-1.5}px ${spacing}px)`,
      border: `1.4px solid ${WF_INK}`,
      borderRadius: 2,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: WF_INK,
      fontFamily: 'var(--wf-display)',
      fontStyle: 'italic',
      fontSize: 14,
      position: 'relative',
      ...style,
    }}>
      {label && (
        <span style={{
          background: WF_PAPER,
          padding: '2px 8px',
          border: '1.2px solid ' + WF_INK,
          borderRadius: 2,
        }}>{label}</span>
      )}
    </div>
  );
}

// Sparkline — tiny SVG line chart. trend = 'up' | 'down' | 'flat' | 'volatile'
function Sparkline({ width = 80, height = 24, trend = 'up', color = WF_INK, strokeWidth = 1.5, fill = false }) {
  const points = React.useMemo(() => {
    const n = 24;
    const pts = [];
    let y = 0.5;
    for (let i = 0; i < n; i++) {
      let delta = (Math.sin(i * 0.7 + (trend.charCodeAt(0) * 0.13)) * 0.08) + (Math.random() - 0.5) * 0.08;
      if (trend === 'up') delta += 0.03;
      else if (trend === 'down') delta -= 0.03;
      else if (trend === 'volatile') delta += (Math.random() - 0.5) * 0.2;
      y = Math.max(0.08, Math.min(0.92, y + delta));
      pts.push([i / (n - 1), y]);
    }
    return pts;
  }, [trend, width, height]);

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0] * width} ${p[1] * height}`).join(' ');
  const fillPath = fill ? `${path} L ${width} ${height} L 0 ${height} Z` : null;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      {fill && <path d={fillPath} fill={color} fillOpacity={0.12} />}
      <path d={path} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Bigger chart placeholder — with axes scribbles and a sparkline-ish curve
function ChartPlaceholder({ width, height, label = 'CHART · 5Y comparison', accent = WF_INK, showAxes = true, overlayHistory = false }) {
  const pad = 24;
  const w = width - pad * 2;
  const h = height - pad * 2;

  // Two lines: NOW (solid) and THEN (dashed, history)
  const mkLine = (seed, drift) => {
    const n = 50;
    const out = [];
    let y = 0.5 + (Math.sin(seed) * 0.1);
    for (let i = 0; i < n; i++) {
      y += (Math.sin(i * 0.3 + seed) * 0.04) + (Math.random() - 0.5) * 0.04 + drift;
      y = Math.max(0.12, Math.min(0.88, y));
      out.push([pad + (i / (n-1)) * w, pad + y * h]);
    }
    return out;
  };
  const now = mkLine(1.2, 0.005);
  const then = overlayHistory ? mkLine(4.7, -0.003) : null;
  const toPath = pts => pts.map((p, i) => `${i ? 'L' : 'M'} ${p[0]} ${p[1]}`).join(' ');

  return (
    <div style={{ position: 'relative', width, height, background: WF_PAPER, border: `1.6px solid ${WF_INK}`, borderRadius: 3 }}>
      <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
        {showAxes && (
          <>
            <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke={WF_INK} strokeWidth={1.2} />
            <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke={WF_INK} strokeWidth={1.2} />
            {/* gridlines */}
            {[0.25, 0.5, 0.75].map(g => (
              <line key={g} x1={pad} y1={pad + g * h} x2={width - pad} y2={pad + g * h} stroke={WF_INK_FAINT} strokeWidth={0.6} strokeDasharray="2 4" />
            ))}
          </>
        )}
        {then && <path d={toPath(then)} fill="none" stroke={accent} strokeWidth={1.4} strokeDasharray="5 4" opacity={0.65} />}
        <path d={toPath(now)} fill="none" stroke={accent} strokeWidth={2} />
      </svg>
      <div style={{ position: 'absolute', top: 8, left: 12, fontFamily: 'var(--wf-display)', fontStyle: 'italic', fontSize: 14, color: WF_INK }}>{label}</div>
      {overlayHistory && (
        <div style={{ position: 'absolute', top: 8, right: 12, fontFamily: 'var(--wf-display)', fontSize: 13, color: WF_INK_SOFT, display: 'flex', gap: 12 }}>
          <span><span style={{ display: 'inline-block', width: 16, borderTop: `2px solid ${accent}`, verticalAlign: 'middle', marginRight: 4 }}></span>NOW</span>
          <span><span style={{ display: 'inline-block', width: 16, borderTop: `2px dashed ${accent}`, verticalAlign: 'middle', marginRight: 4 }}></span>THEN (1973)</span>
        </div>
      )}
    </div>
  );
}

// Ticker pill — used in the index strip
function TickerPill({ symbol, value, change, dir = 'up', accent }) {
  const color = dir === 'up' ? '#4a7c59' : dir === 'down' ? '#b35a3a' : WF_INK_SOFT;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 12px',
      borderRight: `1px dashed ${WF_INK_FAINT}`,
      minWidth: 0,
    }}>
      <Mono size={11} weight={700}>{symbol}</Mono>
      <Mono size={11} color={WF_INK_SOFT}>{value}</Mono>
      <Sparkline width={36} height={14} trend={dir} color={color} strokeWidth={1.2} />
      <Mono size={10} color={color} weight={600}>{change}</Mono>
    </div>
  );
}

// Top nav — the "menu up top" the user mentioned. Variations differ in shape.
function TopNav({ palette, variant = 'pill', activeItem = 'Dashboard' }) {
  const items = ['How To', 'Markets', 'Companies', 'Memoir', 'Calendar'];
  const wrap = {
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '14px 22px',
    borderBottom: `1.6px solid ${WF_INK}`,
    background: WF_PAPER,
  };
  return (
    <div style={wrap}>
      {/* logo */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginRight: 18 }}>
        <span style={{ fontFamily: 'var(--wf-serif)', fontStyle: 'italic', fontWeight: 700, fontSize: 22, color: palette.accent, letterSpacing: -0.3 }}>Veridian</span>
        <span style={{ fontFamily: 'var(--wf-display)', fontSize: 22, color: WF_INK, marginLeft: -2 }}>Memoir</span>
      </div>
      {items.map(it => {
        const active = it === activeItem;
        if (variant === 'pill') return (
          <div key={it} style={{
            padding: '6px 14px',
            border: `1.4px solid ${WF_INK}`,
            borderRadius: 18,
            background: active ? palette.accent : 'transparent',
            color: active ? WF_PAPER : WF_INK,
            fontFamily: 'var(--wf-display)',
            fontSize: 14,
            fontWeight: 600,
          }}>{it}</div>
        );
        if (variant === 'underline') return (
          <div key={it} style={{
            padding: '4px 4px 8px',
            borderBottom: active ? `2.5px solid ${palette.accent}` : '2.5px solid transparent',
            fontFamily: 'var(--wf-display)',
            fontSize: 14,
            fontWeight: active ? 700 : 500,
            color: WF_INK,
          }}>{it}</div>
        );
        // 'bracket'
        return (
          <div key={it} style={{
            padding: '4px 8px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            fontWeight: active ? 700 : 500,
            color: active ? palette.accent : WF_INK_SOFT,
          }}>
            {active ? `[ ${it} ]` : it}
          </div>
        );
      })}
      <div style={{ flex: 1 }} />
      {/* search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', border: `1.4px dashed ${WF_INK_FAINT}`, borderRadius: 14, minWidth: 180 }}>
        <Mono size={11} color={WF_INK_FAINT}>⌕  search · ticker · person</Mono>
      </div>
      <Scribble size={16} color={WF_INK}>Sign in</Scribble>
    </div>
  );
}

// Index ticker strip — the recap of indices
function IndexStrip({ palette, items }) {
  const list = items || [
    { sym: 'S&P 500',  val: '5,247.10', chg: '+0.42%', dir: 'up' },
    { sym: 'NASDAQ',   val: '16,542',   chg: '+0.71%', dir: 'up' },
    { sym: 'DOW',      val: '38,991',   chg: '-0.18%', dir: 'down' },
    { sym: 'FTSE 100', val: '8,011',    chg: '+0.05%', dir: 'up' },
    { sym: 'NIKKEI',   val: '40,168',   chg: '-1.12%', dir: 'down' },
    { sym: 'GOLD',     val: '2,341',    chg: '+0.88%', dir: 'up' },
    { sym: 'OIL',      val: '$78.14',   chg: '+1.40%', dir: 'up' },
    { sym: 'BTC',      val: '69,420',   chg: '-2.31%', dir: 'down' },
    { sym: 'EUR/USD',  val: '1.0842',   chg: '-0.09%', dir: 'down' },
  ];
  return (
    <div style={{
      display: 'flex', overflow: 'hidden',
      borderBottom: `1.4px solid ${WF_INK}`,
      background: palette.tint,
    }}>
      {list.map((t, i) => <TickerPill key={i} {...{ symbol: t.sym, value: t.val, change: t.chg, dir: t.dir, accent: palette.accent }} />)}
    </div>
  );
}

// Article card placeholder
function ArticleCard({ width, height, kind = 'feature', title, kicker, source = 'AI · 5Y Lens', accent = WF_INK }) {
  if (kind === 'feature') return (
    <SketchBox style={{ width, height, display: 'flex', flexDirection: 'column' }}>
      <Hatched width="100%" height={height * 0.55} label="hero image" style={{ borderRadius: 0, borderWidth: 0, borderBottom: `1.4px solid ${WF_INK}` }} />
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <Mono size={10} color={accent} weight={700}>{kicker || '5-YEAR LENS · OIL'}</Mono>
        <Scribble size={26} weight={700} style={{ lineHeight: 1.05 }}>{title || 'What 1973 tells us about 2026 oil shocks'}</Scribble>
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Mono size={10} color={WF_INK_FAINT}>{source} · 6 min read</Mono>
          <Mono size={10} color={WF_INK_FAINT}>2h ago</Mono>
        </div>
      </div>
    </SketchBox>
  );
  // small
  return (
    <SketchBox style={{ width, height, display: 'flex', flexDirection: 'column' }}>
      <Hatched width="100%" height={height * 0.45} dense style={{ borderRadius: 0, borderWidth: 0, borderBottom: `1.2px solid ${WF_INK}` }} />
      <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        <Mono size={9} color={accent} weight={700}>{kicker || 'MACRO · FED'}</Mono>
        <Scribble size={16} weight={600} style={{ lineHeight: 1.1 }}>{title || 'Rates path & the 2018 echo'}</Scribble>
        <Mono size={9} color={WF_INK_FAINT} style={{ marginTop: 'auto' }}>{source}</Mono>
      </div>
    </SketchBox>
  );
}

// Section heading — used inside artboards
function SectionHead({ children, num, style = {} }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10, ...style }}>
      {num && <Mono size={11} color={WF_INK_FAINT} weight={700}>{num}</Mono>}
      <Scribble size={20} weight={700}>{children}</Scribble>
      <div style={{ flex: 1, borderBottom: `1.2px dashed ${WF_INK_FAINT}`, marginBottom: 4 }}></div>
    </div>
  );
}

// Small inline action icons — used in the screener row + news rows.
function IconWatch({ size = 18, color = WF_INK, active }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z" fill={active ? color : 'none'} fillOpacity={active ? 0.15 : 0} />
      <circle cx="12" cy="12" r="3" fill={active ? color : WF_PAPER} />
    </svg>
  );
}

function IconChain({ size = 18, color = WF_INK }) {
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

// IconButton — small square button around an icon
function IconButton({ icon: Icon, palette, active, size = 30, title }) {
  return (
    <div title={title} style={{
      width: size, height: size,
      border: `1.4px solid ${WF_INK}`,
      borderRadius: 4,
      background: active ? palette.accent : WF_PAPER,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <Icon color={active ? WF_PAPER : WF_INK} active={active} size={size * 0.55} />
    </div>
  );
}

// Annotation pin — used to call out wireframe notes
function Pin({ children, color = '#b35a3a', side = 'right', style = {} }) {
  return (
    <div style={{
      position: 'absolute',
      display: 'flex', alignItems: 'flex-start', gap: 6,
      fontFamily: 'var(--wf-display)',
      fontStyle: 'italic',
      fontSize: 14,
      color,
      lineHeight: 1.15,
      ...style,
    }}>
      <span style={{ flexShrink: 0, fontSize: 18, lineHeight: 1 }}>{side === 'left' ? '←' : side === 'top' ? '↑' : '→'}</span>
      <span>{children}</span>
    </div>
  );
}

// Export to window so other babel scripts can use these
Object.assign(window, {
  WF_INK, WF_INK_SOFT, WF_INK_FAINT, WF_PAPER, WF_PALETTES,
  SketchBox, Scribble, Mono, Annot, Hatched, Sparkline, ChartPlaceholder,
  IconWatch, IconChain, IconOpen, IconButton,
  TickerPill, TopNav, IndexStrip, ArticleCard, SectionHead, Pin,
});
