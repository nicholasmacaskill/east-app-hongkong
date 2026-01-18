import getDbPool from '../app/lib/db';

const run = async () => {
    const pool = getDbPool();
    const client = await pool.connect();
    try {
        console.log('Deep cleaning player@east.com...');

        // 1. Delete profiles (by email) and any linked data if cascades aren't set
        await client.query(`DELETE FROM public.profiles WHERE contact_email = 'player@east.com'`);

        // 2. Delete auth users
        await client.query(`DELETE FROM auth.users WHERE email = 'player@east.com'`);

        console.log('✅ Cleaned.');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        client.release();
        await pool.end();
    }
};

run();
