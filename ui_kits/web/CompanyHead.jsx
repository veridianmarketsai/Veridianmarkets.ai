// Veridian Markets — shared company header (breadcrumb, ticker lockup, tabs, quote).
function CompanyHead({ c, tab, onTabChange, go, isMobile, trail, trailIndex, onResetPrinciple, onNewPrinciple }) {
  const tabs = ['Overview','Supply chain','Financials','Patents','History','News'];
  // Live quote (Finnhub via our cached Lambda); falls back to the mock price.
  const live = useVMQuote(c.ticker);
  const price = live ? live.price.toFixed(2) : c.price;
  const chgTxt = live ? vmFmtPct(live.pct) : c.chg;
  const dir = live ? live.dir : c.dir;
  // Real profile/metrics (cached) → market cap, P/E, dividend yield, 52-wk.
  const prof = typeof useVMProfile === 'function' ? useVMProfile(c.ticker) : { profile:null, metric:null };
  const cap  = prof.profile && prof.profile.marketCap != null ? vmFmtCap(prof.profile.marketCap) : (c.cap || '—');
  const met  = prof.metric || {};
  const peTxt = met.peTTM != null ? `P/E ${vmNum2(met.peTTM)}` : 'P/E —';
  const dyTxt = met.dividendYield != null ? `div ${vmPct1(met.dividendYield)}` : 'div —';
  const logo = prof.profile && prof.profile.logo ? prof.profile.logo : null;   // real company logo (Finnhub)
  // Favourite (star) — persists locally + captured to vm-events.
  const [fav, setFav] = React.useState(() => typeof vmIsFav === 'function' && vmIsFav(c.ticker));
  React.useEffect(() => { setFav(typeof vmIsFav === 'function' && vmIsFav(c.ticker)); }, [c.ticker]);
  // The drill trail — each crumb is { co, tab } so the path reads
  // Search › SPX › Supply chain › AAPL › Financials. `trailIndex` is where you
  // are in it: crumbs behind it are your visited history (clickable, normal),
  // the one at it is highlighted as current, and any ahead of it are a
  // greyed-out "redo" you can still click back into — going back never
  // deletes them (see app.jsx's syncTrail).
  const crumbs = trail?.length ? trail : [{ co: c, tab }];
  const curIdx = trailIndex != null ? trailIndex : crumbs.length - 1;
  const sepEl = (k) => <span key={k} style={{ color:VM.faint, margin:'0 6px' }}>›</span>;

  // Tabs scroll horizontally when they don't fit. No scrollbar — grab & drag with the
  // mouse (or swipe), just like the index ticker. A drag suppresses the tab click.
  const tabsRef = React.useRef(null);
  const dragRef = React.useRef(null);   // { x, sl } while dragging
  const movedRef = React.useRef(false);
  const onDown = (e) => { const el = tabsRef.current; if (!el) return; dragRef.current = { x:e.clientX, sl:el.scrollLeft }; movedRef.current = false; };
  const onMove = (e) => { if (!dragRef.current) return; const dx = e.clientX - dragRef.current.x; if (Math.abs(dx) > 4) movedRef.current = true; tabsRef.current.scrollLeft = dragRef.current.sl - dx; };
  const onUp = () => { dragRef.current = null; };
  const [hoverTab, setHoverTab] = React.useState(null);

  return (
    <div data-tour="vm-company-head">
      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
        {crumbs.length > 1 && (
          <div style={{ display:'flex', gap:5, flexShrink:0 }}>
            <button onClick={() => onResetPrinciple && onResetPrinciple()} title="Reset to initial principle"
              style={{ width:22, height:22, borderRadius:6, border:`1px solid ${VM.border}`, background:VM.paper, color:VM.ink3,
                cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', padding:0 }}>
              <i className="ti ti-settings" style={{ fontSize:12 }}></i>
            </button>
            <button onClick={() => onNewPrinciple && onNewPrinciple()} title="Make new principle"
              style={{ width:22, height:22, borderRadius:6, border:`1px solid ${VM.border}`, background:VM.paper, color:VM.ink3,
                cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', padding:0,
                fontFamily:VM.mono, fontSize:11, fontWeight:700 }}>
              P
            </button>
          </div>
        )}
        <Mono size={11} color={VM.ink3} style={{ letterSpacing:'0.04em' }}>
          <span onClick={()=>go&&go('screener')} style={{ color:VM.teal, cursor: go?'pointer':'default' }}>Search</span>
          {crumbs.map((cr, i) => {
            const cur = i === curIdx;
            const forward = i > curIdx;
            const back = () => go && go('dashboard', cr.co);
            const color = cur ? VM.forest : forward ? VM.faint : VM.teal;
            const tabColor = cur ? VM.forest : forward ? VM.faint : VM.ink3;
            const tk = cur
              ? <b key="tk" style={{ color }}>{cr.co.ticker}</b>
              : <span key="tk" onClick={back} style={{ color, cursor:'pointer' }}>{cr.co.ticker}</span>;
            const tb = cur
              ? <span key="tb" style={{ color, fontWeight:700 }}>{tab}</span>
              : <span key="tb" onClick={back} style={{ color:tabColor, cursor:'pointer' }}>{cr.tab}</span>;
            return <React.Fragment key={(cr.co.ticker || '') + i}>{sepEl('s1'+i)}{tk}{sepEl('s2'+i)}{tb}</React.Fragment>;
          })}
        </Mono>
      </div>
      <div style={{ display:'flex', flexDirection: isMobile?'column':'row', justifyContent:'space-between',
        alignItems: isMobile?'stretch':'flex-start', gap: isMobile?12:0, marginTop:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap: isMobile?10:14 }}>
          {logo && <img src={logo} alt="" onError={e=>{ e.currentTarget.style.display='none'; }}
            style={{ width: isMobile?36:48, height: isMobile?36:48, borderRadius:10, objectFit:'contain',
              background:'#fff', border:`1px solid ${VM.borderHair}`, padding:3, flexShrink:0 }} />}
          <div style={{ display:'flex', alignItems:'baseline', gap: isMobile?10:14, flexWrap:'wrap' }}>
            <span style={{ fontFamily:VM.serif, fontWeight:700, fontSize: isMobile?34:52, lineHeight:0.9, letterSpacing:'0.01em' }}>{c.ticker}</span>
            <span style={{ fontFamily:VM.serif, fontSize: isMobile?16:20, color:VM.ink3 }}>{c.name}</span>
          </div>
          <button onClick={() => { if (typeof vmToggleFav === 'function') setFav(vmToggleFav(c.ticker)); }}
            title={fav ? 'Remove from favourites' : 'Add to favourites'} data-cap="favourite-toggle"
            style={{ background:'none', border:'none', cursor:'pointer', padding:4, lineHeight:1, flexShrink:0, color: fav ? '#E0A93B' : VM.ink3 }}>
            <i className={fav ? 'ti ti-star-filled' : 'ti ti-star'} style={{ fontSize: isMobile?20:24 }}></i>
          </button>
        </div>
        <div style={{ display:'flex', gap: isMobile?20:26, alignItems:'flex-start' }}>
          <div><Label style={{ display:'inline-flex', alignItems:'center', gap:5 }}>Price {live && <span title="Live · cached ≤2 min" style={{ width:6, height:6, borderRadius:999, background:VM.up, display:'inline-block' }}></span>}</Label><div style={{ display:'flex', alignItems:'baseline', gap:8 }}><Mono size={isMobile?18:22} weight={700}>${price}</Mono><Chg dir={dir}>{chgTxt}</Chg></div></div>
          <div><Label>Mkt cap</Label><div><Mono size={isMobile?18:22} weight={700}>{cap}</Mono></div><Mono size={10} color={VM.ink3}>{peTxt} · {dyTxt}</Mono></div>
        </div>
      </div>
      <div data-tour="vm-company-tabs" ref={tabsRef} className="vm-noscroll"
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onPointerLeave={onUp}
        style={{ display:'flex', gap: isMobile?18:22, marginTop:16, borderBottom:`1px solid ${VM.borderSoft}`,
          overflowX:'auto', overflowY:'hidden', touchAction:'pan-y', userSelect:'none', cursor:'grab' }}>
        {tabs.map(t=>{
          const active = t===tab;
          const hov = hoverTab===t && !active;
          return <span key={t} onClick={()=>{ if (movedRef.current) { movedRef.current = false; return; } if (typeof vmCapture === 'function') vmCapture('tab_view', { ticker: c.ticker, tab: t }); onTabChange(t); }}
            onMouseEnter={()=>setHoverTab(t)} onMouseLeave={()=>setHoverTab(h=>h===t?null:h)} style={{
            fontFamily:VM.serif, fontSize: isMobile?15:16, padding:'4px 8px 10px', cursor:'pointer', whiteSpace:'nowrap', borderRadius:'6px 6px 0 0',
            color: active?VM.ink:(hov?VM.teal:VM.ink2), fontWeight: active?700:(hov?600:400),
            background: hov?VM.tealTint:'transparent',
            borderBottom: (active||hov)?`2.5px solid ${VM.teal}`:'2.5px solid transparent', marginBottom:-1,
            transition:'color .14s ease, background .14s ease, border-color .14s ease',
          }}>{t}</span>;
        })}
      </div>
    </div>
  );
}
Object.assign(window, { CompanyHead });
