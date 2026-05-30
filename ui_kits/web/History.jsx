// Veridian Markets — History page: an "ask" search hub (history-led search + example prompts).
// Search submission is a scaffold for now (no backend) — wire to the data/AI provider later.
function History({ go, isMobile }) {
  const [query, setQuery] = React.useState('');
  const inputRef = React.useRef(null);
  const prompts = [
    'How oil impacts Apple',
    'Why did the share price go down for Apple?',
    "Apple's supply chain history",
    'Why have construction costs for residential houses gone up?',
  ];
  const pick = (p) => { setQuery(p); if (inputRef.current) inputRef.current.focus(); };
  const submit = (e) => { e.preventDefault(); /* TODO(search): wire to the data/AI provider */ };

  return (
    <div style={{ padding: isMobile ? '20px 16px 60px' : '44px 32px 80px', maxWidth:720, margin:'0 auto' }}>
      {/* hint pill */}
      <div style={{ display:'flex', justifyContent:'center', marginBottom: isMobile ? 22 : 30 }}>
        <span style={{ display:'inline-flex', alignItems:'center', gap:7, fontFamily:VM.mono, fontSize:10.5,
          letterSpacing:'0.06em', textTransform:'uppercase', color:VM.ink3, background:VM.paper,
          border:`1px solid ${VM.border}`, borderRadius:999, padding:'7px 15px' }}>
          <i className="ti ti-sparkles" style={{ fontSize:13, color:VM.teal }}></i>
          You can search at any time
        </span>
      </div>

      {/* title */}
      <h1 style={{ fontFamily:VM.serif, fontWeight:700, fontSize: isMobile ? 40 : 54, lineHeight:1.02,
        textAlign:'center', letterSpacing:'-0.01em', margin:'0 0 20px' }}>Search.</h1>

      {/* search bar */}
      <form onSubmit={submit} style={{ display:'flex', alignItems:'center', gap:10, background:VM.paper,
        border:`1.5px solid ${VM.border}`, borderRadius:999, padding: isMobile ? '11px 14px' : '14px 20px',
        boxShadow:'0 4px 18px rgba(31,29,26,0.06)' }}>
        <i className="ti ti-search" style={{ fontSize:18, color:VM.ink3 }}></i>
        <input ref={inputRef} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Ask Veridian…"
          style={{ flex:1, minWidth:0, border:'none', outline:'none', background:'transparent', fontFamily:VM.serif, fontSize:17, color:VM.ink }} />
        {query && <i onClick={()=>setQuery('')} className="ti ti-x" style={{ fontSize:15, color:VM.ink3, cursor:'pointer' }} title="Clear"></i>}
        <button type="submit" aria-label="Search" style={{ display:'inline-flex', alignItems:'center', justifyContent:'center',
          width:38, height:38, flexShrink:0, borderRadius:999, border:'none', background:VM.forest, color:VM.paper, cursor:'pointer' }}>
          <i className="ti ti-arrow-right" style={{ fontSize:16 }}></i>
        </button>
      </form>

      {/* prompts */}
      <div style={{ marginTop: isMobile ? 30 : 40 }}>
        <Mono size={10} color={VM.ink3} weight={700} style={{ letterSpacing:'0.08em', textTransform:'uppercase' }}>Prompts</Mono>
        <div style={{ marginTop:12, display:'flex', flexDirection:'column', gap:8 }}>
          {prompts.map((p, i) => <PromptRow key={i} text={p} onClick={()=>pick(p)} />)}
        </div>
      </div>
    </div>
  );
}

// A clickable example prompt — fills the search box; pops slightly on hover.
function PromptRow({ text, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div onClick={onClick} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 16px', cursor:'pointer',
        background: hover ? VM.paperWarm : VM.paper, border:`1px solid ${hover ? VM.border : VM.borderSoft}`, borderRadius:10,
        transform: hover ? 'translateX(3px)' : 'none',
        transition:'transform .15s ease, background .15s ease, border-color .15s ease' }}>
      <span style={{ width:6, height:6, borderRadius:999, background:VM.terra, flexShrink:0 }}></span>
      <span style={{ flex:1, fontFamily:VM.serif, fontSize:16, color:VM.ink }}>{text}</span>
      <i className="ti ti-arrow-up-right" style={{ fontSize:15, color: hover ? VM.teal : VM.faint, transition:'color .15s ease' }}></i>
    </div>
  );
}

Object.assign(window, { History });
