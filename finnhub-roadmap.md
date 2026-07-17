# Finnhub roadmap — free endpoints → app features

A build tracker for wiring the rest of Finnhub's **free** tier into the app. Every
row uses the **same read-through-cache recipe** you already built three times
(`vm-quote`, `vm-financials`, `vm-search`). To avoid 8 separate functions, the 8
endpoints are grouped into **3 Lambdas / 3 DynamoDB tables**.

> **Before building each Lambda — verify it's free on your key.** Paste in the
> address bar: `https://finnhub.io/api/v1/<path>?...&token=YOUR_KEY`.
> JSON body = free ✅ · `403 / "no access"` = premium ❌ (skip it).

---

## The shared recipe (every Lambda)

1. **DynamoDB** → Create table (name below), partition key = **`pk`** (String).
2. **Lambda** → Create function, **Node.js 20.x**.
3. **Code** → paste `index.mjs` (I write it) → **Ctrl+S → Deploy**.
4. **Env vars** → `FINNHUB_KEY`, `TABLE`, `TTL_SECONDS` (below).
5. **Permissions** → attach **`AmazonDynamoDBFullAccess`** to the role.
6. **General config** → **Timeout 30 sec**.
7. **Function URL** → Auth **NONE**, **CORS OFF** (code handles it). Copy URL.
8. Test in address bar → then send me the URL to wire the frontend.

---

## Tracker

| # | Lambda | DynamoDB table | Finnhub endpoint(s) | `TTL_SECONDS` | Powers in the app | Status |
|---|---|---|---|---|---|---|
| 1 | **`vm-profile`** | `vm-profile` | `/stock/profile2` + `/stock/metric?metric=all` | `86400` (24h) | **Overview tab** (name, industry, country, IPO, mkt cap, logo, site) + header **P/E · yield · 52-wk** (kills the hardcoded Apple `37.36`) | ☐ table ☐ lambda ☐ URL ☐ wired |
| 2 | **`vm-news`** | `vm-news` | `/news?category=general` + `/company-news?symbol=X` | `900` (15m) | **Home "Global News" tiles**, **News page**, company **News tab** | ☐ table ☐ lambda ☐ URL ☐ wired |
| 3 | **`vm-signals`** | `vm-signals` | `/stock/recommendation` · `/stock/earnings` · `/stock/peers` · `/stock/insider-transactions` | `43200` (12h) | Overview **analyst bars**, **next earnings**, **related companies**, **insider panel** | ☐ table ☐ lambda ☐ URL ☐ wired |

**Request shapes** (one Lambda serves several endpoints via a param):
- `vm-profile?symbol=AAPL` → `{ profile:{…}, metric:{…} }`
- `vm-news?scope=general` **or** `vm-news?symbol=AAPL`
- `vm-signals?symbol=AAPL&type=recommendation|earnings|peers|insider`

---

## Order to follow

**Do #1 first** — it directly completes symbol search (real Overview + header for any
ticker). Then #2 (news is high-visibility on Home). Then #3 (extras).

For each: I write the Lambda + frontend → you run the 8-step recipe → send me the
Function URL → I wire it → we test → commit.

### Not free (don't build)
`/stock/candle` (price-history charts), `/calendar/economic` (the Calendar page),
price targets, dividends/splits, sentiment. These stay mock until a paid tier.

---

## Change log

| Date | Note |
|---|---|
| 2026-07-17 | Created. Roadmap for free Finnhub endpoints after `symbolsearch`. Next: `vm-profile`. |
