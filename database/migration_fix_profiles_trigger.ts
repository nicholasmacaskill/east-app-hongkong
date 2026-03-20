import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrate() {
    console.log('Applying Migration: Fix Profiles Trigger...');

    const triggerSql = `
        -- Ensure the function is updated
        CREATE OR REPLACE FUNCTION public.handle_new_user() 
        RETURNS trigger AS $$
        BEGIN
          INSERT INTO public.profiles (
            id, first_name, last_name, contact_email, username, role, credits, membership_tier, mobile
          )
          VALUES (
            new.id,
            new.raw_user_meta_data->>'first_name',
            new.raw_user_meta_data->>'last_name',
            new.email,
            split_part(new.email, '@', 1),
            COALESCE(new.raw_user_meta_data->>'role', 'player'),
            0,
            'individual',
            new.raw_user_meta_data->>'mobile'
          )
          ON CONFLICT (id) DO NOTHING;
          RETURN new;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        -- Re-attach the trigger
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    `;

    const { error } = await supabase.rpc('run_sql', { sql_query: triggerSql });

    if (error) {
        console.error('Migration failed:', error.message);
        process.exit(1);
    }

    console.log('Migration successfully applied.');
}

migrate().catch(console.error);
