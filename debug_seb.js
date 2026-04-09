const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

function loadEnv(file) {
  if (!fs.existsSync(file)) return null;
  const content = fs.readFileSync(file, 'utf8');
  const result = {};
  content.split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) {
      result[key.trim()] = rest.join('=').trim().replace(/(^"|"$)/g, '');
    }
  });
  return result;
}

async function run() {
  const env = loadEnv('.env.production');
  if (!env) { console.log('No ENV'); return; }
  
  const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);
  const email = 'sebastien.brien@gmail.com';

  console.log('Checking Auth...');
  const { data: listData, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) { console.log('Auth error:', authError.message); return; }

  const user = listData.users.find(u => u.email === email);
  if (!user) {
    console.log(`User ${email} NOT FOUND in Auth.`);
    return;
  }

  console.log(`Found in Auth! ID: ${user.id}`);

  const { data: profile, error: profError } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (profError) {
    console.log('Profile error:', profError.message);
  } else if (profile) {
    console.log('Profile found:', JSON.stringify(profile, null, 2));
  } else {
    console.log('Profile missing.');
  }
}

run();
