# Billing Lambdas (Stripe)

Serverless functions behind the payments feature. No npm dependencies — each uses
`fetch` for Stripe's REST API and the AWS SDK v3 bundled in the Node.js 20 runtime,
so you can paste `index.mjs` straight into the Lambda console and Deploy.

See [`../../payment.md`](../../payment.md) for the full design.

## Functions

| Folder | Trigger | Job | Auth |
|---|---|---|---|
| `webhook/` | Lambda Function URL (Stripe calls it) | On payment, write the plan to DynamoDB | none (verifies Stripe signature) |
| `status/`  | Function URL (app calls it) | Return the signed-in user's current plan | Cognito JWT (verified in-code) |
| `portal/`  | Function URL (app calls it) | Stripe Customer Portal link (manage/cancel) | Cognito JWT |
| `checkout/`| Function URL (app calls it) | Create a Checkout Session (full flow) | Cognito JWT |

Built in order: **webhook → status → portal → checkout**.

## DynamoDB table — `vm-subscriptions`

Partition key **`sub`** (String). One row per user, keyed by the Cognito `sub`.
Customer→user reverse lookups are stored under `sub = "cust#<stripeCustomerId>"`.

| Field | Example |
|---|---|
| `sub` (PK) | Cognito `sub`, or `cust#cus_123` |
| `plan` | `free` \| `plus` \| `pro` |
| `status` | `active` \| `past_due` \| `canceled` |
| `stripeCustomerId` | `cus_…` |
| `subscriptionId` | `sub_…` |
| `mapsTo` | (on `cust#…` rows) the user's `sub` |

## Environment variables

| Var | Used by | Value |
|---|---|---|
| `STRIPE_SECRET_KEY` | webhook, portal, checkout | `sk_test_…` (secret — Lambda only) |
| `STRIPE_WEBHOOK_SECRET` | webhook | `whsec_…` from the Stripe webhook endpoint |
| `PRICE_PLUS` / `PRICE_PRO` | webhook, checkout | the `price_…` IDs |
| `TABLE` | all | `vm-subscriptions` |
| `COGNITO_POOL_ID` / `COGNITO_REGION` | status, portal, checkout | for JWT verification |

## IAM

Each function's execution role needs DynamoDB access on the table
(`GetItem` / `PutItem` / `UpdateItem`). Simplest for dev: attach
`AmazonDynamoDBFullAccess`; tighten to the single table before going live.
