
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Try loading .env.local first
const result = dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
if (result.error) {
    console.log('Could not load .env.local, trying .env');
    dotenv.config();
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
    const oldEmail = 'test-admin-1769405602630@east.com';
    const newEmail = 'admin@east.com';

    console.log(`Searching for old email: ${oldEmail}`);

    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) { console.error(error); return; }

    const user = users.find(u => u.email === oldEmail);
    if (!user) {
        console.error('User not found!');
        return;
    }

    console.log(`Found user ${user.id}. Updating to ${newEmail}...`);

    // 1. Update Auth
    const { error: authError } = await supabase.auth.admin.updateUserById(user.id, {
        email: newEmail,
        email_confirm: true,
        user_metadata: { ...user.user_metadata, first_name: 'Sys', last_name: 'Admin' }
    });

    if (authError) {
        console.error('Auth update failed:', authError);
        return;
    }
    console.log('Auth updated.');

    // 2. Update Profile
    const { error: profileError } = await supabase
        .from('profiles')
        .update({
            contact_email: newEmail,
            first_name: 'Sys',
            last_name: 'Admin'
        })
        .eq('id', user.id);

    if (profileError) {
        console.error('Profile update failed:', profileError);
        return;
    }
    console.log('Profile updated.');
    console.log(`\nSUCCESS. Login with:\nEmail: ${newEmail}\nPassword: password123`);
}

run();
