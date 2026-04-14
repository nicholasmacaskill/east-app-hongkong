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

const env = loadEnv('.env.staging');
const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

async function run() {
  const { data, error } = await supabase
    .from('engineering_tickets')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) { console.error(error.message); return; }

  const ticket11 = data?.find(t => t.ticket_number === 11 || t.id?.toString().includes('11'));
  console.log('All tickets (id/number + title + status):');
  data?.forEach(t => console.log(`  [${t.ticket_number ?? t.id}] ${t.title} — ${t.status}`));
  console.log('\n--- TICKET 11 FULL DETAILS ---');
  console.log(JSON.stringify(ticket11 || data?.[10], null, 2));
}
run();
