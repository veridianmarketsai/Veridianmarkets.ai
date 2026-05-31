// Veridian Markets — Learn page.
const { useState: useStateLearn } = React;

const LEARN_CATS = [
  { id:'all',       label:'All' },
  { id:'using-vm',  label:'Using Veridian',     icon:'compass'        },
  { id:'markets',   label:'Markets 101',         icon:'school'         },
  { id:'finance',   label:'Finance',             icon:'businessplan'   },
  { id:'investing', label:'Investing',           icon:'chart-candle'   },
  { id:'business',  label:'Business management', icon:'briefcase'      },
  { id:'economics', label:'Economics',           icon:'world'          },
  { id:'trading',   label:'Trading',             icon:'arrows-exchange'},
  { id:'personal',  label:'Personal finance',    icon:'pig-money'      },
  { id:'supply',    label:'Supply chains',       icon:'affiliate'      },
  { id:'risk',      label:'Risk & strategy',     icon:'shield-half'    },
  { id:'data',      label:'Data & charts',       icon:'chart-dots'     },
];
function catTint(cat) {
  const map = {
    'using-vm': { bg:'rgba(29,78,58,0.10)',   fg:VM.forest,  icon:'compass'         },
    markets:    { bg:VM.tealTint,             fg:VM.teal,    icon:'school'          },
    finance:    { bg:'rgba(45,94,90,0.10)',   fg:VM.teal,    icon:'businessplan'    },
    investing:  { bg:'rgba(196,106,59,0.12)', fg:VM.terra,   icon:'chart-candle'    },
    business:   { bg:'rgba(29,78,58,0.09)',   fg:VM.forest,  icon:'briefcase'       },
    economics:  { bg:'rgba(45,94,90,0.08)',   fg:VM.teal,    icon:'world'           },
    trading:    { bg:'rgba(179,90,58,0.12)',  fg:VM.rust,    icon:'arrows-exchange' },
    personal:   { bg:'rgba(29,158,117,0.12)',fg:VM.upInk,   icon:'pig-money'       },
    supply:     { bg:'rgba(15,110,86,0.10)',  fg:VM.tealInk, icon:'affiliate'       },
    risk:       { bg:'rgba(163,45,45,0.09)',  fg:VM.downInk, icon:'shield-half'     },
    data:       { bg:'rgba(45,94,90,0.10)',   fg:VM.teal,    icon:'chart-dots'      },
  };
  return map[cat] || { bg:VM.paperDeep, fg:VM.ink2, icon:'book' };
}
const LEARN_LEVELS  = ['Beginner','Intermediate','Advanced'];
const LEARN_FORMATS = ['Course','Path','Guide','Interactive'];
const TAG_TONE = {
  'Start here':   { bg:VM.forest,               fg:VM.paperWarm, bd:VM.forest                  },
  'App tutorial': { bg:'rgba(29,78,58,0.10)',   fg:VM.forest,   bd:'rgba(29,78,58,0.30)'       },
  'Most read':    { bg:VM.tealTint,             fg:VM.tealInk,  bd:VM.tealTint2                },
  'Popular':      { bg:VM.tealTint,             fg:VM.tealInk,  bd:VM.tealTint2                },
  'New':          { bg:'rgba(196,106,59,0.12)', fg:VM.rustDeep, bd:'rgba(196,106,59,0.30)'     },
  'Advanced':     { bg:VM.paperDeep,            fg:VM.ink2,     bd:VM.border                   },
};
const PAGE_SIZE = 8;

