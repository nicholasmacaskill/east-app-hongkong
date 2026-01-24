
// Load env vars
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

import getDbPool from '../../app/lib/db';

async function migrate() {
    const pool = getDbPool();
    const client = await pool.connect();
    try {
        console.log("Backfilling NULL facility_category to 'General'...");

        // Update query
        const res = await client.query(`
            UPDATE availability 
            SET facility_category = 'General' 
            WHERE facility_category IS NULL;
        `);

        console.log(`Updated ${res.rowCount} rows.`);
        console.log("Migration complete.");
    } catch (e) {
        console.error("Migration Failed:", e);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
