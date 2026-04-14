import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

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

const envFiles = [
  { name: 'Production', file: '.env.production' },
  { name: 'Staging', file: '.env.staging' },
  { name: 'Test', file: '.env.test.latest' }
];

async function checkCoach(envName: string, envFile: string) {
  const env = loadEnv(envFile);
  const url = env['NEXT_PUBLIC_SUPABASE_URL'];
  const key = env['SUPABASE_SERVICE_ROLE_KEY'];
  
  if (!url || !key) {
    console.log(`[${envName}] Missing URL or KEY in ${envFile}`);
    return;
  }

  const supabase = createClient(url, key);
  const email = 'sebastien.brien@gmail.com';

  const { data: listData } = await supabase.auth.admin.listUsers();
  const user = listData?.users?.find(u => u.email === email);
  
  if (!user) {
    console.log(`[${envName}] ❌ User not found in Auth.`);
    return;
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (profile) {
    console.log(`[${envName}] ✅ Found! Role: ${profile.role}, Status: ${profile.account_status || 'N/A'}`);
  } else {
    console.log(`[${envName}] ⚠️ Found in Auth, but Profile is MISSING.`);
  }
}

async function run() {
  for (const env of envFiles) {
    await checkCoach(env.name, env.file);
  }
}

run();
