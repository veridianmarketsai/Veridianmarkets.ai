// Veridian Markets — My Portfolio Page.
// Gated: only reachable when signed in. App reroutes to the Sign in page when the
// visitor is logged out (see `signedIn` / `effRoute` in app.jsx). Blank scaffold —
// build the portfolio UI here later (holdings, watchlist, analogue alerts).
function MyPortfolio({ go, user }) {
  return (
    <div style={{ padding:'26px 32px 60px', maxWidth:1180, margin:'0 auto' }}>
      <Kicker>Your account · Portfolio</Kicker>
      <h1 style={{ fontFamily:VM.serif, fontWeight:700, fontSize:32, lineHeight:1.07, margin:'10px 0 0' }}>My portfolio.</h1>
      {user && (
        <p style={{ fontFamily:VM.serif, fontSize:15, color:VM.ink2, margin:'8px 0 0' }}>
          Signed in as <strong>{user.name || user.email}</strong>
          {user.role==='admin' && <span style={{ fontFamily:VM.mono, fontSize:9.5, letterSpacing:'0.06em', textTransform:'uppercase', color:VM.upInk, background:VM.tealTint, border:`1px solid ${VM.up}`, borderRadius:5, padding:'2px 7px', marginLeft:8, verticalAlign:'middle' }}>Admin</span>}
        </p>
      )}

      {/* ───────── Build the portfolio UI here (signed-in only) ───────── */}

    </div>
  );
}

Object.assign(window, { MyPortfolio });
