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

const users = [
  { envName: 'PRODUCTION', envFile: '.env.production', userId: 'e4726d3f-c4e4-43cd-ac35-c4ed3a25391a' },
  { envName: 'STAGING',    envFile: '.env.staging',    userId: 'f3cfc1b4-e00b-413e-af29-382db1d167d2' },
];

async function run() {
  for (const { envName, envFile, userId } of users) {
    const env = loadEnv(envFile);
    const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      contact_email: 'qaben@east.com',
      first_name: 'Ben',
      last_name: 'QA',
      role: 'sys-admin',
    }, { onConflict: 'id' });

    if (error) {
      console.error(`[${envName}] Profile error:`, error.message);
    } else {
      console.log(`[${envName}] Profile created as sys-admin`);
    }
  }
}
run();
