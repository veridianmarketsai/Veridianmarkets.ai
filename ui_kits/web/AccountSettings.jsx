// Veridian Markets — Account settings.
// A grouped settings list (Instagram "Settings and activity" pattern) reimagined
// in the VM editorial style: a profile summary, sectioned rows with icon chips +
// chevrons, each row drilling into its own sub-page. Sub-navigation is internal
// state (one /settings route); a back arrow returns to the list. Mock/scaffold.
const { useState: useStateSettings } = React;

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
    { id: 'blocked',     icon: 'ban',         label: 'Blocked' },
    { id: 'download',    icon: 'download',    label: 'Download your data' },
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

function AccountSettings({ go, user, onSignOut, isMobile }) {
  const [section, setSection] = useStateSettings(null);   // null = list; otherwise a row id
  const [toast, setToast] = useStateSettings('');
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 2800); };
  const u = user || { name: 'Guest', email: 'not signed in', tier: 'Free' };

  const onRow = (item) => {
    if (item.id === 'logout') { onSignOut && onSignOut(); return; }
    if (item.id === 'delete') { showToast('Account deletion (mock) — would confirm first.'); return; }
    setSection(item.id);
  };

  return (
    <div style={{ padding: isMobile ? '16px 14px 64px' : '26px 32px 72px', maxWidth: 720, margin: '0 auto' }}>
      {section
        ? <StSubPage title={SETTINGS_TITLES[section]} onBack={() => setSection(null)}>{renderSection(section, { go, u, showToast })}</StSubPage>
        : <StList u={u} onRow={onRow} go={go} />}
      {toast && <StToast text={toast} />}
    </div>
  );
}

