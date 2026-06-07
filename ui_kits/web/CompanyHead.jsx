// Veridian Markets — shared company header (breadcrumb, ticker lockup, tabs, quote).
function CompanyHead({ c, tab, onTabChange, go, isMobile }) {
  const tabs = ['Overview','Supply chain','Financials','Patents','History','News'];

  // Tabs scroll horizontally when they don't fit. No scrollbar — grab & drag with the
  // mouse (or swipe), just like the index ticker. A drag suppresses the tab click.
  const tabsRef = React.useRef(null);
  const dragRef = React.useRef(null);   // { x, sl } while dragging
  const movedRef = React.useRef(false);
  const onDown = (e) => { const el = tabsRef.current; if (!el) return; dragRef.current = { x:e.clientX, sl:el.scrollLeft }; movedRef.current = false; };
  const onMove = (e) => { if (!dragRef.current) return; const dx = e.clientX - dragRef.current.x; if (Math.abs(dx) > 4) movedRef.current = true; tabsRef.current.scrollLeft = dragRef.current.sl - dx; };
  const onUp = () => { dragRef.current = null; };

  return (
    <div>
      <Mono size={11} color={VM.ink3} style={{ letterSpacing:'0.04em' }}>
        <span onClick={()=>go&&go('screener')} style={{ color:VM.teal, cursor: go?'pointer':'default' }}>Search</span>  ›  <b style={{color:VM.ink}}>{c.ticker}</b>  ›  <span style={{color:VM.teal}}>{tab}</span>
      </Mono>
      <div style={{ display:'flex', flexDirection: isMobile?'column':'row', justifyContent:'space-between',
        alignItems: isMobile?'stretch':'flex-start', gap: isMobile?12:0, marginTop:10 }}>
        <div style={{ display:'flex', alignItems:'baseline', gap: isMobile?10:14, flexWrap:'wrap' }}>
          <span style={{ fontFamily:VM.serif, fontWeight:700, fontSize: isMobile?34:52, lineHeight:0.9, letterSpacing:'0.01em' }}>{c.ticker}</span>
          <span style={{ fontFamily:VM.serif, fontSize: isMobile?16:20, color:VM.ink3 }}>{c.name}</span>
        </div>
        <div style={{ display:'flex', gap: isMobile?20:26, alignItems:'flex-start' }}>
          <div><Label>Price</Label><div style={{ display:'flex', alignItems:'baseline', gap:8 }}><Mono size={isMobile?18:22} weight={700}>${c.price}</Mono><Chg dir={c.dir}>{c.chg}</Chg></div></div>
          <div><Label>Mkt cap</Label><div><Mono size={isMobile?18:22} weight={700}>{c.cap}</Mono></div><Mono size={10} color={VM.ink3}>P/E 37.36 · div 0.34%</Mono></div>
        </div>
      </div>
      {/* tabs — drag-scroll horizontally (no scrollbar) when they don't fit */}
      <div ref={tabsRef} className="vm-noscroll"
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onPointerLeave={onUp}
        style={{ display:'flex', gap: isMobile?18:22, marginTop:16, borderBottom:`1px solid ${VM.borderSoft}`,
          overflowX:'auto', overflowY:'hidden', touchAction:'pan-y', userSelect:'none', cursor:'grab' }}>
        {tabs.map(t=>{
          const active = t===tab;
          return <span key={t} onClick={()=>{ if (movedRef.current) { movedRef.current = false; return; } onTabChange(t); }} style={{
            fontFamily:VM.serif, fontSize: isMobile?15:16, padding:'4px 2px 10px', cursor:'pointer', whiteSpace:'nowrap',
            color: active?VM.ink:VM.ink2, fontWeight: active?700:400,
            borderBottom: active?`2.5px solid ${VM.teal}`:'2.5px solid transparent', marginBottom:-1,
          }}>{t}</span>;
        })}
      </div>
    </div>
  );
}
Object.assign(window, { CompanyHead });
