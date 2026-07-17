// Veridian Markets — News page ("Global News").
// An editorial markets feed: category filter, a featured lead story, and a grid
// of articles. History-led voice; mock data. Ticker tags open the dashboard.
const { useState: useStateNews } = React;

const NEWS_CATS = ['All', 'Markets', 'Companies', 'Economy', 'Policy', 'Tech', 'Energy'];
const NEWS = [
  { cat: 'Markets', kicker: 'OIL · 5-YEAR LENS', headline: 'Oil at $78 — and an echo from 1973 we’d rather not hear.',
    summary: 'Crude’s grind higher revives the supply-shock comparison. Read as a base rate, past spikes were less dramatic than the headlines.', source: 'Veridian', time: '2h ago', ticker: 'XOM' },
  { cat: 'Companies', kicker: 'AAPL · ANALOGUE', headline: 'Apple’s services pivot draws the MSFT-2014 comparison again.',
    summary: 'Capital-light, margin-expanding, re-rating slowly. The closest historical match still reads constructive — with caveats on China.', source: 'The Ledger', time: '4h ago', ticker: 'AAPL' },
  { cat: 'Policy', kicker: 'THE FED', headline: 'The Fed holds. Markets read it as a pause, not a peak.',
    summary: 'Rates unchanged; the dot plot nudged. History says the first cut matters less than the path that follows it.', source: 'Bretton House', time: '6h ago' },
  { cat: 'Tech', kicker: 'NVDA · SEMIS', headline: 'The AI capex cycle and the ghost of Cisco, 2000.',
    summary: 'The spending is real; so was the fibre build-out. Where the analogy holds, and the one place it clearly breaks.', source: 'Veridian', time: '8h ago', ticker: 'NVDA' },
  { cat: 'Economy', kicker: 'INFLATION', headline: 'CPI cools, but the last mile looks sticky.',
    summary: 'Goods disinflation did the easy part. Services are the 1990s-style grind — slower, stubborner, and politically louder.', source: 'Bretton House', time: '10h ago' },
  { cat: 'Energy', kicker: 'POWER · GRID', headline: 'Data-centre demand rewrites the quietest sector in markets.',
    summary: 'Utilities suddenly have a growth story — and a 1960s build-out parallel that few investors are pricing.', source: 'The Ledger', time: '12h ago' },
  { cat: 'Companies', kicker: 'TSLA', headline: 'Tesla’s margin question is really an Amazon-2014 question.',
    summary: 'Invest through the trough or harvest the cash? The analogue cuts both ways — and the market keeps switching sides.', source: 'Veridian', time: '14h ago', ticker: 'TSLA' },
  { cat: 'Markets', kicker: 'BONDS', headline: 'The yield curve un-inverts. What 1989, 1998 and 2007 taught us.',
    summary: 'The signal everyone watches, read as a base rate rather than an omen. The lag, not the inversion, is the story.', source: 'Bretton House', time: '16h ago' },
  { cat: 'Tech', kicker: 'SOFTWARE', headline: 'SaaS multiples reset to the mean. The 2002 hangover, revisited.',
    summary: 'Growth-at-any-price is over. The survivors look like the post-dotcom cohort that quietly compounded for a decade.', source: 'The Ledger', time: '18h ago' },
];

