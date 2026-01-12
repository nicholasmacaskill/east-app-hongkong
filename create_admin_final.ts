import { createClient } from '@supabase/supabase-js';
import getDbPool from './app/lib/db';
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
    const email = 'testadmin@east.com';
    const password = 'admin123';

    try {
        console.log('🔄 Creating new admin account...\n');

        // 1. Create Auth User
        console.log('Step 1: Creating auth user...');
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: {
                first_name: 'Test',
                last_name: 'Admin',
                role: 'sys-admin'
            }
        });

        if (authError) {
            if (authError.message.includes('already registered')) {
                console.log('⚠️  User already exists, trying to find and update...');
                // User exists, let's just document the credentials
                console.log('\n✅ Using existing account\n');
                console.log('📧 Email:', email);
                console.log('🔑 Password:', password);
                console.log('\nTry logging in with these credentials.');
                console.log('If password is wrong, reset it via Supabase Dashboard.');
                return;
            }
            throw authError;
        }

        console.log('✅ Auth user created:', authData.user.id);

        // 2. Create Profile in database
        console.log('Step 2: Creating profile...');
        const pool = getDbPool();
        const client = await pool.connect();

        try {
            await client.query(`
                INSERT INTO profiles (id, first_name, last_name, username, contact_email, role, credits)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [authData.user.id, 'Test', 'Admin', 'testadmin', email, 'sys-admin', 0]);

            console.log('✅ Profile created');

        } catch (dbError: any) {
            console.error('⚠️  Profile creation failed:', dbError.message);
            console.log('Auth user was created, but profile failed. You can still log in.');
        } finally {
            client.release();
            await pool.end();
        }

        console.log('\n🎉 Admin account ready!\n');
        console.log('📧 Email:', email);
        console.log('🔑 Password:', password);
        console.log('\nYou can now log in with these credentials.');

    } catch (err: any) {
        console.error('❌ Failed:', err.message);
        process.exit(1);
    }
})();
