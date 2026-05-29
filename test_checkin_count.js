require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const userId = '539f3360-ef93-4c3a-9e60-7dce16e5f49e';
  
  console.log('Inserting dummy check-in...');
  const { error: insertErr } = await supabaseAdmin
    .from('check_ins')
    .insert({ user_id: userId, location_id: 'Test Gym' });
    
  if (insertErr) {
    console.error('Insert error:', insertErr);
  }

  // Fetch count
  const { count, error, data } = await supabaseAdmin
    .from('check_ins')
    .select('*', { count: 'exact' })
    .eq('user_id', userId);

  console.log(`Query successful! User ${userId} has ${count} check-ins. Data length: ${data?.length}`);
}

run();
