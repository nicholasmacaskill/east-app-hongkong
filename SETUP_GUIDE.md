# Environment Replication Plan

This document outlines the steps for a new developer (or an AI agent) to replicate the entire EAST development environment from scratch.

## 1. System Preparation (Fresh Mac)
Open your Terminal and run the following commands to install essential tools.

### A. Install Homebrew (Package Manager)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
# Follow the on-screen instructions to add brew to your PATH
```

### B. Install Git, Node.js, and Stripe CLI
```bash
brew install git node stripe/stripe-cli/stripe
```

### C. Install Docker (Required for Database)
1.  Download **Docker Desktop for Mac** from [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop).
2.  Install and **launch** the application.
3.  Ensure it says "Engine running" (green dot) in the Docker dashboard.

### D. Verify Installations
```bash
git --version
node -v      # Should be v18 or higher
npm -v
docker --version
stripe --version
```

## 2. Project Setup
```bash
# Clone the repository
git clone https://github.com/nicholasmacaskill/east-app-hongkong.git
cd east-app-hongkong

# Install dependencies
npm install --legacy-peer-deps

# Install Supabase CLI locally
npm install supabase --save-dev
```

### Configure Environment File
Run this command to create your local environment file.
```bash
cp .env.example .env.local
```

**Open `.env.local` immediately** and replace its contents with the following template. You will fill in the placeholders (keys) in the upcoming steps.

```bash
# -----------------------------------------------
# 1. DATABASE CONNECTION
# -----------------------------------------------
DB_HOST=localhost
DB_PORT=54322
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=postgres

# -----------------------------------------------
# 2. APP & SUPABASE CONFIG
# -----------------------------------------------
# 🚨 CRITICAL: This points to your app. Used for payment redirects.
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Supabase Keys
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder_anon_key
# 🚨 ADMIN KEY (Service Role) - Keep this secret!
SUPABASE_SERVICE_ROLE_KEY=placeholder_service_role_key

# -----------------------------------------------
# 3. STRIPE KEYS
# -----------------------------------------------
# Public Key (Safe for browser)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder

# Secret Key (Server side only)
STRIPE_SECRET_KEY=sk_test_placeholder

# Webhook Secret (From your 'stripe listen' command)
STRIPE_WEBHOOK_SECRET=whsec_placeholder

# -----------------------------------------------
# 4. MEMBERSHIP PRICE IDs
# -----------------------------------------------
# ✅ The Price ID for the Gym Pass
NEXT_PUBLIC_STRIPE_PRICE_GYM=price_placeholder_gym

# Placeholders for future plans (Create these in Stripe later)
NEXT_PUBLIC_STRIPE_PRICE_ALL=price_placeholder_all
NEXT_PUBLIC_STRIPE_PRICE_ELITE=price_placeholder_elite

# -----------------------------------------------
# 5. EMAIL (RESEND)
# -----------------------------------------------
# ✅ Your new Resend API Key
RESEND_API_KEY=re_placeholder

NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_STRIPE_PRICE_TOPUP=price_placeholder_topup
```

## 3. Service Setup (Prerequisites)
Before automating the config, ensuring you have the necessary accounts.

### A. Stripe (Payments)
1.  Log in to [dashboard.stripe.com](https://dashboard.stripe.com).
2.  Toggle **"Test Mode"** (Orange toggle).
3.  Go to **Developers -> API keys**.
4.  Copy the **Publishable Key** (`pk_test_...`) and **Secret Key** (`sk_test_...`).
5.  **Paste these immediately** into your open `.env.local` file.

### B. Resend (Emails)
1.  Sign up at [resend.com](https://resend.com).
2.  Go to **API Keys** and create a new key (Name: "Dev", Permission: Full Access).
3.  **Copy the API Key** (`re_...`) and paste it into `.env.local` as `RESEND_API_KEY`.
4.  **IMPORTANT:** In Test Mode, you can only send emails to the address you signed up with. Ensure your test user in the app uses this email!

## 4. Automated Configuration (The "Agentic" Way)

### A. Initialize Supabase & Capture Keys
The agent should run `npx supabase start` and parse the output to auto-fill the `.env.local` file.

**Where to find the Anon Key:**
- **Local Supabase:** Run `npx supabase status` in your terminal. The output will list several URLs and keys. Look for the line that starts with `anon key:`. The long string following it is your key.
- **Hosted Supabase:** Go to **Project Settings** (cog icon at the bottom left) -> **API**. Look under the **Project API Keys** section. The `anon` key is labeled `anon public`.

**Action:** Update `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `NEXT_PUBLIC_SUPABASE_URL` in `.env.local` with these values.

