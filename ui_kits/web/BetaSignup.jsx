// Veridian Markets — Beta sign-up flow
// Route: /invite/:token
//
// Flow:  validate token → form (name + email + password)
//      → founder video (must watch to end)
//      → beta onboarding tour → home page
//
// Beta users are stored in localStorage under 'vm_beta_users'.
// Invite tokens are stored under 'vm_beta_invites'.
// window.VM_FOUNDER_VIDEO_URL — set this to your video URL in index.html.

const { useState: useStateBs, useEffect: useEffectBs, useRef: useRefBs } = React;

// ── Beta data helpers (also used by AdminPanel + app.jsx) ─────────────────────
const BETA_USERS_KEY   = 'vm_beta_users';
const BETA_INVITES_KEY = 'vm_beta_invites';

function loadBetaUsers()   { try { return JSON.parse(localStorage.getItem(BETA_USERS_KEY)   || '[]'); } catch { return []; } }
function saveBetaUsers(a)  { try { localStorage.setItem(BETA_USERS_KEY,   JSON.stringify(a)); } catch {} }
function loadBetaInvites() { try { return JSON.parse(localStorage.getItem(BETA_INVITES_KEY) || '[]'); } catch { return []; } }
function saveBetaInvites(a){ try { localStorage.setItem(BETA_INVITES_KEY, JSON.stringify(a)); } catch {} }

function generateInviteToken() {
  return Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 8);
}

function validateToken(token) {
  const invites = loadBetaInvites();
  return invites.find(i => i.token === token && !i.usedAt) || null;
}

function useToken(token, email) {
  const invites = loadBetaInvites();
  const i = invites.find(inv => inv.token === token);
  if (i) { i.usedAt = Date.now(); i.usedBy = email; }
  saveBetaInvites(invites);
}

// Expose helpers globally so app.jsx + AdminPanel can use them without import.
Object.assign(window, { loadBetaUsers, saveBetaUsers, loadBetaInvites, saveBetaInvites, generateInviteToken });

// ── sha256 (reuse from app.jsx scope) ────────────────────────────────────────
async function bsHash(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── Founder video overlay ─────────────────────────────────────────────────────
function FounderVideoOverlay({ onComplete }) {
  const videoRef     = useRefBs(null);
  const [done, setDone]       = useStateBs(false);
  const [progress, setProgress] = useStateBs(0);

  const videoUrl = window.VM_FOUNDER_VIDEO_URL || null;

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    setProgress(v.currentTime / v.duration);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(10,8,6,0.97)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>

      <div style={{ fontFamily: VM.mono, fontSize: 11, color: VM.teal, letterSpacing: '0.14em',
        textTransform: 'uppercase', marginBottom: 24 }}>A message from the founder</div>

      {videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          controls={false}
          autoPlay
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setDone(true)}
          style={{ maxWidth: 720, width: '100%', borderRadius: 12, background: '#000',
            border: '1px solid rgba(255,255,255,0.1)' }}
        />
      ) : (
        // Placeholder when no video URL is set yet.
        <div style={{ maxWidth: 720, width: '100%', aspectRatio: '16/9', borderRadius: 12,
          background: '#1a1814', border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <i className="ti ti-video" style={{ fontSize: 48, color: 'rgba(255,255,255,0.2)' }}></i>
          <div style={{ fontFamily: VM.mono, fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', maxWidth: 320 }}>
            Set <code style={{ color: VM.teal }}>window.VM_FOUNDER_VIDEO_URL</code> in index.html
            to your video URL.
          </div>
          <button onClick={() => setDone(true)}
            style={{ fontFamily: VM.mono, fontSize: 11, padding: '6px 16px', borderRadius: 6,
              background: 'transparent', border: `1px solid ${VM.teal}`, color: VM.teal, cursor: 'pointer', marginTop: 8 }}>
            Skip for now (dev mode)
          </button>
        </div>
      )}

      {/* Progress bar */}
      <div style={{ width: '100%', maxWidth: 720, height: 3, background: 'rgba(255,255,255,0.08)',
        borderRadius: 2, marginTop: 16, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: VM.teal, borderRadius: 2,
          width: `${Math.round(progress * 100)}%`, transition: 'width .5s linear' }} />
      </div>

      <button
        onClick={done ? onComplete : undefined}
        disabled={!done}
        style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 10,
          padding: '13px 32px', borderRadius: 10, fontFamily: VM.serif, fontSize: 16,
          background: done ? VM.teal : 'rgba(255,255,255,0.06)',
          color: done ? VM.paper : 'rgba(255,255,255,0.25)',
          border: `1.5px solid ${done ? VM.teal : 'rgba(255,255,255,0.1)'}`,
          cursor: done ? 'pointer' : 'not-allowed',
          transition: 'all .3s ease' }}>
        {done ? 'Continue to your tour →' : 'Watch the full video to continue'}
      </button>

      {!done && (
        <div style={{ fontFamily: VM.mono, fontSize: 10, color: 'rgba(255,255,255,0.25)',
          marginTop: 12, letterSpacing: '0.06em' }}>
          {Math.round(progress * 100)}% complete
        </div>
      )}
    </div>
  );
}

