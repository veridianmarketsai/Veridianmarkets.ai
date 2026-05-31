// Veridian Markets — My Portfolio Page.
// Gated (signed-in only). A customisable widget dashboard: connect broker
// accounts (Trading 212 + others), then KPIs, a performance chart, allocation
// donut, holdings, watchlist and analogue alerts. Widgets can be shown/hidden,
// reordered and resized in "Customise" mode; the layout + connections persist to
// localStorage. All numbers are mock scaffold data — wire to broker APIs later.
const { useState: useStateMP, useEffect: useEffectMP, useRef: useRefMP, useMemo: useMemoMP } = React;

// ── helpers ──────────────────────────────────────────────────────────────
const num = (s) => parseFloat(String(s).replace(/[^0-9.\-]/g, '')) || 0;
const pctNum = (s) => parseFloat(String(s).replace(/[^0-9.\-]/g, '')) || 0;
const money = (n, dec = 0) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
const signPct = (n) => (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
// Deterministic random walk in [0,1].
function walk(seed, n, drift = 0) {
  const out = []; let y = 0.5;
  for (let i = 0; i < n; i++) { y += Math.sin(i * 0.6 + seed) * 0.06 + (((seed * 9301 + i * 49297) % 233280) / 233280 - 0.5) * 0.07 + drift; y = Math.max(0.06, Math.min(0.94, y)); out.push(y); }
  return out;
}
function linePath(vals, w, h, pad = 4) {
  const mn = Math.min(...vals), mx = Math.max(...vals), rng = (mx - mn) || 1;
  return vals.map((v, i) => `${i ? 'L' : 'M'} ${(i / (vals.length - 1)) * w} ${pad + (1 - (v - mn) / rng) * (h - pad * 2)}`).join(' ');
}

// ── mock data ────────────────────────────────────────────────────────────
const PF_HOLDINGS_RAW = [
  { ticker: 'AAPL', shares: 120, avg: 181.40 }, { ticker: 'MSFT', shares: 60, avg: 301.20 },
  { ticker: 'NVDA', shares: 25, avg: 512.00 }, { ticker: 'AMZN', shares: 80, avg: 139.10 },
  { ticker: 'GOOGL', shares: 90, avg: 131.80 }, { ticker: 'JPM', shares: 70, avg: 184.50 },
  { ticker: 'V', shares: 40, avg: 232.00 },
];
const PF_CASH = 18450;
const PF_WATCH = ['NVDA', 'META', 'TSLA', 'AVGO', 'BRK.B'];

// Broker / account connectors. Trading 212 is featured first.
const PF_BROKERS = [
  { id: 't212', name: 'Trading 212', icon: 'trending-up', color: '#1E5BD6', featured: true },
  { id: 'ibkr', name: 'Interactive Brokers', icon: 'building-bank', color: '#A8512A' },
  { id: 'rh', name: 'Robinhood', icon: 'feather', color: '#1D9E75' },
  { id: 'cb', name: 'Coinbase', icon: 'currency-bitcoin', color: '#185FA5' },
  { id: 'vg', name: 'Vanguard', icon: 'shield-half', color: '#7A1F2B' },
  { id: 'bin', name: 'Binance', icon: 'coin', color: '#C49A3B' },
];
const SECTOR_COLORS = ['#1D4E3A', '#C46A3B', '#2D5E5A', '#185FA5', '#B35A3A', '#8A857D', '#7A1F2B', '#B6AFA2'];

// ── widget layout config + persistence ───────────────────────────────────
const PF_WIDGETS = [
  { id: 'summary', label: 'Summary', span: 2 },
  { id: 'performance', label: 'Performance', span: 2 },
  { id: 'allocation', label: 'Allocation', span: 1 },
  { id: 'watchlist', label: 'Watchlist', span: 1 },
  { id: 'holdings', label: 'Holdings', span: 2 },
  { id: 'analogues', label: 'Analogue alerts', span: 2 },
];
const PF_LAYOUT_KEY = 'vm_pf_layout', PF_BROKERS_KEY = 'vm_pf_brokers';
function defaultLayout() {
  return { order: PF_WIDGETS.map(w => w.id), cfg: Object.fromEntries(PF_WIDGETS.map(w => [w.id, { visible: true, span: w.span }])) };
}
function loadLayout() {
  const d = defaultLayout();
  try {
    const s = JSON.parse(localStorage.getItem(PF_LAYOUT_KEY));
    if (s && s.order && s.cfg) {
      const order = [...s.order.filter(id => d.cfg[id]), ...d.order.filter(id => !s.order.includes(id))];
      const cfg = {}; d.order.forEach(id => { cfg[id] = s.cfg[id] ? { ...d.cfg[id], ...s.cfg[id] } : d.cfg[id]; });
      return { order, cfg };
    }
  } catch {}
  return d;
}

function MyPortfolio({ go, user, isMobile }) {
  const [layout, setLayout] = useStateMP(loadLayout);
  const [editing, setEditing] = useStateMP(false);
  const [connected, setConnected] = useStateMP(() => { try { return new Set(JSON.parse(localStorage.getItem(PF_BROKERS_KEY)) || []); } catch { return new Set(); } });

  useEffectMP(() => { try { localStorage.setItem(PF_LAYOUT_KEY, JSON.stringify(layout)); } catch {} }, [layout]);
  useEffectMP(() => { try { localStorage.setItem(PF_BROKERS_KEY, JSON.stringify([...connected])); } catch {} }, [connected]);

  // Derived portfolio maths.
  const pf = useMemoMP(() => {
    const rows = PF_HOLDINGS_RAW.map(h => {
      const c = VM_COMPANIES.find(x => x.ticker === h.ticker) || {};
      const price = num(c.price), value = price * h.shares, cost = h.avg * h.shares;
      const dayPct = pctNum(c.chg);
      return { ...h, name: c.name, sector: c.sector || '—', dir: c.dir, price, value, cost,
        pl: value - cost, plPct: ((value - cost) / cost) * 100, dayPct, dayChg: value * dayPct / 100 };
    });
    const invested = rows.reduce((s, r) => s + r.value, 0);
    const total = invested + PF_CASH;
    rows.forEach(r => { r.weight = (r.value / invested) * 100; });
    const dayChg = rows.reduce((s, r) => s + r.dayChg, 0);
    const totalCost = rows.reduce((s, r) => s + r.cost, 0);
    const totalPL = invested - totalCost;
    // allocation by sector head word
    const alloc = {};
    rows.forEach(r => { const k = r.sector.split('·')[0].trim(); alloc[k] = (alloc[k] || 0) + r.value; });
    const allocArr = Object.entries(alloc).map(([k, v], i) => ({ label: k, value: v, pct: v / invested * 100, color: SECTOR_COLORS[i % SECTOR_COLORS.length] }))
      .concat([{ label: 'Cash', value: PF_CASH, pct: PF_CASH / total * 100, color: VM.faint }]).sort((a, b) => b.value - a.value);
    return { rows, invested, total, dayChg, dayPct: dayChg / invested * 100, totalPL, totalPLPct: totalPL / totalCost * 100, alloc: allocArr };
  }, []);

  const setVisible = (id, v) => setLayout(L => ({ ...L, cfg: { ...L.cfg, [id]: { ...L.cfg[id], visible: v } } }));
  const setSpan = (id, s) => setLayout(L => ({ ...L, cfg: { ...L.cfg, [id]: { ...L.cfg[id], span: s } } }));
  const move = (id, dir) => setLayout(L => {
    const order = [...L.order]; const i = order.indexOf(id); const j = i + dir;
    if (j < 0 || j >= order.length) return L; [order[i], order[j]] = [order[j], order[i]]; return { ...L, order };
  });
  const reset = () => setLayout(defaultLayout());
  const toggleBroker = (id) => setConnected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const visibleIds = layout.order.filter(id => layout.cfg[id].visible);
  const cols = isMobile ? 1 : 2;

  return (
    <div style={{ padding: isMobile ? '16px 16px 64px' : '26px 32px 72px', maxWidth: 1180, margin: '0 auto' }}>
      {/* header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <Kicker>Your account · Portfolio</Kicker>
          <h1 style={{ fontFamily: VM.serif, fontWeight: 700, fontSize: isMobile ? 27 : 32, lineHeight: 1.05, margin: '8px 0 0' }}>My portfolio.</h1>
          {user && <div style={{ fontFamily: VM.serif, fontSize: 14, color: VM.ink3, marginTop: 4 }}>Signed in as <strong style={{ color: VM.ink2 }}>{user.name || user.email}</strong></div>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {editing && <Btn onClick={reset} style={{ fontSize: 13, padding: '7px 14px' }}><i className="ti ti-rotate" style={{ fontSize: 14 }}></i>Reset</Btn>}
          <Btn solid={editing} onClick={() => setEditing(e => !e)} style={{ fontSize: 13, padding: '7px 14px' }}>
            <i className={'ti ti-' + (editing ? 'check' : 'adjustments-horizontal')} style={{ fontSize: 15 }}></i>{editing ? 'Done' : 'Customise'}
          </Btn>
        </div>
      </div>

      {/* connect accounts */}
      <ConnectBar brokers={PF_BROKERS} connected={connected} onToggle={toggleBroker} isMobile={isMobile} />

      {/* customise tray */}
      {editing && (
        <div style={{ marginTop: 16, padding: '14px 16px', background: VM.paper, border: `1px dashed ${VM.border}`, borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <i className="ti ti-layout-dashboard" style={{ fontSize: 15, color: VM.teal }}></i>
            <Mono size={11} color={VM.ink2} weight={600}>Customise your dashboard</Mono>
            <Mono size={10} color={VM.ink3}>· toggle widgets, then use each card's controls to reorder / resize</Mono>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PF_WIDGETS.map(w => {
              const on = layout.cfg[w.id].visible;
              return <Pill key={w.id} active={on} onClick={() => setVisible(w.id, !on)}>
                <i className={'ti ti-' + (on ? 'eye' : 'eye-off')} style={{ fontSize: 13 }}></i>{w.label}
              </Pill>;
            })}
          </div>
        </div>
      )}

      {/* widget grid */}
      <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gridAutoFlow: 'dense', gap: isMobile ? 14 : 18, alignItems: 'start' }}>
        {visibleIds.map(id => {
          const w = PF_WIDGETS.find(x => x.id === id);
          const span = isMobile ? 1 : Math.min(layout.cfg[id].span, cols);
          return (
            <WidgetCard key={id} title={w.label} span={span} editing={editing}
              canWiden={layout.cfg[id].span < 2} canNarrow={layout.cfg[id].span > 1}
              onMove={(d) => move(id, d)} onSpan={(s) => setSpan(id, s)} onHide={() => setVisible(id, false)}>
              {id === 'summary' && <SummaryWidget pf={pf} />}
              {id === 'performance' && <PerformanceWidget pf={pf} />}
              {id === 'allocation' && <AllocationWidget pf={pf} />}
              {id === 'watchlist' && <WatchlistWidget go={go} />}
              {id === 'holdings' && <HoldingsWidget pf={pf} go={go} isMobile={isMobile} />}
              {id === 'analogues' && <AnaloguesWidget go={go} />}
            </WidgetCard>
          );
        })}
      </div>
      {visibleIds.length === 0 && (
        <div style={{ marginTop: 18, padding: '40px 20px', textAlign: 'center', background: VM.paper, border: `1px dashed ${VM.border}`, borderRadius: 12 }}>
          <i className="ti ti-layout-dashboard" style={{ fontSize: 24, color: VM.ink3 }}></i>
          <div style={{ fontFamily: VM.serif, fontSize: 15, color: VM.ink2, marginTop: 8 }}>All widgets are hidden. Turn some on above.</div>
        </div>
      )}
    </div>
  );
}

