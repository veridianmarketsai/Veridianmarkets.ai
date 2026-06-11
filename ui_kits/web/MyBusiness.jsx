// Veridian Markets — My Business: an interactive dependency-map *builder*.
// Where a company maps its own supply chain: a draggable canvas with the firm at
// the centre, inputs/suppliers on the left and customers/channels on the right —
// the same visual language as the public Dependency map, but editable. Add, drag,
// edit and delete nodes; the curved connectors redraw live. Saved to localStorage
// (mock persistence; a real backend/AWS replaces this later). Signed-in only.

const VM_BIZ_KEY = 'vm_business_map';
const BIZ = { blue:'#185FA5', coral:'#C0563B', teal:'#1D9E75', cust:'#0F6E56' };
const BIZ_NW = 158, BIZ_NH = 52;          // node card footprint (for layout + connectors)
const BIZ_H = 580;                        // canvas height (desktop)

// node.kind drives the colour + which column it lives in:
//   supplier  → left,  blue  (a direct company you depend on)
//   external  → left,  coral (a macro / non-company input: energy, materials…)
//   customer  → right, teal  (who buys from you / your channels)
const BIZ_KINDS = {
  supplier: { side:'in',  color:BIZ.blue,  label:'Supplier',        hint:'A company you depend on' },
  external: { side:'in',  color:BIZ.coral, label:'External factor',  hint:'Energy, materials, logistics…' },
  customer: { side:'out', color:BIZ.teal,  label:'Customer',         hint:'Who buys from you / your channels' },
};
const BIZ_RISK = {
  low:      { label:'Low',      color:'#1D9E75', bg:'rgba(29,158,117,0.12)' },
  medium:   { label:'Medium',   color:'#B8860B', bg:'rgba(184,134,11,0.12)' },
  high:     { label:'High',     color:'#C0563B', bg:'rgba(192,86,59,0.14)' },
  critical: { label:'Critical', color:'#8B1A1A', bg:'rgba(139,26,26,0.16)' },
};

let _bizSeq = 0;
const bizId = () => `n${Date.now().toString(36)}${(_bizSeq++).toString(36)}`;

// A small starter map so the canvas feels alive on first open (all placeholder).
function bizDefault() {
  return {
    company: { name:'Your Company', ticker:'YOU', meta:'PRIVATE · YOUR BUSINESS' },
    nodes: [
      { id:bizId(), kind:'supplier', name:'Key supplier',     ticker:'',  role:'Core component',   note:'Edit me — what they provide and the risk.', x:80,  y:120 },
      { id:bizId(), kind:'external', name:'Energy & power',    ticker:'',  role:'Operating input',  note:'A macro cost you depend on.',               x:80,  y:340 },
      { id:bizId(), kind:'customer', name:'Largest customer',  ticker:'',  role:'Revenue channel',  note:'Who buys from you, and how concentrated.',  x:600, y:150 },
      { id:bizId(), kind:'customer', name:'Distributor',       ticker:'',  role:'Reseller channel', note:'Indirect sales route.',                     x:600, y:360 },
    ],
  };
}
function loadBizMap() {
  try { const m = JSON.parse(localStorage.getItem(VM_BIZ_KEY)); if (m && m.company && Array.isArray(m.nodes)) return m; } catch {}
  return bizDefault();
}

const BIZ_STEPS = [
  { sel:'[data-tour="vm-biz-toolbar"]',
    title:'Build your map.',
    body:'Use + Supplier, + External, and + Customer to add nodes. Clear wipes all nodes; Reset restores the starter example. Save map writes to localStorage so your map persists across sessions.' },
  { sel:'[data-tour="vm-biz-canvas"]',
    title:'The drag canvas.',
    body:'Nodes live here. Drag any node to reposition it — the curved connectors redraw live. Click a node to select it and edit it in the panel on the right. Click empty space to deselect.' },
  { sel:'[data-tour="vm-biz-centre"]',
    title:'Your company — the principle.',
    body:'The green square is your business. Click it to set your company name, ticker, and a short description. Every connector radiates from here: inputs on the left, outputs on the right.' },
  { sel:'[data-tour="vm-biz-editor"]',
    title:'The editor panel.',
    body:'Selecting any node opens its fields here — label, role, and a short note. You can also delete a node from this panel. The counts at the top show how many inputs and customers you have mapped.' },
  { sel:'[data-tour="vm-biz-legend"]',
    title:'Reading the colours.',
    body:'Blue left-border = supplier or input company. Coral left-border = external factor (macro, regulation, energy). Teal right-border = customer or channel. Green box = your principle.' },
];

