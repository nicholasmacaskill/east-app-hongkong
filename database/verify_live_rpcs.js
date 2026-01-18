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

async function checkRpc() {
    const pool = getDbPool();
    const client = await pool.connect();
    try {
        console.log("--- RPC VERIFICATION ---");
        const res = await client.query(`
            SELECT 
                p.proname as name,
                pg_get_functiondef(p.oid) as definition
            FROM 
                pg_proc p
            JOIN 
                pg_namespace n ON p.pronamespace = n.oid
            WHERE 
                n.nspname = 'public'
                AND p.proname IN ('book_session_with_credits', 'book_coach_atomic');
        `);
        res.rows.forEach(row => {
            console.log(`\n--- ${row.name} ---\n`);
            console.log(row.definition);
        });
    } catch (e) {
        console.error("❌ RPC Check Failed:", e);
    } finally {
        client.release();
        await pool.end();
    }
}

checkRpc();
