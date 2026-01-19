/**
 * ADMIN RECOVERY SCRIPT
 * Usage: node database/create_admin.cjs <email> <password>
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing Supabase environment variables.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
    const email = process.argv[2];
    const password = process.argv[3];

    if (!email || !password) {
        console.error('❌ Usage: node database/create_admin.cjs <email> <password>');
        process.exit(1);
    }

    console.log(`🚀 Attempting to create/promote admin: ${email}`);

    // 1. Check if user exists
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    let user = users.find(u => u.email === email);

    if (!user) {
        console.log('✨ Creating new user...');
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { role: 'sys-admin', first_name: 'System', last_name: 'Admin' }
        });
        if (createError) throw createError;
        user = newUser.user;
        console.log('✅ User created');
    } else {
        console.log('👤 User already exists, promoting to sys-admin...');
    }

    // 2. Ensure profile exists and has sys-admin role
    const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
            id: user.id,
            contact_email: email,
            role: 'sys-admin',
            first_name: 'System',
            last_name: 'Admin'
        }, { onConflict: 'id' });

    if (profileError) throw profileError;

    console.log(`\n🎉 SUCCESS! You can now login at /login with:`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
}

run().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
