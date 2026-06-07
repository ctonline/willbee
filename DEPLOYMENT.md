# Deploying WillBee to production (Vercel)

A step-by-step checklist to take WillBee live with real Stripe payments,
Postgres storage, and Resend email. Work top to bottom; the ordering matters
(the Stripe webhook secret can only be created after the first deploy).

> You'll need accounts for **Vercel**, **Stripe**, **Resend** (with a verified
> sending domain), a **Postgres** provider, and control of your **domain**.

---

## 1. Provision a Postgres database

Any managed Postgres works. [Neon](https://neon.tech) is the easiest fit for
Vercel (generous free tier, built-in connection pooling).

1. Create a project / database called `willbee`.
2. Grab **two** connection strings:
   - **Pooled** (the host containing `-pooler`) → this is `DATABASE_URL`.
   - **Direct** (the plain host) → this is `DIRECT_URL` (used for migrations).
   - On Supabase instead: `DATABASE_URL` = port `6543` with `?pgbouncer=true`,
     `DIRECT_URL` = port `5432`.

The schema is applied automatically on deploy — `vercel-build` runs
`prisma migrate deploy` using the committed migration in `prisma/migrations/`.

## 2. Collect your Stripe keys (start in TEST mode)

In the Stripe dashboard with the **Test mode** toggle ON:

1. Developers → API keys → copy the **Secret key** (`sk_test_…`) and
   **Publishable key** (`pk_test_…`).
2. Leave the webhook for **Step 5** (it needs your deployed URL first).

## 3. Prepare the remaining secrets

- **Resend**: copy your API key (`re_…`). Confirm `RESEND_FROM` uses an address
  on your **verified** domain (e.g. `WillBee <noreply@will.willbee.site>`).
- **AUTH_SECRET**: generate a strong value — `openssl rand -base64 32`.

## 4. Deploy to Vercel

1. Push this repo to GitHub and **Import Project** in Vercel.
2. Add all environment variables (Project → Settings → Environment Variables),
   for the **Production** (and Preview) environments:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | Neon **pooled** URL |
   | `DIRECT_URL` | Neon **direct** URL |
   | `NEXT_PUBLIC_SITE_URL` | `https://will.willbee.site` (your live origin) |
   | `STRIPE_SECRET_KEY` | `sk_test_…` for now |
   | `STRIPE_PUBLISHABLE_KEY` | `pk_test_…` for now |
   | `STRIPE_WEBHOOK_SECRET` | leave blank for now (Step 5) |
   | `RESEND_API_KEY` | `re_…` |
   | `RESEND_FROM` | `WillBee <noreply@your-domain>` |
   | `AUTH_SECRET` | output of `openssl rand -base64 32` |

3. Deploy. Vercel runs `vercel-build`, which migrates the database and builds.
4. Add your domain (Project → Settings → Domains) and point DNS as instructed.
   Make sure `NEXT_PUBLIC_SITE_URL` matches the final domain, then redeploy if
   you changed it.

## 5. Create the Stripe webhook

Now that the site has a URL:

1. Stripe → Developers → **Webhooks** → **Add endpoint**.
2. Endpoint URL: `https://will.willbee.site/api/stripe-webhook`.
3. Events to send: **`payment_intent.succeeded`**.
4. Save, then copy the endpoint's **Signing secret** (`whsec_…`).
5. Put it in Vercel as `STRIPE_WEBHOOK_SECRET` and **redeploy**.

## 6. Test the full flow (still in Stripe test mode)

1. Open the live site, complete the questionnaire, go to checkout.
2. Pay with the Stripe test card `4242 4242 4242 4242`, any future expiry, any
   CVC and postcode.
3. Confirm: you land on `/download`, the PDF downloads, and the email arrives.
4. Stripe → Webhooks → your endpoint: confirm `payment_intent.succeeded`
   delivered a **200**.
5. **Resilience check:** pay again, but close the tab the instant payment
   confirms (before `/download` loads). The webhook should still deliver the
   email. Then visit `/auth`, request a magic link, and confirm re-download
   works.
6. Promo codes: try `WELCOME10` / `FAMILY25` and confirm the charged amount
   matches the discounted total in Stripe.

## 7. Go live

1. Flip Stripe to **Live mode**, create a **live** webhook endpoint (repeat
   Step 5 with the live signing secret).
2. Swap the Vercel env vars to the live values: `STRIPE_SECRET_KEY=sk_live_…`,
   `STRIPE_PUBLISHABLE_KEY=pk_live_…`, `STRIPE_WEBHOOK_SECRET=whsec_…` (live).
3. Redeploy. Do one real low-value test purchase end-to-end, then refund it
   from the Stripe dashboard.

---

## Known limitations / post-launch hardening

- **Rate limiting is per-instance.** `src/lib/rate-limit.ts` is in-memory, so on
  serverless each function instance has its own counters. Fine for launch; for
  strict limits move to a shared store (Upstash Redis is a drop-in).
- **Refunds don't revoke access.** A refunded Will stays downloadable. Add a
  `charge.refunded` webhook handler if you want to revoke.
- **Tax/VAT.** Prices are charged as-is. If you need UK VAT handling, enable
  Stripe Tax and adjust `src/lib/pricing.ts`.
- **One Will per email.** The `Will.email` unique constraint means a repeat
  purchase overwrites the previous Will for that address.

## Local development now needs Postgres

Switching to Postgres means the old zero-setup SQLite mode is gone. For local
work, run a Postgres (e.g. `docker run -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres`),
point `DATABASE_URL` and `DIRECT_URL` at it, run `npm run db:migrate`, then
`npm run dev`. With Stripe/Resend keys left blank it still runs in demo mode.
