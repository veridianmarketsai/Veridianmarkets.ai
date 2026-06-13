// Veridian Markets — Front page (editorial home).
function FrontPage({ go, isMobile }) {
  const recap = [
    { k:'Forex', chg:'+0.12%', dir:'up' }, { k:'Bonds', chg:'-0.08%', dir:'down' },
    { k:'Commodities', chg:'+0.94%', dir:'up' }, { k:'Stocks', chg:'+0.41%', dir:'up' },
    { k:'Crypto', chg:'-2.31%', dir:'down' }, { k:'Funds', chg:'+0.27%', dir:'up' },
  ];
  const cols = isMobile ? 1 : 3;                       // story tiles per row (stacks on mobile)
  const perPage = cols * 3;                            // 3 rows visible per page → 9 desktop / 3 mobile
  const pageCount = Math.ceil(27 / perPage);           // 3 pages desktop, 9 mobile
  const [page, setPage] = React.useState(0);                 // story-tile pager
  React.useEffect(() => { setPage(p => Math.min(p, pageCount - 1)); }, [pageCount]);  // clamp when the breakpoint changes
  const lastPage = page === pageCount - 1;             // final page → 'More' is hidden
  const [pagerHover, setPagerHover] = React.useState(false);  // hover shade on the pager pill
  const moreRef = React.useRef(null);                   // measure 'More' so we can pin it to the centre
  const [anchorX, setAnchorX] = React.useState(43);           // pill's right edge sits this many px right of centre
  React.useLayoutEffect(() => { if (moreRef.current) setAnchorX(16 + moreRef.current.offsetWidth / 2); }, []);
  const [openCard, setOpenCard] = React.useState('recap');  // right column accordion: exactly one of 'recap' | 'calendar' is always open
  // Clicking the open card's chevron switches to the other; clicking a closed card opens it. Never both closed.
  const toggleCard = (id) => setOpenCard(cur => cur === id ? (id === 'recap' ? 'calendar' : 'recap') : id);
  const [companyQuery, setCompanyQuery] = React.useState('');  // 'Find a company' search filter
  const [openRow, setOpenRow] = React.useState(null);          // ticker of the row whose eye-preview is expanded
  const q = companyQuery.trim().toLowerCase();
  const companyRows = VM_COMPANIES
    .filter(c => !q || c.ticker.toLowerCase().includes(q) || c.name.toLowerCase().includes(q))
    .slice(0, 10);
  const tileTitles = ['Headline placeholder.', 'Another lead forms.', 'A quiet mover.', 'History rhymes.', 'Sector in focus.', 'The long view.'];
  const [screenerHover, setScreenerHover] = React.useState(false);  // hover shade on the 'Open full screener' button
  const [newsHover, setNewsHover] = React.useState(false);          // hover shade on the 'See all news' button

  // "Learn how to use this?" nudge — appears after 3 clicks on the landing page.
  // Click count is session-only (resets on page load); dismissed state persists via localStorage.
  const [clickCount, setClickCount] = React.useState(0);
  const [nudgeDismissed, setNudgeDismissed] = React.useState(() => {
    try { return !!localStorage.getItem('vm_learn_nudge_done'); } catch { return false; }
  });
  const [nudgeIn, setNudgeIn] = React.useState(false);
  const showNudge = clickCount >= 3 && !nudgeDismissed;
  React.useEffect(() => {
    if (showNudge) { const t = setTimeout(() => setNudgeIn(true), 60); return () => clearTimeout(t); }
    else setNudgeIn(false);
  }, [showNudge]);
  const bumpClick = () => setClickCount(n => n + 1);
  const dismissNudge = (e) => {
    e.stopPropagation();
    setNudgeDismissed(true);
    setNudgeIn(false);
    try { localStorage.setItem('vm_learn_nudge_done', '1'); } catch {}
  };

  return (
    <div onClick={bumpClick} style={{ padding: isMobile ? '14px 16px 80px' : '18px 32px 60px', maxWidth:1180, margin:'0 auto' }}>
      {/* LEARN — resume / start learning, above Global News + Market recap. */}
      <LearnBanner go={go} isMobile={isMobile} />
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1.7fr 1fr', gap: isMobile ? 24 : 32 }}>
        {/* STORY TILES — fixed 3×3 window; the button slides through 3 pages of 9 (27 total). Placeholder scaffold. */}
        <div>
          <Kicker>Global News</Kicker>
          {/* One page of 9 tiles, in an overflow-visible area so hover pop-outs are never clipped.
              Changing page remounts StoryPage (via key), which slides + fades the new tiles in. */}
          <div data-tour="vm-story-tiles" style={{ marginTop:10 }}>
            <StoryScroller page={page} tileTitles={tileTitles} cols={cols} perPage={perPage} />
          </div>
          {/* Pager — 'More' is pinned to the page centre (never moves); 'Up' reveals to its left and the box grows leftward only. */}
          <div style={{ position:'relative', height:38, marginTop:16 }}>
            <div onMouseEnter={()=>setPagerHover(true)} onMouseLeave={()=>setPagerHover(false)}
              style={{ position:'absolute', left:'50%', top:0, transform:`translateX(calc(-100% + ${anchorX}px))`,
                display:'inline-flex', alignItems:'center', justifyContent:'flex-end', height:38, boxSizing:'border-box',
                padding:'0 16px', background: pagerHover ? VM.paperDeep : VM.paper,
                border:`1px solid ${pagerHover ? VM.ink3 : VM.border}`, borderRadius:999, whiteSpace:'nowrap',
                transition:'background .15s ease, border-color .15s ease' }}>
              {/* Up — reveals to the LEFT once you've paged in. */}
              <span style={{ display:'inline-flex', alignItems:'center', overflow:'hidden',
                maxWidth: page >= 1 ? 80 : 0, opacity: page >= 1 ? 1 : 0,
                transition:'max-width .38s cubic-bezier(.4,0,.2,1), opacity .3s ease' }}>
                <span onClick={()=>setPage(p=>Math.max(p-1,0))} style={{ fontFamily:VM.serif, fontSize:14, color:VM.teal, cursor:'pointer' }}>↑ Up</span>
              </span>
              {/* vertical separator — only on the middle page, where both actions show. */}
              <span style={{ alignSelf:'stretch', width: (page >= 1 && !lastPage) ? 1 : 0, background:VM.border, overflow:'hidden',
                margin: (page >= 1 && !lastPage) ? '9px 14px' : '9px 0', opacity: (page >= 1 && !lastPage) ? 1 : 0,
                transition:'width .38s cubic-bezier(.4,0,.2,1), margin .38s cubic-bezier(.4,0,.2,1), opacity .3s ease' }}></span>
              {/* More — rightmost item, kept on the centreline via the measured anchor. */}
              <span style={{ display:'inline-flex', alignItems:'center', overflow:'hidden',
                maxWidth: lastPage ? 0 : 80, opacity: lastPage ? 0 : 1,
                transition:'max-width .38s cubic-bezier(.4,0,.2,1), opacity .3s ease' }}>
                <span ref={moreRef} onClick={()=>setPage(p=>Math.min(p+1,pageCount-1))} style={{ fontFamily:VM.serif, fontSize:14, color:VM.teal, cursor:'pointer' }}>More ↓</span>
              </span>
            </div>
            <div style={{ position:'absolute', left:'50%', top:'50%', transform:`translate(${anchorX + 12}px, -50%)`,
              fontFamily:VM.mono, fontSize:10, color:VM.ink3, whiteSpace:'nowrap' }}>{page + 1} / {pageCount}</div>
            {/* See-all link to the full News page, pinned to the right of the pager row. */}
            <span onClick={()=>go('news')} onMouseEnter={()=>setNewsHover(true)} onMouseLeave={()=>setNewsHover(false)}
              style={{ position:'absolute', right:0, top:'50%', transform:'translateY(-50%)', fontFamily:VM.serif, fontSize:14,
                color:VM.teal, cursor:'pointer', whiteSpace:'nowrap', border:`1px solid ${newsHover ? VM.ink3 : VM.border}`,
                borderRadius:999, padding:'6px 14px', background: newsHover ? VM.paperDeep : VM.paper,
                transition:'background .15s ease, border-color .15s ease' }}>See more →</span>
          </div>
        </div>

        {/* RIGHT CARDS — accordion. A hidden kicker (desktop) mirrors the left
            "Global News" kicker so Market recap lines up with the first news tiles. */}
        <div>
          {!isMobile && <Kicker style={{ visibility:'hidden' }}>Global News</Kicker>}
          <div data-tour="vm-market-recap" style={{ marginTop: isMobile ? 0 : 10, display:'flex', flexDirection:'column', gap:14 }}>
          <CollapsibleCard letter="A" title="Market recap" open={openCard==='recap'} onToggle={()=>toggleCard('recap')}>
            {recap.map((r,i)=>(
              <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 60px 60px', alignItems:'center', gap:8, padding:'7px 0', borderBottom: i<recap.length-1?`1px dotted ${VM.border}`:'none' }}>
                <span style={{ fontFamily:VM.serif, fontSize:14, color:VM.ink2 }}>{r.k}</span>
                <Sparkline dir={r.dir} w={56} h={16} />
                <span style={{ textAlign:'right' }}><Chg dir={r.dir}>{r.chg}</Chg></span>
              </div>
            ))}
          </CollapsibleCard>
          <CollapsibleCard letter="B" title="Mini calendar" open={openCard==='calendar'} onToggle={()=>toggleCard('calendar')}
            action={<OpenBox title="Open calendar" onClick={()=>go('calendar')} />}>
            <MiniCalendar />
          </CollapsibleCard>
          </div>
        </div>
      </div>

      {/* TOP COMPANIES PREVIEW */}
      <div data-tour="vm-company-list" style={{ marginTop:44 }}>
        <Kicker>4,904 PUBLIC COMPANIES</Kicker>
        <div style={{ display:'flex', flexDirection: isMobile?'column':'row', justifyContent:'space-between', alignItems: isMobile?'flex-start':'baseline', gap: isMobile?10:0, margin:'8px 0 16px' }}>
          <h2 style={{ fontFamily:VM.serif, fontWeight:700, fontSize: isMobile?23:27, margin:0 }}>Search.</h2>
          <span onClick={()=>go('screener')} onMouseEnter={()=>setScreenerHover(true)} onMouseLeave={()=>setScreenerHover(false)}
            style={{ fontFamily:VM.serif, fontSize:14, color:VM.teal, cursor:'pointer', whiteSpace:'nowrap',
              border:`1px solid ${screenerHover ? VM.ink3 : VM.border}`, borderRadius:999, padding:'6px 16px',
              background: screenerHover ? VM.paperDeep : VM.paper,
              transition:'background .15s ease, border-color .15s ease' }}>Open full screener →</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:9, background:VM.paper, border:`1px solid ${VM.border}`, borderRadius:10, padding:'10px 14px', marginBottom:14 }}>
          <i className="ti ti-search" style={{ fontSize:15, color:VM.ink3 }}></i>
          <input value={companyQuery} onChange={e=>setCompanyQuery(e.target.value)} placeholder="Search by ticker or company name…"
            style={{ flex:1, border:'none', outline:'none', background:'transparent', fontFamily:VM.serif, fontSize:15, color:VM.ink }} />
          {companyQuery && <i onClick={()=>setCompanyQuery('')} className="ti ti-x" style={{ fontSize:14, color:VM.ink3, cursor:'pointer' }} title="Clear"></i>}
        </div>
        <div style={{ background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:12 }}>
          {/* Header grid MUST match CompanyRow's columns + gap so the labels line up with the data. */}
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '52px 1fr auto' : '80px 1fr 90px 70px 110px', gap:10, padding: isMobile ? '6px 14px' : '6px 16px', background:VM.paperWarm, borderBottom:`1px solid ${VM.borderSoft}`, borderRadius:'12px 12px 0 0' }}>
            <Label>Ticker</Label><Label>Sector · Market cap</Label><div style={{ textAlign:'left' }}><Label>Price</Label></div><div style={{ textAlign:'left' }}><Label>Change</Label></div>
          </div>
          {companyRows.length === 0 && (
            <div style={{ padding:'18px 16px', fontFamily:VM.serif, fontSize:14, color:VM.ink3 }}>No companies match “{companyQuery}”.</div>
          )}
          {companyRows.map((c,i)=>(
            <CompanyRow key={c.ticker} c={c} last={i===companyRows.length-1} go={go} isMobile={isMobile}
              open={openRow===c.ticker} onEye={()=>setOpenRow(openRow===c.ticker?null:c.ticker)} />
          ))}
        </div>
      </div>

      {showNudge && (
        <div style={{ position:'fixed', bottom: isMobile ? 92 : 36, left:'50%',
          display:'flex', alignItems:'center', gap:11, padding:'12px 22px 12px 18px',
          background:VM.paper, border:`1px solid ${VM.teal}`, borderRadius:999,
          boxShadow:'0 6px 32px rgba(31,29,26,0.14)', zIndex:61,
          opacity: nudgeIn ? 1 : 0,
          transform: nudgeIn ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(18px)',
          transition:'opacity .38s ease, transform .42s cubic-bezier(.34,1.56,.64,1)',
          pointerEvents: nudgeIn ? 'auto' : 'none' }}>
          <i className="ti ti-graduation-cap" style={{ fontSize:16, color:VM.teal, flexShrink:0 }}></i>
          <span onClick={(e)=>{ e.stopPropagation(); dismissNudge(e); go('learn'); }}
            style={{ fontFamily:VM.serif, fontSize:15, color:VM.ink, cursor:'pointer', userSelect:'none' }}>
            Learn how to use this?
          </span>
          <i onClick={dismissNudge} className="ti ti-x"
            style={{ fontSize:13, color:VM.ink3, cursor:'pointer', flexShrink:0, marginLeft:2 }} title="Dismiss"></i>
        </div>
      )}
      </div>
  );
}

