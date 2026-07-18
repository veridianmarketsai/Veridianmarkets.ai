// Veridian Markets — silent first-party data capture (client side).
//
// vmCapture(type, props) queues an event; a small debounced batch POSTs to the
// vm-capture Lambda. vmIdentify(user, plan) attaches who the user is (name /
// email / plan) so signed-in behaviour, sign-up info and leads are all tied
// together. Fire-and-forget: capture never blocks or breaks the UI.
//
// Sends as text/plain (a CORS "simple request") so there's no preflight; we
// don't read the response, so no CORS headers are needed on it. No-op until
// VM_CAPTURE.url is set, so nothing breaks before the Lambda is deployed.

const VM_CAPTURE = { url: 'https://ynlw6vtjqrlij7hu7mgkz6ld6y0qesvs.lambda-url.us-east-1.on.aws/' };   // vm-capture Lambda
const VM_CAPTURE_SESSION = Math.random().toString(36).slice(2, 12);   // per page-load session
let _vmCapQueue = [];
let _vmCapIdentity = null;
let _vmCapTimer = null;

function vmAnonId() {
  try {
    let id = localStorage.getItem('vm_anon');
    if (!id) { id = 'a' + Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('vm_anon', id); }
    return id;
  } catch { return 'nostorage'; }
}

// Tell capture who the user is (or null on sign-out). Cheap to call often.
function vmIdentify(user, plan) {
  _vmCapIdentity = user && user.sub
    ? { sub: user.sub, email: user.email || '', name: user.name || '', plan: plan || 'free' }
    : (plan ? { plan } : null);
}

function vmCapture(type, props) {
  if (!type) return;
  _vmCapQueue.push({
    type,
    props: props || {},
    page: (typeof location !== 'undefined' ? location.pathname : ''),
    ts: Date.now(),
    sessionId: VM_CAPTURE_SESSION,
  });
  if (_vmCapQueue.length >= 12) return _vmCapFlush();
  if (!_vmCapTimer) _vmCapTimer = setTimeout(_vmCapFlush, 2500);
}

function _vmCapFlush(useBeacon) {
  if (_vmCapTimer) { clearTimeout(_vmCapTimer); _vmCapTimer = null; }
  if (!VM_CAPTURE.url || !_vmCapQueue.length) return;
  const batch = _vmCapQueue.splice(0, 25);
  const body = JSON.stringify({ events: batch, anonId: vmAnonId(), user: _vmCapIdentity });
  try {
    if (useBeacon && navigator.sendBeacon) {
      navigator.sendBeacon(VM_CAPTURE.url, body);   // survives page unload
    } else {
      fetch(VM_CAPTURE.url, { method: 'POST', headers: { 'content-type': 'text/plain' }, body, keepalive: true }).catch(() => {});
    }
  } catch { /* telemetry must never throw */ }
}

// ── Favourite companies ──────────────────────────────────────────────────────
// Explicit favourites (the star in the company header). Kept in localStorage for
// instant UI + captured so we know each user's favourites centrally.
function vmFavs() { try { return JSON.parse(localStorage.getItem('vm_favs') || '[]'); } catch { return []; } }
function vmIsFav(t) { return vmFavs().includes(String(t || '').toUpperCase()); }
function vmToggleFav(t) {
  t = String(t || '').toUpperCase();
  const favs = vmFavs();
  const i = favs.indexOf(t);
  const add = i < 0;
  if (add) favs.push(t); else favs.splice(i, 1);
  try { localStorage.setItem('vm_favs', JSON.stringify(favs)); } catch {}
  vmCapture('favourite', { ticker: t, action: add ? 'add' : 'remove' });
  return add;
}

// ── Clickstream ("where do people click") ────────────────────────────────────
// One capturing listener logs meaningful clicks (buttons, links, tabs, cards)
// with a human label — no per-component wiring needed.
if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    if (!VM_CAPTURE.url) return;
    const el = e.target && e.target.closest && e.target.closest('button, a, [role="button"], [data-tour], [data-cap], [onclick]');
    if (!el) return;
    const label = (el.getAttribute('data-cap') || el.getAttribute('data-tour') || el.getAttribute('aria-label') || el.getAttribute('title') || (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40) || el.tagName).slice(0, 60);
    vmCapture('click', { label, tag: el.tagName.toLowerCase() });
  }, { capture: true });
}

// Flush the tail when the tab is hidden / closed.
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => _vmCapFlush(true));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') _vmCapFlush(true); });
}

Object.assign(window, { VM_CAPTURE, vmCapture, vmIdentify, vmAnonId, vmFavs, vmIsFav, vmToggleFav });
