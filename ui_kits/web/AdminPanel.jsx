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
const A_PLAN_PRICE = { Plus: 9, Pro: 19 };
const DAY_MS = 86400000;

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
    title:'Three tabs.',
    body:'Overview shows the headline KPIs and charts. Users lets you search, filter, and access any account on the platform. Courses lets you add, edit, or remove courses from the learn catalogue in real time.' },
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

function AdminPanel({ go, user, isMobile }) {
  const [tab, setTab] = useStateAdmin('overview');
  const [accessing, setAccessing] = useStateAdmin(null);   // simulated "access account" target
  const [tutorialOpen, setTutorialOpen] = useStateAdmin(false);
  const stats = React.useMemo(() => vmUserStats(), []);
  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'layout-dashboard' },
    { id: 'users',    label: 'Users',    icon: 'users' },
    { id: 'courses',  label: 'Courses',  icon: 'book' },
    { id: 'heatmap',  label: 'Heatmap',  icon: 'flame' },
  ];
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
        {tab === 'overview' && <OverviewTab stats={stats} isMobile={isMobile} />}
        {tab === 'users'    && <UsersTab onAccess={setAccessing} isMobile={isMobile} />}
        {tab === 'courses'  && <CoursesTab go={go} isMobile={isMobile} />}
        {tab === 'heatmap'  && <HeatmapAdmin isMobile={isMobile} />}
      </div>

      {tutorialOpen && <TutorialOverlay steps={ADMIN_STEPS} label="Admin panel tutorial" onClose={()=>setTutorialOpen(false)} />}
    </div>
  );
}

// ── Overview ────────────────────────────────────────────────────────────────
function OverviewTab({ stats, isMobile }) {
  const [kpiModal, setKpiModal] = useStateAdmin(null);
  const [chartModal, setChartModal] = useStateAdmin(null); // 'signups' | 'plans' | 'countries'
  const courseCount = vmGetCourses().length;
  const kpis = [
    { id:'total',   label: 'Total users',    value: stats.total,              foot: `${stats.active} active` },
    { id:'new',     label: 'New this week',  value: '+' + stats.newThisWeek,  foot: `${stats.newThisMonth} this month`,                               tone: 'up' },
    { id:'paying',  label: 'Paying',         value: stats.paying,             foot: `${(stats.paying / stats.total * 100).toFixed(0)}% of users` },
    { id:'mrr',     label: 'Est. MRR',       value: aMoney(stats.mrr),        foot: 'Plus + Pro' },
    { id:'churned', label: 'Churned',        value: stats.churned,            foot: `${(stats.churned / stats.total * 100).toFixed(0)}% of users`,    tone: 'down' },
    { id:'courses', label: 'Courses',        value: courseCount,              foot: 'in the catalogue' },
  ];
  const planData = [
    { label: 'Free', value: stats.byPlan.Free, color: A_PLAN_COLOR.Free },
    { label: 'Plus', value: stats.byPlan.Plus, color: A_PLAN_COLOR.Plus },
    { label: 'Pro',  value: stats.byPlan.Pro,  color: A_PLAN_COLOR.Pro  },
  ];
  const maxC = Math.max(...stats.topCountries.map(c => c.n), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
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
      {kpiModal && <AdminKpiModal kpiKey={kpiModal} stats={stats} onClose={() => setKpiModal(null)} />}
      {chartModal && <AdminChartModal chartKey={chartModal} stats={stats} onClose={() => setChartModal(null)} />}
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

function AdminKpiModal({ kpiKey, stats, onClose }) {
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
function AdminChartModal({ chartKey, stats, onClose }) {
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
                <div style={{ fontFamily: VM.serif, fontSize: 15, color: VM.ink, marginTop: 2 }}>{v}</div></div>
            ))}
          </div>
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
