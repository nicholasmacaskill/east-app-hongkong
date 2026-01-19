import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function migrate() {
    console.log('🚀 Starting Membership Lifecycle Schema Migration...');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('❌ Missing credentials in .env.local');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const sql = `
        -- 1. Add membership_start column
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'membership_start') THEN
                ALTER TABLE public.profiles ADD COLUMN membership_start timestamp with time zone;
                RAISE NOTICE 'Added membership_start column';
            END IF;
        END $$;

        -- 2. Add membership_expires column
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'membership_expires') THEN
                ALTER TABLE public.profiles ADD COLUMN membership_expires timestamp with time zone;
                RAISE NOTICE 'Added membership_expires column';
            END IF;
        END $$;

        -- 3. Add membership_history column
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'membership_history') THEN
                ALTER TABLE public.profiles ADD COLUMN membership_history jsonb DEFAULT '[]'::jsonb;
                RAISE NOTICE 'Added membership_history column';
            END IF;
        END $$;
    `;

    const { error } = await supabase.rpc('run_sql', { sql });

    if (error) {
        console.error('❌ Migration Failed:', error);
        process.exit(1);
    }

    console.log('✅ Membership Lifecycle Schema Migration Successful!');
}

migrate();
