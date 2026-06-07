// Veridian Markets — Admin control panel (admin role only).
// Three tabs: Overview (user metrics dashboard), Users (the 100-strong temp DB),
// and Courses (add/remove Learn courses — writes through to the live Learn page
// via the course store in Learn.jsx). All data is temporary/mock — see
// admin_data.jsx (users) and the vm*Course store (courses). Backend wiring TBD.
const { useState: useStateAdmin } = React;

const A_PLAN_COLOR = { Free: VM.faint, Plus: VM.teal, Pro: VM.forest };
const A_STATUS = {
  active: { label: 'Active', fg: VM.upInk, bg: VM.tealTint, bd: VM.up },
  trial: { label: 'Trial', fg: VM.terra, bg: 'rgba(196,106,59,0.12)', bd: VM.terra },
  churned: { label: 'Churned', fg: VM.downInk, bg: 'rgba(163,45,45,0.10)', bd: VM.downInk },
};
const aMoney = (n) => '$' + Number(n).toLocaleString('en-US');
const aDate = (d) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const aRel = (d) => { const days = Math.round((VM_NOW - d) / 86400000); return days <= 0 ? 'today' : days === 1 ? '1d ago' : days < 30 ? days + 'd ago' : Math.round(days / 30) + 'mo ago'; };

function AdminPanel({ go, user, isMobile }) {
  const [tab, setTab] = useStateAdmin('overview');
  const [accessing, setAccessing] = useStateAdmin(null);   // simulated "access account" target
  const stats = React.useMemo(() => vmUserStats(), []);
  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'layout-dashboard' },
    { id: 'users', label: 'Users', icon: 'users' },
    { id: 'courses', label: 'Courses', icon: 'book' },
  ];
  return (
    <div style={{ padding: isMobile ? '16px 16px 80px' : '26px 32px 72px', maxWidth: 1180, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <Kicker>Control panel</Kicker>
            <span style={{ fontFamily: VM.mono, fontSize: 8.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: VM.paperWarm, background: VM.forest, borderRadius: 5, padding: '2px 7px' }}>Admin</span>
          </div>
          <h1 style={{ fontFamily: VM.serif, fontWeight: 700, fontSize: isMobile ? 26 : 32, lineHeight: 1.05, margin: '8px 0 0' }}>Admin.</h1>
          <div style={{ fontFamily: VM.serif, fontSize: 14, color: VM.ink3, marginTop: 4 }}>Signed in as <strong style={{ color: VM.ink2 }}>{user ? (user.name || user.email) : 'admin'}</strong> · temporary data</div>
        </div>
      </div>

      {/* impersonation banner */}
      {accessing && (
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderRadius: 10, background: 'rgba(196,106,59,0.12)', border: `1px solid ${VM.terra}` }}>
          <i className="ti ti-eye" style={{ fontSize: 17, color: VM.rustDeep }}></i>
          <span style={{ fontFamily: VM.serif, fontSize: 14.5, color: VM.ink }}>You are accessing <strong>{accessing.name}</strong>’s account <span style={{ color: VM.ink3 }}>· simulated</span></span>
          <button onClick={() => setAccessing(null)} style={{ marginLeft: 'auto', fontFamily: VM.mono, fontSize: 11, padding: '5px 13px', borderRadius: 999, border: `1px solid ${VM.terra}`, background: VM.paper, color: VM.rustDeep, cursor: 'pointer' }}>Exit ✕</button>
        </div>
      )}

      {/* tabs */}
      <div style={{ display: 'flex', gap: 6, marginTop: 20, borderBottom: `1px solid ${VM.borderSoft}` }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: VM.serif, fontSize: 15,
            padding: '9px 14px', cursor: 'pointer', background: 'transparent', border: 'none', color: tab === t.id ? VM.ink : VM.ink3,
            fontWeight: tab === t.id ? 700 : 400, borderBottom: `2px solid ${tab === t.id ? VM.forest : 'transparent'}`, marginBottom: -1 }}>
            <i className={'ti ti-' + t.icon} style={{ fontSize: 16 }}></i>{t.label}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 22 }}>
        {tab === 'overview' && <OverviewTab stats={stats} isMobile={isMobile} />}
        {tab === 'users' && <UsersTab onAccess={setAccessing} isMobile={isMobile} />}
        {tab === 'courses' && <CoursesTab go={go} isMobile={isMobile} />}
      </div>
    </div>
  );
}