// ── connect-accounts bar ───────────────────────────────────────────────────
function ConnectBar({ brokers, connected, onToggle, isMobile }) {
  const count = connected.size;
  return (
    <div style={{ marginTop: 20, background: VM.paper, border: `1px solid ${VM.borderSoft}`, borderRadius: 14, padding: isMobile ? '14px' : '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <i className="ti ti-plug-connected" style={{ fontSize: 17, color: VM.teal }}></i>
          <span style={{ fontFamily: VM.serif, fontWeight: 700, fontSize: 17 }}>Connected accounts</span>
        </div>
        <Mono size={10.5} color={VM.ink3}>{count ? `${count} linked · syncing` : 'Link a broker to import holdings'}</Mono>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? '100%' : '210px'}, 1fr))`, gap: 10 }}>
        {brokers.map(b => <BrokerButton key={b.id} b={b} on={connected.has(b.id)} onToggle={() => onToggle(b.id)} />)}
        <button onClick={() => alert('Account linking is a scaffold — broker OAuth wiring comes with the backend.')}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '12px 14px', cursor: 'pointer',
            border: `1px dashed ${VM.border}`, borderRadius: 10, background: 'transparent', color: VM.ink2, fontFamily: VM.serif, fontSize: 14 }}>
          <i className="ti ti-plus" style={{ fontSize: 16 }}></i>Add another account
        </button>
      </div>
    </div>
  );
}
function BrokerButton({ b, on, onToggle }) {
  const [hover, setHover] = useStateMP(false);
  return (
    <button onClick={onToggle} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 13px', cursor: 'pointer', textAlign: 'left',
        border: `1.5px solid ${on ? VM.up : (hover ? VM.border : VM.borderSoft)}`, borderRadius: 10,
        background: on ? VM.tealTint : (hover ? VM.paperWarm : VM.paper), transition: 'all .14s ease' }}>
      <span style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: b.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <i className={'ti ti-' + b.icon} style={{ fontSize: 17 }}></i>
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontFamily: VM.serif, fontWeight: 600, fontSize: 14, color: VM.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.name}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: VM.mono, fontSize: 9.5, color: on ? VM.upInk : VM.ink3 }}>
          {on ? <React.Fragment><i className="ti ti-circle-check-filled" style={{ fontSize: 11 }}></i>Connected</React.Fragment>
              : <React.Fragment>{b.featured ? 'Recommended · Connect' : 'Connect'}</React.Fragment>}
        </span>
      </span>
      {b.featured && !on && <span style={{ fontFamily: VM.mono, fontSize: 8, fontWeight: 700, letterSpacing: '0.05em', color: VM.paperWarm, background: VM.forest, borderRadius: 4, padding: '2px 5px' }}>★</span>}
    </button>
  );
}

// ── widget shell with edit controls ────────────────────────────────────────
function WidgetCard({ title, span, editing, canWiden, canNarrow, onMove, onSpan, onHide, children }) {
  return (
    <section style={{ gridColumn: `span ${span}`, background: VM.paper, border: `1px solid ${editing ? VM.border : VM.borderSoft}`, borderRadius: 14, overflow: 'hidden' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: `1px solid ${VM.borderHair}` }}>
        <span style={{ fontFamily: VM.mono, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: VM.ink3, fontWeight: 700 }}>{title}</span>
        {editing && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 5 }}>
            <EditBtn icon="chevron-up" title="Move earlier" onClick={() => onMove(-1)} />
            <EditBtn icon="chevron-down" title="Move later" onClick={() => onMove(1)} />
            {canWiden && <EditBtn icon="arrows-horizontal" title="Make wide" onClick={() => onSpan(2)} />}
            {canNarrow && <EditBtn icon="arrows-minimize" title="Make narrow" onClick={() => onSpan(1)} />}
            <EditBtn icon="eye-off" title="Hide" onClick={onHide} />
          </div>
        )}
      </header>
      <div style={{ padding: '14px 16px 16px' }}>{children}</div>
    </section>
  );
}
function EditBtn({ icon, title, onClick }) {
  return <button title={title} onClick={onClick} style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${VM.border}`, background: VM.paperWarm, color: VM.ink2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
    <i className={'ti ti-' + icon} style={{ fontSize: 14 }}></i></button>;
}

