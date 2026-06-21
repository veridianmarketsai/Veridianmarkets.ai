# Heatmap — AWS Setup Guide

Two Lambda functions + one DynamoDB table. Serverless, ~free at startup scale.

---

## 1. DynamoDB table

1. AWS Console → DynamoDB → **Create table**
2. Table name: `vm-heatmap-events`
3. Partition key: `page` (String)
4. Sort key: `sk` (String)
5. Leave everything else as default (On-demand capacity)
6. After creation → **Additional settings** → enable TTL on attribute `expiry`

---

## 2. IAM role for Lambda

1. IAM → Roles → **Create role** → AWS Service → Lambda
2. Attach policy: `AmazonDynamoDBFullAccess` (or a custom policy scoped to `vm-heatmap-events`)
3. Name the role: `vm-heatmap-lambda-role`

---

## 3. Deploy heatmap-ingest (POST)

1. Lambda → **Create function**
   - Name: `vm-heatmap-ingest`
   - Runtime: Node.js 22.x
   - Architecture: arm64 (cheaper)
   - Execution role: `vm-heatmap-lambda-role`

2. Upload code: zip the contents of `lambda/heatmap-ingest/` and upload, **or** paste `index.mjs` into the inline editor.

3. Environment variables:
   - `TABLE_NAME` = `vm-heatmap-events`
   - `AWS_REGION`  = your region (e.g. `eu-west-1`)

4. Add a **Function URL** (Configuration → Function URL):
   - Auth type: NONE (public — clients POST without credentials)
   - CORS: enable, allowed origins `*`, allowed headers `Content-Type,X-VM-Key`
   - Copy the URL → this is your `VM_INGEST_URL`

---

## 4. Deploy heatmap-query (GET)

1. Lambda → **Create function**
   - Name: `vm-heatmap-query`
   - Same runtime, arch, and role as above

2. Upload `lambda/heatmap-query/index.mjs`

3. Environment variables:
   - `TABLE_NAME`  = `vm-heatmap-events`
   - `AWS_REGION`  = your region
   - `ADMIN_KEY`   = any strong random string (e.g. `openssl rand -hex 24`)

4. Add a **Function URL**:
   - Auth type: NONE (protected by the `ADMIN_KEY` header in code)
   - CORS: same as above
   - Copy the URL → this is your `VM_QUERY_URL`

---

## 5. Wire into the app

Add these two lines to `index.html` **before** the `heatmap_tracker.jsx` script tag:

```html
<script>
  window.VM_INGEST_URL = 'https://xxxx.lambda-url.eu-west-1.on.aws/';  // from step 3
  window.VM_QUERY_URL  = 'https://yyyy.lambda-url.eu-west-1.on.aws/';  // from step 4
  window.VM_ADMIN_KEY  = 'your-admin-key-here';                         // from step 4 env var
</script>
```

> **Never commit `VM_ADMIN_KEY` with a real value.** In production, serve these values
> from a server-rendered template or a Secrets Manager–backed edge function, not hardcoded in HTML.

---

## Cost estimate

| Service | Free tier | Beyond free |
|---|---|---|
| Lambda | 1M requests/month | ~$0.20 / 1M requests |
| DynamoDB on-demand | 25 GB + 200M requests/month | ~$1.25 / 1M writes |
| Function URLs | included | — |

At 10 000 page views/day with 20 events each = 200 000 events/day → **well within free tier**.