const LEARN_COURSES = [
  { id:1,  title:'The Anatomy of a Market',           cat:'markets',   provider:'Veridian Academy', level:'Beginner',     format:'Course',      length:'6 lessons',   tag:'Start here',
    lessons:[{n:1,title:'What is a market?',dur:'8 min'},{n:2,title:'Buyers, sellers and the spread',dur:'7 min'},{n:3,title:'Price discovery and information',dur:'9 min'},{n:4,title:'Market types: equities, bonds, commodities',dur:'10 min'},{n:5,title:'How indices are built',dur:'8 min'},{n:6,title:'Reading a market day',dur:'6 min'}] },

  { id:2,  title:'Veridian in 10 Minutes',            cat:'using-vm',  provider:'Veridian Markets', level:'Beginner',     format:'Interactive', length:'10 min',      tag:'App tutorial', route:'front',
    description:'A guided walkthrough of Veridian Markets. In ten minutes you\'ll read the live market strip, find a company, trace its supply chain, and save a watchlist.',
    highlights:['Navigate the market strip and front page','Search for and open a company profile','Read a supply chain dependency map','Build a portfolio watchlist'] },

  { id:3,  title:'Reading a Company’s Financials', cat:'finance',   provider:'Veridian Academy', level:'Intermediate', format:'Course',      length:'8 lessons',   tag:'Most read',
    lessons:[{n:1,title:'The income statement',dur:'10 min'},{n:2,title:'The balance sheet',dur:'10 min'},{n:3,title:'Cash flow statement',dur:'9 min'},{n:4,title:'Key ratios: P/E, EV/EBITDA',dur:'11 min'},{n:5,title:'Gross margin and what it reveals',dur:'8 min'},{n:6,title:'Spotting red flags',dur:'9 min'},{n:7,title:'Comparing across peers',dur:'10 min'},{n:8,title:"Practice: reading AAPL's 10-K",dur:'12 min'}] },

  { id:4,  title:'Building Your First Portfolio',     cat:'investing', provider:'Veridian Academy', level:'Beginner',     format:'Path',        length:'5 modules',   tag:'Popular',
    lessons:[{n:1,title:'Defining your investment goal',dur:'6 min'},{n:2,title:'Risk tolerance and time horizon',dur:'8 min'},{n:3,title:'Picking your first holdings',dur:'10 min'},{n:4,title:'Diversification in practice',dur:'8 min'},{n:5,title:'When to review and rebalance',dur:'7 min'}] },

  { id:5,  title:'How Supply Chains Move Prices',     cat:'supply',    provider:'Veridian Academy', level:'Intermediate', format:'Course',      length:'7 lessons',   tag:'New',
    lessons:[{n:1,title:'What is a supply chain?',dur:'7 min'},{n:2,title:'Tier-1 vs Tier-2 suppliers',dur:'8 min'},{n:3,title:'Concentration risk',dur:'9 min'},{n:4,title:'Geopolitical dependencies',dur:'10 min'},{n:5,title:'How disruptions propagate',dur:'8 min'},{n:6,title:'Reading a dependency map',dur:'9 min'},{n:7,title:'Supply chains and equity prices',dur:'10 min'}] },

  { id:6,  title:'Mapping a Company’s Network',  cat:'using-vm',  provider:'Veridian Markets', level:'Intermediate', format:'Interactive', length:'12 min',      tag:'App tutorial', route:'supply',
    description:'An interactive guide to the Supply Chain Network tool. Navigate the dependency map, drill from principle to supplier, and understand what relationship types mean for risk.',
    highlights:['Read the supply chain canvas','Drill down from principle to tier-2 supplier','Interpret inputs vs customers columns','Understand concentration and geopolitical risk'] },

  { id:7,  title:'Cash Flow for Managers',            cat:'business',  provider:'Bretton House',    level:'Intermediate', format:'Guide',       length:'30 min read', tag:null,
    description:'A practical guide to reading and using cash flow statements — written for managers who need to understand financial health without an accounting background.',
    highlights:['Operating vs investing vs financing flows','Free cash flow and why it matters','Cash conversion cycle','Cash flow as a quality signal'] },

  { id:8,  title:'Reading Charts Without Fooling Yourself', cat:'data', provider:'The Ledger',     level:'Beginner',     format:'Guide',       length:'20 min read', tag:'Most read',
    description:'A clear-eyed guide to charts and technical analysis: what they can and cannot tell you, the patterns worth knowing, and the cognitive traps that burn most readers.',
    highlights:['Support, resistance and what they actually mean','Volume as confirmation','The five patterns worth knowing','How to avoid over-fitting your read'] },

  { id:9,  title:'The Screener, End to End',          cat:'using-vm',  provider:'Veridian Markets', level:'Intermediate', format:'Interactive', length:'15 min',      tag:'App tutorial', route:'screener',
    description:'A complete walkthrough of the company screener. Covers search, filters, the inline preview panel, and navigating from screener to full company dashboard.',
    highlights:['Filter by sector, market cap, and fundamentals','Read the inline company preview tabs','Understand the analogue match score','Move from screener to dashboard to supply chain'] },

  { id:10, title:'Macro for Investors',               cat:'economics', provider:'Bretton House',    level:'Intermediate', format:'Course',      length:'9 lessons',   tag:null,
    lessons:[{n:1,title:'GDP: what it tells you',dur:'8 min'},{n:2,title:'Inflation and the CPI',dur:'9 min'},{n:3,title:'Central banks and rates',dur:'10 min'},{n:4,title:'The yield curve',dur:'9 min'},{n:5,title:'Currency markets',dur:'8 min'},{n:6,title:'Commodity cycles',dur:'9 min'},{n:7,title:'Credit spreads',dur:'8 min'},{n:8,title:'Leading vs lagging indicators',dur:'9 min'},{n:9,title:'Putting it all together',dur:'10 min'}] },

  { id:11, title:'Risk, Position Sizing & Drawdowns', cat:'risk',      provider:'Veridian Academy', level:'Advanced',     format:'Course',      length:'6 lessons',   tag:'Advanced',
    lessons:[{n:1,title:'What is risk, really?',dur:'8 min'},{n:2,title:'Volatility vs drawdown',dur:'9 min'},{n:3,title:'Kelly criterion and sizing',dur:'11 min'},{n:4,title:'Concentration and correlation',dur:'9 min'},{n:5,title:'Tail risk and black swans',dur:'10 min'},{n:6,title:'Building a risk framework',dur:'9 min'}] },

  { id:12, title:'Personal Finance Foundations',      cat:'personal',  provider:'Veridian Academy', level:'Beginner',     format:'Path',        length:'5 modules',   tag:null,
    lessons:[{n:1,title:'Budgeting and net worth',dur:'7 min'},{n:2,title:'Emergency funds and insurance',dur:'8 min'},{n:3,title:'Debt: good and bad',dur:'8 min'},{n:4,title:'Pensions and ISAs',dur:'9 min'},{n:5,title:'Tax efficiency',dur:'8 min'}] },

  { id:13, title:'How Interest Rates Work',           cat:'economics', provider:'Veridian Academy', level:'Beginner',     format:'Course',      length:'4 lessons',   tag:null,
    lessons:[{n:1,title:'The price of money',dur:'8 min'},{n:2,title:'Central bank policy',dur:'9 min'},{n:3,title:'Rates and asset prices',dur:'10 min'},{n:4,title:'Where rates go next',dur:'7 min'}] },

  { id:14, title:'Valuation: From Multiples to DCF',  cat:'investing', provider:'The Ledger',       level:'Advanced',     format:'Course',      length:'10 lessons',  tag:'Advanced',
    lessons:[{n:1,title:'Why valuation matters',dur:'7 min'},{n:2,title:'P/E and EV/EBITDA in practice',dur:'9 min'},{n:3,title:'Price-to-book and asset plays',dur:'8 min'},{n:4,title:'Revenue multiples for growth',dur:'9 min'},{n:5,title:'Discounted cash flow: theory',dur:'11 min'},{n:6,title:'Building a DCF model',dur:'13 min'},{n:7,title:'Sensitivity analysis',dur:'10 min'},{n:8,title:'Comparable company analysis',dur:'11 min'},{n:9,title:'Sum-of-the-parts',dur:'9 min'},{n:10,title:'Sanity-checking your output',dur:'8 min'}] },

  { id:15, title:'Trading Psychology',                cat:'trading',   provider:'Veridian Academy', level:'Intermediate', format:'Guide',       length:'25 min read', tag:null,
    description:'The mental game of markets: overconfidence, loss aversion, FOMO, and the systems that protect you from yourself.',
    highlights:['Why smart people make bad trades','The five biases that hurt performance most','Building a pre-trade checklist','Journalling and reviewing your process'] },

  { id:16, title:'Bonds & Yield, Demystified',        cat:'finance',   provider:'Bretton House',    level:'Intermediate', format:'Course',      length:'7 lessons',   tag:null,
    lessons:[{n:1,title:'What is a bond?',dur:'7 min'},{n:2,title:'Yield and duration',dur:'9 min'},{n:3,title:'Credit ratings',dur:'8 min'},{n:4,title:'Government vs corporate bonds',dur:'9 min'},{n:5,title:'High-yield and distressed debt',dur:'10 min'},{n:6,title:'Bonds in a portfolio',dur:'8 min'},{n:7,title:'Reading bond markets',dur:'9 min'}] },

  { id:17, title:'From Idea to Business Plan',        cat:'business',  provider:'Veridian Academy', level:'Beginner',     format:'Path',        length:'6 modules',   tag:'New',
    lessons:[{n:1,title:'Idea validation',dur:'8 min'},{n:2,title:'Market sizing: TAM, SAM, SOM',dur:'10 min'},{n:3,title:'Business model design',dur:'9 min'},{n:4,title:'Financial projections',dur:'11 min'},{n:5,title:'The pitch deck',dur:'8 min'},{n:6,title:'Feedback and iteration',dur:'7 min'}] },

  { id:18, title:'Building Watchlists That Work',     cat:'using-vm',  provider:'Veridian Markets', level:'Beginner',     format:'Interactive', length:'8 min',       tag:'App tutorial', route:'myportfolio',
    description:'How to build and maintain a watchlist in Veridian. Covers connecting a broker account, customising the dashboard layout, and reading the analogue alerts.',
    highlights:['Connect a broker account','Add and remove companies from your watchlist','Customise the dashboard layout','Read and act on analogue alert signals'] },
];

