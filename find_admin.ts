import getDbPool from './app/lib/db';

(async () => {
    const pool = getDbPool();
    const client = await pool.connect();

    try {
        console.log('🔍 Checking for admin user...\n');

        const { rows } = await client.query(`
            SELECT id, first_name, last_name, username, contact_email, role 
            FROM profiles 
            WHERE role = 'sys-admin' OR contact_email = 'admin@east.com'
            LIMIT 5
        `);

        if (rows.length === 0) {
            console.log('❌ No admin users found in profiles table.');
        } else {
            console.log('✅ Found admin user(s):\n');
            rows.forEach((row, i) => {
                console.log(`${i + 1}. ${row.first_name} ${row.last_name}`);
                console.log(`   Email: ${row.contact_email}`);
                console.log(`   Username: ${row.username}`);
                console.log(`   Role: ${row.role}`);
                console.log(`   ID: ${row.id}\n`);
            });

            console.log('📝 To reset the password:');
            console.log('1. Go to your Supabase Dashboard');
            console.log('2. Navigate to Authentication → Users');
            console.log(`3. Find the user: ${rows[0].contact_email}`);
            console.log('4. Click the "..." menu → "Reset Password"');
            console.log('5. Or manually set a new password in the dashboard\n');

            console.log('💡 Alternative: Use the "Forgot Password" link on the login page');
        }

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
})();
