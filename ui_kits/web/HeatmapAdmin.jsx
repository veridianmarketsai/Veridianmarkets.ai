// Veridian Markets — Heatmap Admin
// Canvas-based interaction heatmap viewer backed by heatmap_tracker.jsx.
// "Launch Overlay" opens a floating toolbar + canvas on top of the live app
// (pointer-events: none on the canvas, so the page stays navigable).

const { useState: useStateHm, useEffect: useEffectHm, useRef: useRefHm, useCallback: useCallbackHm } = React;

// ── Color schemes ──────────────────────────────────────────────────────────────
function interpColors(stops) {
  return t => {
    for (let i = 1; i < stops.length; i++) {
      if (t <= stops[i][0]) {
        const f = (t - stops[i-1][0]) / (stops[i][0] - stops[i-1][0]);
        return stops[i-1][1].map((a, j) => Math.round(a + f * (stops[i][1][j] - a)));
      }
    }
    return stops[stops.length - 1][1];
  };
}

const SCHEMES = {
  thermal: { name: 'Thermal', fn: interpColors([[0,[10,10,120]],[.15,[0,60,240]],[.35,[0,180,140]],[.58,[210,210,0]],[.78,[255,110,0]],[1,[220,20,0]]]) },
  fire:    { name: 'Fire',    fn: interpColors([[0,[20,0,0]],[.35,[200,40,0]],[.65,[255,170,0]],[1,[255,255,180]]]) },
  cool:    { name: 'Cool',    fn: interpColors([[0,[5,5,80]],[.5,[0,120,210]],[1,[160,240,255]]]) },
  mono:    { name: 'Mono',    fn: interpColors([[0,[20,18,14]],[1,[255,225,170]]]) },
};

// ── Canvas heatmap rendering ──────────────────────────────────────────────────
function renderHeatmap(canvas, events, { radius, opacity, scheme }) {
  const W = canvas.width, H = canvas.height;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  if (!events.length) return;

  // Accumulate intensity on a temporary canvas with additive blending.
  const tmp = document.createElement('canvas');
  tmp.width = W; tmp.height = H;
  const tc = tmp.getContext('2d');
  tc.globalCompositeOperation = 'lighter';

  for (const ev of events) {
    if (ev.x == null || ev.y == null) continue;
    const cx = ev.x / 100 * W;
    const cy = ev.y / 100 * H;
    const g  = tc.createRadialGradient(cx, cy, 0, cx, cy, radius);
    g.addColorStop(0,   'rgba(255,255,255,0.24)');
    g.addColorStop(0.4, 'rgba(255,255,255,0.06)');
    g.addColorStop(1,   'rgba(255,255,255,0)');
    tc.fillStyle = g;
    tc.beginPath(); tc.arc(cx, cy, radius, 0, Math.PI * 2); tc.fill();
  }

  // Map accumulated brightness through a colour scheme.
  const raw = tc.getImageData(0, 0, W, H).data;
  const out = ctx.createImageData(W, H);
  const fn  = SCHEMES[scheme]?.fn || SCHEMES.thermal.fn;

  for (let i = 0; i < raw.length; i += 4) {
    const intensity = Math.min(1, raw[i] / 180);
    if (intensity < 0.02) continue;
    const [r, g, b] = fn(intensity);
    out.data[i]   = r;
    out.data[i+1] = g;
    out.data[i+2] = b;
    out.data[i+3] = Math.round(intensity * opacity * 255);
  }
  ctx.putImageData(out, 0, 0);
}