// ── Main page ─────────────────────────────────────────────────────────────────
function Learn({ go, isMobile }) {
  const [cat, setCat]       = useStateLearn('all');
  const [level, setLevel]   = useStateLearn('all');
  const [format, setFormat] = useStateLearn('all');
  const [query, setQuery]   = useStateLearn('');
  const [shown, setShown]   = useStateLearn(PAGE_SIZE);
  const [openCourse, setOpenCourse]   = useStateLearn(null);
  const [startLesson, setStartLesson] = useStateLearn(null); // { course, lesson } — for interactive/guide only
  const [lessonView,  setLessonView]  = useStateLearn(null); // { course, lesson } — full lesson viewer

  const q = query.trim().toLowerCase();
  const filtered = LEARN_COURSES.filter(c => {
    if (cat !== 'all' && c.cat !== cat) return false;
    if (level !== 'all' && c.level !== level) return false;
    if (format !== 'all' && c.format !== format) return false;
    if (q) {
      const hay = (c.title+' '+c.provider+' '+(LEARN_CATS.find(x=>x.id===c.cat)?.label||'')).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  const visible = filtered.slice(0, shown);
  const more    = filtered.length - visible.length;
  const reset   = fn => { fn(); setShown(PAGE_SIZE); };
  const anyFilter = cat!=='all' || level!=='all' || format!=='all' || q;

  return (
    <div style={{ padding: isMobile?'14px 16px 56px':'26px 32px 60px', maxWidth:1180, margin:'0 auto' }}>
      <Kicker>LEARN · VM</Kicker>
      <h1 style={{ fontFamily:VM.serif, fontWeight:700, fontSize:isMobile?27:32, lineHeight:1.07, margin:'10px 0 0' }}>Learn.</h1>
      <p style={{ fontFamily:VM.serif, fontSize:isMobile?15:17, color:VM.ink2, maxWidth:640, margin:'10px 0 0', lineHeight:1.45 }}>
        Short courses and guides on finance, markets and running a business — plus everything you need to get the most out of Veridian.
      </p>

      <StartHere go={go} isMobile={isMobile} onOpen={()=>setOpenCourse(LEARN_COURSES.find(c=>c.id===2))} />

      <div style={{ display:'flex', alignItems:'center', gap:9, background:VM.paper, border:`1px solid ${VM.border}`, borderRadius:10, padding:'10px 14px', marginTop:26 }}>
        <i className="ti ti-search" style={{ fontSize:15, color:VM.ink3 }}></i>
        <input value={query} onChange={e=>reset(()=>setQuery(e.target.value))} placeholder="Search courses, guides and tutorials…"
          style={{ flex:1, border:'none', outline:'none', background:'transparent', fontFamily:VM.serif, fontSize:15, color:VM.ink }} />
        {query && <i onClick={()=>reset(()=>setQuery(''))} className="ti ti-x" style={{ fontSize:14, color:VM.ink3, cursor:'pointer' }}></i>}
      </div>

      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:16 }}>
        {LEARN_CATS.map(c=>(
          <Pill key={c.id} active={cat===c.id} onClick={()=>reset(()=>setCat(c.id))}>
            {c.icon && <i className={'ti ti-'+c.icon} style={{ fontSize:13 }}></i>}{c.label}
          </Pill>
        ))}
      </div>

      <div style={{ display:'flex', gap:isMobile?14:28, flexWrap:'wrap', marginTop:14, alignItems:'center' }}>
        <FilterGroup label="Level"  value={level}  onPick={v=>reset(()=>setLevel(v))}  options={LEARN_LEVELS} />
        <FilterGroup label="Format" value={format} onPick={v=>reset(()=>setFormat(v))} options={LEARN_FORMATS} />
      </div>

      <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', margin:'30px 0 14px', gap:12, flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:12 }}>
          <h2 style={{ fontFamily:VM.serif, fontWeight:700, fontSize:isMobile?21:24, margin:0 }}>
            {anyFilter ? 'Results' : 'Most popular'}
          </h2>
          <Mono size={11} color={VM.ink3}>{filtered.length} {filtered.length===1?'item':'items'}</Mono>
        </div>
        {anyFilter && (
          <span onClick={()=>{ setCat('all');setLevel('all');setFormat('all');setQuery('');setShown(PAGE_SIZE); }}
            style={{ fontFamily:VM.serif, fontSize:13, color:VM.teal, cursor:'pointer' }}>Clear filters ✕</span>
        )}
      </div>

      {visible.length===0 ? (
        <div style={{ background:VM.paper, border:`1px dashed ${VM.border}`, borderRadius:12, padding:'40px 20px', textAlign:'center' }}>
          <i className="ti ti-mood-search" style={{ fontSize:26, color:VM.ink3 }}></i>
          <div style={{ fontFamily:VM.serif, fontSize:16, color:VM.ink2, marginTop:10 }}>Nothing matches those filters yet.</div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:`repeat(auto-fill, minmax(${isMobile?'100%':'250px'},1fr))`, gap:isMobile?14:18 }}>
          {visible.map(c=><CourseCard key={c.id} c={c} onOpen={()=>setOpenCourse(c)} />)}
        </div>
      )}

      {more > 0 && (
        <div style={{ marginTop:26, display:'flex', justifyContent:'center' }}>
          <Btn onClick={()=>setShown(s=>s+PAGE_SIZE)}>
            <i className="ti ti-chevron-down" style={{ fontSize:15 }}></i>
            Show {Math.min(more,PAGE_SIZE)} more
          </Btn>
        </div>
      )}

      {/* Full-screen course overlay */}
      {openCourse && (
        <CourseOverlay
          c={openCourse}
          go={go}
          isMobile={isMobile}
          onClose={()=>setOpenCourse(null)}
          onStart={lesson=>{
            if (lesson) setLessonView({ course:openCourse, lesson });          // lesson row → viewer
            else setStartLesson({ course:openCourse, lesson:null });            // interactive/guide CTA → modal
          }}
        />
      )}

      {/* Lesson viewer — full page, opens over the course overlay */}
      {lessonView && (
        <LessonViewer
          course={lessonView.course}
          lesson={lessonView.lesson}
          onClose={()=>setLessonView(null)}
          onNav={lesson=>setLessonView({ course:lessonView.course, lesson })}
          isMobile={isMobile}
        />
      )}

      {/* Start modal — interactive/guide only */}
      {startLesson && (
        <StartModal
          course={startLesson.course}
          lesson={startLesson.lesson}
          go={go}
          onClose={()=>setStartLesson(null)}
        />
      )}
    </div>
  );
}

