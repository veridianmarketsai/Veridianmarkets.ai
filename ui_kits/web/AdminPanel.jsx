// Veridian Markets — Admin control panel (admin role only).
// Tabs: Overview, Users (Cognito + beta fallback), Courses, Heatmap, Beta, Media, Analytics, Team.
const { useState: useStateAdmin } = React;

const A_PLAN_COLOR = { Free: VM.faint, Plus: VM.teal, Pro: VM.forest, Business: VM.terra };
const A_STATUS = {
  active:  { label: 'Active',  fg: VM.upInk,   bg: VM.tealTint,               bd: VM.up      },
  trial:   { label: 'Trial',   fg: VM.terra,    bg: 'rgba(196,106,59,0.12)',   bd: VM.terra   },
  churned: { label: 'Churned', fg: VM.downInk,  bg: 'rgba(163,45,45,0.10)',    bd: VM.downInk },
};
const aMoney  = (n) => '$' + Number(n).toLocaleString('en-US');
const aDate   = (d) => (d instanceof Date ? d : new Date(d)).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const aRelNow = (d) => { const days = Math.round((Date.now() - +d) / 86400000); return days <= 0 ? 'today' : days === 1 ? '1d ago' : days < 30 ? days + 'd ago' : Math.round(days / 30) + 'mo ago'; };
const aRel    = (d) => { const days = Math.round((VM_NOW - d) / 86400000); return days <= 0 ? 'today' : days === 1 ? '1d ago' : days < 30 ? days + 'd ago' : Math.round(days / 30) + 'mo ago'; };
const aRelReal = (d) => { const days = Math.round((Date.now() - (d instanceof Date ? d.getTime() : +d)) / 86400000); return days <= 0 ? 'today' : days === 1 ? '1d ago' : days < 30 ? days + 'd ago' : Math.round(days / 30) + 'mo ago'; };
const A_PLAN_PRICE = { Plus: 9, Pro: 19 };
const DAY_MS = 86400000;

// ── Live beta users (localStorage) ───────────────────────────────────────────
function loadLiveUsers() {
  const betas = window.loadBetaUsers ? window.loadBetaUsers() : [];
  return betas.map(u => ({
    id:         u.id,
    name:       u.name,
    email:      u.email,
    plan:       u.plan  || 'Pro',
    status:     'active',
    country:    '—',
    joined:     new Date(u.joined || Date.now()),
    lastActive: new Date(u.joined || Date.now()),
    enrolled:   0,
    lessons:    0,
    role:       'beta',
    inviteToken: u.inviteToken || '',
  }));
}

function computeLiveStats(users) {
  const now = Date.now();
  const within = (d, days) => (now - +d) <= days * DAY_MS;
  const byPlan   = { Free: 0, Plus: 0, Pro: 0 };
  const byStatus = { active: 0, trial: 0, churned: 0 };
  const byCountry = {};
  let mrr = 0;
  users.forEach(u => {
    byPlan[u.plan]   = (byPlan[u.plan]   || 0) + 1;
    byStatus[u.status] = (byStatus[u.status] || 0) + 1;
    if (u.status !== 'churned') mrr += A_PLAN_PRICE[u.plan] || 0;
    if (u.country && u.country !== '—') byCountry[u.country] = (byCountry[u.country] || 0) + 1;
  });
  const months = [];
  for (let m = 11; m >= 0; m--) {
    const ref = new Date(); ref.setMonth(ref.getMonth() - m);
    const y = ref.getFullYear(), mo = ref.getMonth();
    const label = ref.toLocaleString('en-US', { month: 'short' });
    const count = users.filter(u => { const j = new Date(u.joined); return j.getFullYear() === y && j.getMonth() === mo; }).length;
    months.push({ label, count });
  }
  const topCountries = Object.entries(byCountry).map(([c, n]) => ({ c, n })).sort((a, b) => b.n - a.n).slice(0, 6);
  return {
    total: users.length,
    active:       byStatus.active  || 0,
    trial:        byStatus.trial   || 0,
    churned:      byStatus.churned || 0,
    newThisWeek:  users.filter(u => within(u.joined, 7)).length,
    newThisMonth: users.filter(u => within(u.joined, 30)).length,
    paying:       (byPlan.Plus || 0) + (byPlan.Pro || 0),
    mrr, lessons: 0, byPlan, byStatus, months, topCountries,
  };
}

// ── Real Cognito user roster (via vm-admin-analytics Lambda) ─────────────────
const A_STATUS_REAL = {
  active:      { label: 'Active',      fg: VM.upInk,  bg: VM.tealTint,             bd: VM.up },
  inactive:    { label: 'Inactive',    fg: VM.ink3,   bg: VM.paperDeep,            bd: VM.border },
  unconfirmed: { label: 'Unconfirmed', fg: VM.terra,  bg: 'rgba(196,106,59,0.12)', bd: VM.terra },
  suspended:   { label: 'Suspended',   fg: VM.downInk, bg: 'rgba(163,45,45,0.10)', bd: VM.downInk },
};
function realUserStatus(u) {
  if (u.enabled === false) return 'suspended';
  if (u.cognitoStatus && u.cognitoStatus !== 'CONFIRMED') return 'unconfirmed';
  if (u.lastActive && (Date.now() - u.lastActive.getTime()) < 7 * DAY_MS) return 'active';
  return 'inactive';
}
// Beta signups are tracked client-side only (BetaSignup.jsx, this browser's
// localStorage) — Cognito/vm-admin-analytics has no concept of "beta" at
// all. This cross-references by email so the real Users table can still
// label them, purely a display join; it doesn't change what plan is
// actually enforced (that still needs a real Change-plan grant).
function isLocalBetaUser(email) {
  if (!email || typeof loadBetaUsers !== 'function') return false;
  return loadBetaUsers().some(b => b.email.toLowerCase() === email.toLowerCase());
}
function normalizeAdminUser(u) {
  const plan = u.plan || 'free';
  return {
    id: u.sub, name: u.name || (u.email ? u.email.split('@')[0] : 'Member'), email: u.email || '',
    plan: plan.charAt(0).toUpperCase() + plan.slice(1),
    planRaw: plan,
    isBeta: isLocalBetaUser(u.email),
    cognitoStatus: u.status,
    enabled: u.enabled !== false,
    joined: u.created ? new Date(u.created) : null,
    lastActive: u.lastSeen ? new Date(u.lastSeen) : null,
    eventCount: u.eventCount || 0,
    favourites: u.favourites || [],
  };
}
function useRealAdminUsers() {
  const [state, setState] = useStateAdmin({ users: null, loading: true });
  const load = React.useCallback(() => {
    setState(s => ({ ...s, loading: true }));
    vmAdminAnalytics('users').then(d => {
      setState({ users: (d && Array.isArray(d.users)) ? d.users.map(normalizeAdminUser) : null, loading: false });
    });
  }, []);
  React.useEffect(() => { load(); }, [load]);
  return { ...state, refresh: load };
}

function buildRealOverviewStats(users) {
  const now = Date.now();
  const byPlan = { Free: 0, Plus: 0, Pro: 0 };
  let mrr = 0;
  users.forEach(u => {
    byPlan[u.plan] = (byPlan[u.plan] || 0) + 1;
    if (u.enabled !== false) mrr += A_PLAN_PRICE[u.plan] || 0;
  });
  const months = [];
  for (let m = 11; m >= 0; m--) {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - m);
    const count = users.filter(u => u.joined && u.joined.getFullYear() === d.getFullYear() && u.joined.getMonth() === d.getMonth()).length;
    months.push({ label: d.toLocaleString('en-US', { month: 'short' }), count });
  }
  return {
    total: users.length,
    active: users.filter(u => realUserStatus(u) === 'active').length,
    suspended: users.filter(u => u.enabled === false).length,
    newThisWeek: users.filter(u => u.joined && (now - u.joined.getTime()) <= 7 * DAY_MS).length,
    newThisMonth: users.filter(u => u.joined && (now - u.joined.getTime()) <= 30 * DAY_MS).length,
    paying: users.filter(u => u.planRaw !== 'free').length,
    mrr, byPlan, months,
  };
}

function adminDownloadCSV(filename, headers, rows) {
  const escape = v => { const s = String(v ?? ''); return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g,'""')}"` : s; };
  const csv = [headers, ...rows].map(r => r.map(escape).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type:'text/csv' }));
  a.download = filename;
  a.click();
}

const ADMIN_STEPS = [
  { sel:'[data-tour="vm-admin-header"]',
    title:'Control panel.',
    body:'This is the admin view — only accounts with the admin role can access it. You can see platform-wide metrics, browse and manage users, and edit the course catalogue from here.' },
  { sel:'[data-tour="vm-admin-tabs"]',
    title:'Five tabs.',
    body:'Overview shows the headline KPIs and charts. Users lets you search, filter, and access any account. Courses lets you edit the learn catalogue in real time. Analytics holds the deeper tools — cohort retention, conversion funnel, revenue/MRR movement, engagement, and the interaction heatmap. Team lets a full admin control exactly what each fellow admin is allowed to do.' },
  { sel:'[data-tour="vm-admin-kpis"]',
    title:'Key metrics at a glance.',
    body:'Total users, new signups, paying accounts, estimated MRR, churn count, and live course count — all updated from the temporary dataset. Green is good, red warrants attention.' },
  { sel:'[data-tour="vm-admin-charts"]',
    title:'Signups and plan distribution.',
    body:'The bar chart shows monthly signup volume for the last 12 months. The donut breaks down Free, Plus, and Pro seats. Together they tell you whether you are growing and how revenue is distributed across tiers.' },
  { sel:'[data-tour="vm-admin-countries"]',
    title:'Top countries.',
    body:'User count by country, shown as a ranked bar list. Useful for prioritising localisation, compliance, and marketing spend.' },
];

// Mirrors vm-admin-actions' PERMISSION_GROUPS/hasPermission/isFullAdmin —
// same six groups, same "never touched = full admin" safe-rollout rule —
// recomputed client-side from the caller's own ID-token groups (`user.groups`,
// auth.jsx) purely to decide what to render. Not a security boundary: the
// real one is server-side in vm-admin-actions for the three mutating actions;
// Overview/Analytics/Courses have no separate real data behind them that
// needs gating beyond the `admin` group already required to reach this panel.
const ADMIN_PERM_GROUPS = ['admin-view-overview', 'admin-view-analytics', 'admin-view-courses', 'admin-suspend', 'admin-delete', 'admin-billing'];
function clientHasAdminPerm(groups, required) {
  if (!required) return true;
  const migrated = ADMIN_PERM_GROUPS.some(g => groups.includes(g));
  if (!migrated) return true;
  return groups.includes(required);
}
function clientIsFullAdmin(groups) {
  return ADMIN_PERM_GROUPS.every(g => clientHasAdminPerm(groups, g));
}

function AdminPanel({ go, user, isMobile }) {
  const userGroups = (user && user.groups) || [];
  const canOverview  = clientHasAdminPerm(userGroups, 'admin-view-overview');
  const canAnalytics = clientHasAdminPerm(userGroups, 'admin-view-analytics');
  const canCourses   = clientHasAdminPerm(userGroups, 'admin-view-courses');
  const isFullAdmin  = clientIsFullAdmin(userGroups);
  const [tab, setTab] = useStateAdmin(canOverview ? 'overview' : 'users');
  const [accessing, setAccessing] = useStateAdmin(null);
  const [tutorialOpen, setTutorialOpen] = useStateAdmin(false);
  const [liveUsers, setLiveUsers] = useStateAdmin(loadLiveUsers);
  const stats = React.useMemo(() => computeLiveStats(liveUsers), [liveUsers]);
  // Refresh live users when the tab changes (picks up new sign-ups).
  React.useEffect(() => { setLiveUsers(loadLiveUsers()); }, [tab]);
  const tabs = [
    { id: 'overview',  label: 'Overview',  icon: 'layout-dashboard',  show: canOverview },
    { id: 'users',     label: 'Users',     icon: 'users',             show: true },
    { id: 'courses',   label: 'Courses',   icon: 'book',              show: canCourses },
    { id: 'heatmap',   label: 'Heatmap',   icon: 'flame',             show: true },
    { id: 'beta',      label: 'Beta',      icon: 'test-pipe',         show: true },
    { id: 'feedback',  label: 'Feedback',  icon: 'message-2-star',    show: true },
    { id: 'media',     label: 'Media',     icon: 'photo-video',       show: true },
    { id: 'updates',   label: 'Updates',   icon: 'news',              show: true },
    { id: 'analytics', label: 'Analytics', icon: 'chart-histogram',   show: canAnalytics },
    { id: 'team',      label: 'Team',      icon: 'shield-lock',       show: isFullAdmin },
  ].filter(t => t.show);
  return (
    <div style={{ padding: isMobile ? '16px 16px 80px' : '26px 32px 72px', maxWidth: 1180, margin: '0 auto' }}>
      <div data-tour="vm-admin-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <Kicker>Control panel</Kicker>
            <span style={{ fontFamily: VM.mono, fontSize: 8.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: VM.paperWarm, background: VM.forest, borderRadius: 5, padding: '2px 7px' }}>Admin</span>
          </div>
          <h1 style={{ fontFamily: VM.serif, fontWeight: 700, fontSize: isMobile ? 26 : 32, lineHeight: 1.05, margin: '8px 0 0' }}>Admin.</h1>
          <div style={{ fontFamily: VM.serif, fontSize: 14, color: VM.ink3, marginTop: 4 }}>Signed in as <strong style={{ color: VM.ink2 }}>{user ? (user.name || user.email) : 'admin'}</strong> · temporary data</div>
        </div>
        <button onClick={()=>setTutorialOpen(true)} title="Interactive tutorial — learn this panel"
          style={{ display:'inline-flex', alignItems:'center', gap:6, fontFamily:VM.mono, fontSize:10,
            letterSpacing:'0.04em', textTransform:'uppercase', padding:'4px 11px', borderRadius:5, flexShrink:0, marginTop:8,
            border:`1px solid ${VM.terra}`, background:'transparent', color:VM.terra, cursor:'pointer' }}>
          <i className="ti ti-graduation-cap" style={{ fontSize:12 }}></i>Tutorial
        </button>
      </div>

      {accessing && (
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderRadius: 10, background: 'rgba(196,106,59,0.12)', border: `1px solid ${VM.terra}` }}>
          <i className="ti ti-eye" style={{ fontSize: 17, color: VM.rustDeep }}></i>
          <span style={{ fontFamily: VM.serif, fontSize: 14.5, color: VM.ink }}>You are accessing <strong>{accessing.name}</strong>’s account <span style={{ color: VM.ink3 }}>· simulated</span></span>
          <button onClick={() => setAccessing(null)} style={{ marginLeft: 'auto', fontFamily: VM.mono, fontSize: 11, padding: '5px 13px', borderRadius: 999, border: `1px solid ${VM.terra}`, background: VM.paper, color: VM.rustDeep, cursor: 'pointer' }}>Exit ✕</button>
        </div>
      )}

      <div data-tour="vm-admin-tabs" style={{ display: 'flex', gap: 6, marginTop: 20, borderBottom: `1px solid ${VM.borderSoft}` }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: VM.serif, fontSize: 15,
            padding: '9px 14px', cursor: 'pointer', background: 'transparent', border: 'none', color: tab === t.id ? VM.ink : VM.ink3,
            fontWeight: tab === t.id ? 700 : 400, borderBottom: `2px solid ${tab === t.id ? VM.forest : 'transparent'}`, marginBottom: -1 }}>
            <i className={'ti ti-' + t.icon} style={{ fontSize: 16 }}></i>{t.label}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 22 }}>
        {tab === 'overview'  && <OverviewTab stats={stats} isMobile={isMobile} />}
        {tab === 'users'     && <UsersTab onAccess={setAccessing} isMobile={isMobile} />}
        {tab === 'courses'   && <CoursesTab go={go} isMobile={isMobile} />}
        {tab === 'heatmap'   && <HeatmapAdmin isMobile={isMobile} />}
        {tab === 'beta'      && <BetaTab isMobile={isMobile} />}
        {tab === 'feedback'  && <FeedbackTab isMobile={isMobile} />}
        {tab === 'media'     && <MediaTab isMobile={isMobile} />}
        {tab === 'updates'   && <UpdatesTab isMobile={isMobile} />}
        {tab === 'analytics' && <AnalyticsTab stats={stats} isMobile={isMobile} />}
        {tab === 'team'      && <TeamTab user={user} isMobile={isMobile} />}
      </div>

      {tutorialOpen && <TutorialOverlay steps={ADMIN_STEPS} label="Admin panel tutorial" onClose={()=>setTutorialOpen(false)} />}
    </div>
  );
}

// ── Overview ────────────────────────────────────────────────────────────────
function OverviewTab({ stats: mockStats, isMobile }) {
  const [kpiModal, setKpiModal] = useStateAdmin(null);
  const [chartModal, setChartModal] = useStateAdmin(null); // 'signups' | 'plans' | 'countries'
  const { users: realUsers, loading: realLoading } = useRealAdminUsers();
  const real = !!(realUsers && realUsers.length);
  const stats = real ? buildRealOverviewStats(realUsers) : mockStats;
  const courseCount = vmGetCourses().length;
  const kpis = real ? [
    { id:'total',     label: 'Total users',    value: stats.total,             foot: `${stats.active} active` },
    { id:'new',       label: 'New this week',  value: '+' + stats.newThisWeek, foot: `${stats.newThisMonth} this month`, tone: 'up' },
    { id:'paying',    label: 'Paying',         value: stats.paying,            foot: `${stats.total ? (stats.paying / stats.total * 100).toFixed(0) : 0}% of users` },
    { id:'mrr',       label: 'Est. MRR',       value: aMoney(stats.mrr),       foot: 'live plan data' },
    { id:'suspended', label: 'Suspended',      value: stats.suspended,         foot: `${stats.total ? (stats.suspended / stats.total * 100).toFixed(0) : 0}% of users`, tone: stats.suspended ? 'down' : undefined },
    { id:'courses',   label: 'Courses',        value: courseCount,             foot: 'in the catalogue' },
  ] : [
    { id:'total',   label: 'Total users',    value: stats.total,              foot: `${stats.active} active` },
    { id:'new',     label: 'New this week',  value: '+' + stats.newThisWeek,  foot: `${stats.newThisMonth} this month`,                               tone: 'up' },
    { id:'paying',  label: 'Paying',         value: stats.paying,             foot: `${(stats.paying / stats.total * 100).toFixed(0)}% of users` },
    { id:'mrr',     label: 'Est. MRR',       value: aMoney(stats.mrr),        foot: 'Plus + Pro' },
    { id:'churned', label: 'Churned',        value: stats.churned,            foot: `${(stats.churned / stats.total * 100).toFixed(0)}% of users`,    tone: 'down' },
    { id:'courses', label: 'Courses',        value: courseCount,              foot: 'in the catalogue' },
  ];
  const planLabels = real ? Object.keys(stats.byPlan) : ['Free', 'Plus', 'Pro'];
  const planData = planLabels.map(l => ({ label: l, value: stats.byPlan[l] || 0, color: A_PLAN_COLOR[l] || VM.terra }));
  const maxC = real ? 1 : Math.max(...stats.topCountries.map(c => c.n), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Mono size={10.5} color={real ? VM.upInk : VM.ink3}>
        {real ? 'Live (Cognito + activity)' : realLoading ? 'Loading live data…' : 'Mock (live data unavailable)'}
      </Mono>
      <LiveCapturePanel isMobile={isMobile} compact={real} />
      <div data-tour="vm-admin-kpis" style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        {kpis.map((k, i) => <AdminKpi key={i} {...k} onClick={() => setKpiModal(k.id)} />)}
      </div>
      <div data-tour="vm-admin-charts" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
        <AdminCard title="Signups · last 12 months" onOpen={() => setChartModal('signups')}><AdminBars data={stats.months} /></AdminCard>
        <AdminCard title="Plan distribution" onOpen={() => setChartModal('plans')}>
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
      {!real && (
        <AdminCard title="Top countries" dataTour="vm-admin-countries" onOpen={() => setChartModal('countries')}>
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
      )}
      {kpiModal && <AdminKpiModal kpiKey={kpiModal} stats={stats} real={real} realUsers={realUsers} onClose={() => setKpiModal(null)} />}
      {chartModal && <AdminChartModal chartKey={chartModal} stats={stats} real={real} realUsers={realUsers} onClose={() => setChartModal(null)} />}
    </div>
  );
}