// Collapsible card — clickable header tab + a chevron that rotates; content animates to its
// EXACT measured height (not an oversized cap) so a closing panel can't briefly overlap an
// opening one — which would balloon the column and bounce the section below.
function CollapsibleCard({ letter, title, open, onToggle, children, action }) {
  const innerRef = React.useRef(null);
  const [contentH, setContentH] = React.useState(0);
  const [chevHover, setChevHover] = React.useState(false);
  React.useLayoutEffect(() => {
    if (innerRef.current) setContentH(innerRef.current.scrollHeight);
  }, []);
  return (
    <div style={{ background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:12, overflow:'hidden' }}>
      <div onClick={onToggle} style={{ display:'flex', alignItems:'center', gap:8, padding:'13px 16px', cursor:'pointer', userSelect:'none' }}>
        {letter && <span style={{ fontFamily:VM.mono, fontSize:9, color:VM.ink3, border:`1px solid ${VM.border}`, borderRadius:3, width:16, height:16, display:'flex', alignItems:'center', justifyContent:'center' }}>{letter}</span>}
        <h3 style={{ fontFamily:VM.serif, fontWeight:700, fontSize:18, margin:0 }}>{title}</h3>
        <span onMouseEnter={()=>setChevHover(true)} onMouseLeave={()=>setChevHover(false)}
          style={{ marginLeft:'auto', display:'inline-flex', alignItems:'center', justifyContent:'center',
            width:28, height:28, borderRadius:7, flexShrink:0,
            border:`1px solid ${chevHover ? VM.ink3 : VM.border}`,
            background: chevHover ? VM.paperWarm : 'transparent',
            color: chevHover ? VM.ink : VM.ink2,
            transition:'background .15s ease, border-color .15s ease, color .15s ease' }}>
          <i className="ti ti-chevron-down" style={{ fontSize:16, display:'inline-block',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition:'transform .3s ease' }}></i>
        </span>
        {action}
      </div>
      <div style={{ maxHeight: open ? contentH : 0, opacity: open ? 1 : 0, overflow:'hidden',
        transition:'max-height .38s cubic-bezier(.4,0,.2,1), opacity .3s ease' }}>
        <div ref={innerRef} style={{ padding:'0 16px 16px' }}>{children}</div>
      </div>
    </div>
  );
}

