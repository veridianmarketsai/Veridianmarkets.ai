// Veridian Markets — admin-privileged, MUTATING user actions (vm-admin-actions
// Lambda). Real and consequential: this can suspend, delete, or override the
// plan of a real account. The Lambda itself enforces the `admin` Cognito
// group — this is just the client call, not an authorization boundary.

const VM_ADMIN_ACTIONS = { url: '' };   // vm-admin-actions Lambda Function URL — fill in once deployed

async function vmAdminAction(action, sub, extra) {
  if (!VM_ADMIN_ACTIONS.url) return { ok: false, error: 'not configured' };
  let session = null; try { session = JSON.parse(localStorage.getItem('vm_session') || 'null'); } catch {}
  if (!session || !session.access) return { ok: false, error: 'not signed in' };
  try {
    const res = await fetch(VM_ADMIN_ACTIONS.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access}` },
      body: JSON.stringify({ action, sub, ...extra }),
    });
    const data = await res.json();
    return data.ok ? { ok: true } : { ok: false, error: data.error || 'action failed' };
  } catch { return { ok: false, error: 'network error' }; }
}

Object.assign(window, { VM_ADMIN_ACTIONS, vmAdminAction });