function MyBusiness({ go, user, isMobile }) {
  const [map, setMap]   = React.useState(loadBizMap);
  const [selId, setSelId] = React.useState(null);   // node id | 'company' | null
  const [savedAt, setSavedAt] = React.useState(null);
  const [dirty, setDirty] = React.useState(false);
  const [tutorialOpen, setTutorialOpen] = React.useState(false);
  const [isFull, setIsFull] = React.useState(false);
  const [fullRect, setFullRect] = React.useState(null);
  const [editorCollapsed, setEditorCollapsed] = React.useState(false);
  const [editorTab, setEditorTab] = React.useState('editor'); // 'editor' | 'analysis'
  const [signalsOpen, setSignalsOpen] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);
  const [confirmDialog, setConfirmDialog] = React.useState(null); // { message, onOk }
  const canvasRef = React.useRef(null);
  const [cw, setCw] = React.useState(900);          // measured canvas width
  const [ch, setCh] = React.useState(BIZ_H);        // measured canvas height
  const dragRef = React.useRef(null);               // { id, dx, dy, moved }

  // Measure the canvas so connectors + new-node placement track its real size.
  React.useEffect(() => {
    const measure = () => { const el = canvasRef.current; if (el) { setCw(el.clientWidth); setCh(el.clientHeight); } };
    measure();
    let ro; if (typeof ResizeObserver !== 'undefined' && canvasRef.current) { ro = new ResizeObserver(measure); ro.observe(canvasRef.current); }
    window.addEventListener('resize', measure);
    return () => { window.removeEventListener('resize', measure); if (ro) ro.disconnect(); };
  }, []);

  // Fullscreen: cover the #vm-main scroll area (same pattern as ScnLiveDemo).
  React.useEffect(() => {
    if (!isFull) { setFullRect(null); return; }
    const compute = () => {
      const main = document.getElementById('vm-main');
      const r = main && main.getBoundingClientRect();
      setFullRect(r ? { top:r.top, left:r.left, width:r.width, height:r.height }
                    : { top:0, left:0, width:window.innerWidth, height:window.innerHeight });
    };
    compute();
    const onKey = (e) => { if (e.key === 'Escape') setIsFull(false); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', compute);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('resize', compute); };
  }, [isFull]);

  // When canvas dimensions change, proportionally rescale all node positions so
  // they track the canvas the same way the principle node does (cx = cw/2).
  const prevDimsRef = React.useRef({ cw: 0, ch: 0 });
  React.useEffect(() => {
    if (!cw || !ch) return;
    const prev = prevDimsRef.current;
    const prevCw = prev.cw || cw;   // first measurement: ratio = 1, no movement
    const prevCh = prev.ch || ch;
    prevDimsRef.current = { cw, ch };
    if (prevCw === cw && prevCh === ch) return;
    setMap(m => ({
      ...m,
      nodes: m.nodes.map(n => ({
        ...n,
        x: Math.max(16, Math.min(cw - BIZ_NW - 16, Math.round(n.x * cw / prevCw))),
        y: Math.max(32, Math.min(ch - BIZ_NH - 16, Math.round(n.y * ch / prevCh))),
      })),
    }));
  }, [cw, ch]);

  const mark = () => setDirty(true);
  const patchNode = (id, patch) => { setMap(m => ({ ...m, nodes: m.nodes.map(n => n.id === id ? { ...n, ...patch } : n) })); mark(); };
  const patchCompany = (patch) => { setMap(m => ({ ...m, company: { ...m.company, ...patch } })); mark(); };
  const removeNode = (id) => { setMap(m => ({ ...m, nodes: m.nodes.filter(n => n.id !== id) })); setSelId(s => s === id ? null : s); mark(); };

  const cx = cw / 2, cy = ch / 2;
  const addNode = (kind) => {
    const side = BIZ_KINDS[kind].side;
    const sameSide = map.nodes.filter(n => BIZ_KINDS[n.kind].side === side).length;
    const x = side === 'in' ? Math.max(16, cw * 0.10) : Math.min(cw - BIZ_NW - 16, cw * 0.72);
    const y = 70 + (sameSide % 4) * (BIZ_NH + 30);
    const n = { id:bizId(), kind, name: kind === 'customer' ? 'New customer' : 'New input', ticker:'', role:'', note:'', x, y };
    setMap(m => ({ ...m, nodes: [...m.nodes, n] }));
    setSelId(n.id); mark();
  };

  const save  = () => { try { localStorage.setItem(VM_BIZ_KEY, JSON.stringify(map)); setSavedAt(Date.now()); setDirty(false); } catch {} };
  const reset = () => setConfirmDialog({ message:'Reset the map to the starter example? Your current map will be lost.', onOk:() => { const d = bizDefault(); setMap(d); setSelId(null); mark(); } });
  const clear = () => setConfirmDialog({ message:'Remove all nodes? The centre company stays.', onOk:() => { setMap(m => ({ ...m, nodes:[] })); setSelId(null); mark(); } });
  const tidy  = () => {
    const PAD_TOP = 40, PAD_BOT = 20;
    const inNodes  = map.nodes.filter(n => BIZ_KINDS[n.kind].side === 'in');
    const outNodes = map.nodes.filter(n => BIZ_KINDS[n.kind].side === 'out');
    const arrange  = (nodes, xPos) => {
      const count = nodes.length;
      if (count === 0) return [];
      const usable = ch - PAD_TOP - PAD_BOT - BIZ_NH;
      return nodes.map((n, i) => ({
        ...n, x: xPos,
        y: count === 1 ? Math.round(ch / 2 - BIZ_NH / 2) : Math.round(PAD_TOP + i * usable / (count - 1)),
      }));
    };
    const xIn  = Math.max(16, cw * 0.10);
    const xOut = Math.min(cw - BIZ_NW - 16, cw * 0.72);
    setMap(m => ({ ...m, nodes: [...arrange(inNodes, xIn), ...arrange(outNodes, xOut)] }));
    mark();
  };

  // ── Drag (desktop canvas) ──────────────────────────────────────────────────
  const onNodeDown = (e, n) => {
    e.stopPropagation();
    setSelId(n.id);
    const el = canvasRef.current; const r = el.getBoundingClientRect();
    dragRef.current = { id:n.id, dx: e.clientX - r.left - n.x, dy: e.clientY - r.top - n.y, moved:false };
    if (e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onNodeMove = (e) => {
    const d = dragRef.current; if (!d) return;
    const r = canvasRef.current.getBoundingClientRect();
    let x = e.clientX - r.left - d.dx, y = e.clientY - r.top - d.dy;
    x = Math.max(16, Math.min(cw - BIZ_NW - 16, x));
    y = Math.max(32, Math.min(ch - BIZ_NH - 16, y));
    d.moved = true;
    setMap(m => ({ ...m, nodes: m.nodes.map(nn => nn.id === d.id ? { ...nn, x, y } : nn) }));
  };
  const onNodeUp = () => { if (dragRef.current && dragRef.current.moved) mark(); dragRef.current = null; };

  // Connector path from a node to the centre company (curved, bipartite).
  const pathFor = (n) => {
    const k = BIZ_KINDS[n.kind];
    const ncx = n.x + BIZ_NW / 2, ncy = n.y + BIZ_NH / 2;
    const attach = k.side === 'in' ? { x: cx - 78, y: cy } : { x: cx + 78, y: cy };
    const midX = (ncx + attach.x) / 2;
    return { d:`M${ncx},${ncy} C${midX},${ncy} ${midX},${attach.y} ${attach.x},${attach.y}`, color:k.color };
  };

  const sel = selId === 'company' ? 'company' : map.nodes.find(n => n.id === selId) || null;
  const counts = { in: map.nodes.filter(n => BIZ_KINDS[n.kind].side === 'in').length,
                   out: map.nodes.filter(n => BIZ_KINDS[n.kind].side === 'out').length };
  const KIND_ORDER = { supplier:0, external:1, customer:2 };
  const sortedNodes = [...map.nodes].sort((a, b) =>
    (KIND_ORDER[a.kind] - KIND_ORDER[b.kind]) || (a.name||'').localeCompare(b.name||''));

  return (
    <div style={{ padding: isMobile ? '16px 16px 90px' : '26px 32px 60px', maxWidth:1240, margin:'0 auto' }}>
      <Kicker tone="rust">My Business · dependency map</Kicker>
      <h1 style={{ fontFamily:VM.serif, fontWeight:700, fontSize: isMobile ? 27 : 34, lineHeight:1.05, margin:'8px 0 0' }}>Build your map.</h1>
      <p style={{ fontFamily:VM.serif, fontSize: isMobile ? 15 : 16, color:VM.ink2, maxWidth:660, margin:'8px 0 0' }}>
        Put your business at the centre and chart who you <i>depend on</i> and who <i>depends on you</i>.
        {isMobile ? ' Tap a node to edit it.' : ' Drag nodes to arrange them, click to edit — the connectors redraw as you go.'}
      </p>

      {/* toolbar */}
      <div data-tour="vm-biz-toolbar" style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginTop:18 }}>
        <BizBtn icon="plus" onClick={()=>addNode('supplier')}>Supplier</BizBtn>
        <BizBtn icon="plus" onClick={()=>addNode('external')}>External</BizBtn>
        <BizBtn icon="plus" onClick={()=>addNode('customer')}>Customer</BizBtn>
        <span style={{ width:1, height:20, background:VM.border, margin:'0 2px' }}></span>
        <BizBtn icon="layout-distribute-vertical" onClick={tidy} tone="muted">Tidy</BizBtn>
        <BizBtn icon="trash" onClick={clear} tone="muted">Clear</BizBtn>
        <BizBtn icon="refresh" onClick={reset} tone="muted">Reset</BizBtn>
        <span style={{ width:1, height:20, background:VM.border, margin:'0 2px' }}></span>
        <BizBtn icon="news" onClick={()=>setSignalsOpen(true)}>Signals</BizBtn>
        <BizBtn icon="file-import" onClick={()=>setImportOpen(true)}>Import</BizBtn>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:10 }}>
          {savedAt && !dirty && <Mono size={10} color={VM.upInk}><i className="ti ti-circle-check-filled" style={{ fontSize:12, verticalAlign:'-2px', marginRight:4 }}></i>Saved</Mono>}
          {dirty && <Mono size={10} color={VM.terra}>Unsaved changes</Mono>}
          <button onClick={()=>setTutorialOpen(true)} title="Interactive tutorial — learn this page"
            style={{ display:'inline-flex', alignItems:'center', gap:6, fontFamily:VM.mono, fontSize:10,
              letterSpacing:'0.04em', textTransform:'uppercase', padding:'7px 12px', borderRadius:8, flexShrink:0,
              border:`1px solid ${VM.terra}`, background:'transparent', color:VM.terra, cursor:'pointer' }}>
            <i className="ti ti-graduation-cap" style={{ fontSize:12 }}></i>Tutorial
          </button>
          <button onClick={save} style={{ display:'inline-flex', alignItems:'center', gap:7, fontFamily:VM.mono, fontSize:11, fontWeight:700,
            letterSpacing:'0.04em', textTransform:'uppercase', padding:'8px 16px', borderRadius:8, cursor:'pointer',
            border:`1px solid ${VM.forest}`, background:VM.forest, color:VM.paperWarm }}>
            <i className="ti ti-device-floppy" style={{ fontSize:14 }}></i>Save map
          </button>
        </div>
      </div>

      {isMobile ? (
        <BizMobile map={map} selId={selId} setSelId={setSelId} patchNode={patchNode} patchCompany={patchCompany} removeNode={removeNode} />
      ) : (
        <div style={isFull && fullRect
          ? { position:'fixed', top:fullRect.top, left:fullRect.left, width:fullRect.width, height:fullRect.height,
              zIndex:30, background:VM.paperWarm, display:'flex', flexDirection:'column', boxSizing:'border-box' }
          : { marginTop:16 }}>

          {/* ── fullscreen dashboard toolbar ── */}
          {isFull && (
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', padding:'10px 16px',
              borderBottom:`1px solid ${VM.borderSoft}`, flexShrink:0, background:VM.paperWarm }}>
              <BizBtn icon="plus" onClick={()=>addNode('supplier')}>Supplier</BizBtn>
              <BizBtn icon="plus" onClick={()=>addNode('external')}>External</BizBtn>
              <BizBtn icon="plus" onClick={()=>addNode('customer')}>Customer</BizBtn>
              <span style={{ width:1, height:20, background:VM.border, margin:'0 2px' }}></span>
              <BizBtn icon="layout-distribute-vertical" onClick={tidy} tone="muted">Tidy</BizBtn>
              <BizBtn icon="trash" onClick={clear} tone="muted">Clear</BizBtn>
              <BizBtn icon="refresh" onClick={reset} tone="muted">Reset</BizBtn>
              <span style={{ width:1, height:20, background:VM.border, margin:'0 2px' }}></span>
              <BizBtn icon="news" onClick={()=>setSignalsOpen(true)}>Signals</BizBtn>
              <BizBtn icon="file-import" onClick={()=>setImportOpen(true)}>Import</BizBtn>
              <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:10 }}>
                {savedAt && !dirty && <Mono size={10} color={VM.upInk}><i className="ti ti-circle-check-filled" style={{ fontSize:12, verticalAlign:'-2px', marginRight:4 }}></i>Saved</Mono>}
                {dirty && <Mono size={10} color={VM.terra}>Unsaved changes</Mono>}
                <button onClick={save} style={{ display:'inline-flex', alignItems:'center', gap:7, fontFamily:VM.mono, fontSize:11, fontWeight:700,
                  letterSpacing:'0.04em', textTransform:'uppercase', padding:'7px 14px', borderRadius:8, cursor:'pointer',
                  border:`1px solid ${VM.forest}`, background:VM.forest, color:VM.paperWarm }}>
                  <i className="ti ti-device-floppy" style={{ fontSize:13 }}></i>Save map
                </button>
                <button onClick={()=>setIsFull(false)} title="Exit full screen (Esc)"
                  style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:32, height:32, borderRadius:8,
                    border:`1px solid ${VM.borderSoft}`, background:'transparent', color:VM.ink3, cursor:'pointer' }}>
                  <i className="ti ti-arrows-minimize" style={{ fontSize:15 }}></i>
                </button>
              </div>
            </div>
          )}

          {/* ── canvas + editor grid ── */}
          <div style={isFull
            ? { display:'grid', gridTemplateColumns:`1fr ${editorCollapsed ? '36px' : '300px'}`, gridTemplateRows:'1fr', gap:16, padding:16, flex:1, minHeight:0, boxSizing:'border-box', overflow:'hidden', transition:'grid-template-columns .18s ease' }
            : { display:'grid', gridTemplateColumns:`1fr ${editorCollapsed ? '36px' : '300px'}`, gap:16, alignItems:'start', transition:'grid-template-columns .18s ease' }}>
          {/* ── canvas ── */}
          <div data-tour="vm-biz-canvas" ref={canvasRef} onPointerMove={onNodeMove} onPointerUp={onNodeUp} onClick={()=>setSelId(null)}
            style={{ position:'relative', height: isFull ? '100%' : BIZ_H,
              background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:14, overflow:'hidden',
              backgroundImage:`radial-gradient(${VM.borderHair} 1px, transparent 1px)`, backgroundSize:'22px 22px' }}>
            {/* connectors */}
            <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:0 }}>
              <defs>
                {[['biz-blue', BIZ.blue],['biz-coral', BIZ.coral],['biz-teal', BIZ.teal]].map(([id,c]) => (
                  <marker key={id} id={id} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill={c} /></marker>
                ))}
              </defs>
              {sortedNodes.map(n => {
                const p = pathFor(n);
                const mk = n.kind === 'supplier' ? 'url(#biz-blue)' : n.kind === 'external' ? 'url(#biz-coral)' : 'url(#biz-teal)';
                return <path key={n.id} d={p.d} stroke={p.color} strokeWidth={selId === n.id ? 2.4 : 1.2} fill="none" opacity={selId === n.id ? 0.95 : 0.4} markerEnd={mk} />;
              })}
            </svg>

            {/* centre — your company */}
            <div data-tour="vm-biz-centre" onClick={(e)=>{ e.stopPropagation(); setSelId('company'); }}
              style={{ position:'absolute', left:cx, top:cy, transform:'translate(-50%,-50%)', width:158, minHeight:158,
                borderRadius:14, background:VM.forest, cursor:'pointer', zIndex:3,
                boxShadow: selId === 'company' ? `0 0 0 3px ${VM.tealTint2}, 0 10px 26px rgba(31,29,26,0.22)` : '0 8px 22px rgba(31,29,26,0.18)',
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:16 }}>
              <div style={{ fontFamily:VM.mono, fontSize:8, color:'#9FE1CB', letterSpacing:'1px', textTransform:'uppercase', marginBottom:5 }}>{map.company.meta || 'YOUR BUSINESS'}</div>
              <div style={{ fontFamily:VM.serif, fontSize:19, fontWeight:600, color:'#E1F5EE', lineHeight:1.2 }}>{map.company.name || 'Your Company'}</div>
              <div style={{ fontFamily:VM.mono, fontSize:9, color:'#5DCAA5', marginTop:4 }}>{map.company.ticker || '—'} · the principle</div>
              <div style={{ fontFamily:VM.mono, fontSize:7.5, color:'#9FE1CB', letterSpacing:'0.5px', textTransform:'uppercase', marginTop:8, opacity:.85 }}><i className="ti ti-pencil" style={{ fontSize:9 }}></i> click to edit</div>
            </div>

            {/* nodes */}
            {sortedNodes.map(n => {
              const k = BIZ_KINDS[n.kind]; const on = selId === n.id;
              const edge = k.side === 'out' ? { borderRight:`3px solid ${k.color}` } : { borderLeft:`3px solid ${k.color}` };
              return (
                <div key={n.id} onPointerDown={(e)=>onNodeDown(e, n)} onClick={(e)=>e.stopPropagation()}
                  style={{ position:'absolute', left:n.x, top:n.y, width:BIZ_NW, minHeight:BIZ_NH, boxSizing:'border-box',
                    padding:'7px 11px', borderRadius:8, background: on ? VM.paperWarm : VM.paper, border:`1px solid ${VM.border}`, ...edge,
                    cursor:'grab', zIndex: on ? 6 : 2, textAlign: k.side === 'out' ? 'right' : 'left', touchAction:'none',
                    boxShadow: on ? '0 8px 20px rgba(31,29,26,0.16)' : '0 1px 3px rgba(31,29,26,0.06)' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent: k.side==='out'?'flex-end':'flex-start', gap:5 }}>
                    <div style={{ fontFamily:VM.mono, fontSize:11, fontWeight:600, color:VM.ink, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {n.ticker || k.label.toUpperCase()} {n.role && <span style={{ fontSize:8.5, color:VM.ink3, fontWeight:400 }}>· {n.role.split(' ')[0].toLowerCase()}</span>}
                    </div>
                    {n.riskTier && BIZ_RISK[n.riskTier] && (
                      <span title={BIZ_RISK[n.riskTier].label + ' risk'} style={{ flexShrink:0, width:6, height:6, borderRadius:999, background:BIZ_RISK[n.riskTier].color }}></span>
                    )}
                  </div>
                  <div style={{ fontFamily:VM.serif, fontSize:11, color:VM.ink3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{n.name}</div>
                </div>
              );
            })}

            {/* empty hint */}
            {map.nodes.length === 0 && (
              <div style={{ position:'absolute', left:16, top:16, fontFamily:VM.mono, fontSize:10, color:VM.faint }}>
                Add a supplier, external factor or customer to begin →
              </div>
            )}
            {/* fullscreen toggle — shown only in normal mode */}
            {!isFull && (
              <button onClick={(e)=>{ e.stopPropagation(); setIsFull(true); }}
                title="Full screen"
                style={{ position:'absolute', top:8, right:8, zIndex:10, display:'inline-flex', alignItems:'center', justifyContent:'center',
                  width:30, height:30, borderRadius:7, border:`1px solid ${VM.borderSoft}`, background:VM.paper, color:VM.ink3, cursor:'pointer' }}>
                <i className="ti ti-arrows-maximize" style={{ fontSize:15 }}></i>
              </button>
            )}

            {/* column hints */}
            <div style={{ position:'absolute', left:16, top:12, fontFamily:VM.mono, fontSize:9, color:VM.ink3, letterSpacing:'0.5px', textTransform:'uppercase' }}>Inputs · dependencies</div>
            <div style={{ position:'absolute', right:46, top:12, fontFamily:VM.mono, fontSize:9, color:VM.ink3, letterSpacing:'0.5px', textTransform:'uppercase' }}>Customers · channels</div>
          </div>

          {/* ── editor panel ── */}
          <div data-tour="vm-biz-editor" style={{ position:'relative', minWidth:0,
            ...(isFull ? { display:'flex', flexDirection:'column', height:'100%', minHeight:0 } : {}) }}>
            {editorCollapsed ? (
              /* collapsed strip */
              <div onClick={()=>setEditorCollapsed(false)}
                style={{ background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:14,
                  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, cursor:'pointer',
                  ...(isFull ? { flex:1 } : { height:BIZ_H }) }}>
                <i className="ti ti-chevron-left" style={{ fontSize:14, color:VM.ink3 }}></i>
                <span style={{ fontFamily:VM.mono, fontSize:8.5, color:VM.terra, letterSpacing:'0.1em', textTransform:'uppercase',
                  writingMode:'vertical-rl', transform:'rotate(180deg)' }}>Editor</span>
              </div>
            ) : (
              /* expanded panel */
              <div style={{ background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:14,
                display:'flex', flexDirection:'column',
                ...(isFull ? { flex:1, minHeight:0 } : {}) }}>
                {/* tab bar */}
                <div style={{ display:'flex', alignItems:'center', padding:'8px 10px 0', gap:4, flexShrink:0, borderBottom:`1px solid ${VM.borderHair}` }}>
                  {[['editor','Editor'],['analysis','Analysis'],['impact','Principle Impact']].map(([t,lbl]) => {
                    const on = editorTab === t;
                    return (
                      <button key={t} onClick={()=>setEditorTab(t)} style={{
                        fontFamily:VM.mono, fontSize:9.5, letterSpacing:'0.06em', textTransform:'uppercase',
                        padding:'5px 11px 7px', borderRadius:'6px 6px 0 0', cursor:'pointer',
                        border:'none', borderBottom: on ? `2px solid ${VM.terra}` : '2px solid transparent',
                        background:'transparent', color: on ? VM.terra : VM.ink3, fontWeight: on ? 700 : 400 }}>
                        {lbl}
                      </button>
                    );
                  })}
                  <button onClick={()=>setEditorCollapsed(true)} title="Collapse panel"
                    style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:24, height:24,
                      borderRadius:6, border:`1px solid ${VM.borderSoft}`, background:'transparent', color:VM.ink3, cursor:'pointer', marginLeft:'auto', marginBottom:4 }}>
                    <i className="ti ti-chevron-right" style={{ fontSize:12 }}></i>
                  </button>
                </div>
                <div style={{ ...(isFull ? { flex:1, minHeight:0, overflowY:'auto' } : {}) }}>
                  {editorTab === 'editor'
                    ? <BizEditor sel={sel} company={map.company} patchNode={patchNode} patchCompany={patchCompany}
                        removeNode={removeNode} counts={counts} onClose={()=>setSelId(null)} hideLabel />
                    : editorTab === 'analysis'
                    ? <BizAnalysis map={map} />
                    : <BizImpact map={map} company={map.company} />
                  }
                </div>
              </div>
            )}
          </div>
          </div>{/* end canvas+editor grid */}
        </div>
      )}

      {/* legend */}
      <div data-tour="vm-biz-legend" style={{ display:'flex', gap:16, flexWrap:'wrap', marginTop:14 }}>
        {[['Supplier (company)', BIZ.blue, 'left'],['External factor', BIZ.coral, 'left'],['The principle', VM.forest, 'box'],['Customer / channel', BIZ.cust, 'right']].map(([lbl, c, kind]) => (
          <div key={lbl} style={{ display:'flex', alignItems:'center', gap:6, fontFamily:VM.serif, fontSize:11, color:VM.ink3 }}>
            <span style={{ width:11, height:11, border:`1px solid ${VM.border}`, background: kind==='box' ? c : VM.paper, borderRadius: kind==='box'?3:0,
              ...(kind==='left' ? { borderLeft:`3px solid ${c}` } : kind==='right' ? { borderRight:`3px solid ${c}` } : {}) }}></span>{lbl}
          </div>
        ))}
        <span style={{ marginLeft:'auto', fontFamily:VM.mono, fontSize:9.5, color:VM.faint }}>saved locally · mock — your real map will sync to your account</span>
      </div>

      {signalsOpen && <BizSignals map={map} company={map.company} onClose={()=>setSignalsOpen(false)} />}
      {importOpen && <BizImport existingNodes={map.nodes} onClose={()=>setImportOpen(false)} onImport={nodes=>{ setMap(m=>({ ...m, nodes:[...m.nodes, ...nodes] })); mark(); setImportOpen(false); }} />}

      {confirmDialog && (
        <div style={{ position:'fixed', inset:0, zIndex:60, display:'flex', alignItems:'center', justifyContent:'center',
          background:'rgba(31,29,26,0.55)', backdropFilter:'blur(3px)' }}
          onClick={()=>setConfirmDialog(null)}>
          <div onClick={e=>e.stopPropagation()} style={{ background:VM.paperWarm, border:`1px solid ${VM.border}`, borderRadius:16,
            boxShadow:'0 8px 40px rgba(31,29,26,0.22)', padding:'28px 28px 22px', maxWidth:360, width:'calc(100% - 40px)' }}>
            <p style={{ fontFamily:VM.serif, fontSize:15, color:VM.ink, lineHeight:1.5, margin:0 }}>{confirmDialog.message}</p>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:22 }}>
              <button onClick={()=>setConfirmDialog(null)}
                style={{ fontFamily:VM.mono, fontSize:10.5, letterSpacing:'0.04em', textTransform:'uppercase',
                  padding:'8px 18px', borderRadius:8, border:`1px solid ${VM.border}`, background:'transparent', color:VM.ink3, cursor:'pointer' }}>
                Cancel
              </button>
              <button onClick={()=>{ confirmDialog.onOk(); setConfirmDialog(null); }}
                style={{ fontFamily:VM.mono, fontSize:10.5, letterSpacing:'0.04em', textTransform:'uppercase',
                  padding:'8px 18px', borderRadius:8, border:`1px solid ${VM.terra}`, background:VM.terra, color:'#fff', cursor:'pointer' }}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {tutorialOpen && <TutorialOverlay steps={BIZ_STEPS} label="Dependency map tutorial" onClose={()=>setTutorialOpen(false)} />}
    </div>
  );
}