function News({ go, isMobile }) {
  const [cat, setCat] = useStateNews('All');
  const [searchOpen, setSearchOpen] = useStateNews(false);
  const [query, setQuery] = useStateNews('');
  const [article, setArticle] = useStateNews(null);
  // Real market news (Finnhub, cached) when available; else the editorial mock.
  const liveNews = typeof useVMNews === 'function' ? useVMNews('general') : { cards: [], live: false, loading: false };
  const source = liveNews.live ? liveNews.cards : NEWS;
  const q = query.trim().toLowerCase();
  const list = source.filter(n => (cat === 'All' || n.cat === cat) &&
    (!q || ((n.headline || '') + ' ' + (n.summary || '') + ' ' + (n.kicker || '')).toLowerCase().includes(q)));
  const lead = list[0];
  const rest = list.slice(1);
  const openTicker = (t) => { const c = VM_COMPANIES.find(x => x.ticker === t); go('dashboard', c || { ticker: t, name: t, cap: '—' }); };

  return (
    <div style={{ padding: isMobile ? '16px 16px 80px' : '26px 32px 60px', maxWidth: 1120, margin: '0 auto' }}>
      <Kicker>Global News</Kicker>
      <h1 style={{ fontFamily: VM.serif, fontWeight: 700, fontSize: isMobile ? 27 : 32, lineHeight: 1.05, margin: '8px 0 0' }}>News.</h1>
      <p style={{ fontFamily: VM.serif, fontSize: isMobile ? 15 : 16, color: VM.ink2, maxWidth: 640, margin: '8px 0 0' }}>
        The day’s markets, read through the lens of the past. Not a forecast — a base rate.
      </p>

      {/* search button + category filter */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16, alignItems: 'center' }}>
        <IconBtn icon="search" round size={32} active={searchOpen} title="Search news" onClick={() => setSearchOpen(o => !o)} />
        {NEWS_CATS.map(c => <Pill key={c} active={cat === c} onClick={() => setCat(c)}>{c}</Pill>)}
      </div>
      {searchOpen && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: VM.paper, border: `1px solid ${VM.border}`, borderRadius: 10, padding: '10px 14px', marginTop: 12 }}>
          <i className="ti ti-search" style={{ fontSize: 15, color: VM.ink3 }}></i>
          <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: VM.serif, fontSize: 15, color: VM.ink }} />
          {query && <i onClick={() => setQuery('')} className="ti ti-x" style={{ fontSize: 14, color: VM.ink3, cursor: 'pointer' }} title="Clear"></i>}
        </div>
      )}

      {list.length === 0 && <div style={{ marginTop: 20, fontFamily: VM.serif, color: VM.ink3 }}>No stories in {cat}.</div>}

      {/* featured lead */}
      {lead && (
        <div onClick={() => setArticle(lead)} style={{ marginTop: 20, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.1fr 1fr', gap: isMobile ? 0 : 22,
          background: VM.paper, border: `1px solid ${VM.borderSoft}`, borderRadius: 16, overflow: 'hidden', cursor: 'pointer' }}>
          <div style={{ minHeight: isMobile ? 150 : 220, background: `linear-gradient(120deg, ${VM.forest}, ${VM.teal})`, position: 'relative', display: 'flex', alignItems: 'flex-end', padding: 18 }}>
            <Mono size={10} color="rgba(255,255,255,0.85)" style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>{lead.kicker}</Mono>
          </div>
          <div style={{ padding: isMobile ? '16px' : '24px 24px 20px', display: 'flex', flexDirection: 'column' }}>
            <Label>Lead · {lead.cat}</Label>
            <h2 style={{ fontFamily: VM.serif, fontWeight: 700, fontSize: isMobile ? 21 : 26, lineHeight: 1.12, margin: '8px 0 0' }}>{lead.headline}</h2>
            <p style={{ fontFamily: VM.serif, fontSize: 15, color: VM.ink2, lineHeight: 1.5, margin: '10px 0 0' }}>{lead.summary}</p>
            <div style={{ marginTop: 'auto', paddingTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Mono size={10.5} color={VM.ink3}>{lead.source} · {lead.time}</Mono>
              {lead.ticker && <span style={{ marginLeft: 'auto', fontFamily: VM.mono, fontSize: 10, color: VM.teal }}>{lead.ticker} →</span>}
            </div>
          </div>
        </div>
      )}

      {/* article grid */}
      <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {rest.map((n, i) => <NewsCard key={n.url || n.kicker || i} n={n} onOpen={() => setArticle(n)} />)}
      </div>

      {article && <ArticleModal article={article} onClose={() => setArticle(null)} onTicker={openTicker} isMobile={isMobile} />}
    </div>
  );
}

