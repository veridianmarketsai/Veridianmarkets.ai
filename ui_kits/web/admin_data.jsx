// Veridian Markets — TEMPORARY in-memory "database" for the admin panel.
// 100 deterministically-generated fake users + aggregate stats. This stands in
// for a real backend (AWS) so we can build the admin UI now; swap VM_USERS for
// a live API later. Numbers are fictional.

// Deterministic PRNG (mulberry32) so the dataset is stable across reloads.
function vmRng(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The app's mock "today" (keeps "new this week" stats stable).
const VM_NOW = new Date(2026, 4, 31);
const DAY = 86400000;

const VM_FIRST = ['James', 'Maria', 'Wei', 'Sofia', 'Liam', 'Aisha', 'Noah', 'Yuki', 'Ava', 'Omar', 'Mia', 'Lucas', 'Priya', 'Ethan', 'Chloe', 'Mateo', 'Ines', 'Hassan', 'Freya', 'Diego', 'Nadia', 'Kai', 'Lena', 'Tom', 'Zara'];
const VM_LAST = ['Smith', 'García', 'Chen', 'Rossi', 'Nguyen', 'Khan', 'Müller', 'Tanaka', 'Johnson', 'Silva', 'Okafor', 'Kowalski', 'Patel', 'Andersson', 'Dubois', 'Costa', 'Haddad', 'Lindqvist', 'Park', 'Murphy'];
const VM_COUNTRIES = [
  { c: 'United Kingdom', w: 26 }, { c: 'United States', w: 24 }, { c: 'Germany', w: 10 },
  { c: 'India', w: 9 }, { c: 'Spain', w: 7 }, { c: 'Brazil', w: 6 }, { c: 'France', w: 5 },
  { c: 'Japan', w: 5 }, { c: 'Nigeria', w: 4 }, { c: 'Australia', w: 4 },
];
const VM_PLANS = [
  { p: 'Free', w: 60, price: 0 }, { p: 'Plus', w: 28, price: 9 }, { p: 'Pro', w: 12, price: 19 },
];
const VM_STATUSES = [{ s: 'active', w: 64 }, { s: 'trial', w: 14 }, { s: 'churned', w: 22 }];

function vmPickWeighted(rnd, list, key, wkey = 'w') {
  const total = list.reduce((s, x) => s + x[wkey], 0);
  let r = rnd() * total;
  for (const x of list) { r -= x[wkey]; if (r <= 0) return x[key]; }
  return list[0][key];
}

function vmBuildUsers() {
  const rnd = vmRng(20260531);
  const users = [];
  for (let i = 0; i < 100; i++) {
    const first = VM_FIRST[Math.floor(rnd() * VM_FIRST.length)];
    const last = VM_LAST[Math.floor(rnd() * VM_LAST.length)];
    const plan = vmPickWeighted(rnd, VM_PLANS, 'p');
    const status = vmPickWeighted(rnd, VM_STATUSES, 's');
    const country = vmPickWeighted(rnd, VM_COUNTRIES, 'c');
    const joinedAgo = Math.floor(rnd() * 540) + 1;
    const joined = new Date(VM_NOW.getTime() - joinedAgo * DAY);
    // active users seen recently; churned a while ago; trials in between
    const lastAgo = status === 'active' ? Math.floor(rnd() * 6)
      : status === 'trial' ? Math.floor(rnd() * 14) + 1
      : Math.floor(rnd() * 90) + 30;
    const lastActive = new Date(VM_NOW.getTime() - Math.min(lastAgo, joinedAgo) * DAY);
    const enrolled = Math.floor(rnd() * 6) + (plan === 'Free' ? 0 : 1);
    const lessons = Math.floor(rnd() * 48 * (status === 'active' ? 1 : 0.4));
    users.push({
      id: i + 1, name: first + ' ' + last,
      email: (first + '.' + last).toLowerCase().normalize('NFD').replace(/[^a-z.]/g, '') + (i + 1) + '@example.com',
      plan, status, country, joined, lastActive, enrolled, lessons,
    });
  }
  return users;
}

const VM_USERS = vmBuildUsers();

// Aggregate stats for the dashboard.
function vmUserStats(users = VM_USERS) {
  const within = (d, days) => (VM_NOW - d) <= days * DAY;
  const byPlan = { Free: 0, Plus: 0, Pro: 0 };
  const byStatus = { active: 0, trial: 0, churned: 0 };
  const byCountry = {};
  let mrr = 0, lessons = 0;
  users.forEach(u => {
    byPlan[u.plan]++; byStatus[u.status]++;
    byCountry[u.country] = (byCountry[u.country] || 0) + 1;
    if (u.status !== 'churned') mrr += VM_PLANS.find(p => p.p === u.plan).price;
    lessons += u.lessons;
  });
  const months = [];
  for (let m = 11; m >= 0; m--) {
    const d = new Date(VM_NOW.getFullYear(), VM_NOW.getMonth() - m, 1);
    const label = d.toLocaleString('en-US', { month: 'short' });
    const count = users.filter(u => u.joined.getFullYear() === d.getFullYear() && u.joined.getMonth() === d.getMonth()).length;
    months.push({ label, count });
  }
  const topCountries = Object.entries(byCountry).map(([c, n]) => ({ c, n })).sort((a, b) => b.n - a.n).slice(0, 6);
  return {
    total: users.length,
    active: byStatus.active, trial: byStatus.trial, churned: byStatus.churned,
    newThisWeek: users.filter(u => within(u.joined, 7)).length,
    newThisMonth: users.filter(u => within(u.joined, 30)).length,
    paying: byPlan.Plus + byPlan.Pro,
    mrr, lessons, byPlan, byStatus, months, topCountries,
  };
}

// Per-user "personal profits" — seeded from the user id (independent of the main
// generation stream, so it doesn't disturb the user list). Mock figures.
function vmUserProfits(u) {
  const rnd = vmRng(u.id * 7919 + 13);
  const base = u.plan === 'Pro' ? 20000 + rnd() * 180000 : u.plan === 'Plus' ? 5000 + rnd() * 45000 : 300 + rnd() * 7000;
  const value = Math.round(base);
  const profitPct = u.status === 'churned' ? (rnd() * 40 - 28) : (rnd() * 120 - 30);
  const cost = value / (1 + profitPct / 100);
  const profit = Math.round(value - cost);
  const dayPct = rnd() * 6 - 3;
  return { value, cost: Math.round(cost), profit, profitPct, dayPct, dayChg: Math.round(value * dayPct / 100), dir: profit >= 0 ? 'up' : 'down' };
}

Object.assign(window, { VM_USERS, vmUserStats, vmUserProfits, VM_NOW });
