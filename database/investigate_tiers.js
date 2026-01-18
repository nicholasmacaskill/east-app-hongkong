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

async function investigateTierValues() {
    const pool = getDbPool();
    const client = await pool.connect();

    try {
        console.log("🔍 INVESTIGATING TIER VALUES");
        console.log("=".repeat(60));

        // Check unique tier values
        const tierCheck = await client.query(`
            SELECT tier, COUNT(*) as count
            FROM profiles
            GROUP BY tier
            ORDER BY count DESC
        `);

        console.log("\nCurrent tier values in profiles:");
        console.table(tierCheck.rows);

        // Check for NULL or empty tiers
        const nullCheck = await client.query(`
            SELECT COUNT(*) as count
            FROM profiles
            WHERE tier IS NULL OR tier = ''
        `);
        console.log(`\nNULL or empty tiers: ${nullCheck.rows[0].count}`);

    } catch (e) {
        console.error("❌ Investigation failed:", e);
    } finally {
        client.release();
        await pool.end();
    }
}

investigateTierValues();
