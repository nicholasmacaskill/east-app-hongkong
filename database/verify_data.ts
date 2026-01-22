import getDbPool from '../app/lib/db';

async function checkData() {
    const pool = getDbPool();
    const client = await pool.connect();
    try {
        const { rows } = await client.query('SELECT * FROM public.session_types');
        console.log('Session Types in DB:', rows);
    } finally {
        client.release();
        await pool.end();
    }
}

checkData();