// ── Data helpers ──────────────────────────────────────────────────────────────
const PAGES   = ['all','front','screener','supply','dashboard','learn','myportfolio','mybusiness','admin','history','memoir','settings','calendar','news'];
const WINDOWS = [
  { label: 'Last 1 h',  ms: 3_600_000  },
  { label: 'Last 24 h', ms: 86_400_000 },
  { label: 'Last 7 d',  ms: 604_800_000},
  { label: 'All time',  ms: Infinity   },
];
const LAYERS = [
  { key: 'click',  label: 'Clicks',    color: '#d63' },
  { key: 'hover',  label: 'Hover',     color: '#2a8' },
  { key: 'move',   label: 'Movement',  color: '#47f' },
  { key: 'rage',   label: 'Rage',      color: '#f80' },
  { key: 'select', label: 'Selection', color: '#a4f' },
  { key: 'scroll', label: 'Scroll',    color: '#08c' },
];

function filterEvents(all, { page, sinceMs, layers }) {
  const cutoff = Date.now() - sinceMs;
  return all.filter(ev =>
    layers[ev.t] &&
    (page === 'all' || ev.page === page) &&
    ev.ts > cutoff
  );
}

const DEFAULT_CFG = () => ({
  layers:  Object.fromEntries(LAYERS.map(l => [l.key, l.key !== 'move'])),
  page:    'all',
  sinceMs: WINDOWS[1].ms,
  radius:  60,
  opacity: 0.88,
  scheme:  'thermal',
});

// ── Scroll-depth chart (div-based, used in the admin panel) ──────────────────
function ScrollDepthChart({ events }) {
  const buckets = Array.from({ length: 10 }, () => 0);
  events.filter(e => e.t === 'scroll').forEach(e => {
    const b = Math.min(9, Math.floor((e.maxDepth || 0) / 10));
    for (let i = 0; i <= b; i++) buckets[i]++;
  });
  const peak = Math.max(1, ...buckets);
  return (
    <div style={{ padding: '12px 0' }}>
      {buckets.map((n, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{ fontFamily: VM.mono, fontSize: 10, color: VM.ink3, width: 68, textAlign: 'right', flexShrink: 0 }}>
            {i * 10}–{i * 10 + 10}%
          </span>
          <div style={{ flex: 1, background: VM.faint, borderRadius: 3, height: 18, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: '0 auto 0 0', borderRadius: 3,
              width: `${n / peak * 100}%`, background: `hsl(${120 - i * 13},75%,42%)`, transition: 'width .4s' }} />
            <span style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)',
              fontFamily: VM.mono, fontSize: 9, color: '#fff', opacity: 0.8 }}>{n}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Toolbar (shared by admin tab and overlay) ─────────────────────────────────
function HeatmapToolbar({ cfg, set, onRefresh, onExport, onClear, viewMode, setViewMode, compact }) {
  const pill = (on, color) => ({
    fontFamily: VM.mono, fontSize: compact ? 10 : 11, letterSpacing: '0.04em',
    padding: compact ? '2px 8px' : '3px 10px', borderRadius: 20, cursor: 'pointer',
    border: `1px solid ${on ? color : 'rgba(255,255,255,0.18)'}`,
    background: on ? color + '28' : 'transparent',
    color: on ? color : 'rgba(255,255,255,0.45)',
    transition: 'all .15s', flexShrink: 0,
  });
  const sel = {
    fontFamily: VM.mono, fontSize: 10, background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.75)',
    borderRadius: 4, padding: '2px 6px', cursor: 'pointer',
  };
  const lbl = { fontFamily: VM.mono, fontSize: 9, color: 'rgba(255,255,255,0.4)',
    letterSpacing: '0.06em', flexShrink: 0 };
  const div = { width: 1, height: 18, background: 'rgba(255,255,255,0.1)', flexShrink: 0 };

  return (
    <div className="vm-noscroll" style={{ display: 'flex', alignItems: 'center', gap: 6,
      padding: compact ? '5px 10px' : '7px 14px', overflowX: 'auto',
      background: 'rgba(12,10,8,0.96)', backdropFilter: 'blur(8px)',
      borderBottom: '1px solid rgba(255,255,255,0.07)' }}>

      {/* View mode */}
      <button onClick={() => setViewMode('heat')} style={pill(viewMode === 'heat', '#47f')}>Heatmap</button>
      <button onClick={() => setViewMode('scroll')} style={pill(viewMode === 'scroll', '#08c')}>Scroll depth</button>

      <div style={div} />

      {/* Layer toggles */}
      {LAYERS.map(l => (
        <button key={l.key} style={pill(cfg.layers[l.key], l.color)}
          onClick={() => set(c => ({ ...c, layers: { ...c.layers, [l.key]: !c.layers[l.key] } }))}>
          {l.label}
        </button>
      ))}

      <div style={div} />

      {/* Filters */}
      <select value={cfg.page} onChange={e => set(c => ({ ...c, page: e.target.value }))} style={sel}>
        {PAGES.map(p => <option key={p} value={p}>{p === 'all' ? 'All pages' : p}</option>)}
      </select>

      <select value={cfg.sinceMs} onChange={e => set(c => ({ ...c, sinceMs: +e.target.value }))} style={sel}>
        {WINDOWS.map(w => <option key={w.label} value={w.ms}>{w.label}</option>)}
      </select>

      <select value={cfg.scheme} onChange={e => set(c => ({ ...c, scheme: e.target.value }))} style={sel}>
        {Object.entries(SCHEMES).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
      </select>

      <div style={div} />

      {/* Radius */}
      <span style={lbl}>RADIUS</span>
      <input type="range" min={15} max={160} value={cfg.radius}
        onChange={e => set(c => ({ ...c, radius: +e.target.value }))}
        style={{ width: 70, accentColor: '#47f', cursor: 'pointer' }} />

      {/* Opacity */}
      <span style={lbl}>OPACITY</span>
      <input type="range" min={15} max={100} value={Math.round(cfg.opacity * 100)}
        onChange={e => set(c => ({ ...c, opacity: +e.target.value / 100 }))}
        style={{ width: 60, accentColor: '#47f', cursor: 'pointer' }} />

      {/* Actions */}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 5, flexShrink: 0 }}>
        <button onClick={onRefresh} title="Refresh" style={pill(false, '#fff')}>⟳ Refresh</button>
        <button onClick={onExport}  title="Export CSV" style={pill(false, '#2a8')}>↓ CSV</button>
        <button onClick={onClear}   title="Clear all data" style={pill(false, '#d63')}>✕ Clear</button>
      </div>
    </div>
  );
}

