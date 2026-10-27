# Deploying LesTrades to fly.io

Both services ship as Dockerfiles. The mobile app talks to whatever
`EXPO_PUBLIC_API_URL` was set to **at build time**, so the order below matters.

Prerequisite: `brew install flyctl`, then `fly auth login`.

---

## 1. Backend API

```bash
cd backend
fly apps create lestrades-api          # pick the name once, reuse it everywhere
fly secrets set \
  DATABASE_URL="<supabase pooler connection string>" \
  DIRECT_URL="<supabase direct connection string>" \
  SUPABASE_URL="https://nxycejiuwpbocaiqwsdt.supabase.co" \
  SUPABASE_SERVICE_ROLE_KEY="<service role key>" \
  PAYSTACK_SECRET_KEY="<sk_test_... for review, sk_live_... for production>" \
  API_URL="https://lestrades-api.fly.dev" \
  CORS_ALLOWED_ORIGINS="https://lestrades-admin.fly.dev" \
  IMEICHECK_API_KEY="<optional>" \
  NIA_APP_ID="<optional>" NIA_API_KEY="<optional>"
fly deploy
```

Verify: `curl https://lestrades-api.fly.dev/api/health` must return `{"status":"ok"}`.

Notes:
- `fly.toml` sets `primary_region = "fra"` to sit next to the Supabase `eu-west-1`
  database. Change it only if you move the database.
- Uploads go to Supabase Storage via `multer.memoryStorage()`, so Fly's ephemeral
  filesystem is never written to — no volume needed.
- `min_machines_running = 1` keeps the API warm; drop it to `0` to save money and
  accept a ~5s cold start.

## 2. Admin portal

The portal is a static SPA. It is no longer a dev server — it builds into nginx,
so it cannot "stop loading" the way `npm run dev` did.

```bash
cd admin-web
# Edit fly.toml [build.args].VITE_API_URL to the API URL from step 1
fly apps create lestrades-admin
fly deploy --build-arg VITE_API_URL=https://lestrades-api.fly.dev \
           --build-arg VITE_SUPABASE_URL=https://nxycejiuwpbocaiqwsdt.supabase.co \
           --build-arg VITE_SUPABASE_ANON_KEY=<anon key>
```

The Supabase **anon** key is public by design (it ships in the JS bundle); the
service-role key must never appear here.

## 3. Mobile app

`mobile/.env` currently points at a LAN IP for on-device development. Before
building the store submission, set it to the public API:

```
EXPO_PUBLIC_API_URL=https://lestrades-api.fly.dev
```

Then rebuild (the value is inlined at build time — an OTA update alone will not
change it if you ship a build that still points at a LAN IP).

## 4. Paystack dashboard

Add the deployed origins under **Settings → Channels → Card → Website
integration → Allowed domains**, and set the integration to accept
`https://lestrades-admin.fly.dev` plus your hosted web-mobile origin if any.
Without this, checkout can be blocked server-side.

## 5. Before submitting to the stores

- Switch `PAYSTACK_SECRET_KEY` to a **test** key for the review build, or a
  reviewer placing an order charges real money.
- Confirm `/api/health` is reachable from a network outside your own.
- Fill the store listing privacy URLs with the deployed web URL of the privacy
  policy (or paste the in-app text into the console field).
