# Masanawa

Masanawa is a responsive fintech web application for wallet funding, transfers, digital services, bill payments, and digital-asset experiences.

## Current milestone

- Responsive dashboard shell
- Desktop sidebar and mobile bottom navigation
- Wallet balance and virtual account cards
- Quick services grid
- Crypto market panel
- Recent transactions
- Login experience
- Registration experience
- Shared dark fintech design system
- GitHub Actions production-build validation

## Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Lucide icons

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Routes

- `/` — dashboard
- `/login` — sign in
- `/register` — account creation

## Architecture direction

The browser is treated as an untrusted client. Authentication, provider credentials, balances, transaction authorization, ledger operations, payment callbacks, and future crypto/provider secrets belong behind server-side APIs. Financial balances will ultimately be backed by an auditable ledger rather than client-side state.
