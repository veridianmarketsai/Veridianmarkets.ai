// Veridian Markets — Learn VM page.
// A course/guide catalogue: learn finance, business & markets — and how to use
// Veridian itself. Coursera-style "most popular" rail reimagined in the VM
// editorial style. Category pills + level/format filters + live search + a card
// grid with "Show more". All content below is mock scaffold data (no real API
// yet) — kept inline so the page is self-contained; promote to data.jsx later.
const { useState: useStateLearn } = React;

// ── Categories (the filter pills). 'all' is synthesised, the rest are real ──
const LEARN_CATS = [
  { id:'all',        label:'All' },
  { id:'using-vm',   label:'Using Veridian', icon:'compass' },
  { id:'markets',    label:'Markets 101',    icon:'school' },
  { id:'finance',    label:'Finance',        icon:'businessplan' },
  { id:'investing',  label:'Investing',      icon:'chart-candle' },
  { id:'business',   label:'Business management', icon:'briefcase' },
  { id:'economics',  label:'Economics',      icon:'world' },
  { id:'trading',    label:'Trading',        icon:'arrows-exchange' },
  { id:'personal',   label:'Personal finance', icon:'pig-money' },
  { id:'supply',     label:'Supply chains',  icon:'affiliate' },
  { id:'risk',       label:'Risk & strategy', icon:'shield-half' },
  { id:'data',       label:'Data & charts',  icon:'chart-dots' },
];

// Per-category colour coding for the card visual (soft tint bg + ink).
function catTint(cat) {
  const map = {
    'using-vm':  { bg:'rgba(29,78,58,0.10)',  fg:VM.forest,  icon:'compass' },
    markets:     { bg:VM.tealTint,            fg:VM.teal,    icon:'school' },
    finance:     { bg:'rgba(45,94,90,0.10)',  fg:VM.teal,    icon:'businessplan' },
    investing:   { bg:'rgba(196,106,59,0.12)',fg:VM.terra,   icon:'chart-candle' },
    business:    { bg:'rgba(29,78,58,0.09)',  fg:VM.forest,  icon:'briefcase' },
    economics:   { bg:'rgba(45,94,90,0.08)',  fg:VM.teal,    icon:'world' },
    trading:     { bg:'rgba(179,90,58,0.12)', fg:VM.rust,    icon:'arrows-exchange' },
    personal:    { bg:'rgba(29,158,117,0.12)',fg:VM.upInk,   icon:'pig-money' },
    supply:      { bg:'rgba(15,110,86,0.10)', fg:VM.tealInk, icon:'affiliate' },
    risk:        { bg:'rgba(163,45,45,0.09)', fg:VM.downInk, icon:'shield-half' },
    data:        { bg:'rgba(45,94,90,0.10)',  fg:VM.teal,    icon:'chart-dots' },
  };
  return map[cat] || { bg:VM.paperDeep, fg:VM.ink2, icon:'book' };
}

const LEARN_LEVELS  = ['Beginner', 'Intermediate', 'Advanced'];
const LEARN_FORMATS = ['Course', 'Path', 'Guide', 'Interactive'];

