
import getDbPool from './app/lib/db';
import { Pool } from 'pg';

// Test Parent Configuration
const PARENT_USER_ID = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';

const run = async () => {
    const pool = getDbPool();
    const client = await pool.connect();

    try {
        console.log("🚀 Starting parent user seed...");

        // 1. Insert PARENT user into auth.users
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
                'parent@example.com', 
                crypt('password123', gen_salt('bf')), 
                current_timestamp, current_timestamp, current_timestamp, 
                '{"provider":"email","providers":["email"]}', 
                '{"role":"parent"}', 
                current_timestamp, current_timestamp, 
                '', '', '', ''
            )
            ON CONFLICT (id) DO UPDATE SET 
                email = EXCLUDED.email,
                encrypted_password = EXCLUDED.encrypted_password,
                raw_user_meta_data = EXCLUDED.raw_user_meta_data,
                email_confirmed_at = EXCLUDED.email_confirmed_at;
        `, [PARENT_USER_ID]);
        console.log("✅ Parent user inserted/updated in auth.users");

        // 2. Upsert Parent Profile
        await client.query(`
            INSERT INTO profiles(id, username, first_name, last_name, mobile, contact_email, bio, avatar_url, role)
            VALUES($1, 'parentuser', 'Hockey', 'Mom', '+1000000000', 'parent@example.com', 'Devoted Hockey Parent', '', 'parent')
            ON CONFLICT (id) DO UPDATE SET role = 'parent', first_name = 'Hockey', last_name = 'Mom';
        `, [PARENT_USER_ID]);
        console.log("✅ Parent profile ensured.");

        // 3. Create identity for Auth
        const identityData = JSON.stringify({ sub: PARENT_USER_ID, email: 'parent@example.com' });
        await client.query(`
            INSERT INTO auth.identities(id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
            VALUES(gen_random_uuid(), $1, $2::jsonb, 'email', 'parent@example.com', current_timestamp, current_timestamp, current_timestamp)
             ON CONFLICT (provider_id, provider) DO NOTHING;
        `, [PARENT_USER_ID, identityData]);
        console.log("✅ Auth identity created.");

    } catch (e) {
        console.error("❌ Seeding failed:", e);
    } finally {
        client.release();
        await pool.end();
        console.log("🏁 Done.");
    }
};

run();
