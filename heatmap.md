# Heatmap System — Reference

Customer interaction tracking for Veridian Markets. Tracks real user behaviour across all pages and visualises it in the Admin panel.

---

## Change log

| Date | Branch | What shipped |
|---|---|---|
| 2026-06-30 | `heatmap-1.1` → `main` | Initial heatmap system: tracker, admin tab, overlay, AWS Lambda + DynamoDB backend, this reference doc |

**Branch:** `heatmap-1.1` (merged into `main` 2026-06-30)
**Commits:**
- `8611ead` — Heatmap 1.1: customer interaction heatmap in Admin panel
- `951dbcb` — Heatmap 1.1: AWS DynamoDB + Lambda backend wiring
- `1af36bc` — Heatmap 1.1: add heatmap.md reference document

---

## How it works (overview)

```
Every visitor's browser                AWS (free tier)               Admin panel
──────────────────────                 ───────────────               ───────────
heatmap_tracker.jsx                    Lambda: heatmap-ingest        HeatmapAdmin.jsx
  Records clicks, scrolls,   →  POST → BatchWriteItem to DynamoDB → Fetches & renders
  hover dwell, movement,                vm-heatmap-events             heatmap canvas,
  rage clicks, text selection           90-day TTL per event          stats, event log
  Batched every 5 s
```

Without AWS configured, data stays in `localStorage` on the same device (useful for local dev and self-testing).

---

## Files

| File | Role |
|---|---|
| `ui_kits/web/heatmap_tracker.jsx` | IIFE that runs on every page load — records events |
| `ui_kits/web/HeatmapAdmin.jsx` | Admin tab component — canvas heatmap + overlay + stats |
| `lambda/heatmap-ingest/index.mjs` | AWS Lambda — receives POST batches, writes to DynamoDB |
| `lambda/heatmap-query/index.mjs` | AWS Lambda — serves GET queries to the admin panel |
| `lambda/README.md` | Step-by-step AWS Console setup guide |

---

## What is tracked

| Event type | Trigger | Extra fields |
|---|---|---|
| `click` | Any click anywhere | `x`, `y` (% of viewport), `el` (element selector) |
| `rage` | 3+ clicks in 50 px / 500 ms | `n` (click count) — frustration signal |
| `scroll` | Scroll stop (debounced 380 ms) | `depth` (current %), `maxDepth` (session max %) |
| `move` | Mouse movement throttled to 220 ms | `x`, `y` |
| `hover` | Cursor dwells ≥ 650 ms on readable text | `dur` (ms), `el` |
| `select` | User selects ≥ 4 characters of text | `len` (char count), `x`, `y` |

Every event also carries: `page` (route name), `ts` (epoch ms), `sid` (session ID), `sw`/`sh` (screen size).

Session ID is stored in `sessionStorage` — resets on tab close, so each visit is a new session.

---

## DynamoDB schema

**Table name:** `vm-heatmap-events`

| Attribute | Type | Description |
|---|---|---|
| `page` | String (PK) | Route name: `front`, `screener`, `supply`, `dashboard`, etc. |
| `sk` | String (SK) | `{timestamp}#{sessionId}#{rand6}` — unique per event, sortable by time |
| `t` | String | Event type: `click`, `scroll`, `hover`, `move`, `rage`, `select` |
| `x` / `y` | Number | Viewport percentage (0–100) |
| `ts` | Number | Unix milliseconds |
| `sid` | String | Session ID |
| `sw` / `sh` | Number | Screen width / height at time of event |
| `el` | String | Simplified CSS selector of the target element |
| `dur` | Number | Dwell duration in ms (hover events only) |
| `depth` | Number | Scroll depth % at event time |
| `maxDepth` | Number | Max scroll depth reached in session |
| `n` | Number | Rage click count |
| `len` | Number | Selected text character count |
| `expiry` | Number | Unix seconds — DynamoDB TTL, auto-deletes after 90 days |

**Access patterns:**
- Single page query → `KeyConditionExpression: page = :p AND sk >= :since` (fast, uses index)
- All pages → `Scan` with `FilterExpression: ts >= :since` (acceptable for admin-only use)

---

## AWS setup (quick steps)

### 1. DynamoDB
- Console → DynamoDB → Create table
- Table: `vm-heatmap-events` · PK: `page` (String) · SK: `sk` (String)
- Capacity: On-demand
- After creation → Additional settings → enable **TTL** on attribute `expiry`

### 2. IAM role
- IAM → Roles → Create role → AWS Service → Lambda
- Attach: `AmazonDynamoDBFullAccess`
- Name: `vm-heatmap-lambda-role`

