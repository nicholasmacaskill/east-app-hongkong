import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    try {
        console.log(`Connecting to Supabase API: ${supabaseUrl}...`);
        
        const sql = `
            -- 1. Add missing columns to coach_drills
            ALTER TABLE public.coach_drills 
                ADD COLUMN IF NOT EXISTS description text,
                ADD COLUMN IF NOT EXISTS accessories text[] DEFAULT '{}'::text[],
                ADD COLUMN IF NOT EXISTS pods text,
                ADD COLUMN IF NOT EXISTS colors text,
                ADD COLUMN IF NOT EXISTS duration text,
                ADD COLUMN IF NOT EXISTS thumbnail_url text;

            -- 2. Add missing columns to coach_drill_steps
            ALTER TABLE public.coach_drill_steps 
                ADD COLUMN IF NOT EXISTS tactical_data text;

            -- 3. Reload Schema Cache
            NOTIFY pgrst, 'reload schema';
        `;

        const { data, error } = await supabase.rpc('run_sql', { sql_query: sql });
        
        if (error) {
            console.error('❌ Migration via run_sql failed:', error.message);
            process.exit(1);
        } else {
            console.log('✅ Successfully added missing columns to coach_drills and coach_drill_steps!');
        }

    } catch (e) {
        console.error('❌ Migration failed:', e);
        process.exit(1);
    }
}

runMigration();