// ── Stats summary cards ────────────────────────────────────────────────────────
function HeatmapStats({ all }) {
  const sessions   = new Set(all.map(e => e.sid)).size;
  const scrolls    = all.filter(e => e.t === 'scroll');
  const avgScroll  = scrolls.length ? Math.round(scrolls.reduce((s, e) => s + (e.maxDepth || 0), 0) / scrolls.length) : 0;
  const rages      = all.filter(e => e.t === 'rage').length;
  const pageCounts = {};
  all.forEach(e => { pageCounts[e.page] = (pageCounts[e.page] || 0) + 1; });
  const topPage = Object.entries(pageCounts).sort((a, b) => b[1] - a[1])[0];
  const dwells     = all.filter(e => e.t === 'hover' && e.dur);
  const avgDwell   = dwells.length ? Math.round(dwells.reduce((s, e) => s + e.dur, 0) / dwells.length / 100) / 10 : 0;

  const card = (label, val, sub) => (
    <div style={{ background: VM.faint, borderRadius: 8, padding: '12px 16px', minWidth: 100 }}>
      <div style={{ fontFamily: VM.mono, fontSize: 9, color: VM.ink3, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: VM.serif, fontSize: 24, fontWeight: 700, color: VM.ink, lineHeight: 1 }}>{val}</div>
      {sub && <div style={{ fontFamily: VM.mono, fontSize: 10, color: VM.ink3, marginTop: 4 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '20px 0' }}>
      {card('Total events', all.length.toLocaleString())}
      {card('Sessions',     sessions)}
      {card('Avg scroll',   `${avgScroll}%`, 'depth reached')}
      {card('Avg dwell',    `${avgDwell}s`,  'on elements')}
      {card('Rage clicks',  rages, 'frustration')}
      {topPage && card('Top page', topPage[0], `${topPage[1]} events`)}
    </div>
  );
}

// ── Recent event log ──────────────────────────────────────────────────────────
function EventLog({ all }) {
  const rows = [...all].reverse().slice(0, 60);
  const layerColor = key => LAYERS.find(l => l.key === key)?.color || VM.ink3;

  return (
    <div>
      <div style={{ fontFamily: VM.mono, fontSize: 10, color: VM.ink3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
        Recent events
      </div>
      <div style={{ background: VM.faint, borderRadius: 8, overflow: 'auto', maxHeight: 240 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: VM.mono, fontSize: 11 }}>
          <thead>
            <tr>
              {['Type','Page','X','Y','Element','Time'].map(h => (
                <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: VM.ink3,
                  fontWeight: 500, borderBottom: `1px solid ${VM.border}`, background: VM.faint, position: 'sticky', top: 0 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((e, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${VM.border}` }}>
                <td style={{ padding: '4px 10px', color: layerColor(e.t), fontWeight: 600 }}>{e.t}</td>
                <td style={{ padding: '4px 10px', color: VM.ink2 }}>{e.page}</td>
                <td style={{ padding: '4px 10px', color: VM.ink3 }}>{e.x ?? '—'}%</td>
                <td style={{ padding: '4px 10px', color: VM.ink3 }}>{e.y ?? '—'}%</td>
                <td style={{ padding: '4px 10px', color: VM.ink3, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {e.el || e.len ? (e.el || `${e.len} chars`) : '—'}
                </td>
                <td style={{ padding: '4px 10px', color: VM.ink3 }}>{new Date(e.ts).toLocaleTimeString()}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: VM.ink3 }}>No events yet — browse the app</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Overlay app — mounted in its own React root so it survives page navigation ─
function HeatmapOverlayApp({ onClose }) {
  const [cfg, setCfg]           = useStateHm(DEFAULT_CFG);
  const [viewMode, setViewMode] = useStateHm('heat');
  const [events, setEvents]     = useStateHm([]);
  const [eventCount, setCount]  = useStateHm(0);
  const canvasRef               = useRefHm(null);

  const refresh = useCallbackHm(() => {
    const all = window.__vmHeatmap?.get() || [];
    const filtered = filterEvents(all, cfg);
    setEvents(filtered);
    setCount(all.length);
  }, [cfg]);

  useEffectHm(() => { refresh(); }, [cfg]);

  // Auto-refresh every 4 s while overlay is active.
  useEffectHm(() => {
    const id = setInterval(refresh, 4000);
    return () => clearInterval(id);
  }, [refresh]);

  useEffectHm(() => {
    const canvas = canvasRef.current;
    if (!canvas || viewMode !== 'heat') return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    renderHeatmap(canvas, events, cfg);
  }, [events, viewMode, cfg]);

  const exportCSV = () => {
    const all = window.__vmHeatmap?.get() || [];
    const header = 'type,page,timestamp,x,y,session,element,dwell_ms,scroll_depth,screen_w,screen_h';
    const body   = all.map(e => [e.t, e.page, new Date(e.ts).toISOString(), e.x ?? '', e.y ?? '',
      e.sid, e.el || '', e.dur || '', e.depth || '', e.sw || '', e.sh || ''].join(','));
    const blob = new Blob([[header, ...body].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'vm_heatmap.csv'; a.click();
  };

  const clearData = () => {
    if (!confirm('Clear all heatmap data? This cannot be undone.')) return;
    window.__vmHeatmap?.clear(); refresh();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, pointerEvents: 'none' }}>
      {/* Toolbar — pointer-events restored so controls are clickable. */}
      <div style={{ pointerEvents: 'all' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(10,8,6,0.97)',
          borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px',
            borderRight: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
            <i className="ti ti-flame" style={{ fontSize: 14, color: '#f80' }}></i>
            <span style={{ fontFamily: VM.mono, fontSize: 11, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.1em' }}>
              HEATMAP
            </span>
            <span style={{ fontFamily: VM.mono, fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>
              {eventCount.toLocaleString()} events
            </span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <HeatmapToolbar cfg={cfg} set={setCfg} onRefresh={refresh} onExport={exportCSV}
              onClear={clearData} viewMode={viewMode} setViewMode={setViewMode} compact />
          </div>
          <button onClick={onClose}
            style={{ fontFamily: VM.mono, fontSize: 10, padding: '0 14px', height: '100%', minHeight: 36,
              background: 'transparent', border: 'none', borderLeft: '1px solid rgba(255,255,255,0.1)',
              color: '#f66', cursor: 'pointer', letterSpacing: '0.06em', pointerEvents: 'all', flexShrink: 0 }}>
            ✕ EXIT
          </button>
        </div>
      </div>

      {/* Canvas — pointer-events: none so the page underneath stays clickable. */}
      {viewMode === 'heat' && (
        <canvas ref={canvasRef}
          style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
      )}

      {/* Scroll depth — floating panel in overlay mode. */}
      {viewMode === 'scroll' && (
        <div style={{ position: 'fixed', top: 44, right: 0, width: 300, background: 'rgba(12,10,8,0.94)',
          border: '1px solid rgba(255,255,255,0.1)', borderRight: 'none', borderTop: 'none',
          pointerEvents: 'all', borderRadius: '0 0 0 8px', padding: '12px 16px' }}>
          <div style={{ fontFamily: VM.mono, fontSize: 10, color: 'rgba(255,255,255,0.5)',
            letterSpacing: '0.08em', marginBottom: 8 }}>SCROLL DEPTH</div>
          <ScrollDepthChart events={events} />
        </div>
      )}
    </div>
  );
}

// ── Main admin tab ─────────────────────────────────────────────────────────────
function HeatmapAdmin({ isMobile }) {
  const [cfg, setCfg]             = useStateHm(DEFAULT_CFG);
  const [viewMode, setViewMode]   = useStateHm('heat');
  const [events, setEvents]       = useStateHm([]);
  const [allEvents, setAllEvents] = useStateHm([]);
  const [overlayOn, setOverlayOn] = useStateHm(false);
  const canvasRef                 = useRefHm(null);
  const overlayRootRef            = useRefHm(null);

  const refresh = useCallbackHm(() => {
    const all = window.__vmHeatmap?.get() || [];
    setAllEvents(all);
    setEvents(filterEvents(all, cfg));
  }, [cfg]);

  useEffectHm(() => { refresh(); }, [cfg]);

  useEffectHm(() => {
    const canvas = canvasRef.current;
    if (!canvas || viewMode !== 'heat') return;
    const W = canvas.parentElement?.clientWidth || 800;
    canvas.width  = W;
    canvas.height = Math.round(W * 0.5);
    renderHeatmap(canvas, events, cfg);
  }, [events, viewMode]);

  // Tear down overlay if admin tab is closed.
  useEffectHm(() => () => closeOverlay(), []);

  const closeOverlay = () => {
    overlayRootRef.current?.unmount();
    overlayRootRef.current = null;
    setOverlayOn(false);
  };

  const launchOverlay = () => {
    if (overlayRootRef.current) { closeOverlay(); return; }
    const el   = document.createElement('div');
    document.body.appendChild(el);
    const root = ReactDOM.createRoot(el);
    const onClose = () => { root.unmount(); el.remove(); overlayRootRef.current = null; setOverlayOn(false); };
    root.render(React.createElement(HeatmapOverlayApp, { onClose }));
    overlayRootRef.current = root;
    setOverlayOn(true);
  };

  const exportCSV = () => {
    const header = 'type,page,timestamp,x,y,session,element,dwell_ms,scroll_depth,screen_w,screen_h';
    const body   = allEvents.map(e => [e.t, e.page, new Date(e.ts).toISOString(), e.x ?? '', e.y ?? '',
      e.sid, e.el || '', e.dur || '', e.depth || '', e.sw || '', e.sh || ''].join(','));
    const blob = new Blob([[header, ...body].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'vm_heatmap.csv'; a.click();
  };

  const clearData = () => {
    if (!confirm('Clear all heatmap data? This cannot be undone.')) return;
    window.__vmHeatmap?.clear(); refresh();
  };

  return (
    <div style={{ maxWidth: 1080 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: VM.serif, fontSize: 22, fontWeight: 700, color: VM.ink }}>Interaction Heatmap</div>
          <div style={{ fontFamily: VM.mono, fontSize: 11, color: VM.ink3, marginTop: 4, letterSpacing: '0.04em' }}>
            {allEvents.length.toLocaleString()} events &middot; {new Set(allEvents.map(e => e.sid)).size} sessions tracked
          </div>
        </div>
        <button onClick={launchOverlay}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 8,
            background: overlayOn ? VM.teal + '18' : VM.teal,
            color: overlayOn ? VM.teal : VM.paper,
            border: `1.5px solid ${VM.teal}`,
            fontFamily: VM.mono, fontSize: 12, letterSpacing: '0.06em', cursor: 'pointer' }}>
          <i className={'ti ti-' + (overlayOn ? 'x' : 'eye')} style={{ fontSize: 15 }}></i>
          {overlayOn ? 'Close overlay' : 'Launch overlay'}
        </button>
      </div>

      {overlayOn && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8,
          background: VM.teal + '12', border: `1px solid ${VM.teal}`, marginBottom: 16 }}>
          <i className="ti ti-eye-check" style={{ fontSize: 15, color: VM.teal }}></i>
          <span style={{ fontFamily: VM.mono, fontSize: 12, color: VM.teal }}>
            Overlay active — navigate the app to see live heatmap. Auto-refreshes every 4 s.
          </span>
        </div>
      )}

      {/* Toolbar */}
      <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.12)', marginBottom: 14 }}>
        <HeatmapToolbar cfg={cfg} set={setCfg} onRefresh={refresh} onExport={exportCSV}
          onClear={clearData} viewMode={viewMode} setViewMode={setViewMode} />
      </div>

      {/* Canvas / scroll-depth */}
      <div style={{ background: '#1a1814', borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ fontFamily: VM.mono, fontSize: 9, color: 'rgba(255,255,255,0.28)', padding: '6px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.06)', letterSpacing: '0.09em', textTransform: 'uppercase',
          display: 'flex', justifyContent: 'space-between' }}>
          <span>{viewMode === 'heat' ? 'Heatmap preview' : 'Scroll depth'}</span>
          <span>{events.length} events shown</span>
        </div>

        {viewMode === 'heat' ? (
          <div style={{ position: 'relative' }}>
            <canvas ref={canvasRef} style={{ display: 'block', width: '100%' }} />
            {!events.length && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                justifyContent: 'center', minHeight: 180, fontFamily: VM.mono, fontSize: 12,
                color: 'rgba(255,255,255,0.22)', flexDirection: 'column', gap: 8 }}>
                <i className="ti ti-flame" style={{ fontSize: 28, opacity: 0.3 }}></i>
                No events match current filters
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: '8px 20px 16px', background: '#1a1814' }}>
            <ScrollDepthChart events={events} />
          </div>
        )}
      </div>

      {/* Stats */}
      <HeatmapStats all={allEvents} />

      {/* Event log */}
      <EventLog all={allEvents} />
    </div>
  );
}

Object.assign(window, { HeatmapAdmin });
