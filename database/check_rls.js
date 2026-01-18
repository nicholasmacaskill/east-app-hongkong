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

async function checkRLS() {
    const pool = getDbPool();
    const client = await pool.connect();
    try {
        console.log("--- RLS STATUS CHECK ---");
        const res = await client.query(`
            SELECT 
                tablename, 
                rowsecurity 
            FROM 
                pg_tables 
            WHERE 
                schemaname = 'public'
            ORDER BY 
                tablename;
        `);
        console.table(res.rows);
    } catch (e) {
        console.error("❌ RLS Check Failed:", e);
    } finally {
        client.release();
        await pool.end();
    }
}

checkRLS();
