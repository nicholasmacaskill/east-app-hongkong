import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.production.latest') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPolicies() {
    const { data, error } = await supabase.rpc('run_sql', { 
        sql_query: "SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'coach_drills';" 
    });
    console.log('Policies for coach_drills:', data, error);
}

checkPolicies();
