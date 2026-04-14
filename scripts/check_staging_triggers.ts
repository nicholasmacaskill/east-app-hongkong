import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

function loadEnv(file: string) {
  const envPath = path.resolve(process.cwd(), file);
  const result: Record<string, string> = {};
  if (!fs.existsSync(envPath)) return result;
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join('=').trim().replace(/(^"|"$)/g, '');
      if (key && !key.startsWith('#')) result[key] = value;
    }
  });
  return result;
}

const stagingEnv = loadEnv('.env.staging');
const supabase = createClient(stagingEnv['NEXT_PUBLIC_SUPABASE_URL'], stagingEnv['SUPABASE_SERVICE_ROLE_KEY']);

async function checkTriggers() {
  const { data, error } = await supabase.rpc('check_trigger_exists' as any);
  if (error) {
    // fallback: query via raw SQL through a known RPC or just check by creating a test user
    console.log('RPC not available, will infer from behavior');
  }
  
  // Check if handle_new_user function exists
  const { data: fnData, error: fnError } = await supabase
    .from('pg_proc' as any)
    .select('proname')
    .eq('proname', 'handle_new_user');
  
  console.log('Function check:', fnData, fnError?.message);
}

checkTriggers();