function downloadTemplate() {
  const XLSX = window.XLSX;
  if (!XLSX) { alert('Spreadsheet library not loaded yet — please try again in a moment.'); return; }

  const custHeaders = [['Name','Ticker','Role','Annual Revenue ($)','Revenue Concentration (%)','Contract Expiry','Risk (low/medium/high/critical)','Notes']];
  const custExample = [['Acme Corp','ACM','Largest direct customer','48000000','35','Dec 2026','medium','Renewal due Q4']];

  const inputHeaders = [['Type (Supplier / External Factor)','Name','Ticker','Role','Annual Spend ($)','Cost Concentration (%)','Contract Expiry','Risk (low/medium/high/critical)','Notes']];
  const inputExample = [['Supplier','Parts Co','PRT','Core components','12000000','22','Rolling','high','Single-source — explore alternatives']];

  const wb = XLSX.utils.book_new();

  const wsCust = XLSX.utils.aoa_to_sheet([...custHeaders, ...custExample]);
  wsCust['!cols'] = [18,10,22,20,22,16,28,30].map(w=>({ wch:w }));
  XLSX.utils.book_append_sheet(wb, wsCust, 'Customers');

  const wsInput = XLSX.utils.aoa_to_sheet([...inputHeaders, ...inputExample]);
  wsInput['!cols'] = [22,18,10,22,18,20,16,28,30].map(w=>({ wch:w }));
  XLSX.utils.book_append_sheet(wb, wsInput, 'Inputs');

  XLSX.writeFile(wb, 'veridian_business_map_template.xlsx');
}

