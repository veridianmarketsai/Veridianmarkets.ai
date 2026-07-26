# Veridian Markets — Market Data API (quotes) strategy

> Branch: `marketdata-1.1` · How we pull + cache live market data (Finnhub) cheaply.
> Companion to [`backend.md`](backend.md), [`payment.md`](payment.md).

---

## 1. The strategy (your notes)

- **Only update quotes when necessary — at most every 2 minutes.** We don't poll
  real-time; a quote is considered "fresh" for **120 seconds**.
- **Cache in our AWS database (DynamoDB).** When someone uses the platform and
  accesses a quote, we store it — so the **next** person who wants that quote gets
  it from *our* cache, not from the provider.
- **Data must pull accordingly** — fetch a symbol from Finnhub **only** when someone
  actually looks at it **and** the cached copy is stale (older than 2 minutes).
  Symbols nobody views are never fetched.

---

## 2. Does this make sense? — Yes ✅

This is a textbook **read-through cache with a TTL** (time-to-live), and it's the
*right* call for keeping cost near zero:

- **Cheap:** Finnhub's free tier is ~60 calls/min. Caching means one fetch serves
  **every** user for 2 minutes, and we only ever fetch symbols people actually view.
- **Fast:** most requests are served from DynamoDB (single-digit ms), not a slow
  round-trip to the provider.
- **Rate-limit safe:** even with many users, each symbol hits Finnhub at most once
  per 2 minutes.
- **Self-tuning:** popular symbols stay warm; unpopular ones simply aren't fetched.

One tiny caveat (fine to ignore at your scale): if 10 people request the *same*
stale symbol in the same instant, they might each trigger a fetch (a "thundering
herd"). We can add a short refresh-lock later; not worth it now.

---

## 3. How it works (the flow)

```
Browser (data.jsx)                AWS (Lambda + DynamoDB)              Finnhub
──────────────────                ───────────────────────              ───────
"give me AAPL, MSFT"
   │ GET /quote?symbols=AAPL,MSFT
   ▼
                          Lambda: for each symbol —
                            read vm-quotes[symbol]
                            ┌── fresh (< 120s)? → use cached
                            └── stale/missing?  → fetch ───────────►  /quote
                                                 write to cache  ◄───  price…
   ◄──────── { AAPL:{…}, MSFT:{…} } ─────────
```

**Freshness rule:** `now - updatedAt < 120_000 ms` → serve cache; else refresh.
That single check *is* "only update every 2 minutes, only when accessed."

---

## 4. The pieces

### DynamoDB table — `vm-quotes`
Partition key **`symbol`** (String). One row per symbol.

| Field | Example | Notes |
|---|---|---|
| `symbol` (PK) | `AAPL` | |
| `price` | `308.82` | last price |
| `change` | `3.84` | absolute change |
| `pct` | `1.26` | percent change |
| `updatedAt` | `1719772800000` | epoch ms — drives the 2-min freshness check |
| `raw` | `{…}` | full Finnhub payload (optional) |
| `ttl` | `1719776400` | DynamoDB TTL (auto-delete cold symbols; **≠** the 2-min check) |

> Two different "expiries": the **2-min `updatedAt` check** decides *refresh vs
> cache*; the optional **DynamoDB `ttl`** just garbage-collects symbols nobody has
> viewed in, say, a day.

### Lambda — `vm-quote` (Function URL, CORS on)
- Reads `?symbols=AAPL,MSFT`; for each, applies the freshness rule above.
- Stale/missing → `GET https://finnhub.io/api/v1/quote?symbol=AAPL&token=$FINNHUB_KEY`,
  map the response, write to `vm-quotes`, return it.
- **Key stays server-side** (`FINNHUB_KEY` env var — never in the browser).
- Env: `FINNHUB_KEY`, `TABLE=vm-quotes`, `TTL_SECONDS=120`.
- IAM: DynamoDB `GetItem` / `BatchGetItem` / `PutItem` on the table.

### Frontend — `data.jsx` seam
The app already funnels data through `data.jsx`. We swap the mock quote source for
a `fetch()` to the `vm-quote` Function URL. The UI (ticker strip, search, dashboard
header) doesn't change — it just gets real, cached numbers.

---

## 5. Finnhub notes

- **Quote endpoint:** `/quote?symbol=SYM&token=KEY` → `{ c: current, d: change,
  dp: %change, h, l, o, pc }`. One symbol per call (loop for several).
- **Free tier:** ~60 calls/min, US stocks + FX + crypto + company news.
- Also useful later (same cache pattern): `/company-news`, `/stock/candle`
  (history), `/stock/metric` (fundamentals).

---

## 6. Build order (this branch)

1. Get a **Finnhub API key** (free) → keep it for the Lambda env. *(You do this.)*
2. DynamoDB table `vm-quotes` (PK `symbol`; optionally enable TTL on `ttl`).
3. Lambda `vm-quote` (Function URL + CORS) with the read-through + 2-min logic;
   add env vars + DynamoDB IAM. Code saved under `lambda/marketdata/` (repo).
4. Wire `data.jsx` to call it; keep mock data as the offline fallback.
5. Test: load the ticker → first hit fetches + caches; refresh within 2 min → served
   from cache (no new Finnhub call); after 2 min → one refresh.

---

## Change log

| Date | Branch | Note |
|---|---|---|
| 2026-06-30 | `marketdata-1.1` | Strategy recorded: read-through cache (DynamoDB) with a 2-minute TTL, fetch-on-access from Finnhub. Build TBD. |
