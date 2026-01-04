import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load env vars if running locally with ts-node/tsx, but here we'll just hardcode for the script
const SUPABASE_URL = 'http://127.0.0.1:54321';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'; // Fallback to what we saw earlier if env missing in shell

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const run = async () => {
    console.log('Recreating player@east.com via Admin API...');

    const email = 'player@east.com';
    const password = 'password123';

    // 1. Find existing user to get ID
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const existing = users.find(u => u.email === email);

    if (existing) {
        console.log(`Found existing user ${existing.id}, deleting...`);
        await supabase.auth.admin.deleteUser(existing.id);
    } else {
        console.log('User not found, proceeding to create.');
    }

    // 2. Create User
    console.log('Creating new user...');
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: 'player' }
    });

    if (createError) {
        console.error('❌ Error creating user:', createError);
        return;
    }

    console.log(`✅ User created: ${newUser.user.id}`);

    // 3. Upsert Profile
    console.log('Upserting profile...');
    const { error: profileError } = await supabase.from('profiles').upsert({
        id: newUser.user.id,
        role: 'player',
        contact_email: email,
        first_name: 'Test',
        last_name: 'Player',
        credits: 100,
        preferences: {},
        parent_id: null
    });

    if (profileError) {
        console.error('❌ Error upserting profile:', profileError);
    } else {
        console.log('✅ Profile upserted.');
    }
};

run();
