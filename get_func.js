const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envPath = '.env.production';
const envStr = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
let url, key;
for (const line of envStr.split('\n')) {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].replace(/"/g, '');
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = line.split('=')[1].replace(/"/g, '');
}

const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase.rpc('run_sql_query', { query: `
    SELECT routine_definition 
    FROM information_schema.routines 
    WHERE routine_name = 'handle_new_user'
  `});
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}

check();
