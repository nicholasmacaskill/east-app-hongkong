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

const env = loadEnv('.env.test.latest'); // Maybe test environment? I'll use test.latest and staging
const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'] || loadEnv('.env.staging')['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY'] || loadEnv('.env.staging')['SUPABASE_SERVICE_ROLE_KEY']);

async function run() {
  const { data, error } = await supabase
    .from('engineering_tickets')
    .select('*')
    .in('ticket_number', [22, 23]);

  if (error) { console.error(error.message); return; }

  console.log(JSON.stringify(data, null, 2));
}
run();
