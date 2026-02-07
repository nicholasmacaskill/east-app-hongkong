
const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkStatus() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('--- SESSIONS STATUS COUNTS ---');
        const sessRes = await pool.query(`
            SELECT status, count(*) 
            FROM sessions 
            GROUP BY status;
        `);
        console.table(sessRes.rows);

        console.log('\n--- REGISTRATIONS STATUS COUNTS ---');
        const regRes = await pool.query(`
            SELECT status, count(*) 
            FROM registrations 
            GROUP BY status;
        `);
        console.table(regRes.rows);

        console.log('\n--- RECENT SESSIONS ---');
        const recentSess = await pool.query(`
            SELECT id, title, start_time, status 
            FROM sessions 
            ORDER BY start_time DESC 
            LIMIT 5;
        `);
        console.table(recentSess.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkStatus();
