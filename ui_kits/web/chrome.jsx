// Veridian Memoir — app chrome: masthead, left rail, index strip.
const { useState } = React;

function Masthead() {
  return (
    <div style={{ padding:'18px 16px 14px' }}>
      <div style={{ fontFamily:VM.serif, lineHeight:1, display:'flex', alignItems:'baseline', gap:6, whiteSpace:'nowrap' }}>
        <span style={{ fontStyle:'italic', fontWeight:700, fontSize:20, color:VM.teal, letterSpacing:'-0.01em' }}>Veridian</span>
        <span style={{ fontWeight:500, fontSize:20, color:VM.ink }}>Markets</span>
      </div>
      <div style={{ fontFamily:VM.mono, fontSize:9.5, letterSpacing:'0.14em', textTransform:'uppercase', color:VM.ink3, marginTop:6 }}>history-led finance</div>
    </div>
  );
}

const RAIL_GROUPS = [
  { head:null, items:[ {id:'search', label:'Company search', icon:'search', isSearch:true } ] },
  { head:'You', items:[ {label:'Sign in'}, {label:'Watchlist'}, {label:'Saved stories'} ] },
  { head:'Explore', items:[ {id:'front', label:'Front page'}, {id:'screener', label:'Company search'}, {id:'supply', label:'Supply chain network'}, {id:'history', label:'History'} ] },
  { head:null, items:[ {label:'Learn'}, {id:'memoir', label:'Read memoir', tone:'teal'} ] },
];

function Rail({ route, go }) {
  return (
    <aside style={{ width:208, flexShrink:0, background:VM.rail, borderRight:`1px solid ${VM.borderSoft}`, height:'100%', overflowY:'auto', display:'flex', flexDirection:'column' }}>
      <Masthead />
      {/* search field */}
      <div style={{ margin:'2px 14px 14px', display:'flex', alignItems:'center', gap:7, border:`1.2px dashed ${VM.border}`, borderRadius:999, padding:'7px 12px', background:'rgba(251,249,243,0.5)' }}>
        <i className="ti ti-search" style={{ fontSize:13, color:VM.ink3 }}></i>
        <span style={{ fontFamily:VM.mono, fontSize:10.5, color:VM.ink3 }}>search tickers, eras</span>
      </div>
      <nav style={{ padding:'0 8px', display:'flex', flexDirection:'column', gap:2 }}>
        {RAIL_GROUPS.slice(1).map((g,gi)=>(
          <div key={gi} style={{ marginBottom:10 }}>
            {g.head && <div style={{ fontFamily:VM.mono, fontSize:9, letterSpacing:'0.1em', textTransform:'uppercase', color:VM.faint, padding:'8px 10px 5px' }}>{g.head}</div>}
            {g.items.map((it,ii)=>{
              const active = it.id && it.id===route;
              const clickable = !!it.id;
              return (
                <div key={ii} onClick={()=>clickable&&go(it.id)} style={{
                  fontFamily:VM.serif, fontSize:15, padding:'6px 10px', borderRadius:7, cursor: clickable?'pointer':'default',
                  background: active?VM.paper:'transparent',
                  border: active?`1px solid ${VM.border}`:'1px solid transparent',
                  color: it.tone==='teal'?VM.teal : active?VM.ink:VM.ink2, fontWeight: active?600:400,
                }}>{it.label}</div>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}

function IndexStrip() {
  return (
    <div style={{ display:'flex', overflowX:'hidden', background:VM.tealTint, borderBottom:`1px solid ${VM.borderSoft}` }}>
      {VM_INDEX.map((t,i)=>(
        <div key={i} style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 14px', borderLeft: i?`1px dashed rgba(31,29,26,0.18)`:'none', whiteSpace:'nowrap' }}>
          <Mono size={11} weight={700}>{t.sym}</Mono>
          <Mono size={11} color={VM.ink3}>{t.val}</Mono>
          <Sparkline dir={t.dir} w={34} h={13} sw={1.2} />
          <Mono size={10} weight={600} color={t.dir==='up'?VM.upInk:VM.downInk}>{t.chg}</Mono>
        </div>
      ))}
      <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6, padding:'8px 14px', fontFamily:VM.mono, fontSize:10, color:VM.ink3 }}>
        <span style={{ width:6, height:6, borderRadius:999, background:VM.live, display:'inline-block' }}></span>14:32 UTC · LIVE
      </div>
    </div>
  );
}

// Shared editorial footer — rendered once in App so it sits at the foot of every page.
function Footer() {
  return (
    <footer style={{ borderTop:`1px solid ${VM.borderSoft}`, padding:'30px 24px 40px', textAlign:'center', background:VM.paperWarm }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:14, marginBottom:16 }}>
        <span style={{ width:64, height:1, background:`linear-gradient(90deg, transparent, ${VM.faint})` }}></span>
        <span style={{ width:5, height:5, transform:'rotate(45deg)', background:VM.terra }}></span>
        <span style={{ width:64, height:1, background:`linear-gradient(90deg, ${VM.faint}, transparent)` }}></span>
      </div>
      <div style={{ fontFamily:VM.serif, display:'flex', alignItems:'baseline', justifyContent:'center', gap:6, marginBottom:8 }}>
        <span style={{ fontStyle:'italic', fontWeight:700, fontSize:16, color:VM.teal, letterSpacing:'-0.01em' }}>Veridian</span>
        <span style={{ fontWeight:500, fontSize:16, color:VM.ink }}>Markets</span>
      </div>
      <div style={{ fontFamily:VM.mono, fontSize:10.5, letterSpacing:'0.1em', textTransform:'uppercase', color:VM.ink3 }}>
        History, read forward
      </div>
    </footer>
  );
}

Object.assign(window, { Masthead, Rail, IndexStrip, Footer });
