# Review — deferred items & pre-launch checklist

Open items to revisit before going live. Kept out of scope intentionally to keep
momentum; none block current (test-mode) functionality.

See [`payment.md`](payment.md) for the full payments design.

---

## Payments / billing

- [ ] **Billing portal (cancel / switch)** — *deferred by choice.* No self-serve way
  to cancel or change plan yet; the admin manages subscriptions in the Stripe
  dashboard for now. **Needed before real customers** (easy-cancel UX / compliance).
  Fix = `vm-billing-portal` Lambda + wire the Settings **"Manage subscription" / Edit**
  button to the Stripe Customer Portal.

- [ ] **Single-customer checkout** — Payment Links create a **new subscription every
  time**, so repeated checkouts produce **duplicate subscriptions** (seen in testing).
  Fix = `vm-billing-checkout` Lambda that reuses **one** Stripe customer per Cognito
  user and modifies the existing subscription instead of creating a new one. (Interim
  guard already in place: the app hides "Upgrade" for the user's current plan.)

- [ ] **Go-live** — swap Stripe **test → live** keys; finish account activation
  ("Managed payments: needs info"); move confirmation/email delivery from the Cognito
  default sender to **Amazon SES**.

---

## Change log

| Date | Note |
|---|---|
| 2026-06-30 | Created. Payments/auth backend live in Stripe **test** mode; above deferred to pre-launch. Moving next to the **Finnhub API** (market/news data). |
