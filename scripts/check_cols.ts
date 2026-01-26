import getDbPool from '../app/lib/db';

(async () => {
    const pool = getDbPool();
    const client = await pool.connect();

    try {
        const res = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'profiles';
        `);
        console.log("Columns in profiles:", res.rows.map(r => r.column_name).join(', '));
    } catch (e) {
        console.error("Error:", e);
    } finally {
        client.release();
        await pool.end();
    }
})();
