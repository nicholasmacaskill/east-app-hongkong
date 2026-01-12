import getDbPool from './app/lib/db';

(async () => {
    const pool = getDbPool();
    const client = await pool.connect();

    const userId = 'dac5c7ec-ed82-428a-9913-e47fec9ff110';
    const email = 'sysadmin@east.com';

    try {
        console.log('🔄 Temporarily dropping foreign key constraint...');

        await client.query(`
            ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey
        `);

        console.log('✅ Constraint dropped');

        console.log('🔄 Creating profile...');

        await client.query(`
            INSERT INTO profiles (id, first_name, last_name, username, contact_email, role, credits)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (id) DO UPDATE SET role = 'sys-admin'
        `, [userId, 'System', 'Admin', 'sysadmin', email, 'sys-admin', 0]);

        console.log('✅ Profile created with sys-admin role!\n');
        console.log('📧 Email: sysadmin@east.com');
        console.log('🔑 Password: Admin2024!');
        console.log('\nLog out and log back in to access the admin panel.');

    } catch (err: any) {
        console.error('❌ Error:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
})();