// Real captured data (vm-events via vm-admin-analytics). Hidden if not admin /
// not configured / no data yet — the mock KPIs below still render.
// `compact` drops the Users/Active/Paying/Events mini-row (the main KPI tiles
// above already show real numbers once the roster itself is live) and keeps
// just the favourites/viewed/funnel breakdown, which isn't derivable from the
// per-user roster alone.
function LiveCapturePanel({ isMobile, compact }) {
  const { data, loading } = typeof useAdminAnalytics === 'function' ? useAdminAnalytics('overview') : { data: null, loading: false };
  if (loading) return (
    <div style={{ border: `1px solid ${VM.borderSoft}`, borderRadius: 14, padding: 16, fontFamily: VM.mono, fontSize: 11, color: VM.ink3 }}>
      <i className="ti ti-loader-2" style={{ fontSize: 13 }}></i> Loading real captured data…
    </div>
  );
  if (!data) return null;
  const f = data.funnel || {}, plans = data.plans || {};
  const kpis = [['Users (live)', data.totalUsers], ['Active · 7d', data.activeUsers7d], ['Paying', (plans.plus || 0) + (plans.pro || 0)], ['Events', data.totalEvents]];
  const box = { background: VM.paper, border: `1px solid ${VM.borderSoft}`, borderRadius: 10, padding: '11px 13px' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, border: `1px solid ${VM.tealTint2 || VM.teal}`, borderRadius: 14, padding: 16, background: VM.tealTint }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ width: 7, height: 7, borderRadius: 999, background: VM.teal }}></span>
        <span style={{ fontFamily: VM.mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: VM.tealInk }}>{compact ? 'Live activity' : 'Live · captured data (real)'}</span>
      </div>
      {!compact && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 10 }}>
          {kpis.map(([l, v]) => <div key={l} style={box}><Label>{l}</Label><div style={{ fontFamily: VM.mono, fontSize: 22, fontWeight: 700, color: VM.ink, marginTop: 3 }}>{v ?? 0}</div></div>)}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
        <LiveTopList title="Most favourited" rows={data.topFavourites} />
        <LiveTopList title="Most viewed" rows={data.topViewed} />
      </div>
      <div style={box}>
        <Label>Funnel</Label>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 8 }}>
          {[['Sessions', f.sessions], ['Company views', f.companyViews], ['Paywall hits', f.paywallHits], ['Checkout starts', f.checkoutStarts]].map(([l, v]) => (
            <div key={l} style={{ flex: '1 1 110px' }}><Mono size={20} weight={700}>{v || 0}</Mono><div><Label>{l}</Label></div></div>
          ))}
        </div>
      </div>
    </div>
  );
}
function LiveTopList({ title, rows }) {
  const list = (rows || []).slice(0, 8);
  return (
    <div style={{ background: VM.paper, border: `1px solid ${VM.borderSoft}`, borderRadius: 10, padding: '11px 13px' }}>
      <Label>{title}</Label>
      {!list.length && <div style={{ fontFamily: VM.serif, fontSize: 13, color: VM.ink3, marginTop: 8 }}>No data yet.</div>}
      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
        {list.map((r, i) => (
          <div key={r.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: VM.mono, fontSize: 9, color: VM.ink3, width: 14 }}>{i + 1}</span>
            <span style={{ flex: 1, fontFamily: VM.mono, fontSize: 12, fontWeight: 700, color: VM.ink }}>{r.key}</span>
            <Mono size={11} color={VM.ink2}>{r.n}</Mono>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminKpi({ label, value, foot, tone, onClick }) {
  const [hover, setHover] = useStateAdmin(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ background: hover ? VM.paperWarm : VM.paper, border: `1px solid ${hover ? VM.border : VM.borderSoft}`,
        borderRadius: 12, padding: '13px 15px', cursor: 'pointer', transition: 'background .12s, border-color .12s',
        position: 'relative' }}>
      <span style={{ position:'absolute', top:10, right:12, fontFamily:VM.mono, fontSize:12,
        color: hover ? VM.teal : VM.faint, transition:'color .12s' }}>↗</span>
      <Label>{label}</Label>
      <div style={{ fontFamily: VM.mono, fontWeight: 700, fontSize: 24, marginTop: 5,
        color: tone === 'up' ? VM.upInk : tone === 'down' ? VM.downInk : VM.ink }}>{value}</div>
      {foot && <div style={{ marginTop: 3 }}><Mono size={10} color={VM.ink3}>{foot}</Mono></div>}
    </div>
  );
}

function AdminKpiModal({ kpiKey, stats, onClose, real, realUsers }) {
  if (real) return <RealAdminKpiModal kpiKey={kpiKey} stats={stats} realUsers={realUsers} onClose={onClose} />;
  const users   = VM_USERS;
  const courses = vmGetCourses();

  // helpers
  const StatRow = ({ label, value, sub, bar, barColor, valueColor }) => (
    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 0', borderBottom:`1px solid ${VM.borderHair}` }}>
      <span style={{ flex:1, fontFamily:VM.serif, fontSize:13, color:VM.ink2 }}>{label}</span>
      {bar !== undefined && (
        <div style={{ width:80, height:5, background:VM.border, borderRadius:3, flexShrink:0 }}>
          <div style={{ height:5, borderRadius:3, width:`${Math.min(bar,100)}%`, background: barColor || VM.teal }} />
        </div>
      )}
      <span style={{ fontFamily:VM.mono, fontSize:13, fontWeight:700, color: valueColor || VM.ink, textAlign:'right', minWidth:36 }}>
        {value}
        {sub && <span style={{ fontFamily:VM.mono, fontSize:10, fontWeight:400, color:VM.ink3, marginLeft:3 }}>{sub}</span>}
      </span>
    </div>
  );
  const Section = ({ title, children }) => (
    <div style={{ marginBottom:20 }}>
      <div style={{ fontFamily:VM.mono, fontSize:9, letterSpacing:'0.1em', textTransform:'uppercase', color:VM.ink3, marginBottom:8 }}>{title}</div>
      {children}
    </div>
  );
  const UserRow = ({ u }) => (
    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:`1px solid ${VM.borderHair}` }}>
      <div style={{ width:28, height:28, borderRadius:999, background:VM.paperWarm, border:`1px solid ${VM.border}`,
        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <span style={{ fontFamily:VM.mono, fontSize:10, fontWeight:700, color:VM.ink3 }}>{u.name[0]}</span>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontFamily:VM.serif, fontSize:13, color:VM.ink, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{u.name}</div>
        <div style={{ fontFamily:VM.mono, fontSize:9.5, color:VM.ink3 }}>{u.country}</div>
      </div>
      <span style={{ fontFamily:VM.mono, fontSize:9, padding:'2px 7px', borderRadius:4,
        background: u.plan==='Pro' ? 'rgba(29,158,117,0.15)' : u.plan==='Plus' ? 'rgba(29,158,117,0.10)' : VM.paperWarm,
        color: u.plan==='Free' ? VM.ink3 : VM.teal, border:`1px solid ${u.plan==='Free' ? VM.border : VM.up}` }}>{u.plan}</span>
      <span style={{ fontFamily:VM.mono, fontSize:9.5, color:VM.ink3, flexShrink:0 }}>{aRel(u.joined)}</span>
    </div>
  );

  let title = '', subtitle = '', body = null, csvData = null;

  if (kpiKey === 'total') {
    const recentUsers = [...users].sort((a,b) => b.joined - a.joined).slice(0,6);
    csvData = { filename:'vm_users_total.csv', headers:['Name','Email','Plan','Status','Country','Joined'], rows:users.map(u=>[u.name,u.email,u.plan,u.status,u.country,aDate(u.joined)]) };
    title = `${stats.total} Users`;
    subtitle = 'Full platform breakdown';
    body = (
      <>
        <Section title="By status">
          <StatRow label="Active"  value={stats.active}  sub={`${(stats.active/stats.total*100).toFixed(0)}%`}  bar={stats.active/stats.total*100}  barColor={VM.upInk} />
          <StatRow label="Trial"   value={stats.trial}   sub={`${(stats.trial/stats.total*100).toFixed(0)}%`}   bar={stats.trial/stats.total*100}   barColor={VM.terra} />
          <StatRow label="Churned" value={stats.churned} sub={`${(stats.churned/stats.total*100).toFixed(0)}%`} bar={stats.churned/stats.total*100} barColor={VM.downInk} valueColor={VM.downInk} />
        </Section>
        <Section title="By plan">
          <StatRow label="Free" value={stats.byPlan.Free} sub={`${(stats.byPlan.Free/stats.total*100).toFixed(0)}%`} bar={stats.byPlan.Free/stats.total*100} barColor={VM.faint} />
          <StatRow label="Plus" value={stats.byPlan.Plus} sub={`${(stats.byPlan.Plus/stats.total*100).toFixed(0)}%`} bar={stats.byPlan.Plus/stats.total*100} barColor={VM.teal} />
          <StatRow label="Pro"  value={stats.byPlan.Pro}  sub={`${(stats.byPlan.Pro/stats.total*100).toFixed(0)}%`}  bar={stats.byPlan.Pro/stats.total*100}  barColor={VM.forest} />
        </Section>
        <Section title="Recently joined">
          {recentUsers.map(u => <UserRow key={u.id} u={u} />)}
        </Section>
      </>
    );
  }

  else if (kpiKey === 'new') {
    const thisWeek  = [...users].filter(u => (VM_NOW - u.joined) <= 7 * DAY_MS).sort((a,b) => b.joined - a.joined);
    const thisMonth = [...users].filter(u => (VM_NOW - u.joined) <= 30 * DAY_MS).sort((a,b) => b.joined - a.joined);
    const peakMonth = Math.max(...stats.months.map(m => m.count), 1);
    csvData = { filename:'vm_users_new.csv', headers:['Name','Email','Plan','Status','Country','Joined'], rows:thisMonth.map(u=>[u.name,u.email,u.plan,u.status,u.country,aDate(u.joined)]) };
    title = `+${stats.newThisWeek} This Week`;
    subtitle = `${stats.newThisMonth} joined in the last 30 days`;
    body = (
      <>
        <Section title="Joined this week">
          {thisWeek.length > 0 ? thisWeek.map(u => <UserRow key={u.id} u={u} />) : <div style={{ fontFamily:VM.serif, fontSize:13, color:VM.ink3 }}>No signups in the last 7 days.</div>}
        </Section>
        <Section title="Monthly trend · last 12 months">
          <div style={{ display:'flex', alignItems:'flex-end', gap:4, height:60, marginBottom:8 }}>
            {stats.months.map((m,i) => (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                <div style={{ width:'100%', borderRadius:'3px 3px 0 0', background: i===stats.months.length-1 ? VM.teal : VM.border,
                  height: `${Math.max((m.count/peakMonth)*52, m.count>0?8:2)}px`, transition:'height .2s' }} />
                <span style={{ fontFamily:VM.mono, fontSize:8, color:VM.ink3, writingMode:'vertical-rl', transform:'rotate(180deg)', height:22 }}>{m.label}</span>
              </div>
            ))}
          </div>
        </Section>
        <Section title="Also joined this month">
          {thisMonth.slice(thisWeek.length, thisWeek.length + 8).map(u => <UserRow key={u.id} u={u} />)}
        </Section>
      </>
    );
  }

  else if (kpiKey === 'paying') {
    const plusActive = users.filter(u => u.plan==='Plus' && u.status!=='churned');
    const proActive  = users.filter(u => u.plan==='Pro'  && u.status!=='churned');
    const plusMrr    = plusActive.length * A_PLAN_PRICE.Plus;
    const proMrr     = proActive.length  * A_PLAN_PRICE.Pro;
    const arpu       = stats.paying ? (stats.mrr / (plusActive.length + proActive.length)).toFixed(2) : 0;
    const recentPaying = [...users].filter(u => u.plan !== 'Free').sort((a,b) => b.joined - a.joined).slice(0,6);
    csvData = { filename:'vm_users_paying.csv', headers:['Name','Email','Plan','Status','Country','Joined'], rows:users.filter(u=>u.plan!=='Free').sort((a,b)=>b.joined-a.joined).map(u=>[u.name,u.email,u.plan,u.status,u.country,aDate(u.joined)]) };
    title = `${stats.paying} Paying Accounts`;
    subtitle = `${(stats.paying/stats.total*100).toFixed(0)}% conversion · ${aMoney(stats.mrr)}/mo MRR`;
    body = (
      <>
        <Section title="Revenue by plan">
          <StatRow label={`Plus · ${plusActive.length} active`} value={aMoney(plusMrr)} sub="/mo" bar={plusMrr/(plusMrr+proMrr)*100} barColor={VM.teal} />
          <StatRow label={`Pro  · ${proActive.length} active`}  value={aMoney(proMrr)}  sub="/mo" bar={proMrr/(plusMrr+proMrr)*100}  barColor={VM.forest} />
        </Section>
        <Section title="Key metrics">
          <StatRow label="Conversion rate" value={`${(stats.paying/stats.total*100).toFixed(1)}%`} />
          <StatRow label="ARPU (active)"   value={`$${arpu}`} sub="/mo" />
          <StatRow label="ARR projection"  value={aMoney(stats.mrr * 12)} />
          <StatRow label="Churned paying"  value={users.filter(u=>u.plan!=='Free'&&u.status==='churned').length} sub="former" valueColor={VM.downInk} />
        </Section>
        <Section title="Recent paying signups">
          {recentPaying.map(u => <UserRow key={u.id} u={u} />)}
        </Section>
      </>
    );
  }

  else if (kpiKey === 'mrr') {
    const plusActive = users.filter(u => u.plan==='Plus' && u.status!=='churned');
    const proActive  = users.filter(u => u.plan==='Pro'  && u.status!=='churned');
    const plusMrr    = plusActive.length * A_PLAN_PRICE.Plus;
    const proMrr     = proActive.length  * A_PLAN_PRICE.Pro;
    const topCMrr    = {};
    users.filter(u=>u.status!=='churned'&&u.plan!=='Free').forEach(u=>{ topCMrr[u.country]=(topCMrr[u.country]||0)+(u.plan==='Pro'?A_PLAN_PRICE.Pro:A_PLAN_PRICE.Plus); });
    const topCountryMrr = Object.entries(topCMrr).sort((a,b)=>b[1]-a[1]).slice(0,4);
    csvData = { filename:'vm_mrr.csv', headers:['Plan','Active Accounts','Price/mo','MRR/mo'], rows:[['Plus',plusActive.length,A_PLAN_PRICE.Plus,plusMrr],['Pro',proActive.length,A_PLAN_PRICE.Pro,proMrr],['Total',plusActive.length+proActive.length,'—',stats.mrr]] };
    title = `Est. MRR · ${aMoney(stats.mrr)}`;
    subtitle = 'Monthly recurring revenue estimate';
    body = (
      <>
        <Section title="Revenue breakdown">
          <StatRow label={`Plus (${plusActive.length} accounts × $${A_PLAN_PRICE.Plus})`} value={aMoney(plusMrr)} sub="/mo" bar={plusMrr/stats.mrr*100} barColor={VM.teal} />
          <StatRow label={`Pro  (${proActive.length} accounts × $${A_PLAN_PRICE.Pro})`}  value={aMoney(proMrr)}  sub="/mo" bar={proMrr/stats.mrr*100}  barColor={VM.forest} />
        </Section>
        <Section title="Projections">
          <StatRow label="Monthly (MRR)"      value={aMoney(stats.mrr)}       />
          <StatRow label="Quarterly"          value={aMoney(stats.mrr * 3)}   />
          <StatRow label="Annual (ARR)"       value={aMoney(stats.mrr * 12)}  />
          <StatRow label="ARPU (active)"      value={`$${(plusActive.length+proActive.length ? stats.mrr/(plusActive.length+proActive.length) : 0).toFixed(2)}`} sub="/mo" />
        </Section>
        <Section title="MRR by country (top 4)">
          {topCountryMrr.map(([c,v]) => (
            <StatRow key={c} label={c} value={aMoney(v)} sub="/mo" bar={v/topCountryMrr[0][1]*100} barColor={VM.teal} />
          ))}
        </Section>
      </>
    );
  }

  else if (kpiKey === 'churned') {
    const churnedUsers = users.filter(u => u.status === 'churned');
    const churnByPlan  = { Free:0, Plus:0, Pro:0 };
    churnedUsers.forEach(u => churnByPlan[u.plan]++);
    const lostMrr = churnedUsers.filter(u=>u.plan==='Plus').length*9 + churnedUsers.filter(u=>u.plan==='Pro').length*19;
    const churnByCountry = {};
    churnedUsers.forEach(u => { churnByCountry[u.country]=(churnByCountry[u.country]||0)+1; });
    const topChurnC = Object.entries(churnByCountry).sort((a,b)=>b[1]-a[1]).slice(0,4);
    const recentChurned = [...churnedUsers].sort((a,b) => b.lastActive - a.lastActive).slice(0,6);
    csvData = { filename:'vm_users_churned.csv', headers:['Name','Email','Plan','Country','Last Active'], rows:churnedUsers.map(u=>[u.name,u.email,u.plan,u.country,aDate(u.lastActive)]) };
    title = `${stats.churned} Churned`;
    subtitle = `${(stats.churned/stats.total*100).toFixed(0)}% churn rate · ${aMoney(lostMrr)}/mo lost`;
    body = (
      <>
        <Section title="Churned by plan">
          <StatRow label="Free" value={churnByPlan.Free} bar={churnedUsers.length ? churnByPlan.Free/churnedUsers.length*100 : 0} barColor={VM.faint} />
          <StatRow label="Plus" value={churnByPlan.Plus} bar={churnedUsers.length ? churnByPlan.Plus/churnedUsers.length*100 : 0} barColor={VM.terra} valueColor={churnByPlan.Plus>0?VM.downInk:VM.ink} />
          <StatRow label="Pro"  value={churnByPlan.Pro}  bar={churnedUsers.length ? churnByPlan.Pro/churnedUsers.length*100  : 0} barColor={VM.downInk} valueColor={churnByPlan.Pro>0?VM.downInk:VM.ink} />
        </Section>
        <Section title="Impact">
          <StatRow label="Lost MRR"       value={aMoney(lostMrr)} sub="/mo" valueColor={VM.downInk} />
          <StatRow label="Lost ARR est."  value={aMoney(lostMrr * 12)} valueColor={VM.downInk} />
          <StatRow label="Churn rate"     value={`${(stats.churned/stats.total*100).toFixed(1)}%`} valueColor={VM.downInk} />
        </Section>
        <Section title="By country (top 4)">
          {topChurnC.map(([c,v]) => (
            <StatRow key={c} label={c} value={v} bar={v/topChurnC[0][1]*100} barColor={VM.downInk} />
          ))}
        </Section>
        <Section title="Recently churned">
          {recentChurned.map(u => <UserRow key={u.id} u={u} />)}
        </Section>
      </>
    );
  }

  else if (kpiKey === 'courses') {
    const totalEnrolled = users.reduce((s,u) => s+u.enrolled, 0);
    const totalLessons  = users.reduce((s,u) => s+u.lessons, 0);
    csvData = { filename:'vm_courses.csv', headers:['Title','Level'], rows:courses.map(c=>[c.title,c.level||'']) };
    title = `${courses.length} Courses`;
    subtitle = `${totalEnrolled} enrolments · ${totalLessons} lessons completed`;
    body = (
      <>
        <Section title="Platform activity">
          <StatRow label="Total enrolments"      value={totalEnrolled} />
          <StatRow label="Lessons completed"     value={totalLessons} />
          <StatRow label="Avg enrolments / user" value={(totalEnrolled/users.length).toFixed(1)} />
          <StatRow label="Avg lessons / user"    value={(totalLessons/users.length).toFixed(1)} />
        </Section>
        <Section title={`Catalogue · ${courses.length} courses`}>
          {courses.map((c,i) => (
            <div key={c.id||i} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:`1px solid ${VM.borderHair}` }}>
              <i className="ti ti-book" style={{ fontSize:13, color:VM.teal, flexShrink:0 }}></i>
              <span style={{ flex:1, fontFamily:VM.serif, fontSize:13, color:VM.ink }}>{c.title}</span>
              {c.level && <span style={{ fontFamily:VM.mono, fontSize:9, color:VM.ink3, background:VM.paperWarm, border:`1px solid ${VM.border}`, borderRadius:4, padding:'1px 6px' }}>{c.level}</span>}
            </div>
          ))}
        </Section>
      </>
    );
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:85, display:'flex', alignItems:'center', justifyContent:'center',
      background:'rgba(31,29,26,0.55)', backdropFilter:'blur(3px)' }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ width:'100%', maxWidth:520, maxHeight:'88vh', display:'flex', flexDirection:'column',
        background:VM.paper, border:`1px solid ${VM.border}`, borderRadius:18,
        boxShadow:'0 20px 60px rgba(31,29,26,0.28)', overflow:'hidden' }}>
        <div style={{ padding:'18px 20px 14px', borderBottom:`1px solid ${VM.borderHair}`, flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontFamily:VM.serif, fontWeight:700, fontSize:22, color:VM.ink, lineHeight:1.1 }}>{title}</div>
              <div style={{ fontFamily:VM.serif, fontSize:13, color:VM.ink3, marginTop:3 }}>{subtitle}</div>
            </div>
            <div style={{ display:'flex', gap:6, flexShrink:0, marginLeft:12 }}>
              {csvData && (
                <button onClick={()=>adminDownloadCSV(csvData.filename, csvData.headers, csvData.rows)} title="Download CSV"
                  style={{ display:'inline-flex', alignItems:'center', justifyContent:'center',
                    width:30, height:30, borderRadius:8, border:`1px solid ${VM.borderSoft}`,
                    background:'transparent', color:VM.ink3, cursor:'pointer' }}>
                  <i className="ti ti-download" style={{ fontSize:14 }}></i>
                </button>
              )}
              <button onClick={onClose} style={{ display:'inline-flex', alignItems:'center', justifyContent:'center',
                width:30, height:30, borderRadius:8, border:`1px solid ${VM.borderSoft}`, background:'transparent', color:VM.ink3, cursor:'pointer' }}>
                <i className="ti ti-x" style={{ fontSize:14 }}></i>
              </button>
            </div>
          </div>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'18px 20px' }}>{body}</div>
      </div>
    </div>
  );
}

