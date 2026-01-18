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

async function checkCheckConstraints() {
    const pool = getDbPool();
    const client = await pool.connect();
    try {
        console.log("--- CHECK CONSTRAINTS ---");
        const res = await client.query(`
            SELECT 
                conname, 
                consrc 
            FROM 
                pg_constraint 
            WHERE 
                contype = 'c';
        `);
        console.table(res.rows);
    } catch (e) {
        // Fallback for newer Postgres where consrc is missing
        const res = await client.query(`
            SELECT 
                conname, 
                pg_get_constraintdef(oid) as condef
            FROM 
                pg_constraint 
            WHERE 
                contype = 'c';
        `);
        console.table(res.rows);
    } finally {
        client.release();
        await pool.end();
    }
}

checkCheckConstraints();