// ── widgets ────────────────────────────────────────────────────────────────
function SummaryWidget({ pf }) {
  const kpis = [
    { label: 'Total value', value: money(pf.total), spark: true },
    { label: 'Today', value: (pf.dayChg >= 0 ? '+' : '') + money(pf.dayChg), dir: pf.dayChg >= 0 ? 'up' : 'down', extra: signPct(pf.dayPct) },
    { label: 'Total return', value: (pf.totalPL >= 0 ? '+' : '') + money(pf.totalPL), dir: pf.totalPL >= 0 ? 'up' : 'down', extra: signPct(pf.totalPLPct) },
    { label: 'Cash available', value: money(PF_CASH), sub: 'Buying power' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
      {kpis.map((k, i) => (
        <div key={i} style={{ padding: '4px 2px' }}>
          <Label>{k.label}</Label>
          <div style={{ fontFamily: VM.mono, fontWeight: 700, fontSize: 23, color: k.dir === 'down' ? VM.downInk : (k.dir === 'up' ? VM.upInk : VM.ink), marginTop: 5, fontVariantNumeric: 'tabular-nums' }}>{k.value}</div>
          {k.extra && <div style={{ marginTop: 2 }}><Chg dir={k.dir}>{k.extra}</Chg></div>}
          {k.sub && <div style={{ marginTop: 3 }}><Mono size={10} color={VM.ink3}>{k.sub}</Mono></div>}
          {k.spark && <div style={{ marginTop: 8 }}><Sparkline dir="up" w={120} h={22} /></div>}
        </div>
      ))}
    </div>
  );
}

const PF_RANGES = { '1W': 7, '1M': 24, '3M': 36, '1Y': 52, '5Y': 60, 'MAX': 72 };
function PerformanceWidget({ pf }) {
  const [range, setRange] = useStateMP('1Y');
  const n = PF_RANGES[range];
  const vals = useMemoMP(() => walk(range.length + n, n, 0.012), [range]);
  const w = 760, h = 168;
  const change = ((vals[vals.length - 1] - vals[0]) / (vals[0] || 1)) * 100;
  const up = change >= 0;
  const col = up ? VM.up : VM.down, ink = up ? VM.upInk : VM.downInk;
  const lp = linePath(vals, w, h);
  const area = `${lp} L ${w} ${h} L 0 ${h} Z`;
  const gid = 'pfgrad';
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <div>
          <div style={{ fontFamily: VM.mono, fontWeight: 700, fontSize: 26, color: VM.ink }}>{money(pf.total)}</div>
          <div style={{ marginTop: 2 }}><Chg dir={up ? 'up' : 'down'}>{(up ? '▲ ' : '▼ ') + signPct(change)}</Chg> <Mono size={10} color={VM.ink3}>over {range}</Mono></div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {Object.keys(PF_RANGES).map(r => (
            <button key={r} onClick={() => setRange(r)} style={{ fontFamily: VM.mono, fontSize: 10.5, padding: '5px 10px', borderRadius: 7, cursor: 'pointer',
              border: `1px solid ${range === r ? VM.forest : VM.border}`, background: range === r ? VM.forest : VM.paper, color: range === r ? VM.paperWarm : VM.ink2 }}>{r}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: 168, display: 'block' }}>
        <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={col} stopOpacity="0.18" /><stop offset="100%" stopColor={col} stopOpacity="0" />
        </linearGradient></defs>
        {[0.25, 0.5, 0.75].map(g => <line key={g} x1="0" y1={g * h} x2={w} y2={g * h} stroke={VM.borderHair} strokeWidth="1" strokeDasharray="2 6" />)}
        <path d={area} fill={`url(#${gid})`} />
        <path d={lp} fill="none" stroke={ink} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function Donut({ data, size = 150, thickness = 20 }) {
  const r = (size - thickness) / 2, c = 2 * Math.PI * r, total = data.reduce((s, d) => s + d.value, 0) || 1;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        {data.map((d, i) => {
          const len = (d.value / total) * c, off = -acc; acc += len;
          return <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={d.color} strokeWidth={thickness}
            strokeDasharray={`${len} ${c - len}`} strokeDashoffset={off} />;
        })}
      </g>
      <text x="50%" y="46%" textAnchor="middle" style={{ fontFamily: VM.mono, fontSize: 9, fill: VM.ink3, letterSpacing: '0.08em' }}>SECTORS</text>
      <text x="50%" y="60%" textAnchor="middle" style={{ fontFamily: VM.mono, fontWeight: 700, fontSize: 18, fill: VM.ink }}>{data.length - 1}</text>
    </svg>
  );
}
function AllocationWidget({ pf }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
      <Donut data={pf.alloc} />
      <div style={{ flex: 1, minWidth: 150, display: 'flex', flexDirection: 'column', gap: 7 }}>
        {pf.alloc.map((a, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, background: a.color, flexShrink: 0 }}></span>
            <span style={{ flex: 1, fontFamily: VM.serif, fontSize: 13.5, color: VM.ink2 }}>{a.label}</span>
            <Mono size={11} weight={600} color={VM.ink}>{a.pct.toFixed(1)}%</Mono>
          </div>
        ))}
      </div>
    </div>
  );
}

