// Veridian Markets — Account settings.
// A grouped settings list (Instagram "Settings and activity" pattern) reimagined
// in the VM editorial style: a profile summary, sectioned rows with icon chips +
// chevrons, each row drilling into its own sub-page. Sub-navigation is internal
// state (one /settings route); a back arrow returns to the list. Mock/scaffold.
const { useState: useStateSettings, useEffect: useEffectSettings } = React;

// ── settings model: groups → rows. `action` rows fire a handler instead of a page.
const SETTINGS_GROUPS = [
  { head: 'Your account', items: [
    { id: 'profile',      icon: 'user',            label: 'Personal details',     desc: 'Name, email, profile photo' },
    { id: 'security',     icon: 'lock',            label: 'Password & security',  desc: 'Password, two-factor, sessions' },
    { id: 'subscription', icon: 'star',            label: 'Subscription & billing', desc: 'Plan, payment method, invoices' },
    { id: 'connected',    icon: 'plug-connected',  label: 'Connected accounts',   desc: 'Brokers and data sources' },
  ]},
  { head: 'How you use Veridian', items: [
    { id: 'saved',         icon: 'bookmark',  label: 'Saved',         desc: 'Companies and stories you saved' },
    { id: 'activity',      icon: 'history',   label: 'Your activity', desc: 'Searches, views and history' },
    { id: 'notifications', icon: 'bell',      label: 'Notifications' },
    { id: 'appearance',    icon: 'palette',   label: 'Appearance' },
    { id: 'learning',      icon: 'school',    label: 'Learning',      desc: 'Course progress' },
  ]},
  { head: 'Privacy & data', items: [
    { id: 'privacy',     icon: 'shield-lock', label: 'Account privacy' },
    { id: 'permissions', icon: 'key',         label: 'Data & permissions' },
  ]},
  { head: 'Support', items: [
    { id: 'help',  icon: 'help-circle', label: 'Help centre' },
    { id: 'legal', icon: 'file-text',   label: 'Terms & policies' },
    { id: 'about', icon: 'info-circle', label: 'About Veridian' },
  ]},
  { head: null, items: [
    { id: 'logout', icon: 'logout', label: 'Log out',        action: true },
    { id: 'delete', icon: 'trash',  label: 'Delete account', action: true, tone: 'danger' },
  ]},
];
const SETTINGS_TITLES = SETTINGS_GROUPS.flatMap(g => g.items).reduce((m, i) => (m[i.id] = i.label, m), {});

function DeleteAccountModal({ email, onConfirm, onClose }) {
  const [typed, setTyped] = useStateSettings('');
  const ready = typed === 'DELETE';
  return ReactDOM.createPortal(
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(31,29,26,0.52)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px 16px' }}>
      <div onClick={e => e.stopPropagation()} style={{ background:VM.paper, borderRadius:14, maxWidth:460, width:'100%', boxShadow:'0 24px 64px rgba(31,29,26,0.32)' }}>
        <div style={{ padding:'22px 22px 0', display:'flex', alignItems:'flex-start', gap:14 }}>
          <div style={{ width:42, height:42, borderRadius:10, background:'#FDE8E8', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <i className="ti ti-trash" style={{ fontSize:20, color:VM.downInk }}></i>
          </div>
          <div>
            <div style={{ fontFamily:VM.serif, fontWeight:700, fontSize:18, color:VM.ink, marginBottom:6 }}>Delete your account?</div>
            <div style={{ fontFamily:VM.serif, fontSize:13.5, color:VM.ink2, lineHeight:1.6 }}>
              This will permanently remove your profile, saved companies, watchlists, activity history, and all connected accounts. <strong>This cannot be undone.</strong>
            </div>
          </div>
        </div>
        <div style={{ padding:'18px 22px 22px', display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ background:VM.paperDeep, border:`1px solid ${VM.borderSoft}`, borderRadius:9, padding:'12px 14px' }}>
            <div style={{ fontFamily:VM.mono, fontSize:10.5, color:VM.ink3, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:4 }}>Signed in as</div>
            <div style={{ fontFamily:VM.mono, fontSize:12, color:VM.ink2 }}>{email}</div>
          </div>
          <div>
            <div style={{ fontFamily:VM.mono, fontSize:11, color:VM.ink3, marginBottom:6 }}>Type <strong style={{ color:VM.ink }}>DELETE</strong> to confirm</div>
            <input
              value={typed} onChange={e => setTyped(e.target.value)}
              placeholder="DELETE"
              style={{ width:'100%', boxSizing:'border-box', fontFamily:VM.mono, fontSize:14, padding:'10px 12px', borderRadius:8,
                border:`1.5px solid ${ready ? VM.downInk : VM.border}`, background:VM.paper, color:VM.ink, outline:'none' }}
            />
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={onClose} style={{ flex:1, fontFamily:VM.serif, fontSize:14, padding:'10px 0', borderRadius:999, border:`1px solid ${VM.border}`, background:'transparent', color:VM.ink2, cursor:'pointer' }}>
              Cancel
            </button>
            <button onClick={ready ? onConfirm : undefined} style={{ flex:1, fontFamily:VM.serif, fontSize:14, fontWeight:600, padding:'10px 0', borderRadius:999, border:'none',
              background: ready ? VM.downInk : VM.faint, color: ready ? '#fff' : VM.ink3, cursor: ready ? 'pointer' : 'default', transition:'all .15s' }}>
              Delete account
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function AccountSettings({ go, user, onSignOut, isMobile, theme, onThemeChange }) {
  const initSection = () => {
    const m = window.location.pathname.match(/^\/settings\/(.+)$/);
    return m ? m[1] : null;
  };
  const [section, setSection] = useStateSettings(initSection);
  const [toast, setToast] = useStateSettings('');
  const [showDelete, setShowDelete] = useStateSettings(false);
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 2800); };
  const u = user || { name: 'Guest', email: 'not signed in', tier: 'Free' };

  const navTo = (id) => {
    setSection(id);
    const path = id ? '/settings/' + id : '/settings';
    if (window.location.pathname !== path) window.history.pushState({}, '', path);
    document.title = id ? (SETTINGS_TITLES[id] || id) + ' · Settings · Veridian Markets' : 'Settings · Veridian Markets';
  };

  useEffectSettings(() => {
    const onPop = () => {
      const m = window.location.pathname.match(/^\/settings\/(.+)$/);
      setSection(m ? m[1] : null);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const onRow = (item) => {
    if (item.id === 'logout') { onSignOut && onSignOut(); return; }
    if (item.id === 'delete') { setShowDelete(true); return; }
    navTo(item.id);
  };

  const handleDeleteConfirm = () => {
    // Clear all local data (prototype — admin credentials remain hardcoded in app.jsx)
    try {
      ['vm_session','vm_theme','vm_2fa_app','vm_2fa_sms','vm_2fa_phone',
       'vm_other_sessions','vm_pf_brokers','vm_mock_password','vm_account_mode'].forEach(k => localStorage.removeItem(k));
    } catch(e) {}
    setShowDelete(false);
    onSignOut && onSignOut();
  };

  return (
    <div data-tour="vm-settings-nav" style={{ padding: isMobile ? '16px 14px 88px' : '26px 32px 72px', maxWidth: 720, margin: '0 auto' }}>
      {section
        ? <StSubPage title={SETTINGS_TITLES[section]} onBack={() => navTo(null)} isMobile={isMobile}>{renderSection(section, { go, u, showToast, isMobile, theme, onThemeChange })}</StSubPage>
        : <StList u={u} onRow={onRow} go={go} isMobile={isMobile} />}
      {toast && <StToast text={toast} />}
      {showDelete && <DeleteAccountModal email={u.email} onConfirm={handleDeleteConfirm} onClose={() => setShowDelete(false)} />}
    </div>
  );
}

const ACCT_STEPS = [
  { sel:'[data-tour="vm-settings-profile"]',
    title:'Your profile.',
    body:'Your name, email, and current plan tier at a glance. Click anywhere on this card to go straight into Personal details — change your name, email, username, or profile photo.' },
  { sel:'[data-tour="vm-settings-groups"]',
    title:'Settings sections.',
    body:'Tap any row to drill into that section. Your account covers password, 2FA, subscription, and broker connections. The second group handles notifications, appearance, learning progress, and privacy. Each sub-page has a back arrow to return here.' },
  { sel:'[data-tour="vm-settings-danger"]',
    title:'Log out and account deletion.',
    body:'Log out ends your current session. Delete account permanently removes your profile, saved companies, activity history, and all connected brokers — it requires you to type DELETE to confirm and cannot be undone.' },
];

// ── the main list ───────────────────────────────────────────────────────────
function StList({ u, onRow, go, isMobile }) {
  const [tutorialOpen, setTutorialOpen] = useStateSettings(false);
  const initials = (u.name || '?').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
  const tutBtn = {
    display:'inline-flex', alignItems:'center', gap:6, fontFamily:VM.mono, fontSize:10,
    letterSpacing:'0.04em', textTransform:'uppercase', padding:'4px 11px', borderRadius:5,
    border:`1px solid ${VM.terra}`, background:'transparent', color:VM.terra, cursor:'pointer',
  };
  return (
    <React.Fragment>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
        <div>
          <Kicker>Account</Kicker>
          <h1 style={{ fontFamily: VM.serif, fontWeight: 700, fontSize: isMobile ? 26 : 30, lineHeight: 1.05, margin: '8px 0 18px' }}>Settings.</h1>
        </div>
        <button onClick={()=>setTutorialOpen(true)} title="Interactive tutorial — learn this page" style={{...tutBtn, flexShrink:0, marginTop:8}}>
          <i className="ti ti-graduation-cap" style={{ fontSize:12 }}></i>Tutorial
        </button>
      </div>

      {/* profile summary → personal details */}
      <div data-tour="vm-settings-profile" onClick={() => onRow({ id: 'profile' })} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', cursor: 'pointer',
        background: `linear-gradient(100deg, ${VM.tealTint} 0%, ${VM.paper} 75%)`, border: `1px solid ${VM.borderSoft}`, borderRadius: 14 }}>
        <span style={{ width: 52, height: 52, borderRadius: 14, flexShrink: 0, background: VM.forest, color: VM.paperWarm, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: VM.serif, fontWeight: 700, fontSize: 20 }}>{initials}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: VM.serif, fontWeight: 700, fontSize: 18 }}>{u.name}</div>
          <Mono size={11} color={VM.ink3}>{u.email}</Mono>
        </div>
        <span style={{ fontFamily: VM.mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: VM.tealInk, background: VM.paper, border: `1px solid ${VM.tealTint2}`, borderRadius: 6, padding: '3px 8px' }}>{u.tier || 'Free'}</span>
        <i className="ti ti-chevron-right" style={{ fontSize: 18, color: VM.ink3 }}></i>
      </div>

      <div data-tour="vm-settings-groups">
        {SETTINGS_GROUPS.slice(0, -1).map((g, gi) => (
          <div key={gi} style={{ marginTop: 22 }}>
            {g.head && <Label style={{ display: 'block', marginBottom: 9, paddingLeft: 4 }}>{g.head}</Label>}
            <div style={{ background: VM.paper, border: `1px solid ${VM.borderSoft}`, borderRadius: 14, overflow: 'hidden' }}>
              {g.items.map((it, i) => <StRow key={it.id} item={it} last={i === g.items.length - 1} onClick={() => onRow(it)} />)}
            </div>
          </div>
        ))}
      </div>
      <div data-tour="vm-settings-danger">
        {SETTINGS_GROUPS.slice(-1).map((g, gi) => (
          <div key={gi} style={{ marginTop: 22 }}>
            <div style={{ background: VM.paper, border: `1px solid ${VM.borderSoft}`, borderRadius: 14, overflow: 'hidden' }}>
              {g.items.map((it, i) => <StRow key={it.id} item={it} last={i === g.items.length - 1} onClick={() => onRow(it)} />)}
            </div>
          </div>
        ))}
      </div>
      <Mono size={10} color={VM.faint} style={{ display: 'block', textAlign: 'center', marginTop: 26 }}>Veridian Markets · v0.9 (prototype)</Mono>
      {tutorialOpen && <TutorialOverlay steps={ACCT_STEPS} label="Settings tutorial" onClose={()=>setTutorialOpen(false)} />}
    </React.Fragment>
  );
}
function StRow({ item, last, onClick }) {
  const [hover, setHover] = useStateSettings(false);
  const danger = item.tone === 'danger';
  const fg = danger ? VM.downInk : VM.ink;
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 16px', cursor: 'pointer',
        background: hover ? VM.paperWarm : 'transparent', borderBottom: last ? 'none' : `1px solid ${VM.borderHair}`, transition: 'background .12s' }}>
      <span style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: danger ? 'rgba(163,45,45,0.08)' : VM.paperDeep, color: danger ? VM.downInk : VM.ink2 }}>
        <i className={'ti ti-' + item.icon} style={{ fontSize: 17 }}></i>
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: VM.serif, fontSize: 15.5, color: fg }}>{item.label}</div>
        {item.desc && <Mono size={10} color={VM.ink3} style={{ display: 'block', marginTop: 1 }}>{item.desc}</Mono>}
      </div>
      {item.value && <Mono size={11} color={VM.ink3}>{item.value}</Mono>}
      {!item.action && <i className="ti ti-chevron-right" style={{ fontSize: 17, color: VM.faint }}></i>}
    </div>
  );
}