// ── Overview ────────────────────────────────────────────────────────────────
function OverviewTab({ stats, isMobile }) {
  const courseCount = vmGetCourses().length;
  const kpis = [
    { label: 'Total users', value: stats.total, foot: `${stats.active} active` },
    { label: 'New this week', value: '+' + stats.newThisWeek, foot: `${stats.newThisMonth} this month`, tone: 'up' },
    { label: 'Paying', value: stats.paying, foot: `${(stats.paying / stats.total * 100).toFixed(0)}% of users` },
    { label: 'Est. MRR', value: aMoney(stats.mrr), foot: 'Plus + Pro' },
    { label: 'Churned', value: stats.churned, foot: `${(stats.churned / stats.total * 100).toFixed(0)}% of users`, tone: 'down' },
    { label: 'Courses', value: courseCount, foot: 'in the catalogue' },
  ];
  const planData = [
    { label: 'Free', value: stats.byPlan.Free, color: A_PLAN_COLOR.Free },
    { label: 'Plus', value: stats.byPlan.Plus, color: A_PLAN_COLOR.Plus },
    { label: 'Pro', value: stats.byPlan.Pro, color: A_PLAN_COLOR.Pro },
  ];
  const maxC = Math.max(...stats.topCountries.map(c => c.n), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        {kpis.map((k, i) => <AdminKpi key={i} {...k} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
        <AdminCard title="Signups · last 12 months"><AdminBars data={stats.months} /></AdminCard>
        <AdminCard title="Plan distribution">
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            <AdminDonut data={planData} center={stats.total} centerLabel="USERS" />
            <div style={{ flex: 1, minWidth: 130, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {planData.map(p => (
                <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: p.color }}></span>
                  <span style={{ flex: 1, fontFamily: VM.serif, fontSize: 14, color: VM.ink2 }}>{p.label}</span>
                  <Mono size={11} weight={600}>{p.value}</Mono>
                </div>
              ))}
            </div>
          </div>
        </AdminCard>
      </div>
      <AdminCard title="Top countries">
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
          {stats.topCountries.map(c => (
            <div key={c.c} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ flex: 1, fontFamily: VM.serif, fontSize: 14, color: VM.ink2 }}>{c.c}</span>
              <div style={{ flex: 1.2 }}><ProgressBar v={c.n / maxC * 100} /></div>
              <Mono size={11} color={VM.ink2} style={{ minWidth: 22, textAlign: 'right' }}>{c.n}</Mono>
            </div>
          ))}
        </div>
      </AdminCard>
    </div>
  );
}
function AdminKpi({ label, value, foot, tone }) {
  return (
    <div style={{ background: VM.paper, border: `1px solid ${VM.borderSoft}`, borderRadius: 12, padding: '13px 15px' }}>
      <Label>{label}</Label>
      <div style={{ fontFamily: VM.mono, fontWeight: 700, fontSize: 24, marginTop: 5, color: tone === 'up' ? VM.upInk : tone === 'down' ? VM.downInk : VM.ink }}>{value}</div>
      {foot && <div style={{ marginTop: 3 }}><Mono size={10} color={VM.ink3}>{foot}</Mono></div>}
    </div>
  );
}
function AdminCard({ title, children }) {
  return (
    <section style={{ background: VM.paper, border: `1px solid ${VM.borderSoft}`, borderRadius: 14, overflow: 'hidden' }}>
      <header style={{ padding: '12px 16px', borderBottom: `1px solid ${VM.borderHair}` }}>
        <span style={{ fontFamily: VM.mono, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: VM.ink3, fontWeight: 700 }}>{title}</span>
      </header>
      <div style={{ padding: '16px' }}>{children}</div>
    </section>
  );
}
function AdminBars({ data }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 150 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, height: '100%', justifyContent: 'flex-end' }}>
          <Mono size={9} color={VM.ink3}>{d.count}</Mono>
          <div title={`${d.label}: ${d.count}`} style={{ width: '100%', maxWidth: 30, height: `${(d.count / max) * 100}%`, minHeight: 3,
            background: i === data.length - 1 ? VM.forest : VM.tealTint2, borderRadius: '4px 4px 0 0' }}></div>
          <Mono size={8.5} color={VM.ink3}>{d.label}</Mono>
        </div>
      ))}
    </div>
  );
}
function AdminDonut({ data, size = 140, thickness = 19, center, centerLabel }) {
  const r = (size - thickness) / 2, c = 2 * Math.PI * r, total = data.reduce((s, d) => s + d.value, 0) || 1;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        {data.map((d, i) => {
          const len = (d.value / total) * c, off = -acc; acc += len;
          return <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={d.color} strokeWidth={thickness} strokeDasharray={`${len} ${c - len}`} strokeDashoffset={off} />;
        })}
      </g>
      <text x="50%" y="47%" textAnchor="middle" style={{ fontFamily: VM.mono, fontSize: 8.5, fill: VM.ink3, letterSpacing: '0.08em' }}>{centerLabel || ''}</text>
      <text x="50%" y="61%" textAnchor="middle" style={{ fontFamily: VM.mono, fontWeight: 700, fontSize: 19, fill: VM.ink }}>{center}</text>
    </svg>
  );
}

