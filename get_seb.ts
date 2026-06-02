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

const env = loadEnv('.env.production'); // Check production
const url = env['NEXT_PUBLIC_SUPABASE_URL'] || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = env['SUPABASE_SERVICE_ROLE_KEY'] || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(url, key);

async function run() {
  const email = 'sebastien.brien@gmail.com';
  console.log('Checking Auth...');
  const { data: listData } = await supabase.auth.admin.listUsers();
  const user = listData?.users?.find(u => u.email === email);
  if (!user) {
    console.log('User not found in Auth! They need to be invited or inserted.');
    return;
  }
  console.log('Found in Auth:', user.id, user.email);

  console.log('Checking Profile...');
  const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (error) {
    console.log('Error fetching profile:', error);
  } else if (profile) {
    console.log('Found in Profiles:', JSON.stringify(profile, null, 2));
  } else {
    console.log('Profile missing!');
  }
}
run().catch(console.error);