// ── sub-page shell ────────────────────────────────────────────────────────────
function StSubPage({ title, onBack, children, isMobile }) {
  return (
    <React.Fragment>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 18 }}>
        <button onClick={onBack} title="Back" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px 6px 8px', borderRadius: 999,
          border: `1px solid ${VM.border}`, background: VM.paper, color: VM.ink2, cursor: 'pointer', fontFamily: VM.serif, fontSize: 13.5 }}>
          <i className="ti ti-chevron-left" style={{ fontSize: 16 }}></i>Settings
        </button>
      </div>
      <h1 style={{ fontFamily: VM.serif, fontWeight: 700, fontSize: isMobile ? 24 : 27, lineHeight: 1.06, margin: '0 0 18px' }}>{title}</h1>
      {children}
    </React.Fragment>
  );
}

// ── shared sub-page pieces ────────────────────────────────────────────────────
function StCard({ title, children, style }) {
  return (
    <div style={{ background: VM.paper, border: `1px solid ${VM.borderSoft}`, borderRadius: 14, padding: '4px 16px', marginBottom: 16, ...style }}>
      {title && <Label style={{ display: 'block', padding: '14px 0 4px' }}>{title}</Label>}
      {children}
    </div>
  );
}
function StField({ label, value, placeholder, type = 'text' }) {
  const [v, setV] = useStateSettings(value || '');
  return (
    <label style={{ display: 'block', padding: '11px 0', borderBottom: `1px solid ${VM.borderHair}` }}>
      <span style={{ fontFamily: VM.mono, fontSize: 9, letterSpacing: '0.06em', textTransform: 'uppercase', color: VM.ink3, display: 'block', marginBottom: 5 }}>{label}</span>
      <input type={type} value={v} placeholder={placeholder} onChange={e => setV(e.target.value)}
        style={{ width: '100%', boxSizing: 'border-box', border: 'none', outline: 'none', background: 'transparent', fontFamily: VM.serif, fontSize: 16, color: VM.ink }} />
    </label>
  );
}
function StToggle({ label, desc, on = false, last }) {
  const [v, setV] = useStateSettings(on);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0', borderBottom: last ? 'none' : `1px solid ${VM.borderHair}` }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: VM.serif, fontSize: 15, color: VM.ink }}>{label}</div>
        {desc && <Mono size={10} color={VM.ink3} style={{ display: 'block', marginTop: 1 }}>{desc}</Mono>}
      </div>
      <button onClick={() => setV(x => !x)} style={{ width: 42, height: 24, borderRadius: 999, border: 'none', cursor: 'pointer', flexShrink: 0,
        background: v ? VM.forest : VM.paperDeep, position: 'relative', transition: 'background .16s' }}>
        <span style={{ position: 'absolute', top: 2, left: v ? 20 : 2, width: 20, height: 20, borderRadius: 999, background: VM.paper, transition: 'left .16s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}></span>
      </button>
    </div>
  );
}
function StLink({ label, value, onClick, last }) {
  const [hover, setHover] = useStateSettings(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 0', cursor: 'pointer', borderBottom: last ? 'none' : `1px solid ${VM.borderHair}`, color: hover ? VM.teal : VM.ink }}>
      <span style={{ flex: 1, fontFamily: VM.serif, fontSize: 15 }}>{label}</span>
      {value && <Mono size={11} color={VM.ink3}>{value}</Mono>}
      <i className="ti ti-chevron-right" style={{ fontSize: 16, color: VM.faint }}></i>
    </div>
  );
}
function StNote({ children }) {
  return <p style={{ fontFamily: VM.serif, fontSize: 14, color: VM.ink2, lineHeight: 1.5, margin: '0 0 16px' }}>{children}</p>;
}
function StSave({ onClick, label = 'Save changes' }) {
  return <Btn solid onClick={onClick} style={{ fontFamily: VM.serif }}><i className="ti ti-check" style={{ fontSize: 15 }}></i>{label}</Btn>;
}
const HELP_ARTICLES = {
  'Getting started': {
    icon: 'rocket',
    body: [
      { h: 'Welcome to Veridian Markets', p: 'Veridian is a history-led finance platform. Every market move you see today has echoes in history — we surface those analogues so you can make more informed decisions.' },
      { h: 'Navigate the platform', p: 'Use the left rail to move between pages. Home shows the editorial overview. Search lets you look up any company. Calendar tracks upcoming market events.' },
      { h: 'My Account', p: 'Your personal dashboard. Connect a broker to import your portfolio, track performance, and see historical parallels to your holdings.' },
      { h: 'History tab', p: 'The core of Veridian. Type any market question and we surface the closest historical analogues — with data, context, and what happened next.' },
    ],
  },
  'Account & billing': {
    icon: 'credit-card',
    body: [
      { h: 'Plans', p: 'Veridian offers Free, Plus, Pro, and Business tiers. The Free plan gives you access to the home feed, search, and limited history queries. Plus and Pro unlock full history depth, broker connections, and AI-powered analogues.' },
      { h: 'Changing your plan', p: 'Go to Settings → Subscription & billing to upgrade or downgrade. Changes take effect at the next billing cycle. Downgrades retain access until the period ends.' },
      { h: 'Invoices', p: 'All invoices are emailed to your registered address and available in the Subscription & billing section. Payments are processed securely via Stripe.' },
      { h: 'Cancellation', p: 'You can cancel anytime from Settings → Subscription & billing. Your access continues until the end of the paid period — no partial refunds.' },
    ],
  },
  'Connecting a broker': {
    icon: 'plug-connected',
    body: [
      { h: 'Supported brokers', p: 'Veridian currently supports Trading 212, Interactive Brokers, Robinhood, Coinbase, Vanguard, and Binance. More brokers are being added regularly.' },
      { h: 'How to connect', p: 'Go to Settings → Connected accounts. Find your broker and tap Connect. You will be redirected to your broker\'s authorisation page — approve read-only access, and your portfolio will sync automatically.' },
      { h: 'Read-only access', p: 'Veridian only requests read-only permission. We cannot place trades, move funds, or make any changes to your broker account.' },
      { h: 'Disconnecting', p: 'You can disconnect a broker at any time from Settings → Connected accounts. Your historical data is retained unless you clear your activity.' },
    ],
  },
  'Contact support': {
    icon: 'mail',
    body: [
      { h: 'Email support', p: 'Reach the team at support@veridianmarkets.ai. We aim to respond within one business day.' },
      { h: 'Bug reports', p: 'Found something broken? Email us with a short description of what happened, which page you were on, and your browser. Screenshots are always helpful.' },
      { h: 'Feature requests', p: 'We read every message. If you have an idea that would make Veridian more useful, send it to feedback@veridianmarkets.ai.' },
      { h: 'Response times', p: 'During beta, support is handled by a small team. We prioritise account issues and data problems. General queries may take 2–3 business days.' },
    ],
  },
};

function HelpModal({ article, onClose, articles }) {
  const data = (articles || HELP_ARTICLES)[article];
  if (!data) return null;
  return ReactDOM.createPortal(
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(31,29,26,0.42)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px 16px' }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:VM.paper, borderRadius:14, maxWidth:520, width:'100%', maxHeight:'82vh', overflowY:'auto', boxShadow:'0 24px 64px rgba(31,29,26,0.28)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 20px 14px', borderBottom:`1px solid ${VM.borderSoft}` }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:9, background:VM.tealTint, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <i className={'ti ti-'+data.icon} style={{ fontSize:18, color:VM.tealInk }}></i>
            </div>
            <span style={{ fontFamily:VM.serif, fontWeight:700, fontSize:18, color:VM.ink }}>{article}</span>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, border:`1px solid ${VM.border}`, background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:VM.ink3 }}>
            <i className="ti ti-x" style={{ fontSize:15 }}></i>
          </button>
        </div>
        <div style={{ padding:'18px 20px 24px', display:'flex', flexDirection:'column', gap:18 }}>
          {data.body.map((block, i) => (
            <div key={i}>
              <div style={{ fontFamily:VM.serif, fontWeight:600, fontSize:15, color:VM.ink, marginBottom:5 }}>{block.h}</div>
              <div style={{ fontFamily:VM.serif, fontSize:14, color:VM.ink2, lineHeight:1.65 }}>{block.p}</div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}

function StToast({ text }) {
  return <div style={{ position: 'fixed', left: '50%', bottom: 28, transform: 'translateX(-50%)', zIndex: 90, display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 16px', borderRadius: 999, background: VM.forest, color: VM.paperWarm, fontFamily: VM.serif, fontSize: 14, boxShadow: '0 8px 24px rgba(31,29,26,0.22)' }}>
    <i className="ti ti-info-circle" style={{ fontSize: 16 }}></i>{text}</div>;
}

const BROKERS_LIST = [
  { id:'t212', name:'Trading 212',         color:'#1E5BD6' },
  { id:'ibkr', name:'Interactive Brokers', color:'#A8512A' },
  { id:'rh',   name:'Robinhood',           color:'#1D9E75' },
  { id:'cb',   name:'Coinbase',            color:'#185FA5' },
  { id:'vg',   name:'Vanguard',            color:'#7A1F2B' },
  { id:'bin',  name:'Binance',             color:'#C49A3B' },
];
const BROKERS_LS_KEY = 'vm_pf_brokers';

function ConnectedAccountsSection({ showToast }) {
  const [connected, setConnected] = useStateSettings(() => {
    try { return new Set(JSON.parse(localStorage.getItem(BROKERS_LS_KEY) || '[]')); } catch { return new Set(); }
  });
  const [confirming, setConfirming] = useStateSettings(null); // id of broker pending disconnect

  const handleClick = (id) => {
    if (connected.has(id)) {
      setConfirming(id); // ask first
    } else {
      setConnected(prev => {
        const next = new Set(prev); next.add(id);
        localStorage.setItem(BROKERS_LS_KEY, JSON.stringify([...next]));
        return next;
      });
      const name = BROKERS_LIST.find(b => b.id === id)?.name || id;
      showToast(`${name} connected (mock).`);
    }
  };
  const confirmDisconnect = () => {
    const id = confirming;
    setConnected(prev => {
      const next = new Set(prev); next.delete(id);
      localStorage.setItem(BROKERS_LS_KEY, JSON.stringify([...next]));
      return next;
    });
    const name = BROKERS_LIST.find(b => b.id === id)?.name || id;
    showToast(`${name} disconnected.`);
    setConfirming(null);
  };

  return (
    <React.Fragment>
      <StNote>Link a broker to import your holdings. Real connections arrive with the backend.</StNote>
      <StCard title="Brokers">
        {BROKERS_LIST.map((b, i) => {
          const on = connected.has(b.id);
          return <BrokerRow key={b.id} b={b} on={on} last={i===BROKERS_LIST.length-1}
            confirming={confirming===b.id}
            onClick={()=>handleClick(b.id)}
            onConfirmDisconnect={confirmDisconnect}
            onCancelDisconnect={()=>setConfirming(null)} />;
        })}
      </StCard>
      {connected.size > 0 && (
        <Mono size={10} color={VM.upInk} style={{ display:'block', marginTop:4 }}>
          <i className="ti ti-circle-check-filled" style={{fontSize:11,marginRight:4}}></i>
          {connected.size} broker{connected.size>1?'s':''} linked · data sync comes with the backend
        </Mono>
      )}
    </React.Fragment>
  );
}
function BrokerRow({ b, on, last, confirming, onClick, onConfirmDisconnect, onCancelDisconnect }) {
  const [hover, setHover] = useStateSettings(false);
  return (
    <div onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{ borderBottom: last?'none':`1px solid ${VM.borderHair}`, background: (hover||confirming)?VM.paperWarm:'transparent',
        transition:'background .12s', borderRadius:(hover||confirming)?8:0, padding:'0 8px', margin:'0 -8px' }}>
      <div onClick={confirming ? undefined : onClick}
        style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 0', cursor: confirming?'default':'pointer' }}>
        <span style={{ width:10, height:10, borderRadius:999, background: on?b.color:VM.borderSoft, flexShrink:0, transition:'background .2s' }}></span>
        <span style={{ flex:1, fontFamily:VM.serif, fontSize:15.5, color:VM.ink }}>{b.name}</span>
        {on
          ? <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontFamily:VM.mono, fontSize:10, color:VM.upInk,
              background:VM.tealTint, border:`1px solid ${VM.up}`, borderRadius:6, padding:'3px 9px' }}>
              <i className="ti ti-circle-check-filled" style={{fontSize:11}}></i>Connected
            </span>
          : <span style={{ fontFamily:VM.mono, fontSize:10, color: hover?VM.tealInk:VM.ink3, transition:'color .12s' }}>Connect</span>
        }
        <i className="ti ti-chevron-right" style={{ fontSize:16, color:VM.faint }}></i>
      </div>
      {confirming && (
        <div style={{ display:'flex', alignItems:'center', gap:10, paddingBottom:12, paddingLeft:22 }}>
          <Mono size={11} color={VM.ink2}>Disconnect {b.name}?</Mono>
          <button onClick={onConfirmDisconnect}
            style={{ fontFamily:VM.serif, fontSize:12, padding:'5px 13px', borderRadius:999,
              border:`1px solid ${VM.downInk}`, background:VM.downInk, color:'#fff', cursor:'pointer' }}>
            Disconnect
          </button>
          <button onClick={onCancelDisconnect}
            style={{ fontFamily:VM.serif, fontSize:12, padding:'5px 13px', borderRadius:999,
              border:`1px solid ${VM.border}`, background:'transparent', color:VM.ink2, cursor:'pointer' }}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

function SessionRow({ s, last, onSignOut }) {
  const [hover, setHover] = useStateSettings(false);
  const isMobile = /iPhone|Android/i.test(s.label);
  return (
    <div onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 0',
        borderBottom: last ? 'none' : `1px solid ${VM.borderHair}`,
        background: hover ? VM.paperWarm : 'transparent', transition:'background .12s',
        borderRadius: hover ? 8 : 0, padding:'11px 8px', margin:'0 -8px' }}>
      <i className={'ti ti-'+(isMobile?'device-mobile':'device-laptop')} style={{ fontSize:16, color:VM.ink3, flexShrink:0 }}></i>
      <span style={{ flex:1, fontFamily:VM.serif, fontSize:15, color:VM.ink2 }}>{s.label}</span>
      {hover
        ? <button onClick={onSignOut} style={{ display:'inline-flex', alignItems:'center', gap:5, fontFamily:VM.serif, fontSize:12,
            padding:'5px 11px', borderRadius:999, border:`1px solid ${VM.downInk}`, background:'transparent',
            color:VM.downInk, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}>
            <i className="ti ti-logout" style={{fontSize:13}}></i>Sign out
          </button>
        : <Mono size={11} color={VM.ink3} style={{flexShrink:0}}>{s.time}</Mono>
      }
    </div>
  );
}

// ── security sub-page — fully interactive, localStorage-backed ───────────────
const QR_GRID = [[1,1,1,1,1,1,1,0,1,0,0,0,1,1,1,1,1],[1,0,0,0,0,0,1,0,0,1,1,0,1,0,0,0,1],[1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,1,1],[1,0,1,1,1,0,1,0,0,0,0,0,1,0,1,0,1],[1,0,1,1,1,0,1,0,1,1,0,1,1,0,1,1,1],[1,0,0,0,0,0,1,0,1,0,1,0,1,0,0,0,1],[1,1,1,1,1,1,1,0,1,0,1,0,1,1,1,1,1],[0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0],[1,1,0,1,1,0,1,1,1,0,1,0,1,0,1,1,0],[0,0,1,0,0,1,0,0,0,1,0,1,0,1,0,0,1],[1,0,1,1,0,0,1,0,1,0,1,0,0,1,1,0,1],[0,1,0,0,1,1,0,1,0,1,0,1,1,0,0,1,0],[1,1,1,1,1,1,1,0,1,0,1,0,1,1,0,1,0],[1,0,0,0,0,0,1,0,0,1,0,1,0,1,0,0,1],[1,0,1,1,1,0,1,0,1,0,0,0,1,0,0,1,1],[1,0,0,0,0,0,1,0,0,1,1,0,0,1,1,0,0],[1,1,1,1,1,1,1,0,1,0,0,1,0,0,1,0,1]];

function StSecuritySection({ u, showToast }) {
  const [cur, setCur]           = useStateSettings('');
  const [newPw, setNewPw]       = useStateSettings('');
  const [conf, setConf]         = useStateSettings('');
  const [showCur, setShowCur]   = useStateSettings(false);
  const [showNew, setShowNew]   = useStateSettings(false);
  const [showConf, setShowConf] = useStateSettings(false);
  const [errors, setErrors]     = useStateSettings({});
  const [pwSaved, setPwSaved]   = useStateSettings(false);

  const [authApp, setAuthApp]   = useStateSettings(() => { try { return JSON.parse(localStorage.getItem('vm_2fa_app') || 'false'); } catch { return false; } });
  const [smsBak, setSmsBak]     = useStateSettings(() => { try { return JSON.parse(localStorage.getItem('vm_2fa_sms') || 'false'); } catch { return false; } });
  const [phone, setPhone]       = useStateSettings(() => localStorage.getItem('vm_2fa_phone') || '');
  const [showQR, setShowQR]     = useStateSettings(false);
  const [showSmsIn, setShowSmsIn] = useStateSettings(false);
  const [verifyCode, setVerifyCode] = useStateSettings('');

  const [otherSessions, setOtherSessions] = useStateSettings(() => {
    try { return JSON.parse(localStorage.getItem('vm_other_sessions') || 'null') ||
      [{ id:1, label:'iPhone · Veridian app', time:'2d ago' }, { id:2, label:'MacBook · Safari', time:'5d ago' }];
    } catch { return []; }
  });

  const currentDevice = React.useMemo(() => {
    const ua = navigator.userAgent;
    const os = /Win/.test(ua) ? 'Windows' : /Mac/.test(ua) ? 'Mac' : /iPhone/.test(ua) ? 'iPhone' : /Android/.test(ua) ? 'Android' : 'Linux';
    const br = /Edg/.test(ua) ? 'Edge' : /Chrome/.test(ua) ? 'Chrome' : /Firefox/.test(ua) ? 'Firefox' : /Safari/.test(ua) ? 'Safari' : 'Browser';
    return `This device · ${os} · ${br}`;
  }, []);

  const strength = React.useMemo(() => {
    if (!newPw) return 0;
    let s = 0;
    if (newPw.length >= 8) s++;
    if (newPw.length >= 12) s++;
    if (/[A-Z]/.test(newPw)) s++;
    if (/[0-9]/.test(newPw)) s++;
    if (/[^A-Za-z0-9]/.test(newPw)) s++;
    return s;
  }, [newPw]);
  const SW_COLOR = [VM.faint, VM.down, VM.down, VM.terra, VM.up, VM.up];
  const SW_LABEL = ['', 'Weak', 'Weak', 'Fair', 'Good', 'Strong'];

  const savePw = () => {
    const stored = localStorage.getItem('vm_mock_password') || 'password';
    const errs = {};
    if (!cur)               errs.cur   = 'Required';
    else if (cur !== stored) errs.cur   = 'Incorrect password';
    if (!newPw)             errs.newPw = 'Required';
    else if (newPw.length < 8) errs.newPw = 'Minimum 8 characters';
    if (!conf)              errs.conf  = 'Required';
    else if (newPw !== conf) errs.conf  = 'Passwords do not match';
    setErrors(errs);
    if (!Object.keys(errs).length) {
      localStorage.setItem('vm_mock_password', newPw);
      setCur(''); setNewPw(''); setConf('');
      setPwSaved(true); setTimeout(() => setPwSaved(false), 3000);
    }
  };

  const toggleAuthApp = () => {
    if (authApp) { setAuthApp(false); localStorage.setItem('vm_2fa_app','false'); showToast('Authenticator app disabled.'); }
    else setShowQR(true);
  };
  const confirmQR = () => {
    if (verifyCode.length < 6) return;
    setAuthApp(true); localStorage.setItem('vm_2fa_app','true');
    setShowQR(false); setVerifyCode(''); showToast('Authenticator app enabled.');
  };
  const toggleSms = () => {
    if (smsBak) { setSmsBak(false); localStorage.setItem('vm_2fa_sms','false'); showToast('SMS backup disabled.'); }
    else setShowSmsIn(true);
  };
  const confirmSms = () => {
    if (phone.length < 7) return;
    setSmsBak(true); localStorage.setItem('vm_2fa_sms','true'); localStorage.setItem('vm_2fa_phone', phone);
    setShowSmsIn(false); showToast('SMS backup enabled.');
  };
  const signOutEverywhere = () => {
    setOtherSessions([]); localStorage.setItem('vm_other_sessions','[]');
    showToast('Signed out of all other sessions.');
  };

  const eyeBtn = (on, toggle) => (
    <button onClick={toggle} type="button" style={{ border:'none', background:'transparent', cursor:'pointer', color:VM.ink3, padding:4, display:'flex', alignItems:'center', flexShrink:0 }}>
      <i className={'ti ti-eye'+(on?'-off':'')} style={{ fontSize:16 }}></i>
    </button>
  );
  const toggle = (on, fn) => (
    <button onClick={fn} style={{ width:42, height:24, borderRadius:999, border:'none', cursor:'pointer', flexShrink:0,
      background: on ? VM.forest : VM.paperDeep, position:'relative', transition:'background .16s' }}>
      <span style={{ position:'absolute', top:2, left: on?20:2, width:20, height:20, borderRadius:999,
        background:VM.paper, transition:'left .16s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }}></span>
    </button>
  );
  const fieldErr = (msg) => msg ? <Mono size={10} color={VM.downInk} style={{ display:'block', marginTop:4 }}><i className="ti ti-alert-circle" style={{fontSize:11,marginRight:3}}></i>{msg}</Mono> : null;
  const fieldLabel = (lbl) => <Mono size={9} color={VM.ink3} style={{ display:'block', marginBottom:5, letterSpacing:'0.06em', textTransform:'uppercase' }}>{lbl}</Mono>;

  return (
    <React.Fragment>

      {/* ── Change password ── */}
      <StCard title="Change password">
        <label style={{ display:'block', padding:'11px 0', borderBottom:`1px solid ${VM.borderHair}` }}>
          {fieldLabel('Current password')}
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <input type={showCur?'text':'password'} value={cur} onChange={e=>{setCur(e.target.value);setErrors(x=>({...x,cur:null}));}}
              placeholder="••••••••" style={{ flex:1, border:'none', outline:'none', background:'transparent', fontFamily:VM.serif, fontSize:16, color:VM.ink }} />
            {eyeBtn(showCur, ()=>setShowCur(x=>!x))}
          </div>
          {fieldErr(errors.cur)}
        </label>
        <label style={{ display:'block', padding:'11px 0', borderBottom:`1px solid ${VM.borderHair}` }}>
          {fieldLabel('New password')}
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <input type={showNew?'text':'password'} value={newPw} onChange={e=>{setNewPw(e.target.value);setErrors(x=>({...x,newPw:null}));}}
              placeholder="Min. 8 characters" style={{ flex:1, border:'none', outline:'none', background:'transparent', fontFamily:VM.serif, fontSize:16, color:VM.ink }} />
            {eyeBtn(showNew, ()=>setShowNew(x=>!x))}
          </div>
          {newPw && (
            <div style={{ marginTop:8 }}>
              <div style={{ display:'flex', gap:3, marginBottom:4 }}>
                {[1,2,3,4,5].map(i=><div key={i} style={{ flex:1, height:3, borderRadius:2, background:i<=strength?SW_COLOR[strength]:VM.borderSoft, transition:'background .2s' }} />)}
              </div>
              {SW_LABEL[strength] && <Mono size={9.5} color={SW_COLOR[strength]}>{SW_LABEL[strength]}</Mono>}
            </div>
          )}
          {fieldErr(errors.newPw)}
        </label>
        <label style={{ display:'block', padding:'11px 0' }}>
          {fieldLabel('Confirm new password')}
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <input type={showConf?'text':'password'} value={conf} onChange={e=>{setConf(e.target.value);setErrors(x=>({...x,conf:null}));}}
              placeholder="••••••••" style={{ flex:1, border:'none', outline:'none', background:'transparent', fontFamily:VM.serif, fontSize:16, color:VM.ink }} />
            {eyeBtn(showConf, ()=>setShowConf(x=>!x))}
          </div>
          {fieldErr(errors.conf)}
        </label>
      </StCard>
      {pwSaved
        ? <div style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'10px 16px', background:VM.tealTint, border:`1px solid ${VM.up}`, borderRadius:10, fontFamily:VM.serif, fontSize:14, color:VM.upInk, marginBottom:16 }}>
            <i className="ti ti-circle-check-filled" style={{fontSize:16}}></i>Password updated
          </div>
        : <StSave onClick={savePw} />
      }
      <Mono size={10} color={VM.faint} style={{ display:'block', marginTop:6, marginBottom:18 }}>Mock default: "password"</Mono>

      {/* ── Two-factor authentication ── */}
      <StCard title="Two-factor authentication">
        <div style={{ padding:'13px 0', borderBottom:`1px solid ${VM.borderHair}` }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:VM.serif, fontSize:15 }}>Authenticator app</div>
              <Mono size={10} color={VM.ink3} style={{ display:'block', marginTop:1 }}>
                {authApp ? <span style={{color:VM.upInk}}><i className="ti ti-circle-check-filled" style={{fontSize:11,marginRight:3}}></i>Enabled</span> : 'Require a code at sign-in'}
              </Mono>
            </div>
            {toggle(authApp, toggleAuthApp)}
          </div>
          {showQR && (
            <div style={{ marginTop:14, padding:16, background:VM.paperWarm, border:`1px solid ${VM.borderSoft}`, borderRadius:12 }}>
              <Mono size={10} color={VM.ink3} style={{ display:'block', marginBottom:12 }}>Scan with Google Authenticator, Authy, or 1Password</Mono>
              <div style={{ display:'inline-block', background:'#fff', padding:10, borderRadius:8, marginBottom:12 }}>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(17, 5px)', gap:0 }}>
                  {QR_GRID.flat().map((cell,i)=><div key={i} style={{ width:5, height:5, background:cell?'#000':'#fff' }} />)}
                </div>
              </div>
              <Mono size={10} color={VM.ink3} style={{ display:'block', marginBottom:10, wordBreak:'break-all' }}>Manual key: JBSWY3DPEHPK3PXP (mock)</Mono>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <input value={verifyCode} onChange={e=>setVerifyCode(e.target.value.replace(/\D/g,'').slice(0,6))}
                  placeholder="6-digit code" maxLength={6}
                  style={{ flex:1, border:`1px solid ${VM.border}`, borderRadius:8, padding:'8px 12px', fontFamily:VM.mono, fontSize:18, letterSpacing:'0.25em', textAlign:'center', outline:'none', background:VM.paper }} />
                <Btn solid onClick={confirmQR} style={{ opacity:verifyCode.length<6?0.5:1 }}>Verify</Btn>
                <Btn onClick={()=>{setShowQR(false);setVerifyCode('');}}>Cancel</Btn>
              </div>
            </div>
          )}
        </div>
        <div style={{ padding:'13px 0' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:VM.serif, fontSize:15 }}>SMS backup</div>
              <Mono size={10} color={VM.ink3} style={{ display:'block', marginTop:1 }}>
                {smsBak ? <span style={{color:VM.upInk}}><i className="ti ti-circle-check-filled" style={{fontSize:11,marginRight:3}}></i>{phone}</span> : 'Text a code to your phone'}
              </Mono>
            </div>
            {toggle(smsBak, toggleSms)}
          </div>
          {showSmsIn && (
            <div style={{ marginTop:14, padding:16, background:VM.paperWarm, border:`1px solid ${VM.borderSoft}`, borderRadius:12 }}>
              <Mono size={10} color={VM.ink3} style={{ display:'block', marginBottom:8 }}>Phone number (include country code)</Mono>
              <div style={{ display:'flex', gap:8 }}>
                <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+44 7700 900000" type="tel"
                  style={{ flex:1, border:`1px solid ${VM.border}`, borderRadius:8, padding:'9px 12px', fontFamily:VM.serif, fontSize:15, outline:'none', background:VM.paper }} />
                <Btn solid onClick={confirmSms} style={{ opacity:phone.length<7?0.5:1 }}>Save</Btn>
                <Btn onClick={()=>setShowSmsIn(false)}>Cancel</Btn>
              </div>
            </div>
          )}
        </div>
      </StCard>

      {/* ── Active sessions ── */}
      <StCard title="Active sessions">
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'13px 0', borderBottom: otherSessions.length ? `1px solid ${VM.borderHair}` : 'none' }}>
          <i className="ti ti-device-laptop" style={{ fontSize:16, color:VM.teal, flexShrink:0 }}></i>
          <span style={{ flex:1, fontFamily:VM.serif, fontSize:15 }}>{currentDevice}</span>
          <Mono size={11} color={VM.upInk}>now</Mono>
        </div>
        {otherSessions.length === 0
          ? <Mono size={11} color={VM.ink3} style={{ display:'block', padding:'13px 0' }}>No other active sessions.</Mono>
          : otherSessions.map((s,i) => <SessionRow key={s.id||i} s={s} last={i===otherSessions.length-1}
              onSignOut={()=>{
                const next = otherSessions.filter((_,j)=>j!==i);
                setOtherSessions(next);
                localStorage.setItem('vm_other_sessions', JSON.stringify(next));
                showToast(`Signed out of ${s.label}.`);
              }} />)
        }
      </StCard>
      {otherSessions.length > 0 && (
        <Btn onClick={signOutEverywhere} style={{ color:VM.downInk, borderColor:VM.downInk }}>
          <i className="ti ti-logout" style={{fontSize:15}}></i>Sign out everywhere else
        </Btn>
      )}

    </React.Fragment>
  );
}

const LEGAL_ARTICLES = {
  'Terms of service': {
    icon: 'file-text',
    body: [
      { h: 'Acceptance', p: 'By accessing Veridian Markets you agree to these terms. If you do not agree, please do not use the platform. These terms govern your use of the website, app, and all associated services.' },
      { h: 'Use of the platform', p: 'Veridian Markets is provided for informational and educational purposes only. Nothing on this platform constitutes financial advice, investment advice, or a recommendation to buy or sell any security.' },
      { h: 'Account responsibility', p: 'You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account. Notify us immediately at support@veridianmarkets.ai if you suspect unauthorised access.' },
      { h: 'Intellectual property', p: 'All content on Veridian Markets — including editorial text, data visualisations, and the Veridian brand — is owned by Veridian Markets Ltd and may not be reproduced without written permission.' },
      { h: 'Termination', p: 'We reserve the right to suspend or terminate accounts that violate these terms, engage in abusive behaviour, or attempt to scrape or automate access to the platform.' },
    ],
  },
  'Privacy policy': {
    icon: 'shield-lock',
    body: [
      { h: 'What we collect', p: 'We collect your email address, name, and usage data (pages visited, searches made, companies viewed). If you connect a broker, we store read-only portfolio data. We never collect payment card details directly — payments go through Stripe.' },
      { h: 'How we use it', p: 'Your data is used to personalise your experience, deliver relevant history analogues, send account notifications, and improve the platform. We do not sell your data to third parties.' },
      { h: 'Data storage', p: 'Data is stored on AWS infrastructure in the EU (Ireland) region. We apply encryption at rest and in transit. Access is restricted to authorised personnel only.' },
      { h: 'Your rights', p: 'You have the right to access, correct, or delete your personal data at any time. To exercise these rights, visit Settings → Your activity or email privacy@veridianmarkets.ai. We will respond within 30 days.' },
      { h: 'Cookies', p: 'We use essential cookies for authentication and session management, and optional analytics cookies to understand how the platform is used. You can manage cookie preferences in Settings → Data & permissions.' },
    ],
  },
  'Cookie policy': {
    icon: 'cookie',
    body: [
      { h: 'What are cookies', p: 'Cookies are small text files stored on your device when you visit a website. They help us keep you signed in, remember your preferences, and understand how you use Veridian.' },
      { h: 'Essential cookies', p: 'These are required for the platform to function. They manage your login session and security tokens. You cannot opt out of essential cookies without also opting out of the platform.' },
      { h: 'Analytics cookies', p: 'We use privacy-focused analytics to count page visits and understand which features are used most. These cookies contain no personally identifiable information and are aggregated before being reviewed.' },
      { h: 'Managing cookies', p: 'You can disable non-essential cookies at any time in Settings → Data & permissions. You can also clear cookies via your browser settings, though this will sign you out.' },
    ],
  },
  'Risk disclosure': {
    icon: 'alert-triangle',
    body: [
      { h: 'Not financial advice', p: 'All content on Veridian Markets — including historical analogues, market data, company profiles, and editorial commentary — is for informational purposes only. It does not constitute financial advice.' },
      { h: 'Past performance', p: 'Historical patterns and analogues are provided to offer context, not to predict future outcomes. Past market behaviour does not guarantee future results. Markets can and do behave differently from historical precedents.' },
      { h: 'Investment risk', p: 'Investing in financial instruments carries risk, including the possible loss of principal. You should consider your financial situation, investment objectives, and risk tolerance before making any investment decision.' },
      { h: 'Seek professional advice', p: 'Nothing on this platform replaces the advice of a qualified financial adviser. If you are unsure about an investment decision, consult a regulated financial professional in your jurisdiction.' },
    ],
  },
};

function LegalSection() {
  const [open, setOpen] = useStateSettings(null);
  return (
    <React.Fragment>
      <StCard title="Terms & policies">
        {Object.keys(LEGAL_ARTICLES).map((h, i, a) => (
          <StLink key={h} label={h} onClick={() => setOpen(h)} last={i === a.length - 1} />
        ))}
      </StCard>
      {open && <HelpModal article={open} onClose={() => setOpen(null)} articles={LEGAL_ARTICLES} />}
    </React.Fragment>
  );
}

const CHANGELOG = [
  {
    version: '0.9', date: 'Jun 2025', tag: 'Latest',
    changes: [
      'Settings — interactive Password & Security with 2FA and session management',
      'Settings — Connected accounts with broker connect / disconnect flow',
      'Settings — Light and dark theme switcher',
      'Settings — Activity clear with 30-day restore window',
      'My Business — dependency map builder',
      'Personal / Business account rail switcher',
      'Financials — CSV & Excel export popup',
      'Calendar — event education cards',
    ],
  },
  {
    version: '0.8', date: 'May 2025', tag: null,
    changes: [
      'Supply chain network live demo',
      'Company dashboard — Financials tab with multi-period tables',
      'Screener — filter by sector, market cap, region',
      'News feed with editorial tagging',
    ],
  },
  {
    version: '0.7', date: 'Apr 2025', tag: null,
    changes: [
      'History tab — analogue matching engine (prototype)',
      'Learn section — course cards and progress tracking',
      'Calendar — earnings and macro event feed',
      'Index strip — draggable ticker marquee',
    ],
  },
  {
    version: '0.6', date: 'Mar 2025', tag: null,
    changes: [
      'My Account — portfolio overview with broker mock data',
      'AI Assistant bubble — placeholder for Claude integration',
      'Sign-in with SHA-256 hashed credentials',
      'Mobile hamburger menu and responsive rail',
    ],
  },
];

function AboutSection() {
  const [showChangelog, setShowChangelog] = useStateSettings(false);
  return (
    <React.Fragment>
      <StCard>
        <StLink label="Version" value="0.9 (prototype)" onClick={() => setShowChangelog(true)} last />
      </StCard>
      <StNote>Veridian Markets — history-led finance. A research and learning platform that reads today's markets through the lens of the past.</StNote>
      {showChangelog && ReactDOM.createPortal(
        <div onClick={() => setShowChangelog(false)} style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(31,29,26,0.42)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px 16px' }}>
          <div onClick={e => e.stopPropagation()} style={{ background:VM.paper, borderRadius:14, maxWidth:520, width:'100%', maxHeight:'82vh', overflowY:'auto', boxShadow:'0 24px 64px rgba(31,29,26,0.28)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 20px 14px', borderBottom:`1px solid ${VM.borderSoft}`, position:'sticky', top:0, background:VM.paper, zIndex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:36, height:36, borderRadius:9, background:VM.tealTint, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <i className="ti ti-notes" style={{ fontSize:18, color:VM.tealInk }}></i>
                </div>
                <span style={{ fontFamily:VM.serif, fontWeight:700, fontSize:18, color:VM.ink }}>Recent updates</span>
              </div>
              <button onClick={() => setShowChangelog(false)} style={{ width:32, height:32, borderRadius:8, border:`1px solid ${VM.border}`, background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:VM.ink3 }}>
                <i className="ti ti-x" style={{ fontSize:15 }}></i>
              </button>
            </div>
            <div style={{ padding:'4px 0 20px' }}>
              {CHANGELOG.map((release, ri) => (
                <div key={release.version} style={{ padding:'16px 20px', borderBottom: ri < CHANGELOG.length - 1 ? `1px solid ${VM.borderHair}` : 'none' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                    <span style={{ fontFamily:VM.mono, fontWeight:700, fontSize:13, color:VM.ink }}>v{release.version}</span>
                    {release.tag && (
                      <span style={{ fontFamily:VM.mono, fontSize:9.5, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:VM.upInk, background:VM.tealTint, border:`1px solid ${VM.up}`, borderRadius:5, padding:'2px 7px' }}>{release.tag}</span>
                    )}
                    <span style={{ fontFamily:VM.mono, fontSize:11, color:VM.ink3, marginLeft:'auto' }}>{release.date}</span>
                  </div>
                  <ul style={{ margin:0, padding:'0 0 0 16px', display:'flex', flexDirection:'column', gap:5 }}>
                    {release.changes.map((c, ci) => (
                      <li key={ci} style={{ fontFamily:VM.serif, fontSize:13.5, color:VM.ink2, lineHeight:1.55 }}>{c}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </React.Fragment>
  );
}

function HelpSection({ showToast }) {
  const [open, setOpen] = useStateSettings(null);
  return (
    <React.Fragment>
      <StCard title="Help centre">
        {Object.keys(HELP_ARTICLES).map((h, i, a) => (
          <StLink key={h} label={h} onClick={() => setOpen(h)} last={i === a.length - 1} />
        ))}
      </StCard>
      {open && <HelpModal article={open} onClose={() => setOpen(null)} />}
    </React.Fragment>
  );
}

const MOCK_SEARCHES  = ['oil prices', 'AAPL supply chain', 'interest rates', 'NVDA'];
const MOCK_VIEWED    = VM_COMPANIES.slice(0, 3);

function ActivitySection({ go, showToast }) {
  const [confirming, setConfirming] = useStateSettings(false);
  const [cleared, setCleared]       = useStateSettings(false);
  const [searches, setSearches]     = useStateSettings(MOCK_SEARCHES);
  const [viewed, setViewed]         = useStateSettings(MOCK_VIEWED);

  const doClear = () => {
    setSearches([]); setViewed([]);
    setCleared(true); setConfirming(false);
  };
  const doRestore = () => {
    setSearches(MOCK_SEARCHES); setViewed(MOCK_VIEWED);
    setCleared(false);
    showToast('Activity restored.');
  };

  return (
    <React.Fragment>
      {!cleared ? (
        <React.Fragment>
          <StCard title="Recent searches">
            {searches.length === 0
              ? <Mono size={11} color={VM.ink3} style={{ display:'block', padding:'13px 0' }}>No recent searches.</Mono>
              : searches.map((s,i,a) => <StLink key={s} label={s} value="↗" onClick={()=>go('history')} last={i===a.length-1} />)
            }
          </StCard>
          <StCard title="Recently viewed">
            {viewed.length === 0
              ? <Mono size={11} color={VM.ink3} style={{ display:'block', padding:'13px 0' }}>No recently viewed companies.</Mono>
              : viewed.map((c,i,a) => <StLink key={c.ticker} label={c.name} onClick={()=>go('dashboard',c)} last={i===a.length-1} />)
            }
          </StCard>
          {!confirming
            ? <Btn onClick={()=>setConfirming(true)}><i className="ti ti-eraser" style={{fontSize:15}}></i>Clear activity</Btn>
            : (
              <div style={{ display:'flex', flexDirection:'column', gap:10, padding:'16px 18px', background:VM.paperWarm,
                border:`1px solid ${VM.borderSoft}`, borderRadius:12 }}>
                <div style={{ fontFamily:VM.serif, fontSize:15, color:VM.ink, fontWeight:600 }}>Clear all activity?</div>
                <Mono size={11} color={VM.ink3} style={{ display:'block' }}>
                  Your searches and recently viewed companies will be removed from this device.
                  Your data is kept on our servers for <strong style={{color:VM.ink2}}>30 days</strong> before permanent deletion.
                </Mono>
                <div style={{ display:'flex', gap:8, marginTop:2 }}>
                  <button onClick={doClear}
                    style={{ fontFamily:VM.serif, fontSize:13, padding:'7px 16px', borderRadius:999,
                      border:`1px solid ${VM.downInk}`, background:VM.downInk, color:'#fff', cursor:'pointer' }}>
                    <i className="ti ti-eraser" style={{fontSize:13,marginRight:5}}></i>Yes, clear
                  </button>
                  <button onClick={()=>setConfirming(false)}
                    style={{ fontFamily:VM.serif, fontSize:13, padding:'7px 16px', borderRadius:999,
                      border:`1px solid ${VM.border}`, background:'transparent', color:VM.ink2, cursor:'pointer' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )
          }
        </React.Fragment>
      ) : (
        <React.Fragment>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10, padding:'40px 0 32px', textAlign:'center' }}>
            <i className="ti ti-circle-check-filled" style={{ fontSize:32, color:VM.up }}></i>
            <div style={{ fontFamily:VM.serif, fontWeight:700, fontSize:17, color:VM.ink }}>Activity cleared</div>
            <Mono size={11} color={VM.ink3} style={{ display:'block', maxWidth:320 }}>
              Your data will be permanently deleted after 30 days.
            </Mono>
          </div>
          <Btn onClick={doRestore}><i className="ti ti-arrow-back-up" style={{fontSize:15}}></i>Restore activity</Btn>
        </React.Fragment>
      )}
    </React.Fragment>
  );
}

// ── per-section content ───────────────────────────────────────────────────────
function renderSection(id, ctx) {
  const { go, u, showToast, isMobile, theme, onThemeChange } = ctx;
  switch (id) {
    case 'profile': return (
      <React.Fragment>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <span style={{ width: 64, height: 64, borderRadius: 16, background: VM.forest, color: VM.paperWarm, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: VM.serif, fontWeight: 700, fontSize: 24 }}>{(u.name || '?').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()}</span>
          <Btn onClick={() => showToast('Photo upload (mock).')}><i className="ti ti-camera" style={{ fontSize: 15 }}></i>Change photo</Btn>
        </div>
        <StCard>
          <StField label="Full name" value={u.name} />
          <StField label="Email" value={u.email} type="email" />
          <StField label="Username" value={(u.email || 'you').split('@')[0]} />
        </StCard>
        <StSave onClick={() => showToast('Profile saved (mock).')} />
      </React.Fragment>
    );
    case 'security': return <StSecuritySection u={u} showToast={showToast} />;
    case 'subscription': return (
      <React.Fragment>
        <div style={{ background: `linear-gradient(110deg, ${VM.forest}, ${VM.teal})`, color: VM.paperWarm, borderRadius: 16, padding: '20px 22px', marginBottom: 16 }}>
          <Mono size={10} color="rgba(255,255,255,0.7)" style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>Current plan</Mono>
          <div style={{ fontFamily: VM.serif, fontWeight: 700, fontSize: 26, margin: '4px 0 2px' }}>{u.tier || 'Free'}</div>
          <div style={{ fontFamily: VM.serif, fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>{u.tier === 'Business' ? 'Everything, for teams.' : 'Upgrade for live data, alerts and more.'}</div>
        </div>
        <Label style={{ display: 'block', marginBottom: 8 }}>Plans</Label>
        {[{ p: 'Free', price: '£0', d: 'History-led research, delayed data' }, { p: 'Plus', price: '£9/mo', d: 'Live data, watchlists, alerts' }, { p: 'Pro', price: '£19/mo', d: 'Analogue engine, exports, priority' }, { p: 'Business', price: 'Contact', d: 'Teams, seats, admin & SSO' }].map((pl, i) => (
          <div key={pl.p} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', background: VM.paper, border: `1px solid ${pl.p === (u.tier || 'Free') ? VM.forest : VM.borderSoft}`, borderRadius: 12, marginBottom: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}><span style={{ fontFamily: VM.serif, fontWeight: 700, fontSize: 16 }}>{pl.p}</span><div><Mono size={10} color={VM.ink3}>{pl.d}</Mono></div></div>
            <Mono size={13} weight={700}>{pl.price}</Mono>
            {pl.p === (u.tier || 'Free') ? <span style={{ fontFamily: VM.mono, fontSize: 9, color: VM.tealInk }}>CURRENT</span> : <Btn onClick={() => showToast('Checkout (mock) — Stripe later.')} style={{ fontSize: 13, padding: '6px 14px' }}>Choose</Btn>}
          </div>
        ))}
        <StCard title="Payment method" style={{ marginTop: 8 }}>
          <StLink label="•••• •••• •••• 4242 · Visa" value="Edit" onClick={() => showToast('Manage card (mock).')} last />
        </StCard>
      </React.Fragment>
    );
    case 'connected': return <ConnectedAccountsSection showToast={showToast} />;
    case 'notifications': return (
      <React.Fragment>
        <StCard title="Alerts">
          <StToggle label="Price alerts" desc="When a watched company moves sharply" on />
          <StToggle label="Analogue alerts" desc="New historical pattern matches" on />
          <StToggle label="Supply-chain events" desc="Disruptions affecting your holdings" last />
        </StCard>
        <StCard title="Updates">
          <StToggle label="Course updates" desc="New lessons in your enrolled courses" on />
          <StToggle label="Product news" />
          <StToggle label="Weekly digest" desc="A Sunday market recap" on last />
        </StCard>
        <StCard title="Channels">
          <StToggle label="Email" on />
          <StToggle label="Push" on />
          <StToggle label="SMS" last />
        </StCard>
      </React.Fragment>
    );
    case 'appearance': return (
      <React.Fragment>
        <StCard title="Theme">
          {[
            { id:'light', label:'Light', icon:'sun',      desc:'Warm paper — the editorial default' },
            { id:'dark',  label:'Dark',  icon:'moon',     desc:'Dark canvas — easier on the eyes at night' },
          ].map((t, i, a) => {
            const active = (theme || 'light') === t.id;
            return (
              <div key={t.id} onClick={() => onThemeChange && onThemeChange(t.id)}
                style={{ display:'flex', alignItems:'center', gap:13, padding:'13px 0',
                  borderBottom: i < a.length-1 ? `1px solid ${VM.borderHair}` : 'none', cursor:'pointer' }}>
                <span style={{ width:36, height:36, borderRadius:10, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
                  background: active ? VM.forest : VM.paperDeep, color: active ? VM.paperWarm : VM.ink3, transition:'all .15s' }}>
                  <i className={'ti ti-'+t.icon} style={{ fontSize:17 }}></i>
                </span>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:VM.serif, fontSize:15.5, color:VM.ink, fontWeight: active?600:400 }}>{t.label}</div>
                  <Mono size={10} color={VM.ink3} style={{ display:'block', marginTop:1 }}>{t.desc}</Mono>
                </div>
                {active && <i className="ti ti-circle-check-filled" style={{ fontSize:18, color:VM.upInk }}></i>}
              </div>
            );
          })}
        </StCard>
        <StCard title="Display">
          <StToggle label="Compact density" desc="Tighter spacing in tables and lists" />
          <StToggle label="Reduce motion" desc="Fewer animations" last />
        </StCard>
      </React.Fragment>
    );
    case 'saved': return (
      <React.Fragment>
        <StNote>Companies and stories you've saved for later.</StNote>
        <StCard>
          {VM_COMPANIES.slice(0, 4).map((c, i, a) => <StLink key={c.ticker} label={`${c.ticker} · ${c.name}`} value="View" onClick={() => go('dashboard', c)} last={i === a.length - 1} />)}
        </StCard>
      </React.Fragment>
    );
    case 'activity': return <ActivitySection go={go} showToast={showToast} />;
    case 'learning': return (
      <React.Fragment>
        <StNote>Pick up where you left off.</StNote>
        <StCard>
          <div style={{ padding: '12px 0', borderBottom: `1px solid ${VM.borderHair}` }}>
            <div style={{ fontFamily: VM.serif, fontSize: 15, marginBottom: 8 }}>Reading a supply chain map · 62%</div>
            <ProgressBar v={62} />
          </div>
          <StLink label="Browse all courses" onClick={() => go('learn')} last />
        </StCard>
      </React.Fragment>
    );
    case 'permissions': return (
      <StCard title="Data & permissions">
        <StToggle label="Personalised recommendations" desc="Use my activity to tailor content" on />
        <StToggle label="Usage analytics" desc="Share anonymous usage to improve the app" on />
        <StToggle label="Marketing emails" last />
      </StCard>
    );
    case 'privacy': return (
      <StCard title="Account privacy">
        <StToggle label="Private profile" desc="Only you can see your activity" on />
        <StToggle label="Show online status" />
        <StToggle label="Searchable by email" on last />
      </StCard>
    );
    case 'help': return <HelpSection showToast={showToast} />;
    case 'legal': return <LegalSection />;
    case 'about': return <AboutSection />;
    default: return <StNote>Coming soon.</StNote>;
  }
}

Object.assign(window, { AccountSettings });