// ── Full-screen course overlay ────────────────────────────────────────────────
function CourseOverlay({ c, go, isMobile, onClose, onStart }) {
  const t         = catTint(c.cat);
  const tone      = c.tag ? TAG_TONE[c.tag] : null;
  const hasLessons = c.lessons && c.lessons.length > 0;
  const catLabel  = LEARN_CATS.find(x=>x.id===c.cat)?.label || '';

  React.useEffect(()=>{
    const h = e => { if(e.key==='Escape') onClose(); };
    window.addEventListener('keydown', h);
    return ()=>window.removeEventListener('keydown', h);
  },[]);

  return ReactDOM.createPortal(
    <div style={{ position:'fixed', inset:0, zIndex:300, display:'flex', alignItems:'center', justifyContent:'center',
      background:'rgba(31,29,26,0.58)', padding: isMobile ? 12 : 24 }} onClick={onClose}>

      {/* modal card */}
      <div onClick={e=>e.stopPropagation()} style={{ background:VM.paperWarm, borderRadius:16,
        border:`1px solid ${VM.borderSoft}`, width:'100%', maxWidth:580, maxHeight:'88vh',
        overflowY:'auto', boxShadow:'0 32px 72px rgba(31,29,26,0.28)', display:'flex', flexDirection:'column' }}>

        {/* card header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'14px 20px', borderBottom:`1px solid ${VM.borderHair}`,
          position:'sticky', top:0, background:VM.paperWarm, zIndex:1, flexShrink:0 }}>
          <Mono size={10} weight={700} color={VM.ink3} style={{ letterSpacing:'0.08em', textTransform:'uppercase' }}>
            {catLabel}
          </Mono>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:999, border:`1px solid ${VM.border}`,
            background:VM.paper, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
            color:VM.ink2, padding:0 }}>
            <i className="ti ti-x" style={{ fontSize:15 }}></i>
          </button>
        </div>

        {/* scrollable body */}
        <div style={{ padding: isMobile?'20px 18px 28px':'24px 24px 32px' }}>

        {/* hero */}
        <div style={{ height:120, background:t.bg, borderRadius:12, display:'flex', alignItems:'center',
          justifyContent:'center', position:'relative', marginBottom:20, border:`1px solid ${VM.borderSoft}` }}>
          <i className={'ti ti-'+t.icon} style={{ fontSize:60, color:t.fg, opacity:0.85 }}></i>
          <span style={{ position:'absolute', left:18, bottom:14 }}>
            <Mono size={10} color={t.fg} weight={700} style={{ letterSpacing:'0.08em', textTransform:'uppercase', opacity:0.9 }}>{catLabel}</Mono>
          </span>
          {tone && (
            <span style={{ position:'absolute', right:16, top:14, fontFamily:VM.mono, fontSize:9.5, fontWeight:600,
              padding:'3px 10px', borderRadius:999, background:tone.bg, color:tone.fg, border:`1px solid ${tone.bd}` }}>{c.tag}</span>
          )}
        </div>

        {/* provider */}
        <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:8 }}>
          <span style={{ width:18, height:18, borderRadius:4, background:VM.forest, color:VM.paperWarm,
            display:'flex', alignItems:'center', justifyContent:'center' }}>
            <i className="ti ti-leaf" style={{ fontSize:11 }}></i>
          </span>
          <Mono size={11} color={VM.ink3}>{c.provider}</Mono>
        </div>

        {/* title + meta */}
        <h1 style={{ fontFamily:VM.serif, fontWeight:700, fontSize:isMobile?24:32, margin:'0 0 10px', lineHeight:1.1 }}>{c.title}</h1>
        <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap', marginBottom:24 }}>
          <Mono size={10} color={VM.ink3} style={{ textTransform:'uppercase', letterSpacing:'0.06em' }}>{c.format}</Mono>
          <span style={{ width:3, height:3, borderRadius:999, background:VM.faint }}></span>
          <Mono size={10} color={VM.ink3}><i className="ti ti-stairs" style={{ fontSize:12, marginRight:4 }}></i>{c.level}</Mono>
          <span style={{ width:3, height:3, borderRadius:999, background:VM.faint }}></span>
          <Mono size={10} color={VM.ink3}><i className="ti ti-clock" style={{ fontSize:12, marginRight:4 }}></i>{c.length}</Mono>
        </div>

        {/* description */}
        {c.description && (
          <p style={{ fontFamily:VM.serif, fontSize:16, color:VM.ink2, lineHeight:1.65, margin:'0 0 24px' }}>{c.description}</p>
        )}

        {/* highlights */}
        {c.highlights && (
          <div style={{ background:VM.tealTint, border:`1px solid ${VM.tealTint2}`, borderRadius:12, padding:'16px 18px', marginBottom:28 }}>
            <Mono size={10} color={VM.teal} weight={700} style={{ display:'block', marginBottom:10, letterSpacing:'0.07em', textTransform:'uppercase' }}>What you'll cover</Mono>
            {c.highlights.map((h,i)=>(
              <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'4px 0' }}>
                <i className="ti ti-check" style={{ fontSize:13, color:VM.tealInk, marginTop:2, flexShrink:0 }}></i>
                <span style={{ fontFamily:VM.serif, fontSize:14, color:VM.ink2 }}>{h}</span>
              </div>
            ))}
          </div>
        )}

        {/* video placeholder for Interactive */}
        {c.format==='Interactive' && (
          <div onClick={()=>onStart(null)} style={{ background:VM.paperDeep, border:`1px solid ${VM.borderSoft}`,
            borderRadius:14, height:240, display:'flex', flexDirection:'column', alignItems:'center',
            justifyContent:'center', gap:12, marginBottom:28, cursor:'pointer' }}>
            <div style={{ width:60, height:60, borderRadius:999, background:VM.forest, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <i className="ti ti-player-play-filled" style={{ fontSize:24, color:VM.paperWarm, marginLeft:3 }}></i>
            </div>
            <Mono size={11} color={VM.ink3}>{c.length} · click to begin</Mono>
          </div>
        )}

        {/* guide preview */}
        {c.format==='Guide' && (
          <div style={{ background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:12, padding:'20px 24px', marginBottom:28 }}>
            <Mono size={10} color={VM.ink3} weight={700} style={{ display:'block', marginBottom:10, letterSpacing:'0.06em', textTransform:'uppercase' }}>Preview</Mono>
            <p style={{ fontFamily:VM.serif, fontSize:15, color:VM.ink2, lineHeight:1.65, margin:0 }}>
              {c.description} Written to be read in one sitting — no prior knowledge beyond the level listed above.
            </p>
          </div>
        )}

        {/* CTA for non-lesson formats */}
        {!hasLessons && (
          <Btn solid onClick={()=>onStart(null)} style={{ fontSize:15, padding:'11px 24px' }}>
            {c.format==='Interactive' ? 'Begin interactive' : 'Start reading'}
            <i className="ti ti-arrow-right" style={{ fontSize:16 }}></i>
          </Btn>
        )}

        {/* lesson list */}
        {hasLessons && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14 }}>
              <h2 style={{ fontFamily:VM.serif, fontWeight:700, fontSize:20, margin:0 }}>Lessons</h2>
              <Mono size={10} color={VM.ink3}>{c.lessons.length} lessons</Mono>
            </div>
            <div style={{ background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:12, overflow:'hidden', marginBottom:20 }}>
              {c.lessons.map((l,i)=>(
                <LessonRow key={l.n} lesson={l} first={i===0} last={i===c.lessons.length-1} onStart={()=>onStart(l)} />
              ))}
            </div>
            <Btn solid onClick={()=>onStart(c.lessons[0])} style={{ fontSize:15, padding:'11px 24px' }}>
              Start from lesson 1 <i className="ti ti-arrow-right" style={{ fontSize:16 }}></i>
            </Btn>
          </div>
        )}
        </div>{/* end scrollable body */}
      </div>{/* end card */}
    </div>,/* end backdrop */
    document.body
  );
}