const IMPORT_ERR = {
  required:        { label:'Required',         bg:'#FFDDDD', border:'#D63B3B', text:'#8B1A1A', dot:'#D63B3B' },
  invalid:         { label:'Invalid value',    bg:'#FFDDDD', border:'#D63B3B', text:'#8B1A1A', dot:'#D63B3B' },
  duplicate_file:  { label:'Duplicate (file)', bg:'#FFF2CC', border:'#C09B00', text:'#7A6000', dot:'#C09B00' },
  duplicate_map:   { label:'Already on map',   bg:'#FFF2CC', border:'#C09B00', text:'#7A6000', dot:'#C09B00' },
  number_format:   { label:'Not a number',     bg:'#FFF2CC', border:'#C09B00', text:'#7A6000', dot:'#C09B00' },
};

const CUST_HEADERS  = ['Name','Ticker','Role','Annual Revenue ($)','Revenue Concentration (%)','Contract Expiry','Risk (low/medium/high/critical)','Notes'];
const INPUT_HEADERS = ['Type (Supplier / External Factor)','Name','Ticker','Role','Annual Spend ($)','Cost Concentration (%)','Contract Expiry','Risk (low/medium/high/critical)','Notes'];

function validateSheet(rows, headers, kind, existingNames) {
  const cellErrors = {};
  const nameMap = {};
  const nameColIdx = kind === 'input' ? 1 : 0;
  const riskColIdx = headers.indexOf('Risk (low/medium/high/critical)');

  rows.forEach((row, ri) => {
    const name = (row[headers[nameColIdx]]||'').toString().trim();
    if (!name) {
      cellErrors[`${ri}-${nameColIdx}`] = { type:'required', message:'Name is required' };
    } else {
      const key = name.toLowerCase();
      if (!nameMap[key]) nameMap[key] = [];
      nameMap[key].push(ri);
      if (existingNames.has(key)) {
        cellErrors[`${ri}-${nameColIdx}`] = { type:'duplicate_map', message:`"${name}" already exists on your map` };
      }
    }
    const risk = (row[headers[riskColIdx]]||'').toString().toLowerCase().trim();
    if (risk && !BIZ_RISK[risk]) {
      cellErrors[`${ri}-${riskColIdx}`] = { type:'invalid', message:'Must be: low, medium, high, or critical' };
    }
    const numCols = kind === 'input'
      ? ['Annual Spend ($)', 'Cost Concentration (%)']
      : ['Annual Revenue ($)', 'Revenue Concentration (%)'];
    numCols.forEach(col => {
      const val = (row[col]||'').toString().replace(/[$,%\s]/g,'');
      if (val && isNaN(parseFloat(val))) {
        const ci = headers.indexOf(col);
        if (!cellErrors[`${ri}-${ci}`]) cellErrors[`${ri}-${ci}`] = { type:'number_format', message:'Should be a number' };
      }
    });
  });

  Object.values(nameMap).forEach(indices => {
    if (indices.length > 1) indices.forEach(ri => {
      if (!cellErrors[`${ri}-${nameColIdx}`])
        cellErrors[`${ri}-${nameColIdx}`] = { type:'duplicate_file', message:`Duplicate: appears ${indices.length} times in this sheet` };
    });
  });

  return cellErrors;
}

function parseFile(file, existingNodes, onResult, onError) {
  const XLSX = window.XLSX;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const wb = XLSX.read(e.target.result, { type:'array' });
      const existingCustNames  = new Set(existingNodes.filter(n=>n.kind==='customer').map(n=>(n.name||'').toLowerCase()));
      const existingInputNames = new Set(existingNodes.filter(n=>n.kind!=='customer').map(n=>(n.name||'').toLowerCase()));
      const sheets = [];

      if (wb.Sheets['Customers']) {
        const rows = XLSX.utils.sheet_to_json(wb.Sheets['Customers'], { defval:'' });
        sheets.push({ name:'Customers', kind:'customer', headers:CUST_HEADERS, rows, cellErrors: validateSheet(rows, CUST_HEADERS, 'customer', existingCustNames) });
      }
      if (wb.Sheets['Inputs']) {
        const rows = XLSX.utils.sheet_to_json(wb.Sheets['Inputs'], { defval:'' });
        sheets.push({ name:'Inputs', kind:'input', headers:INPUT_HEADERS, rows, cellErrors: validateSheet(rows, INPUT_HEADERS, 'input', existingInputNames) });
      }
      onResult(sheets);
    } catch(err) { onError(err.message); }
  };
  reader.onerror = () => onError('Could not read file.');
  reader.readAsArrayBuffer(file);
}

function buildNodes(sheets) {
  const nodes = [];
  sheets.forEach(sheet => {
    sheet.rows.forEach((row, ri) => {
      const blocking = Object.entries(sheet.cellErrors).some(([k,e]) => k.startsWith(`${ri}-`) && (e.type==='required'||e.type==='invalid'));
      if (blocking) return;
      if (sheet.kind === 'customer') {
        nodes.push({ id:bizId(), kind:'customer',
          name:(row['Name']||'').toString().trim(),
          ticker:(row['Ticker']||'').toString().trim().toUpperCase(),
          role:(row['Role']||'').toString().trim(),
          annualValue:(row['Annual Revenue ($)']||'').toString().trim(),
          concentration:(row['Revenue Concentration (%)']||'').toString().trim(),
          contractExpiry:(row['Contract Expiry']||'').toString().trim(),
          riskTier: BIZ_RISK[(row['Risk (low/medium/high/critical)']||'').toString().toLowerCase().trim()] ? (row['Risk (low/medium/high/critical)']).toString().toLowerCase().trim() : '',
          note:(row['Notes']||'').toString().trim(),
          x:600, y:100+nodes.filter(n=>n.kind==='customer').length*62,
        });
      } else {
        const typeRaw = (row['Type (Supplier / External Factor)']||'').toString().toLowerCase();
        const kind = typeRaw.includes('external') ? 'external' : 'supplier';
        nodes.push({ id:bizId(), kind,
          name:(row['Name']||'').toString().trim(),
          ticker:(row['Ticker']||'').toString().trim().toUpperCase(),
          role:(row['Role']||'').toString().trim(),
          annualValue:(row['Annual Spend ($)']||'').toString().trim(),
          concentration:(row['Cost Concentration (%)']||'').toString().trim(),
          contractExpiry:(row['Contract Expiry']||'').toString().trim(),
          riskTier: BIZ_RISK[(row['Risk (low/medium/high/critical)']||'').toString().toLowerCase().trim()] ? (row['Risk (low/medium/high/critical)']).toString().toLowerCase().trim() : '',
          note:(row['Notes']||'').toString().trim(),
          x:80, y:100+nodes.filter(n=>n.kind!=='customer').length*62,
        });
      }
    });
  });
  return nodes;
}

