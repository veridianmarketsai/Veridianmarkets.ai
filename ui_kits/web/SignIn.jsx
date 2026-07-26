// Veridian Markets — Sign in Page.
// Chromeless: the app shell shows only the green header + footer for this route
// (no Toolbar Menu / ticker). Centered auth card.
// Auth is now real (AWS Cognito) — see auth.jsx + backend-signin.md. This one
// component handles five modes: sign in · sign up · confirm code · forgot · reset.
const { useState: useStateSignIn } = React;

function SignInField({ label, type, placeholder, autoComplete, value, onChange, inputMode }) {
  return (
    <label style={{ display:'block', marginBottom:14 }}>
      <span style={{ fontFamily:VM.mono, fontSize:9.5, letterSpacing:'0.06em', textTransform:'uppercase',
        color:VM.ink3, display:'block', marginBottom:6 }}>{label}</span>
      <input type={type} placeholder={placeholder} autoComplete={autoComplete} value={value} inputMode={inputMode}
        onChange={onChange} style={{ width:'100%', boxSizing:'border-box',
        fontFamily:VM.serif, fontSize:15, color:VM.ink, padding:'10px 12px', borderRadius:8,
        border:`1px solid ${VM.border}`, background:VM.paperWarm, outline:'none' }} />
    </label>
  );
}

// Per-mode copy: [title, subtitle(email), primary button label].
const SI_COPY = {
  signin:  ['Sign in',            () => 'Welcome back — pick up where the history left off.', 'Sign in'],
  signup:  ['Create account',     () => 'Start reading the market through history.',          'Create account'],
  confirm: ['Confirm your email', (e) => `We emailed a 6-digit code to ${e || 'your inbox'}.`, 'Confirm & sign in'],
  forgot:  ['Reset password',     () => 'Enter your email and we’ll send a reset code.',       'Send reset code'],
  reset:   ['New password',       () => 'Enter the code we emailed and choose a new password.','Update password'],
  mfa:     ['Enter your code',    () => 'Open your authenticator app and enter the 6-digit code.', 'Verify & sign in'],
};