function LessonRow({ lesson, first, last, onStart }) {
  const [hover, setHover] = useStateLearn(false);
  return (
    <div onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} onClick={onStart}
      style={{ display:'flex', alignItems:'center', gap:14, padding:'13px 18px', cursor:'pointer',
        background: hover ? VM.tealTint : 'transparent',
        borderBottom: last ? 'none' : `1px solid ${VM.borderHair}`,
        transition:'background .12s' }}>
      <div style={{ width:28, height:28, borderRadius:999, background: first ? VM.forest : VM.paperDeep,
        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
        border:`1px solid ${first ? VM.forest : VM.border}` }}>
        <Mono size={11} weight={700} color={first ? VM.paperWarm : VM.ink3}>{lesson.n}</Mono>
      </div>
      <span style={{ flex:1, fontFamily:VM.serif, fontSize:15, color:VM.ink, fontWeight: first ? 500 : 400 }}>{lesson.title}</span>
      <Mono size={10} color={VM.ink3} style={{ whiteSpace:'nowrap' }}>{lesson.dur}</Mono>
      <i className="ti ti-player-play" style={{ fontSize:14, color: hover ? VM.teal : VM.faint, transition:'color .12s' }}></i>
    </div>
  );
}

// ── Start modal ───────────────────────────────────────────────────────────────
function StartModal({ course, lesson, go, onClose }) {
  const t    = catTint(course.cat);
  const isAppTutorial = course.route && !lesson;
  const title = lesson ? lesson.title : course.title;
  const sub   = lesson ? `Lesson ${lesson.n} · ${lesson.dur}` : `${course.format} · ${course.length}`;

  function handleBegin() {
    onClose();
    if (isAppTutorial) go(course.route);
  }

  return ReactDOM.createPortal(
    <div style={{ position:'fixed', inset:0, zIndex:400, display:'flex', alignItems:'center', justifyContent:'center',
      background:'rgba(31,29,26,0.55)', padding:20 }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:VM.paperWarm, border:`1px solid ${VM.borderSoft}`,
        borderRadius:16, padding:'28px 28px 24px', maxWidth:400, width:'100%',
        boxShadow:'0 24px 60px rgba(31,29,26,0.22)' }}>
        <div style={{ width:48, height:48, borderRadius:12, background:t.bg, display:'flex', alignItems:'center',
          justifyContent:'center', marginBottom:16 }}>
          <i className={'ti ti-'+t.icon} style={{ fontSize:24, color:t.fg }}></i>
        </div>
        <Mono size={9.5} color={VM.terra} weight={700} style={{ letterSpacing:'0.08em', textTransform:'uppercase', display:'block', marginBottom:6 }}>
          {LEARN_CATS.find(x=>x.id===course.cat)?.label}
        </Mono>
        <div style={{ fontFamily:VM.serif, fontWeight:700, fontSize:18, lineHeight:1.2, marginBottom:5 }}>{title}</div>
        <Mono size={11} color={VM.ink3} style={{ display:'block', marginBottom:18 }}>{sub}</Mono>
        <p style={{ fontFamily:VM.serif, fontSize:14, color:VM.ink2, lineHeight:1.6, margin:'0 0 22px' }}>
          {isAppTutorial
            ? 'This opens the relevant section of Veridian Markets so you can follow along interactively.'
            : 'Content for this '+(lesson?'lesson':course.format.toLowerCase())+' is coming in the next phase. You\'ll read, watch, and track progress here.'}
        </p>
        <div style={{ display:'flex', gap:10 }}>
          <Btn solid onClick={handleBegin} style={{ flex:1, justifyContent:'center', fontSize:14, padding:'9px 16px' }}>
            {isAppTutorial ? 'Open in Veridian' : 'Got it'}
            <i className={'ti ti-'+(isAppTutorial?'arrow-right':'check')} style={{ fontSize:15 }}></i>
          </Btn>
          <Btn onClick={onClose} style={{ fontSize:14, padding:'9px 16px' }}>Not yet</Btn>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function FilterGroup({ label, value, onPick, options }) {
  const pick = v => onPick(value===v ? 'all' : v);
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
      <Label>{label}</Label>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        {options.map(o=>(
          <button key={o} onClick={()=>pick(o)} style={{ fontFamily:VM.mono, fontSize:10.5, padding:'4px 11px',
            borderRadius:999, cursor:'pointer', whiteSpace:'nowrap', transition:'all .12s',
            border:`1px solid ${value===o?VM.forest:VM.border}`,
            background:value===o?VM.forest:VM.paper, color:value===o?VM.paperWarm:VM.ink2 }}>{o}</button>
        ))}
      </div>
    </div>
  );
}

