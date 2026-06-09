# Veridian Markets — Backend Architecture

## Platform: AWS

Chosen for long-term (10-year) production scale. Financial data handling requires
enterprise-grade compliance tooling (SOC2, GDPR), fine-grained access controls,
and the ability to co-locate every future service without vendor migration risk.

---

## Core Stack

| Layer            | Service                          | Purpose                                      |
|------------------|----------------------------------|----------------------------------------------|
| Database         | RDS PostgreSQL / Aurora Serverless v2 | All user and app data                   |
| Auth             | Cognito                          | Sessions, password reset, OAuth, 2FA         |
| API              | API Gateway + Lambda             | Business logic between frontend and DB       |
| File storage     | S3                               | Profile photos, data exports                 |
| Secrets          | Secrets Manager                  | API keys, DB credentials                     |
| CDN / Hosting    | CloudFront + S3                  | Static frontend                              |
| Email            | SES                              | All outbound emails                          |
| Notifications    | SNS                              | Fan-out to email / push / SMS                |
| Scheduling       | EventBridge                      | Cron jobs (weekly digest, etc.)              |

---

## Database Schema (Settings page — first priority)

**`users`**
```
id (uuid, PK)
email (unique)
name
username (unique)
profile_photo_url
tier  → 'free' | 'plus' | 'pro' | 'business'
created_at, updated_at
```

**`user_preferences`** — 1:1 with users
```
user_id (FK → users)
theme              → 'light' | 'dark' | 'system'
compact_density    (bool)
reduce_motion      (bool)
private_profile    (bool)
show_online_status (bool)
searchable_by_email (bool)
personalised_recs  (bool)
usage_analytics    (bool)
marketing_emails   (bool)
```

**`notification_settings`** — 1:1 with users
```
user_id (FK → users)
price_alerts, analogue_alerts, supply_chain_events  (bool)
course_updates, product_news, weekly_digest         (bool)
channel_email, channel_push, channel_sms            (bool)
```

**`subscriptions`**
```
user_id (FK → users)
plan    → 'free' | 'plus' | 'pro' | 'business'
status
stripe_customer_id
stripe_subscription_id
current_period_end
```

**`broker_connections`** — many per user
```
id, user_id (FK → users)
provider  → 't212' | 'ibkr' | 'coinbase' | ...
status    → 'connected' | 'error' | 'disconnected'
access_token (encrypted via Secrets Manager)
connected_at
```

**`user_sessions`**
```
id, user_id (FK → users)
device_info, ip, last_seen, created_at
```

---

## Notifications Architecture

```
Event (price alert, analogue match, supply chain disruption)
    → SNS topic
        → SES          (email channel)
        → Lambda       (browser / mobile push)
        → SNS SMS      (text message)
```

Notification channel preferences (`channel_email`, `channel_push`, `channel_sms`)
in `notification_settings` control which SNS subscriptions are active per user.

**Scheduled emails via EventBridge:**
- Weekly digest → EventBridge cron (Sunday) → Lambda → SES
- Price alerts  → triggered on data event → Lambda → SES

**SES setup checklist:**
- [ ] Verify sending domain `veridianmarkets.ai` in SES
- [ ] Request production access (new accounts start in sandbox — sends to verified addresses only)
- [ ] SES is free for first 62,000 emails/month from AWS-hosted apps

---

## Build order

1. Settings page (users, user_preferences, notification_settings)
2. Auth (Cognito — replace mock sign-in in app.jsx)
3. Subscriptions + Stripe
4. Broker connections
5. Notifications (SES + SNS)
6. Live data (market prices, supply chain events)