// ── The catalogue (mock). `tag` drives the coloured badge; `route` (optional)
//    lets an "App tutorial" card jump straight into the relevant screen. ─────
const LEARN_SEED_COURSES = [
  { id:1,  title:'The Anatomy of a Market',           cat:'markets',   provider:'Veridian Academy', level:'Beginner',     format:'Course',      length:'6 lessons',   tag:'Start here' },
  { id:2,  title:'Veridian in 10 Minutes',            cat:'using-vm',  provider:'Veridian Markets', level:'Beginner',     format:'Interactive', length:'10 min',      tag:'App tutorial', route:'front' },
  { id:3,  title:'Reading a Company’s Financials',    cat:'finance',   provider:'Veridian Academy', level:'Intermediate', format:'Course',      length:'8 lessons',   tag:'Most read' },
  { id:4,  title:'Building Your First Portfolio',     cat:'investing', provider:'Veridian Academy', level:'Beginner',     format:'Path',        length:'5 modules',   tag:'Popular' },
  { id:5,  title:'How Supply Chains Move Prices',     cat:'supply',    provider:'Veridian Academy', level:'Intermediate', format:'Course',      length:'7 lessons',   tag:'New' },
  { id:6,  title:'Mapping a Company’s Network',       cat:'using-vm',  provider:'Veridian Markets', level:'Intermediate', format:'Interactive', length:'12 min',      tag:'App tutorial', route:'supply' },
  { id:7,  title:'Cash Flow for Managers',            cat:'business',  provider:'Bretton House',    level:'Intermediate', format:'Guide',       length:'30 min read', tag:null },
  { id:8,  title:'Reading Charts Without Fooling Yourself', cat:'data', provider:'The Ledger',     level:'Beginner',     format:'Guide',       length:'20 min read', tag:'Most read' },
  { id:9,  title:'The Screener, End to End',          cat:'using-vm',  provider:'Veridian Markets', level:'Intermediate', format:'Interactive', length:'15 min',      tag:'App tutorial', route:'screener' },
  { id:10, title:'Macro for Investors',               cat:'economics', provider:'Bretton House',    level:'Intermediate', format:'Course',      length:'9 lessons',   tag:null },
  { id:11, title:'Risk, Position Sizing & Drawdowns', cat:'risk',      provider:'Veridian Academy', level:'Advanced',     format:'Course',      length:'6 lessons',   tag:'Advanced' },
  { id:12, title:'Personal Finance Foundations',      cat:'personal',  provider:'Veridian Academy', level:'Beginner',     format:'Path',        length:'5 modules',   tag:null },
  { id:13, title:'How Interest Rates Work',           cat:'economics', provider:'Veridian Academy', level:'Beginner',     format:'Course',      length:'4 lessons',   tag:null },
  { id:14, title:'Valuation: From Multiples to DCF',  cat:'investing', provider:'The Ledger',       level:'Advanced',     format:'Course',      length:'10 lessons',  tag:'Advanced' },
  { id:15, title:'Trading Psychology',                cat:'trading',   provider:'Veridian Academy', level:'Intermediate', format:'Guide',       length:'25 min read', tag:null },
  { id:16, title:'Bonds & Yield, Demystified',        cat:'finance',   provider:'Bretton House',    level:'Intermediate', format:'Course',      length:'7 lessons',   tag:null },
  { id:17, title:'From Idea to Business Plan',         cat:'business',  provider:'Veridian Academy', level:'Beginner',     format:'Path',        length:'6 modules',   tag:'New' },
  { id:18, title:'Building Watchlists That Work',      cat:'using-vm',  provider:'Veridian Markets', level:'Beginner',     format:'Interactive', length:'8 min',       tag:'App tutorial', route:'myportfolio' },
];

const TAG_TONE = {
  'Start here':   { bg:VM.forest,            fg:VM.paperWarm, bd:VM.forest },
  'App tutorial': { bg:'rgba(29,78,58,0.10)',fg:VM.forest,    bd:'rgba(29,78,58,0.30)' },
  'Most read':    { bg:VM.tealTint,          fg:VM.tealInk,   bd:VM.tealTint2 },
  'Popular':      { bg:VM.tealTint,          fg:VM.tealInk,   bd:VM.tealTint2 },
  'New':          { bg:'rgba(196,106,59,0.12)', fg:VM.rustDeep, bd:'rgba(196,106,59,0.30)' },
  'Advanced':     { bg:VM.paperDeep,         fg:VM.ink2,      bd:VM.border },
};

