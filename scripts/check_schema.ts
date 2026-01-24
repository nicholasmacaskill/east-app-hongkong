
// Load env vars
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

import getDbPool from '../app/lib/db';

async function checkSchema() {
    const pool = getDbPool();
    const client = await pool.connect();
    try {
        console.log("Checking 'availability' table columns:");

        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'availability';
        `);

        console.table(res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        await pool.end();
    }
}

checkSchema();
