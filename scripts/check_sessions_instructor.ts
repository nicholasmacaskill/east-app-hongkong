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

async function search(envName: string, envFile: string) {
  const env = loadEnv(envFile);
  const url = env['NEXT_PUBLIC_SUPABASE_URL'];
  const key = env['SUPABASE_SERVICE_ROLE_KEY'];
  if (!url || !key) return;

  const supabase = createClient(url, key);
  console.log(`[${envName}] Checking sessions for 'Sebastien' or 'Brien'...`);
  
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('instructor')
    .or('instructor.ilike.%Sebastien%,instructor.ilike.%Brien%');

  if (error) {
    console.log(`[${envName}] ❌ Error: ${error.message}`);
    return;
  }

  if (sessions && sessions.length > 0) {
    const uniqueInstructors = Array.from(new Set(sessions.map(s => s.instructor)));
    console.log(`[${envName}] Found instructor names in sessions: ${uniqueInstructors.join(', ')}`);
  } else {
    console.log(`[${envName}] ❌ No matching instructors found in sessions.`);
  }
}

async function run() {
  await search('PRODUCTION', '.env.production');
  await search('STAGING', '.env.staging');
}
run();
