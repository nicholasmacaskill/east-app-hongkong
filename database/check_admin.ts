import getDbPool from '../app/lib/db';

const ADMIN_EMAIL = 'admin@east.com';

async function checkAdminStatus() {
    const pool = getDbPool();
    const client = await pool.connect();

    try {
        console.log('🔍 Checking Admin User Status...');

        // 1. Check auth.users
        const authUser = await client.query('SELECT id, email, role, last_sign_in_at FROM auth.users WHERE email = $1', [ADMIN_EMAIL]);
        if (authUser.rows.length === 0) {
            console.error('❌ User NOT FOUND in auth.users!');
        } else {
            console.log('✅ User FOUND in auth.users:', authUser.rows[0]);
        }

        // 2. Check public.profiles
        const profile = await client.query('SELECT id, role, contact_email, first_name FROM public.profiles WHERE contact_email = $1 OR id = $2', [ADMIN_EMAIL, authUser.rows[0]?.id]);
        if (profile.rows.length === 0) {
            console.error('❌ User NOT FOUND in public.profiles!');
        } else {
            console.log('✅ User FOUND in public.profiles:', profile.rows[0]);
        }

    } catch (err) {
        console.error('❌ Error checking admin status:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

checkAdminStatus();
