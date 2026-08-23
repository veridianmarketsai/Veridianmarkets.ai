// Veridian Markets — "What's new" updates feed (vm-updates Lambda + DynamoDB).
// Admin → Updates tab writes; ReleaseNotes.jsx (the public /updates page) and
// the sign-in nudge below both read. Falls back to the hand-written
// RELEASE_NOTES mock in ReleaseNotes.jsx when VM_UPDATES.url isn't set yet or
// the fetch fails, same "live when available, mock otherwise" convention as
// marketdata.jsx.

const VM_UPDATES = { url: 'https://layjdfztoqsvjtojcao2nlnehi0cgbbf.lambda-url.us-east-1.on.aws/' };   // vm-updates Lambda Function URL

function vmUpdatesSession() {
  try { const s = JSON.parse(localStorage.getItem('vm_session') || 'null'); return (s && s.access) ? s : null; } catch { return null; }
}

async function vmFetchUpdates() {
  if (!VM_UPDATES.url) return null;   // caller falls back to the static mock
  try {
    const res = await fetch(VM_UPDATES.url);
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data.updates) ? data.updates : null;
  } catch { return null; }
}

async function vmWriteUpdates(method, payload) {
  const session = vmUpdatesSession();
  if (!VM_UPDATES.url || !session) throw new Error('Not signed in.');
  const res = await fetch(VM_UPDATES.url, {
    method,
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${session.access}` },
    body: JSON.stringify(payload || {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

const vmCreateUpdate = (fields) => vmWriteUpdates('POST', fields);
const vmEditUpdate   = (id, fields) => vmWriteUpdates('PUT', { id, ...fields });
const vmDeleteUpdate = (id) => vmWriteUpdates('DELETE', { id });

// React hook: live updates feed, or null while loading/unavailable (caller
// decides the mock fallback so it can keep its own curated copy).
function useVMUpdates() {
  const [updates, setUpdates] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    let alive = true;
    vmFetchUpdates().then(u => { if (alive) { setUpdates(u); setLoading(false); } });
    return () => { alive = false; };
  }, []);
  return { updates, loading, live: Array.isArray(updates) };
}

// ── "New update" nudge (sign-in) ─────────────────────────────────────────────
// Per-browser "have I seen the latest update" marker — same tier of persistence
// as the rest of the app's UI-state (learn nudge, tour completion, etc). This
// intentionally doesn't need to be cross-device: it's just "don't nag you
// about the same update twice on this browser."
const SEEN_KEY = 'vm_updates_last_seen';
function vmUpdatesLastSeen() { try { return Number(localStorage.getItem(SEEN_KEY) || 0); } catch { return 0; } }
function vmMarkUpdatesSeen(ts) { try { localStorage.setItem(SEEN_KEY, String(ts || Date.now())); } catch {} }

// ── Lightweight Markdown (bold / italic / bullet lists only) ────────────────
// The update body is authored as plain text with a few Markdown tokens
// (**bold**, *italic*, "- " bullets) via the toolbar in AdminPanel's Updates
// composer, then rendered here into real React elements — never raw HTML, so
// there's nothing to sanitize and no dangerouslySetInnerHTML.
function vmRenderMarkdownInline(text, keyPrefix) {
  const out = [];
  let rest = String(text || '');
  const re = /\*\*(.+?)\*\*|\*(.+?)\*/;
  let i = 0;
  while (rest.length) {
    const m = rest.match(re);
    if (!m) { out.push(rest); break; }
    if (m.index > 0) out.push(rest.slice(0, m.index));
    out.push(m[1] != null
      ? <strong key={`${keyPrefix}-b${i}`}>{m[1]}</strong>
      : <em key={`${keyPrefix}-i${i}`}>{m[2]}</em>);
    rest = rest.slice(m.index + m[0].length);
    i++;
  }
  return out;
}

function vmRenderMarkdown(text) {
  const lines = String(text || '').split('\n');
  const blocks = [];
  let list = null;
  lines.forEach((line) => {
    const bullet = line.match(/^\s*[-*]\s+(.*)/);
    if (bullet) {
      if (!list) { list = []; blocks.push({ type: 'ul', items: list }); }
      list.push(bullet[1]);
    } else {
      list = null;
      if (line.trim()) blocks.push({ type: 'p', text: line });
    }
  });
  return blocks.map((b, bi) => b.type === 'ul'
    ? <ul key={bi} style={{ margin: '2px 0 8px', paddingLeft: 20 }}>
        {b.items.map((it, ii) => <li key={ii} style={{ marginBottom: 2 }}>{vmRenderMarkdownInline(it, `${bi}-${ii}`)}</li>)}
      </ul>
    : <p key={bi} style={{ margin: '0 0 6px' }}>{vmRenderMarkdownInline(b.text, `${bi}`)}</p>);
}

Object.assign(window, {
  VM_UPDATES, vmFetchUpdates, vmCreateUpdate, vmEditUpdate, vmDeleteUpdate, useVMUpdates,
  vmUpdatesLastSeen, vmMarkUpdatesSeen, vmRenderMarkdown,
});