// Same KPI-drill-down modal, sourced from the real roster instead of
// VM_USERS. Only covers KPIs that have a real equivalent (no "churned" key —
// that tile doesn't exist in real mode; "suspended" replaces it).
function RealAdminKpiModal({ kpiKey, stats, realUsers, onClose }) {
  const users = realUsers || [];

  const StatRow = ({ label, value, sub, bar, barColor, valueColor }) => (
    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 0', borderBottom:`1px solid ${VM.borderHair}` }}>
      <span style={{ flex:1, fontFamily:VM.serif, fontSize:13, color:VM.ink2 }}>{label}</span>
      {bar !== undefined && (
        <div style={{ width:80, height:5, background:VM.border, borderRadius:3, flexShrink:0 }}>
          <div style={{ height:5, borderRadius:3, width:`${Math.min(bar,100)}%`, background: barColor || VM.teal }} />
        </div>
      )}
      <span style={{ fontFamily:VM.mono, fontSize:13, fontWeight:700, color: valueColor || VM.ink, textAlign:'right', minWidth:36 }}>
        {value}
        {sub && <span style={{ fontFamily:VM.mono, fontSize:10, fontWeight:400, color:VM.ink3, marginLeft:3 }}>{sub}</span>}
      </span>
    </div>
  );
  const Section = ({ title, children }) => (
    <div style={{ marginBottom:20 }}>
      <div style={{ fontFamily:VM.mono, fontSize:9, letterSpacing:'0.1em', textTransform:'uppercase', color:VM.ink3, marginBottom:8 }}>{title}</div>
      {children}
    </div>
  );
  const UserRow = ({ u }) => (
    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:`1px solid ${VM.borderHair}` }}>
      <div style={{ width:28, height:28, borderRadius:999, background:VM.paperWarm, border:`1px solid ${VM.border}`,
        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <span style={{ fontFamily:VM.mono, fontSize:10, fontWeight:700, color:VM.ink3 }}>{(u.name || '?')[0].toUpperCase()}</span>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontFamily:VM.serif, fontSize:13, color:VM.ink, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{u.name}</div>
        <div style={{ fontFamily:VM.mono, fontSize:9.5, color:VM.ink3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{u.email}</div>
      </div>
      <span style={{ fontFamily:VM.mono, fontSize:9, padding:'2px 7px', borderRadius:4,
        background: u.plan==='Pro' ? 'rgba(29,158,117,0.15)' : u.plan==='Plus' ? 'rgba(29,158,117,0.10)' : VM.paperWarm,
        color: u.plan==='Free' ? VM.ink3 : VM.teal, border:`1px solid ${u.plan==='Free' ? VM.border : VM.up}` }}>{u.plan}</span>
      <span style={{ fontFamily:VM.mono, fontSize:9.5, color:VM.ink3, flexShrink:0 }}>{u.joined ? aRelReal(u.joined) : '—'}</span>
    </div>
  );

  let title = '', subtitle = '', body = null, csvData = null;

  if (kpiKey === 'total') {
    const recentUsers = [...users].sort((a,b) => (b.joined?.getTime()||0) - (a.joined?.getTime()||0)).slice(0,6);
    csvData = { filename:'vm_users_total_live.csv', headers:['Name','Email','Plan','Status','Joined'], rows:users.map(u=>[u.name,u.email,u.plan,realUserStatus(u),u.joined?aDate(u.joined):'']) };
    title = `${stats.total} Users`;
    subtitle = 'Live — Cognito + activity';
    body = (
      <>
        <Section title="By plan">
          {Object.keys(stats.byPlan).map(p => (
            <StatRow key={p} label={p} value={stats.byPlan[p] || 0}
              sub={stats.total ? `${((stats.byPlan[p]||0)/stats.total*100).toFixed(0)}%` : ''}
              bar={stats.total ? (stats.byPlan[p]||0)/stats.total*100 : 0} barColor={A_PLAN_COLOR[p] || VM.terra} />
          ))}
        </Section>
        <Section title="Recently joined">
          {recentUsers.length ? recentUsers.map(u => <UserRow key={u.id} u={u} />) : <div style={{ fontFamily:VM.serif, fontSize:13, color:VM.ink3 }}>No join-date data yet.</div>}
        </Section>
      </>
    );
  }

  else if (kpiKey === 'new') {
    const now = Date.now();
    const thisWeek  = users.filter(u => u.joined && (now - u.joined.getTime()) <= 7 * DAY_MS).sort((a,b) => b.joined - a.joined);
    const thisMonth = users.filter(u => u.joined && (now - u.joined.getTime()) <= 30 * DAY_MS).sort((a,b) => b.joined - a.joined);
    const peakMonth = Math.max(...stats.months.map(m => m.count), 1);
    csvData = { filename:'vm_users_new_live.csv', headers:['Name','Email','Plan','Joined'], rows:thisMonth.map(u=>[u.name,u.email,u.plan,aDate(u.joined)]) };
    title = `+${stats.newThisWeek} This Week`;
    subtitle = `${stats.newThisMonth} joined in the last 30 days · live`;
    body = (
      <>
        <Section title="Joined this week">
          {thisWeek.length > 0 ? thisWeek.map(u => <UserRow key={u.id} u={u} />) : <div style={{ fontFamily:VM.serif, fontSize:13, color:VM.ink3 }}>No signups in the last 7 days.</div>}
        </Section>
        <Section title="Monthly trend · last 12 months">
          <div style={{ display:'flex', alignItems:'flex-end', gap:4, height:60, marginBottom:8 }}>
            {stats.months.map((m,i) => (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                <div style={{ width:'100%', borderRadius:'3px 3px 0 0', background: i===stats.months.length-1 ? VM.teal : VM.border,
                  height: `${Math.max((m.count/peakMonth)*52, m.count>0?8:2)}px`, transition:'height .2s' }} />
                <span style={{ fontFamily:VM.mono, fontSize:8, color:VM.ink3, writingMode:'vertical-rl', transform:'rotate(180deg)', height:22 }}>{m.label}</span>
              </div>
            ))}
          </div>
        </Section>
        <Section title="Also joined this month">
          {thisMonth.slice(thisWeek.length, thisWeek.length + 8).map(u => <UserRow key={u.id} u={u} />)}
        </Section>
      </>
    );
  }

  else if (kpiKey === 'paying') {
    const payingUsers = users.filter(u => u.planRaw !== 'free');
    const plusActive  = users.filter(u => u.plan==='Plus');
    const proActive   = users.filter(u => u.plan==='Pro');
    const plusMrr     = plusActive.length * (A_PLAN_PRICE.Plus || 0);
    const proMrr      = proActive.length  * (A_PLAN_PRICE.Pro  || 0);
    const arpu        = payingUsers.length ? (stats.mrr / payingUsers.length).toFixed(2) : 0;
    const recentPaying = [...payingUsers].sort((a,b) => (b.joined?.getTime()||0) - (a.joined?.getTime()||0)).slice(0,6);
    csvData = { filename:'vm_users_paying_live.csv', headers:['Name','Email','Plan','Joined'], rows:payingUsers.map(u=>[u.name,u.email,u.plan,u.joined?aDate(u.joined):'']) };
    title = `${stats.paying} Paying Accounts`;
    subtitle = `${stats.total ? (stats.paying/stats.total*100).toFixed(0) : 0}% conversion · ${aMoney(stats.mrr)}/mo est. MRR · live`;
    body = (
      <>
        <Section title="Revenue by plan">
          <StatRow label={`Plus · ${plusActive.length} accounts`} value={aMoney(plusMrr)} sub="/mo" bar={(plusMrr+proMrr) ? plusMrr/(plusMrr+proMrr)*100 : 0} barColor={VM.teal} />
          <StatRow label={`Pro  · ${proActive.length} accounts`}  value={aMoney(proMrr)}  sub="/mo" bar={(plusMrr+proMrr) ? proMrr/(plusMrr+proMrr)*100 : 0}  barColor={VM.forest} />
        </Section>
        <Section title="Key metrics">
          <StatRow label="Conversion rate" value={`${stats.total ? (stats.paying/stats.total*100).toFixed(1) : 0}%`} />
          <StatRow label="ARPU (paying)"   value={`$${arpu}`} sub="/mo" />
          <StatRow label="ARR projection"  value={aMoney(stats.mrr * 12)} />
        </Section>
        <Section title="Recent paying signups">
          {recentPaying.length ? recentPaying.map(u => <UserRow key={u.id} u={u} />) : <div style={{ fontFamily:VM.serif, fontSize:13, color:VM.ink3 }}>None yet.</div>}
        </Section>
      </>
    );
  }

  else if (kpiKey === 'mrr') {
    const plusActive = users.filter(u => u.plan==='Plus');
    const proActive  = users.filter(u => u.plan==='Pro');
    const plusMrr    = plusActive.length * (A_PLAN_PRICE.Plus || 0);
    const proMrr     = proActive.length  * (A_PLAN_PRICE.Pro  || 0);
    csvData = { filename:'vm_mrr_live.csv', headers:['Plan','Accounts','Price/mo','MRR/mo'], rows:[['Plus',plusActive.length,A_PLAN_PRICE.Plus,plusMrr],['Pro',proActive.length,A_PLAN_PRICE.Pro,proMrr],['Total',plusActive.length+proActive.length,'—',stats.mrr]] };
    title = `Est. MRR · ${aMoney(stats.mrr)}`;
    subtitle = 'Live plan data';
    body = (
      <>
        <Section title="Revenue breakdown">
          <StatRow label={`Plus (${plusActive.length} × $${A_PLAN_PRICE.Plus})`} value={aMoney(plusMrr)} sub="/mo" bar={stats.mrr ? plusMrr/stats.mrr*100 : 0} barColor={VM.teal} />
          <StatRow label={`Pro  (${proActive.length} × $${A_PLAN_PRICE.Pro})`}  value={aMoney(proMrr)}  sub="/mo" bar={stats.mrr ? proMrr/stats.mrr*100 : 0}  barColor={VM.forest} />
        </Section>
        <Section title="Projections">
          <StatRow label="Monthly (MRR)" value={aMoney(stats.mrr)} />
          <StatRow label="Quarterly"     value={aMoney(stats.mrr * 3)} />
          <StatRow label="Annual (ARR)"  value={aMoney(stats.mrr * 12)} />
        </Section>
        <div style={{ fontFamily:VM.serif, fontSize:12, color:VM.ink3, marginTop:4 }}>
          Computed from each account's current plan × list price — not pulled from Stripe, so it won't reflect trials, proration, discounts, or annual billing.
        </div>
      </>
    );
  }

  else if (kpiKey === 'suspended') {
    const suspendedUsers = users.filter(u => u.enabled === false);
    csvData = { filename:'vm_users_suspended.csv', headers:['Name','Email','Plan'], rows:suspendedUsers.map(u=>[u.name,u.email,u.plan]) };
    title = `${stats.suspended} Suspended`;
    subtitle = `${stats.total ? (stats.suspended/stats.total*100).toFixed(0) : 0}% of users · live`;
    body = (
      <Section title="Suspended accounts">
        {suspendedUsers.length ? suspendedUsers.map(u => <UserRow key={u.id} u={u} />) : <div style={{ fontFamily:VM.serif, fontSize:13, color:VM.ink3 }}>No suspended accounts.</div>}
      </Section>
    );
  }

  else if (kpiKey === 'courses') {
    const courses = vmGetCourses();
    csvData = { filename:'vm_courses.csv', headers:['Title','Level'], rows:courses.map(c=>[c.title,c.level||'']) };
    title = `${courses.length} Courses`;
    subtitle = 'Catalogue';
    body = (
      <Section title={`Catalogue · ${courses.length} courses`}>
        {courses.map((c,i) => (
          <div key={c.id||i} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:`1px solid ${VM.borderHair}` }}>
            <i className="ti ti-book" style={{ fontSize:13, color:VM.teal, flexShrink:0 }}></i>
            <span style={{ flex:1, fontFamily:VM.serif, fontSize:13, color:VM.ink }}>{c.title}</span>
            {c.level && <span style={{ fontFamily:VM.mono, fontSize:9, color:VM.ink3, background:VM.paperWarm, border:`1px solid ${VM.border}`, borderRadius:4, padding:'1px 6px' }}>{c.level}</span>}
          </div>
        ))}
      </Section>
    );
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:85, display:'flex', alignItems:'center', justifyContent:'center',
      background:'rgba(31,29,26,0.55)', backdropFilter:'blur(3px)' }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ width:'100%', maxWidth:520, maxHeight:'88vh', display:'flex', flexDirection:'column',
        background:VM.paper, border:`1px solid ${VM.border}`, borderRadius:18,
        boxShadow:'0 20px 60px rgba(31,29,26,0.28)', overflow:'hidden' }}>
        <div style={{ padding:'18px 20px 14px', borderBottom:`1px solid ${VM.borderHair}`, flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontFamily:VM.serif, fontWeight:700, fontSize:22, color:VM.ink, lineHeight:1.1 }}>{title}</div>
              <div style={{ fontFamily:VM.serif, fontSize:13, color:VM.ink3, marginTop:3 }}>{subtitle}</div>
            </div>
            <div style={{ display:'flex', gap:6, flexShrink:0, marginLeft:12 }}>
              {csvData && (
                <button onClick={()=>adminDownloadCSV(csvData.filename, csvData.headers, csvData.rows)} title="Download CSV"
                  style={{ display:'inline-flex', alignItems:'center', justifyContent:'center',
                    width:30, height:30, borderRadius:8, border:`1px solid ${VM.borderSoft}`,
                    background:'transparent', color:VM.ink3, cursor:'pointer' }}>
                  <i className="ti ti-download" style={{ fontSize:14 }}></i>
                </button>
              )}
              <button onClick={onClose} style={{ display:'inline-flex', alignItems:'center', justifyContent:'center',
                width:30, height:30, borderRadius:8, border:`1px solid ${VM.borderSoft}`, background:'transparent', color:VM.ink3, cursor:'pointer' }}>
                <i className="ti ti-x" style={{ fontSize:14 }}></i>
              </button>
            </div>
          </div>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'18px 20px' }}>{body}</div>
      </div>
    </div>
  );
}

