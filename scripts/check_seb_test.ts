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

const EMAIL = 'sebastien.brien@gmail.com';

async function checkSub(envName: string, envFile: string) {
  const env = loadEnv(envFile);
  const url = env['NEXT_PUBLIC_SUPABASE_URL'];
  const key = env['SUPABASE_SERVICE_ROLE_KEY'];
  if (!url || !key) {
    console.log(`[${envName}] ❌ Missing config (URL: ${!!url}, KEY: ${!!key}) in ${envFile}`);
    return;
  }

  const supabase = createClient(url, key);
  console.log(`[${envName}] Fetching Auth users...`);
  const { data: listData, error: authError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (authError) {
    console.log(`[${envName}] ❌ Auth fetch error: ${authError.message}`);
    return;
  }
  const user = listData?.users.find(u => u.email === EMAIL);

  if (!user) {
    console.log(`[${envName}] ❌ User not found in Auth.`);
    return;
  }

  console.log(`[${envName}] Fetching profile for ID: ${user.id}...`);
  const { data: profile, error: profError } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (profError) {
    console.log(`[${envName}] ❌ Profile fetch error: ${profError.message}`);
  } else if (profile) {
    console.log(`[${envName}] ✅ User found. Role: ${profile.role}, Status: ${profile.account_status}`);
  } else {
    console.log(`[${envName}] ⚠️ Found in Auth, but Profile is MISSING.`);
  }
}

async function run() {
  console.log(`--- Checking Account (TEST): ${EMAIL} ---\n`);
  await checkSub('TEST_LATEST', '.env.test.latest');
  console.log(`\n--- Done ---`);
}
run();
