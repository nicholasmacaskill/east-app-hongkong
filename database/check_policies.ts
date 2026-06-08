import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.production') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPolicies() {
    const sql = `
        SELECT 
            tablename, 
            policyname, 
            cmd,
            roles,
            qual,
            with_check
        FROM 
            pg_policies 
        WHERE 
            tablename IN ('training_plans', 'training_plan_drills', 'coach_drills')
        ORDER BY 
            tablename;
    `;
    const { data, error } = await supabase.rpc('run_sql', { sql_query: sql });
    if (error) console.error(error);
    else console.table(data);
}

checkPolicies();