**Agent Instructions:**
1.  Run the command: `npx supabase start`
2.  Parse the stdout to find:
    - `anon key`: Set as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - `service_role key`: Set as `SUPABASE_SERVICE_ROLE_KEY`
    - `API URL`: Set as `NEXT_PUBLIC_SUPABASE_URL`

### B. Initialize Stripe & Capture Webhook Secret
**Agent Instructions:**
1.  Run the background command: `stripe login` (Interactive) to link the CLI.
2.  Run the background command: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
3.  **IMPORTANT:** Do not close this terminal window! The `stripe listen` command must remain running for webhooks (credits/payments) to work during testing.
4.  Wait 5 seconds and read the output.
5.  Extract the string starting with `whsec_...`
6.  Set this as `STRIPE_WEBHOOK_SECRET`

### C. Construct `.env.local`
**Agent Instructions:**
Create the `.env.local` file using the captured values and the User's provided keys.

```bash
# COMMAND TO RUN (Agent must replace placeholders with actual values)
cat <<EOF > .env.local
# APP
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# SUPABASE (Auto-captured)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=[AGENT_INSERT_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[AGENT_INSERT_SERVICE_KEY]

# STRIPE (Fixed Keys - User Provided from Step 3A)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=[USER_PROVIDE_PK]
STRIPE_SECRET_KEY=[USER_PROVIDE_SK]

# STRIPE (Auto-captured)
STRIPE_WEBHOOK_SECRET=[AGENT_INSERT_WEBHOOK_SECRET]

# CONFIG
NEXT_PUBLIC_STRIPE_PRICE_GYM=price_1SfcDS12ap1SCxToMWo5Lz3m
NEXT_PUBLIC_STRIPE_PRICE_TOPUP=price_1SfcDS12ap1SCxToMWo5Lz3m

# RESEND (User Provided from Step 3B)
RESEND_API_KEY=[USER_PROVIDE_RESEND_KEY]
EOF
```

## 5. Finalize Database
Run the setup script to create tables and triggers.
```bash
npx -y tsx run_sql.ts
```

## 6. Verification Checklist

1.  **Run the App**:
    ```bash
    npm run dev
    ```
2.  **Test Registration**:
    - Go to `http://localhost:3000`.
    - Click "Register".
    - Create a new user (e.g., `dev@test.com`).
    - *Success:* You should be redirected to the home screen.
3.  **Test Top Up**:
    - Go to **Settings** (Profile Icon) -> **Top Up Credits**.
    - Complete the Stripe checkout (Use test card `4242...`).
    - *Success:* You are redirected back, and credits increase by 1200.

## 7. Troubleshooting

### "Failed to fetch" or Login Errors
If the UI shows "Failed to fetch" or simply hangs during login/registration, the local Supabase API Gateway might be unresponsive.
**Fix:** Restart the Supabase services.
```bash
npx supabase stop
npx supabase start
```
*Note: This preserves your database data.*

### Credits Not Appearing Instructions
If you purchase credits but they don't appear in your profile:
1.  **Ensure `stripe listen` is running.** This forwards payment events to your local app.
    ```bash
    stripe listen --forward-to localhost:3000/api/webhooks/stripe
    ```
2.  **Verify Webhook Secret.** The command above outputs a secret (`whsec_...`).
3.  **Update `.env.local`**. Ensure `STRIPE_WEBHOOK_SECRET` matches the one from your *current* running listener.
4.  **Restart the App**. `npm run dev` to load the new config.
