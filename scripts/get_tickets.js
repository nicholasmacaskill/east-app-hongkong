const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function loadEnv(file) {
  const envPath = path.resolve(process.cwd(), file);
  const result = {};
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

const env = loadEnv('.env.test.latest');
const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

async function run() {
  const { data, error } = await supabase
    .from('engineering_tickets')
    .select('id, title, description, status')
    .in('id', [22, 23]);

  if (error) { console.error('Error:', error.message); return; }
  
  if (data.length === 0) {
      // If not 22 and 23 by ID, let's fetch ALL latest tickets
      const { data: latest } = await supabase.from('engineering_tickets').select('id, title, description').order('id', { ascending: false }).limit(5);
      console.log('No tickets physically numbered 22 and 23. Latest tickets:', JSON.stringify(latest, null, 2));
  } else {
      console.log('TICKETS 22 AND 23:', JSON.stringify(data, null, 2));
  }
}
run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
