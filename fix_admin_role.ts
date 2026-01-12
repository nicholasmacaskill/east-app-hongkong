import getDbPool from './app/lib/db';

(async () => {
    const pool = getDbPool();
    const client = await pool.connect();

    const userId = 'b328b684-5e6c-4566-b54e-67f2c1b89498'; // From create_admin_final.ts
    const email = 'testadmin@east.com';

    try {
        console.log('🔄 Checking and fixing admin profile...\n');

        // Check if profile exists
        const { rows: existing } = await client.query(
            'SELECT id, role FROM profiles WHERE id = $1',
            [userId]
        );

        if (existing.length > 0) {
            console.log(`Found existing profile with role: ${existing[0].role}`);
            console.log('Updating to sys-admin...');

            // Update existing profile to sys-admin
            await client.query(
                'UPDATE profiles SET role = $1 WHERE id = $2',
                ['sys-admin', userId]
            );

            console.log('✅ Profile updated to sys-admin');
        } else {
            console.log('No profile found, creating new one...');

            // Try to insert without foreign key (maybe it will work now)
            try {
                await client.query(`
                    INSERT INTO profiles (id, first_name, last_name, username, contact_email, role, credits)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                `, [userId, 'Test', 'Admin', 'testadmin', email, 'sys-admin', 0]);

                console.log('✅ Profile created with sys-admin role');
            } catch (insertError: any) {
                console.error('❌ Could not create profile:', insertError.message);
                console.log('\nPlease manually update the role in Supabase Dashboard:');
                console.log('1. Go to Table Editor → profiles');
                console.log(`2. Find user ID: ${userId}`);
                console.log('3. Set role to: sys-admin');
            }
        }

        console.log('\n🎉 Done! Log out and log back in to see the admin panel.');

    } catch (err: any) {
        console.error('❌ Error:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
})();
