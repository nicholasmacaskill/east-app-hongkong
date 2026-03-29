const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createInfoAdmin() {
  const email = 'info@easthighperformancecentre.com';
  const password = 'Hs0ffBZgryeKgeiBw6KYTziou9uN3tm2'; // 32-char high-entropy

  console.log(`--- Creating Admin Account: ${email} ---`);

  // 1. Create User in auth.users
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'sys-admin' }
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
        console.log('User already exists in Auth. Updating password and metadata...');
        const { data: listData } = await supabase.auth.admin.listUsers();
        const existingUser = listData.users.find(u => u.email === email);
        if (existingUser) {
            const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
                password,
                user_metadata: { role: 'sys-admin' }
            });
            if (updateError) console.error('Update failed:', updateError);
            else console.log('✅ Auth updated.');
            await syncProfile(existingUser.id);
        }
    } else {
        console.error('Auth creation failed:', authError);
    }
  } else {
    console.log('✅ Auth user created.');
    await syncProfile(authUser.user.id);
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

    if (profileError) console.error('Profile sync failed:', profileError);
    else console.log('✅ Profile synced with sys-admin role.');
  }

  console.log('--- Operation Complete ---');
}

createInfoAdmin();