function ArticleModal({ article: a, onClose, onTicker, isMobile }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(31,29,26,0.45)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: isMobile ? '16px' : '40px 20px', overflowY: 'auto' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 680, background: VM.paper, border: `1px solid ${VM.border}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 24px 60px rgba(31,29,26,0.3)' }}>
        <div style={{ height: isMobile ? 130 : 170, background: `linear-gradient(120deg, ${VM.forest}, ${VM.teal})`, position: 'relative', display: 'flex', alignItems: 'flex-end', padding: 18 }}>
          <Mono size={10} color="rgba(255,255,255,0.85)" style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>{a.kicker}</Mono>
          <button onClick={onClose} title="Close" style={{ position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: 999, border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.12)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="ti ti-x" style={{ fontSize: 16 }}></i></button>
        </div>
        <div style={{ padding: isMobile ? '18px' : '24px 28px 28px' }}>
          <Label>{a.cat}</Label>
          <h1 style={{ fontFamily: VM.serif, fontWeight: 700, fontSize: isMobile ? 23 : 29, lineHeight: 1.12, margin: '8px 0 0' }}>{a.headline}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, paddingBottom: 16, borderBottom: `1px solid ${VM.borderHair}` }}>
            <Mono size={11} color={VM.ink3}>{a.source} · {a.time}</Mono>
            {a.ticker && <span onClick={() => onTicker(a.ticker)} style={{ marginLeft: 'auto', fontFamily: VM.mono, fontSize: 10, fontWeight: 600, color: VM.teal, background: VM.tealTint, border: `1px solid ${VM.tealTint2}`, borderRadius: 5, padding: '3px 9px', cursor: 'pointer' }}>View {a.ticker} →</span>}
          </div>
          <p style={{ fontFamily: VM.serif, fontSize: isMobile ? 16 : 17, color: VM.ink, lineHeight: 1.55, margin: '16px 0 0', fontStyle: 'italic' }}>{a.summary}</p>
          {a.url ? (
            <>
              <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 18, fontFamily: VM.mono, fontSize: 12, fontWeight: 700, color: VM.paperWarm, background: VM.forest, border: `1px solid ${VM.forest}`, borderRadius: 8, padding: '9px 16px', textDecoration: 'none' }}>
                Read full article at {a.source || 'source'} <i className="ti ti-external-link" style={{ fontSize: 13 }}></i>
              </a>
              <p style={{ fontFamily: VM.serif, fontStyle: 'italic', fontSize: 13, color: VM.ink3, margin: '16px 0 0' }}>Headline & summary via Finnhub. Full story at the source.</p>
            </>
          ) : (
            <>
              <p style={{ fontFamily: VM.serif, fontSize: 15, color: VM.ink2, lineHeight: 1.6, margin: '14px 0 0' }}>
                The pattern isn’t new. Markets have a long memory, and the closest historical analogue rarely rhymes perfectly — but it sets a base rate worth respecting rather than a forecast to bet on.
              </p>
              <p style={{ fontFamily: VM.serif, fontSize: 15, color: VM.ink2, lineHeight: 1.6, margin: '14px 0 0' }}>
                What matters now is less the headline than the path that follows it. We weight the outcomes of similar past episodes — what happened next, and how often — instead of reaching for a single number.
              </p>
              <p style={{ fontFamily: VM.serif, fontStyle: 'italic', fontSize: 13, color: VM.ink3, margin: '18px 0 0' }}>Base rates only. Not advice.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function NewsCard({ n, onOpen }) {
  const [hover, setHover] = useStateNews(false);
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onClick={onOpen}
      style={{ background: VM.paper, border: `1px solid ${hover ? VM.border : VM.borderSoft}`, borderRadius: 12, padding: '15px 16px', cursor: 'pointer',
        transform: hover ? 'translateY(-3px)' : 'none', boxShadow: hover ? '0 10px 22px rgba(31,29,26,0.10)' : 'none',
        transition: 'transform .16s ease, box-shadow .16s ease, border-color .16s ease', display: 'flex', flexDirection: 'column' }}>
      <Mono size={9} color={VM.terra} weight={700} style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}>{n.kicker}</Mono>
      <h3 style={{ fontFamily: VM.serif, fontWeight: 700, fontSize: 17, lineHeight: 1.18, margin: '7px 0 0', color: VM.ink }}>{n.headline}</h3>
      <p style={{ fontFamily: VM.serif, fontSize: 13.5, color: VM.ink2, lineHeight: 1.45, margin: '8px 0 0' }}>{n.summary}</p>
      <div style={{ marginTop: 'auto', paddingTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Mono size={10} color={VM.ink3}>{n.source} · {n.time}</Mono>
        {n.ticker && <span style={{ marginLeft: 'auto', fontFamily: VM.mono, fontSize: 9.5, fontWeight: 600, color: VM.teal, background: VM.tealTint, border: `1px solid ${VM.tealTint2}`, borderRadius: 5, padding: '2px 7px' }}>{n.ticker}</span>}
      </div>
    </div>
  );
}

Object.assign(window, { News });
