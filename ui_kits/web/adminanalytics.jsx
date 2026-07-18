// Veridian Markets — admin analytics client (reads vm-admin-analytics).
//
// Admin-only: sends the signed-in admin's Cognito token; the Lambda enforces the
// `admin` group. useAdminAnalytics(view) fetches overview / users; a 403 or any
// error leaves { data:null } so the Admin panel falls back to its mock.

const VM_ADMIN_ANALYTICS = { url: 'https://dlfrkoxzcmiq6fj6k7wepn3gi40ltwfn.lambda-url.us-east-1.on.aws/' };

async function vmAdminAnalytics(view, id) {
  if (!VM_ADMIN_ANALYTICS.url) return null;
  let session = null; try { session = JSON.parse(localStorage.getItem('vm_session') || 'null'); } catch {}
  if (!session || !session.access) return null;
  try {
    const q = `view=${encodeURIComponent(view || 'overview')}${id ? `&id=${encodeURIComponent(id)}` : ''}`;
    const res = await fetch(`${VM_ADMIN_ANALYTICS.url}?${q}`, { headers: { Authorization: `Bearer ${session.access}` } });
    const data = await res.json();
    if (data && data.error) return null;
    return data;
  } catch { return null; }
}

// Hook → { data, loading }. Refetches when `view` changes.
function useAdminAnalytics(view) {
  const [state, setState] = React.useState({ data: null, loading: false });
  React.useEffect(() => {
    let alive = true;
    setState({ data: null, loading: true });
    vmAdminAnalytics(view).then((d) => { if (alive) setState({ data: d, loading: false }); });
    return () => { alive = false; };
  }, [view]);
  return state;
}

Object.assign(window, { VM_ADMIN_ANALYTICS, vmAdminAnalytics, useAdminAnalytics });
