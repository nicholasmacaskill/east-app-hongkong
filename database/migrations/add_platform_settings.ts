import { readFileSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function run() {
  const sql = readFileSync(join(__dirname, 'add_platform_settings.sql'), 'utf8');
  const supabase = createClient(supabaseUrl!, serviceRoleKey!);

  const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).maybeSingle();

  if (error) {
    console.error('Migration failed via exec_sql RPC. Run database/migrations/add_platform_settings.sql manually in Supabase SQL editor.');
    console.error(error.message);
    process.exit(1);
  }

  console.log('✅ platform_settings migration applied.');
}

run();