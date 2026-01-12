import getDbPool from './app/lib/db';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

(async () => {
    const email = 'admin@test.com';
    const password = 'admin123';
    const firstName = 'Admin';
    const lastName = 'User';

    try {
        console.log('🔄 Creating new admin account...\n');

        // 1. Create Auth User
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: {
                first_name: firstName,
                last_name: lastName,
                role: 'sys-admin'
            }
        });

        if (authError) {
            console.error('❌ Auth Error:', authError.message);
            process.exit(1);
        }

        console.log('✅ Auth user created:', authData.user.id);

        // 2. Create Profile
        const pool = getDbPool();
        const client = await pool.connect();

        try {
            await client.query(`
                INSERT INTO profiles (id, first_name, last_name, username, contact_email, role, credits)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (id) DO UPDATE
                SET role = 'sys-admin'
            `, [authData.user.id, firstName, lastName, email.split('@')[0], email, 'sys-admin', 0]);

            console.log('✅ Profile created\n');

        } finally {
            client.release();
            await pool.end();
        }

        console.log('🎉 New admin account ready!\n');
        console.log('📧 Email:', email);
        console.log('🔑 Password:', password);
        console.log('\nYou can now log in with these credentials.');

    } catch (err: any) {
        console.error('❌ Failed:', err.message);
        process.exit(1);
    }
})();
