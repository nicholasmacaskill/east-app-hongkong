import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local for local dev, or .env.production if you want to run against prod
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    try {
        console.log(`Connecting to Supabase API: ${supabaseUrl}...`);

        const sql = `
            ALTER TABLE public.messages
            ADD COLUMN IF NOT EXISTS shared_drill_id uuid REFERENCES public.coach_drills(id) ON DELETE SET NULL,
            ADD COLUMN IF NOT EXISTS shared_plan_id uuid REFERENCES public.training_plans(id) ON DELETE SET NULL;

            -- Reload Schema Cache
            NOTIFY pgrst, 'reload schema';
        `;

        const { data, error } = await supabase.rpc('run_sql', { sql_query: sql });

        if (error) {
            console.error('❌ Migration via run_sql failed:', error.message);
            process.exit(1);
        } else {
            console.log('✅ Successfully added shared_drill_id and shared_plan_id to messages table.');
        }

    } catch (e) {
        console.error('❌ Migration failed:', e);
        process.exit(1);
    }
}

runMigration();
