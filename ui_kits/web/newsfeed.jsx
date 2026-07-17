// Veridian Markets — market + company news (Finnhub via vm-news Lambda).
//
// useVMNews(scope) → { articles, cards, loading, live }
//   scope = 'general'  → market news (Home tiles + News page)
//   scope = 'AAPL'     → that company's news (company News tab)
//
// cards[] are pre-mapped to the shape the News page renders:
//   { cat, kicker, headline, summary, source, time, ticker, url, image }
// A miss (no URL configured, non-US, error) leaves the mock in place.

const VM_NEWS = { url: 'https://yj4fpalduia46dwcle65vlkule0wmpap.lambda-url.us-east-1.on.aws/' };
const _vmNewsCache = {};
const VM_NEWS_TTL = 5 * 60 * 1000;   // client cache 5 min

async function vmNews(scope) {
  const s = String(scope || '').trim();
  if (!VM_NEWS.url || !s) return [];
  const isGeneral = s.toLowerCase() === 'general';
  const key = isGeneral ? 'general' : s.toUpperCase();
  const hit = _vmNewsCache[key];
  if (hit && (Date.now() - hit.t) < VM_NEWS_TTL) return hit.data;
  const qs = isGeneral ? 'scope=general' : `symbol=${encodeURIComponent(key)}`;
  try {
    const res  = await fetch(`${VM_NEWS.url}?${qs}`);
    const data = await res.json();
    const out  = Array.isArray(data.articles) ? data.articles : [];
    _vmNewsCache[key] = { t: Date.now(), data: out };
    return out;
  } catch { return []; }
}

// "2h ago" / "3d ago" from a unix-seconds timestamp.
function vmTimeAgo(sec) {
  if (!sec) return '';
  const diff = Math.max(0, Date.now() / 1000 - sec);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function _firstTicker(related) {
  if (!related) return null;
  const t = String(related).split(',').map(s => s.trim()).filter(Boolean)[0];
  return t && /^[A-Z.]{1,6}$/.test(t) ? t : null;
}
function _deriveCat(a) {
  if (_firstTicker(a.related)) return 'Companies';
  const c = String(a.category || '').toLowerCase();
  if (c.includes('tech')) return 'Tech';
  if (c.includes('econ')) return 'Economy';
  if (c.includes('energy')) return 'Energy';
  return 'Markets';
}

// Raw Finnhub article → News-page card shape.
function vmNewsCard(a) {
  const tk = _firstTicker(a.related);
  return {
    cat: _deriveCat(a),
    kicker: (tk || a.source || 'MARKETS').toUpperCase(),
    headline: a.headline,
    summary: a.summary || '',
    source: a.source || '',
    time: vmTimeAgo(a.datetime),
    ticker: tk,
    url: a.url || '',
    image: a.image || '',
  };
}

// Hook → { articles, cards, loading, live }.
function useVMNews(scope) {
  const [state, setState] = React.useState({ articles: [], cards: [], loading: false, live: false });
  React.useEffect(() => {
    if (!VM_NEWS.url || !scope) { setState({ articles: [], cards: [], loading: false, live: false }); return; }
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    vmNews(scope).then((articles) => {
      if (!alive) return;
      setState({ articles, cards: articles.map(vmNewsCard), loading: false, live: articles.length > 0 });
    }).catch(() => { if (alive) setState({ articles: [], cards: [], loading: false, live: false }); });
    return () => { alive = false; };
  }, [scope]);
  return state;
}

// Reusable real-news card list (used by the company News tab for searched tickers).
function LiveNewsFeed({ scope, isMobile, emptyLabel }) {
  const { cards, loading, live } = useVMNews(scope);
  if (loading) return (
    <div style={{ marginTop:24, padding:'36px', textAlign:'center', fontFamily:VM.mono, fontSize:11, color:VM.ink3 }}>
      <i className="ti ti-loader-2" style={{ fontSize:15 }}></i> Loading news…
    </div>
  );
  if (!live) return (
    <div style={{ marginTop:24, border:`1px solid ${VM.borderSoft}`, borderRadius:12, background:VM.paper, padding:'40px 24px', textAlign:'center', fontFamily:VM.serif, fontSize:14, color:VM.ink3 }}>
      {emptyLabel || 'No recent news found.'}
    </div>
  );
  return (
    <div style={{ marginTop:20, display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap:16 }}>
      {cards.map((n, i) => (
        <a key={n.url || i} href={n.url} target="_blank" rel="noopener noreferrer"
          style={{ textDecoration:'none', background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:12, padding:'15px 16px', display:'flex', flexDirection:'column' }}>
          <span style={{ fontFamily:VM.mono, fontSize:9, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:VM.terra }}>{n.kicker}</span>
          <span style={{ fontFamily:VM.serif, fontWeight:700, fontSize:16, lineHeight:1.2, margin:'7px 0 0', color:VM.ink }}>{n.headline}</span>
          {n.summary && <span style={{ fontFamily:VM.serif, fontSize:13, color:VM.ink2, lineHeight:1.45, margin:'8px 0 0' }}>{n.summary}</span>}
          <span style={{ marginTop:'auto', paddingTop:12, fontFamily:VM.mono, fontSize:10, color:VM.ink3 }}>{n.source}{n.time ? ` · ${n.time}` : ''} · read ↗</span>
        </a>
      ))}
    </div>
  );
}

Object.assign(window, { VM_NEWS, vmNews, useVMNews, vmNewsCard, vmTimeAgo, LiveNewsFeed });
