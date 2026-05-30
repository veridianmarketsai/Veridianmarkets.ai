// Veridian Markets — shared visual primitives.
// Editorial serif + machine mono. Line-art charts.
const { useMemo } = React;

const VM = {
  ink:'#1F1D1A', ink2:'#4A4640', ink3:'#8A857D', faint:'#B6AFA2',
  paper:'#FBF9F3', paperWarm:'#F4F1E8', paperDeep:'#ECE7DB', rail:'#E7ECED',
  teal:'#2D5E5A', forest:'#1D4E3A', tealInk:'#0F6E56', tealTint:'#E1F1EC', tealTint2:'#CFE5DD',
  terra:'#C46A3B', rust:'#B35A3A', rustDeep:'#A8512A',
  up:'#1D9E75', upInk:'#0F6E56', down:'#C0563B', downInk:'#A32D2D',
  border:'rgba(31,29,26,0.18)', borderSoft:'rgba(31,29,26,0.10)', borderHair:'rgba(31,29,26,0.06)',
  serif:"'Spectral', Georgia, serif", mono:"'JetBrains Mono', ui-monospace, monospace",
};

// ---- text bits ----
function Kicker({ children, tone='teal', style }) {
  const c = tone==='rust' ? VM.terra : tone==='muted' ? VM.ink3 : VM.teal;
  return <span style={{ fontFamily:VM.mono, fontWeight:700, fontSize:11, letterSpacing:'0.12em', textTransform:'uppercase', color:c, ...style }}>{children}</span>;
}
function Label({ children, style }) {
  return <span style={{ fontFamily:VM.mono, fontWeight:500, fontSize:9.5, letterSpacing:'0.06em', textTransform:'uppercase', color:VM.ink3, ...style }}>{children}</span>;
}
function Mono({ children, size=12, weight=500, color=VM.ink, style }) {
  return <span style={{ fontFamily:VM.mono, fontWeight:weight, fontSize:size, color, fontVariantNumeric:'tabular-nums', ...style }}>{children}</span>;
}
function Chg({ dir, children }) {
  return <Mono weight={600} color={dir==='up'?VM.upInk:VM.downInk}>{children}</Mono>;
}

// ---- controls ----
function IconBtn({ icon, active, round, size=30, title, onClick }) {
  return (
    <button title={title} onClick={onClick} style={{
      width:size, height:size, borderRadius: round?999:7,
      border:`1px solid ${active?VM.forest:VM.border}`,
      background: active?VM.forest:VM.paper, color: active?VM.paperWarm:VM.ink2,
      display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
      transition:'all .12s', padding:0, flexShrink:0,
    }}><i className={'ti ti-'+icon} style={{ fontSize:size*0.5 }}></i></button>
  );
}
function Pill({ children, dashed, active, onClick, style }) {
  return (
    <button onClick={onClick} style={{
      fontFamily:VM.mono, fontSize:11, padding:'6px 13px', borderRadius:999,
      border:`1px solid ${active?VM.forest:VM.border}`, borderStyle: dashed?'dashed':'solid',
      background: active?VM.forest:VM.paper, color: active?VM.paperWarm:VM.ink2,
      display:'inline-flex', alignItems:'center', gap:6, cursor:'pointer', whiteSpace:'nowrap', ...style,
    }}>{children}</button>
  );
}
function Btn({ children, solid, onClick, style }) {
  return (
    <button onClick={onClick} style={{
      fontFamily:VM.serif, fontSize:14, borderRadius:999, padding:'8px 18px', cursor:'pointer',
      border:`1px solid ${solid?VM.forest:VM.border}`, background:solid?VM.forest:VM.paper,
      color:solid?VM.paperWarm:VM.ink, display:'inline-flex', alignItems:'center', gap:7, ...style,
    }}>{children}</button>
  );
}

