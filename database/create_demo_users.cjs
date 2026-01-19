/**
 * DEMO USER CREATION SCRIPT
 * Usage: node database/create_demo_users.cjs
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

const demoUsers = [
    {
        email: 'coach@east.com',
        password: 'DemoCoach2026!',
        role: 'coach',
        firstName: 'Demo',
        lastName: 'Coach'
    },
    {
        email: 'parent@east.com',
        password: 'DemoParent2026!',
        role: 'parent',
        firstName: 'Demo',
        lastName: 'Parent'
    },
    {
        email: 'player@east.com',
        password: 'DemoPlayer2026!',
        role: 'player',
        firstName: 'Demo',
        lastName: 'Player'
    }
];

async function run() {
    console.log('🚀 Creating demo users...');

    for (const user of demoUsers) {
        console.log(`\n👤 Processing ${user.role}: ${user.email}`);

        // 1. Create/Get Auth User
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;

        let authUser = users.find(u => u.email === user.email);

        if (!authUser) {
            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                email: user.email,
                password: user.password,
                email_confirm: true,
                user_metadata: {
                    role: user.role,
                    first_name: user.firstName,
                    last_name: user.lastName
                }
            });
            if (createError) throw createError;
            authUser = newUser.user;
            console.log('✅ Auth user created');
        } else {
            console.log('ℹ️ Auth user already exists');
        }

        // 2. Ensure Profile exists
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: authUser.id,
                contact_email: user.email,
                role: user.role,
                first_name: user.firstName,
                last_name: user.lastName,
                credits: user.role === 'parent' ? 1000 : 0 // Give parent some credits for demo
            }, { onConflict: 'id' });

        if (profileError) throw profileError;
        console.log('✅ Profile upserted');
    }

    console.log('\n🎉 ALL DEMO USERS READY!');
}

run().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