// Square "open" button — an external-link box that sits beside a card's chevron.
function OpenBox({ title, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button title={title} onClick={(e)=>{ e.stopPropagation(); onClick(); }} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{ width:28, height:28, borderRadius:7, flexShrink:0, padding:0, cursor:'pointer',
        border:`1px solid ${hover ? VM.ink3 : VM.border}`, background: hover ? VM.paperWarm : 'transparent', color: hover ? VM.ink : VM.ink2,
        display:'inline-flex', alignItems:'center', justifyContent:'center', transition:'background .15s ease, border-color .15s ease, color .15s ease' }}>
      <i className="ti ti-external-link" style={{ fontSize:15 }}></i>
    </button>
  );
}

// One page of tiles (9 on desktop / 3 on mobile).
function PageGrid({ page, tileTitles, cols, perPage }) {
  const nums = Array.from({ length: perPage }, (_, i) => page * perPage + i + 1);
  return (
    <div style={{ display:'grid', gridTemplateColumns:`repeat(${cols}, 1fr)`, gridAutoRows:'128px', gap:14 }}>
      {nums.map(n => (
        <StoryTile key={n} n={n} title={tileTitles[(n - 1) % tileTitles.length]} dir={n % 3 === 0 ? 'down' : 'up'} mins={3 + ((n * 2) % 7)} />
      ))}
    </div>
  );
}