function AdminChartModal({ chartKey, stats, onClose, real, realUsers }) {
  if (real) return <RealAdminChartModal chartKey={chartKey} stats={stats} realUsers={realUsers} onClose={onClose} />;
  const users = VM_USERS;

  const StatRow = ({ label, value, sub, bar, barColor, valueColor }) => (
    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 0', borderBottom:`1px solid ${VM.borderHair}` }}>
      <span style={{ flex:1, fontFamily:VM.serif, fontSize:13, color:VM.ink2 }}>{label}</span>
      {bar !== undefined && (
        <div style={{ width:100, height:5, background:VM.border, borderRadius:3, flexShrink:0 }}>
          <div style={{ height:5, borderRadius:3, width:`${Math.min(bar,100)}%`, background: barColor || VM.teal }} />
        </div>
      )}
      <span style={{ fontFamily:VM.mono, fontSize:13, fontWeight:700, color: valueColor||VM.ink, textAlign:'right', minWidth:40 }}>
        {value}{sub && <span style={{ fontFamily:VM.mono, fontSize:10, fontWeight:400, color:VM.ink3, marginLeft:3 }}>{sub}</span>}
      </span>
    </div>
  );
  const Section = ({ title, children }) => (
    <div style={{ marginBottom:22 }}>
      <div style={{ fontFamily:VM.mono, fontSize:9, letterSpacing:'0.1em', textTransform:'uppercase', color:VM.ink3, marginBottom:8 }}>{title}</div>
      {children}
    </div>
  );

  let title = '', subtitle = '', body = null, csvData = null;

  if (chartKey === 'signups') {
    const total12 = stats.months.reduce((s,m) => s+m.count, 0);
    const peak    = stats.months.reduce((p,m) => m.count > p.count ? m : p, stats.months[0]);
    const slow    = stats.months.reduce((p,m) => m.count < p.count ? m : p, stats.months[0]);
    const last3   = stats.months.slice(-3).reduce((s,m)=>s+m.count,0);
    const prev3   = stats.months.slice(-6,-3).reduce((s,m)=>s+m.count,0);
    const growth  = prev3 ? (((last3-prev3)/prev3)*100).toFixed(1) : '—';
    const maxCount = Math.max(...stats.months.map(m=>m.count), 1);

    csvData = { filename:'vm_signups.csv', headers:['Month','Signups'], rows:stats.months.map(m=>[m.label,m.count]) };
    title = 'Signups · Last 12 Months';
    subtitle = `${total12} total · peak in ${peak.label}`;
    body = (
      <>
        <Section title="Monthly breakdown">
          {/* tall bar chart */}
          <div style={{ display:'flex', alignItems:'flex-end', gap:5, height:120, marginBottom:16 }}>
            {stats.months.map((m,i) => (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4, height:'100%', justifyContent:'flex-end' }}>
                <span style={{ fontFamily:VM.mono, fontSize:9, color:VM.ink3 }}>{m.count}</span>
                <div style={{ width:'100%', borderRadius:'3px 3px 0 0',
                  background: i===stats.months.length-1 ? VM.forest : m.count===peak.count ? VM.teal : VM.tealTint2,
                  height:`${Math.max((m.count/maxCount)*90,m.count>0?6:2)}px` }} />
                <span style={{ fontFamily:VM.mono, fontSize:8, color:VM.ink3 }}>{m.label}</span>
              </div>
            ))}
          </div>
          {/* table */}
          {stats.months.map((m,i) => (
            <StatRow key={i} label={m.label} value={m.count} sub="signups"
              bar={m.count/maxCount*100} barColor={i===stats.months.length-1 ? VM.forest : VM.teal} />
          ))}
        </Section>
        <Section title="Period analysis">
          <StatRow label="Total (12 months)"         value={total12} />
          <StatRow label="Monthly average"           value={(total12/12).toFixed(1)} />
          <StatRow label={`Peak month (${peak.label})`}  value={peak.count} barColor={VM.upInk} bar={100} />
          <StatRow label={`Slowest (${slow.label})`}    value={slow.count} barColor={VM.terra} bar={slow.count/peak.count*100} />
          <StatRow label="Last 3 months"             value={last3} />
          <StatRow label="Prior 3 months"            value={prev3} />
          <StatRow label="3-month growth"            value={`${growth}%`} valueColor={parseFloat(growth)>=0 ? VM.upInk : VM.downInk} />
        </Section>
      </>
    );
  }

  else if (chartKey === 'plans') {
    const planData = [
      { label:'Free', value:stats.byPlan.Free, color:A_PLAN_COLOR.Free, price:0 },
      { label:'Plus', value:stats.byPlan.Plus, color:A_PLAN_COLOR.Plus, price:A_PLAN_PRICE.Plus },
      { label:'Pro',  value:stats.byPlan.Pro,  color:A_PLAN_COLOR.Pro,  price:A_PLAN_PRICE.Pro  },
    ];
    // by status per plan
    const planStatus = {};
    ['Free','Plus','Pro'].forEach(p => {
      planStatus[p] = { active:0, trial:0, churned:0 };
      users.filter(u=>u.plan===p).forEach(u => planStatus[p][u.status]++);
    });
    csvData = { filename:'vm_plans.csv', headers:['Plan','Users','%','Active','Trial','Churned'], rows:planData.map(p=>[p.label,p.value,(p.value/stats.total*100).toFixed(0)+'%',planStatus[p.label].active,planStatus[p.label].trial,planStatus[p.label].churned]) };
    title = 'Plan Distribution';
    subtitle = `${stats.total} users across 3 tiers`;
    body = (
      <>
        <Section title="Plan breakdown">
          <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}>
            <AdminDonut data={planData} size={160} thickness={22} center={stats.total} centerLabel="USERS" />
          </div>
          {planData.map(p => (
            <StatRow key={p.label} label={p.label}
              value={p.value} sub={`${(p.value/stats.total*100).toFixed(0)}%`}
              bar={p.value/stats.total*100} barColor={p.color} />
          ))}
        </Section>
        <Section title="Status by plan">
          {planData.map(p => (
            <div key={p.label} style={{ marginBottom:14 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:5 }}>
                <span style={{ width:8, height:8, borderRadius:2, background:p.color, flexShrink:0 }}></span>
                <span style={{ fontFamily:VM.mono, fontSize:10, color:VM.ink2, fontWeight:700 }}>{p.label}</span>
              </div>
              {[['active',VM.upInk],['trial',VM.terra],['churned',VM.downInk]].map(([s,c]) => (
                <div key={s} style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 0 4px 14px' }}>
                  <span style={{ flex:1, fontFamily:VM.serif, fontSize:12, color:VM.ink3 }}>{s[0].toUpperCase()+s.slice(1)}</span>
                  <div style={{ width:80, height:4, background:VM.border, borderRadius:2 }}>
                    <div style={{ height:4, borderRadius:2, background:c, width:`${p.value ? planStatus[p.label][s]/p.value*100 : 0}%` }} />
                  </div>
                  <span style={{ fontFamily:VM.mono, fontSize:12, fontWeight:700, color:c, minWidth:22, textAlign:'right' }}>{planStatus[p.label][s]}</span>
                </div>
              ))}
            </div>
          ))}
        </Section>
        <Section title="Revenue by plan">
          {planData.filter(p=>p.price>0).map(p => {
            const activePaying = planStatus[p.label].active + planStatus[p.label].trial;
            return <StatRow key={p.label} label={`${p.label} · ${activePaying} active × $${p.price}`}
              value={`$${activePaying*p.price}`} sub="/mo" bar={activePaying*p.price/stats.mrr*100} barColor={p.color} />;
          })}
          <StatRow label="Total MRR" value={`$${stats.mrr}`} sub="/mo" />
        </Section>
      </>
    );
  }

  else if (chartKey === 'countries') {
    // all countries from VM_USERS
    const byCountry = {};
    users.forEach(u => { byCountry[u.country] = (byCountry[u.country]||0)+1; });
    const allCountries = Object.entries(byCountry).sort((a,b)=>b[1]-a[1]);
    const maxN = allCountries[0]?.[1] || 1;
    // plan breakdown for top countries
    const topPlanByCountry = {};
    allCountries.slice(0,5).forEach(([c]) => {
      topPlanByCountry[c] = { Free:0, Plus:0, Pro:0 };
      users.filter(u=>u.country===c).forEach(u => topPlanByCountry[c][u.plan]++);
    });
    csvData = { filename:'vm_countries.csv', headers:['Country','Users','%'], rows:allCountries.map(([c,n])=>[c,n,(n/stats.total*100).toFixed(0)+'%']) };
    title = 'Users by Country';
    subtitle = `${allCountries.length} countries represented`;
    body = (
      <>
        <Section title={`All countries (${allCountries.length})`}>
          {allCountries.map(([c,n]) => (
            <StatRow key={c} label={c} value={n} sub={`${(n/stats.total*100).toFixed(0)}%`}
              bar={n/maxN*100} barColor={VM.teal} />
          ))}
        </Section>
        <Section title="Plan mix · top 5 countries">
          {allCountries.slice(0,5).map(([c,n]) => {
            const pm = topPlanByCountry[c];
            return (
              <div key={c} style={{ marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontFamily:VM.serif, fontSize:13, color:VM.ink }}>{c}</span>
                  <span style={{ fontFamily:VM.mono, fontSize:12, color:VM.ink3 }}>{n} users</span>
                </div>
                <div style={{ display:'flex', height:8, borderRadius:4, overflow:'hidden' }}>
                  {[['Free',A_PLAN_COLOR.Free],['Plus',A_PLAN_COLOR.Plus],['Pro',A_PLAN_COLOR.Pro]].map(([p,col]) => (
                    pm[p] > 0 ? <div key={p} title={`${p}: ${pm[p]}`} style={{ flex:pm[p], background:col }} /> : null
                  ))}
                </div>
                <div style={{ display:'flex', gap:10, marginTop:3 }}>
                  {[['Free',A_PLAN_COLOR.Free],['Plus',A_PLAN_COLOR.Plus],['Pro',A_PLAN_COLOR.Pro]].map(([p,col]) => (
                    <span key={p} style={{ fontFamily:VM.mono, fontSize:9, color:VM.ink3 }}>
                      <span style={{ display:'inline-block', width:6, height:6, borderRadius:2, background:col, marginRight:3, verticalAlign:'middle' }}></span>
                      {p} {pm[p]}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </Section>
      </>
    );
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:85, display:'flex', alignItems:'center', justifyContent:'center',
      background:'rgba(31,29,26,0.55)', backdropFilter:'blur(3px)' }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ width:'100%', maxWidth:560, maxHeight:'88vh', display:'flex', flexDirection:'column',
        background:VM.paper, border:`1px solid ${VM.border}`, borderRadius:18,
        boxShadow:'0 20px 60px rgba(31,29,26,0.28)', overflow:'hidden' }}>
        <div style={{ padding:'18px 20px 14px', borderBottom:`1px solid ${VM.borderHair}`, flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontFamily:VM.serif, fontWeight:700, fontSize:22, color:VM.ink, lineHeight:1.1 }}>{title}</div>
              <div style={{ fontFamily:VM.serif, fontSize:13, color:VM.ink3, marginTop:3 }}>{subtitle}</div>
            </div>
            <div style={{ display:'flex', gap:6, flexShrink:0, marginLeft:12 }}>
              {csvData && (
                <button onClick={()=>adminDownloadCSV(csvData.filename, csvData.headers, csvData.rows)} title="Download CSV"
                  style={{ display:'inline-flex', alignItems:'center', justifyContent:'center',
                    width:30, height:30, borderRadius:8, border:`1px solid ${VM.borderSoft}`,
                    background:'transparent', color:VM.ink3, cursor:'pointer' }}>
                  <i className="ti ti-download" style={{ fontSize:14 }}></i>
                </button>
              )}
              <button onClick={onClose} style={{ display:'inline-flex', alignItems:'center', justifyContent:'center',
                width:30, height:30, borderRadius:8, border:`1px solid ${VM.borderSoft}`, background:'transparent',
                color:VM.ink3, cursor:'pointer' }}>
                <i className="ti ti-x" style={{ fontSize:14 }}></i>
              </button>
            </div>
          </div>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'18px 20px' }}>{body}</div>
      </div>
    </div>
  );
}

// Same chart drill-down, sourced from the real roster. No "countries" case —
// that card doesn't render in real mode (country was never captured).
function RealAdminChartModal({ chartKey, stats, realUsers, onClose }) {
  const users = realUsers || [];

  const StatRow = ({ label, value, sub, bar, barColor, valueColor }) => (
    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 0', borderBottom:`1px solid ${VM.borderHair}` }}>
      <span style={{ flex:1, fontFamily:VM.serif, fontSize:13, color:VM.ink2 }}>{label}</span>
      {bar !== undefined && (
        <div style={{ width:100, height:5, background:VM.border, borderRadius:3, flexShrink:0 }}>
          <div style={{ height:5, borderRadius:3, width:`${Math.min(bar,100)}%`, background: barColor || VM.teal }} />
        </div>
      )}
      <span style={{ fontFamily:VM.mono, fontSize:13, fontWeight:700, color: valueColor||VM.ink, textAlign:'right', minWidth:40 }}>
        {value}{sub && <span style={{ fontFamily:VM.mono, fontSize:10, fontWeight:400, color:VM.ink3, marginLeft:3 }}>{sub}</span>}
      </span>
    </div>
  );
  const Section = ({ title, children }) => (
    <div style={{ marginBottom:22 }}>
      <div style={{ fontFamily:VM.mono, fontSize:9, letterSpacing:'0.1em', textTransform:'uppercase', color:VM.ink3, marginBottom:8 }}>{title}</div>
      {children}
    </div>
  );

  let title = '', subtitle = '', body = null, csvData = null;

  if (chartKey === 'signups') {
    const total12  = stats.months.reduce((s,m) => s+m.count, 0);
    const peak     = stats.months.reduce((p,m) => m.count > p.count ? m : p, stats.months[0]);
    const slow     = stats.months.reduce((p,m) => m.count < p.count ? m : p, stats.months[0]);
    const last3    = stats.months.slice(-3).reduce((s,m)=>s+m.count,0);
    const prev3    = stats.months.slice(-6,-3).reduce((s,m)=>s+m.count,0);
    const growth   = prev3 ? (((last3-prev3)/prev3)*100).toFixed(1) : '—';
    const maxCount = Math.max(...stats.months.map(m=>m.count), 1);

    csvData = { filename:'vm_signups_live.csv', headers:['Month','Signups'], rows:stats.months.map(m=>[m.label,m.count]) };
    title = 'Signups · Last 12 Months';
    subtitle = `${total12} total · peak in ${peak.label} · live`;
    body = (
      <>
        <Section title="Monthly breakdown">
          <div style={{ display:'flex', alignItems:'flex-end', gap:5, height:120, marginBottom:16 }}>
            {stats.months.map((m,i) => (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4, height:'100%', justifyContent:'flex-end' }}>
                <span style={{ fontFamily:VM.mono, fontSize:9, color:VM.ink3 }}>{m.count}</span>
                <div style={{ width:'100%', borderRadius:'3px 3px 0 0',
                  background: i===stats.months.length-1 ? VM.forest : m.count===peak.count ? VM.teal : VM.tealTint2,
                  height:`${Math.max((m.count/maxCount)*90,m.count>0?6:2)}px` }} />
                <span style={{ fontFamily:VM.mono, fontSize:8, color:VM.ink3 }}>{m.label}</span>
              </div>
            ))}
          </div>
          {stats.months.map((m,i) => (
            <StatRow key={i} label={m.label} value={m.count} sub="signups"
              bar={m.count/maxCount*100} barColor={i===stats.months.length-1 ? VM.forest : VM.teal} />
          ))}
        </Section>
        <Section title="Period analysis">
          <StatRow label="Total (12 months)"        value={total12} />
          <StatRow label="Monthly average"          value={(total12/12).toFixed(1)} />
          <StatRow label={`Peak month (${peak.label})`} value={peak.count} barColor={VM.upInk} bar={100} />
          <StatRow label={`Slowest (${slow.label})`}   value={slow.count} barColor={VM.terra} bar={peak.count ? slow.count/peak.count*100 : 0} />
          <StatRow label="Last 3 months"            value={last3} />
          <StatRow label="Prior 3 months"           value={prev3} />
          <StatRow label="3-month growth"           value={`${growth}%`} valueColor={parseFloat(growth)>=0 ? VM.upInk : VM.downInk} />
        </Section>
      </>
    );
  }

  else if (chartKey === 'plans') {
    const planLabels = Object.keys(stats.byPlan);
    const planData = planLabels.map(l => ({ label:l, value: stats.byPlan[l]||0, color:A_PLAN_COLOR[l]||VM.terra, price: A_PLAN_PRICE[l]||0 }));
    csvData = { filename:'vm_plans_live.csv', headers:['Plan','Users','%'], rows:planData.map(p=>[p.label,p.value,stats.total?(p.value/stats.total*100).toFixed(0)+'%':'0%']) };
    title = 'Plan Distribution';
    subtitle = `${stats.total} users · live`;
    body = (
      <Section title="Plan breakdown">
        <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}>
          <AdminDonut data={planData} size={160} thickness={22} center={stats.total} centerLabel="USERS" />
        </div>
        {planData.map(p => (
          <StatRow key={p.label} label={p.label}
            value={p.value} sub={stats.total ? `${(p.value/stats.total*100).toFixed(0)}%` : '0%'}
            bar={stats.total ? p.value/stats.total*100 : 0} barColor={p.color} />
        ))}
      </Section>
    );
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:85, display:'flex', alignItems:'center', justifyContent:'center',
      background:'rgba(31,29,26,0.55)', backdropFilter:'blur(3px)' }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ width:'100%', maxWidth:560, maxHeight:'88vh', display:'flex', flexDirection:'column',
        background:VM.paper, border:`1px solid ${VM.border}`, borderRadius:18,
        boxShadow:'0 20px 60px rgba(31,29,26,0.28)', overflow:'hidden' }}>
        <div style={{ padding:'18px 20px 14px', borderBottom:`1px solid ${VM.borderHair}`, flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontFamily:VM.serif, fontWeight:700, fontSize:22, color:VM.ink, lineHeight:1.1 }}>{title}</div>
              <div style={{ fontFamily:VM.serif, fontSize:13, color:VM.ink3, marginTop:3 }}>{subtitle}</div>
            </div>
            <div style={{ display:'flex', gap:6, flexShrink:0, marginLeft:12 }}>
              {csvData && (
                <button onClick={()=>adminDownloadCSV(csvData.filename, csvData.headers, csvData.rows)} title="Download CSV"
                  style={{ display:'inline-flex', alignItems:'center', justifyContent:'center',
                    width:30, height:30, borderRadius:8, border:`1px solid ${VM.borderSoft}`,
                    background:'transparent', color:VM.ink3, cursor:'pointer' }}>
                  <i className="ti ti-download" style={{ fontSize:14 }}></i>
                </button>
              )}
              <button onClick={onClose} style={{ display:'inline-flex', alignItems:'center', justifyContent:'center',
                width:30, height:30, borderRadius:8, border:`1px solid ${VM.borderSoft}`, background:'transparent',
                color:VM.ink3, cursor:'pointer' }}>
                <i className="ti ti-x" style={{ fontSize:14 }}></i>
              </button>
            </div>
          </div>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'18px 20px' }}>{body}</div>
      </div>
    </div>
  );
}

