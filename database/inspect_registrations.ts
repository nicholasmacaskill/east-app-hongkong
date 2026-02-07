
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkRegistrations() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('--- TABLE COLUMNS ---');
        const colRes = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'registrations'
            ORDER BY ordinal_position;
        `);
        console.table(colRes.rows);

        console.log('\n--- RECENT REGISTRATIONS (including potentially cancelled) ---');
        const regRes = await pool.query(`
            SELECT r.id, r.user_id, r.session_id, s.title, s.start_time, r.created_at
            FROM registrations r
            JOIN sessions s ON r.session_id = s.id
            ORDER BY r.created_at DESC
            LIMIT 10;
        `);
        console.table(regRes.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkRegistrations();
