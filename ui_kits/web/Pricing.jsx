// Veridian Markets — Pricing / Upgrade page (route: 'upgrade').
// The paywall target: non-paying users are sent here when they tap a gated rail
// item (News, Calendar, Dependency map). Plans are MOCK for now — "Upgrade" flips
// the client-side plan (localStorage) via onUpgrade; real Stripe billing later.
const { useState: useStatePricing } = React;

// Which gated route sent them here → a friendly feature name for the banner.
const GATE_LABELS = { news:'News', calendar:'Calendar', supply:'the Dependency map' };
// Billing config + checkout live in billing.jsx (shared with Settings). This page
// uses the globals VM_BILLING (currency/prices) and vmStartCheckout().

const VM_PLANS_DEF = [
  { id:'free', name:'Free', price:0, tagline:'The essentials, always free.',
    features:['Home & Global search','Company dashboards','Learn courses','Read the memoir','Your account'] },
  { id:'plus', name:'Plus', price:9, tagline:'The full research surface.', best:true,
    features:['Everything in Free','Global News feed','Economic Calendar','Dependency map (live)','My Portfolio widgets'] },
  { id:'pro', name:'Pro', price:19, tagline:'For operators & teams.',
    features:['Everything in Plus','My Business map builder','Advanced analysis tools','Priority data refresh','Early access to new features'] },
];
// Plan ranking so we can label upgrade vs downgrade vs current.
const PLAN_RANK = { free:0, plus:1, pro:2 };

function Pricing({ go, plan, signedIn, user, onUpgrade, blockedRoute, isMobile }) {
  const [busy, setBusy] = useStatePricing('');
  const current = plan || 'free';
  const gateLabel = GATE_LABELS[blockedRoute];

  const choose = async (id) => {
    if (!signedIn) { go('signin'); return; }
    setBusy(id);
    const started = await vmStartCheckout(id);   // real Stripe (Lambda or Payment Link)
    if (started) return;                          // redirecting to Stripe
    // Mock fallback (no billing configured): brief beat, then flip the plan locally.
    setTimeout(() => { setBusy(''); onUpgrade(id); }, 550);
  };

  return (
    <div style={{ padding: isMobile ? '18px 16px 90px' : '30px 32px 72px', maxWidth:1040, margin:'0 auto' }}>
      {/* contextual paywall banner */}
      {gateLabel && (
        <div style={{ display:'flex', alignItems:'center', gap:11, padding:'12px 16px', marginBottom:20,
          background:VM.tealTint, border:`1px solid ${VM.tealTint2}`, borderRadius:12 }}>
          <i className="ti ti-lock" style={{ fontSize:18, color:VM.forest }}></i>
          <span style={{ fontFamily:VM.serif, fontSize:14.5, color:VM.ink2 }}>
            <b>{gateLabel}</b> is part of <b>Veridian Plus</b>. Upgrade to unlock it — and the rest of the research surface.
          </span>
        </div>
      )}

      <div style={{ textAlign:'center', marginBottom: isMobile ? 22 : 30 }}>
        <Kicker>Veridian Markets · Plans</Kicker>
        <h1 style={{ fontFamily:VM.serif, fontWeight:700, fontSize: isMobile ? 28 : 36, margin:'10px 0 6px' }}>Choose your plan.</h1>
        <p style={{ fontFamily:VM.serif, fontSize:16, color:VM.ink3, margin:'0 auto', maxWidth:560 }}>
          History-led finance, at the depth you need. Upgrade any time — {signedIn ? 'changes apply instantly.' : 'sign in to subscribe.'}
        </p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap:16, alignItems:'stretch' }}>
        {VM_PLANS_DEF.map(p => {
          const isCurrent = current === p.id;
          const rank = PLAN_RANK[p.id] - PLAN_RANK[current];
          const cta = isCurrent ? 'Current plan' : p.id === 'free' ? 'Switch to Free' : rank > 0 ? `Upgrade to ${p.name}` : `Switch to ${p.name}`;
          const highlight = p.best && !isCurrent;
          return (
            <div key={p.id} style={{ position:'relative', display:'flex', flexDirection:'column',
              background:VM.paper, borderRadius:16, padding: isMobile ? '20px 18px' : '24px 22px',
              border:`1px solid ${highlight ? VM.forest : VM.borderSoft}`,
              boxShadow: highlight ? '0 14px 40px rgba(31,29,26,0.12)' : 'none' }}>
              {p.best && (
                <span style={{ position:'absolute', top:-11, left:'50%', transform:'translateX(-50%)', whiteSpace:'nowrap',
                  fontFamily:VM.mono, fontSize:8.5, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase',
                  color:VM.paperWarm, background:VM.forest, borderRadius:999, padding:'3px 10px' }}>Most popular</span>
              )}
              <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
                <span style={{ fontFamily:VM.serif, fontWeight:700, fontSize:19, color:VM.ink }}>{p.name}</span>
                {isCurrent && <Mono size={9} weight={700} color={VM.teal} style={{ textTransform:'uppercase', letterSpacing:'0.05em' }}>Current</Mono>}
              </div>
              <div style={{ margin:'8px 0 2px', display:'flex', alignItems:'baseline', gap:4 }}>
                <span style={{ fontFamily:VM.mono, fontWeight:700, fontSize:32, color:VM.ink }}>{VM_BILLING.currency}{p.price}</span>
                <span style={{ fontFamily:VM.mono, fontSize:12, color:VM.ink3 }}>/mo</span>
              </div>
              <p style={{ fontFamily:VM.serif, fontSize:13.5, color:VM.ink3, margin:'0 0 14px' }}>{p.tagline}</p>
              <div style={{ display:'flex', flexDirection:'column', gap:9, marginBottom:20 }}>
                {p.features.map((f, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                    <i className="ti ti-check" style={{ fontSize:15, color:VM.upInk, marginTop:1, flexShrink:0 }}></i>
                    <span style={{ fontFamily:VM.serif, fontSize:13.5, color:VM.ink2, lineHeight:1.4 }}>{f}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => !isCurrent && choose(p.id)} disabled={isCurrent || !!busy}
                style={{ marginTop:'auto', width:'100%', fontFamily:VM.serif, fontSize:14.5, borderRadius:999, padding:'11px 18px',
                  cursor: isCurrent ? 'default' : 'pointer', opacity: busy && busy !== p.id ? 0.6 : 1,
                  border:`1px solid ${isCurrent ? VM.border : VM.forest}`,
                  background: isCurrent ? VM.paperWarm : highlight ? VM.forest : VM.paper,
                  color: isCurrent ? VM.ink3 : highlight ? VM.paperWarm : VM.forest }}>
                {busy === p.id ? 'Processing…' : cta}
              </button>
            </div>
          );
        })}
      </div>

      {!signedIn && (
        <div style={{ textAlign:'center', marginTop:20, fontFamily:VM.serif, fontSize:13.5, color:VM.ink3 }}>
          You'll need an account to subscribe. <span onClick={()=>go('signin')} style={{ color:VM.teal, cursor:'pointer' }}>Sign in or create one →</span>
        </div>
      )}
      <Mono size={9.5} color={VM.faint} style={{ display:'block', textAlign:'center', marginTop:24 }}>
        Payments are mocked for now · Stripe billing coming · cancel any time
      </Mono>
    </div>
  );
}

Object.assign(window, { Pricing });
