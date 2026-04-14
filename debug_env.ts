import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

function loadEnv(file: string) {
  const envPath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(envPath)) return null;
  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split('\n');
  const result: Record<string, string> = {};
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

async function debug() {
  const env = loadEnv('.env.production');
  if (!env) { console.log('No .env.production'); return; }
  console.log('URL defined:', !!env['NEXT_PUBLIC_SUPABASE_URL']);
  console.log('KEY defined:', !!env['SUPABASE_SERVICE_ROLE_KEY']);
  
  const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1 });
  if (error) console.log('Auth Error:', error.message);
  else console.log('Auth OK, users found:', data.users.length > 0);
}
debug();