function SignIn({ go, signIn, confirmMfa, redirectTo, isMobile }) {
  const [mode, setMode]     = useStateSignIn('signin');
  const [email, setEmail]   = useStateSignIn('');
  const [password, setPass] = useStateSignIn('');    // reused as "new password" in reset/signup
  const [code, setCode]     = useStateSignIn('');
  const [mfaSession, setMfaSession] = useStateSignIn(null);   // Cognito challenge Session, set while mode==='mfa'
  const [error, setError]   = useStateSignIn('');
  const [notice, setNotice] = useStateSignIn('');
  const [busy, setBusy]     = useStateSignIn(false);

  const to = (m) => { setMode(m); setError(''); setNotice(''); };
  const finishSignIn = async () => {                 // sign in with current email/password
    const r = await signIn(email, password);
    if (r && r.mfaRequired) { setMfaSession(r.session); to('mfa'); return; }
    if (r && r.ok) go(redirectTo || 'myportfolio');
    else setError((r && r.error) || 'That email and password don’t match an account.');
  };

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setError(''); setNotice(''); setBusy(true);
    try {
      if (mode === 'signin') {
        await finishSignIn();
      } else if (mode === 'signup') {
        await vmSignUp(email.trim(), password);
        to('confirm'); setNotice('Account created — check your email for the confirmation code.');
      } else if (mode === 'confirm') {
        await vmConfirmSignUp(email.trim(), code.trim());
        await finishSignIn();                        // auto sign in with the password just used
      } else if (mode === 'forgot') {
        await vmForgotPassword(email.trim());
        to('reset'); setNotice('If that email exists, a reset code is on its way.');
      } else if (mode === 'reset') {
        await vmConfirmForgotPassword(email.trim(), code.trim(), password);
        await finishSignIn();                        // sign in with the new password
      } else if (mode === 'mfa') {
        const r = await confirmMfa(email, code.trim(), mfaSession);
        if (r && r.ok) go(redirectTo || 'myportfolio');
        else setError((r && r.error) || 'That code didn’t work — try again.');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setError(''); setNotice('');
    try { await vmResendCode(email.trim()); setNotice('A new code is on the way.'); }
    catch (err) { setError(err.message); }
  };

  const [title, sub, btn] = SI_COPY[mode];
  const clearMsgs = () => { if (error) setError(''); if (notice) setNotice(''); };

  return (
    <div style={{ minHeight:'100%', display:'flex', alignItems:'center', justifyContent:'center', padding: isMobile ? '32px 16px 80px' : '48px 24px 72px', overflowX:'hidden' }}>
      <div style={{ width:'100%', maxWidth: isMobile ? '100%' : 380, background:VM.paper, border:`1px solid ${VM.borderSoft}`,
        borderRadius:14, padding: isMobile ? '24px 18px' : '30px 28px' }}>
        <div style={{ textAlign:'center', marginBottom:22 }}>
          <Kicker>Veridian Markets · Account</Kicker>
          <h1 style={{ fontFamily:VM.serif, fontWeight:700, fontSize: isMobile?24:28, margin:'10px 0 4px' }}>{title}</h1>
          <p style={{ fontFamily:VM.serif, fontSize:14, color:VM.ink3, margin:0 }}>{sub(email)}</p>
        </div>

        <form onSubmit={submit}>
          {/* Email — shown on every mode except while typing a code you already have */}
          {(mode === 'signin' || mode === 'signup' || mode === 'forgot') && (
            <SignInField label="Email" type="email" placeholder="you@example.com" autoComplete="username"
              value={email} onChange={e=>{ setEmail(e.target.value); clearMsgs(); }} />
          )}

          {/* Confirmation / reset / MFA code */}
          {(mode === 'confirm' || mode === 'reset' || mode === 'mfa') && (
            <SignInField label={mode === 'mfa' ? 'Authenticator code' : 'Verification code'} type="text" placeholder="6-digit code" autoComplete="one-time-code"
              inputMode="numeric" value={code} onChange={e=>{ setCode(e.target.value); clearMsgs(); }} />
          )}

          {/* Password — sign in (current), sign up + reset (new) */}
          {(mode === 'signin' || mode === 'signup' || mode === 'reset') && (
            <SignInField label={mode === 'signin' ? 'Password' : 'New password'} type="password" placeholder="••••••••"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password} onChange={e=>{ setPass(e.target.value); clearMsgs(); }} />
          )}

          {error && (
            <div style={{ display:'flex', alignItems:'center', gap:7, margin:'-2px 0 12px',
              fontFamily:VM.serif, fontSize:13, color:VM.downInk }}>
              <i className="ti ti-alert-circle" style={{ fontSize:15 }}></i><span>{error}</span>
            </div>
          )}
          {notice && !error && (
            <div style={{ display:'flex', alignItems:'center', gap:7, margin:'-2px 0 12px',
              fontFamily:VM.serif, fontSize:13, color:VM.teal }}>
              <i className="ti ti-info-circle" style={{ fontSize:15 }}></i><span>{notice}</span>
            </div>
          )}

          {/* Forgot-password link (sign-in mode only) */}
          {mode === 'signin' && (
            <div style={{ textAlign:'right', margin:'-2px 0 14px' }}>
              <span onClick={()=>to('forgot')} style={{ fontFamily:VM.serif, fontSize:12.5, color:VM.teal, cursor:'pointer' }}>Forgot password?</span>
            </div>
          )}

          <button type="submit" disabled={busy} style={{ width:'100%', fontFamily:VM.serif, fontSize:15, borderRadius:999,
            padding:'10px 18px', cursor: busy?'default':'pointer', opacity: busy?0.7:1, marginTop: mode==='signin' ? 0 : 4,
            border:`1px solid ${VM.forest}`, background:VM.forest, color:VM.paperWarm }}>
            {busy ? 'Working…' : btn}
          </button>
        </form>

        {/* Mode switches */}
        <div style={{ textAlign:'center', marginTop:16, fontFamily:VM.serif, fontSize:13, color:VM.ink3 }}>
          {mode === 'signin' && (
            <>New here? <span onClick={()=>to('signup')} style={{ color:VM.teal, cursor:'pointer' }}>Create an account</span></>
          )}
          {mode === 'signup' && (
            <>Already have an account? <span onClick={()=>to('signin')} style={{ color:VM.teal, cursor:'pointer' }}>Sign in</span></>
          )}
          {mode === 'confirm' && (
            <><span onClick={resend} style={{ color:VM.teal, cursor:'pointer' }}>Resend code</span> · <span onClick={()=>to('signin')} style={{ color:VM.teal, cursor:'pointer' }}>Back to sign in</span></>
          )}
          {(mode === 'forgot' || mode === 'reset' || mode === 'mfa') && (
            <span onClick={()=>to('signin')} style={{ color:VM.teal, cursor:'pointer' }}>Back to sign in</span>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { SignIn });
