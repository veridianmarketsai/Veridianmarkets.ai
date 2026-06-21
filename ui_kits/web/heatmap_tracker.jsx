// Veridian Markets — Customer Interaction Tracker
// Collects clicks, scroll depth, hover dwell, mouse movement, and text selection.
// All coordinates are stored as 0–100 viewport percentages (device-independent).
// Data is capped at 5 000 events in localStorage under 'vm_heatmap_events'.
// Exposes window.__vmHeatmap = { get, clear, push, sessionId }.
(function () {
  const MAX        = 5000;
  const KEY        = 'vm_heatmap_events';
  const SID_KEY    = 'vm_heatmap_sid';
  const THROTTLE   = 220;   // ms between stored mousemove events
  const DWELL      = 650;   // ms hover on element before storing as 'hover'

  // Session ID resets on tab close so each page session is distinct.
  let sid = sessionStorage.getItem(SID_KEY);
  if (!sid) { sid = Math.random().toString(36).slice(2, 10); sessionStorage.setItem(SID_KEY, sid); }

  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } };
  const save = a  => { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch {} };
  const push = ev => { const a = load(); a.push(ev); if (a.length > MAX) a.splice(0, a.length - MAX); save(a); };

  const route  = () => location.pathname.replace(/^\//, '') || 'front';
  const pct    = (v, t) => +((v / Math.max(1, t)) * 100).toFixed(1);
  const elKey  = el => {
    if (!el || !el.tagName) return '?';
    const id  = el.id ? `#${el.id}` : '';
    const cls = [...(el.classList || [])].slice(0, 2).map(c => `.${c}`).join('');
    return `${el.tagName.toLowerCase()}${id}${cls}`.slice(0, 50);
  };
  const mk = (type, extra) => ({
    t: type, page: route(), ts: Date.now(), sid,
    sw: window.innerWidth, sh: window.innerHeight,
    ...extra,
  });

  // ── Clicks + rage-click detection ───────────────────────────────────────────
  // Rage = 3+ clicks within 500 ms in a 50 px radius → frustration signal.
  const recent = [];
  window.addEventListener('click', e => {
    const x = pct(e.clientX, window.innerWidth);
    const y = pct(e.clientY, window.innerHeight);
    const now = Date.now();
    recent.push({ x: e.clientX, y: e.clientY, ts: now });
    while (recent.length && now - recent[0].ts > 500) recent.shift();
    if (recent.filter(c => Math.hypot(c.x - e.clientX, c.y - e.clientY) < 50).length >= 3) {
      push(mk('rage', { x, y, n: recent.length }));
    }
    push(mk('click', { x, y, el: elKey(e.target) }));
  }, { capture: true, passive: true });

  // ── Scroll depth ─────────────────────────────────────────────────────────────
  // Stores the current depth and the session maximum so we know how far users reach.
  let maxDepth = 0, scrollTimer;
  const onScroll = () => {
    const el   = document.getElementById('vm-main');
    const top  = el ? el.scrollTop  : window.scrollY;
    const full = el ? el.scrollHeight - el.clientHeight
                    : document.body.scrollHeight - window.innerHeight;
    const depth = pct(top, full);
    maxDepth = Math.max(maxDepth, depth);
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => push(mk('scroll', { depth, maxDepth })), 380);
  };
  window.addEventListener('scroll', onScroll, { capture: true, passive: true });

  // ── Mouse movement (throttled) ────────────────────────────────────────────────
  let lastMove = 0;
  window.addEventListener('mousemove', e => {
    const now = Date.now();
    if (now - lastMove < THROTTLE) return;
    lastMove = now;
    push(mk('move', { x: pct(e.clientX, window.innerWidth), y: pct(e.clientY, window.innerHeight) }));
  }, { passive: true });

  // ── Hover dwell — reading proxy ───────────────────────────────────────────────
  // A sustained hover on a readable element is a good proxy for "reading this content".
  const READABLE = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'SPAN', 'LI', 'A', 'BUTTON', 'TD', 'TH', 'LABEL', 'STRONG', 'EM']);
  let dwellTimer, dwellEl, dwellStart;
  window.addEventListener('mouseover', e => {
    if (!READABLE.has(e.target.tagName)) return;
    clearTimeout(dwellTimer);
    dwellEl = e.target; dwellStart = Date.now();
    dwellTimer = setTimeout(() => {
      const r = dwellEl.getBoundingClientRect();
      push(mk('hover', {
        x:   pct(r.left + r.width  / 2, window.innerWidth),
        y:   pct(r.top  + r.height / 2, window.innerHeight),
        dur: Date.now() - dwellStart,
        el:  elKey(dwellEl),
      }));
    }, DWELL);
  }, { passive: true });
  window.addEventListener('mouseout', () => clearTimeout(dwellTimer), { passive: true });

  // ── Text selection ────────────────────────────────────────────────────────────
  // Users selecting text are almost certainly reading or intending to copy.
  let selTimer;
  document.addEventListener('selectionchange', () => {
    clearTimeout(selTimer);
    selTimer = setTimeout(() => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.toString().length < 4) return;
      const r = sel.getRangeAt(0).getBoundingClientRect();
      push(mk('select', {
        x:   pct(r.left + r.width / 2, window.innerWidth),
        y:   pct(r.top  + r.height / 2, window.innerHeight),
        len: sel.toString().length,
      }));
    }, 300);
  });

  window.__vmHeatmap = { get: load, clear: () => save([]), push, sessionId: sid };
})();
