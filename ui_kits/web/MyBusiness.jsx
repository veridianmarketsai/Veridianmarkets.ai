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
  const canvasRef = React.useRef(null);
  const [cw, setCw] = React.useState(900);          // measured canvas width
  const dragRef = React.useRef(null);               // { id, dx, dy, moved }

  // Measure the canvas so connectors + new-node placement track its real width.
  React.useEffect(() => {
    const measure = () => { const el = canvasRef.current; if (el) setCw(el.clientWidth); };
    measure();
    let ro; if (typeof ResizeObserver !== 'undefined' && canvasRef.current) { ro = new ResizeObserver(measure); ro.observe(canvasRef.current); }
    window.addEventListener('resize', measure);
    return () => { window.removeEventListener('resize', measure); if (ro) ro.disconnect(); };
  }, []);

  // Keep every node inside the canvas when its width changes (e.g. narrow screens
  // where a default right-column x would otherwise overflow). Drag clamps live.
  React.useEffect(() => {
    if (!cw) return;
    setMap(m => {
      let changed = false;
      const nodes = m.nodes.map(n => {
        const x = Math.max(6, Math.min(cw - BIZ_NW - 6, n.x));
        if (x !== n.x) changed = true;
        return x === n.x ? n : { ...n, x };
      });
      return changed ? { ...m, nodes } : m;
    });
  }, [cw]);

  const mark = () => setDirty(true);
  const patchNode = (id, patch) => { setMap(m => ({ ...m, nodes: m.nodes.map(n => n.id === id ? { ...n, ...patch } : n) })); mark(); };
  const patchCompany = (patch) => { setMap(m => ({ ...m, company: { ...m.company, ...patch } })); mark(); };
  const removeNode = (id) => { setMap(m => ({ ...m, nodes: m.nodes.filter(n => n.id !== id) })); setSelId(s => s === id ? null : s); mark(); };

  const cx = cw / 2, cy = BIZ_H / 2;
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
  const reset = () => { if (window.confirm('Reset the map to the starter example? Your current map will be lost.')) { const d = bizDefault(); setMap(d); setSelId(null); mark(); } };
  const clear = () => { if (window.confirm('Remove all nodes? The centre company stays.')) { setMap(m => ({ ...m, nodes: [] })); setSelId(null); mark(); } };
  const tidy  = () => {
    const PAD_TOP = 48, PAD_BOT = 24;
    const inNodes  = map.nodes.filter(n => BIZ_KINDS[n.kind].side === 'in');
    const outNodes = map.nodes.filter(n => BIZ_KINDS[n.kind].side === 'out');
    const arrange  = (nodes, xPos) => {
      const count = nodes.length;
      if (count === 0) return [];
      const usable = BIZ_H - PAD_TOP - PAD_BOT - BIZ_NH;
      return nodes.map((n, i) => ({
        ...n, x: xPos,
        y: count === 1 ? Math.round(BIZ_H / 2 - BIZ_NH / 2) : Math.round(PAD_TOP + i * usable / (count - 1)),
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
    x = Math.max(6, Math.min(cw - BIZ_NW - 6, x));
    y = Math.max(6, Math.min(BIZ_H - BIZ_NH - 6, y));
    d.moved = true;
    setMap(m => ({ ...m, nodes: m.nodes.map(nn => nn.id === d.id ? { ...nn, x, y } : nn) }));
  };
  const onNodeUp = (e) => { if (dragRef.current && dragRef.current.moved) mark(); dragRef.current = null; };

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
        <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:16, marginTop:16, alignItems:'start' }}>
          {/* ── canvas ── */}
          <div data-tour="vm-biz-canvas" ref={canvasRef} onPointerMove={onNodeMove} onPointerUp={onNodeUp} onClick={()=>setSelId(null)}
            style={{ position:'relative', height:BIZ_H, background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:14, overflow:'hidden',
              backgroundImage:`radial-gradient(${VM.borderHair} 1px, transparent 1px)`, backgroundSize:'22px 22px' }}>
            {/* connectors */}
            <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:0 }}>
              <defs>
                {[['biz-blue', BIZ.blue],['biz-coral', BIZ.coral],['biz-teal', BIZ.teal]].map(([id,c]) => (
                  <marker key={id} id={id} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill={c} /></marker>
                ))}
              </defs>
              {map.nodes.map(n => {
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
            {map.nodes.map(n => {
              const k = BIZ_KINDS[n.kind]; const on = selId === n.id;
              const edge = k.side === 'out' ? { borderRight:`3px solid ${k.color}` } : { borderLeft:`3px solid ${k.color}` };
              return (
                <div key={n.id} onPointerDown={(e)=>onNodeDown(e, n)} onClick={(e)=>e.stopPropagation()}
                  style={{ position:'absolute', left:n.x, top:n.y, width:BIZ_NW, minHeight:BIZ_NH, boxSizing:'border-box',
                    padding:'7px 11px', borderRadius:8, background: on ? VM.paperWarm : VM.paper, border:`1px solid ${VM.border}`, ...edge,
                    cursor:'grab', zIndex: on ? 6 : 2, textAlign: k.side === 'out' ? 'right' : 'left', touchAction:'none',
                    boxShadow: on ? '0 8px 20px rgba(31,29,26,0.16)' : '0 1px 3px rgba(31,29,26,0.06)' }}>
                  <div style={{ fontFamily:VM.mono, fontSize:11, fontWeight:600, color:VM.ink, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                    {n.ticker || k.label.toUpperCase()} {n.role && <span style={{ fontSize:8.5, color:VM.ink3, fontWeight:400 }}>· {n.role.split(' ')[0].toLowerCase()}</span>}
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
            {/* column hints */}
            <div style={{ position:'absolute', left:16, top:12, fontFamily:VM.mono, fontSize:9, color:VM.ink3, letterSpacing:'0.5px', textTransform:'uppercase' }}>Inputs · dependencies</div>
            <div style={{ position:'absolute', right:16, top:12, fontFamily:VM.mono, fontSize:9, color:VM.ink3, letterSpacing:'0.5px', textTransform:'uppercase' }}>Customers · channels</div>
          </div>

          {/* ── editor panel ── */}
          <div data-tour="vm-biz-editor">
            <BizEditor sel={sel} company={map.company} patchNode={patchNode} patchCompany={patchCompany}
              removeNode={removeNode} counts={counts} onClose={()=>setSelId(null)} />
          </div>
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

      {tutorialOpen && <TutorialOverlay steps={BIZ_STEPS} label="Dependency map tutorial" onClose={()=>setTutorialOpen(false)} />}
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
function BizEditor({ sel, company, patchNode, patchCompany, removeNode, counts, onClose }) {
  const card = { background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:14, padding:'15px 16px' };
  if (!sel) {
    return (
      <div style={{ ...card, position:'sticky', top:14 }}>
        <Label style={{ color:VM.terra }}>Editor</Label>
        <p style={{ fontFamily:VM.serif, fontSize:13.5, color:VM.ink2, lineHeight:1.5, marginTop:8 }}>
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
      <div style={{ ...card, position:'sticky', top:14 }}>
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
    <div style={{ ...card, position:'sticky', top:14 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <Label style={{ color:VM.terra }}><span style={{ display:'inline-block', width:9, height:9, borderRadius:2, background:k.color, marginRight:6 }}></span>Edit node</Label>
        <i className="ti ti-x" onClick={onClose} title="Close" style={{ fontSize:16, color:VM.ink3, cursor:'pointer' }}></i>
      </div>

      {/* kind picker */}
      <Label style={{ display:'block', marginBottom:5, color:VM.ink3 }}>Type</Label>
      <div style={{ display:'flex', gap:5, marginBottom:12, flexWrap:'wrap' }}>
        {Object.entries(BIZ_KINDS).map(([key, kk]) => {
          const on = sel.kind === key;
          return (
            <button key={key} onClick={()=>patchNode(sel.id, { kind:key })} title={kk.hint} style={{
              fontFamily:VM.mono, fontSize:9.5, padding:'5px 9px', borderRadius:6, cursor:'pointer',
              border:`1px solid ${on ? kk.color : VM.border}`, background: on ? kk.color : VM.paper, color: on ? '#fff' : VM.ink2 }}>{kk.label}</button>
          );
        })}
      </div>

      <BizField label="Name" value={sel.name} onChange={v=>patchNode(sel.id, { name:v })} placeholder="Company or factor name" />
      <BizField label="Ticker (optional)" value={sel.ticker} onChange={v=>patchNode(sel.id, { ticker:v.toUpperCase() })} placeholder="e.g. TSM" />
      <BizField label="Role" value={sel.role} onChange={v=>patchNode(sel.id, { role:v })} placeholder="What they do for you" />
      <BizField label="Note / risk" value={sel.note} onChange={v=>patchNode(sel.id, { note:v })} placeholder="Dependency detail, concentration, risk…" area />

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
