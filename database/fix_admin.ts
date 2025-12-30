import getDbPool from '../app/lib/db';
import { Pool } from 'pg';

const ADMIN_EMAIL = 'admin@east.com';
const ADMIN_PASSWORD = 'password123';
const ADMIN_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

async function fixAdmin() {
    const pool = getDbPool();
    const client = await pool.connect();

    try {
        console.log('🚀 Starting Admin Fix...');

        // 1. Ensure pgcrypto is enabled
        await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');

        // 2. Clear existing user with the same ID or Email to avoid conflicts
        console.log('Cleaning up existing admin records...');
        await client.query('DELETE FROM auth.identities WHERE user_id = $1::uuid OR identity_data->>\'email\' = $2::text', [ADMIN_ID, ADMIN_EMAIL]);
        await client.query('DELETE FROM public.profiles WHERE id = $1::uuid', [ADMIN_ID]);
        await client.query('DELETE FROM auth.users WHERE id = $1::uuid OR email = $2::text', [ADMIN_ID, ADMIN_EMAIL]);

        // 3. Insert new admin user
        console.log('Creating admin user...');
        await client.query(`
            INSERT INTO auth.users(instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
            VALUES('00000000-0000-0000-0000-000000000000', $1::uuid, 'authenticated', 'authenticated', $2::text, crypt($3::text, gen_salt('bf')), current_timestamp, '{"provider":"email","providers":["email"]}', '{}', current_timestamp, current_timestamp)
        `, [ADMIN_ID, ADMIN_EMAIL, ADMIN_PASSWORD]);

        await client.query(`
            INSERT INTO auth.identities(id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
            VALUES($1::uuid, $1::uuid, format('{"sub":"%s","email":"%s"}', $1::text, $2::text)::jsonb, 'email', $2::text, current_timestamp, current_timestamp, current_timestamp)
        `, [ADMIN_ID, ADMIN_EMAIL]);

        // 4. Insert into public.profiles
        console.log('Creating admin profile...');
        await client.query(`
            INSERT INTO public.profiles (id, contact_email, first_name, last_name, username, avatar_url, role)
            VALUES ($1::uuid, $2::text, 'Admin', 'User', 'admin.east', 'https://placehold.co/100', 'admin')
            ON CONFLICT (id) DO UPDATE SET 
                role = 'admin',
                first_name = 'Admin',
                last_name = 'User',
                username = 'admin.east',
                contact_email = $2::text;
        `, [ADMIN_ID, ADMIN_EMAIL]);

        console.log('✅ Admin credentials fixed!');
        console.log(`Email: ${ADMIN_EMAIL}`);
        console.log(`Password: ${ADMIN_PASSWORD}`);

    } catch (err) {
        console.error('❌ Error fixing admin:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

fixAdmin();
