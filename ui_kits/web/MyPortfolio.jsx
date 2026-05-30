// Veridian Markets — My Portfolio Page.
// Gated: only reachable when signed in. App reroutes to the Sign in page when the
// visitor is logged out (see `signedIn` / `effRoute` in app.jsx). Blank scaffold —
// build the portfolio UI here later (holdings, watchlist, analogue alerts).
function MyPortfolio({ go }) {
  return (
    <div style={{ padding:'26px 32px 60px', maxWidth:1180, margin:'0 auto' }}>
      <Kicker>Your account · Portfolio</Kicker>
      <h1 style={{ fontFamily:VM.serif, fontWeight:700, fontSize:32, lineHeight:1.07, margin:'10px 0 0' }}>My portfolio.</h1>

      {/* ───────── Build the portfolio UI here (signed-in only) ───────── */}

    </div>
  );
}

Object.assign(window, { MyPortfolio });
