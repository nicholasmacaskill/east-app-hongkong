import getDbPool from './app/lib/db';

(async () => {
    const pool = getDbPool();
    const client = await pool.connect();

    const adminId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

    try {
        console.log('🔄 Updating existing admin role...\n');

        await client.query(
            'UPDATE profiles SET role = $1 WHERE id = $2',
            ['sys-admin', adminId]
        );

        console.log('✅ Role updated to sys-admin!\n');
        console.log('📧 Email: admin@east.com');
        console.log('🔑 Password: (use password reset if needed)');
        console.log('\nThe admin@east.com account now has sys-admin access.');
        console.log('Use the "Forgot Password" link to reset the password.');

    } catch (err: any) {
        console.error('❌ Error:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
})();
