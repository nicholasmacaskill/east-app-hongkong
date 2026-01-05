const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const getDbPool = () => {
    return new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '54322', 10),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'postgres',
    });
};

(async () => {
    const pool = getDbPool();
    const client = await pool.connect();
    try {
        console.log("🔧 Fixing Profiles Select Policy...");

        const sqlPath = path.join(__dirname, 'fix_profiles_select.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await client.query(sql);

        console.log("✅ Success: Profiles are now definitely selectable.");
    } catch (e) {
        console.error("❌ Fix Failed:", e);
    } finally {
        client.release();
        await pool.end();
    }
})();