// ── Users ───────────────────────────────────────────────────────────────────
const A_USER_COLS = '1.7fr 0.6fr 0.8fr 1fr 0.9fr 0.7fr 34px';
function UsersTab({ onAccess, isMobile }) {
  const [q, setQ] = useStateAdmin('');
  const [status, setStatus] = useStateAdmin('all');
  const [shown, setShown] = useStateAdmin(40);
  const [detail, setDetail] = useStateAdmin(null);   // user shown in the detail modal
  const [toast, setToast] = useStateAdmin('');
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 3000); };
  const access = (u) => { setDetail(null); onAccess(u); };
  const term = q.trim().toLowerCase();
  const rows = VM_USERS.filter(u => {
    if (status !== 'all' && u.status !== status) return false;
    if (term && !(u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term) || u.country.toLowerCase().includes(term))) return false;
    return true;
  });
  const visible = rows.slice(0, shown);
  return (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 1, minWidth: 220, background: VM.paper, border: `1px solid ${VM.border}`, borderRadius: 10, padding: '9px 13px' }}>
          <i className="ti ti-search" style={{ fontSize: 15, color: VM.ink3 }}></i>
          <input value={q} onChange={e => { setQ(e.target.value); setShown(40); }} placeholder="Search name, email or country…"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: VM.serif, fontSize: 14, color: VM.ink }} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'active', 'trial', 'churned'].map(s => (
            <Pill key={s} active={status === s} onClick={() => { setStatus(s); setShown(40); }}>{s === 'all' ? 'All' : A_STATUS[s].label}</Pill>
          ))}
        </div>
      </div>
      <Mono size={10.5} color={VM.ink3} style={{ display: 'block', marginBottom: 8 }}>{rows.length} of {VM_USERS.length} users</Mono>
      <div style={{ background: VM.paper, border: `1px solid ${VM.borderSoft}`, borderRadius: 12, overflowX: 'auto' }}>
        <div style={{ minWidth: isMobile ? 640 : 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: A_USER_COLS, gap: 8, padding: '9px 16px', background: VM.paperWarm, borderBottom: `1px solid ${VM.borderSoft}`, borderRadius: '12px 12px 0 0' }}>
            {['User', 'Plan', 'Status', 'Country', 'Joined', 'Active', ''].map((h, i) => <Label key={i} style={{ textAlign: i === 1 || i === 2 ? 'center' : 'left' }}>{h}</Label>)}
          </div>
          {visible.map((u, i) => (
            <UserRow key={u.id} u={u} last={i === visible.length - 1} onView={setDetail} onAccess={access} onToast={showToast} />
          ))}
          {visible.length === 0 && <div style={{ padding: '24px 16px', textAlign: 'center', fontFamily: VM.serif, color: VM.ink3 }}>No users match.</div>}
        </div>
      </div>
      {rows.length > visible.length && (
        <div style={{ marginTop: 14, textAlign: 'center' }}>
          <Btn onClick={() => setShown(s => s + 40)}><i className="ti ti-chevron-down" style={{ fontSize: 15 }}></i>Show more</Btn>
        </div>
      )}
      {detail && <UserDetailModal u={detail} onClose={() => setDetail(null)} onAccess={access} onToast={showToast} />}
      {toast && <AdminToast text={toast} />}
    </div>
  );
}