// Scrolls between pages: idle = a single page in an overflow-visible box (so hover pop-outs aren't
// clipped); during a page change it stacks both pages and slides the track up/down so you see the
// tiles move. Same easing/speed as the accordion (.38s) for a consistent feel.
function StoryScroller({ page, tileTitles, cols, perPage }) {
  const ROW = 128, GAP = 14;
  const VIEW_H = 3 * ROW + 2 * GAP;   // 412 — three rows tall
  const STEP = 3 * (ROW + GAP);       // 426 — one page of travel
  const EASE = 'transform .38s cubic-bezier(.4,0,.2,1)';
  const [display, setDisplay] = React.useState(page);  // settled page
  const [armed, setArmed] = React.useState(false);     // mid-animation
  const [run, setRun] = React.useState(false);         // transition engaged

  React.useEffect(() => {
    if (page === display) return;
    setArmed(true); setRun(false);
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setRun(true)));
    return () => cancelAnimationFrame(id);
  }, [page]);

  if (!armed) {
    return <div style={{ overflow:'visible' }}><PageGrid page={display} tileTitles={tileTitles} cols={cols} perPage={perPage} /></div>;
  }

  const forward = page > display;                       // next page → scroll up
  const topPage = forward ? display : page;
  const bottomPage = forward ? page : display;
  const offset = run ? (forward ? -STEP : 0) : (forward ? 0 : -STEP);
  const onEnd = (e) => {
    if (e.target !== e.currentTarget || e.propertyName !== 'transform') return;
    setDisplay(page); setArmed(false); setRun(false);
  };

  return (
    <div style={{ height: VIEW_H, overflow:'hidden' }}>
      <div onTransitionEnd={onEnd} style={{ transform:`translateY(${offset}px)`, transition: run ? EASE : 'none' }}>
        <PageGrid page={topPage} tileTitles={tileTitles} cols={cols} perPage={perPage} />
        <div style={{ height: GAP }}></div>
        <PageGrid page={bottomPage} tileTitles={tileTitles} cols={cols} perPage={perPage} />
      </div>
    </div>
  );
}

