// Veridian Markets — personalization: what does this signed-in user care about,
// and what does that suggest?
//
// "Interest" is built from two real signals, no new backend:
//   - vmFavs() (capture.jsx)       — explicit ⭐ favourites, instant/local
//   - vmFetchMyActivity() (activity.jsx) — real recently-viewed companies
//     (vm-my-activity Lambda, reading the same vm-events the app already logs)
// Favourites are the strongest signal, so they're ranked first.
//
// "Recommended companies" is a simple content-based match on VM_COMPANIES'
// existing `sector` field ("Tech · Semiconductors") — no ML, no new data.

// The signed-in user's interest tickers, most-favourited/most-recent first.
// Returns [] fast (no network) if nothing's configured/available.
async function vmGetInterestTickers(limit = 6) {
  const favs = typeof vmFavs === 'function' ? vmFavs() : [];
  let viewed = [];
  try {
    const data = typeof vmFetchMyActivity === 'function' ? await vmFetchMyActivity() : null;
    if (data && data.viewed) viewed = data.viewed.map(v => v.ticker).filter(Boolean);
  } catch {}
  const seen = new Set();
  const out = [];
  for (const t of [...favs, ...viewed]) {
    if (t && !seen.has(t)) { seen.add(t); out.push(t); }
  }
  return out.slice(0, limit);
}

// React hook wrapper — { tickers, loading }. Only meaningful when signed in;
// pass enabled:false to skip the fetch entirely (e.g. signed out).
function useVMInterests(enabled) {
  const [state, setState] = React.useState({ tickers: [], loading: !!enabled });
  React.useEffect(() => {
    if (!enabled) { setState({ tickers: [], loading: false }); return; }
    let live = true;
    setState(s => ({ ...s, loading: true }));
    vmGetInterestTickers().then(tickers => { if (live) setState({ tickers, loading: false }); });
    return () => { live = false; };
  }, [enabled]);
  return state;
}

// "Companies you might like" — other companies sharing a sector with the
// interest tickers, excluding the interest companies themselves. Falls back
// to a broader sector-prefix match (e.g. "Tech" instead of the full
// "Tech · Semiconductors") if the exact match doesn't fill the quota.
function vmRecommendCompanies(interestTickers, limit = 6) {
  if (!interestTickers || !interestTickers.length) return [];
  const interestSet = new Set(interestTickers);
  const interestCompanies = interestTickers.map(t => VM_COMPANIES.find(c => c.ticker === t)).filter(Boolean);
  if (!interestCompanies.length) return [];

  const exactSectors = new Set(interestCompanies.map(c => c.sector));
  const broadSectors = new Set(interestCompanies.map(c => (c.sector || '').split('·')[0].trim()).filter(Boolean));

  const out = [];
  const add = (c) => { if (!interestSet.has(c.ticker) && !out.some(x => x.ticker === c.ticker)) out.push(c); };

  VM_COMPANIES.filter(c => exactSectors.has(c.sector)).forEach(add);
  if (out.length < limit) {
    VM_COMPANIES.filter(c => broadSectors.has((c.sector || '').split('·')[0].trim())).forEach(add);
  }
  return out.slice(0, limit);
}

Object.assign(window, { vmGetInterestTickers, useVMInterests, vmRecommendCompanies });