// One user row + its ⋮ actions menu (rendered fixed-position so it isn't clipped).
function UserRow({ u, last, onView, onAccess, onToast }) {
  const [open, setOpen] = useStateAdmin(false);
  const [pos, setPos] = useStateAdmin({ top: 0, left: 0 });
  const btnRef = React.useRef(null);
  const openMenu = () => {
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 5, left: Math.max(8, r.right - 210) });
    setOpen(true);
  };
  const act = (fn) => { setOpen(false); fn(); };
  return (
    <React.Fragment>
      <div style={{ display: 'grid', gridTemplateColumns: A_USER_COLS, gap: 8, alignItems: 'center', padding: '10px 16px', borderBottom: last ? 'none' : `1px solid ${VM.borderHair}` }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: VM.serif, fontSize: 14, fontWeight: 600, color: VM.ink }}>{u.name}</div>
          <Mono size={10} color={VM.ink3} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{u.email}</Mono>
        </div>
        <div style={{ textAlign: 'center' }}><Mono size={10.5} weight={600} color={A_PLAN_COLOR[u.plan]}>{u.plan}</Mono></div>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontFamily: VM.mono, fontSize: 8.5, fontWeight: 700, letterSpacing: '0.04em', padding: '2px 7px', borderRadius: 5, color: A_STATUS[u.status].fg, background: A_STATUS[u.status].bg, border: `1px solid ${A_STATUS[u.status].bd}` }}>{A_STATUS[u.status].label}</span>
        </div>
        <Mono size={11} color={VM.ink2}>{u.country}</Mono>
        <Mono size={11} color={VM.ink3}>{aDate(u.joined)}</Mono>
        <Mono size={10.5} color={VM.ink3}>{aRel(u.lastActive)}</Mono>
        <button ref={btnRef} title="More" onClick={openMenu} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${open ? VM.border : 'transparent'}`, background: open ? VM.paperWarm : 'transparent', color: VM.ink2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, justifySelf: 'end' }}>
          <i className="ti ti-dots-vertical" style={{ fontSize: 16 }}></i>
        </button>
      </div>
      {open && (
        <React.Fragment>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 70 }}></div>
          <div style={{ position: 'fixed', top: pos.top, left: pos.left, width: 212, zIndex: 71, background: VM.paper, border: `1px solid ${VM.border}`, borderRadius: 10, boxShadow: '0 12px 30px rgba(31,29,26,0.18)', padding: 5 }}>
            <MenuItem icon="user-circle" label="View account details" onClick={() => act(() => onView(u))} />
            <MenuItem icon="chart-line" label="Personal profits" onClick={() => act(() => onView(u))} />
            <MenuItem icon="login-2" label="Access account" tint={VM.teal} onClick={() => act(() => onAccess(u))} />
            <div style={{ height: 1, background: VM.borderHair, margin: '5px 4px' }}></div>
            <MenuItem icon="mail" label="Email user" onClick={() => act(() => onToast('Opened email composer (mock).'))} />
            <MenuItem icon="key" label="Reset password" onClick={() => act(() => onToast('Password reset link sent (mock).'))} />
            <MenuItem icon="arrows-exchange" label="Change plan" onClick={() => act(() => onToast('Plan change (mock).'))} />
            <div style={{ height: 1, background: VM.borderHair, margin: '5px 4px' }}></div>
            <MenuItem icon="ban" label={u.status === 'churned' ? 'Reactivate user' : 'Suspend user'} danger onClick={() => act(() => onToast((u.status === 'churned' ? 'Reactivated' : 'Suspended') + ' ' + u.name + ' (mock).'))} />
            <MenuItem icon="trash" label="Delete user" danger onClick={() => act(() => onToast('Deleted ' + u.name + ' (mock).'))} />
          </div>
        </React.Fragment>
      )}
    </React.Fragment>
  );
}
function MenuItem({ icon, label, onClick, danger, tint }) {
  const [hover, setHover] = useStateAdmin(false);
  const color = danger ? VM.downInk : (tint || VM.ink2);
  return (
    <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 7, cursor: 'pointer',
        border: 'none', background: hover ? VM.paperWarm : 'transparent', color, fontFamily: VM.serif, fontSize: 13.5 }}>
      <i className={'ti ti-' + icon} style={{ fontSize: 15 }}></i>{label}
    </button>
  );
}
function AdminToast({ text }) {
  return (
    <div style={{ position: 'fixed', left: '50%', bottom: 28, transform: 'translateX(-50%)', zIndex: 90,
      display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 999, background: VM.forest, color: VM.paperWarm,
      fontFamily: VM.serif, fontSize: 14, boxShadow: '0 8px 24px rgba(31,29,26,0.22)' }}>
      <i className="ti ti-check" style={{ fontSize: 16 }}></i>{text}
    </div>
  );
}

// Full account details + personal profits + admin actions.
function UserDetailModal({ u, onClose, onAccess, onToast }) {
  const p = vmUserProfits(u);
  const initials = u.name.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
  const detail = [
    ['User ID', '#' + u.id], ['Country', u.country], ['Plan', u.plan], ['Status', A_STATUS[u.status].label],
    ['Joined', aDate(u.joined)], ['Last active', aRel(u.lastActive)], ['Courses enrolled', u.enrolled], ['Lessons completed', u.lessons],
  ];
  const profit = [
    { k: 'Portfolio value', v: aMoney(p.value), tone: null },
    { k: 'Total return', v: (p.profit >= 0 ? '+' : '') + aMoney(p.profit), tone: p.dir, sub: (p.profitPct >= 0 ? '+' : '') + p.profitPct.toFixed(1) + '%' },
    { k: 'Today', v: (p.dayChg >= 0 ? '+' : '') + aMoney(p.dayChg), tone: p.dayChg >= 0 ? 'up' : 'down', sub: (p.dayPct >= 0 ? '+' : '') + p.dayPct.toFixed(2) + '%' },
    { k: 'Cost basis', v: aMoney(p.cost), tone: null },
  ];
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(31,29,26,0.42)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 560, maxHeight: '88vh', overflowY: 'auto', background: VM.paper, border: `1px solid ${VM.border}`, borderRadius: 16, boxShadow: '0 24px 60px rgba(31,29,26,0.3)' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 22px', borderBottom: `1px solid ${VM.borderHair}` }}>
          <span style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, background: VM.forest, color: VM.paperWarm, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: VM.serif, fontWeight: 700, fontSize: 18 }}>{initials}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: VM.serif, fontWeight: 700, fontSize: 20 }}>{u.name}</div>
            <Mono size={11} color={VM.ink3}>{u.email}</Mono>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${VM.border}`, background: VM.paper, color: VM.ink2, cursor: 'pointer' }}><i className="ti ti-x" style={{ fontSize: 15 }}></i></button>
        </div>
        {/* details */}
        <div style={{ padding: '18px 22px' }}>
          <Label>Account details</Label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginTop: 10 }}>
            {detail.map(([k, v]) => (
              <div key={k}><Mono size={9.5} color={VM.ink3} style={{ letterSpacing: '0.04em', textTransform: 'uppercase' }}>{k}</Mono>
                <div style={{ fontFamily: VM.serif, fontSize: 15, color: VM.ink, marginTop: 2 }}>{v}</div></div>
            ))}
          </div>
          {/* profits */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${VM.borderHair}` }}>
            <Label>Personal profits</Label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginTop: 10 }}>
              {profit.map(b => (
                <div key={b.k}>
                  <Mono size={9.5} color={VM.ink3} style={{ letterSpacing: '0.04em', textTransform: 'uppercase' }}>{b.k}</Mono>
                  <div style={{ fontFamily: VM.mono, fontWeight: 700, fontSize: 18, marginTop: 3, color: b.tone === 'down' ? VM.downInk : b.tone === 'up' ? VM.upInk : VM.ink }}>{b.v}</div>
                  {b.sub && <div style={{ marginTop: 1 }}><Chg dir={b.tone}>{b.sub}</Chg></div>}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, width: '100%', overflowX: 'auto' }}><Sparkline dir={p.dir} w={520} h={34} /></div>
          </div>
        </div>
        {/* actions */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '14px 22px', borderTop: `1px solid ${VM.borderHair}`, background: VM.paperWarm, borderRadius: '0 0 16px 16px' }}>
          <Btn solid onClick={() => onAccess(u)}><i className="ti ti-login-2" style={{ fontSize: 15 }}></i>Access account</Btn>
          <Btn onClick={() => onToast('Password reset link sent (mock).')}><i className="ti ti-key" style={{ fontSize: 15 }}></i>Reset password</Btn>
          <Btn onClick={() => onToast('Plan change (mock).')}><i className="ti ti-arrows-exchange" style={{ fontSize: 15 }}></i>Change plan</Btn>
          <Btn onClick={() => onToast('Deleted ' + u.name + ' (mock).')} style={{ color: VM.downInk, borderColor: VM.downInk, marginLeft: 'auto' }}><i className="ti ti-trash" style={{ fontSize: 15 }}></i>Delete</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Courses ─────────────────────────────────────────────────────────────────
function CoursesTab({ go, isMobile }) {
  const [courses, setCourses] = useStateAdmin(() => vmGetCourses());
  const refresh = () => setCourses(vmGetCourses());
  const cats = LEARN_CATS.filter(c => c.id !== 'all');
  const tags = ['', 'New', 'Most read', 'Popular', 'Start here', 'Advanced', 'App tutorial'];
  const blank = { title: '', cat: cats[0].id, provider: 'Veridian Academy', level: LEARN_LEVELS[0], format: LEARN_FORMATS[0], length: '', tag: '' };
  const [form, setForm] = useStateAdmin(blank);
  const [done, setDone] = useStateAdmin('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    vmAddCourse({ ...form, length: form.length.trim() || '—', tag: form.tag || null });
    setForm(blank); refresh();
    setDone('“' + form.title.trim() + '” added — it’s live on the Learn page.');
    setTimeout(() => setDone(''), 4000);
  };
  const remove = (id) => { vmDeleteCourse(id); refresh(); };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 18 }}>
      <AdminCard title="Add a course">
        <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, alignItems: 'end' }}>
          <Field label="Title" full>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Options, From Scratch" style={inputStyle} />
          </Field>
          <Field label="Category"><select value={form.cat} onChange={e => set('cat', e.target.value)} style={inputStyle}>{cats.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select></Field>
          <Field label="Provider"><input value={form.provider} onChange={e => set('provider', e.target.value)} style={inputStyle} /></Field>
          <Field label="Level"><select value={form.level} onChange={e => set('level', e.target.value)} style={inputStyle}>{LEARN_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}</select></Field>
          <Field label="Format"><select value={form.format} onChange={e => set('format', e.target.value)} style={inputStyle}>{LEARN_FORMATS.map(f => <option key={f} value={f}>{f}</option>)}</select></Field>
          <Field label="Length"><input value={form.length} onChange={e => set('length', e.target.value)} placeholder="e.g. 6 lessons" style={inputStyle} /></Field>
          <Field label="Badge (optional)"><select value={form.tag} onChange={e => set('tag', e.target.value)} style={inputStyle}>{tags.map(t => <option key={t} value={t}>{t || 'None'}</option>)}</select></Field>
          <div><Btn solid style={{ width: '100%', justifyContent: 'center', fontFamily: VM.serif }}><i className="ti ti-plus" style={{ fontSize: 15 }}></i>Add course</Btn></div>
        </form>
        {done && <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 7, fontFamily: VM.serif, fontSize: 13.5, color: VM.upInk }}>
          <i className="ti ti-circle-check-filled" style={{ fontSize: 16 }}></i>{done}
          <span onClick={() => go('learn')} style={{ color: VM.teal, cursor: 'pointer', marginLeft: 4 }}>View on Learn →</span>
        </div>}
      </AdminCard>

      <AdminCard title={`Catalogue · ${courses.length} courses`}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {courses.map((c, i) => {
            const cat = LEARN_CATS.find(x => x.id === c.cat);
            const t = catTint(c.cat);
            return (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 4px', borderBottom: i < courses.length - 1 ? `1px solid ${VM.borderHair}` : 'none' }}>
                <span style={{ width: 30, height: 30, borderRadius: 7, flexShrink: 0, background: t.bg, color: t.fg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className={'ti ti-' + t.icon} style={{ fontSize: 15 }}></i>
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: VM.serif, fontSize: 14.5, fontWeight: 600, color: VM.ink }}>{c.title}
                    {c.added && <span style={{ fontFamily: VM.mono, fontSize: 8, fontWeight: 700, color: VM.terra, border: `1px solid ${VM.terra}`, borderRadius: 4, padding: '1px 5px', marginLeft: 8, verticalAlign: 'middle' }}>ADDED</span>}
                  </div>
                  <Mono size={10} color={VM.ink3}>{cat ? cat.label : c.cat} · {c.level} · {c.format} · {c.length}</Mono>
                </div>
                {c.added
                  ? <button title="Remove" onClick={() => remove(c.id)} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${VM.border}`, background: VM.paper, color: VM.downInk, cursor: 'pointer', flexShrink: 0 }}><i className="ti ti-trash" style={{ fontSize: 14 }}></i></button>
                  : <span style={{ fontFamily: VM.mono, fontSize: 8.5, color: VM.faint, flexShrink: 0 }}>SEED</span>}
              </div>
            );
          })}
        </div>
      </AdminCard>
    </div>
  );
}
function Field({ label, full, children }) {
  return <label style={{ display: 'block', gridColumn: full ? '1 / -1' : 'auto' }}>
    <span style={{ fontFamily: VM.mono, fontSize: 9, letterSpacing: '0.06em', textTransform: 'uppercase', color: VM.ink3, display: 'block', marginBottom: 5 }}>{label}</span>
    {children}
  </label>;
}
const inputStyle = { width: '100%', boxSizing: 'border-box', fontFamily: VM.serif, fontSize: 14, color: VM.ink, padding: '9px 11px', borderRadius: 8, border: `1px solid ${VM.border}`, background: VM.paperWarm, outline: 'none' };

Object.assign(window, { AdminPanel });
