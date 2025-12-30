
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables manually
const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = fs.readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};

envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim();
    }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'] || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'] || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const USERS = [
    {
        email: 'coach@east.com',
        password: 'password123',
        role: 'coach',
        firstName: 'Coach',
        lastName: 'User',
        bio: 'Professional Hockey Coach with 10 years experience.'
    },
    {
        email: 'parent@east.com',
        password: 'password123',
        role: 'parent',
        firstName: 'Parent',
        lastName: 'User',
        bio: 'Parent account.'
    },
    {
        email: 'player@east.com',
        password: 'password123',
        role: 'player',
        firstName: 'Player',
        lastName: 'User',
        bio: 'Aspiring athlete.'
    }
];

async function standardizeUsers() {
    console.log('🚀 Starting User Standardization...');

    for (const user of USERS) {
        console.log(`\nProcessing: ${user.email} (${user.role})`);

        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) {
            console.error('Error listing users:', listError);
            continue;
        }

        const existingUser = users.find(u => u.email === user.email);
        let userId = existingUser?.id;

        if (existingUser) {
            console.log(`User exists (ID: ${existingUser.id}). Updating password...`);
            const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
                password: user.password,
                user_metadata: { role: user.role, first_name: user.firstName, last_name: user.lastName }
            });
            if (updateError) console.error('Error updating auth:', updateError.message);
        } else {
            console.log('User does not exist. Creating...');
            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                email: user.email,
                password: user.password,
                email_confirm: true,
                user_metadata: { role: user.role, first_name: user.firstName, last_name: user.lastName }
            });
            if (createError) {
                console.error('Error creating user:', createError.message);
                continue;
            }
            userId = newUser.user.id;
        }

        if (userId) {
            console.log('Updating public profile...');
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    role: user.role,
                    contact_email: user.email,
                    first_name: user.firstName,
                    last_name: user.lastName,
                    username: `${user.role}.east`,
                    bio: user.bio,
                    avatar_url: `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=random`
                });

            if (profileError) console.error('Error updating profile:', profileError.message);
            else console.log('✅ Profile updated.');
        }
    }

    console.log('\n✨ Standardization Complete.');
}

standardizeUsers().catch(console.error);
