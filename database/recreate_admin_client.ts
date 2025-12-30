import { createClient } from '@supabase/supabase-js';
import getDbPool from '../app/lib/db';
import fs from 'fs';
import path from 'path';

const ADMIN_EMAIL = 'admin@east.com';
const ADMIN_PASSWORD = 'password123';
const ADMIN_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

// Manual .env parser since dotenv might not be available
function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        const envFile = fs.readFileSync(envPath, 'utf8');
        const envVars: Record<string, string> = {};
        envFile.split('\n').forEach(line => {
            const [key, val] = line.split('=');
            if (key && val) {
                envVars[key.trim()] = val.trim().replace(/"/g, '');
            }
        });
        return envVars;
    } catch (e) {
        console.error('Failed to load .env.local', e);
        return {};
    }
}

async function recreateAdmin() {
    const env = loadEnv();
    const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
    const supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Missing Supabase keys in .env.local');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const pool = getDbPool();
    const client = await pool.connect();

    try {
        console.log('🧹 Cleaning up old admin records...');
        // 1. Delete existing records
        await client.query('DELETE FROM auth.identities WHERE user_id = $1::uuid OR identity_data->>\'email\' = $2::text', [ADMIN_ID, ADMIN_EMAIL]);
        await client.query('DELETE FROM public.profiles WHERE id = $1::uuid', [ADMIN_ID]);
        await client.query('DELETE FROM auth.users WHERE id = $1::uuid OR email = $2::text', [ADMIN_ID, ADMIN_EMAIL]);

        console.log('🆕 Creating user via Supabase Client...');
        // 2. SignUp via Client (Handles Hashing Correctly)
        const { data, error } = await supabase.auth.signUp({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            options: {
                data: {
                    role: 'admin', // This might be ignored by RLS/Trigger but passes metadata
                }
            }
        });

        if (error) {
            console.error('❌ Supabase SignUp Failed:', error.message);
            // It might indicate rate limits or that the cleanup didn't propagate fast enough
        } else if (data.user) {
            console.log('✅ User created successfully via API!', data.user.id);

            // 3. Force update the ID to our fixed ID (Optional, but good for consistency)
            // Note: Changing UUIDs in auth.users is risky triggers.
            // Let's just USE the ID that Supabase gave us for the profile update.
            const newUserId = data.user.id;

            console.log('👑 Promoting user to Admin role in DB...');
            // 4. Update Profile Role
            await client.query(`
                INSERT INTO public.profiles (id, contact_email, first_name, last_name, username, avatar_url, role)
                VALUES ($1::uuid, $2::text, 'Admin', 'User', 'admin.east', 'https://placehold.co/100', 'admin')
                ON CONFLICT (id) DO UPDATE SET role = 'admin';
            `, [newUserId, ADMIN_EMAIL]);

            console.log('🎉 Admin Fixed!');
            console.log(`Email: ${ADMIN_EMAIL}`);
            console.log(`Password: ${ADMIN_PASSWORD}`);
        }

    } catch (err) {
        console.error('❌ Unexpected Error:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

recreateAdmin();