// ── the main list ───────────────────────────────────────────────────────────
function StList({ u, onRow, go }) {
  const initials = (u.name || '?').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
  return (
    <React.Fragment>
      <Kicker>Account</Kicker>
      <h1 style={{ fontFamily: VM.serif, fontWeight: 700, fontSize: 30, lineHeight: 1.05, margin: '8px 0 18px' }}>Settings.</h1>

      {/* profile summary → personal details */}
      <div onClick={() => onRow({ id: 'profile' })} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', cursor: 'pointer',
        background: `linear-gradient(100deg, ${VM.tealTint} 0%, ${VM.paper} 75%)`, border: `1px solid ${VM.borderSoft}`, borderRadius: 14 }}>
        <span style={{ width: 52, height: 52, borderRadius: 14, flexShrink: 0, background: VM.forest, color: VM.paperWarm, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: VM.serif, fontWeight: 700, fontSize: 20 }}>{initials}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: VM.serif, fontWeight: 700, fontSize: 18 }}>{u.name}</div>
          <Mono size={11} color={VM.ink3}>{u.email}</Mono>
        </div>
        <span style={{ fontFamily: VM.mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: VM.tealInk, background: VM.paper, border: `1px solid ${VM.tealTint2}`, borderRadius: 6, padding: '3px 8px' }}>{u.tier || 'Free'}</span>
        <i className="ti ti-chevron-right" style={{ fontSize: 18, color: VM.ink3 }}></i>
      </div>

      {SETTINGS_GROUPS.map((g, gi) => (
        <div key={gi} style={{ marginTop: 22 }}>
          {g.head && <Label style={{ display: 'block', marginBottom: 9, paddingLeft: 4 }}>{g.head}</Label>}
          <div style={{ background: VM.paper, border: `1px solid ${VM.borderSoft}`, borderRadius: 14, overflow: 'hidden' }}>
            {g.items.map((it, i) => <StRow key={it.id} item={it} last={i === g.items.length - 1} onClick={() => onRow(it)} />)}
          </div>
        </div>
      ))}
      <Mono size={10} color={VM.faint} style={{ display: 'block', textAlign: 'center', marginTop: 26 }}>Veridian Markets · v0.9 (prototype)</Mono>
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
function StSubPage({ title, onBack, children }) {
  return (
    <React.Fragment>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 18 }}>
        <button onClick={onBack} title="Back" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px 6px 8px', borderRadius: 999,
          border: `1px solid ${VM.border}`, background: VM.paper, color: VM.ink2, cursor: 'pointer', fontFamily: VM.serif, fontSize: 13.5 }}>
          <i className="ti ti-chevron-left" style={{ fontSize: 16 }}></i>Settings
        </button>
      </div>
      <h1 style={{ fontFamily: VM.serif, fontWeight: 700, fontSize: 27, lineHeight: 1.06, margin: '0 0 18px' }}>{title}</h1>
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
function StToast({ text }) {
  return <div style={{ position: 'fixed', left: '50%', bottom: 28, transform: 'translateX(-50%)', zIndex: 90, display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 16px', borderRadius: 999, background: VM.forest, color: VM.paperWarm, fontFamily: VM.serif, fontSize: 14, boxShadow: '0 8px 24px rgba(31,29,26,0.22)' }}>
    <i className="ti ti-info-circle" style={{ fontSize: 16 }}></i>{text}</div>;
}

// ── per-section content ───────────────────────────────────────────────────────
function renderSection(id, ctx) {
  const { go, u, showToast } = ctx;
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
          <StField label="Bio" placeholder="A line about you" />
        </StCard>
        <StSave onClick={() => showToast('Profile saved (mock).')} />
      </React.Fragment>
    );
    case 'security': return (
      <React.Fragment>
        <StCard title="Change password">
          <StField label="Current password" type="password" placeholder="••••••••" />
          <StField label="New password" type="password" placeholder="••••••••" />
          <StField label="Confirm new password" type="password" placeholder="••••••••" />
        </StCard>
        <StCard title="Two-factor authentication">
          <StToggle label="Authenticator app" desc="Require a code at sign-in" />
          <StToggle label="SMS backup" desc="Text a code to your phone" last />
        </StCard>
        <StCard title="Active sessions">
          <StLink label="This device · Windows · Chrome" value="now" />
          <StLink label="iPhone · Veridian app" value="2d ago" last />
        </StCard>
        <Btn onClick={() => showToast('Signed out of other sessions (mock).')} style={{ color: VM.downInk, borderColor: VM.downInk }}><i className="ti ti-logout" style={{ fontSize: 15 }}></i>Sign out everywhere else</Btn>
      </React.Fragment>
    );
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
            <div style={{ flex: 1 }}><span style={{ fontFamily: VM.serif, fontWeight: 700, fontSize: 16 }}>{pl.p}</span><div><Mono size={10} color={VM.ink3}>{pl.d}</Mono></div></div>
            <Mono size={13} weight={700}>{pl.price}</Mono>
            {pl.p === (u.tier || 'Free') ? <span style={{ fontFamily: VM.mono, fontSize: 9, color: VM.tealInk }}>CURRENT</span> : <Btn onClick={() => showToast('Checkout (mock) — Stripe later.')} style={{ fontSize: 13, padding: '6px 14px' }}>Choose</Btn>}
          </div>
        ))}
        <StCard title="Payment method" style={{ marginTop: 8 }}>
          <StLink label="•••• •••• •••• 4242 · Visa" value="Edit" onClick={() => showToast('Manage card (mock).')} last />
        </StCard>
      </React.Fragment>
    );
    case 'connected': return (
      <React.Fragment>
        <StNote>Link a broker to import holdings, or a data source for live prices. Real connections arrive with the backend.</StNote>
        <StCard title="Brokers">
          {['Trading 212', 'Interactive Brokers', 'Coinbase'].map((b, i, a) => <StLink key={b} label={b} value={i === 0 ? 'Connected' : 'Connect'} onClick={() => showToast(b + ' (mock).')} last={i === a.length - 1} />)}
        </StCard>
        <StCard title="Data sources">
          <StLink label="Finnhub (market data)" value="Connect" onClick={() => showToast('Finnhub (mock).')} last />
        </StCard>
      </React.Fragment>
    );
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
          {['Light', 'Dark', 'System'].map((t, i, a) => <StLink key={t} label={t} value={t === 'Light' ? '✓' : ''} onClick={() => showToast(t + ' theme (mock).')} last={i === a.length - 1} />)}
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
    case 'activity': return (
      <React.Fragment>
        <StCard title="Recent searches">
          {['oil prices', 'AAPL supply chain', 'interest rates', 'NVDA'].map((s, i, a) => <StLink key={s} label={s} value="↗" onClick={() => go('history')} last={i === a.length - 1} />)}
        </StCard>
        <StCard title="Recently viewed">
          {VM_COMPANIES.slice(0, 3).map((c, i, a) => <StLink key={c.ticker} label={c.name} onClick={() => go('dashboard', c)} last={i === a.length - 1} />)}
        </StCard>
        <Btn onClick={() => showToast('Activity cleared (mock).')}><i className="ti ti-eraser" style={{ fontSize: 15 }}></i>Clear activity</Btn>
      </React.Fragment>
    );
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
    case 'privacy': return (
      <StCard title="Account privacy">
        <StToggle label="Private profile" desc="Only you can see your activity" on />
        <StToggle label="Show online status" />
        <StToggle label="Searchable by email" on last />
      </StCard>
    );
    case 'permissions': return (
      <StCard title="Data & permissions">
        <StToggle label="Personalised recommendations" desc="Use my activity to tailor content" on />
        <StToggle label="Usage analytics" desc="Share anonymous usage to improve the app" on />
        <StToggle label="Marketing emails" last />
      </StCard>
    );
    case 'blocked': return (
      <React.Fragment>
        <StNote>You haven't blocked anyone.</StNote>
        <div style={{ textAlign: 'center', padding: '30px 0', color: VM.ink3 }}>
          <i className="ti ti-ban" style={{ fontSize: 26 }}></i>
          <div style={{ fontFamily: VM.serif, fontSize: 14, marginTop: 8 }}>Blocked accounts will appear here.</div>
        </div>
      </React.Fragment>
    );
    case 'download': return (
      <React.Fragment>
        <StNote>Request a copy of your data — profile, watchlists, activity and settings. We'll email a download link when it's ready.</StNote>
        <Btn solid onClick={() => showToast('Data export requested (mock).')}><i className="ti ti-download" style={{ fontSize: 15 }}></i>Request download</Btn>
      </React.Fragment>
    );
    case 'help': return (
      <StCard title="Help centre">
        {['Getting started', 'Account & billing', 'Connecting a broker', 'Contact support'].map((h, i, a) => <StLink key={h} label={h} onClick={() => showToast('Help (mock).')} last={i === a.length - 1} />)}
      </StCard>
    );
    case 'legal': return (
      <StCard title="Terms & policies">
        {['Terms of service', 'Privacy policy', 'Cookie policy', 'Risk disclosure'].map((h, i, a) => <StLink key={h} label={h} onClick={() => showToast('Opens document (mock).')} last={i === a.length - 1} />)}
      </StCard>
    );
    case 'about': return (
      <React.Fragment>
        <StCard>
          <StLink label="Version" value="0.9 (prototype)" last />
        </StCard>
        <StNote>Veridian Markets — history-led finance. A research and learning platform that reads today's markets through the lens of the past.</StNote>
      </React.Fragment>
    );
    default: return <StNote>Coming soon.</StNote>;
  }
}

Object.assign(window, { AccountSettings });
