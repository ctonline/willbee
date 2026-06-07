# WillBee 🐝

A guided, plain-English **Last Will and Testament generator for Scotland**. Adults
domiciled in Scotland answer a short conversational questionnaire, pay a one-off
fee, and instantly download a legally-structured Will PDF — also emailed with
signing/witnessing instructions.

Built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind v4**,
**shadcn/ui (Base UI)**, **Stripe**, **Resend**, **Prisma + SQLite**, and
**@react-pdf/renderer**.

> WillBee is a document-generation service. It does **not** provide legal advice.

---

## Quick start

WillBee uses **PostgreSQL**. Point `DATABASE_URL`/`DIRECT_URL` at any Postgres
(a local Docker one is fine for development):

```bash
docker run -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres  # optional local db
cp .env.example .env  # then set DATABASE_URL / DIRECT_URL
npm install           # also runs `prisma generate`
npm run db:push       # sync the schema to your database
npm run dev           # http://localhost:3000
```

With Stripe and Resend keys left blank the app runs in **demo mode**: payment is
simulated and email sending is skipped (the Will is still saved and
downloadable). To deploy for real, see **[DEPLOYMENT.md](DEPLOYMENT.md)**.

## Environment

Copy `.env.example` → `.env` and fill in as needed. All keys are optional locally.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection, **pooled** (used at runtime) |
| `DIRECT_URL` | Postgres connection, **direct** (used for migrations) |
| `NEXT_PUBLIC_SITE_URL` | Base URL used in magic-link emails |
| `STRIPE_SECRET_KEY` | Server-side Stripe key. Blank → demo checkout |
| `STRIPE_PUBLISHABLE_KEY` | Public key, served via `/api/stripe-publishable-key` |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for `/api/stripe-webhook` (`whsec_…`) |
| `RESEND_API_KEY` | Resend key. Blank → email sending skipped |
| `RESEND_FROM` | Verified sender, e.g. `WillBee <noreply@will.willbee.site>` |
| `AUTH_SECRET` | Secret used to sign the passwordless session cookie |

**Secrets never reach the client** — the Stripe secret and Resend key are used
only in server route handlers and `server-only` modules.

## Architecture

```
src/
  app/
    page.tsx                 # Landing + Q&A + completion (single-page flow)
    checkout/                # Email capture → Stripe payment + promo
    download/                # Client-side PDF download + next-steps guide
    auth/                    # Passwordless magic-link sign-in
    {privacy-policy,terms-of-service,contact,why-choose-willbee}  # Static
    sitemap.ts / robots.ts   # SEO
    api/
      create-payment-intent/ # Server-computed price + Stripe PaymentIntent
      stripe-publishable-key/
      send-will-email/       # Fast-path: verify payment → deliver Will (idempotent)
      stripe-webhook/        # payment_intent.succeeded → deliver Will (backstop)
      auth/{request,verify}/ # Magic-link issue + verify (sets session cookie)
      will/                  # Returns the signed-in user's stored Will
  components/
    landing/ flow/ checkout/ download/ ui/   # Feature + shadcn components
  lib/
    questions.ts             # Conversational schema (7 sections, conditionals, repeats)
    will-builder.ts          # Answers → WillData (§5)
    pdf/will-document.tsx    # The Scottish Will PDF (§7)
    pricing.ts / promo.ts    # Date-based pricing + promo codes (§6)
    validation.ts / will-schema.ts  # Field + server validation
    db.ts stripe.ts email.ts session.ts rate-limit.ts  # Server integrations
```

### Key flows

- **Q&A engine** — `buildQuestionList(answers)` derives the visible question
  sequence from current answers, so conditional branching and variable-length
  repeats (legacies, residue beneficiaries, substitute executors) fall out
  naturally. Answers persist in `localStorage`.
- **Pricing** — resolved by date: £9.99 in 2025, £19 any September, otherwise
  £49 (struck-through original shown on discount). Recomputed authoritatively on
  the server before charging.
- **Payment** — Stripe Payment Element; the amount is always recomputed
  server-side (price + re-validated promo). The Will is stored as a pending
  (unpaid) record when the PaymentIntent is created, then delivered by an
  idempotent helper (`lib/deliver-will.ts`) from two triggers: the client
  fast-path (`send-will-email`, for an instant download) and the Stripe webhook
  (`stripe-webhook`, the reliable backstop). An `emailedAt` claim guarantees the
  email is sent exactly once.
- **PDF** — the same `WillDocument` renders client-side (download) and
  server-side (email attachment), with dynamic section numbering and
  empty-section omission.
- **Storage & re-download** — completed Wills are stored (Prisma/SQLite) keyed by
  email; users return via a passwordless magic link.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | `prisma generate` + production build |
| `npm run start` | Production server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:push` | Sync the Prisma schema to SQLite |

## Going to production

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for the full Vercel + Stripe + Postgres
go-live checklist (database, webhook, env vars, test-mode run, going live).

- The data layer is Postgres and Stripe delivery is webhook-backed — both
  production-ready. The in-memory rate limiter is still per-instance; move it to
  a shared store (e.g. Upstash Redis) if you need strict limits.
- Promo codes live in `src/lib/promo.ts`; testimonials/copy in `src/lib/constants.ts`.
