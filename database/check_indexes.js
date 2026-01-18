const { Pool } = require('pg');

const getDbPool = () => {
    return new Pool({
        host: 'aws-0-us-west-2.pooler.supabase.com',
        port: 6543,
        user: 'postgres.hxbsnplotkiohcbmvsjf',
        password: 'Uninsured5-Unissued6-Happier7-Dripping1-Bubbling8',
        database: 'postgres',
        ssl: {
            rejectUnauthorized: false
        }
    });
};

async function checkIndexes() {
    const pool = getDbPool();
    const client = await pool.connect();
    try {
        console.log("--- INDEX CHECK ---");
        const res = await client.query(`
            SELECT
                tablename,
                indexname,
                indexdef
            FROM
                pg_indexes
            WHERE
                schemaname = 'public'
            ORDER BY
                tablename,
                indexname;
        `);
        console.table(res.rows);
    } catch (e) {
        console.error("❌ Index Check Failed:", e);
    } finally {
        client.release();
        await pool.end();
    }
}

checkIndexes();
