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
const NEW_PASSWORD = 'EastQA_Ben2026!';

async function resetBen(envName: string, envFile: string) {
  const env = loadEnv(envFile);
  const url = env['NEXT_PUBLIC_SUPABASE_URL'];
  const key = env['SUPABASE_SERVICE_ROLE_KEY'];
  if (!url || !key) { console.error(`[${envName}] Missing URL or SERVICE_ROLE_KEY in ${envFile}`); return; }

  const supabase = createClient(url, key);

  const { data: listData, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 200 });
  if (listErr) { console.error(`[${envName}] listUsers error:`, listErr.message); return; }

  const ben = listData.users.find(u => u.email === BEN_EMAIL);
  if (!ben) { console.log(`[${envName}] ❌ ${BEN_EMAIL} not found — may not exist in this environment`); return; }

  const { error } = await supabase.auth.admin.updateUserById(ben.id, { password: NEW_PASSWORD });
  if (error) {
    console.error(`[${envName}] ❌ Failed:`, error.message);
  } else {
    console.log(`[${envName}] ✅ Password reset for ${BEN_EMAIL}`);
  }
}

async function run() {
  await resetBen('PRODUCTION', '.env.production');
  await resetBen('STAGING', '.env.staging');
  console.log(`\nNew password: ${NEW_PASSWORD}`);
}
run();
