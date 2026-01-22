import getDbPool from '../app/lib/db';

async function checkRLS() {
    const pool = getDbPool();
    const client = await pool.connect();
    try {
        const { rows } = await client.query(`
            SELECT tablename, rowsecurity 
            FROM pg_tables 
            WHERE schemaname = 'public' AND tablename = 'session_types'
        `);
        console.log('RLS Status:', rows);

        const { rows: policies } = await client.query(`
            SELECT * FROM pg_policies WHERE tablename = 'session_types'
        `);
        console.log('Policies:', policies);
    } finally {
        client.release();
        await pool.end();
    }
}

checkRLS();
