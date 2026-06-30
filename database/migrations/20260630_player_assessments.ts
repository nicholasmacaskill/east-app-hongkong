import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

async function runMigration() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Missing Supabase credentials in .env.local');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const sql = fs.readFileSync(path.join(__dirname, '20260630_player_assessments.sql'), 'utf8');

    const { error } = await supabase.rpc('run_sql', { sql_query: sql });

    if (error) {
        console.error('Migration failed:', error.message);
        console.log('\nRun manually in Supabase SQL editor:\n');
        console.log(sql);
        process.exit(1);
    }

    console.log('Player assessments migration applied successfully.');
}

runMigration();