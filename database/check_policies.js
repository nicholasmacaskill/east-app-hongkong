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

async function checkPolicies() {
    const pool = getDbPool();
    const client = await pool.connect();
    try {
        console.log("--- RLS POLICIES ---");
        const res = await client.query(`
            SELECT 
                tablename, 
                policyname, 
                cmd,
                roles,
                qual,
                with_check
            FROM 
                pg_policies 
            WHERE 
                tablename IN ('training_plans', 'training_plan_drills', 'coach_drills')
            ORDER BY 
                tablename;
        `);
        console.table(res.rows);
    } catch (e) {
        console.error("❌ Failed:", e);
    } finally {
        client.release();
        await pool.end();
    }
}

checkPolicies();
