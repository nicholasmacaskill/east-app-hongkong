import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkTodaySessions() {
    console.log("🔍 Checking sessions for 2026-01-28...");
    const client = await pool.connect();
    try {
        const res = await client.query(`
            SELECT id, title, instructor, start_time, end_time, session_type_id 
            FROM sessions 
            WHERE start_time::date = '2026-01-28'
            ORDER BY start_time ASC;
        `);
        console.table(res.rows);

        const coachRes = await client.query("SELECT id, first_name, last_name, length(first_name) as f_len, length(last_name) as l_len FROM profiles WHERE role = 'coach';");
        console.log("Coach Profiles:");
        console.table(coachRes.rows);

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        await pool.end();
    }
}

checkTodaySessions();