// ---- charts ----
function pathFrom(pts, w, h) {
  const xs=pts.map(p=>p[0]), ys=pts.map(p=>p[1]);
  const mnx=Math.min(...xs), mxx=Math.max(...xs), mny=Math.min(...ys), mxy=Math.max(...ys);
  return pts.map((p,i)=>`${i?'L':'M'} ${((p[0]-mnx)/((mxx-mnx)||1))*w} ${h-((p[1]-mny)/((mxy-mny)||1))*h}`).join(' ');
}
function genSeries(seed, n=24, drift=0) {
  const out=[]; let y=0.5;
  for(let i=0;i<n;i++){ y += Math.sin(i*0.7+seed)*0.07 + ((seed*9301+i*49297)%233280/233280-0.5)*0.08 + drift; y=Math.max(0.08,Math.min(0.92,y)); out.push([i,y]); }
  return out;
}
function Sparkline({ dir='up', w=72, h=24, sw=1.6 }) {
  const col = dir==='up'?VM.up:VM.down;
  const seed = dir==='up'?3:11;
  const pts = useMemo(()=>genSeries(seed,18, dir==='up'?0.012:-0.012),[dir]);
  return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{display:'block'}}>
    <path d={pathFrom(pts,w,h)} fill="none" stroke={col} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
// NOW (solid) vs THEN (dashed) overlay
function OverlayChart({ w=560, h=180, label, legend=true, thenYear='1973' }) {
  const now = useMemo(()=>genSeries(1.2,40,0.012),[]);
  const then = useMemo(()=>genSeries(4.7,40,-0.004),[]);
  return (
    <div style={{ position:'relative', width:'100%' }}>
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <line x1="0" y1={h-1} x2={w} y2={h-1} stroke={VM.border} strokeWidth="1" />
        {[0.25,0.5,0.75].map(g=> <line key={g} x1="0" y1={g*h} x2={w} y2={g*h} stroke={VM.borderHair} strokeWidth="1" strokeDasharray="2 5" />)}
        <path d={pathFrom(then,w,h-14)} fill="none" stroke={VM.teal} strokeWidth="1.4" strokeDasharray="6 5" opacity="0.55" transform="translate(0,7)" />
        <path d={pathFrom(now,w,h-14)} fill="none" stroke={VM.teal} strokeWidth="2" transform="translate(0,7)" />
      </svg>
      {legend && <div style={{ position:'absolute', top:0, right:0, display:'flex', gap:14, fontFamily:VM.mono, fontSize:10, color:VM.ink2 }}>
        <span><span style={{ display:'inline-block', width:15, borderTop:`2px solid ${VM.teal}`, verticalAlign:'middle', marginRight:4 }}></span>NOW</span>
        <span><span style={{ display:'inline-block', width:15, borderTop:`2px dashed ${VM.teal}`, verticalAlign:'middle', marginRight:4 }}></span>THEN ({thenYear})</span>
      </div>}
      {label && <div style={{ fontFamily:VM.serif, fontStyle:'italic', fontSize:13, color:VM.ink3, marginTop:6 }}>{label}</div>}
    </div>
  );
}
function ProgressBar({ v, w='100%', color=VM.teal }) {
  return <div style={{ width:w, height:8, background:VM.paperDeep, borderRadius:2, overflow:'hidden' }}>
    <div style={{ width:`${v}%`, height:'100%', background:color }}></div></div>;
}
// diagonal-hatch image placeholder
function Hatch({ w, h, label, style }) {
  return <div style={{ width:w, height:h, border:`1.2px solid ${VM.border}`, borderRadius:6,
    backgroundImage:`repeating-linear-gradient(45deg, transparent 0 8px, ${VM.borderSoft} 8px 9px)`,
    display:'flex', alignItems:'center', justifyContent:'center', ...style }}>
    {label && <span style={{ fontFamily:VM.serif, fontStyle:'italic', fontSize:12, color:VM.ink3, background:VM.paper, padding:'2px 8px', border:`1px solid ${VM.borderSoft}` }}>{label}</span>}
  </div>;
}

Object.assign(window, { VM, Kicker, Label, Mono, Chg, IconBtn, Pill, Btn, Sparkline, OverlayChart, ProgressBar, Hatch });
