import getDbPool from './app/lib/db';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

(async () => {
    const email = 'sysadmin@east.com';

    try {
        // 1. Find the auth user
        console.log('🔍 Finding auth user...');
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const authUser = users.find(u => u.email === email);

        if (!authUser) {
            console.error('❌ Auth user not found');
            process.exit(1);
        }

        console.log('✅ Found auth user:', authUser.id);

        // 2. Check/create profile
        const pool = getDbPool();
        const client = await pool.connect();

        try {
            const { rows } = await client.query(
                'SELECT id, role FROM profiles WHERE id = $1',
                [authUser.id]
            );

            if (rows.length > 0) {
                console.log('Found profile with role:', rows[0].role);

                if (rows[0].role !== 'sys-admin') {
                    console.log('Updating to sys-admin...');
                    await client.query(
                        'UPDATE profiles SET role = $1 WHERE id = $2',
                        ['sys-admin', authUser.id]
                    );
                    console.log('✅ Updated to sys-admin');
                }
            } else {
                console.log('No profile found. Checking schema...');

                // Check if there's a users table that we need to insert into first
                const { rows: tables } = await client.query(`
                    SELECT table_name FROM information_schema.tables 
                    WHERE table_schema = 'public' AND table_name = 'users'
                `);

                if (tables.length > 0) {
                    console.log('Found users table, inserting there first...');
                    await client.query(
                        'INSERT INTO users (id) VALUES ($1) ON CONFLICT (id) DO NOTHING',
                        [authUser.id]
                    );
                }

                console.log('Creating profile...');
                await client.query(`
                    INSERT INTO profiles (id, first_name, last_name, username, contact_email, role, credits)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                `, [authUser.id, 'System', 'Admin', 'sysadmin', email, 'sys-admin', 0]);

                console.log('✅ Profile created');
            }

            console.log('\n✅ All set! Log out and log back in.');
            console.log('📧 Email: sysadmin@east.com');
            console.log('🔑 Password: Admin2024!');

        } finally {
            client.release();
            await pool.end();
        }

    } catch (err: any) {
        console.error('❌ Error:', err.message);
        console.error(err);
    }
})();
