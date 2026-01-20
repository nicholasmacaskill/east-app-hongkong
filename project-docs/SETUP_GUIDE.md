# 🚀 Zero-to-Hero Setup Guide

Follow these steps to get the EAST Training App running on a new machine (Mac).

## 1. Prerequisites
You need these installed first:
1.  **Node.js**: [Download here](https://nodejs.org/) (Version 18 or 20).
2.  **Stripe CLI**: Open terminal and run `brew install stripe/stripe-cli/stripe` (or download from Stripe website).
3.  **Git**: To clone the repo.

## 2. Clone & Install
Open your Terminal (`Cmd + Space`, type Terminal) and run:

```bash
# 1. Go to folder
cd Downloads/east-app-hongkong-main

# 2. Install dependencies
npm install
```

## 3. Environment Secrets (Ask Nic for these!)
Create a file named `.env.local` in the root folder and paste the keys Nic gives you.
It should look like this (Nic will provide the values):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Stripe
STRIPE_SECRET_KEY=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
STRIPE_WEBHOOK_SECRET=...

# Stripe Prices
NEXT_PUBLIC_STRIPE_PRICE_GYM=...
NEXT_PUBLIC_STRIPE_PRICE_ALL=...
NEXT_PUBLIC_STRIPE_PRICE_ELITE=...
NEXT_PUBLIC_STRIPE_PRICE_TOPUP=...
```

## 4. Setup Database
Reset the database to the clean state with all tables and test users.

```bash
npx tsx run_sql.ts
```
*You should see a bunch of "✅ Created table..." messages.*

## 5. Stripe Webhooks (Important!)
To make sure payments/credits work, you need to listen to Stripe in a separate terminal.

1.  Open a **New Terminal Tab** (`Cmd + T`).
2.  Run:
    ```bash
    stripe login
    # Follow instructions to log in to Nic's Stripe account
    ```
3.  Start listening:
    ```bash
    stripe listen --forward-to localhost:3000/api/webhooks/stripe
    ```
4.  **Copy the "whsec_..." key** it gives you.
5.  Paste it into your `.env.local` as `STRIPE_WEBHOOK_SECRET`.
6.  Restart the app if it was running.

## 6. Run the App!
Back in your first terminal:

```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in Chrome.

## 🧪 Test Accounts
- **Admin**: `admin@east.com` / `password123`
- **Coach**: `coach@east.com` / `password123`
- **Parent**: `parent@east.com` / `password123`
- **Player**: `player@east.com` / `password123`

---
**Enjoy! 🏒**
