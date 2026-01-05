# 🚀 DEPLOYMENT GUIDE (East App HK)

Follow these exact steps to deploy your application to Production (Vercel + Supabase).

## 1. Database Setup (Supabase)
We have bundled your entire schema into one file for an instant setup.

1.  Go to your **Supabase Project Dashboard**.
2.  Open the **SQL Editor** (Sidebar > SQL).
3.  Click **New Query**.
4.  Copy the content of **[database/deploy_bundle.sql](database/deploy_bundle.sql)** and paste it into the editor.
5.  Click **Run**.
    *   *Note: Ignore "relation already exists" errors if you have already run parts of this. The script uses `IF NOT EXISTS` where possible.*

## 2. Seed Admin User
Create your initial Administrator account.

1.  Open your terminal in the project root.
2.  Run the seed script:
    ```bash
    npx tsx database/seed_admin.ts
    ```
3.  You can now log in as:
    *   **Email:** `admin@east.com`
    *   **Password:** `password123`
    *   *Change this password immediately after first login.*

## 3. Deployment (Vercel)

Ensure you have the Vercel CLI installed (`npm i -g vercel`).

1.  **Login to Vercel:**
    ```bash
    vercel login
    ```

2.  **Link Project:**
    ```bash
    vercel link
    ```
    *   Follow the prompts to select your Vercel project scope.

3.  **Sync Environment Variables:**
    Push your local keys to Vercel Production.
    ```bash
    vercel env pull .env.local
    ```
    *   *Alternatively, go to Vercel Dashboard > Settings > Environment Variables and manually add:*
        *   `NEXT_PUBLIC_SUPABASE_URL`
        *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
        *   `SUPABASE_SERVICE_ROLE_KEY`
        *   `NEXT_PUBLIC_BASE_URL` (Set to your Vercel domain, e.g., `https://east-app.vercel.app`)
        *   `RESEND_API_KEY` (If using email)
        *   `STRIPE_...` (Stripe keys)

4.  **Deploy to Production:**
    ```bash
    vercel deploy --prod
    ```

## 4. Post-Deployment Check
1.  Visit your live URL.
2.  Login with the Admin account.
3.  Go to `/stats` and check if the Golf Leaderboard loads without errors.
