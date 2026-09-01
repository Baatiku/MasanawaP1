# Perfect Naira

Perfect Naira is a responsive fintech web application for wallet funding, transfers, digital services, bill payments, and digital-asset experiences.

## Current architecture

- Next.js 15 App Router + React 19 + TypeScript + Tailwind CSS 4
- Supabase Auth + PostgreSQL with Row Level Security
- Double-entry wallet ledger; balances are derived from ledger entries
- Six-digit transaction PIN stored as a one-way hash in PostgreSQL
- Server-side payment and service-provider integrations only
- Paystack wallet funding with signed webhook validation and server-side transaction re-verification
- VTpass server adapter with sandbox/live separation, provider requery, and ambiguous-response protection
- Multi-provider product routing with priorities, attempt history, and circuit-breaker health state
- Protected internal service worker endpoint for background processing
- Role-gated admin control center for provider/catalog management
- GitHub Actions production-build validation on every push

## Core routes

- `/` — public Perfect Naira welcome page (signed-in users are redirected to `/dashboard`)
- `/dashboard` — authenticated account overview
- `/login` — sign in
- `/register` — account creation
- `/wallet` — live ledger-backed wallet
- `/wallet/fund` — wallet funding
- `/transactions` — live transaction history
- `/services` — digital-service hub
- `/services/airtime` — Airtime order creation
- `/services/data` — Data order creation
- `/crypto` — crypto hub
- `/crypto/buy` — authenticated crypto-buy order creation
- `/profile` — account profile
- `/profile/security` — transaction PIN management
- `/admin` — role-gated provider and catalog administration
- `/api/webhooks/paystack` — Paystack funding webhook
- `/api/internal/process-services` — secret-protected background service worker

## Financial safety model

The browser is untrusted. It cannot modify balances, settle transactions, activate providers, choose routing, or mark an order successful. Fixed product pricing is resolved inside PostgreSQL; flexible products are constrained by database min/max rules. Customer actions create pending transactions only. Wallet debit/credit occurs through service-role-only settlement functions after provider/payment verification.

Provider timeouts and ambiguous responses do **not** trigger immediate failover because doing so could purchase the same service twice. They are retained as pending and requeried using the original provider request ID. Definite failures may move to the next healthy configured route.

## Environment

Copy `.env.example` to `.env.local` for local development. Never commit server secrets.

Required production secrets include:

- `SUPABASE_SECRET_KEY`
- `PAYSTACK_SECRET_KEY`
- `VTPASS_API_KEY`
- `VTPASS_SECRET_KEY`
- `MASANAWA_WORKER_SECRET`

Public values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_APP_URL`

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Provider activation

Providers and product routes are intentionally inactive by default. Do not enable a provider until valid production credentials are stored in the hosting environment and its product mappings have been verified. Data plan prices and provider variation codes should be synchronized against the live provider catalog before production activation.