// ── Main sign-up component ────────────────────────────────────────────────────
function BetaSignup({ go, signIn }) {
  const token = location.pathname.split('/')[2] || '';

  const [step,     setStep]     = useStateBs('checking');   // checking | invalid | form | video | done
  const [name,     setName]     = useStateBs('');
  const [email,    setEmail]    = useStateBs('');
  const [password, setPassword] = useStateBs('');
  const [error,    setError]    = useStateBs('');
  const [loading,  setLoading]  = useStateBs(false);
  const [invite,   setInvite]   = useStateBs(null);

  useEffectBs(() => {
    const inv = validateToken(token);
    if (!inv) setStep('invalid');
    else { setInvite(inv); setStep('form'); }
  }, [token]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!name.trim())     return setError('Please enter your name.');
    if (!email.trim())    return setError('Please enter your email.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');

    setLoading(true); setError('');

    const existing = loadBetaUsers().find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (existing) { setLoading(false); return setError('An account with that email already exists.'); }

    const passHash = await bsHash(password);
    const user = {
      id:        Math.random().toString(36).slice(2, 12),
      name:      name.trim(),
      email:     email.trim().toLowerCase(),
      passHash,
      plan:      'Pro',
      role:      'beta',
      joined:    Date.now(),
      inviteToken: token,
    };

    const users = loadBetaUsers();
    users.push(user);
    saveBetaUsers(users);
    useToken(token, user.email);

    // Auto sign-in
    if (signIn) await signIn(email, password);

    setLoading(false);
    setStep('video');
  };

  const handleVideoComplete = () => {
    go('front');
    setTimeout(() => { if (window.__vmStartTour) window.__vmStartTour('beta-onboarding'); }, 600);
  };

  // ── Render: checking ──────────────────────────────────────────────────────
  if (step === 'checking') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <i className="ti ti-loader-2" style={{ fontSize: 28, color: VM.ink3, animation: 'spin 1s linear infinite' }}></i>
      </div>
    );
  }

  // ── Render: invalid token ─────────────────────────────────────────────────
  if (step === 'invalid') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: 24, textAlign: 'center' }}>
        <i className="ti ti-lock" style={{ fontSize: 40, color: VM.ink3, marginBottom: 20 }}></i>
        <div style={{ fontFamily: VM.serif, fontSize: 22, fontWeight: 700, color: VM.ink, marginBottom: 10 }}>
          Invalid or expired invite
        </div>
        <div style={{ fontFamily: VM.serif, fontSize: 15, color: VM.ink3, maxWidth: 340 }}>
          This invite link has already been used or doesn't exist.
          Contact Carlos for a new one.
        </div>
        <button onClick={() => go('front')} style={{ marginTop: 28, fontFamily: VM.mono, fontSize: 12,
          padding: '8px 20px', borderRadius: 8, border: `1px solid ${VM.teal}`, background: 'transparent',
          color: VM.teal, cursor: 'pointer' }}>
          Go to home page
        </button>
      </div>
    );
  }

  // ── Render: video ─────────────────────────────────────────────────────────
  if (step === 'video') {
    return <FounderVideoOverlay onComplete={handleVideoComplete} />;
  }

  // ── Render: sign-up form ──────────────────────────────────────────────────
  const field = { width: '100%', padding: '11px 14px', borderRadius: 8, fontFamily: VM.serif, fontSize: 15,
    border: `1.5px solid ${VM.border}`, background: VM.paper, color: VM.ink, outline: 'none',
    transition: 'border-color .15s' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '32px 16px', background: VM.paperWarm }}>

      {/* Logo / brand */}
      <div style={{ fontFamily: VM.serif, fontStyle: 'italic', fontWeight: 700, fontSize: 28,
        color: VM.forest, marginBottom: 8, letterSpacing: '-0.02em' }}>Veridian Markets</div>

      <div style={{ fontFamily: VM.mono, fontSize: 10, color: VM.teal, letterSpacing: '0.14em',
        textTransform: 'uppercase', marginBottom: 32 }}>Beta access · Pro account</div>

      <div style={{ width: '100%', maxWidth: 420, background: VM.paper, borderRadius: 16,
        border: `1px solid ${VM.border}`, padding: '36px 32px', boxShadow: '0 8px 40px rgba(31,29,26,0.08)' }}>

        <div style={{ fontFamily: VM.serif, fontSize: 20, fontWeight: 700, color: VM.ink, marginBottom: 6 }}>
          Create your account
        </div>
        <div style={{ fontFamily: VM.serif, fontSize: 14, color: VM.ink3, marginBottom: 28 }}>
          You've been invited to try Veridian Markets for free.
          Your account includes full Pro access.
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontFamily: VM.mono, fontSize: 10, color: VM.ink3, letterSpacing: '0.06em',
              display: 'block', marginBottom: 6 }}>FULL NAME</label>
            <input value={name} onChange={e => { setName(e.target.value); setError(''); }}
              placeholder="Your name" style={field} autoFocus
              onFocus={e => e.target.style.borderColor = VM.teal}
              onBlur={e  => e.target.style.borderColor = VM.border} />
          </div>
          <div>
            <label style={{ fontFamily: VM.mono, fontSize: 10, color: VM.ink3, letterSpacing: '0.06em',
              display: 'block', marginBottom: 6 }}>EMAIL</label>
            <input value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
              type="email" placeholder="you@example.com" style={field}
              onFocus={e => e.target.style.borderColor = VM.teal}
              onBlur={e  => e.target.style.borderColor = VM.border} />
          </div>
          <div>
            <label style={{ fontFamily: VM.mono, fontSize: 10, color: VM.ink3, letterSpacing: '0.06em',
              display: 'block', marginBottom: 6 }}>PASSWORD</label>
            <input value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
              type="password" placeholder="At least 8 characters" style={field}
              onFocus={e => e.target.style.borderColor = VM.teal}
              onBlur={e  => e.target.style.borderColor = VM.border} />
          </div>

          {error && (
            <div style={{ fontFamily: VM.mono, fontSize: 11, color: '#c44', padding: '8px 12px',
              background: 'rgba(196,68,68,0.08)', borderRadius: 6, border: '1px solid rgba(196,68,68,0.2)' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{ marginTop: 8, padding: '13px', borderRadius: 10, fontFamily: VM.serif, fontSize: 16,
              background: VM.forest, color: VM.paper, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1, transition: 'opacity .15s', fontWeight: 600 }}>
            {loading ? 'Creating account…' : 'Create account →'}
          </button>
        </form>

        <div style={{ fontFamily: VM.mono, fontSize: 10, color: VM.ink3, textAlign: 'center',
          marginTop: 20, lineHeight: 1.6 }}>
          By continuing you agree to share feedback with the Veridian team.<br />
          Your Pro account is free for the duration of the beta.
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { BetaSignup });
