// Veridian Markets — "Your activity" (vm-my-activity Lambda → vm-events).
// Same shape as billing.jsx / avatar.jsx: a config object + one function,
// global via Object.assign.

const VM_ACTIVITY = {
  apiBase: 'https://oh3bjpbnrw2g64tplpicg4yam40wiybz.lambda-url.us-east-1.on.aws/',   // vm-my-activity Lambda
};

// Fetch the signed-in user's own recent searches + viewed companies. Returns
// { searches:[string], viewed:[{ticker,name}] } on success, or null if not
// configured / not signed in / the call fails — the caller then falls back to
// its own placeholder content.
async function vmFetchMyActivity() {
  if (!VM_ACTIVITY.apiBase) return null;
  let session = null; try { session = JSON.parse(localStorage.getItem('vm_session') || 'null'); } catch {}
  if (!session || !session.access) return null;
  try {
    const res = await fetch(VM_ACTIVITY.apiBase, { headers: { Authorization: `Bearer ${session.access}` } });
    const data = await res.json();
    return (data && (data.searches || data.viewed)) ? data : null;
  } catch { return null; }
}

Object.assign(window, { VM_ACTIVITY, vmFetchMyActivity });
