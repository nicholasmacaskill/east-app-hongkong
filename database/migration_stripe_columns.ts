import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function migrate() {
    console.log('🚀 Starting Stripe Schema Migration...');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('❌ Missing credentials in .env.local');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const sql = `
        -- 1. Ensure 'tier' column exists
        DO $$ 
        BEGIN 
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'tier') THEN
                ALTER TABLE public.profiles ADD COLUMN tier text CHECK (tier IN ('free', 'individual', 'family_2', 'family_3plus')) DEFAULT 'free';
            END IF;
        END $$;

        -- 2. Ensure 'stripe_customer_id' exists
        DO $$ 
        BEGIN 
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'stripe_customer_id') THEN
                ALTER TABLE public.profiles ADD COLUMN stripe_customer_id text;
            END IF;
        END $$;

        -- 3. Ensure 'stripe_subscription_id' exists
        DO $$ 
        BEGIN 
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'stripe_subscription_id') THEN
                ALTER TABLE public.profiles ADD COLUMN stripe_subscription_id text;
            END IF;
        END $$;

        -- 4. Ensure 'subscription_status' exists
        DO $$ 
        BEGIN 
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'subscription_status') THEN
                ALTER TABLE public.profiles ADD COLUMN subscription_status text DEFAULT 'inactive';
            END IF;
        END $$;

        -- 5. Add index for lookups
        CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id);
    `;

    const { error } = await supabase.rpc('run_sql', { sql });

    if (error) {
        console.error('❌ Migration Failed:', error);
        process.exit(1);
    }

    console.log('✅ Stripe Schema Migration Successful!');
}

migrate();
