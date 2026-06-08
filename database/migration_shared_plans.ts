import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.production') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
    try {
        const sql = `
            ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS shared_plan_id uuid REFERENCES public.training_plans(id) ON DELETE SET NULL;
            NOTIFY pgrst, 'reload schema';
        `;
        const { error } = await supabase.rpc('run_sql', { sql_query: sql });
        if (error) throw error;
        console.log('Successfully added shared_plan_id to messages');
    } catch (e) {
        console.error('Migration failed:', e);
        process.exit(1);
    }
}

run();