function AdminCard({ title, children, dataTour, onOpen }) {
  return (
    <section data-tour={dataTour} style={{ background: VM.paper, border: `1px solid ${VM.borderSoft}`, borderRadius: 14, overflow: 'hidden' }}>
      <header style={{ padding: '10px 16px', borderBottom: `1px solid ${VM.borderHair}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontFamily: VM.mono, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: VM.ink3, fontWeight: 700 }}>{title}</span>
        {onOpen && (
          <button onClick={onOpen} style={{ display:'inline-flex', alignItems:'center', gap:5, fontFamily:VM.mono, fontSize:9,
            letterSpacing:'0.05em', textTransform:'uppercase', padding:'3px 9px', borderRadius:5,
            border:`1px solid ${VM.border}`, background:'transparent', color:VM.ink3, cursor:'pointer' }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor=VM.teal; e.currentTarget.style.color=VM.teal; }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor=VM.border; e.currentTarget.style.color=VM.ink3; }}>
            Open ↗
          </button>
        )}
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
const A_USER_COLS = '1.7fr 0.6fr 0.8fr 0.9fr 0.7fr 34px';
function UsersTab({ onAccess, isMobile }) {
  const { users: realUsers, loading: realLoading, refresh: refreshRealUsers } = useRealAdminUsers();
  const real = !!realUsers;

  // Every hook this component uses must run on every render (Rules of
  // Hooks) — the loading spinner below is an early *render* branch, not an
  // early *return*, so it can't skip any of these.
  const [q, setQ] = useStateAdmin('');
  const [status, setStatus] = useStateAdmin('all');
  const [shown, setShown] = useStateAdmin(40);
  const [detail, setDetail] = useStateAdmin(null);
  const [pendingAction, setPendingAction] = useStateAdmin(null);
  const [toast, setToast] = useStateAdmin('');

  // While the real roster is still loading, show a spinner rather than the
  // 100-user mock set — that was flashing full (but fake) content on every
  // load, not just a genuine "live data unavailable" fallback.
  if (realLoading) {
    return (
      <div style={{ padding: '48px 16px', textAlign: 'center', fontFamily: VM.mono, fontSize: 11, color: VM.ink3 }}>
        <i className="ti ti-loader-2" style={{ fontSize: 18 }}></i> Loading live user data…
      </div>
    );
  }

  const source = real ? realUsers : VM_USERS;
  const statusMap = real ? A_STATUS_REAL : A_STATUS;
  const statusFilters = real ? ['all', 'active', 'inactive', 'unconfirmed', 'suspended'] : ['all', 'active', 'trial', 'churned'];
  const statusOf = (u) => real ? realUserStatus(u) : u.status;

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 3000); };
  const access = (u) => { setDetail(null); onAccess(u); };
  const actionDone = (msg) => { setPendingAction(null); setDetail(null); if (real) refreshRealUsers(); showToast(msg); };
  const term = q.trim().toLowerCase();
  const rows = source.filter(u => {
    if (status !== 'all' && statusOf(u) !== status) return false;
    if (term && !(u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term))) return false;
    return true;
  });
  const visible = rows.slice(0, shown);
  return (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 1, minWidth: 220, background: VM.paper, border: `1px solid ${VM.border}`, borderRadius: 10, padding: '9px 13px' }}>
          <i className="ti ti-search" style={{ fontSize: 15, color: VM.ink3 }}></i>
          <input value={q} onChange={e => { setQ(e.target.value); setShown(40); }} placeholder="Search name or email…"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: VM.serif, fontSize: 14, color: VM.ink }} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {statusFilters.map(s => (
            <Pill key={s} active={status === s} onClick={() => { setStatus(s); setShown(40); }}>{s === 'all' ? 'All' : statusMap[s].label}</Pill>
          ))}
        </div>
      </div>
      <Mono size={10.5} color={real ? VM.upInk : VM.ink3} style={{ display: 'block', marginBottom: 8 }}>
        {rows.length} of {source.length} users{real ? ' · live (Cognito + activity)' : realLoading ? ' · loading live data…' : ' · mock (live data unavailable)'}
      </Mono>
      <div style={{ background: VM.paper, border: `1px solid ${VM.borderSoft}`, borderRadius: 12, overflowX: 'auto' }}>
        <div style={{ minWidth: isMobile ? 560 : 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: A_USER_COLS, gap: 8, padding: '9px 16px', background: VM.paperWarm, borderBottom: `1px solid ${VM.borderSoft}`, borderRadius: '12px 12px 0 0' }}>
            {['User', 'Plan', 'Status', 'Joined', 'Active', ''].map((h, i) => <Label key={i} style={{ textAlign: i === 1 || i === 2 ? 'center' : 'left' }}>{h}</Label>)}
          </div>
          {visible.map((u, i) => (
            <UserRow key={u.id} u={u} real={real} last={i === visible.length - 1} onView={setDetail} onAccess={access}
              onAction={(type) => setPendingAction({ type, user: u })} onToast={showToast} />
          ))}
          {visible.length === 0 && (
            <div style={{ padding: '32px 16px', textAlign: 'center', fontFamily: VM.serif, color: VM.ink3 }}>
              {source.length === 0 ? 'No users yet.' : 'No users match.'}
            </div>
          )}
        </div>
      </div>
      {rows.length > visible.length && (
        <div style={{ marginTop: 14, textAlign: 'center' }}>
          <Btn onClick={() => setShown(s => s + 40)}><i className="ti ti-chevron-down" style={{ fontSize: 15 }}></i>Show more</Btn>
        </div>
      )}
      {detail && <UserDetailModal u={detail} real={real} onClose={() => setDetail(null)} onAccess={access}
        onAction={(type) => setPendingAction({ type, user: detail })} onToast={showToast} />}
      {pendingAction && <AdminActionModal pending={pendingAction} onClose={() => setPendingAction(null)} onDone={actionDone} onToast={showToast} />}
      {toast && <AdminToast text={toast} />}
    </div>
  );
}

// One user row + its ⋮ actions menu (rendered fixed-position so it isn't
// clipped). Real rows' mutating actions (suspend/reactivate/delete/change
// plan) route through `onAction` → AdminActionModal for confirmation before
// anything actually happens — none of them fire directly from this menu.
function UserRow({ u, real, last, onView, onAccess, onAction, onToast }) {
  const [open, setOpen] = useStateAdmin(false);
  const [pos, setPos] = useStateAdmin({ top: 0, left: 0 });
  const btnRef = React.useRef(null);
  const openMenu = () => {
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 5, left: Math.max(8, r.right - 210) });
    setOpen(true);
  };
  const act = (fn) => { setOpen(false); fn(); };
  const statusMap = real ? A_STATUS_REAL : A_STATUS;
  const statusKey = real ? realUserStatus(u) : u.status;
  const st = statusMap[statusKey];
  const sendReset = async () => {
    try { await vmForgotPassword(u.email); onToast('Password reset email sent to ' + u.email + '.'); }
    catch (e) { onToast(e.message || 'Could not send reset email.'); }
  };
  return (
    <React.Fragment>
      <div style={{ display: 'grid', gridTemplateColumns: A_USER_COLS, gap: 8, alignItems: 'center', padding: '10px 16px', borderBottom: last ? 'none' : `1px solid ${VM.borderHair}` }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: VM.serif, fontSize: 14, fontWeight: 600, color: VM.ink }}>{u.name}</div>
          <Mono size={10} color={VM.ink3} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{u.email}</Mono>
        </div>
        <div style={{ textAlign: 'center' }}>
          {u.isBeta ? (
            <span style={{ fontFamily: VM.mono, fontSize: 8.5, fontWeight: 700, letterSpacing: '0.04em', padding: '2px 7px', borderRadius: 5,
              color: VM.rustDeep || VM.terra, background: 'rgba(196,106,59,0.14)', border: `1px solid ${VM.terra}` }}>PRO-BETA</span>
          ) : (
            <Mono size={10.5} weight={600} color={A_PLAN_COLOR[u.plan] || VM.ink2}>{u.plan}</Mono>
          )}
        </div>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontFamily: VM.mono, fontSize: 8.5, fontWeight: 700, letterSpacing: '0.04em', padding: '2px 7px', borderRadius: 5, color: st.fg, background: st.bg, border: `1px solid ${st.bd}` }}>{st.label}</span>
        </div>
        <Mono size={11} color={VM.ink3}>{u.joined ? aDate(u.joined) : '—'}</Mono>
        <Mono size={10.5} color={VM.ink3}>{u.lastActive ? (real ? aRelReal(u.lastActive) : aRel(u.lastActive)) : 'never'}</Mono>
        <button ref={btnRef} title="More" onClick={openMenu} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${open ? VM.border : 'transparent'}`, background: open ? VM.paperWarm : 'transparent', color: VM.ink2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, justifySelf: 'end' }}>
          <i className="ti ti-dots-vertical" style={{ fontSize: 16 }}></i>
        </button>
      </div>
      {open && (
        <React.Fragment>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 70 }}></div>
          <div style={{ position: 'fixed', top: pos.top, left: pos.left, width: 212, zIndex: 71, background: VM.paper, border: `1px solid ${VM.border}`, borderRadius: 10, boxShadow: '0 12px 30px rgba(31,29,26,0.18)', padding: 5 }}>
            <MenuItem icon="user-circle" label="View account details" onClick={() => act(() => onView(u))} />
            <MenuItem icon="login-2" label="Access account" tint={VM.teal} onClick={() => act(() => onAccess(u))} />
            <div style={{ height: 1, background: VM.borderHair, margin: '5px 4px' }}></div>
            {real ? (
              <React.Fragment>
                <MenuItem icon="mail" label="Email user" onClick={() => act(() => { window.location.href = 'mailto:' + u.email; })} />
                <MenuItem icon="key" label="Send password reset" onClick={() => act(sendReset)} />
                <MenuItem icon="arrows-exchange" label="Change plan" onClick={() => act(() => onAction('plan'))} />
                <div style={{ height: 1, background: VM.borderHair, margin: '5px 4px' }}></div>
                <MenuItem icon="ban" label={statusKey === 'suspended' ? 'Reactivate user' : 'Suspend user'} danger
                  onClick={() => act(() => onAction(statusKey === 'suspended' ? 'reactivate' : 'suspend'))} />
                <MenuItem icon="trash" label="Delete user" danger onClick={() => act(() => onAction('delete'))} />
              </React.Fragment>
            ) : (
              <React.Fragment>
                <MenuItem icon="mail" label="Email user" onClick={() => act(() => onToast('Opened email composer (mock).'))} />
                <MenuItem icon="key" label="Reset password" onClick={() => act(() => onToast('Password reset link sent (mock).'))} />
                <MenuItem icon="arrows-exchange" label="Change plan" onClick={() => act(() => onToast('Plan change (mock).'))} />
                <div style={{ height: 1, background: VM.borderHair, margin: '5px 4px' }}></div>
                <MenuItem icon="ban" label={u.status === 'churned' ? 'Reactivate user' : 'Suspend user'} danger onClick={() => act(() => onToast((u.status === 'churned' ? 'Reactivated' : 'Suspended') + ' ' + u.name + ' (mock).'))} />
                <MenuItem icon="trash" label="Delete user" danger onClick={() => act(() => onToast('Deleted ' + u.name + ' (mock).'))} />
              </React.Fragment>
            )}
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

function useAdminUserActivity(sub, enabled) {
  const [state, setState] = useStateAdmin({ events: null, loading: !!enabled });
  React.useEffect(() => {
    if (!enabled || !sub) { setState({ events: null, loading: false }); return; }
    let alive = true;
    setState(s => ({ ...s, loading: true }));
    vmAdminAnalytics('user', sub).then(d => { if (alive) setState({ events: (d && d.events) || [], loading: false }); });
    return () => { alive = false; };
  }, [sub, enabled]);
  return state;
}

// Full account details + admin actions. Real users get a real recent-activity
// timeline instead of the mock's fabricated "Personal profits".
function UserDetailModal({ u, real, onClose, onAccess, onAction, onToast }) {
  const initials = u.name.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
  const activity = useAdminUserActivity(u.id, real);   // always called (rules of hooks); no-op when !real

  if (real) {
    const st = A_STATUS_REAL[realUserStatus(u)];
    const detail = [
      ['User ID', u.id], ['Plan', u.isBeta ? 'PRO-BETA' : u.plan], ['Status', st.label],
      ['Joined', u.joined ? aDate(u.joined) : '—'],
      ['Last active', u.lastActive ? aRelReal(u.lastActive) : 'never'],
      ['Events captured', u.eventCount.toLocaleString('en-US')],
    ];
    return (
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(31,29,26,0.42)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 560, maxHeight: '88vh', overflowY: 'auto', background: VM.paper, border: `1px solid ${VM.border}`, borderRadius: 16, boxShadow: '0 24px 60px rgba(31,29,26,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 22px', borderBottom: `1px solid ${VM.borderHair}` }}>
            <span style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, background: VM.forest, color: VM.paperWarm, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: VM.serif, fontWeight: 700, fontSize: 18 }}>{initials}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: VM.serif, fontWeight: 700, fontSize: 20 }}>{u.name}</div>
              <Mono size={11} color={VM.ink3}>{u.email}</Mono>
            </div>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${VM.border}`, background: VM.paper, color: VM.ink2, cursor: 'pointer' }}><i className="ti ti-x" style={{ fontSize: 15 }}></i></button>
          </div>
          <div style={{ padding: '18px 22px' }}>
            <Label>Account details</Label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginTop: 10 }}>
              {detail.map(([k, v]) => (
                <div key={k}><Mono size={9.5} color={VM.ink3} style={{ letterSpacing: '0.04em', textTransform: 'uppercase' }}>{k}</Mono>
                  <div style={{ fontFamily: VM.serif, fontSize: 15, color: VM.ink, marginTop: 2, wordBreak: 'break-all' }}>{v}</div></div>
              ))}
            </div>
            {u.favourites.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Mono size={9.5} color={VM.ink3} style={{ letterSpacing: '0.04em', textTransform: 'uppercase' }}>Favourited</Mono>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                  {u.favourites.map(t => <span key={t} style={{ fontFamily: VM.mono, fontSize: 11, padding: '3px 8px', borderRadius: 999, background: VM.paperWarm, border: `1px solid ${VM.border}`, color: VM.ink2 }}>{t}</span>)}
                </div>
              </div>
            )}
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${VM.borderHair}` }}>
              <Label>Recent activity</Label>
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column' }}>
                {activity.loading && <Mono size={11} color={VM.ink3}>Loading…</Mono>}
                {!activity.loading && activity.events && activity.events.length === 0 && <Mono size={11} color={VM.ink3}>No events captured yet.</Mono>}
                {!activity.loading && activity.events && activity.events.slice(0, 12).map((e, i, a) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '6px 0', borderBottom: i < a.length - 1 ? `1px solid ${VM.borderHair}` : 'none' }}>
                    <Mono size={11} color={VM.ink2}>{e.type}{e.props && e.props.ticker ? ` · ${e.props.ticker}` : ''}{e.page ? ` · ${e.page}` : ''}</Mono>
                    <Mono size={10} color={VM.ink3} style={{ flexShrink: 0 }}>{aRelReal(new Date(e.ts))}</Mono>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '14px 22px', borderTop: `1px solid ${VM.borderHair}`, background: VM.paperWarm, borderRadius: '0 0 16px 16px' }}>
            <Btn solid onClick={() => onAccess(u)}><i className="ti ti-login-2" style={{ fontSize: 15 }}></i>Access account</Btn>
            <Btn onClick={async () => { try { await vmForgotPassword(u.email); onToast('Password reset email sent.'); } catch (e) { onToast(e.message || 'Could not send reset email.'); } }}>
              <i className="ti ti-key" style={{ fontSize: 15 }}></i>Send password reset
            </Btn>
            <Btn onClick={() => onAction('plan')}><i className="ti ti-arrows-exchange" style={{ fontSize: 15 }}></i>Change plan</Btn>
            <Btn onClick={() => onAction(realUserStatus(u) === 'suspended' ? 'reactivate' : 'suspend')} style={{ color: VM.downInk, borderColor: VM.downInk }}>
              <i className="ti ti-ban" style={{ fontSize: 15 }}></i>{realUserStatus(u) === 'suspended' ? 'Reactivate' : 'Suspend'}
            </Btn>
            <Btn onClick={() => onAction('delete')} style={{ color: VM.downInk, borderColor: VM.downInk, marginLeft: 'auto' }}>
              <i className="ti ti-trash" style={{ fontSize: 15 }}></i>Delete
            </Btn>
          </div>
        </div>
      </div>
    );
  }

  // ── mock fallback ──
  const isBeta = !real && u.role === 'beta';
  const p = vmUserProfits(u);
  const detail = [
    ['User ID',    '#' + u.id],
    ['Plan',       u.plan],
    ['Status',     A_STATUS[u.status] ? A_STATUS[u.status].label : u.status],
    ['Role',       isBeta ? 'Beta tester' : 'Standard'],
    ['Joined',     aDate(u.joined)],
    ['Last active', aRelNow(u.lastActive)],
    ...(isBeta ? [['Invite token', u.inviteToken || '—']] : [['Country', u.country]]),
  ];

  const handleDelete = () => {
    if (!isBeta) { onToast('Deleted ' + u.name + ' (mock).'); return; }
    if (!window.loadBetaUsers || !window.saveBetaUsers) return;
    const all = window.loadBetaUsers().filter(b => b.id !== u.id);
    window.saveBetaUsers(all);
    onToast(u.name + ' removed from beta.');
    onClose();
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(31,29,26,0.42)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 500, maxHeight: '88vh', overflowY: 'auto', background: VM.paper, border: `1px solid ${VM.border}`, borderRadius: 16, boxShadow: '0 24px 60px rgba(31,29,26,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 22px', borderBottom: `1px solid ${VM.borderHair}` }}>
          <span style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, background: VM.forest, color: VM.paperWarm, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: VM.serif, fontWeight: 700, fontSize: 18 }}>{initials}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: VM.serif, fontWeight: 700, fontSize: 20 }}>{u.name}</div>
            <Mono size={11} color={VM.ink3}>{u.email}</Mono>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${VM.border}`, background: VM.paper, color: VM.ink2, cursor: 'pointer' }}><i className="ti ti-x" style={{ fontSize: 15 }}></i></button>
        </div>
        <div style={{ padding: '18px 22px' }}>
          <Label>Account details</Label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginTop: 10 }}>
            {detail.map(([k, v]) => (
              <div key={k}>
                <Mono size={9.5} color={VM.ink3} style={{ letterSpacing: '0.04em', textTransform: 'uppercase' }}>{k}</Mono>
                <div style={{ fontFamily: VM.serif, fontSize: 15, color: VM.ink, marginTop: 2, wordBreak: 'break-all' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '14px 22px', borderTop: `1px solid ${VM.borderHair}`, background: VM.paperWarm, borderRadius: '0 0 16px 16px' }}>
          <Btn solid onClick={() => onAccess(u)}><i className="ti ti-login-2" style={{ fontSize: 15 }}></i>Access account</Btn>
          <Btn onClick={() => onToast('Password reset sent (coming soon).')}><i className="ti ti-key" style={{ fontSize: 15 }}></i>Reset password</Btn>
          <Btn onClick={handleDelete} style={{ color: VM.downInk, borderColor: VM.downInk, marginLeft: 'auto' }}><i className="ti ti-trash" style={{ fontSize: 15 }}></i>Remove</Btn>
        </div>
      </div>
    </div>
  );
}

// Confirmation for every real, mutating admin action (suspend/reactivate/
// delete/change plan) — nothing in UserRow or UserDetailModal calls
// vmAdminAction directly; it all routes through here first. Delete requires
// typing DELETE (matches the account's own self-delete flow); suspend/delete
// get a plain-language warning either way.
function AdminActionModal({ pending, onClose, onDone, onToast }) {
  const { type, user } = pending;
  const [busy, setBusy] = useStateAdmin(false);
  const [confirmText, setConfirmText] = useStateAdmin('');
  const [plan, setPlan] = useStateAdmin(user.planRaw || 'free');

  const needsTypedConfirm = type === 'delete';
  const ready = !needsTypedConfirm || confirmText.trim().toUpperCase() === 'DELETE';

  const COPY = {
    suspend:    { title: 'Suspend this account?', body: `${user.name} won't be able to sign in until reactivated. No data is deleted.`, actionLabel: 'Suspend', danger: true },
    reactivate: { title: 'Reactivate this account?', body: `${user.name} will be able to sign in again immediately.`, actionLabel: 'Reactivate', danger: false },
    delete:     { title: 'Permanently delete this account?', body: `This deletes ${user.name}'s real Cognito account. This cannot be undone.`, actionLabel: 'Delete account', danger: true },
    plan:       { title: 'Change plan', body: `Sets the plan Veridian shows ${user.name}. This does NOT touch Stripe — no subscription is created, changed, or charged; it's an app-side override (e.g. for comps or support).`, actionLabel: 'Save plan', danger: false },
  }[type];

  const run = async () => {
    if (busy || !ready) return;
    setBusy(true);
    const action = type === 'plan' ? 'setPlan' : type;
    const r = await vmAdminAction(action, user.id, type === 'plan' ? { plan } : {});
    setBusy(false);
    if (r.ok) onDone(COPY.actionLabel + ' — done.');
    else onToast(r.error || 'Could not complete that action.');
  };

  return ReactDOM.createPortal(
    <div onClick={busy ? undefined : onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(31,29,26,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, background: VM.paper, borderRadius: 14, boxShadow: '0 24px 60px rgba(31,29,26,0.3)', padding: 22 }}>
        <div style={{ fontFamily: VM.serif, fontWeight: 700, fontSize: 18, color: VM.ink, marginBottom: 8 }}>{COPY.title}</div>
        <div style={{ fontFamily: VM.serif, fontSize: 14, color: VM.ink2, lineHeight: 1.5, marginBottom: 16 }}>{COPY.body}</div>

        {type === 'plan' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
            {['free', 'plus', 'pro', 'business'].map(p => (
              <label key={p} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: VM.serif, fontSize: 14, color: VM.ink, cursor: 'pointer' }}>
                <input type="radio" name="admin-plan" checked={plan === p} onChange={() => setPlan(p)} />
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </label>
            ))}
          </div>
        )}

        {needsTypedConfirm && (
          <div style={{ marginBottom: 18 }}>
            <Mono size={11} color={VM.ink3} style={{ display: 'block', marginBottom: 6 }}>Type <strong style={{ color: VM.ink }}>DELETE</strong> to confirm</Mono>
            <input value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder="DELETE"
              style={{ width: '100%', boxSizing: 'border-box', fontFamily: VM.mono, fontSize: 14, padding: '9px 12px', borderRadius: 8,
                border: `1.5px solid ${ready ? VM.downInk : VM.border}`, background: VM.paper, color: VM.ink, outline: 'none' }} />
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={busy ? undefined : onClose}
            style={{ flex: 1, fontFamily: VM.serif, fontSize: 14, padding: '10px 0', borderRadius: 999, border: `1px solid ${VM.border}`, background: 'transparent', color: VM.ink2, cursor: busy ? 'default' : 'pointer' }}>
            Cancel
          </button>
          <button onClick={ready && !busy ? run : undefined}
            style={{ flex: 1, fontFamily: VM.serif, fontSize: 14, fontWeight: 600, padding: '10px 0', borderRadius: 999, border: 'none',
              background: (ready && !busy) ? (COPY.danger ? VM.downInk : VM.forest) : VM.faint,
              color: (ready && !busy) ? '#fff' : VM.ink3, cursor: (ready && !busy) ? 'pointer' : 'default', transition: 'all .15s' }}>
            {busy ? 'Working…' : COPY.actionLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
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

// ── Media tab ─────────────────────────────────────────────────────────────────
const MEDIA_VIDEO_KEY = 'vm_founder_video_url';

function MediaTab({ isMobile }) {
  const { useState: useStateMedia } = React;
  const [videoUrl, setVideoUrl] = useStateMedia(
    () => window.VM_FOUNDER_VIDEO_URL || localStorage.getItem(MEDIA_VIDEO_KEY) || ''
  );
  const [uploading, setUploading] = useStateMedia(false);
  const [uploadMsg, setUploadMsg] = useStateMedia('');
  const [uploadOk, setUploadOk] = useStateMedia(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const endpoint = window.VM_MEDIA_UPLOAD_URL;
    if (!endpoint) {
      setUploadMsg('VM_MEDIA_UPLOAD_URL is not set in index.html. Add it and reload.');
      return;
    }
    setUploading(true); setUploadMsg(''); setUploadOk(false);
    try {
      const headers = window.VM_ADMIN_KEY ? { 'X-VM-Admin-Key': window.VM_ADMIN_KEY } : {};
      const res = await fetch(`${endpoint}?filename=${encodeURIComponent(file.name)}&type=${encodeURIComponent(file.type)}`, { headers });
      const { uploadUrl: presigned, publicUrl } = await res.json();
      await fetch(presigned, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      localStorage.setItem(MEDIA_VIDEO_KEY, publicUrl);
      window.VM_FOUNDER_VIDEO_URL = publicUrl;
      setVideoUrl(publicUrl);
      setUploadOk(true);
      setUploadMsg('Upload complete. This video will now play for new beta sign-ups.');
    } catch (err) {
      setUploadMsg('Upload failed: ' + (err.message || 'unknown error'));
    }
    setUploading(false);
  };

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ fontFamily: VM.serif, fontSize: 22, fontWeight: 700, color: VM.ink, marginBottom: 6 }}>Media</div>
      <div style={{ fontFamily: VM.mono, fontSize: 11, color: VM.ink3, marginBottom: 28 }}>
        Upload the founder video shown to new beta users during onboarding.
      </div>

      {/* Current video preview */}
      {videoUrl && (
        <div style={{ marginBottom: 28, borderRadius: 12, overflow: 'hidden', border: `1px solid ${VM.border}`, background: '#000' }}>
          <video key={videoUrl} src={videoUrl} controls style={{ width: '100%', maxHeight: 360, display: 'block' }} />
          <div style={{ fontFamily: VM.mono, fontSize: 10, color: 'rgba(255,255,255,0.4)', padding: '8px 12px' }}>
            Current founder video · re-upload below to replace
          </div>
        </div>
      )}

      {/* Upload button */}
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '13px 28px',
        borderRadius: 10, background: uploading ? VM.ink3 : VM.forest, color: VM.paper,
        fontFamily: VM.mono, fontSize: 13, letterSpacing: '0.04em',
        cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.7 : 1,
        transition: 'background .2s', position: 'relative' }}>
        <i className={`ti ti-${uploading ? 'loader-2' : 'upload'}`}
          style={{ fontSize: 17, animation: uploading ? 'spin 1s linear infinite' : 'none' }}></i>
        {uploading ? 'Uploading…' : videoUrl ? 'Replace video' : 'Upload video'}
        <input type="file" accept="video/mp4,video/mov,video/quicktime,video/webm,video/*"
          onChange={handleFileUpload} disabled={uploading}
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%' }} />
      </label>

      {uploadMsg && (
        <div style={{ marginTop: 16, fontFamily: VM.mono, fontSize: 11, lineHeight: 1.7,
          color: uploadOk ? VM.teal : VM.downInk,
          padding: '10px 14px', borderRadius: 8,
          background: uploadOk ? 'rgba(0,140,120,0.08)' : 'rgba(163,45,45,0.08)',
          border: `1px solid ${uploadOk ? VM.teal : VM.downInk}40` }}>
          {uploadMsg}
        </div>
      )}

      <div style={{ marginTop: 20, fontFamily: VM.mono, fontSize: 10, color: VM.ink3, lineHeight: 1.8 }}>
        Supported formats: MP4, MOV, WebM · Uploads directly to S3 via AWS Lambda.<br />
        The video persists across reloads — no redeployment needed.
      </div>
    </div>
  );
}

