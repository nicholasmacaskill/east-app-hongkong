import getDbPool from './app/lib/db';

(async () => {
    const pool = getDbPool();
    const client = await pool.connect();

    const email = 'testadmin@east.com';

    try {
        console.log('🔍 Searching for profile by email...\n');

        const { rows } = await client.query(
            'SELECT id, first_name, last_name, contact_email, role FROM profiles WHERE contact_email = $1 OR username = $2',
            [email, 'testadmin']
        );

        if (rows.length === 0) {
            console.log('❌ No profile found for', email);
            console.log('\nChecking all recent profiles...');

            const { rows: recent } = await client.query(
                `SELECT id, first_name, last_name, contact_email, username, role, created_at 
                 FROM profiles 
                 ORDER BY created_at DESC 
                 LIMIT 5`
            );

            console.log('\nRecent profiles:');
            recent.forEach((row, i) => {
                console.log(`\n${i + 1}. ${row.first_name} ${row.last_name}`);
                console.log(`   Email: ${row.contact_email}`);
                console.log(`   Username: ${row.username}`);
                console.log(`   Role: ${row.role}`);
                console.log(`   ID: ${row.id}`);
            });

        } else {
            console.log('✅ Found profile:\n');
            const profile = rows[0];
            console.log(`Name: ${profile.first_name} ${profile.last_name}`);
            console.log(`Email: ${profile.contact_email}`);
            console.log(`Current Role: ${profile.role}`);
            console.log(`ID: ${profile.id}`);

            if (profile.role !== 'sys-admin') {
                console.log('\n🔄 Updating role to sys-admin...');
                await client.query(
                    'UPDATE profiles SET role = $1 WHERE id = $2',
                    ['sys-admin', profile.id]
                );
                console.log('✅ Role updated! Log out and log back in.');
            } else {
                console.log('\n✅ Role is already sys-admin!');
            }
        }

    } catch (err: any) {
        console.error('❌ Error:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
})();
