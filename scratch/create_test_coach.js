const { createClient } = require('@supabase/supabase-js');

// Test database credentials from .env.test
const url = 'https://lzqnviblkcnjsxutqeht.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6cW52aWJsa2NuanN4dXRxZWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDgyMjEyMSwiZXhwIjoyMDkwMzk4MTIxfQ.zkfbtc7Bv_Dsswe9Nwtzf9Yq4ZO4JdLzDRSuGxGq9uk';

const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function createTestCoach() {
    const email = 'coach.test@east.com';
    const password = 'EastCoach2026!';

    console.log('Creating test coach in TEST database (lzqnviblkcnjsxutqeht)...');

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: 'coach', first_name: 'Coach', last_name: 'Test' }
    });

    let userId;
    if (authError) {
        if (authError.code === 'email_exists') {
            console.log('User already exists — fetching ID...');
            const { data: { users } } = await supabase.auth.admin.listUsers();
            userId = users.find(u => u.email === email)?.id;
        } else {
            console.error('Auth error:', authError);
            return;
        }
    } else {
        userId = authData.user.id;
    }

    if (!userId) { console.error('Could not get user ID'); return; }

    // 2. Upsert profile with coach role
    const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId,
        role: 'coach',
        first_name: 'Coach',
        last_name: 'Test',
        contact_email: email,
        account_status: 'active'
    });

    if (profileError) {
        console.error('Profile error:', profileError);
        return;
    }

    console.log('\n✅ TEST COACH CREATED IN TEST DATABASE');
    console.log('🌐 URL:      https://test-branch-east.vercel.app');
    console.log('📧 Email:    ', email);
    console.log('🔑 Password: ', password);
}

createTestCoach();