// A story tile — pops out and highlights on hover (matches the company-row feel).
function StoryTile({ n, title, dir, mins }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{ background: hover ? VM.paperWarm : VM.paper,
        border:`1px solid ${hover ? VM.border : VM.borderSoft}`, borderRadius:10, padding:'12px 13px',
        display:'flex', flexDirection:'column', cursor:'pointer', position:'relative', zIndex: hover ? 2 : 1,
        transform: hover ? 'scale(1.03)' : 'scale(1)',
        boxShadow: hover ? '0 6px 16px rgba(31,29,26,0.10)' : 'none',
        transition:'transform .16s ease, box-shadow .16s ease, background .16s ease, border-color .16s ease' }}>
      <Mono size={9} color={VM.ink3}>STORY · {String(n).padStart(2,'0')}</Mono>
      <div style={{ fontFamily:VM.serif, fontWeight:700, fontSize:15, lineHeight:1.18, margin:'8px 0 0', color:VM.ink }}>{title}</div>
      <div style={{ marginTop:'auto', display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:10 }}>
        <Sparkline dir={dir} w={42} h={14} />
        <Mono size={9} color={VM.ink3}>{mins} min</Mono>
      </div>
    </div>
  );
}

// A 'Find a company' row — the eye expands an inline preview (same component as
// the screener); the row/arrow opens the dashboard. Pops out slightly on hover.
function CompanyRow({ c, last, go, isMobile, open, onEye }) {
  const [hover, setHover] = React.useState(false);
  const pop = hover && !isMobile && !open;   // no pop while the preview is open
  return (
    <div style={{ borderBottom: (last && !open) ? 'none' : `1px solid ${VM.borderSoft}`,
      background: open ? VM.tealTint : 'transparent', position:'relative', zIndex: pop ? 2 : 1 }}>
      <div onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} onClick={()=>go('dashboard', c)}
        style={{ display:'grid', gridTemplateColumns: isMobile ? '52px 1fr auto' : '80px 1fr 90px 70px 110px', alignItems:'center', gap:10, padding: isMobile ? '11px 14px' : '12px 16px', cursor:'pointer',
          background: (hover && !isMobile && !open) ? VM.paperWarm : 'transparent',
          transform: pop ? 'scale(1.015)' : 'scale(1)',
          boxShadow: pop ? '0 6px 18px rgba(31,29,26,0.10)' : 'none',
          borderRadius: pop ? 10 : 0,
          transition:'transform .16s ease, box-shadow .16s ease, background .16s ease' }}>
        <span style={{ fontFamily:VM.serif, fontWeight:700, fontSize: isMobile ? 17 : 20 }}>{c.ticker}</span>
        <div><Mono size={11} color={VM.ink2}>{c.name}</Mono><div><Label>{c.sector} · {c.cap}</Label></div></div>
        {isMobile ? (
          <div style={{ textAlign:'right' }}>
            <Mono size={12} weight={700}>${c.price}</Mono>
            <div><Chg dir={c.dir}>{c.chg}</Chg></div>
          </div>
        ) : (
          <React.Fragment>
            <div style={{ textAlign:'left' }}><Mono size={13} weight={700}>${c.price}</Mono></div>
            <div style={{ textAlign:'left' }}><Chg dir={c.dir}>{c.chg}</Chg></div>
            {/* action icons — revealed on hover or while open; column is always reserved. */}
            <div style={{ display:'flex', gap:6, justifyContent:'flex-end',
              opacity: (hover || open) ? 1 : 0, pointerEvents: (hover || open) ? 'auto' : 'none', transition:'opacity .16s ease' }}>
              <IconBtn icon="eye" round size={28} active={open} onClick={(e)=>{ e.stopPropagation(); onEye(); }} title="Preview" />
              <IconBtn icon="arrow-right" round size={28} onClick={(e)=>{ e.stopPropagation(); go('dashboard', c); }} title="Open dashboard" />
            </div>
          </React.Fragment>
        )}
      </div>
      {/* inline preview (desktop) — reuses the screener's <Preview>. */}
      {!isMobile && (
        <div style={{ maxHeight: open ? 560 : 0, overflow:'hidden', transition:'max-height .35s ease' }}>
          <Preview c={c} onOpen={()=>go('dashboard', c)} />
        </div>
      )}
    </div>
  );
}

