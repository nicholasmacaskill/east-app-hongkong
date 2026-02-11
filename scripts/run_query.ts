const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function runQuery() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    const sql = fs.readFileSync(path.resolve(__dirname, 'check_constraints_specific.sql'), 'utf8');
    const res = await client.query(sql);
    console.log(JSON.stringify(res.rows, null, 2));

    await client.end();
}

runQuery().catch(console.error);