// Module-level section header used by BetaTab (top-level, so Section defined
// inside other components is out of scope here).
function BetaSection({ label, icon, children, style }) {
  return (
    <div style={{ marginBottom: 28, ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        {icon && <i className={`ti ti-${icon}`} style={{ fontSize: 12, color: VM.ink3 }}></i>}
        <div style={{ fontFamily: VM.mono, fontSize: 9, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: VM.ink3 }}>{label}</div>
      </div>
      {children}
    </div>
  );
}

// ── Beta tab ───────────────────────────────────────────────────────────────────
function BetaTab({ isMobile }) {
  const { useState: useStateBeta, useEffect: useEffectBeta } = React;
  const [invites,  setInvites]  = useStateBeta([]);
  const [users,    setUsers]    = useStateBeta([]);
  const [copied,   setCopied]   = useStateBeta('');
  const [betaMode, setBetaModeState] = useStateBeta(window.isBetaModeOn ? window.isBetaModeOn() : false);
  const [fbPreview, setFbPreviewLocal] = useStateBeta(() => { try { return localStorage.getItem('vm_feedback_preview') || null; } catch { return null; } });
  const [invitesLoading, setInvitesLoading] = useStateBeta(true);
  const [genError, setGenError] = useStateBeta('');

  const toggleBetaMode = () => {
    const next = !betaMode;
    setBetaModeState(next);
    if (window.setBetaMode) window.setBetaMode(next);
  };

  // Invites are real now (vm-admin-actions' createInvite/listInvites/
  // redeemInvite) — this is the list a token actually has to exist in for
  // signup to grant anything. Beta users themselves are still the local
  // tracking record for now (a separate, smaller gap — see PRO-BETA badge
  // notes elsewhere).
  const reload = async () => {
    setUsers(window.loadBetaUsers ? window.loadBetaUsers() : []);
    setInvitesLoading(true);
    const r = typeof vmAdminAction === 'function' ? await vmAdminAction('listInvites') : { ok: false };
    setInvites(r.ok ? r.invites : []);
    setInvitesLoading(false);
  };
  useEffectBeta(() => { reload(); }, []);

  // Toggles the floating Feedback button between showing (as a beta user would
  // see it) and hidden (as a plain signed-in user would) for YOUR OWN admin
  // session only — a quick way to preview it without reassigning yourself in
  // Cognito and re-signing in. Clicking the already-active mode turns it off
  // (back to your real role). Doesn't touch anyone else's account.
  const setFbMode = (mode) => {
    const next = fbPreview === mode ? null : mode;
    setFbPreviewLocal(next);
    if (window.vmSetFeedbackPreview) window.vmSetFeedbackPreview(next);
  };

  const generateLink = async () => {
    setGenError('');
    const r = typeof vmAdminAction === 'function' ? await vmAdminAction('createInvite') : { ok: false, error: 'not configured' };
    if (r.ok) setInvites(inv => [r.invite, ...inv]);
    else setGenError(r.error || 'Could not create an invite link.');
  };

  const copyLink = (token) => {
    const url = `${location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url).then(() => { setCopied(token); setTimeout(() => setCopied(''), 2000); });
  };

  const mono = { fontFamily: VM.mono, fontSize: 11, color: VM.ink3 };
  const badge = (txt, color) => (
    <span style={{ fontFamily: VM.mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
      textTransform: 'uppercase', padding: '2px 7px', borderRadius: 4,
      background: color + '18', color, border: `1px solid ${color}40` }}>{txt}</span>
  );

  return (
    <div style={{ maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: VM.serif, fontSize: 22, fontWeight: 700, color: VM.ink }}>Beta programme</div>
          <div style={{ fontFamily: VM.mono, fontSize: 11, color: VM.ink3, marginTop: 4 }}>
            {users.length} beta users · {invites.filter(i => !i.usedAt).length} unused invites
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => setFbMode('beta')} title="Preview the Feedback button as a beta user would see it (your session only)"
              style={{ fontFamily: VM.mono, fontSize: 11, padding: '7px 14px', borderRadius: 7, cursor: 'pointer',
                border: `1px solid ${fbPreview === 'beta' ? VM.teal : VM.border}`,
                background: fbPreview === 'beta' ? VM.teal : VM.paper, color: fbPreview === 'beta' ? VM.paper : VM.ink2 }}>
              Beta mode
            </button>
            <button onClick={() => setFbMode('normal')} title="Preview the app as a plain signed-in user would see it (your session only)"
              style={{ fontFamily: VM.mono, fontSize: 11, padding: '7px 14px', borderRadius: 7, cursor: 'pointer',
                border: `1px solid ${fbPreview === 'normal' ? VM.ink : VM.border}`,
                background: fbPreview === 'normal' ? VM.ink : VM.paper, color: fbPreview === 'normal' ? VM.paper : VM.ink2 }}>
              Normal mode
            </button>
          </div>
          <button onClick={generateLink}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 8,
              background: VM.teal, color: VM.paper, border: 'none', fontFamily: VM.mono, fontSize: 12,
              letterSpacing: '0.06em', cursor: 'pointer' }}>
            <i className="ti ti-plus" style={{ fontSize: 14 }}></i>Generate invite link
          </button>
        </div>
      </div>
      {fbPreview && (
        <div style={{ ...mono, marginBottom: 20, padding: '7px 12px', borderRadius: 6, background: VM.faint }}>
          <i className="ti ti-eye" style={{ fontSize: 12, marginRight: 5 }}></i>
          Previewing the Feedback button as <strong style={{ color: VM.ink2 }}>{fbPreview === 'beta' ? 'a beta user' : 'a normal user'}</strong> — only affects your own session. Click the mode again to go back to your real role.
        </div>
      )}

      {genError && (
        <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, fontFamily: VM.mono, fontSize: 11,
          color: VM.downInk, background: 'rgba(163,45,45,0.08)', border: `1px solid ${VM.downInk}40` }}>{genError}</div>
      )}

      {/* Site-wide beta mode toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        padding: '14px 16px', borderRadius: 10, marginBottom: 24,
        border: `1px solid ${betaMode ? VM.terra : VM.borderSoft}`,
        background: betaMode ? VM.terra + '14' : VM.faint }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <i className="ti ti-flask" style={{ fontSize: 16, color: betaMode ? VM.terra : VM.ink3 }}></i>
          <div>
            <div style={{ fontFamily: VM.serif, fontSize: 14, fontWeight: 700, color: VM.ink }}>Beta mode</div>
            <div style={{ fontFamily: VM.mono, fontSize: 10.5, color: VM.ink3, marginTop: 2 }}>
              Shows an orange "beta mode" banner across the whole site for every visitor, including admins.
            </div>
          </div>
        </div>
        <button onClick={toggleBetaMode} role="switch" aria-checked={betaMode}
          style={{ position: 'relative', flexShrink: 0, width: 44, height: 24, borderRadius: 999, cursor: 'pointer',
            border: 'none', background: betaMode ? VM.terra : VM.border, transition: 'background .15s' }}>
          <span style={{ position: 'absolute', top: 3, left: betaMode ? 23 : 3, width: 18, height: 18, borderRadius: '50%',
            background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.3)', transition: 'left .15s' }} />
        </button>
      </div>

      {/* Invite links */}
      <BetaSection label="Invite links" icon="link">
        {invitesLoading && <div style={{ ...mono, padding: '20px 0', textAlign: 'center' }}><i className="ti ti-loader-2"></i> Loading invites…</div>}
        {!invitesLoading && invites.length === 0 && (
          <div style={{ ...mono, padding: '20px 0', textAlign: 'center' }}>No invites yet — click Generate to create one.</div>
        )}
        {!invitesLoading && invites.map(inv => {
          const url = `${location.origin}/invite/${inv.token}`;
          return (
            <div key={inv.token} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
              borderBottom: `1px solid ${VM.borderSoft}` }}>
              <code style={{ ...mono, flex: 1, fontSize: 12, color: VM.ink2, wordBreak: 'break-all' }}>{url}</code>
              {inv.usedAt ? badge('Used', VM.ink3) : badge('Available', VM.teal)}
              {inv.usedBy && <span style={{ ...mono, fontSize: 10 }}>{inv.usedBy}</span>}
              {!inv.usedAt && (
                <button onClick={() => copyLink(inv.token)}
                  style={{ fontFamily: VM.mono, fontSize: 11, padding: '4px 12px', borderRadius: 6,
                    border: `1px solid ${VM.border}`, background: copied === inv.token ? VM.teal : VM.faint,
                    color: copied === inv.token ? VM.paper : VM.ink2, cursor: 'pointer', flexShrink: 0 }}>
                  {copied === inv.token ? '✓ Copied' : 'Copy link'}
                </button>
              )}
            </div>
          );
        })}
      </BetaSection>

      {/* Beta users */}
      <BetaSection label="Beta users" icon="users" style={{ marginTop: 28 }}>
        {users.length === 0 && (
          <div style={{ ...mono, padding: '20px 0', textAlign: 'center' }}>No beta users yet.</div>
        )}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: VM.mono, fontSize: 12 }}>
            <thead>
              <tr>
                {['Name','Email','Plan','Joined','Invite token'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: VM.ink3,
                    fontWeight: 500, borderBottom: `1px solid ${VM.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: `1px solid ${VM.borderSoft}` }}>
                  <td style={{ padding: '8px 10px', color: VM.ink, fontFamily: VM.serif, fontSize: 14 }}>{u.name}</td>
                  <td style={{ padding: '8px 10px', color: VM.ink2 }}>{u.email}</td>
                  <td style={{ padding: '8px 10px' }}>{badge('Pro', VM.teal)}</td>
                  <td style={{ padding: '8px 10px', color: VM.ink3 }}>{new Date(u.joined).toLocaleDateString()}</td>
                  <td style={{ padding: '8px 10px', color: VM.ink3, fontSize: 10 }}>{u.inviteToken}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </BetaSection>
    </div>
  );
}


const FB_STATUS_LABEL = { new: 'New', in_progress: 'In progress', resolved: 'Resolved' };
const FB_STATUS_COLOR = { new: VM.terra, in_progress: VM.teal, resolved: VM.ink3 };

function FeedbackTab({ isMobile }) {
  const { useState: useStateFbT, useEffect: useEffectFbT } = React;
  const [feedback, setFeedback] = useStateFbT([]);
  const [loaded,   setLoaded]   = useStateFbT(false);
  const [loadError, setLoadError] = useStateFbT(null);   // set when the server fetch fails — distinct from a genuine zero-count
  const [actionError, setActionError] = useStateFbT(null);   // set when a status/note save call fails
  const [refreshing, setRefreshing] = useStateFbT(false);   // manual-refresh spinner (separate from the initial `loaded` gate)
  const [fbExpanded, setFbExp]  = useStateFbT(null);
  const [filter,   setFilter]   = useStateFbT('all');
  const [lightbox, setLightbox] = useStateFbT(null);   // screenshot URL currently shown full-screen
  const [noteEditing, setNoteEditing] = useStateFbT(null);   // id of item whose note textarea is open
  const [noteDraft, setNoteDraft]     = useStateFbT('');

  // AWS-only: feedback lives in DynamoDB (lambda/feedback/vm-feedback), never in
  // this browser's localStorage — a failed call is reported as an error, not
  // quietly swapped for a local copy that would misreport real submissions as zero.
  const reload = async () => {
    setRefreshing(true);
    if (!window.VM_FEEDBACK_URL || !window.vmFeedbackListAll) {
      setFeedback([]); setLoadError('feedback API not configured'); setLoaded(true); setRefreshing(false);
      return;
    }
    const r = await window.vmFeedbackListAll();
    if (r.ok) { setFeedback(r.items); setLoadError(null); setLoaded(true); setRefreshing(false); return; }
    setFeedback([]); setLoadError(r.error || 'failed to load'); setLoaded(true); setRefreshing(false);
  };
  useEffectFbT(() => {
    reload();
    // Poll while this tab is mounted — there's no push channel from the Lambda,
    // so this is what makes a just-submitted item show up without a manual
    // page reload (on top of the ConsistentRead fix in the Lambda itself).
    const id = setInterval(reload, 15000);
    return () => clearInterval(id);
  }, []);

  const toggleExpand = async (fb) => {
    if (fbExpanded === fb.id) { setFbExp(null); return; }
    setFbExp(fb.id);
    if (!fb.items && window.VM_FEEDBACK_URL && window.vmFeedbackGetItem) {
      const r = await window.vmFeedbackGetItem(fb.sub, fb.id);
      if (r.ok) setFeedback(prev => prev.map(f => f.id === fb.id ? { ...f, items: r.item.items } : f));
    }
  };

  const setStatus = async (fb, status) => {
    const prevStatus = fb.status;
    setFeedback(prev => prev.map(f => f.id === fb.id ? { ...f, status } : f));
    if (!window.VM_FEEDBACK_URL || !window.vmFeedbackSetStatus || !fb.sub) {
      setFeedback(prev => prev.map(f => f.id === fb.id ? { ...f, status: prevStatus } : f));
      setActionError('feedback API not configured'); return;
    }
    const r = await window.vmFeedbackSetStatus(fb.sub, fb.id, status);
    if (!r.ok) {
      setFeedback(prev => prev.map(f => f.id === fb.id ? { ...f, status: prevStatus } : f));
      setActionError(r.error || 'could not save status');
    }
  };

  const openNoteEditor = (fb) => { setNoteEditing(fb.id); setNoteDraft(fb.adminNote || ''); };

  const saveNote = async (fb) => {
    const note = noteDraft;
    const prevNote = fb.adminNote;
    setFeedback(prev => prev.map(f => f.id === fb.id ? { ...f, adminNote: note } : f));
    setNoteEditing(null);
    if (!window.VM_FEEDBACK_URL || !window.vmFeedbackSetNote || !fb.sub) {
      setFeedback(prev => prev.map(f => f.id === fb.id ? { ...f, adminNote: prevNote } : f));
      setActionError('feedback API not configured'); return;
    }
    const r = await window.vmFeedbackSetNote(fb.sub, fb.id, note);
    if (!r.ok) {
      setFeedback(prev => prev.map(f => f.id === fb.id ? { ...f, adminNote: prevNote } : f));
      setActionError(r.error || 'could not save note');
    }
  };

  const mono = { fontFamily: VM.mono, fontSize: 11, color: VM.ink3 };
  const sorted = [...feedback].sort((a, b) => b.ts - a.ts);
  const counts = {
    all: sorted.length,
    new: sorted.filter(f => (f.status || 'new') === 'new').length,
    in_progress: sorted.filter(f => f.status === 'in_progress').length,
    resolved: sorted.filter(f => f.status === 'resolved').length,
  };
  const visible = filter === 'all' ? sorted : sorted.filter(f => (f.status || 'new') === filter);

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontFamily: VM.serif, fontSize: 22, fontWeight: 700, color: VM.ink }}>Feedback</div>
          <div style={{ fontFamily: VM.mono, fontSize: 11, color: VM.ink3, marginTop: 4 }}>
            {counts.all} submission{counts.all === 1 ? '' : 's'} · {counts.new} new
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {['all', 'new', 'in_progress', 'resolved'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ fontFamily: VM.mono, fontSize: 11, padding: '5px 12px', borderRadius: 999, cursor: 'pointer',
                border: `1px solid ${filter === f ? VM.forest : VM.border}`,
                background: filter === f ? VM.forest : VM.paper, color: filter === f ? VM.paperWarm : VM.ink2 }}>
              {f === 'all' ? `All (${counts.all})` : `${FB_STATUS_LABEL[f]} (${counts[f]})`}
            </button>
          ))}
          <button onClick={reload} disabled={refreshing} title="Refresh"
            style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: VM.mono, fontSize: 11, padding: '5px 12px',
              borderRadius: 999, cursor: refreshing ? 'default' : 'pointer', border: `1px solid ${VM.border}`,
              background: VM.paper, color: VM.ink2, marginLeft: 4 }}>
            <i className="ti ti-refresh" style={{ fontSize: 12, animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }}></i>
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {actionError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '9px 14px',
          borderRadius: 8, fontFamily: VM.mono, fontSize: 11, color: VM.downInk,
          background: 'rgba(163,45,45,0.08)', border: `1px solid ${VM.downInk}40` }}>
          <i className="ti ti-alert-triangle" style={{ fontSize: 13 }}></i>
          Couldn't save ({actionError}) — change was reverted.
          <span onClick={() => setActionError(null)} style={{ marginLeft: 'auto', cursor: 'pointer', textDecoration: 'underline' }}>dismiss</span>
        </div>
      )}

      {loaded && loadError && (
        <div style={{ ...mono, padding: '40px 0', textAlign: 'center', color: VM.terra }}>
          Couldn't load feedback from the server ({loadError}). This isn't necessarily zero submissions —
          {' '}<span onClick={reload} style={{ textDecoration: 'underline', cursor: 'pointer' }}>retry</span>.
        </div>
      )}

      {loaded && !loadError && visible.length === 0 && (
        <div style={{ ...mono, padding: '40px 0', textAlign: 'center' }}>
          {feedback.length === 0 ? 'No feedback submitted yet.' : 'Nothing in this filter.'}
        </div>
      )}

      {visible.map(fb => (
        <div key={fb.id} style={{ borderBottom: `1px solid ${VM.borderSoft}`, padding: '14px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: VM.serif, fontSize: 14, fontWeight: 600, color: VM.ink }}>{fb.userName}</span>
            <span style={{ ...mono, fontSize: 10 }}>{fb.userEmail}</span>
            <span style={{ ...mono, fontSize: 10, color: VM.ink3 }}>·</span>
            <span style={{ ...mono, fontSize: 10 }}>{fb.route}</span>
            <span style={{ ...mono, fontSize: 10, color: VM.ink3 }}>·</span>
            <span style={{ ...mono, fontSize: 10, color: VM.ink3 }}>{new Date(fb.ts).toLocaleString()}</span>
            <span style={{ fontFamily: VM.mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
              padding: '2px 7px', borderRadius: 4, background: VM.terra + '18', color: VM.terra, border: `1px solid ${VM.terra}40` }}>
              {fb.itemCount || fb.items?.length || 1} suggestion{(fb.itemCount || fb.items?.length || 1) > 1 ? 's' : ''}
            </span>
            <button onClick={() => openNoteEditor(fb)}
              style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, fontFamily: VM.mono, fontSize: 10, padding: '3px 10px',
                borderRadius: 5, border: `1px solid ${VM.border}`, background: VM.faint, color: VM.ink2, cursor: 'pointer' }}>
              <i className="ti ti-message-plus" style={{ fontSize: 12 }}></i>{fb.adminNote ? 'Edit comment' : 'Add comment'}
            </button>
            <button onClick={() => toggleExpand(fb)}
              style={{ fontFamily: VM.mono, fontSize: 10, padding: '3px 10px',
                borderRadius: 5, border: `1px solid ${VM.border}`, background: VM.faint, color: VM.ink2, cursor: 'pointer' }}>
              {fbExpanded === fb.id ? 'Collapse' : 'View'}
            </button>
          </div>

          {noteEditing === fb.id ? (
            <div style={{ margin: '8px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <textarea autoFocus value={noteDraft} onChange={e => setNoteDraft(e.target.value)}
                placeholder="Internal note — not visible to the submitter…" rows={2}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, fontFamily: VM.serif, fontSize: 13,
                  border: `1.5px solid ${VM.teal}`, background: VM.paper, color: VM.ink, resize: 'vertical', outline: 'none' }} />
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => saveNote(fb)}
                  style={{ fontFamily: VM.mono, fontSize: 10, padding: '4px 12px', borderRadius: 5, border: 'none',
                    background: VM.teal, color: VM.paper, cursor: 'pointer' }}>Save</button>
                <button onClick={() => setNoteEditing(null)}
                  style={{ fontFamily: VM.mono, fontSize: 10, padding: '4px 12px', borderRadius: 5,
                    border: `1px solid ${VM.border}`, background: VM.paper, color: VM.ink2, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          ) : fb.adminNote && (
            <div style={{ margin: '8px 0', padding: '8px 10px', borderRadius: 6, background: VM.faint,
              borderLeft: `3px solid ${VM.teal}` }}>
              <div style={{ ...mono, fontSize: 9, textTransform: 'uppercase', marginBottom: 3 }}>Your note</div>
              <div style={{ fontFamily: VM.serif, fontSize: 13, color: VM.ink2, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{fb.adminNote}</div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            <span style={{ ...mono, fontSize: 9, marginRight: 2 }}>STATUS</span>
            {['new', 'in_progress', 'resolved'].map(s => {
              const active = (fb.status || 'new') === s;
              return (
                <button key={s} onClick={() => setStatus(fb, s)}
                  style={{ fontFamily: VM.mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase',
                    padding: '3px 9px', borderRadius: 5, cursor: 'pointer',
                    border: `1px solid ${active ? FB_STATUS_COLOR[s] : VM.border}`,
                    background: active ? FB_STATUS_COLOR[s] + '18' : VM.paper,
                    color: active ? FB_STATUS_COLOR[s] : VM.ink3 }}>
                  {FB_STATUS_LABEL[s]}
                </button>
              );
            })}
          </div>

          {fbExpanded === fb.id && !fb.items && (
            <div style={{ ...mono, padding: '10px 0' }}>
              <i className="ti ti-loader-2" style={{ fontSize: 12, marginRight: 6, animation: 'spin 1s linear infinite' }}></i>
              Loading screenshots…
            </div>
          )}

          {fbExpanded === fb.id && (fb.items || []).map((item, i) => (
            <div key={i} style={{ marginTop: 10, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {item.screenshot && (
                <img src={item.screenshot} alt={`Suggestion ${i+1}`} onClick={() => setLightbox(item.screenshot)}
                  style={{ width: 220, borderRadius: 6, border: `1px solid ${VM.border}`, flexShrink: 0, cursor: 'zoom-in' }} />
              )}
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ ...mono, marginBottom: 4, textTransform: 'uppercase', fontSize: 9 }}>Suggestion {i+1}</div>
                <div style={{ fontFamily: VM.serif, fontSize: 14, color: VM.ink2, lineHeight: 1.55 }}>
                  {item.comment || <span style={{ color: VM.ink3 }}>No comment left.</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}

      {lightbox && <ImageLightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}

// Full-screen click-to-zoom viewer for a single screenshot — Escape or a click
// anywhere outside the image closes it.
function ImageLightbox({ src, onClose }) {
  const { useEffect: useEffectLb } = React;
  useEffectLb(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 10002, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 32, background: 'rgba(10,8,6,0.85)', cursor: 'zoom-out' }}>
      <img src={src} alt="Feedback screenshot, full size"
        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8,
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }} />
      <button onClick={onClose}
        style={{ position: 'fixed', top: 20, right: 24, background: 'transparent', border: 'none', cursor: 'pointer',
          color: VM.paperWarm, fontSize: 28, lineHeight: 1, padding: '4px 10px' }}>✕</button>
    </div>
  );
}

// ── Updates ("what's new") ───────────────────────────────────────────────────
// Admin authors posts here; every signed-in (and signed-out, on the public
// /updates page) user reads them via the vm-updates Lambda — see
// ui_kits/web/updates.jsx (useVMUpdates/vmCreateUpdate/vmEditUpdate/vmDeleteUpdate)
// and ui_kits/web/ReleaseNotes.jsx (the public page that renders the feed).
const UPDATE_TAGS = ['Update', 'Data', 'Account', 'Security', 'Billing', 'Admin', 'Business', 'Learn', 'For you'];

function UpdatesTab({ isMobile }) {
  const live = typeof useVMUpdates === 'function' ? useVMUpdates() : { updates: null, loading: false, live: false };
  const [drafts, setDrafts] = useStateAdmin(null);   // local optimistic copy once loaded
  const [form, setForm] = useStateAdmin({ title: '', body: '', tag: 'Update' });
  const [editingId, setEditingId] = useStateAdmin(null);
  const [busy, setBusy] = useStateAdmin(false);
  const [msg, setMsg] = useStateAdmin(null);   // { ok, text }
  const bodyRef = React.useRef(null);

  React.useEffect(() => { if (live.updates && !drafts) setDrafts(live.updates); }, [live.updates]);
  const list = drafts || live.updates || [];

  const resetForm = () => { setForm({ title: '', body: '', tag: 'Update' }); setEditingId(null); };
  const startEdit = (n) => { setForm({ title: n.title, body: n.body, tag: n.tag || 'Update' }); setEditingId(n.id); };

  // Markdown toolbar — wraps the current selection (or inserts at the caret
  // with no selection) in **bold**/*italic*, or prefixes each selected line
  // with "- " for a bullet list. Restores focus + selection so it feels like
  // a real editor toolbar, not a plain textarea.
  const wrapSelection = (before, after = before) => {
    const el = bodyRef.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e, value } = el;
    const next = value.slice(0, s) + before + value.slice(s, e) + after + value.slice(e);
    setForm(f => ({ ...f, body: next }));
    requestAnimationFrame(() => { el.focus(); el.selectionStart = s + before.length; el.selectionEnd = e + before.length; });
  };
  const toggleBullets = () => {
    const el = bodyRef.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e, value } = el;
    const lineStart = value.lastIndexOf('\n', s - 1) + 1;
    const lineEnd = value.indexOf('\n', e); const end = lineEnd === -1 ? value.length : lineEnd;
    const block = value.slice(lineStart, end);
    const lines = block.split('\n');
    const allBulleted = lines.every(l => /^\s*[-*]\s+/.test(l) || !l.trim());
    const nextLines = lines.map(l => {
      if (!l.trim()) return l;
      return allBulleted ? l.replace(/^\s*[-*]\s+/, '') : (/^\s*[-*]\s+/.test(l) ? l : `- ${l}`);
    });
    const next = value.slice(0, lineStart) + nextLines.join('\n') + value.slice(end);
    setForm(f => ({ ...f, body: next }));
    requestAnimationFrame(() => el.focus());
  };

  const submit = async () => {
    if (!window.VM_UPDATES || !window.VM_UPDATES.url) {
      setMsg({ ok: false, text: 'vm-updates Lambda URL is not set — add it to VM_UPDATES.url in updates.jsx after deploying (see lambda/updates/vm-updates).' });
      return;
    }
    if (!form.title.trim() || !form.body.trim()) { setMsg({ ok: false, text: 'Title and body are required.' }); return; }
    setBusy(true); setMsg(null);
    try {
      if (editingId) {
        await vmEditUpdate(editingId, form);
        setDrafts(d => (d || []).map(n => n.id === editingId ? { ...n, ...form } : n));
        setMsg({ ok: true, text: 'Update saved.' });
      } else {
        const created = await vmCreateUpdate(form);
        setDrafts(d => [created, ...(d || [])]);
        setMsg({ ok: true, text: 'Update published — visible to everyone now.' });
      }
      resetForm();
    } catch (e) {
      setMsg({ ok: false, text: e.message || 'Could not save.' });
    }
    setBusy(false);
  };

  const remove = async (id) => {
    setBusy(true); setMsg(null);
    try {
      await vmDeleteUpdate(id);
      setDrafts(d => (d || []).filter(n => n.id !== id));
      if (editingId === id) resetForm();
    } catch (e) {
      setMsg({ ok: false, text: e.message || 'Could not delete.' });
    }
    setBusy(false);
  };

  const mono = { fontFamily: VM.mono, fontSize: 11, color: VM.ink3 };
  const field = { width: '100%', fontFamily: VM.serif, fontSize: 14, color: VM.ink, padding: '9px 12px',
    borderRadius: 8, border: `1px solid ${VM.border}`, background: VM.paper, outline: 'none' };

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: VM.serif, fontSize: 22, fontWeight: 700, color: VM.ink }}>Updates</div>
          <div style={mono}>
            {list.length} published · shown on the public /updates page, and nudged to users when they next sign in
          </div>
        </div>
      </div>

      {!window.VM_UPDATES?.url && (
        <div style={{ marginBottom: 20, padding: '10px 14px', borderRadius: 8, fontFamily: VM.mono, fontSize: 11, lineHeight: 1.7,
          color: VM.terra, background: 'rgba(196,106,59,0.1)', border: `1px solid ${VM.terra}40` }}>
          vm-updates Lambda URL not set — writes will fail until it's deployed (see lambda/updates/vm-updates) and
          <code> VM_UPDATES.url</code> is set in ui_kits/web/updates.jsx. Reads fall back to the static mock in ReleaseNotes.jsx.
        </div>
      )}

      {/* Composer */}
      <BetaSection label={editingId ? 'Edit update' : 'New update'} icon={editingId ? 'edit' : 'plus'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 640 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Title" style={{ ...field, flex: '1 1 300px' }} />
            <select value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value }))}
              style={{ ...field, flex: '0 0 150px', cursor: 'pointer' }}>
              {UPDATE_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 2, padding: '4px', borderRadius: '8px 8px 0 0', border: `1px solid ${VM.border}`, borderBottom: 'none', background: VM.faint }}>
            {[
              { icon: 'bold', title: 'Bold', run: () => wrapSelection('**') },
              { icon: 'italic', title: 'Italic', run: () => wrapSelection('*') },
              { icon: 'list', title: 'Bullet list', run: toggleBullets },
            ].map(b => (
              <button key={b.icon} type="button" onClick={b.run} title={b.title}
                style={{ width: 28, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: 'none', borderRadius: 5, background: 'transparent', color: VM.ink2, cursor: 'pointer' }}>
                <i className={`ti ti-${b.icon}`} style={{ fontSize: 14 }}></i>
              </button>
            ))}
          </div>
          <textarea ref={bodyRef} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            placeholder="What changed, in plain language… select text and use the toolbar above for **bold**, *italic*, or bullet lists"
            rows={4} style={{ ...field, borderRadius: '0 0 8px 8px', resize: 'vertical' }} />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={submit} disabled={busy}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 8,
                background: VM.teal, color: VM.paper, border: 'none', fontFamily: VM.mono, fontSize: 12,
                letterSpacing: '0.06em', cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.7 : 1 }}>
              <i className={`ti ti-${busy ? 'loader-2' : editingId ? 'check' : 'send'}`}
                style={{ fontSize: 14, animation: busy ? 'spin 1s linear infinite' : 'none' }}></i>
              {editingId ? 'Save changes' : 'Publish'}
            </button>
            {editingId && (
              <button onClick={resetForm} style={{ fontFamily: VM.mono, fontSize: 11, padding: '9px 14px', borderRadius: 8,
                border: `1px solid ${VM.border}`, background: VM.paper, color: VM.ink2, cursor: 'pointer' }}>Cancel</button>
            )}
          </div>
          {msg && (
            <div style={{ fontFamily: VM.mono, fontSize: 11, lineHeight: 1.6, padding: '9px 12px', borderRadius: 8,
              color: msg.ok ? VM.teal : VM.downInk,
              background: msg.ok ? 'rgba(0,140,120,0.08)' : 'rgba(163,45,45,0.08)',
              border: `1px solid ${(msg.ok ? VM.teal : VM.downInk)}40` }}>{msg.text}</div>
          )}
        </div>
      </BetaSection>

      {/* Published list */}
      <BetaSection label="Published" icon="list" style={{ marginTop: 28 }}>
        {live.loading && !drafts && <div style={{ ...mono, padding: '20px 0', textAlign: 'center' }}>Loading…</div>}
        {!live.loading && list.length === 0 && (
          <div style={{ ...mono, padding: '20px 0', textAlign: 'center' }}>No updates published yet.</div>
        )}
        {list.map(n => (
          <div key={n.id} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '12px 0', borderBottom: `1px solid ${VM.borderSoft}` }}>
            <div style={{ flexShrink: 0, width: 88 }}><Mono size={10} color={VM.ink3}>{n.date}</Mono></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: VM.mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                  color: VM.tealInk, background: VM.tealTint, borderRadius: 5, padding: '2px 8px' }}>{n.tag}</span>
                <span style={{ fontFamily: VM.serif, fontWeight: 700, fontSize: 14.5, color: VM.ink }}>{n.title}</span>
              </div>
              <div style={{ fontFamily: VM.serif, fontSize: 13, color: VM.ink2, lineHeight: 1.5 }}>
                {typeof vmRenderMarkdown === 'function' ? vmRenderMarkdown(n.body) : n.body}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              <button onClick={() => startEdit(n)} title="Edit" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: VM.ink3, padding: 6 }}>
                <i className="ti ti-pencil" style={{ fontSize: 15 }}></i>
              </button>
              <button onClick={() => remove(n.id)} title="Delete" disabled={busy} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: VM.downInk, padding: 6 }}>
                <i className="ti ti-trash" style={{ fontSize: 15 }}></i>
              </button>
            </div>
          </div>
        ))}
      </BetaSection>
    </div>
  );
}

