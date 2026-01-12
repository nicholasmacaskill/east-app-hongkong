import getDbPool from './app/lib/db';

(async () => {
    const pool = getDbPool();
    const client = await pool.connect();

    const userId = '839ce067-00da-45e1-9c9a-823302b54ea8';
    const email = 'admin@test.com';
    const password = 'admin123';

    try {
        console.log('🔄 Creating profile for existing auth user...\n');

        // Insert profile directly (the auth user already exists)
        await client.query(`
            INSERT INTO profiles (id, first_name, last_name, username, contact_email, role, credits)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (id) DO UPDATE
            SET role = 'sys-admin',
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name
        `, [userId, 'Admin', 'User', 'admin', email, 'sys-admin', 0]);

        console.log('✅ Profile created successfully!\n');
        console.log('🎉 Admin account ready!\n');
        console.log('📧 Email:', email);
        console.log('🔑 Password:', password);
        console.log('\nYou can now log in with these credentials.');

    } catch (err: any) {
        console.error('❌ Error:', err.message);
        console.error('\nDetails:', err);
    } finally {
        client.release();
        await pool.end();
    }
})();