function WatchlistWidget({ go }) {
  const rows = PF_WATCH.map(t => VM_COMPANIES.find(c => c.ticker === t)).filter(Boolean);
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {rows.map((c, i) => (
        <div key={c.ticker} onClick={() => go('dashboard', c)} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', alignItems: 'center', gap: 10,
          padding: '9px 4px', cursor: 'pointer', borderBottom: i < rows.length - 1 ? `1px dotted ${VM.border}` : 'none' }}>
          <div><span style={{ fontFamily: VM.serif, fontWeight: 700, fontSize: 15 }}>{c.ticker}</span> <Mono size={10} color={VM.ink3}>{c.sector.split('·')[0].trim()}</Mono></div>
          <Sparkline dir={c.dir} w={52} h={16} />
          <div style={{ textAlign: 'right', minWidth: 66 }}><Mono size={12} weight={700}>${c.price}</Mono><div><Chg dir={c.dir}>{c.chg}</Chg></div></div>
        </div>
      ))}
    </div>
  );
}

function HoldingsWidget({ pf, go, isMobile }) {
  return (
    <div>
      {!isMobile && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.7fr 0.9fr 1fr 0.8fr 1.2fr', gap: 8, padding: '0 4px 8px', borderBottom: `1px solid ${VM.borderSoft}` }}>
          {['Holding', 'Shares', 'Price', 'Value', 'Today', 'Weight'].map((h, i) => <Label key={h} style={{ textAlign: i > 0 ? 'right' : 'left' }}>{h}</Label>)}
        </div>
      )}
      {pf.rows.map((r, i) => {
        const c = VM_COMPANIES.find(x => x.ticker === r.ticker);
        if (isMobile) return (
          <div key={r.ticker} onClick={() => go('dashboard', c)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '11px 2px', cursor: 'pointer', borderBottom: i < pf.rows.length - 1 ? `1px dotted ${VM.border}` : 'none' }}>
            <div><span style={{ fontFamily: VM.serif, fontWeight: 700, fontSize: 16 }}>{r.ticker}</span><div><Mono size={10} color={VM.ink3}>{r.shares} sh · {r.weight.toFixed(0)}%</Mono></div></div>
            <div style={{ textAlign: 'right' }}><Mono size={13} weight={700}>{money(r.value)}</Mono><div><Chg dir={r.dayPct >= 0 ? 'up' : 'down'}>{signPct(r.dayPct)}</Chg></div></div>
          </div>
        );
        return (
          <div key={r.ticker} onClick={() => go('dashboard', c)} style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.7fr 0.9fr 1fr 0.8fr 1.2fr', gap: 8, alignItems: 'center',
            padding: '11px 4px', cursor: 'pointer', borderBottom: i < pf.rows.length - 1 ? `1px dotted ${VM.border}` : 'none' }}>
            <div><span style={{ fontFamily: VM.serif, fontWeight: 700, fontSize: 15 }}>{r.ticker}</span> <Mono size={10} color={VM.ink3}>{r.name}</Mono></div>
            <Mono size={12} color={VM.ink2} style={{ textAlign: 'right' }}>{r.shares}</Mono>
            <Mono size={12} weight={600} style={{ textAlign: 'right' }}>${r.price.toFixed(2)}</Mono>
            <Mono size={12} weight={700} style={{ textAlign: 'right' }}>{money(r.value)}</Mono>
            <span style={{ textAlign: 'right' }}><Chg dir={r.dayPct >= 0 ? 'up' : 'down'}>{signPct(r.dayPct)}</Chg></span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'flex-end' }}>
              <div style={{ flex: 1, maxWidth: 64 }}><ProgressBar v={r.weight} /></div>
              <Mono size={11} color={VM.ink2} style={{ minWidth: 34, textAlign: 'right' }}>{r.weight.toFixed(0)}%</Mono>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AnaloguesWidget({ go }) {
  const rows = VM_ANALOGUES.slice(0, 4);
  return (
    <div>
      <Mono size={10.5} color={VM.ink3} style={{ display: 'block', marginBottom: 10 }}>History matches across your holdings — what tended to happen next.</Mono>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
        {rows.map(a => (
          <div key={a.n} onClick={() => go('history')} style={{ padding: '11px 13px', cursor: 'pointer', border: `1px solid ${VM.borderSoft}`, borderRadius: 10, background: VM.paperWarm }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontFamily: VM.serif, fontWeight: 700, fontSize: 14 }}>like {a.ticker} ’{a.year.slice(2)}</span>
              <span style={{ fontFamily: VM.mono, fontSize: 8.5, fontWeight: 700, letterSpacing: '0.05em', padding: '2px 6px', borderRadius: 5,
                color: a.dir === 'up' ? VM.upInk : VM.downInk, background: a.dir === 'up' ? VM.tealTint : 'rgba(163,45,45,0.10)', border: `1px solid ${a.dir === 'up' ? VM.up : VM.downInk}` }}>{a.outcome}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <Mono size={10} color={VM.ink3}>{a.match}% match</Mono>
              <Chg dir={a.dir}>{a.ret}</Chg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { MyPortfolio });