// ── Analytics ─────────────────────────────────────────────────────────────────
// Operator-facing business analytics derived (deterministically) from the mock
// VM_USERS dataset: cohort retention, conversion funnel, revenue/MRR movement and
// engagement. The Heatmap (real DynamoDB-backed) lives on as a sub-view here.
const AN_TOOLS = [
  { id:'retention',  label:'Retention',   icon:'chart-dots' },
  { id:'growth',     label:'Growth',      icon:'chart-arrows-vertical' },
  { id:'funnel',     label:'Funnel',      icon:'filter' },
  { id:'revenue',    label:'Revenue',     icon:'cash' },
  { id:'engagement', label:'Engagement',  icon:'activity' },
  { id:'risk',       label:'Churn risk',  icon:'alert-triangle' },
  { id:'heatmap',    label:'Heatmap',     icon:'flame' },
];
const anMonths = (a, b) => Math.max(0, (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()));
const anMKey = (d) => d.getFullYear() * 12 + d.getMonth();
const anWithin = (d, days) => (VM_NOW - d) <= days * DAY_MS;
// teal→forest wash for retention cells, by percentage.
const anHeat = (pct) => pct == null ? VM.paperWarm : `rgba(29,78,58,${(pct / 100) * 0.82 + 0.05})`;

function AnalyticsTab({ stats, isMobile }) {
  const [tool, setTool] = useStateAdmin('retention');
  return (
    <div>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:18 }}>
        {AN_TOOLS.map(t => {
          const on = tool === t.id;
          return (
            <button key={t.id} onClick={() => setTool(t.id)} style={{ display:'inline-flex', alignItems:'center', gap:6,
              fontFamily:VM.mono, fontSize:10.5, letterSpacing:'0.04em', textTransform:'uppercase', padding:'7px 13px', borderRadius:999, cursor:'pointer',
              border:`1px solid ${on ? VM.forest : VM.border}`, background: on ? VM.forest : VM.paper, color: on ? VM.paperWarm : VM.ink2 }}>
              <i className={'ti ti-' + t.icon} style={{ fontSize:13 }}></i>{t.label}
            </button>
          );
        })}
      </div>
      {tool === 'retention'  && <AnRetention isMobile={isMobile} />}
      {tool === 'growth'     && <AnGrowth isMobile={isMobile} />}
      {tool === 'funnel'     && <AnFunnel isMobile={isMobile} />}
      {tool === 'revenue'    && <AnRevenue stats={stats} isMobile={isMobile} />}
      {tool === 'engagement' && <AnEngagement isMobile={isMobile} />}
      {tool === 'risk'       && <AnRisk isMobile={isMobile} />}
      {tool === 'heatmap'    && <HeatmapAdmin isMobile={isMobile} />}
    </div>
  );
}

// Small non-clickable stat tile.
function AnStat({ label, value, foot, tone }) {
  return (
    <div style={{ background:VM.paper, border:`1px solid ${VM.borderSoft}`, borderRadius:12, padding:'13px 15px' }}>
      <Label>{label}</Label>
      <div style={{ fontFamily:VM.mono, fontWeight:700, fontSize:23, marginTop:5,
        color: tone === 'up' ? VM.upInk : tone === 'down' ? VM.downInk : VM.ink }}>{value}</div>
      {foot && <div style={{ marginTop:3 }}><Mono size={10} color={VM.ink3}>{foot}</Mono></div>}
    </div>
  );
}

// Compact responsive line chart (markers + value labels).
function AnLine({ data, height = 130, color = VM.forest, prefix = '', suffix = '', area = true }) {
  const max = Math.max(...data.map(d => d.v), 1);
  const n = data.length, W = Math.max(280, n * 56), H = height, pad = 26, base = H - 22;
  const x = i => pad + i * ((W - 2 * pad) / Math.max(n - 1, 1));
  const y = v => base - (v / max) * (base - 16);
  const line = data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.v).toFixed(1)}`).join(' ');
  const fill = `${line} L${x(n - 1).toFixed(1)},${base} L${x(0).toFixed(1)},${base} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="xMidYMid meet" style={{ display:'block' }}>
      {area && <path d={fill} fill={color} opacity="0.08" />}
      <path d={line} fill="none" stroke={color} strokeWidth="2" />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(d.v)} r="3" fill={color} />
          <text x={x(i)} y={y(d.v) - 8} textAnchor="middle" style={{ fontFamily:VM.mono, fontSize:9, fill:VM.ink2 }}>{prefix}{d.v}{suffix}</text>
          <text x={x(i)} y={H - 6} textAnchor="middle" style={{ fontFamily:VM.mono, fontSize:8.5, fill:VM.ink3 }}>{d.label}</text>
        </g>
      ))}
    </svg>
  );
}

