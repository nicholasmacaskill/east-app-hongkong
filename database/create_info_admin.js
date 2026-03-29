const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createOrUpdateAdmin() {
  const email = 'info@easthighperformancecentre.com';
  const password = process.argv[2] === '--new-pass' ? process.argv[3] : 'EastPerformanceHQAdmin2026!!!!';

  console.log(`--- Creating/Updating Admin Account: ${email} ---`);

  // 1. List Users to find the ID
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('List users failed:', listError);
    return;
  }

  const existingUser = users.find(u => u.email === email);

  if (existingUser) {
    console.log(`User found with ID: ${existingUser.id}. Updating password...`);
    const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
      password: password,
      user_metadata: { role: 'sys-admin' }
    });
    if (updateError) console.error('Update failed:', updateError.message);
    else {
        console.log('✅ Auth password updated.');
        await syncProfile(existingUser.id);
    }
  } else {
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: 'sys-admin' }
      });
    
      if (authError) console.error('Auth creation failed:', authError.message);
      else {
        console.log('✅ Auth user created.');
        await syncProfile(authUser.user.id);
      }
  }

  async function syncProfile(userId) {
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        first_name: 'HQ',
        last_name: 'Admin',
        role: 'sys-admin',
        credits: 9999,
        contact_email: email
      });

    if (profileError) console.error('Profile sync failed:', profileError.message);
    else console.log('✅ Profile synced with sys-admin role.');
  }

  console.log('--- Operation Complete ---');
}

createOrUpdateAdmin();
