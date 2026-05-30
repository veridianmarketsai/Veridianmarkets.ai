// Veridian Markets — Sign in Page.
// Chromeless: the app shell shows only the green header + footer for this route
// (no Toolbar Menu / ticker). Centered login box. Scaffold — not yet wired to auth.
function SignInField({ label, type, placeholder, autoComplete }) {
  return (
    <label style={{ display:'block', marginBottom:14 }}>
      <span style={{ fontFamily:VM.mono, fontSize:9.5, letterSpacing:'0.06em', textTransform:'uppercase',
        color:VM.ink3, display:'block', marginBottom:6 }}>{label}</span>
      <input type={type} placeholder={placeholder} autoComplete={autoComplete} style={{ width:'100%',
        fontFamily:VM.serif, fontSize:15, color:VM.ink, padding:'10px 12px', borderRadius:8,
        border:`1px solid ${VM.border}`, background:VM.paperWarm, outline:'none' }} />
    </label>
  );
}

function SignIn({ go }) {
  return (
    <div style={{ minHeight:'100%', display:'flex', alignItems:'center', justifyContent:'center', padding:'48px 24px 72px' }}>
      <div style={{ width:'100%', maxWidth:380, background:VM.paper, border:`1px solid ${VM.borderSoft}`,
        borderRadius:14, padding:'30px 28px' }}>
        <div style={{ textAlign:'center', marginBottom:22 }}>
          <Kicker>Veridian Markets · Account</Kicker>
          <h1 style={{ fontFamily:VM.serif, fontWeight:700, fontSize:28, margin:'10px 0 4px' }}>Sign in</h1>
          <p style={{ fontFamily:VM.serif, fontSize:14, color:VM.ink3, margin:0 }}>
            Welcome back — pick up where the history left off.
          </p>
        </div>

        <form onSubmit={(e)=>e.preventDefault()}>
          <SignInField label="Email" type="email" placeholder="you@example.com" autoComplete="email" />
          <SignInField label="Password" type="password" placeholder="••••••••" autoComplete="current-password" />
          <div style={{ textAlign:'right', margin:'-2px 0 14px' }}>
            <span style={{ fontFamily:VM.serif, fontSize:12.5, color:VM.teal, cursor:'pointer' }}>Forgot password?</span>
          </div>
          <button type="submit" style={{ width:'100%', fontFamily:VM.serif, fontSize:15, borderRadius:999,
            padding:'10px 18px', cursor:'pointer', border:`1px solid ${VM.forest}`, background:VM.forest, color:VM.paperWarm }}>
            Sign in
          </button>
        </form>

        <div style={{ textAlign:'center', marginTop:16, fontFamily:VM.serif, fontSize:13, color:VM.ink3 }}>
          New here? <span style={{ color:VM.teal, cursor:'pointer' }}>Create an account</span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { SignIn });