// ── Tool 1: Cohort retention ─────────────────────────────────────────────────
function AnRetention({ isMobile }) {
  const { rows, curve } = React.useMemo(() => {
    const buckets = {};
    VM_USERS.forEach(u => { const k = u.joined.getFullYear() * 12 + u.joined.getMonth(); (buckets[k] = buckets[k] || []).push(u); });
    const nowKey = VM_NOW.getFullYear() * 12 + VM_NOW.getMonth();
    const span = 7;                                  // last 8 monthly cohorts
    const rows = [];
    for (let k = nowKey - span; k <= nowKey; k++) {
      const us = buckets[k] || [];
      const age = nowKey - k;
      // retention at month-offset t = % of the cohort whose activity tenure ≥ t.
      const ret = [];
      for (let t = 0; t <= age; t++) ret.push(us.length ? Math.round(us.filter(u => anMonths(u.joined, u.lastActive) >= t).length / us.length * 100) : null);
      const d = new Date(VM_NOW.getFullYear(), VM_NOW.getMonth() - age, 1);
      rows.push({ label: d.toLocaleString('en-US', { month:'short', year:'2-digit' }), size: us.length, ret });
    }
    // average curve across cohorts per offset
    const curve = [];
    for (let t = 0; t <= span; t++) {
      const vals = rows.map(r => r.ret[t]).filter(v => v != null);
      if (vals.length) curve.push({ label:'M' + t, v: Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) });
    }
    return { rows, curve };
  }, []);
  const offsets = rows[rows.length - 1].ret.length;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      <p style={{ fontFamily:VM.serif, fontSize:14.5, color:VM.ink2, lineHeight:1.5, margin:0, maxWidth:680 }}>
        Of the users who joined in a given month, how many were still active <i>N</i> months later. Read each row left→right; healthy products flatten rather than fall to zero.
      </p>
      <AdminCard title="Retention by signup cohort">
        <div style={{ overflowX:'auto' }}>
          <div style={{ minWidth: 480 }}>
            <div style={{ display:'grid', gridTemplateColumns:`92px 46px repeat(${offsets}, 1fr)`, gap:4, marginBottom:6 }}>
              <Label>Cohort</Label><Label style={{ textAlign:'right' }}>Size</Label>
              {Array.from({ length: offsets }).map((_, t) => <Label key={t} style={{ textAlign:'center' }}>M{t}</Label>)}
            </div>
            {rows.map((r, i) => (
              <div key={i} style={{ display:'grid', gridTemplateColumns:`92px 46px repeat(${offsets}, 1fr)`, gap:4, marginBottom:4 }}>
                <Mono size={11} color={VM.ink2} style={{ alignSelf:'center' }}>{r.label}</Mono>
                <Mono size={11} color={VM.ink3} style={{ alignSelf:'center', textAlign:'right' }}>{r.size}</Mono>
                {Array.from({ length: offsets }).map((_, t) => {
                  const v = r.ret[t];
                  return (
                    <div key={t} title={v == null ? '—' : `${r.label} · M${t}: ${v}%`} style={{ height:30, borderRadius:5, display:'flex', alignItems:'center', justifyContent:'center',
                      background: v == null ? 'transparent' : anHeat(v) }}>
                      {v != null && <span style={{ fontFamily:VM.mono, fontSize:10, fontWeight:600, color: v >= 55 ? VM.paperWarm : VM.ink2 }}>{v}</span>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </AdminCard>
      <AdminCard title="Average retention curve · all cohorts">
        <AnLine data={curve} suffix="%" color={VM.forest} />
      </AdminCard>
    </div>
  );
}

// ── Tool 2: Conversion funnel ────────────────────────────────────────────────
function AnFunnel({ isMobile }) {
  const steps = React.useMemo(() => {
    const signups   = VM_USERS.length;
    const activated = VM_USERS.filter(u => u.lessons >= 1).length;
    const paying    = VM_USERS.filter(u => u.plan !== 'Free' && u.status !== 'churned').length;
    const retained  = VM_USERS.filter(u => u.status === 'active').length;
    const visitors  = Math.round(signups / 0.082);   // ~8.2% visitor→signup
    return [
      { label:'Visitors',  value:visitors,  note:'unique site visitors' },
      { label:'Sign-ups',  value:signups,   note:'created an account' },
      { label:'Activated', value:activated, note:'completed ≥1 lesson' },
      { label:'Paying',    value:paying,    note:'on Plus or Pro' },
      { label:'Retained',  value:retained,  note:'still active today' },
    ];
  }, []);
  const top = steps[0].value;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      <p style={{ fontFamily:VM.serif, fontSize:14.5, color:VM.ink2, lineHeight:1.5, margin:0, maxWidth:680 }}>
        Where prospects drop off on the path from first visit to a retained, paying user. The biggest fall-off is where to focus.
      </p>
      <AdminCard title="Acquisition funnel">
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {steps.map((s, i) => {
            const stepConv = i === 0 ? 100 : (s.value / steps[i - 1].value) * 100;
            const overall  = (s.value / top) * 100;
            return (
              <div key={s.label}>
                <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontFamily:VM.serif, fontSize:14, color:VM.ink }}>{s.label} <span style={{ color:VM.ink3, fontSize:12 }}>· {s.note}</span></span>
                  <span><Mono size={13} weight={700}>{s.value.toLocaleString('en-US')}</Mono> {i > 0 && <Mono size={10} color={stepConv < 50 ? VM.downInk : VM.ink3}>{stepConv.toFixed(0)}% of prev</Mono>}</span>
                </div>
                <div style={{ height:26, borderRadius:6, background:VM.paperWarm, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${overall}%`, minWidth:2, borderRadius:6,
                    background:`linear-gradient(90deg, ${VM.forest}, ${VM.teal})`, display:'flex', alignItems:'center', justifyContent:'flex-end', paddingRight:8 }}>
                    <Mono size={9.5} color={VM.paperWarm}>{overall.toFixed(1)}%</Mono>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop:14, paddingTop:12, borderTop:`1px solid ${VM.borderHair}`, display:'flex', gap:24, flexWrap:'wrap' }}>
          <div><Label>Visitor → paying</Label><div style={{ fontFamily:VM.mono, fontWeight:700, fontSize:18, color:VM.ink, marginTop:3 }}>{(steps[3].value / top * 100).toFixed(1)}%</div></div>
          <div><Label>Signup → paying</Label><div style={{ fontFamily:VM.mono, fontWeight:700, fontSize:18, color:VM.ink, marginTop:3 }}>{(steps[3].value / steps[1].value * 100).toFixed(0)}%</div></div>
          <div><Label>Paying → retained</Label><div style={{ fontFamily:VM.mono, fontWeight:700, fontSize:18, color:VM.ink, marginTop:3 }}>{(steps[4].value / steps[3].value * 100).toFixed(0)}%</div></div>
        </div>
      </AdminCard>
    </div>
  );
}

// ── Tool 3: Revenue / MRR movement ───────────────────────────────────────────
function AnRevenue({ stats, isMobile }) {
  const m = React.useMemo(() => {
    const paying = VM_USERS.filter(u => u.plan !== 'Free' && u.status !== 'churned');
    const mrr = paying.reduce((s, u) => s + A_PLAN_PRICE[u.plan], 0);
    const arppu = paying.length ? mrr / paying.length : 0;
    const arpu = mrr / VM_USERS.length;
    const monthlyChurn = (stats.churned / stats.total) / 9;          // ~tenure-adjusted proxy
    const ltv = arppu / Math.max(monthlyChurn, 0.001);
    const cac = 42;                                                  // mock blended CAC
    // This-month movement.
    const newMrr = VM_USERS.filter(u => u.plan !== 'Free' && u.status !== 'churned' && anWithin(u.joined, 30)).reduce((s, u) => s + A_PLAN_PRICE[u.plan], 0);
    const churnMrr = VM_USERS.filter(u => u.plan !== 'Free' && u.status === 'churned' && anWithin(u.lastActive, 60)).reduce((s, u) => s + A_PLAN_PRICE[u.plan], 0);
    const expansion = Math.round(mrr * 0.035), contraction = Math.round(mrr * 0.018);
    const start = mrr - newMrr - expansion + contraction + churnMrr;
    // Net / Gross revenue retention from the existing base (excludes new MRR).
    const nrr = start ? Math.round((start + expansion - contraction - churnMrr) / start * 100) : 0;
    const grr = start ? Math.round((start - contraction - churnMrr) / start * 100) : 0;
    // 12-month MRR trend (paying, not-yet-churned, joined on/before each month).
    const trend = [];
    for (let k = 11; k >= 0; k--) {
      const end = new Date(VM_NOW.getFullYear(), VM_NOW.getMonth() - k + 1, 0, 23, 59, 59);
      const v = VM_USERS.filter(u => u.plan !== 'Free' && u.joined <= end && (u.status !== 'churned' || u.lastActive > end)).reduce((s, u) => s + A_PLAN_PRICE[u.plan], 0);
      trend.push({ label: end.toLocaleString('en-US', { month:'short' }), v });
    }
    return { mrr, arppu, arpu, ltv, cac, newMrr, churnMrr, expansion, contraction, start, nrr, grr, trend };
  }, [stats]);
  const wf = [
    { label:'Start',   v:m.start,       type:'base' },
    { label:'+ New',   v:m.newMrr,      type:'pos' },
    { label:'+ Expan', v:m.expansion,   type:'pos' },
    { label:'− Contr', v:m.contraction, type:'neg' },
    { label:'− Churn', v:m.churnMrr,    type:'neg' },
    { label:'End',     v:m.mrr,         type:'total' },
  ];
  // floating-bar geometry
  let run = 0; const bars = wf.map(s => {
    if (s.type === 'base' || s.type === 'total') { run = s.v; return { ...s, lo:0, hi:s.v }; }
    if (s.type === 'pos') { const lo = run; run += s.v; return { ...s, lo, hi:run }; }
    const hi = run; run -= s.v; return { ...s, lo:run, hi };
  });
  const peak = Math.max(...bars.map(b => b.hi), 1);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(auto-fit,minmax(140px,1fr))', gap:12 }}>
        <AnStat label="Current MRR" value={aMoney(m.mrr)} foot={`${aMoney(m.mrr * 12)} ARR`} />
        <AnStat label="ARPU" value={`$${m.arpu.toFixed(2)}`} foot="per user / mo" />
        <AnStat label="ARPPU" value={`$${m.arppu.toFixed(2)}`} foot="per paying user" />
        <AnStat label="LTV" value={aMoney(Math.round(m.ltv))} foot={`churn ${(m.ltv ? (m.arppu / m.ltv * 100) : 0).toFixed(1)}%/mo`} />
        <AnStat label="LTV : CAC" value={`${(m.ltv / m.cac).toFixed(1)}×`} foot={`CAC $${m.cac}`} tone={(m.ltv / m.cac) >= 3 ? 'up' : 'down'} />
        <AnStat label="NRR" value={`${m.nrr}%`} foot="net revenue retention" tone={m.nrr >= 100 ? 'up' : 'down'} />
        <AnStat label="GRR" value={`${m.grr}%`} foot="gross revenue retention" />
      </div>
      <AdminCard title="MRR movement · this month">
        <div style={{ display:'flex', alignItems:'flex-end', gap: isMobile ? 6 : 14, height:180 }}>
          {bars.map((b, i) => {
            const color = b.type === 'pos' ? VM.up : b.type === 'neg' ? VM.down : VM.forest;
            return (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-end', height:'100%' }}>
                <Mono size={9} color={VM.ink2}>{b.type === 'neg' ? '-' : b.type === 'pos' ? '+' : ''}${Math.abs(b.type === 'base' || b.type === 'total' ? b.v : b.v)}</Mono>
                <div style={{ width:'100%', maxWidth:54, position:'relative', height:`${(b.hi - b.lo) / peak * 100}%`, minHeight:3,
                  marginBottom:`${b.lo / peak * 100}%`, background:color, borderRadius:4, opacity: b.type === 'total' || b.type === 'base' ? 1 : 0.85 }}></div>
                <Mono size={8.5} color={VM.ink3} style={{ marginTop:5 }}>{b.label}</Mono>
              </div>
            );
          })}
        </div>
      </AdminCard>
      <AdminCard title="MRR trend · last 12 months">
        <AnLine data={m.trend} prefix="$" color={VM.teal} />
      </AdminCard>
      <AdminCard title="Plan movement · last quarter">
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {AN_PLAN_MOVE.map(p => (
            <div key={p.plan}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontFamily:VM.serif, fontSize:14, color:VM.ink }}>From <b>{p.plan}</b></span>
                <Mono size={10} color={VM.ink3}>{p.dist.map(d => `${d[0]} ${d[1]}%`).join(' · ')}</Mono>
              </div>
              <div style={{ display:'flex', height:18, borderRadius:5, overflow:'hidden' }}>
                {p.dist.map((d, i) => (
                  <div key={i} title={`${d[0]}: ${d[1]}%`} style={{ width:`${d[1]}%`, background:d[2] }}></div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:14, flexWrap:'wrap', marginTop:12 }}>
          {[['Stayed', VM.faint],['Upgrade', VM.forest],['Downgrade', VM.teal],['Churned', VM.down]].map(([l, c]) => (
            <span key={l} style={{ display:'inline-flex', alignItems:'center', gap:5, fontFamily:VM.serif, fontSize:11, color:VM.ink3 }}>
              <span style={{ width:10, height:10, borderRadius:3, background:c }}></span>{l}
            </span>
          ))}
        </div>
        <Mono size={9.5} color={VM.faint} style={{ display:'block', marginTop:10 }}>Illustrative quarter-over-quarter plan transitions.</Mono>
      </AdminCard>
    </div>
  );
}

// ── Tool 4: Engagement ───────────────────────────────────────────────────────
const AN_PAGES = [
  { name:'Home',              v:4120 }, { name:'Search',          v:3380 },
  { name:'Company dashboard', v:2960 }, { name:'Dependency map',  v:2210 },
  { name:'Calendar',          v:1740 }, { name:'My Portfolio',    v:1520 },
  { name:'Learn',             v:1180 }, { name:'News',            v:980  },
  { name:'My Business',       v:640  },
];
function AnEngagement({ isMobile }) {
  const e = React.useMemo(() => {
    const dau = VM_USERS.filter(u => anWithin(u.lastActive, 1)).length;
    const wau = VM_USERS.filter(u => anWithin(u.lastActive, 7)).length;
    const mau = VM_USERS.filter(u => anWithin(u.lastActive, 30)).length;
    return { dau, wau, mau, stickiness: mau ? Math.round(dau / mau * 100) : 0 };
  }, []);
  // Engagement depth — days active in the last 28 (Facebook's L28). Synthesised
  // per user (we only snapshot lastActive) but stable + status-weighted.
  const depth = React.useMemo(() => {
    const buckets = [{ label:'1–3', min:1, max:3, n:0 }, { label:'4–7', min:4, max:7, n:0 }, { label:'8–14', min:8, max:14, n:0 }, { label:'15–21', min:15, max:21, n:0 }, { label:'22–28', min:22, max:28, n:0 }];
    let core = 0, any = 0;
    VM_USERS.forEach(u => {
      if (!anWithin(u.lastActive, 28)) return;
      const rnd = vmRng(u.id * 97 + 3);
      let d = u.status === 'active' ? 8 + Math.floor(rnd() * 21) : u.status === 'trial' ? 2 + Math.floor(rnd() * 10) : 1 + Math.floor(rnd() * 5);
      d = Math.min(28, d); any++; if (d >= 15) core++;
      const b = buckets.find(b => d >= b.min && d <= b.max); if (b) b.n++;
    });
    return { buckets, corePct: any ? Math.round(core / any * 100) : 0, any };
  }, []);
  const maxV = AN_PAGES[0].v;
  const maxB = Math.max(...depth.buckets.map(b => b.n), 1);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(auto-fit,minmax(140px,1fr))', gap:12 }}>
        <AnStat label="DAU" value={e.dau} foot="active today" />
        <AnStat label="WAU" value={e.wau} foot="active this week" />
        <AnStat label="MAU" value={e.mau} foot="active this month" />
        <AnStat label="Stickiness" value={`${e.stickiness}%`} foot="DAU / MAU" tone={e.stickiness >= 20 ? 'up' : undefined} />
        <AnStat label="Avg session" value="6m 12s" foot="per visit" />
      </div>
      <AdminCard title="Engagement depth · days active in last 28 (L28)">
        <div style={{ display:'flex', alignItems:'flex-end', gap:14, height:140 }}>
          {depth.buckets.map((b, i) => (
            <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-end', height:'100%', gap:5 }}>
              <Mono size={9} color={VM.ink3}>{b.n}</Mono>
              <div title={`${b.label} days: ${b.n} users`} style={{ width:'100%', maxWidth:40, height:`${b.n / maxB * 100}%`, minHeight:3,
                background: i >= 3 ? VM.forest : VM.tealTint2, borderRadius:'4px 4px 0 0' }}></div>
              <Mono size={8.5} color={VM.ink3}>{b.label}</Mono>
            </div>
          ))}
        </div>
        <Mono size={9.5} color={VM.faint} style={{ display:'block', marginTop:10 }}><b style={{ color:VM.forest }}>{depth.corePct}%</b> of active users are <b style={{ color:VM.ink3 }}>core</b> (15+ days/28) — your power users.</Mono>
      </AdminCard>
      <AdminCard title="Most-used pages">
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {AN_PAGES.map(p => (
            <div key={p.name} style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ flex:1, fontFamily:VM.serif, fontSize:14, color:VM.ink2 }}>{p.name}</span>
              <div style={{ flex:1.4 }}><ProgressBar v={p.v / maxV * 100} /></div>
              <Mono size={11} color={VM.ink2} style={{ minWidth:42, textAlign:'right' }}>{p.v.toLocaleString('en-US')}</Mono>
            </div>
          ))}
        </div>
        <Mono size={9.5} color={VM.faint} style={{ display:'block', marginTop:12 }}>Illustrative — for real per-page interaction data, see the <b style={{ color:VM.ink3 }}>Heatmap</b> sub-tab.</Mono>
      </AdminCard>
    </div>
  );
}

// Illustrative quarter-over-quarter plan transitions (used by Revenue).
const AN_PLAN_MOVE = [
  { plan:'Free', dist:[['Stayed', 88, VM.faint], ['Upgrade', 8, VM.forest], ['Churned', 4, VM.down]] },
  { plan:'Plus', dist:[['Stayed', 79, VM.faint], ['Upgrade', 9, VM.forest], ['Downgrade', 5, VM.teal], ['Churned', 7, VM.down]] },
  { plan:'Pro',  dist:[['Stayed', 86, VM.faint], ['Downgrade', 6, VM.teal], ['Churned', 8, VM.down]] },
];

// ── Tool 5: Growth accounting ────────────────────────────────────────────────
// MAU change decomposed into New + Resurrected + Retained − Churned, plus the
// growth Quick Ratio = (new + resurrected) / churned (>1 = growing). Per-user
// monthly activity is synthesised (with gaps, so resurrection appears) from the
// snapshot — deterministic via the seeded RNG.
function AnGrowth({ isMobile }) {
  const data = React.useMemo(() => {
    const nowKey = anMKey(VM_NOW), startKey = nowKey - 11;
    const active = {}; for (let k = startKey; k <= nowKey; k++) active[k] = new Set();
    const joinedKey = {};
    VM_USERS.forEach(u => {
      joinedKey[u.id] = anMKey(u.joined);
      const rnd = vmRng(u.id * 1313 + 7);
      const from = Math.max(joinedKey[u.id], startKey), to = Math.min(anMKey(u.lastActive), nowKey);
      for (let k = from; k <= to; k++) { if (k === joinedKey[u.id] || rnd() < 0.8) active[k].add(u.id); }
    });
    const rows = [];
    for (let k = startKey + 1; k <= nowKey; k++) {
      const cur = active[k], prev = active[k - 1];
      let nu = 0, res = 0, ret = 0, ch = 0;
      cur.forEach(id => { if (joinedKey[id] === k) nu++; else if (prev.has(id)) ret++; else res++; });
      prev.forEach(id => { if (!cur.has(id)) ch++; });
      const d = new Date(VM_NOW.getFullYear(), VM_NOW.getMonth() - (nowKey - k), 1);
      rows.push({ label: d.toLocaleString('en-US', { month:'short' }), mau: cur.size, nu, res, ret, ch, net: nu + res - ch, qr: ch ? (nu + res) / ch : (nu + res) });
    }
    return rows.slice(-8);
  }, []);
  const latest = data[data.length - 1];
  const maxPos = Math.max(...data.map(r => r.ret + r.nu + r.res), 1);
  const maxNeg = Math.max(...data.map(r => r.ch), 1);
  const POS = 132, NEG = 48;
  const px = v => Math.round(v / maxPos * POS);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      <p style={{ fontFamily:VM.serif, fontSize:14.5, color:VM.ink2, lineHeight:1.5, margin:0, maxWidth:680 }}>
        Every month's active-user change, split into where it came from. The <b>Quick Ratio</b> = (new + resurrected) ÷ churned — above <b>1</b> means you're growing; Facebook's growth team used this as a north-star health check.
      </p>
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(auto-fit,minmax(140px,1fr))', gap:12 }}>
        <AnStat label="Quick Ratio" value={latest.qr.toFixed(2)} foot="(new+resurr) / churned" tone={latest.qr >= 1 ? 'up' : 'down'} />
        <AnStat label="MAU" value={latest.mau} foot="this month" />
        <AnStat label="Net adds" value={`${latest.net >= 0 ? '+' : ''}${latest.net}`} foot="this month" tone={latest.net >= 0 ? 'up' : 'down'} />
        <AnStat label="Churned" value={latest.ch} foot="lost this month" tone="down" />
      </div>
      <AdminCard title="Growth accounting · monthly">
        <div style={{ display:'flex', alignItems:'stretch', gap: isMobile ? 4 : 12 }}>
          {data.map((r, i) => (
            <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center' }}>
              <Mono size={9} weight={700} color={r.qr >= 1 ? VM.upInk : VM.downInk}>{r.qr.toFixed(1)}</Mono>
              <div style={{ height:POS, width:'100%', maxWidth:44, margin:'0 auto', display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
                <div title={`Resurrected ${r.res}`} style={{ height:px(r.res), background:VM.teal }}></div>
                <div title={`New ${r.nu}`} style={{ height:px(r.nu), background:VM.up }}></div>
                <div title={`Retained ${r.ret}`} style={{ height:px(r.ret), background:VM.forest }}></div>
              </div>
              <div style={{ height:1, width:'100%', background:VM.border }}></div>
              <div style={{ height:NEG, width:'100%', maxWidth:44, margin:'0 auto' }}>
                <div title={`Churned ${r.ch}`} style={{ height:Math.round(r.ch / maxNeg * NEG), background:VM.down, opacity:0.85 }}></div>
              </div>
              <Mono size={8.5} color={VM.ink3} style={{ marginTop:5 }}>{r.label}</Mono>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:14, flexWrap:'wrap', marginTop:14 }}>
          {[['Retained', VM.forest],['New', VM.up],['Resurrected', VM.teal],['Churned', VM.down]].map(([l, c]) => (
            <span key={l} style={{ display:'inline-flex', alignItems:'center', gap:5, fontFamily:VM.serif, fontSize:11, color:VM.ink3 }}>
              <span style={{ width:10, height:10, borderRadius:3, background:c }}></span>{l}
            </span>
          ))}
        </div>
      </AdminCard>
    </div>
  );
}

// ── Tool 6: Churn risk ───────────────────────────────────────────────────────
// Ranks paying (Plus/Pro) accounts by a churn-risk score so the operator gets a
// "save list" before they actually churn. Score blends recency, trial status and
// low product usage.
function AnRisk({ isMobile }) {
  const list = React.useMemo(() => {
    return VM_USERS.filter(u => u.plan !== 'Free' && u.status !== 'churned').map(u => {
      const recency = Math.round((VM_NOW - u.lastActive) / DAY_MS);
      let score = recency * 4 + (u.status === 'trial' ? 34 : 0) + Math.max(0, 18 - u.lessons) * 2.2;
      if (anWithin(u.joined, 30) && u.lessons < 4) score += 14;
      score = Math.max(0, Math.min(100, Math.round(score)));
      const reasons = [];
      if (recency > 7) reasons.push(`${recency}d idle`);
      if (u.status === 'trial') reasons.push('trial ending');
      if (u.lessons < 6) reasons.push('low usage');
      if (!reasons.length) reasons.push('engagement dipping');
      return { u, score, recency, mrr: A_PLAN_PRICE[u.plan], reason: reasons.slice(0, 2).join(' · ') };
    }).sort((a, b) => b.score - a.score);
  }, []);
  const high = list.filter(r => r.score >= 60), med = list.filter(r => r.score >= 35 && r.score < 60);
  const mrrAtRisk = high.reduce((s, r) => s + r.mrr, 0);
  const top = list.slice(0, 14);
  const tier = (s) => s >= 60 ? { l:'High', c:VM.downInk, bg:'rgba(163,45,45,0.10)' } : s >= 35 ? { l:'Med', c:VM.terra, bg:'rgba(196,106,59,0.12)' } : { l:'Low', c:VM.ink3, bg:VM.paperWarm };
  const cols = '1.6fr 0.6fr 0.7fr 0.8fr 1.4fr';
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      <p style={{ fontFamily:VM.serif, fontSize:14.5, color:VM.ink2, lineHeight:1.5, margin:0, maxWidth:680 }}>
        Paying accounts most likely to cancel, scored on recency, trial status and product usage — reach out to these before they go.
      </p>
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(auto-fit,minmax(150px,1fr))', gap:12 }}>
        <AnStat label="High risk" value={high.length} foot="score ≥ 60" tone="down" />
        <AnStat label="Medium risk" value={med.length} foot="score 35–59" />
        <AnStat label="MRR at risk" value={aMoney(mrrAtRisk)} foot="high-risk accounts" tone="down" />
      </div>
      <AdminCard title="Save list · highest churn risk">
        <div style={{ overflowX:'auto' }}>
          <div style={{ minWidth: 520 }}>
            <div style={{ display:'grid', gridTemplateColumns: cols, gap:8, padding:'0 0 8px', borderBottom:`1px solid ${VM.borderSoft}` }}>
              {['Account', 'Plan', 'Risk', 'Last seen', 'Why'].map((h, i) => <Label key={i}>{h}</Label>)}
            </div>
            {top.map((r, i) => {
              const t = tier(r.score);
              return (
                <div key={r.u.id} style={{ display:'grid', gridTemplateColumns: cols, gap:8, alignItems:'center', padding:'9px 0', borderBottom: i === top.length - 1 ? 'none' : `1px solid ${VM.borderHair}` }}>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontFamily:VM.serif, fontSize:13.5, color:VM.ink, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{r.u.name}</div>
                    <Mono size={9.5} color={VM.ink3}>{r.u.country}</Mono>
                  </div>
                  <Mono size={11} weight={600} color={A_PLAN_COLOR[r.u.plan]}>{r.u.plan}</Mono>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontFamily:VM.mono, fontSize:8.5, fontWeight:700, padding:'2px 6px', borderRadius:4, color:t.c, background:t.bg, border:`1px solid ${t.c}` }}>{r.score}</span>
                  </span>
                  <Mono size={10.5} color={VM.ink3}>{aRel(r.u.lastActive)}</Mono>
                  <Mono size={10.5} color={VM.ink2}>{r.reason}</Mono>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ marginTop:12, textAlign:'right' }}>
          <button onClick={() => adminDownloadCSV('vm_churn_risk.csv', ['Name','Email','Plan','Score','LastActive','MRR','Reason'],
            list.filter(r => r.score >= 35).map(r => [r.u.name, r.u.email, r.u.plan, r.score, aDate(r.u.lastActive), r.mrr, r.reason]))}
            style={{ display:'inline-flex', alignItems:'center', gap:6, fontFamily:VM.mono, fontSize:10, letterSpacing:'0.04em', textTransform:'uppercase',
              padding:'6px 12px', borderRadius:6, border:`1px solid ${VM.border}`, background:VM.paper, color:VM.ink2, cursor:'pointer' }}>
            <i className="ti ti-download" style={{ fontSize:13 }}></i>Export save list
          </button>
        </div>
      </AdminCard>
    </div>
  );
}

// ── Team ────────────────────────────────────────────────────────────────────
// Per-employee admin permissions. Backed by three real Cognito groups
// (admin-suspend / admin-delete / admin-billing) enforced server-side in
// vm-admin-actions — this UI is just a client for that, not the authority.
// An admin who's never been touched here shows as "Full admin" (today's
// default, unrestricted); ticking any box for them switches them to exactly
// what's ticked. See the Lambda's SAFE ROLLOUT RULE comment for why.
// Two sections: which Admin tabs an employee even sees (Users has no group —
// it's the floor everyone gets; Team never shows to non-full-admins), and
// which mutating actions they can take inside Users. Same six groups the
// Lambda's PERMISSION_GROUPS knows about — keep these two lists in sync.
const TEAM_SECTIONS = [
  { title: 'Tabs', perms: [
    { group: 'admin-view-overview',  label: 'Overview' },
    { group: 'admin-view-analytics', label: 'Analytics' },
    { group: 'admin-view-courses',   label: 'Courses' },
  ] },
  { title: 'Actions', perms: [
    { group: 'admin-suspend', label: 'Suspend / reactivate' },
    { group: 'admin-delete',  label: 'Delete' },
    { group: 'admin-billing', label: 'Change plan' },
  ] },
];
const TEAM_PERMS = TEAM_SECTIONS.flatMap(s => s.perms);
const TEAM_GRID_COLS = `1.5fr repeat(${TEAM_PERMS.length}, 0.85fr)`;

function useAdminTeam() {
  const [state, setState] = useStateAdmin({ team: null, loading: true, error: null });
  const load = React.useCallback(() => {
    setState(s => ({ ...s, loading: true, error: null }));
    vmAdminAction('listTeam').then(r => {
      setState({ team: r.ok ? r.team : null, loading: false, error: r.ok ? null : r.error });
    });
  }, []);
  React.useEffect(() => { load(); }, [load]);
  return { ...state, refresh: load };
}

function TeamTab({ user, isMobile }) {
  const { team, loading, error, refresh } = useAdminTeam();
  const [busy, setBusy] = useStateAdmin(null);       // `${sub}:${group}` currently saving
  const [toggleError, setToggleError] = useStateAdmin('');

  async function toggle(member, group, grant) {
    const key = `${member.sub}:${group}`;
    setBusy(key); setToggleError('');
    const r = await vmAdminAction('setPermissions', member.sub, { group, grant });
    setBusy(null);
    if (r.ok) refresh();
    else setToggleError(r.error || 'Could not update permissions.');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontFamily: VM.serif, fontSize: 14, color: VM.ink3, maxWidth: 640, lineHeight: 1.55 }}>
        Control exactly which tabs each fellow admin can see and which actions they can take. The <strong>Users</strong> tab
        always stays visible — it's the floor. Anyone not yet configured here is a <strong>full admin</strong> (today's
        default); ticking a box for someone switches them to exactly what's ticked. You can't change your own permissions from here.
      </div>

      {loading && <Mono size={11} color={VM.ink3}><i className="ti ti-loader-2" style={{ fontSize: 13 }}></i> Loading team…</Mono>}

      {toggleError && (
        <div style={{ border: `1px solid ${VM.terra}`, background: 'rgba(196,106,59,0.10)', borderRadius: 10, padding: '10px 14px', fontFamily: VM.serif, fontSize: 13, color: VM.ink }}>
          {toggleError}
        </div>
      )}

      {!loading && error && (
        <div style={{ border: `1px solid ${VM.terra}`, background: 'rgba(196,106,59,0.10)', borderRadius: 10, padding: '12px 15px', fontFamily: VM.serif, fontSize: 13.5, color: VM.ink }}>
          {error === 'not configured'
            ? 'Team permissions aren’t wired up yet — the vm-admin-actions Lambda URL needs a redeploy that includes the Team endpoints.'
            : error}
        </div>
      )}

      {!loading && !error && team && (
        <div style={{ background: VM.paper, border: `1px solid ${VM.borderSoft}`, borderRadius: 12, overflowX: 'auto' }}>
          <div style={{ minWidth: isMobile ? 780 : 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: TEAM_GRID_COLS, gap: 8, padding: '8px 16px 0' }}>
              <span></span>
              {TEAM_SECTIONS.map(s => (
                <span key={s.title} style={{ gridColumn: `span ${s.perms.length}`, fontFamily: VM.mono, fontSize: 9, fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase', color: VM.ink3, textAlign: 'center' }}>{s.title}</span>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: TEAM_GRID_COLS, gap: 8, padding: '6px 16px 10px', borderBottom: `1px solid ${VM.borderSoft}` }}>
              <Label>Admin</Label>
              {TEAM_PERMS.map(p => <Label key={p.group} style={{ textAlign: 'center' }}>{p.label}</Label>)}
            </div>
            {team.map(m => {
              const isSelf = user && m.email === user.email;
              return (
                <div key={m.sub} style={{ display: 'grid', gridTemplateColumns: TEAM_GRID_COLS, gap: 8, alignItems: 'center', padding: '11px 16px', borderBottom: `1px solid ${VM.borderHair}` }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: VM.serif, fontSize: 14, color: VM.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {m.name || m.email} {isSelf && <span style={{ fontFamily: VM.mono, fontSize: 9.5, color: VM.ink3 }}>(you)</span>}
                    </div>
                    <Mono size={10} color={VM.ink3}>{m.email}</Mono>
                    {!m.migrated && (
                      <div style={{ marginTop: 3 }}>
                        <span style={{ fontFamily: VM.mono, fontSize: 8.5, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                          color: VM.forest, background: 'rgba(29,78,58,0.10)', borderRadius: 4, padding: '2px 6px' }}>Full admin</span>
                      </div>
                    )}
                  </div>
                  {TEAM_PERMS.map(p => {
                    const checked = m.migrated ? m.permissions.includes(p.group) : true;
                    const key = `${m.sub}:${p.group}`;
                    return (
                      <label key={p.group} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: isSelf ? 'not-allowed' : 'pointer', opacity: isSelf ? 0.5 : 1 }}>
                        <input type="checkbox" checked={checked} disabled={isSelf || busy === key}
                          onChange={(e) => toggle(m, p.group, e.target.checked)}
                          style={{ width: 15, height: 15, accentColor: VM.forest, cursor: isSelf ? 'not-allowed' : 'pointer' }} />
                        {busy === key && <i className="ti ti-loader-2" style={{ fontSize: 12, color: VM.ink3 }}></i>}
                      </label>
                    );
                  })}
                </div>
              );
            })}
            {!team.length && (
              <div style={{ padding: '18px 16px', fontFamily: VM.serif, fontSize: 13.5, color: VM.ink3 }}>No admins found.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { AdminPanel });
