import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

function loadEnv(file: string) {
  const envPath = path.resolve(process.cwd(), file);
  const result: Record<string, string> = {};
  if (!fs.existsSync(envPath)) return result;
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  lines.forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join('=').trim().replace(/(^"|"$)/g, '');
      if (key && !key.startsWith('#')) result[key] = value;
    }
  });
  return result;
}

async function list(envName: string, envFile: string) {
  const env = loadEnv(envFile);
  const url = env['NEXT_PUBLIC_SUPABASE_URL'];
  const key = env['SUPABASE_SERVICE_ROLE_KEY'];
  if (!url || !key) return;

  const supabase = createClient(url, key);
  console.log(`\n[${envName}] Listing all Coaches:`);
  
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('first_name, last_name, contact_email, role')
    .eq('role', 'coach');

  if (error) {
    console.log(`❌ Error: ${error.message}`);
    return;
  }

  if (profiles && profiles.length > 0) {
    profiles.forEach(p => {
      console.log(`- ${p.first_name} ${p.last_name} (${p.contact_email})`);
    });
  } else {
    console.log(`❌ No coaches found.`);
  }
}

async function run() {
  await list('PRODUCTION', '.env.production');
  await list('STAGING', '.env.staging');
  await list('TEST', '.env.test.latest');
}
run();