// ── Course store ──────────────────────────────────────────────────────────
// The catalogue = built-in seed courses + any courses the admin adds (kept in
// localStorage so they persist and show up here on the Learn page). This is the
// temporary stand-in for a real courses table until the backend exists.
const VM_COURSES_KEY = 'vm_admin_courses';
function vmLoadAddedCourses() {
  try { return JSON.parse(localStorage.getItem(VM_COURSES_KEY)) || []; } catch { return []; }
}
function vmGetCourses() { return LEARN_SEED_COURSES.concat(vmLoadAddedCourses()); }
function vmAddCourse(c) {
  const list = vmLoadAddedCourses();
  const next = { ...c, id: 'u' + Date.now(), added: true };
  list.push(next);
  try { localStorage.setItem(VM_COURSES_KEY, JSON.stringify(list)); } catch {}
  return next;
}
function vmDeleteCourse(id) {
  const list = vmLoadAddedCourses().filter(c => c.id !== id);
  try { localStorage.setItem(VM_COURSES_KEY, JSON.stringify(list)); } catch {}
}
Object.assign(window, { vmGetCourses, vmAddCourse, vmDeleteCourse, vmLoadAddedCourses, LEARN_CATS, LEARN_LEVELS, LEARN_FORMATS, catTint, TAG_TONE });

const PAGE_SIZE = 8;   // cards shown before "Show more"

function Learn({ go, isMobile }) {
  const [cat, setCat]       = useStateLearn('all');
  const [level, setLevel]   = useStateLearn('all');
  const [format, setFormat] = useStateLearn('all');
  const [query, setQuery]   = useStateLearn('');
  const [shown, setShown]   = useStateLearn(PAGE_SIZE);

  const q = query.trim().toLowerCase();
  const filtered = vmGetCourses().filter(c => {
    if (cat !== 'all' && c.cat !== cat) return false;
    if (level !== 'all' && c.level !== level) return false;
    if (format !== 'all' && c.format !== format) return false;
    if (q) {
      const hay = (c.title + ' ' + c.provider + ' ' + (LEARN_CATS.find(x=>x.id===c.cat)?.label || '')).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  const visible = filtered.slice(0, shown);
  const more = filtered.length - visible.length;

  // Any filter change resets the visible window back to the first page.
  const reset = (fn) => { fn(); setShown(PAGE_SIZE); };

  const anyFilter = cat !== 'all' || level !== 'all' || format !== 'all' || q;

  return (
    <div style={{ padding: isMobile ? '14px 16px 56px' : '26px 32px 60px', maxWidth:1180, margin:'0 auto' }}>
      <Kicker>LEARN · VM</Kicker>
      <h1 style={{ fontFamily:VM.serif, fontWeight:700, fontSize: isMobile?27:32, lineHeight:1.07, margin:'10px 0 0' }}>Learn.</h1>
      <p style={{ fontFamily:VM.serif, fontSize: isMobile?15:17, color:VM.ink2, maxWidth:640, margin:'10px 0 0', lineHeight:1.45 }}>
        Short courses and guides on finance, markets and running a business — plus
        everything you need to get the most out of Veridian.
      </p>

      {/* START-HERE strip — a featured path into the product. */}
      <StartHere go={go} isMobile={isMobile} />

      {/* SEARCH */}
      <div style={{ display:'flex', alignItems:'center', gap:9, background:VM.paper, border:`1px solid ${VM.border}`, borderRadius:10, padding:'10px 14px', marginTop:26 }}>
        <i className="ti ti-search" style={{ fontSize:15, color:VM.ink3 }}></i>
        <input value={query} onChange={e=>reset(()=>setQuery(e.target.value))} placeholder="Search courses, guides and tutorials…"
          style={{ flex:1, border:'none', outline:'none', background:'transparent', fontFamily:VM.serif, fontSize:15, color:VM.ink }} />
        {query && <i onClick={()=>reset(()=>setQuery(''))} className="ti ti-x" style={{ fontSize:14, color:VM.ink3, cursor:'pointer' }} title="Clear"></i>}
      </div>

      {/* CATEGORY PILLS */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:16 }}>
        {LEARN_CATS.map(c => (
          <Pill key={c.id} active={cat===c.id} onClick={()=>reset(()=>setCat(c.id))}>
            {c.icon && <i className={'ti ti-'+c.icon} style={{ fontSize:13 }}></i>}{c.label}
          </Pill>
        ))}
      </div>

      {/* SECONDARY FILTERS — level + format */}
      <div style={{ display:'flex', gap: isMobile?14:28, flexWrap:'wrap', marginTop:14, alignItems:'center' }}>
        <FilterGroup label="Level"  value={level}  onPick={v=>reset(()=>setLevel(v))}  options={LEARN_LEVELS} />
        <FilterGroup label="Format" value={format} onPick={v=>reset(()=>setFormat(v))} options={LEARN_FORMATS} />
      </div>

      {/* RESULTS HEADER */}
      <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', margin:'30px 0 14px', gap:12, flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:12 }}>
          <h2 style={{ fontFamily:VM.serif, fontWeight:700, fontSize: isMobile?21:24, margin:0 }}>
            {anyFilter ? 'Results' : 'Most popular'}
          </h2>
          <Mono size={11} color={VM.ink3}>{filtered.length} {filtered.length===1?'item':'items'}</Mono>
        </div>
        {anyFilter && (
          <span onClick={()=>{ setCat('all'); setLevel('all'); setFormat('all'); setQuery(''); setShown(PAGE_SIZE); }}
            style={{ fontFamily:VM.serif, fontSize:13, color:VM.teal, cursor:'pointer' }}>Clear filters ✕</span>
        )}
      </div>

      {/* CARD GRID */}
      {visible.length === 0 ? (
        <div style={{ background:VM.paper, border:`1px dashed ${VM.border}`, borderRadius:12, padding:'40px 20px', textAlign:'center' }}>
          <i className="ti ti-mood-search" style={{ fontSize:26, color:VM.ink3 }}></i>
          <div style={{ fontFamily:VM.serif, fontSize:16, color:VM.ink2, marginTop:10 }}>Nothing matches those filters yet.</div>
          <div style={{ fontFamily:VM.serif, fontSize:13, color:VM.ink3, marginTop:4 }}>Try clearing a filter or searching for something broader.</div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:`repeat(auto-fill, minmax(${isMobile?'100%':'250px'}, 1fr))`, gap: isMobile?14:18 }}>
          {visible.map(c => <CourseCard key={c.id} c={c} go={go} />)}
        </div>
      )}

      {/* SHOW MORE */}
      {more > 0 && (
        <div style={{ marginTop:26, display:'flex', justifyContent:'center' }}>
          <Btn onClick={()=>setShown(s => s + PAGE_SIZE)}>
            <i className="ti ti-chevron-down" style={{ fontSize:15 }}></i>
            Show {Math.min(more, PAGE_SIZE)} more
          </Btn>
        </div>
      )}
    </div>
  );
}

