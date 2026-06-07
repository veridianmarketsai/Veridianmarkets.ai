// Veridian Markets — Sign in Page.
// Chromeless: the app shell shows only the green header + footer for this route
// (no Toolbar Menu / ticker). Centered login box.
// Auth here is a CLIENT-SIDE PLACEHOLDER (see VM_ACCOUNTS in app.jsx) — it lets
// the owner sign in on the static prototype; real auth (AWS Cognito) comes later.
const { useState: useStateSignIn } = React;

function SignInField({ label, type, placeholder, autoComplete, value, onChange, onKeyDown }) {
  return (
    <label style={{ display:'block', marginBottom:14 }}>
      <span style={{ fontFamily:VM.mono, fontSize:9.5, letterSpacing:'0.06em', textTransform:'uppercase',
        color:VM.ink3, display:'block', marginBottom:6 }}>{label}</span>
      <input type={type} placeholder={placeholder} autoComplete={autoComplete} value={value}
        onChange={onChange} onKeyDown={onKeyDown} style={{ width:'100%',
        fontFamily:VM.serif, fontSize:15, color:VM.ink, padding:'10px 12px', borderRadius:8,
        border:`1px solid ${VM.border}`, background:VM.paperWarm, outline:'none' }} />
    </label>
  );
}

function SignIn({ go, signIn, redirectTo, isMobile }) {
  const [email, setEmail] = useStateSignIn('');
  const [password, setPassword] = useStateSignIn('');
  const [error, setError] = useStateSignIn('');
  const [busy, setBusy] = useStateSignIn(false);

  const submit = async (e) => {
    if (e) e.preventDefault();
    if (busy) return;
    setError(''); setBusy(true);
    const ok = await (signIn ? signIn(email, password) : Promise.resolve(false));
    setBusy(false);
    if (ok) go(redirectTo || 'myportfolio');
    else setError('That email and password don’t match an account.');
  };

  return (
    <div style={{ minHeight:'100%', display:'flex', alignItems:'center', justifyContent:'center', padding: isMobile ? '32px 16px 80px' : '48px 24px 72px', overflowX:'hidden' }}>
      <div style={{ width:'100%', maxWidth: isMobile ? '100%' : 380, background:VM.paper, border:`1px solid ${VM.borderSoft}`,
        borderRadius:14, padding: isMobile ? '24px 18px' : '30px 28px' }}>
        <div style={{ textAlign:'center', marginBottom:22 }}>
          <Kicker>Veridian Markets · Account</Kicker>
          <h1 style={{ fontFamily:VM.serif, fontWeight:700, fontSize: isMobile?24:28, margin:'10px 0 4px' }}>Sign in</h1>
          <p style={{ fontFamily:VM.serif, fontSize:14, color:VM.ink3, margin:0 }}>
            Welcome back — pick up where the history left off.
          </p>
        </div>

        <form onSubmit={submit}>
          <SignInField label="Email" type="email" placeholder="you@example.com" autoComplete="email"
            value={email} onChange={e=>{ setEmail(e.target.value); if(error) setError(''); }} />
          <SignInField label="Password" type="password" placeholder="••••••••" autoComplete="current-password"
            value={password} onChange={e=>{ setPassword(e.target.value); if(error) setError(''); }} />

          {error && (
            <div style={{ display:'flex', alignItems:'center', gap:7, margin:'-2px 0 12px',
              fontFamily:VM.serif, fontSize:13, color:VM.downInk }}>
              <i className="ti ti-alert-circle" style={{ fontSize:15 }}></i><span>{error}</span>
            </div>
          )}

          <div style={{ textAlign:'right', margin:'-2px 0 14px' }}>
            <span style={{ fontFamily:VM.serif, fontSize:12.5, color:VM.teal, cursor:'pointer' }}>Forgot password?</span>
          </div>
          <button type="submit" disabled={busy} style={{ width:'100%', fontFamily:VM.serif, fontSize:15, borderRadius:999,
            padding:'10px 18px', cursor: busy?'default':'pointer', opacity: busy?0.7:1,
            border:`1px solid ${VM.forest}`, background:VM.forest, color:VM.paperWarm }}>
            {busy ? 'Signing in…' : 'Sign in'}
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
