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
  // List announcements
  const { data, error } = await supabase.from('announcements').select('id, title, created_at').order('created_at', { ascending: false });
  if (error) { console.error('Fetch error:', error.message); return; }
  
  console.log(`Found ${data?.length} announcements:`);
  data?.forEach(a => console.log(`  [${a.id}] ${a.title}`));

  if (!data || data.length === 0) { console.log('Nothing to delete.'); return; }

  // Try deleting the first one
  const target = data[0];
  console.log(`\nAttempting to delete: "${target.title}" (${target.id})`);
  const { error: delError } = await supabase.from('announcements').delete().eq('id', target.id);

  if (delError) {
    console.error('❌ Delete failed:', delError.message, delError.code, delError.details);
  } else {
    console.log('✅ Delete succeeded');
  }
}
run();