// Inline level/format chooser: a label + a row of toggle pills (one active).
function FilterGroup({ label, value, onPick, options }) {
  const pick = (v) => onPick(value === v ? 'all' : v);   // tapping the active one clears it
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
      <Label>{label}</Label>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        {options.map(o => (
          <button key={o} onClick={()=>pick(o)} style={{
            fontFamily:VM.mono, fontSize:10.5, padding:'4px 11px', borderRadius:999, cursor:'pointer',
            border:`1px solid ${value===o?VM.forest:VM.border}`,
            background: value===o?VM.forest:VM.paper, color: value===o?VM.paperWarm:VM.ink2,
            whiteSpace:'nowrap', transition:'all .12s',
          }}>{o}</button>
        ))}
      </div>
    </div>
  );
}

// A course card — coloured topic visual, provider, title, format & a badge.
// Pops out on hover (matches the front-page story-tile feel). App-tutorial cards
// carry a route and open the relevant screen on click.
function CourseCard({ c, go }) {
  const [hover, setHover] = useStateLearn(false);
  const t = catTint(c.cat);
  const tone = c.tag ? TAG_TONE[c.tag] : null;
  const onOpen = () => { if (c.route) go(c.route); };
  return (
    <div onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} onClick={onOpen}
      style={{ background:VM.paper, border:`1px solid ${hover?VM.border:VM.borderSoft}`, borderRadius:12,
        overflow:'hidden', cursor:'pointer', display:'flex', flexDirection:'column',
        transform: hover ? 'translateY(-3px)' : 'none',
        boxShadow: hover ? '0 10px 22px rgba(31,29,26,0.10)' : 'none',
        transition:'transform .16s ease, box-shadow .16s ease, border-color .16s ease' }}>
      {/* topic visual */}
      <div style={{ height:118, background:t.bg, display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
        <i className={'ti ti-'+t.icon} style={{ fontSize:40, color:t.fg, opacity:0.92 }}></i>
        <span style={{ position:'absolute', left:12, bottom:10 }}>
          <Mono size={9} color={t.fg} weight={700} style={{ letterSpacing:'0.08em', textTransform:'uppercase', opacity:0.85 }}>
            {LEARN_CATS.find(x=>x.id===c.cat)?.label}
          </Mono>
        </span>
        {c.route && <i className="ti ti-arrow-up-right" style={{ position:'absolute', top:10, right:11, fontSize:15, color:t.fg, opacity: hover?1:0.5, transition:'opacity .16s ease' }}></i>}
      </div>
      {/* body */}
      <div style={{ padding:'13px 14px 15px', display:'flex', flexDirection:'column', flex:1 }}>
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <span style={{ width:16, height:16, borderRadius:4, background:VM.forest, color:VM.paperWarm, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <i className="ti ti-leaf" style={{ fontSize:10 }}></i>
          </span>
          <Mono size={10.5} color={VM.ink3}>{c.provider}</Mono>
        </div>
        <div style={{ fontFamily:VM.serif, fontWeight:700, fontSize:16, lineHeight:1.22, margin:'8px 0 0', color:VM.ink }}>{c.title}</div>
        <Mono size={10} color={VM.ink3} style={{ marginTop:6, letterSpacing:'0.04em', textTransform:'uppercase' }}>{c.format}</Mono>
        {/* badge */}
        {tone && (
          <span style={{ alignSelf:'flex-start', marginTop:10, fontFamily:VM.mono, fontSize:9.5, fontWeight:600,
            padding:'3px 9px', borderRadius:999, background:tone.bg, color:tone.fg, border:`1px solid ${tone.bd}`,
            letterSpacing:'0.04em' }}>{c.tag}</span>
        )}
        {/* footer meta */}
        <div style={{ marginTop:'auto', display:'flex', alignItems:'center', gap:8, paddingTop:12, color:VM.ink3 }}>
          <i className="ti ti-stairs" style={{ fontSize:13 }}></i>
          <Mono size={10} color={VM.ink3}>{c.level}</Mono>
          <span style={{ width:3, height:3, borderRadius:999, background:VM.faint }}></span>
          <i className="ti ti-clock" style={{ fontSize:13 }}></i>
          <Mono size={10} color={VM.ink3}>{c.length}</Mono>
        </div>
      </div>
    </div>
  );
}

// Featured "start here" banner — a guided path that points new users at the app.
function StartHere({ go, isMobile }) {
  const [hover, setHover] = useStateLearn(false);
  return (
    <div onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} onClick={()=>go('front')}
      style={{ marginTop:24, display:'flex', flexDirection: isMobile?'column':'row', alignItems: isMobile?'flex-start':'center',
        gap: isMobile?14:20, padding: isMobile?'18px' :'20px 24px', cursor:'pointer',
        background:`linear-gradient(100deg, ${VM.tealTint} 0%, ${VM.paper} 70%)`,
        border:`1px solid ${hover?VM.tealTint2:VM.borderSoft}`, borderRadius:14,
        transition:'border-color .16s ease' }}>
      <span style={{ width:48, height:48, borderRadius:12, background:VM.forest, color:VM.paperWarm, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <i className="ti ti-compass" style={{ fontSize:24 }}></i>
      </span>
      <div style={{ flex:1 }}>
        <Kicker>NEW HERE? · GUIDED PATH</Kicker>
        <div style={{ fontFamily:VM.serif, fontWeight:700, fontSize: isMobile?18:20, margin:'4px 0 0' }}>Get started with Veridian in 10 minutes.</div>
        <div style={{ fontFamily:VM.serif, fontSize:14, color:VM.ink2, marginTop:3 }}>Five short steps: read the markets, find a company, map its supply chain, build a watchlist.</div>
      </div>
      <Btn solid style={{ flexShrink:0 }}>Start the path <i className="ti ti-arrow-right" style={{ fontSize:15 }}></i></Btn>
    </div>
  );
}

Object.assign(window, { Learn });