function MiniCalendar() {
  const days = Array.from({length:35},(_,i)=>i-2); // start offset
  const events=[7,12,21,28], today=14;
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
        <Mono size={12} weight={600} color={VM.ink}>May 2026</Mono><Mono size={11} color={VM.ink3}>‹  ›</Mono>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3, textAlign:'center' }}>
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d=> <Mono key={d} size={9} color={VM.ink3} style={{paddingBottom:3}}>{d}</Mono>)}
        {days.map((n,i)=>{
          if(n<1||n>31) return <div key={i}></div>;
          const ev=events.includes(n), isToday=n===today;
          return <div key={i} style={{ fontFamily:VM.mono, fontSize:10.5, padding:'5px 0', borderRadius:5,
            background:isToday?VM.forest:'transparent', color:isToday?VM.paperWarm:VM.ink2,
            border: ev&&!isToday?`1px solid ${VM.terra}`:'1px solid transparent' }}>{n}</div>;
        })}
      </div>
      <div style={{ marginTop:10, paddingTop:8, borderTop:`1px dotted ${VM.border}` }}>
        <Label>Today</Label>
        <div style={{ fontFamily:VM.serif, fontSize:13, color:VM.ink2, marginTop:4 }}>14:00 · FOMC minutes</div>
        <div style={{ fontFamily:VM.serif, fontSize:13, color:VM.ink2 }}>15:30 · US jobless claims</div>
      </div>
    </div>
  );
}

