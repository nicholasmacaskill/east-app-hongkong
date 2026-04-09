import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

function loadEnv(file: string) {
  const envPath = path.resolve(process.cwd(), file);
  const result: Record<string, string> = {};
  if (!fs.existsSync(envPath)) { console.warn(`⚠️  ${file} not found`); return result; }
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

const BEN_EMAIL = 'qaben@east.com';
const BEN_PASSWORD = 'EastQA_Ben2026!';

async function provisionBen(envName: string, envFile: string) {
  const env = loadEnv(envFile);
  const url = env['NEXT_PUBLIC_SUPABASE_URL'];
  const key = env['SUPABASE_SERVICE_ROLE_KEY'];
  if (!url || !key) { console.error(`[${envName}] ❌ Missing URL or SERVICE_ROLE_KEY in ${envFile}`); return; }

  const supabase = createClient(url, key);

  // Check if user already exists
  const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 200 });
  const existing = listData?.users.find(u => u.email === BEN_EMAIL);

  let userId: string;

  if (existing) {
    console.log(`[${envName}] User already exists, updating password...`);
    const { error } = await supabase.auth.admin.updateUserById(existing.id, { password: BEN_PASSWORD });
    if (error) { console.error(`[${envName}] ❌ Failed to update password:`, error.message); return; }
    userId = existing.id;
    console.log(`[${envName}] ✅ Password updated`);
  } else {
    // Create the auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: BEN_EMAIL,
      password: BEN_PASSWORD,
      email_confirm: true,
    });
    if (authError || !authData.user) { console.error(`[${envName}] ❌ Failed to create auth user:`, authError?.message); return; }
    userId = authData.user.id;
    console.log(`[${envName}] ✅ Auth user created (id: ${userId})`);
  }

  // Upsert profile
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    contact_email: BEN_EMAIL,
    first_name: 'Ben',
    last_name: 'QA',
    role: 'sys-admin',
  }, { onConflict: 'id' });

  if (profileError) {
    console.error(`[${envName}] ⚠️  Profile upsert failed:`, profileError.message);
  } else {
    console.log(`[${envName}] ✅ Profile set as sys-admin`);
  }
}

async function run() {
  console.log('--- Provisioning Ben QA Account ---\n');
  await provisionBen('PRODUCTION', '.env.production');
  console.log('');
  await provisionBen('STAGING', '.env.staging');
  console.log(`\n--- Done ---`);
  console.log(`Email:    ${BEN_EMAIL}`);
  console.log(`Password: ${BEN_PASSWORD}`);
}
run();
