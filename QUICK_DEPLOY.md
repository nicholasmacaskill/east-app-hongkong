# Quick Start: 5-Minute Free Deployment

The fastest way to deploy East App HK for free.

## Prerequisites
- GitHub account
- 30 minutes of time

## Step 1: Supabase Cloud (10 min)

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. New Project → Name: `east-app` → Create
3. **Settings** → **Database** → Copy connection details
4. **Settings** → **API** → Copy `Project URL` and `service_role` key
5. **SQL Editor** → Paste contents of `database/production_bundle.sql` → Run
6. **SQL Editor** → New Query → Paste RLS policies from `database/enable_rls_security.ts` → Run

## Step 2: Push to GitHub (2 min)

```bash
cd /Users/nicholasmacaskill/Downloads/east-app-hongkong-main
git init
git add .
git commit -m "Initial deployment"
# Create repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/east-app-hongkong.git
git push -u origin main
```

## Step 3: Deploy to Vercel (5 min)

1. Go to [vercel.com](https://vercel.com) → Import Project
2. Select your GitHub repo
3. Add Environment Variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ... (⚠️ SECRET)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

4. Deploy!

## Step 4: Configure Stripe Webhook (3 min)

1. [Stripe Dashboard](https://dashboard.stripe.com/webhooks) → Add endpoint
2. URL: `https://your-app.vercel.app/api/webhooks/stripe`
3. Events: `checkout.session.completed`, `invoice.payment_succeeded`
4. Copy webhook secret (`whsec_...`)
5. Vercel → Settings → Environment Variables → Add:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
6. Redeploy

## ✅ Done!

Your app is live at: `https://your-project.vercel.app`

Login: `admin@east.com` / `password123`

---

**Total time**: ~20 minutes  
**Total cost**: $0/month
