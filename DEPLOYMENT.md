# Masanawa Production Deployment Checklist

Masanawa is designed to fail closed. Do not activate a payment/provider path until the matching server credentials, callback URL, database route and end-to-end verification are complete.

## 1. Vercel project

Import `Baatiku/MasanawaP1` into the intended Vercel team and use the repository root as the project root. The application is Next.js and requires Node.js 22 or newer.

Set `NEXT_PUBLIC_APP_URL` to the final HTTPS production origin after the Vercel domain or custom domain is known.

## 2. Required environment variables

### Public

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_APP_URL`

These values are allowed to be exposed to the browser. Row Level Security remains the authorization boundary.

### Server only

- `SUPABASE_SECRET_KEY`
- `PAYSTACK_SECRET_KEY`
- `VTPASS_API_KEY`
- `VTPASS_PUBLIC_KEY`
- `VTPASS_SECRET_KEY`
- `MASANAWA_WORKER_SECRET`
- `VTPASS_ENVIRONMENT` (`sandbox` during provider testing; switch only after production VTpass approval)

Never prefix server secrets with `NEXT_PUBLIC_`, commit them to Git, or expose them in client components.

## 3. Supabase

The production project is `Masanawa` (`pcgqwjehkhjcsrkdigjv`, Paris). Confirm all migrations are applied and run Supabase security/performance advisors after schema changes.

Before go-live verify:

- RLS is enabled on user-owned data.
- Authenticated clients cannot insert/update ledger entries directly.
- Settlement RPCs are service-role only.
- Transaction PINs are stored only as password hashes.
- Financial transactions remain balanced by the deferred ledger constraint.
- Audit logs remain server/admin only.

## 4. Paystack funding

Do not activate wallet funding until the production Paystack secret is configured and webhook delivery has been tested.

Webhook endpoint:

`/api/webhooks/paystack`

The webhook handler must verify Paystack signatures before any funding transaction is settled. Test duplicate webhook delivery to confirm idempotency.

## 5. VTpass services

Use `/admin/vtpass` to inspect/import VTpass products. Imports should remain inactive until reviewed.

For every live product configure:

1. A valid provider record.
2. A provider product route with correct VTpass service/variation identifiers.
3. Confirmed pricing/cost information.
4. A successful sandbox purchase and callback/status verification.
5. Circuit-breaker behavior for provider failures.

Only then activate the route, provider and product.

## 6. Internal worker

`/api/internal/process-services` is protected by `MASANAWA_WORKER_SECRET`. Do not expose the secret to the browser. The production scheduler/worker must authenticate every call and provider settlement must remain server-side.

## 7. Admin readiness check

After environment variables are configured, sign in with an admin account and open:

`/admin/readiness`

It reports configuration presence and active provider/product/route counts without displaying secret values.

## 8. Release verification

Before accepting real money:

- Register and confirm a fresh test account.
- Set a six-digit transaction PIN.
- Verify dashboard/wallet balances start from ledger state, not a client value.
- Fund via Paystack test mode and confirm one balanced deposit transaction.
- Submit a service order and verify funds move into the service hold atomically.
- Verify provider success settles exactly once.
- Verify provider failure/refund returns reserved funds exactly once.
- Verify duplicate requests/webhooks do not duplicate credits/debits.
- Verify a user cannot read another user's transaction receipt.
- Verify username transfer is atomic and balanced.
- Verify disabled providers/products cannot be purchased.
- Verify `/admin` and `/admin/readiness` reject non-admin users.
- Run the GitHub production build and Supabase advisors one final time.

Bank withdrawals and crypto sell/swap must remain disabled until their respective payout/custody/provider settlement paths are fully implemented and tested.