// LEARN banner — resumes an in-progress course, or prompts to start. Links to Learn.
// `progress` = null would render the "start learning" state. Mock data for now.
function LearnBanner({ go, isMobile }) {
  const progress = { title:'Reading a supply chain map', pct:62, step:'3 / 11 modules', streak:4 };
  const [hover, setHover] = React.useState(false);
  const resuming = !!progress;
  return (
    <div onClick={()=>go('learn')} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{ marginBottom: isMobile?16:18, display:'flex', flexDirection: isMobile?'column':'row', alignItems: isMobile?'flex-start':'center',
        gap: isMobile?12:18, padding: isMobile?'15px 16px':'15px 20px', cursor:'pointer',
        background:`linear-gradient(100deg, ${VM.tealTint} 0%, ${VM.paper} 70%)`,
        border:`1px solid ${hover?VM.tealTint2:VM.borderSoft}`, borderRadius:14, transition:'border-color .15s ease' }}>
      <span style={{ width:44, height:44, borderRadius:12, background:VM.forest, color:VM.paperWarm, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <i className={'ti ti-'+(resuming?'player-play-filled':'school')} style={{ fontSize:resuming?18:22 }}></i>
      </span>
      <div style={{ flex:1, minWidth:0, width:'100%' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          <Kicker>{resuming ? 'Continue learning' : 'Start learning'}</Kicker>
          {resuming && <Mono size={9.5} color={VM.ink3}>· {progress.streak}-day streak</Mono>}
        </div>
        <div style={{ fontFamily:VM.serif, fontWeight:700, fontSize: isMobile?16:18, margin:'3px 0 0', color:VM.ink }}>
          {resuming ? progress.title : 'Learn finance, markets and how to use Veridian.'}
        </div>
        {resuming ? (
          <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:8, maxWidth:440 }}>
            <div style={{ flex:1 }}><ProgressBar v={progress.pct} /></div>
            <Mono size={10} color={VM.ink3} style={{ whiteSpace:'nowrap' }}>{progress.pct}% · {progress.step}</Mono>
          </div>
        ) : (
          <div style={{ fontFamily:VM.serif, fontSize:14, color:VM.ink2, marginTop:3 }}>Short courses and guides — pick up a path in a few minutes.</div>
        )}
      </div>
      <Btn solid style={{ flexShrink:0 }}>{resuming ? 'Resume' : 'Browse courses'} <i className="ti ti-arrow-right" style={{ fontSize:15 }}></i></Btn>
    </div>
  );
}

Object.assign(window, { FrontPage });