function CourseCard({ c, onOpen }) {
  const [hover, setHover] = useStateLearn(false);
  const t    = catTint(c.cat);
  const tone = c.tag ? TAG_TONE[c.tag] : null;
  return (
    <div onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} onClick={onOpen}
      style={{ background:VM.paper, border:`1px solid ${hover?VM.border:VM.borderSoft}`, borderRadius:12,
        overflow:'hidden', cursor:'pointer', display:'flex', flexDirection:'column',
        transform:hover?'translateY(-3px)':'none',
        boxShadow:hover?'0 10px 22px rgba(31,29,26,0.10)':'none',
        transition:'transform .16s ease, box-shadow .16s ease, border-color .16s ease' }}>
      <div style={{ height:118, background:t.bg, display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
        <i className={'ti ti-'+t.icon} style={{ fontSize:40, color:t.fg, opacity:0.92 }}></i>
        <span style={{ position:'absolute', left:12, bottom:10 }}>
          <Mono size={9} color={t.fg} weight={700} style={{ letterSpacing:'0.08em', textTransform:'uppercase', opacity:0.85 }}>
            {LEARN_CATS.find(x=>x.id===c.cat)?.label}
          </Mono>
        </span>
        {c.lessons && <span style={{ position:'absolute', right:10, top:10 }}><Mono size={9} color={t.fg} style={{ opacity:0.65 }}>{c.lessons.length} lessons</Mono></span>}
      </div>
      <div style={{ padding:'13px 14px 15px', display:'flex', flexDirection:'column', flex:1 }}>
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <span style={{ width:16, height:16, borderRadius:4, background:VM.forest, color:VM.paperWarm,
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <i className="ti ti-leaf" style={{ fontSize:10 }}></i>
          </span>
          <Mono size={10.5} color={VM.ink3}>{c.provider}</Mono>
        </div>
        <div style={{ fontFamily:VM.serif, fontWeight:700, fontSize:16, lineHeight:1.22, margin:'8px 0 0', color:VM.ink }}>{c.title}</div>
        <Mono size={10} color={VM.ink3} style={{ marginTop:6, letterSpacing:'0.04em', textTransform:'uppercase' }}>{c.format}</Mono>
        {tone && (
          <span style={{ alignSelf:'flex-start', marginTop:10, fontFamily:VM.mono, fontSize:9.5, fontWeight:600,
            padding:'3px 9px', borderRadius:999, background:tone.bg, color:tone.fg, border:`1px solid ${tone.bd}`, letterSpacing:'0.04em' }}>{c.tag}</span>
        )}
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

function StartHere({ go, isMobile, onOpen }) {
  const [hover, setHover] = useStateLearn(false);
  return (
    <div onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} onClick={onOpen}
      style={{ marginTop:24, display:'flex', flexDirection:isMobile?'column':'row', alignItems:isMobile?'flex-start':'center',
        gap:isMobile?14:20, padding:isMobile?'18px':'20px 24px', cursor:'pointer',
        background:`linear-gradient(100deg, ${VM.tealTint} 0%, ${VM.paper} 70%)`,
        border:`1px solid ${hover?VM.tealTint2:VM.borderSoft}`, borderRadius:14, transition:'border-color .16s ease' }}>
      <span style={{ width:48, height:48, borderRadius:12, background:VM.forest, color:VM.paperWarm,
        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <i className="ti ti-compass" style={{ fontSize:24 }}></i>
      </span>
      <div style={{ flex:1 }}>
        <Kicker>NEW HERE? · GUIDED PATH</Kicker>
        <div style={{ fontFamily:VM.serif, fontWeight:700, fontSize:isMobile?18:20, margin:'4px 0 0' }}>Get started with Veridian in 10 minutes.</div>
        <div style={{ fontFamily:VM.serif, fontSize:14, color:VM.ink2, marginTop:3 }}>Five short steps: read the markets, find a company, map its supply chain, build a watchlist.</div>
      </div>
      <Btn solid style={{ flexShrink:0 }}>Start the path <i className="ti ti-arrow-right" style={{ fontSize:15 }}></i></Btn>
    </div>
  );
}

// ── Lesson content ────────────────────────────────────────────────────────────
// Keyed as courseId_lessonN. Courses beyond the first use a generic template.
const LESSON_BODY = {
  '1_1': { sections:[
    { h:'A market is a meeting point.',
      p:'At its simplest, a market is any arrangement — physical or digital — that lets buyers and sellers exchange things of value. The London Stock Exchange, a farmer\'s market, and a Craigslist listing are all markets. What matters is that there is a price, and that price moves when conditions change.' },
    { h:'Supply and demand set the price.',
      p:'When more people want to buy something than sell it, the price rises. When sellers outnumber buyers, it falls. This push and pull happens continuously, across every trade, on every exchange, every millisecond. No one controls it — the price is just the most recent agreement between a willing buyer and a willing seller.' },
    { h:'Why this matters for investors.',
      p:'Understanding that price is simply the latest transaction — not a valuation, not a verdict on quality — is foundational. A stock trading at $300 is not "worth $300" in any deep sense. It means that the last buyer and seller agreed on $300. Tomorrow it might be $290. The job of an investor is to form a view on whether that price is right.' },
  ], key:['Markets are just meeting points for buyers and sellers','Price = the most recent agreed exchange','No market-maker, regulator or algorithm controls the price — it emerges from transactions'] },

  '1_2': { sections:[
    { h:'Every transaction has two sides.',
      p:'For every buyer there is a seller. This seems obvious until you try to actually trade: who is on the other side of your order? In liquid markets, professional market-makers stand ready to buy and sell at all times. They profit from the difference between what they\'ll pay (the bid) and what they\'ll sell for (the ask).' },
    { h:'The bid-ask spread is a tax on impatience.',
      p:'If a stock\'s bid is $99.95 and its ask is $100.05, the spread is $0.10. Every time you trade, you pay half the spread to enter and half to exit. For long-term investors it\'s negligible. For high-frequency traders, it is the whole game. Tight spreads mean a liquid, healthy market. Wide spreads signal illiquidity or uncertainty.' },
    { h:'Why spreads widen in volatile markets.',
      p:'Market-makers take risk. When uncertainty is high — earnings releases, central bank decisions, geopolitical shocks — they widen spreads to compensate for the risk that prices move sharply before they can offload inventory. This is why executing large trades during volatile periods is expensive.' },
  ], key:['Bid = what the market will buy from you · Ask = what it will sell to you','Spread = the market-maker\'s compensation for providing liquidity','Spreads widen when uncertainty rises'] },

  '1_3': { sections:[
    { h:'Prices aggregate information.',
      p:'Every participant in a market holds private information — about their own finances, their read on the economy, their view of a company. When they buy or sell, they act on that information, and the price moves. In this way, market prices aggregate the collective knowledge of millions of participants into a single number.' },
    { h:'The efficient market hypothesis.',
      p:'Academic theory holds that prices already reflect all available public information, so no one can consistently beat the market using public data. In practice, markets are mostly efficient but occasionally very wrong — particularly around new information, structural change, or when participants are acting on emotion rather than analysis.' },
    { h:'What this means for Veridian.',
      p:'Veridian\'s historical analogue engine starts from this insight. If prices reflect information, then finding periods when a company\'s information structure looked similar to today is a form of reading price history forwards. Not a forecast — a base rate. The past doesn\'t repeat, but it often rhymes.' },
  ], key:['Prices move as participants act on information','Markets are mostly efficient — occasionally wrong','History analogues work because information structures recur'] },

  '1_4': { sections:[
    { h:'Equities: ownership.',
      p:'A share of stock is a fractional ownership stake in a company. Shareholders own a slice of the business, including its future earnings. They benefit when profits grow and the business compounds value over time. They bear the risk that profits disappoint, or the business fails.' },
    { h:'Bonds: loans with a promise.',
      p:'A bond is a loan to a government or company. The issuer promises to pay interest (the coupon) at regular intervals and return the principal at maturity. Bondholders rank above shareholders in a liquidation — they get paid first. This makes bonds less risky but also less rewarding over the long run.' },
    { h:'Commodities, currencies, and more.',
      p:'Commodity markets (oil, gold, copper, wheat) price physical goods. Currency markets (forex) price the exchange rate between national currencies — $1.08 per euro, for example. Each market has its own drivers, participants, and risks. Understanding which type of market you\'re in is the first step to understanding its behaviour.' },
  ], key:['Equities = ownership · upside and downside unlimited','Bonds = loans · priority in liquidation · lower risk','Each market type has its own drivers and risk profile'] },

  '1_5': { sections:[
    { h:'An index is a portfolio in miniature.',
      p:'The S&P 500 is not a market — it is a list of 500 large US companies, weighted by market capitalisation, combined into a single number. When we say "the market is up 1%", we usually mean this index moved. It is a useful shorthand, not a complete picture.' },
    { h:'Market-cap weighting has consequences.',
      p:'Because each company\'s weight equals its share of total market value, the biggest companies dominate. In the S&P 500, the top 10 stocks often represent 25–30% of the index. A single good day for Apple, Microsoft or NVIDIA moves the whole number. Equal-weighted indices exist but are less commonly cited.' },
    { h:'Why indices matter for investors.',
      p:'Index funds track these benchmarks passively and cheaply. Most active managers fail to beat their index over the long run, after fees. Understanding how an index is constructed — what it includes, excludes, and overweights — helps you understand what you\'re actually buying when you buy an index fund.' },
  ], key:['An index is a weighted composite — not the market itself','Market-cap weighting means large companies dominate','Most active managers underperform their benchmark index after fees'] },

  '1_6': { sections:[
    { h:'Pre-market and after-hours.',
      p:'US equity markets officially open at 9:30 AM and close at 4:00 PM Eastern Time. But trading continues in pre-market (4–9:30 AM) and after-hours (4–8 PM) sessions, with lower liquidity and wider spreads. Earnings reports often land after close, moving prices dramatically before the next open.' },
    { h:'Reading the day\'s action.',
      p:'A useful daily habit: glance at which sectors led and lagged, whether volume was above or below average, and what the yield curve did. Sector leadership reveals where money is rotating. Volume confirms conviction — a 2% gain on half normal volume is weaker than the same gain on double volume.' },
    { h:'The market is not the economy.',
      p:'Markets price future earnings, not current conditions. This is why stocks often rise in recessions (when recovery is priced in) and fall in booms (when central banks tighten). The disconnect between "bad news" and rising markets, or "good news" and falling markets, is one of the most consistently confusing things about investing.' },
  ], key:['After-hours moves are real but can be misleading — check volume','Sector rotation and volume tell you more than the index level','Markets price future earnings — they often lead the economy by 6–12 months'] },
};

function getLessonContent(courseId, lesson) {
  const key = `${courseId}_${lesson.n}`;
  if (LESSON_BODY[key]) return LESSON_BODY[key];
  // Generic scaffold for all other lessons
  return {
    sections:[
      { h:`${lesson.title}.`,
        p:`This lesson covers the foundations of ${lesson.title.toLowerCase()}. The core concepts, the vocabulary you need, and the mental models that experienced practitioners use. Written to be read in ${lesson.dur} without prior knowledge beyond what came before in this course.` },
      { h:'Concepts in context.',
        p:'The best way to learn this material is to connect it to things you already understand. As you read, ask: where have I seen this before? Where does this show up in the news, in a company\'s results, or in my own experience? Abstract ideas stick when they have a real-world anchor.' },
      { h:'What comes next.',
        p:`In the following lesson, we\'ll build directly on what\'s covered here. Take a moment to note one thing from this lesson that surprised you, or one thing you\'d like to explore further. That question is the thread that makes the course feel like a conversation rather than a lecture.` },
    ],
    key:[`Core concept: ${lesson.title}`, 'Connect the idea to a real-world example you know', 'Carry one question into the next lesson']
  };
}

// ── Lesson viewer ─────────────────────────────────────────────────────────────
function LessonViewer({ course, lesson, onClose, onNav, isMobile }) {
  const lessons = course.lessons || [];
  const idx     = lessons.findIndex(l => l.n === lesson.n);
  const prev    = idx > 0 ? lessons[idx - 1] : null;
  const next    = idx < lessons.length - 1 ? lessons[idx + 1] : null;
  const pct     = Math.round(((idx + 1) / lessons.length) * 100);
  const content = getLessonContent(course.id, lesson);
  const t       = catTint(course.cat);
  const catLabel = LEARN_CATS.find(x=>x.id===course.cat)?.label || '';

  React.useEffect(()=>{
    const h = e => { if(e.key==='Escape') onClose(); };
    window.addEventListener('keydown', h);
    return ()=>window.removeEventListener('keydown', h);
  },[]);

  return ReactDOM.createPortal(
    <div style={{ position:'fixed', inset:0, zIndex:500, background:VM.paperWarm,
      display:'flex', flexDirection:'column', overflowY:'auto' }}>

      {/* progress bar */}
      <div style={{ height:3, background:VM.paperDeep, flexShrink:0 }}>
        <div style={{ height:'100%', width:`${pct}%`, background:VM.teal, transition:'width .3s ease' }}></div>
      </div>

      {/* top bar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'12px 24px', borderBottom:`1px solid ${VM.borderHair}`, flexShrink:0,
        position:'sticky', top:3, background:VM.paperWarm, zIndex:1 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={onClose} style={{ display:'flex', alignItems:'center', gap:6,
            border:'none', background:'none', cursor:'pointer', color:VM.teal, fontFamily:VM.serif, fontSize:13, padding:0 }}>
            <i className="ti ti-arrow-left" style={{ fontSize:14 }}></i> {course.title}
          </button>
          <span style={{ color:VM.faint }}>·</span>
          <Mono size={10} color={VM.ink3}>{idx+1} of {lessons.length}</Mono>
        </div>
        <button onClick={onClose} style={{ width:30, height:30, borderRadius:999,
          border:`1px solid ${VM.border}`, background:VM.paper, cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center', color:VM.ink2, padding:0 }}>
          <i className="ti ti-x" style={{ fontSize:14 }}></i>
        </button>
      </div>

      {/* content */}
      <div style={{ maxWidth:660, width:'100%', margin:'0 auto',
        padding: isMobile?'28px 18px 64px':'44px 24px 80px', flex:1 }}>

        {/* lesson header */}
        <Mono size={10} color={t.fg} weight={700} style={{ letterSpacing:'0.08em', textTransform:'uppercase', display:'block', marginBottom:8 }}>
          {catLabel} · Lesson {lesson.n}
        </Mono>
        <h1 style={{ fontFamily:VM.serif, fontWeight:700, fontSize:isMobile?26:34, margin:'0 0 6px', lineHeight:1.1 }}>
          {lesson.title}
        </h1>
        <Mono size={11} color={VM.ink3} style={{ display:'block', marginBottom:36 }}>
          <i className="ti ti-clock" style={{ fontSize:12, marginRight:5 }}></i>{lesson.dur}
        </Mono>

        {/* body sections */}
        {content.sections.map((s,i)=>(
          <div key={i} style={{ marginBottom:30 }}>
            <h2 style={{ fontFamily:VM.serif, fontWeight:700, fontSize:20, margin:'0 0 10px', color:VM.ink }}>{s.h}</h2>
            <p style={{ fontFamily:VM.serif, fontSize:16, lineHeight:1.7, color:VM.ink2, margin:0 }}>{s.p}</p>
          </div>
        ))}

        {/* key takeaways */}
        {content.key && (
          <div style={{ background:VM.tealTint, border:`1px solid ${VM.tealTint2}`, borderRadius:12,
            padding:'16px 20px', margin:'36px 0 44px' }}>
            <Mono size={10} color={VM.teal} weight={700} style={{ display:'block', marginBottom:10, letterSpacing:'0.08em', textTransform:'uppercase' }}>
              Key takeaways
            </Mono>
            {content.key.map((k,i)=>(
              <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'4px 0' }}>
                <i className="ti ti-point-filled" style={{ fontSize:10, color:VM.teal, marginTop:6, flexShrink:0 }}></i>
                <span style={{ fontFamily:VM.serif, fontSize:15, color:VM.ink2, lineHeight:1.55 }}>{k}</span>
              </div>
            ))}
          </div>
        )}

        {/* nav */}
        <div style={{ display:'flex', justifyContent:'space-between', gap:12, paddingTop:8,
          borderTop:`1px solid ${VM.borderSoft}` }}>
          {prev
            ? <Btn onClick={()=>onNav(prev)} style={{ fontSize:13, padding:'9px 16px' }}>
                <i className="ti ti-arrow-left" style={{ fontSize:14 }}></i> {prev.title}
              </Btn>
            : <span></span>}
          {next
            ? <Btn solid onClick={()=>onNav(next)} style={{ fontSize:13, padding:'9px 18px' }}>
                Next: {next.title} <i className="ti ti-arrow-right" style={{ fontSize:14 }}></i>
              </Btn>
            : <Btn solid onClick={onClose} style={{ fontSize:13, padding:'9px 18px' }}>
                Complete course <i className="ti ti-check" style={{ fontSize:14 }}></i>
              </Btn>}
        </div>
      </div>
    </div>,
    document.body
  );
}

Object.assign(window, { Learn });