### 3. Lambda: heatmap-ingest (POST — public)
- Create function `vm-heatmap-ingest` · Node.js 22.x · arm64
- Upload / paste `lambda/heatmap-ingest/index.mjs`
- Env vars: `TABLE_NAME=vm-heatmap-events`, `AWS_REGION=eu-west-1`
- Function URL → Auth: NONE · CORS: origins `*`, headers `Content-Type,X-VM-Key`
- **Copy the URL → `VM_INGEST_URL`**

### 4. Lambda: heatmap-query (GET — key protected)
- Create function `vm-heatmap-query` · same runtime & role
- Upload / paste `lambda/heatmap-query/index.mjs`
- Env vars: `TABLE_NAME=vm-heatmap-events`, `AWS_REGION=eu-west-1`, `ADMIN_KEY=<strong-random-string>`
- Function URL → Auth: NONE · same CORS settings
- **Copy the URL → `VM_QUERY_URL`**
- **Copy `ADMIN_KEY` value → `VM_ADMIN_KEY`**

### 5. Wire into the app
Add to `index.html` **before** the `heatmap_tracker.jsx` script tag:

```html
<script>
  window.VM_INGEST_URL = 'https://xxxx.lambda-url.eu-west-1.on.aws/';
  window.VM_QUERY_URL  = 'https://yyyy.lambda-url.eu-west-1.on.aws/';
  window.VM_ADMIN_KEY  = 'your-admin-key-here';
</script>
```

> **Security:** Never commit a real `VM_ADMIN_KEY` value to git. In production, inject it via a server-rendered template or environment variable at build/deploy time, not hardcoded in HTML.

---

## Admin panel — Heatmap tab

Sign in as admin → Admin → **Heatmap tab**

### Toolbar controls

| Control | What it does |
|---|---|
| Heatmap / Scroll depth | Switch between canvas heatmap and scroll depth bar chart |
| Clicks / Hover / Move / Rage / Selection / Scroll | Toggle data layers on/off |
| Page dropdown | Filter to a specific page or view all |
| Time window | Last 1 h · Last 24 h · Last 7 d · All time |
| Colour scheme | Thermal (default) · Fire · Cool · Mono |
| Radius slider | Blob size per event point (15–160 px) |
| Opacity slider | Overall heatmap transparency |
| ⟳ Refresh | Re-fetch from server (or localStorage) |
| ↓ CSV | Download all raw events as a CSV file |
| ✕ Clear | Delete all events from localStorage (and server if using AWS) |

### Launch Overlay

Clicking **Launch Overlay** creates a floating toolbar + canvas on top of the live app:
- The canvas is `pointer-events: none` — you can still click around the site normally
- Browse to any page and interactions are recorded in real time
- The overlay auto-refreshes every 4 seconds
- Hit **✕ EXIT** in the overlay toolbar to close it

---

## Cost estimate (AWS)

| Scale | Events/day | Monthly cost |
|---|---|---|
| Early-stage (100 users) | ~20 000 | **Free** (within free tier) |
| Growing (1 000 users) | ~200 000 | **Free** |
| Scaling (10 000 users) | ~2 000 000 | ~$3 |

Free tier limits that cover this: Lambda 1M requests/month, DynamoDB 25 GB + 200M requests/month.

---

## How to read the heatmap

| What you see | What it means |
|---|---|
| Hot red cluster on a button | High click rate — users definitely see and use this |
| Warm area on body text | Users reading that section (hover dwell) |
| Orange rage-click dot | UI element is confusing or not responding as expected |
| Low scroll depth on a page | Most users leave before reaching the bottom — content too long or CTA too late |
| Cold / blue areas | Content exists but users rarely look at it |
| No data on a page | Page has low traffic or was recently added |

---

## Local dev (no AWS)

Without setting `VM_INGEST_URL`, the tracker writes to `localStorage` only. The admin heatmap reads from the same `localStorage`. This means you only see your own clicks on your own device — useful for testing the UI before connecting AWS.

To reset local data: Admin → Heatmap → ✕ Clear, or in DevTools: `localStorage.removeItem('vm_heatmap_events')`.

---

## Planned improvements

- **Session replay** — replay a specific session as a sequence of mouse movements and clicks
- **User segment filter** — filter by signed-in vs anonymous, or by plan (Plus / Pro)
- **Element-level click counts** — see exactly which buttons were clicked most
- **Funnel analysis** — track page navigation sequences (e.g. front → screener → dashboard)
- **Real-time feed** — WebSocket or EventBridge push so the overlay updates without polling
- **Attention score** — time-weighted score per page section based on hover dwell