function BizImportPreview({ sheets, onConfirm, onBack }) {
  const [activeIdx, setActiveIdx] = React.useState(0);
  const sheet = sheets[activeIdx];

  const totalErrors   = sheets.reduce((s,sh)=>s+Object.values(sh.cellErrors).filter(e=>e.type==='required'||e.type==='invalid').length,0);
  const totalWarnings = sheets.reduce((s,sh)=>s+Object.values(sh.cellErrors).filter(e=>e.type==='duplicate_file'||e.type==='duplicate_map'||e.type==='number_format').length,0);
  const validCount    = sheets.reduce((s,sh)=>s+sh.rows.filter((_,ri)=>!Object.entries(sh.cellErrors).some(([k,e])=>k.startsWith(`${ri}-`)&&(e.type==='required'||e.type==='invalid'))).length,0);

  const cellStyle = (ri, ci) => {
    const key = `${ri}-${ci}`;
    const err = sheet.cellErrors[key];
    const base = { padding:'5px 10px', fontSize:12, fontFamily:'monospace', whiteSpace:'nowrap',
      borderRight:'1px solid #D0D7DE', borderBottom:'1px solid #D0D7DE', verticalAlign:'middle', position:'relative' };
    if (!err) return base;
    const s = IMPORT_ERR[err.type];
    return { ...base, background:s.bg, outline:`1.5px solid ${s.border}`, outlineOffset:'-1px' };
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:90, display:'flex', flexDirection:'column', background:'#F6F8FA' }}>

      {/* top bar */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 20px', flexShrink:0,
        background:'#24292F', borderBottom:'1px solid #30363D' }}>
        <i className="ti ti-table" style={{ fontSize:18, color:'#7EE7C8' }}></i>
        <div style={{ fontFamily:'monospace', fontSize:13, color:'#CDD9E5', fontWeight:700 }}>
          Import preview — {sheets.reduce((s,sh)=>s+sh.rows.length,0)} rows
        </div>
        {/* legend */}
        <div style={{ display:'flex', gap:10, marginLeft:16 }}>
          {[['required','Error'],['invalid','Error'],['duplicate_file','Duplicate'],['duplicate_map','On map'],['number_format','Format']].filter((v,i,a)=>a.findIndex(x=>x[1]===v[1])===i).map(([type,lbl]) => {
            const s = IMPORT_ERR[type];
            return (
              <div key={type} style={{ display:'flex', alignItems:'center', gap:5 }}>
                <div style={{ width:10, height:10, borderRadius:2, background:s.bg, border:`1.5px solid ${s.border}` }}></div>
                <span style={{ fontFamily:'monospace', fontSize:10, color:'#8B949E' }}>{lbl}</span>
              </div>
            );
          })}
        </div>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8 }}>
          {totalErrors > 0 && <span style={{ fontFamily:'monospace', fontSize:11, color:'#F47067', background:'rgba(244,112,103,0.15)', padding:'3px 9px', borderRadius:5 }}>
            {totalErrors} error{totalErrors!==1?'s':''} — rows skipped
          </span>}
          {totalWarnings > 0 && <span style={{ fontFamily:'monospace', fontSize:11, color:'#E3B341', background:'rgba(227,179,65,0.15)', padding:'3px 9px', borderRadius:5 }}>
            {totalWarnings} warning{totalWarnings!==1?'s':''}
          </span>}
          <button onClick={onBack} style={{ fontFamily:'monospace', fontSize:11, padding:'6px 14px', borderRadius:6,
            border:'1px solid #444C56', background:'transparent', color:'#CDD9E5', cursor:'pointer' }}>
            ← Back
          </button>
          <button onClick={onConfirm} style={{ fontFamily:'monospace', fontSize:11, fontWeight:700, padding:'6px 16px', borderRadius:6,
            border:'1px solid #2EA043', background:'#2EA043', color:'#fff', cursor:'pointer' }}>
            Import {validCount} valid row{validCount!==1?'s':''}
          </button>
        </div>
      </div>

      {/* sheet tabs */}
      <div style={{ display:'flex', gap:0, background:'#1C2128', borderBottom:'1px solid #30363D', flexShrink:0 }}>
        {sheets.map((s,i) => {
          const errCount  = Object.values(s.cellErrors).filter(e=>e.type==='required'||e.type==='invalid').length;
          const warnCount = Object.values(s.cellErrors).filter(e=>e.type!=='required'&&e.type!=='invalid').length;
          return (
            <button key={i} onClick={()=>setActiveIdx(i)} style={{ fontFamily:'monospace', fontSize:12,
              padding:'8px 20px', border:'none', borderRight:'1px solid #30363D', cursor:'pointer',
              background: activeIdx===i ? '#F6F8FA' : 'transparent',
              color: activeIdx===i ? '#24292F' : '#8B949E',
              display:'flex', alignItems:'center', gap:6 }}>
              {s.name}
              {errCount>0 && <span style={{ background:'#D63B3B', color:'#fff', borderRadius:4, padding:'1px 5px', fontSize:9 }}>{errCount}</span>}
              {warnCount>0 && <span style={{ background:'#C09B00', color:'#fff', borderRadius:4, padding:'1px 5px', fontSize:9 }}>{warnCount}</span>}
              {errCount===0&&warnCount===0 && <span style={{ color:'#2EA043', fontSize:12 }}>✓</span>}
            </button>
          );
        })}
      </div>

      {/* spreadsheet table */}
      <div style={{ flex:1, overflow:'auto' }}>
        <table style={{ borderCollapse:'collapse', minWidth:'100%' }}>
          <thead style={{ position:'sticky', top:0, zIndex:2 }}>
            <tr>
              <th style={{ padding:'6px 10px', background:'#2D333B', color:'#8B949E', fontFamily:'monospace', fontSize:11,
                borderRight:'1px solid #444C56', borderBottom:'2px solid #444C56', textAlign:'center', minWidth:38 }}>#</th>
              {sheet.headers.map((h,hi) => (
                <th key={hi} style={{ padding:'6px 12px', background:'#2D333B', color:'#CDD9E5', fontFamily:'monospace', fontSize:11,
                  borderRight:'1px solid #444C56', borderBottom:'2px solid #444C56', textAlign:'left', whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sheet.rows.map((row, ri) => {
              const rowHasError = Object.entries(sheet.cellErrors).some(([k,e])=>k.startsWith(`${ri}-`)&&(e.type==='required'||e.type==='invalid'));
              return (
                <tr key={ri} style={{ background: rowHasError ? '#FFF5F5' : ri%2===0 ? '#fff' : '#F6F8FA' }}>
                  <td style={{ padding:'5px 10px', fontFamily:'monospace', fontSize:11, color:'#8B949E', textAlign:'center',
                    borderRight:'1px solid #D0D7DE', borderBottom:'1px solid #D0D7DE', background: rowHasError ? '#FFE8E8' : '#F6F8FA',
                    fontWeight:600 }}>{ri+2}</td>
                  {sheet.headers.map((h, hi) => {
                    const key = `${ri}-${hi}`;
                    const err = sheet.cellErrors[key];
                    const s = err ? IMPORT_ERR[err.type] : null;
                    return (
                      <td key={hi} title={err?.message||''} style={cellStyle(ri,hi)}>
                        <span>{(row[h]||'').toString()}</span>
                        {err && (
                          <span title={err.message} style={{ display:'inline-flex', alignItems:'center', justifyContent:'center',
                            width:14, height:14, borderRadius:999, background:s.border, color:'#fff',
                            fontSize:9, fontWeight:700, fontFamily:'monospace', marginLeft:5, verticalAlign:'middle', cursor:'help', flexShrink:0 }}>
                            {err.type==='duplicate_file'||err.type==='duplicate_map'||err.type==='number_format' ? '!' : '✕'}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BizImport({ onClose, onImport, existingNodes }) {
  const [file, setFile] = React.useState(null);
  const [parseError, setParseError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [preview, setPreview] = React.useState(null); // sheets[] for error preview
  const fileRef = React.useRef(null);

  const handleUpload = () => {
    if (!file) return;
    setLoading(true); setParseError('');
    parseFile(file, existingNodes||[],
      sheets => {
        setLoading(false);
        const hasAnyIssue = sheets.some(s => Object.keys(s.cellErrors).length > 0);
        if (hasAnyIssue) {
          setPreview(sheets);
        } else {
          onImport(buildNodes(sheets));
        }
      },
      msg => { setLoading(false); setParseError(msg); }
    );
  };

  if (preview) {
    return (
      <BizImportPreview
        sheets={preview}
        onConfirm={() => onImport(buildNodes(preview))}
        onBack={() => setPreview(null)}
      />
    );
  }

  const STEPS = [
    { n:1, label:'Download the template', action: (
      <button onClick={downloadTemplate} style={{ display:'inline-flex', alignItems:'center', gap:7, fontFamily:VM.mono, fontSize:10.5,
        letterSpacing:'0.04em', textTransform:'uppercase', padding:'8px 16px', borderRadius:8, cursor:'pointer',
        border:`1px solid ${VM.forest}`, background:VM.forest, color:VM.paperWarm, marginTop:8 }}>
        <i className="ti ti-download" style={{ fontSize:13 }}></i>Download template
      </button>)},
    { n:2, label:'Complete the template', desc:'Fill in the Customers and Inputs tabs. Set Type = "External Factor" on any Inputs row to mark it as an external factor.' },
    { n:3, label:'Return here to upload', desc:'Come back to this screen and upload your completed file below.' },
  ];

  return (
    <div style={{ position:'fixed', inset:0, zIndex:80, display:'flex', alignItems:'center', justifyContent:'center',
      background:'rgba(31,29,26,0.60)', backdropFilter:'blur(4px)' }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:VM.paperWarm, border:`1px solid ${VM.border}`, borderRadius:18,
        boxShadow:'0 12px 48px rgba(31,29,26,0.28)', padding:'28px 28px 24px', maxWidth:480, width:'calc(100% - 32px)',
        display:'flex', flexDirection:'column' }}>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <i className="ti ti-file-import" style={{ fontSize:20, color:VM.terra }}></i>
            <div>
              <div style={{ fontFamily:VM.mono, fontSize:11, letterSpacing:'0.08em', textTransform:'uppercase', color:VM.terra }}>Import</div>
              <div style={{ fontFamily:VM.serif, fontSize:13, color:VM.ink3 }}>Bulk-add nodes from a spreadsheet</div>
            </div>
          </div>
          <button onClick={onClose} style={{ display:'inline-flex', alignItems:'center', justifyContent:'center',
            width:30, height:30, borderRadius:7, border:`1px solid ${VM.borderSoft}`, background:'transparent', color:VM.ink3, cursor:'pointer' }}>
            <i className="ti ti-x" style={{ fontSize:14 }}></i>
          </button>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
          {STEPS.map((s, i) => (
            <div key={s.n} style={{ display:'flex', gap:14, paddingBottom:18 }}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0 }}>
                <div style={{ width:32, height:32, borderRadius:999, background:VM.forest, color:'#F2EFE8',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontFamily:VM.mono, fontSize:13, fontWeight:700 }}>{s.n}</div>
                {i < STEPS.length-1 && <div style={{ width:1, flex:1, background:VM.borderSoft, marginTop:4 }}></div>}
              </div>
              <div style={{ paddingTop:5 }}>
                <div style={{ fontFamily:VM.serif, fontWeight:700, fontSize:14, color:VM.ink, marginBottom:3 }}>{s.label}</div>
                {s.desc && <div style={{ fontFamily:VM.serif, fontSize:12.5, color:VM.ink3, lineHeight:1.5 }}>{s.desc}</div>}
                {s.action}
              </div>
            </div>
          ))}
        </div>

        <div style={{ borderTop:`1px solid ${VM.borderSoft}`, paddingTop:18, marginTop:4 }}>
          <div onClick={()=>fileRef.current?.click()}
            style={{ border:`2px dashed ${file ? VM.forest : VM.border}`, borderRadius:10, padding:'16px 20px',
              textAlign:'center', cursor:'pointer', background: file ? 'rgba(29,158,117,0.06)' : VM.paper }}>
            <i className={`ti ti-${file ? 'circle-check' : 'upload'}`} style={{ fontSize:22, color: file ? VM.upInk : VM.ink3, display:'block', marginBottom:6 }}></i>
            <div style={{ fontFamily:VM.serif, fontSize:13, color: file ? VM.ink : VM.ink3 }}>
              {file ? file.name : 'Click to choose your completed template (.xlsx)'}
            </div>
          </div>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display:'none' }}
            onChange={e=>{ setFile(e.target.files[0]||null); setParseError(''); setPreview(null); }} />

          {parseError && <div style={{ fontFamily:VM.serif, fontSize:12, color:VM.downInk, marginTop:8 }}>{parseError}</div>}

          <button onClick={handleUpload} disabled={!file||loading}
            style={{ width:'100%', marginTop:12, display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              fontFamily:VM.mono, fontSize:11, fontWeight:700, letterSpacing:'0.04em', textTransform:'uppercase',
              padding:'11px 0', borderRadius:10, cursor: file&&!loading ? 'pointer' : 'not-allowed',
              border:`1px solid ${file&&!loading ? VM.forest : VM.border}`,
              background: file&&!loading ? VM.forest : VM.paper,
              color: file&&!loading ? '#F2EFE8' : VM.ink3 }}>
            <i className="ti ti-upload" style={{ fontSize:14 }}></i>
            {loading ? 'Validating…' : 'Upload & validate'}
          </button>
        </div>
      </div>
    </div>
  );
}

const SIGNALS_NEWS = {
  supplier: [
    'Reports strong quarterly earnings; capacity expansion planned.',
    'Supply disruption reported at main manufacturing site.',
    'Signed multi-year contract extension with key industrial partner.',
    'Faces regulatory scrutiny over environmental compliance.',
    'Announces major capex programme to double production capacity.',
    'Labour dispute causing partial output disruption.',
    'New CEO signals strategic pivot — supplier relationships under review.',
    'Logistics bottleneck impacting delivery lead times.',
  ],
  external: [
    'Prices up sharply on tight global inventory and demand surge.',
    'New regulation to take effect next quarter — compliance costs rising.',
    'Market participants expect supply normalisation in 12–18 months.',
    'Geopolitical tension in key producing region adds supply risk premium.',
    'Index tracking this factor up significantly in recent months.',
    'Analysts flag concentrated exposure as an emerging vulnerability.',
    'Policy shift may alter cost structure for dependent businesses.',
    'Seasonal volatility expected to persist through year-end.',
  ],
  customer: [
    'Revenue guidance raised — signals higher order volumes ahead.',
    'Expanding into new markets; procurement budget increased.',
    'Change in procurement leadership — contract renewal uncertain.',
    'Credit rating placed on watch negative.',
    'Strategic review underway; M&A activity could affect terms.',
    'Public statements suggest diversification of supplier base.',
    'Strong earnings beat — demand outlook positive for partners.',
    'Payment terms renegotiation signalled in latest filing.',
  ],
};

const RISK_TO_PRINCIPLE = {
  supplier: {
    critical: 'Single-source dependency — a disruption would halt operations directly.',
    high:     'High spend concentration — limited alternative sourcing in short timeframe.',
    medium:   'Moderate dependency — substitution possible but carries switching cost.',
    low:      'Non-critical input — alternatives readily available in market.',
  },
  external: {
    critical: 'Systemic exposure — movements here directly impair margins and cost base.',
    high:     'Significant cost driver — sharp moves would materially impact profitability.',
    medium:   'Moderate exposure — manageable through hedging or operational adjustment.',
    low:      'Minor cost sensitivity — limited direct impact on the principle.',
  },
  customer: {
    critical: 'Revenue-critical relationship — loss would materially impair the business.',
    high:     'High revenue concentration — churn or renegotiation risk is elevated.',
    medium:   'Meaningful revenue contributor — monitor for signs of disengagement.',
    low:      'Diversifiable revenue — limited concentration risk to the principle.',
  },
};

function seedPick(arr, seed, n) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  const start = Math.abs(h) % arr.length;
  return Array.from({ length: n }, (_, i) => arr[(start + i) % arr.length]);
}

function BizSignals({ map, company, onClose }) {
  const [kind, setKind] = React.useState('all');
  const nodes = map.nodes.filter(n => kind === 'all' || n.kind === kind);
  const principalName = company.name || 'Your Company';

  const KINDS = [['all','All'],['supplier','Suppliers'],['external','External'],['customer','Customers']];

  return (
    <div style={{ position:'fixed', inset:0, zIndex:70, display:'flex', flexDirection:'column',
      background:VM.paperWarm, boxSizing:'border-box' }}
      onKeyDown={e=>e.key==='Escape'&&onClose()}>

      {/* header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 24px',
        borderBottom:`1px solid ${VM.borderSoft}`, flexShrink:0, background:VM.paperWarm }}>
        <i className="ti ti-news" style={{ fontSize:18, color:VM.terra }}></i>
        <div>
          <div style={{ fontFamily:VM.mono, fontSize:11, letterSpacing:'0.08em', textTransform:'uppercase', color:VM.terra }}>Signals & Risk</div>
          <div style={{ fontFamily:VM.serif, fontSize:13, color:VM.ink3 }}>News and risk exposure to <span style={{ color:VM.ink, fontWeight:600 }}>{principalName}</span></div>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8 }}>
          {/* kind filter */}
          <div style={{ display:'flex', background:VM.paper, border:`1px solid ${VM.border}`, borderRadius:8, padding:3, gap:2 }}>
            {KINDS.map(([k,lbl]) => {
              const on = kind === k;
              const count = k === 'all' ? map.nodes.length : map.nodes.filter(n=>n.kind===k).length;
              return (
                <button key={k} onClick={()=>setKind(k)} style={{
                  fontFamily:VM.mono, fontSize:9.5, letterSpacing:'0.04em', textTransform:'uppercase',
                  padding:'5px 11px', borderRadius:6, border:'none', cursor:'pointer',
                  background: on ? VM.forest : 'transparent', color: on ? '#F2EFE8' : VM.ink3 }}>
                  {lbl} <span style={{ opacity:0.7 }}>{count}</span>
                </button>
              );
            })}
          </div>
          <button onClick={onClose} style={{ display:'inline-flex', alignItems:'center', justifyContent:'center',
            width:32, height:32, borderRadius:8, border:`1px solid ${VM.borderSoft}`, background:'transparent',
            color:VM.ink3, cursor:'pointer' }}>
            <i className="ti ti-x" style={{ fontSize:15 }}></i>
          </button>
        </div>
      </div>

      {/* node cards */}
      <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>
        {nodes.length === 0 && (
          <p style={{ fontFamily:VM.serif, fontSize:14, color:VM.ink3 }}>No nodes of this type yet. Add some from the toolbar.</p>
        )}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(340px, 1fr))', gap:14 }}>
          {nodes.map(n => {
            const k = BIZ_KINDS[n.kind];
            const news = seedPick(SIGNALS_NEWS[n.kind], n.id, 2);
            const riskInfo = n.riskTier ? BIZ_RISK[n.riskTier] : null;
            const riskText = n.riskTier ? RISK_TO_PRINCIPLE[n.kind]?.[n.riskTier] : null;
            return (
              <div key={n.id} style={{ background:VM.paper, border:`1px solid ${VM.borderSoft}`,
                borderLeft:`3px solid ${k.color}`, borderRadius:10, padding:'14px 16px' }}>

                {/* node header */}
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
                  <div>
                    <div style={{ fontFamily:VM.mono, fontSize:8.5, letterSpacing:'0.08em', textTransform:'uppercase',
                      color:k.color, marginBottom:3 }}>{k.label}</div>
                    <div style={{ fontFamily:VM.serif, fontWeight:700, fontSize:15, color:VM.ink, lineHeight:1.2 }}>
                      {n.name || 'Unnamed'}
                      {n.ticker && <span style={{ fontFamily:VM.mono, fontSize:10, fontWeight:400, color:VM.ink3, marginLeft:6 }}>{n.ticker}</span>}
                    </div>
                    {n.role && <div style={{ fontFamily:VM.serif, fontSize:12, color:VM.ink3, marginTop:2 }}>{n.role}</div>}
                  </div>
                  {riskInfo && (
                    <span style={{ fontFamily:VM.mono, fontSize:9, letterSpacing:'0.06em', textTransform:'uppercase',
                      padding:'3px 8px', borderRadius:5, background:riskInfo.bg, color:riskInfo.color, flexShrink:0, marginLeft:8, marginTop:2 }}>
                      {riskInfo.label}
                    </span>
                  )}
                </div>

                {/* risk to principle */}
                {riskText && (
                  <div style={{ background:VM.paperWarm, borderRadius:7, padding:'8px 10px', marginBottom:10,
                    borderLeft:`2px solid ${riskInfo.color}` }}>
                    <div style={{ fontFamily:VM.mono, fontSize:8.5, letterSpacing:'0.07em', textTransform:'uppercase',
                      color:VM.ink3, marginBottom:3 }}>Risk to {principalName}</div>
                    <div style={{ fontFamily:VM.serif, fontSize:12.5, color:VM.ink2, lineHeight:1.4 }}>{riskText}</div>
                  </div>
                )}

                {/* news */}
                <div style={{ fontFamily:VM.mono, fontSize:8.5, letterSpacing:'0.07em', textTransform:'uppercase',
                  color:VM.ink3, marginBottom:6 }}>Latest signals</div>
                {news.map((item, i) => (
                  <div key={i} style={{ display:'flex', gap:8, marginBottom: i < news.length-1 ? 7 : 0,
                    paddingBottom: i < news.length-1 ? 7 : 0, borderBottom: i < news.length-1 ? `1px solid ${VM.borderHair}` : 'none' }}>
                    <span style={{ width:5, height:5, borderRadius:999, background:k.color, flexShrink:0, marginTop:5 }}></span>
                    <span style={{ fontFamily:VM.serif, fontSize:13, color:VM.ink, lineHeight:1.45 }}>{item}</span>
                  </div>
                ))}

                {!riskText && (
                  <div style={{ marginTop:8, fontFamily:VM.serif, fontSize:11.5, color:VM.ink3, fontStyle:'italic' }}>
                    Set a risk tier in the Editor to see impact on {principalName}.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BizImpact({ map, company }) {
  const [kind, setKind] = React.useState('all');
  const principalName = company.name || 'Your Company';
  const KINDS = [['all','All'],['supplier','Sup.'],['external','Ext.'],['customer','Cust.']];
  const nodes = map.nodes.filter(n => kind === 'all' || n.kind === kind);

  return (
    <div style={{ padding:'10px 14px' }}>
      {/* filter pills */}
      <div style={{ display:'flex', gap:4, marginBottom:12, flexWrap:'wrap' }}>
        {KINDS.map(([k, lbl]) => {
          const on = kind === k;
          const count = k === 'all' ? map.nodes.length : map.nodes.filter(n=>n.kind===k).length;
          return (
            <button key={k} onClick={()=>setKind(k)} style={{
              fontFamily:VM.mono, fontSize:9, letterSpacing:'0.05em', textTransform:'uppercase',
              padding:'4px 9px', borderRadius:6, border:`1px solid ${on ? VM.forest : VM.border}`,
              background: on ? VM.forest : 'transparent', color: on ? '#F2EFE8' : VM.ink3, cursor:'pointer' }}>
              {lbl} {count}
            </button>
          );
        })}
      </div>

      {nodes.length === 0 && (
        <p style={{ fontFamily:VM.serif, fontSize:13, color:VM.ink3 }}>No nodes of this type yet.</p>
      )}

      {nodes.map(n => {
        const k = BIZ_KINDS[n.kind];
        const riskInfo = n.risk ? BIZ_RISK[n.risk] : null;
        const riskText = n.risk ? RISK_TO_PRINCIPLE[n.kind]?.[n.risk] : null;
        const news = seedPick(SIGNALS_NEWS[n.kind], n.id, 2);
        return (
          <div key={n.id} style={{ marginBottom:12, borderLeft:`3px solid ${k.color}`, paddingLeft:10,
            paddingBottom:12, borderBottom:`1px solid ${VM.borderHair}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
              <span style={{ fontFamily:VM.serif, fontWeight:700, fontSize:13, color:VM.ink }}>
                {n.name || 'Unnamed'}
              </span>
              {n.ticker && <span style={{ fontFamily:VM.mono, fontSize:9.5, color:VM.ink3 }}>{n.ticker}</span>}
              {riskInfo && (
                <span style={{ fontFamily:VM.mono, fontSize:8.5, padding:'2px 6px', borderRadius:4,
                  background:riskInfo.bg, color:riskInfo.color, marginLeft:'auto', flexShrink:0 }}>
                  {riskInfo.label}
                </span>
              )}
            </div>

            {riskText && (
              <div style={{ fontFamily:VM.serif, fontSize:12, color:VM.ink2, lineHeight:1.4,
                background:VM.paperWarm, borderRadius:6, padding:'6px 8px', marginBottom:6,
                borderLeft:`2px solid ${riskInfo.color}` }}>
                {riskText}
              </div>
            )}

            {news.map((item, i) => (
              <div key={i} style={{ display:'flex', gap:6, marginBottom: i < 1 ? 5 : 0 }}>
                <span style={{ width:4, height:4, borderRadius:999, background:k.color, flexShrink:0, marginTop:5 }}></span>
                <span style={{ fontFamily:VM.serif, fontSize:12, color:VM.ink, lineHeight:1.4 }}>{item}</span>
              </div>
            ))}

            {!riskText && (
              <div style={{ fontFamily:VM.serif, fontSize:11, color:VM.ink3, fontStyle:'italic', marginTop:4 }}>
                Set a risk tier to see impact on {principalName}.
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function BizAnalysis({ map }) {
  const nodes = map.nodes;
  const suppliers  = nodes.filter(n => n.kind === 'supplier');
  const externals  = nodes.filter(n => n.kind === 'external');
  const customers  = nodes.filter(n => n.kind === 'customer');

  // Revenue concentration: sum all customer concentration values
  const revConcs = customers.map(n => parseFloat(n.concentration)).filter(v => !isNaN(v));
  const totalConc = revConcs.reduce((a,b) => a+b, 0);
  const top3Conc  = [...revConcs].sort((a,b)=>b-a).slice(0,3).reduce((a,b)=>a+b,0);

  // Risk breakdown
  const riskCounts = {};
  nodes.forEach(n => { if (n.riskTier) riskCounts[n.riskTier] = (riskCounts[n.riskTier]||0) + 1; });

  // Named vs unnamed
  const named = nodes.filter(n => n.name && n.name !== 'New input' && n.name !== 'New customer').length;

  const Row = ({ label, value, sub, color }) => (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', padding:'7px 0', borderBottom:`1px solid ${VM.borderHair}` }}>
      <span style={{ fontFamily:VM.serif, fontSize:12.5, color:VM.ink2 }}>{label}</span>
      <span style={{ fontFamily:VM.mono, fontSize:13, fontWeight:700, color: color||VM.ink }}>
        {value}{sub && <span style={{ fontFamily:VM.mono, fontSize:10, fontWeight:400, color:VM.ink3, marginLeft:3 }}>{sub}</span>}
      </span>
    </div>
  );

  const Section = ({ title, children }) => (
    <div style={{ marginBottom:18 }}>
      <div style={{ fontFamily:VM.mono, fontSize:9, letterSpacing:'0.1em', textTransform:'uppercase', color:VM.ink3, marginBottom:6 }}>{title}</div>
      {children}
    </div>
  );

  return (
    <div style={{ padding:'14px 16px' }}>
      <Section title="Map completeness">
        <Row label="Total nodes" value={nodes.length} />
        <Row label="Named nodes" value={named} sub={`/ ${nodes.length}`} color={named===nodes.length ? VM.upInk : VM.terra} />
        <Row label="Inputs" value={suppliers.length + externals.length} sub={`(${suppliers.length} supplier, ${externals.length} external)`} />
        <Row label="Customers" value={customers.length} />
      </Section>

      <Section title="Revenue concentration">
        {revConcs.length > 0 ? (
          <>
            <Row label="Total mapped" value={`${Math.round(totalConc)}%`} color={totalConc > 80 ? VM.downInk : totalConc > 50 ? '#B8860B' : VM.upInk} />
            {revConcs.length >= 3 && <Row label="Top 3 customers" value={`${Math.round(top3Conc)}%`} color={top3Conc > 60 ? VM.downInk : '#B8860B'} />}
            <Row label="Customers with data" value={revConcs.length} sub={`/ ${customers.length}`} />
          </>
        ) : (
          <p style={{ fontFamily:VM.serif, fontSize:12, color:VM.ink3, margin:'4px 0' }}>
            Add revenue concentration (%) to your customer nodes to see this.
          </p>
        )}
      </Section>

      <Section title="Risk profile">
        {Object.keys(BIZ_RISK).some(r => riskCounts[r]) ? (
          Object.entries(BIZ_RISK).map(([key, r]) => riskCounts[key]
            ? <Row key={key} label={r.label} value={riskCounts[key]} sub="nodes" color={r.color} />
            : null)
        ) : (
          <p style={{ fontFamily:VM.serif, fontSize:12, color:VM.ink3, margin:'4px 0' }}>
            Tag nodes with a risk tier in the Editor to see breakdown here.
          </p>
        )}
      </Section>

      <Section title="Node coverage">
        {[['Suppliers',suppliers],['External factors',externals],['Customers',customers]].map(([lbl,arr]) => {
          const withRole = arr.filter(n=>n.role).length;
          const withNote = arr.filter(n=>n.note).length;
          if (!arr.length) return null;
          return (
            <div key={lbl} style={{ marginBottom:10 }}>
              <div style={{ fontFamily:VM.mono, fontSize:9, color:VM.ink3, marginBottom:3 }}>{lbl} ({arr.length})</div>
              <div style={{ display:'flex', gap:8 }}>
                {[['Role',withRole],['Note',withNote]].map(([f,count]) => {
                  const pct = Math.round(count/arr.length*100);
                  return (
                    <div key={f} style={{ flex:1, background:VM.paperWarm, borderRadius:7, padding:'6px 8px', border:`1px solid ${VM.borderHair}` }}>
                      <div style={{ fontFamily:VM.mono, fontSize:9, color:VM.ink3, marginBottom:3 }}>{f}</div>
                      <div style={{ height:4, background:VM.border, borderRadius:4 }}>
                        <div style={{ height:4, borderRadius:4, width:`${pct}%`, background: pct===100?VM.upInk : pct>50?'#B8860B':VM.terra }} />
                      </div>
                      <div style={{ fontFamily:VM.mono, fontSize:9, color:VM.ink3, marginTop:3 }}>{count}/{arr.length}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </Section>
    </div>
  );
}

// Small toolbar button.
function BizBtn({ icon, children, onClick, tone }) {
  const muted = tone === 'muted';
  return (
    <button onClick={onClick} style={{ display:'inline-flex', alignItems:'center', gap:6, fontFamily:VM.mono, fontSize:10.5,
      letterSpacing:'0.04em', textTransform:'uppercase', padding:'7px 12px', borderRadius:8, cursor:'pointer',
      border:`1px solid ${VM.border}`, background:VM.paper, color: muted ? VM.ink3 : VM.ink2 }}>
      <i className={'ti ti-'+icon} style={{ fontSize:13, color: muted ? VM.ink3 : VM.teal }}></i>{children}
    </button>
  );
}

// Reusable labelled text field for the editor.
function BizField({ label, value, onChange, placeholder, area }) {
  const common = { width:'100%', boxSizing:'border-box', fontFamily:VM.serif, fontSize:13.5, color:VM.ink,
    border:`1px solid ${VM.border}`, borderRadius:8, padding:'8px 10px', background:VM.paper, outline:'none' };
  return (
    <div style={{ marginBottom:11 }}>
      <Label style={{ display:'block', marginBottom:5, color:VM.ink3 }}>{label}</Label>
      {area
        ? <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={3} style={{ ...common, resize:'vertical', lineHeight:1.45 }} />
        : <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={common} />}
    </div>
  );
}

// The right-hand editor: edits the selected node, the company, or shows a prompt.
function BizEditor({ sel, company, patchNode, patchCompany, removeNode, counts, onClose, hideLabel }) {
  const card = hideLabel ? { padding:'12px 16px' } : { background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:14, padding:'15px 16px' };
  if (!sel) {
    return (
      <div style={{ ...card, position: hideLabel ? 'static' : 'sticky', top:14 }}>
        {!hideLabel && <Label style={{ color:VM.terra }}>Editor</Label>}
        <p style={{ fontFamily:VM.serif, fontSize:13.5, color:VM.ink2, lineHeight:1.5, marginTop: hideLabel ? 0 : 8 }}>
          Select the centre company or any node to edit it here. Use the buttons above to add suppliers, external factors and customers, then drag them into place.
        </p>
        <div style={{ marginTop:12, paddingTop:12, borderTop:`1px solid ${VM.borderHair}`, display:'flex', gap:18 }}>
          <div><Mono size={18} weight={700} color={VM.ink}>{counts.in}</Mono><Label style={{ display:'block', color:VM.ink3 }}>Inputs</Label></div>
          <div><Mono size={18} weight={700} color={VM.ink}>{counts.out}</Mono><Label style={{ display:'block', color:VM.ink3 }}>Customers</Label></div>
        </div>
      </div>
    );
  }
  if (sel === 'company') {
    return (
      <div style={{ ...card, position: hideLabel ? 'static' : 'sticky', top:14 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <Label style={{ color:VM.terra }}><i className="ti ti-building" style={{ fontSize:13, verticalAlign:'-2px', marginRight:5 }}></i>Your company</Label>
          <i className="ti ti-x" onClick={onClose} title="Close" style={{ fontSize:16, color:VM.ink3, cursor:'pointer' }}></i>
        </div>
        <BizField label="Company name" value={company.name} onChange={v=>patchCompany({ name:v })} placeholder="Your Company" />
        <BizField label="Ticker / short code" value={company.ticker} onChange={v=>patchCompany({ ticker:v.toUpperCase() })} placeholder="YOU" />
        <BizField label="Label (meta)" value={company.meta} onChange={v=>patchCompany({ meta:v.toUpperCase() })} placeholder="PRIVATE · YOUR BUSINESS" />
      </div>
    );
  }
  const k = BIZ_KINDS[sel.kind];
  return (
    <div style={{ ...card, position: hideLabel ? 'static' : 'sticky', top:14 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <Label style={{ color:VM.terra }}><span style={{ display:'inline-block', width:9, height:9, borderRadius:2, background:k.color, marginRight:6 }}></span>Edit node</Label>
        <i className="ti ti-x" onClick={onClose} title="Close" style={{ fontSize:16, color:VM.ink3, cursor:'pointer' }}></i>
      </div>

      {/* kind picker */}
      <Label style={{ display:'block', marginBottom:5, color:VM.ink3 }}>Type</Label>
      <div style={{ display:'flex', gap:5, marginBottom:14, flexWrap:'wrap' }}>
        {Object.entries(BIZ_KINDS).map(([key, kk]) => {
          const on = sel.kind === key;
          return (
            <button key={key} onClick={()=>patchNode(sel.id, { kind:key })} title={kk.hint} style={{
              fontFamily:VM.mono, fontSize:9.5, padding:'5px 9px', borderRadius:6, cursor:'pointer',
              border:`1px solid ${on ? kk.color : VM.border}`, background: on ? kk.color : VM.paper, color: on ? '#fff' : VM.ink2 }}>{kk.label}</button>
          );
        })}
      </div>

      <BizField label="Name" value={sel.name||''} onChange={v=>patchNode(sel.id, { name:v })} placeholder="Company or factor name" />
      <BizField label="Ticker (optional)" value={sel.ticker||''} onChange={v=>patchNode(sel.id, { ticker:v.toUpperCase() })} placeholder="e.g. TSM" />
      <BizField label="Role" value={sel.role||''} onChange={v=>patchNode(sel.id, { role:v })} placeholder={sel.kind==='customer' ? 'Revenue channel, distributor…' : sel.kind==='external' ? 'Category: energy, logistics, macro…' : 'What they supply to you'} />

      {/* ── Business details ── */}
      <div style={{ borderTop:`1px solid ${VM.borderHair}`, margin:'10px 0 12px', paddingTop:10 }}>
        <Mono size={9} color={VM.ink3} weight={600} style={{ letterSpacing:'0.08em', textTransform:'uppercase', display:'block', marginBottom:10 }}>Business details</Mono>
        {sel.kind !== 'external' && (
          <BizField label="Company number" value={sel.regNo||''} onChange={v=>patchNode(sel.id, { regNo:v })} placeholder="e.g. 12345678 / EIN 12-3456789" />
        )}
        <BizField label="Jurisdiction" value={sel.jurisdiction||''} onChange={v=>patchNode(sel.id, { jurisdiction:v })} placeholder="Country / territory of incorporation" />
        <BizField
          label={sel.kind==='customer' ? 'Annual revenue ($)' : sel.kind==='external' ? 'Estimated cost impact ($)' : 'Annual spend ($)'}
          value={sel.annualValue||''}
          onChange={v=>patchNode(sel.id, { annualValue:v })}
          placeholder="e.g. 48,000,000" />
        <BizField
          label={sel.kind==='customer' ? 'Revenue concentration (%)' : 'Cost concentration (%)'}
          value={sel.concentration||''}
          onChange={v=>patchNode(sel.id, { concentration:v })}
          placeholder="% of total" />
        {sel.kind !== 'external' && (
          <BizField label="Contract expiry" value={sel.contractExpiry||''} onChange={v=>patchNode(sel.id, { contractExpiry:v })} placeholder="e.g. Dec 2026 / rolling" />
        )}
      </div>

      {/* ── Risk ── */}
      <div style={{ borderTop:`1px solid ${VM.borderHair}`, margin:'2px 0 12px', paddingTop:10 }}>
        <Mono size={9} color={VM.ink3} weight={600} style={{ letterSpacing:'0.08em', textTransform:'uppercase', display:'block', marginBottom:8 }}>Risk tier</Mono>
        <div style={{ display:'flex', gap:5, marginBottom:12, flexWrap:'wrap' }}>
          {Object.entries(BIZ_RISK).map(([key, r]) => {
            const on = (sel.riskTier||'') === key;
            return (
              <button key={key} onClick={()=>patchNode(sel.id, { riskTier: on ? '' : key })} style={{
                fontFamily:VM.mono, fontSize:9.5, padding:'5px 10px', borderRadius:6, cursor:'pointer',
                border:`1px solid ${on ? r.color : VM.border}`, background: on ? r.bg : VM.paper, color: on ? r.color : VM.ink2,
                fontWeight: on ? 700 : 400 }}>{r.label}</button>
            );
          })}
        </div>
        <BizField label="Notes" value={sel.note||''} onChange={v=>patchNode(sel.id, { note:v })} placeholder="Dependency detail, single-source risk, ownership…" area />
      </div>

      <button onClick={()=>removeNode(sel.id)} style={{ display:'inline-flex', alignItems:'center', gap:6, fontFamily:VM.mono, fontSize:10.5,
        letterSpacing:'0.04em', textTransform:'uppercase', padding:'7px 12px', borderRadius:8, cursor:'pointer',
        border:`1px solid ${VM.border}`, background:VM.paper, color:VM.down }}>
        <i className="ti ti-trash" style={{ fontSize:13 }}></i>Delete node
      </button>
    </div>
  );
}

// Mobile fallback: no drag canvas — a stacked, tap-to-edit list per side plus the
// company editor. (Mobile polish is deferred; this keeps it fully functional.)
function BizMobile({ map, selId, setSelId, patchNode, patchCompany, removeNode }) {
  const Section = ({ title, kinds }) => {
    const ns = map.nodes.filter(n => kinds.includes(n.kind));
    return (
      <div style={{ marginTop:18 }}>
        <div style={{ fontFamily:VM.mono, fontSize:10, color:VM.ink3, letterSpacing:'0.5px', textTransform:'uppercase', marginBottom:8 }}>{title}</div>
        {ns.length === 0 && <Mono size={11} color={VM.faint}>None yet — add from the buttons above.</Mono>}
        {ns.map(n => {
          const k = BIZ_KINDS[n.kind]; const open = selId === n.id;
          return (
            <div key={n.id} style={{ border:`1px solid ${VM.border}`, borderLeft:`3px solid ${k.color}`, borderRadius:9, background: open ? VM.paperWarm : VM.paper, marginBottom:9, overflow:'hidden' }}>
              <div onClick={()=>setSelId(open ? null : n.id)} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 13px', cursor:'pointer' }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:VM.mono, fontSize:12.5, fontWeight:600, color:VM.ink }}>{n.ticker || k.label}</div>
                  <div style={{ fontFamily:VM.serif, fontSize:12.5, color:VM.ink3 }}>{n.name}</div>
                </div>
                <i className={'ti ti-chevron-'+(open?'up':'down')} style={{ fontSize:17, color:VM.ink3 }}></i>
              </div>
              {open && (
                <div style={{ padding:'4px 13px 13px', borderTop:`1px solid ${VM.borderHair}` }}>
                  <div style={{ marginTop:10 }} />
                  <BizField label="Name" value={n.name} onChange={v=>patchNode(n.id, { name:v })} />
                  <BizField label="Ticker (optional)" value={n.ticker} onChange={v=>patchNode(n.id, { ticker:v.toUpperCase() })} />
                  <BizField label="Role" value={n.role} onChange={v=>patchNode(n.id, { role:v })} />
                  <BizField label="Note / risk" value={n.note} onChange={v=>patchNode(n.id, { note:v })} area />
                  <button onClick={()=>removeNode(n.id)} style={{ fontFamily:VM.mono, fontSize:10.5, letterSpacing:'0.04em', textTransform:'uppercase',
                    padding:'7px 12px', borderRadius:8, cursor:'pointer', border:`1px solid ${VM.border}`, background:VM.paper, color:VM.down }}>
                    <i className="ti ti-trash" style={{ fontSize:13, verticalAlign:'-2px', marginRight:5 }}></i>Delete
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };
  return (
    <div>
      {/* company */}
      <div style={{ marginTop:16, borderRadius:13, background:VM.forest, padding:'16px 18px', textAlign:'center' }}>
        <div style={{ fontFamily:VM.mono, fontSize:8, color:'#9FE1CB', letterSpacing:'1px', textTransform:'uppercase', marginBottom:5 }}>{map.company.meta || 'YOUR BUSINESS'}</div>
        <div style={{ fontFamily:VM.serif, fontSize:22, fontWeight:600, color:'#E1F5EE', lineHeight:1.2 }}>{map.company.name || 'Your Company'}</div>
        <div style={{ fontFamily:VM.mono, fontSize:9.5, color:'#5DCAA5', marginTop:4 }}>{map.company.ticker || '—'} · the principle</div>
      </div>
      <div style={{ marginTop:12, background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:12, padding:'13px 14px' }}>
        <Label style={{ display:'block', marginBottom:10, color:VM.terra }}>Your company</Label>
        <BizField label="Company name" value={map.company.name} onChange={v=>patchCompany({ name:v })} />
        <BizField label="Ticker / short code" value={map.company.ticker} onChange={v=>patchCompany({ ticker:v.toUpperCase() })} />
        <BizField label="Label (meta)" value={map.company.meta} onChange={v=>patchCompany({ meta:v.toUpperCase() })} />
      </div>
      <Section title="Inputs · dependencies" kinds={['supplier','external']} />
      <Section title="Customers · channels" kinds={['customer']} />
    </div>
  );
}

Object.assign(window, { MyBusiness });
