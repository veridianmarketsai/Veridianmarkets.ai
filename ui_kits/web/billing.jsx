// Veridian Markets — shared billing config + checkout starter.
// Global (via Object.assign) so every page (Pricing, Settings) uses ONE source of
// truth for Stripe. See payment.md.
//
// Checkout resolution order:
//   1. apiBase set   → POST to the vm-billing-checkout Lambda for a Session URL.
//   2. paymentLinks  → redirect to a Stripe Payment Link (real checkout, no backend).
//   3. neither       → return false so the caller can run its local mock.

const VM_BILLING = {
  currency: '$',   // display currency (USD). NOTE: Stripe products are still GBP —
                   // recreate the Stripe prices in USD before go-live (see review.md).
  apiBase: 'https://47tm6sz4m3l4hzlbygg6v7lxu40fsqqb.lambda-url.us-east-1.on.aws/',   // vm-billing-checkout Lambda (one customer per user)
  statusUrl: 'https://v4fittjxd55ruqgtiqxbqyxvai0huddy.lambda-url.us-east-1.on.aws/', // vm-billing-status Lambda (returns the real plan)
  portalUrl: 'https://yl7uzroqmm5np3y3kmvxnf5l2u0sliho.lambda-url.us-east-1.on.aws/', // vm-billing-portal Lambda (cancel / switch)
  paymentLinks: {
    plus: 'https://buy.stripe.com/test_7sY7sK51z9i63dt7gw43S01',   // Plus £9/mo
    pro:  'https://buy.stripe.com/test_cNi6oG3Xv1PE8xNasI43S00',   // Pro £19/mo
  },
  prices: {
    plus: 'price_1TsTEtBCOL2lO2oBgCSaXuen',   // Veridian Plus · £9/mo
    pro:  'price_1TsTF8BCOL2lO2oBmh8hJb2b',    // Veridian Pro  · £19/mo
  },
};

// Start a real Stripe checkout for `planId` ('plus' | 'pro'). Redirects the browser
// on success and returns true; returns false if no real path is configured (so the
// caller falls back to its mock). Tags the checkout with the signed-in user so the
// webhook can grant the plan.
async function vmStartCheckout(planId) {
  if (typeof vmCapture === 'function') vmCapture('checkout_start', { plan: planId });
  if (planId === 'free' || planId === 'business') return false;
  const user = typeof vmLoadUser === 'function' ? vmLoadUser() : null;
  let session = null; try { session = JSON.parse(localStorage.getItem('vm_session') || 'null'); } catch {}

  // (1) Full backend
  if (VM_BILLING.apiBase) {
    try {
      const res = await fetch(VM_BILLING.apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session && session.access}` },
        body: JSON.stringify({ plan: planId, email: user && user.email }),   // Lambda picks the price server-side from `plan`
      });
      const data = await res.json();
      if (data.url) { window.location.href = data.url; return true; }
    } catch (e) { /* fall through to payment link / mock */ }
  }
  // (2) Payment Link (no backend)
  if (VM_BILLING.paymentLinks[planId]) {
    const u = new URL(VM_BILLING.paymentLinks[planId]);
    if (user && user.sub)   u.searchParams.set('client_reference_id', user.sub);
    if (user && user.email) u.searchParams.set('prefilled_email', user.email);
    window.location.href = u.toString();
    return true;
  }
  return false;
}

// Fetch the signed-in user's real plan from the backend (vm-billing-status).
// Returns 'free'|'plus'|'pro', or null if not configured / not signed in (caller
// then keeps the local mock). Sends the Cognito access token for verification.
async function vmFetchPlan() {
  if (!VM_BILLING.statusUrl) return null;
  let session = null; try { session = JSON.parse(localStorage.getItem('vm_session') || 'null'); } catch {}
  if (!session || !session.access) return null;
  try {
    const res = await fetch(VM_BILLING.statusUrl, { headers: { Authorization: `Bearer ${session.access}` } });
    const data = await res.json();
    return data && data.plan ? data.plan : null;
  } catch { return null; }
}

// Open the Stripe Customer Portal (cancel / switch plan). POSTs the Cognito
// access token to vm-billing-portal, which returns a portal URL to redirect to.
// Returns false (so the caller can message) if not signed in / not configured /
// no Stripe customer on file yet.
async function vmOpenPortal() {
  if (!VM_BILLING.portalUrl) return { ok: false, error: 'not configured' };
  let session = null; try { session = JSON.parse(localStorage.getItem('vm_session') || 'null'); } catch {}
  if (!session || !session.access) return { ok: false, error: 'not signed in' };
  try {
    const res = await fetch(VM_BILLING.portalUrl, { method: 'POST', headers: { Authorization: `Bearer ${session.access}` } });
    const data = await res.json();
    if (data.url) { window.location.href = data.url; return { ok: true }; }
    return { ok: false, error: data.error || 'could not open portal' };
  } catch (e) { return { ok: false, error: 'network error' }; }
}

Object.assign(window, { VM_BILLING, vmStartCheckout, vmFetchPlan, vmOpenPortal });
