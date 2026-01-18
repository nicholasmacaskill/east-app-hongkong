
import getDbPool from '../app/lib/db';
import { Pool } from 'pg';

// Test User Configuration
const ADMIN_USER_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
const COACH_USER_ID = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';

const run = async () => {
    const pool = getDbPool();
    const client = await pool.connect();

    try {
        console.log("🚀 Starting database seed...");

        // 1. Insert ADMIN user into auth.users (Confirmed Email)
        await client.query(`
            INSERT INTO auth.users(
                instance_id, id, aud, role, email, encrypted_password, 
                email_confirmed_at, recovery_sent_at, last_sign_in_at, 
                raw_app_meta_data, raw_user_meta_data, created_at, updated_at, 
                confirmation_token, email_change, email_change_token_new, recovery_token
            ) VALUES (
                '00000000-0000-0000-0000-000000000000', 
                $1, 
                'authenticated', 'authenticated', 
                'testuser@example.com', 
                crypt('password123', gen_salt('bf')), 
                current_timestamp, current_timestamp, current_timestamp, 
                '{"provider":"email","providers":["email"]}', 
                '{"role":"admin"}', 
                current_timestamp, current_timestamp, 
                '', '', '', ''
            )
            ON CONFLICT (id) DO UPDATE SET 
                email = EXCLUDED.email,
                encrypted_password = EXCLUDED.encrypted_password,
                raw_user_meta_data = EXCLUDED.raw_user_meta_data,
                email_confirmed_at = EXCLUDED.email_confirmed_at;
        `, [ADMIN_USER_ID]);
        console.log("✅ Admin user inserted/updated in auth.users");

        // 2. Insert COACH user into auth.users
        await client.query(`
            INSERT INTO auth.users(
                instance_id, id, aud, role, email, encrypted_password, 
                email_confirmed_at, recovery_sent_at, last_sign_in_at, 
                raw_app_meta_data, raw_user_meta_data, created_at, updated_at, 
                confirmation_token, email_change, email_change_token_new, recovery_token
            ) VALUES (
                '00000000-0000-0000-0000-000000000000', 
                $1, 
                'authenticated', 'authenticated', 
                'coach@example.com', 
                crypt('password123', gen_salt('bf')), 
                current_timestamp, current_timestamp, current_timestamp, 
                '{"provider":"email","providers":["email"]}', 
                '{"role":"coach"}', 
                current_timestamp, current_timestamp, 
                '', '', '', ''
            )
            ON CONFLICT (id) DO UPDATE SET 
                email = EXCLUDED.email,
                encrypted_password = EXCLUDED.encrypted_password,
                raw_user_meta_data = EXCLUDED.raw_user_meta_data,
                email_confirmed_at = EXCLUDED.email_confirmed_at;
        `, [COACH_USER_ID]);
        console.log("✅ Coach user inserted/updated in auth.users");

        // 3. Upsert Admin Profile
        await client.query(`
            INSERT INTO profiles(id, username, first_name, last_name, mobile, contact_email, bio, avatar_url, role)
            VALUES($1, 'testadmin', 'Test', 'Admin', '+1000000000', 'testuser@example.com', 'System Admin', '', 'admin')
            ON CONFLICT (id) DO UPDATE SET role = 'admin';
        `, [ADMIN_USER_ID]);
        console.log("✅ Admin profile ensured.");

        // 4. Upsert Coach Profile
        await client.query(`
            INSERT INTO profiles(id, username, first_name, last_name, mobile, contact_email, bio, avatar_url, role)
            VALUES($1, 'coachuser', 'Coach', 'User', '+1000000000', 'coach@example.com', 'Elite Coach', '', 'coach')
            ON CONFLICT (id) DO UPDATE SET role = 'coach', first_name = 'Coach';
        `, [COACH_USER_ID]);
        console.log("✅ Coach profile ensured.");

        // 5. Create a test Session for the Coach (for My Roster)
        // We use 'Coach' as the instructor name to match the profile.first_name for exact match logic
        await client.query(`
            INSERT INTO sessions(title, category, instructor, start_time, end_time, description, credit_cost)
            VALUES (
                'Elite Shooting with Coach User', 
                'PRIVATE', 
                'Coach User', 
                NOW() + interval '1 day',
                NOW() + interval '1 day 1 hour', 
                'Test session for Roster verification', 
                100
            );
        `);
        console.log("✅ Test session created for Coach Roster.");

        // 6. Create identity for Auth (Supabase sometimes requires this for login to work properly)
        await client.query(`
            INSERT INTO auth.identities(id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
            VALUES(gen_random_uuid(), $1, format('{"sub":"%s","email":"%s"}', $1, 'testuser@example.com')::jsonb, 'email', 'testuser@example.com', current_timestamp, current_timestamp, current_timestamp)
             ON CONFLICT (provider_id, provider) DO NOTHING;
        `, [ADMIN_USER_ID]);
        await client.query(`
            INSERT INTO auth.identities(id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
            VALUES(gen_random_uuid(), $1, format('{"sub":"%s","email":"%s"}', $1, 'coach@example.com')::jsonb, 'email', 'coach@example.com', current_timestamp, current_timestamp, current_timestamp)
             ON CONFLICT (provider_id, provider) DO NOTHING;
        `, [COACH_USER_ID]);
        console.log("✅ Auth identities created.");


    } catch (e) {
        console.error("❌ Seeding failed:", e);
    } finally {
        client.release();
        await pool.end();
        console.log("🏁 Done.");
    }
};

run();
