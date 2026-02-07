
const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkCancelled() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('--- CANCELLED REGISTRATIONS DETAILS ---');
        const res = await pool.query(`
            SELECT r.id, r.user_id, r.session_id, r.status, s.title, s.start_time, r.registered_at
            FROM registrations r
            JOIN sessions s ON r.session_id = s.id
            WHERE r.status = 'cancelled'
            ORDER BY r.registered_at DESC;
        `);
        console.table(res.rows);

        // Also check if any of these match our test user's ID
        const testUserEmail = 'penalty-verify-1770238636132@example.com';
        const userRes = await pool.query('SELECT id FROM profiles WHERE contact_email = $1', [testUserEmail]);
        if (userRes.rows.length > 0) {
            const userId = userRes.rows[0].id;
            console.log(`\n--- ALL REGISTRATIONS FOR TEST USER (${userId}) ---`);
            const userRegs = await pool.query(`
                SELECT r.id, r.session_id, r.status, s.title, s.start_time
                FROM registrations r
                JOIN sessions s ON r.session_id = s.id
                WHERE r.user_id = $1
                ORDER BY s.start_time ASC;
            `, [userId]);
            console.table(userRegs.rows);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkCancelled();
