import getDbPool from './app/lib/db';

const run = async () => {
    const pool = getDbPool();
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT email, role FROM auth.users ORDER BY email');
        console.log('Users in database:');
        res.rows.forEach((row: any) => console.log(`  - ${row.email} (role: ${row.role})`));
    } finally {
        client.release();
        await pool.end();
    }
};

run();
