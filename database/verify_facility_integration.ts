
import getDbPool from '../app/lib/db';
import { format, addDays } from 'date-fns';

async function seed() {
    const pool = getDbPool();
    const client = await pool.connect();

    try {
        console.log("Seeding test facility data...");

        const today = new Date();
        const tomorrow = addDays(today, 1);
        const dateStr = format(tomorrow, 'yyyy-MM-dd');

        // 1. Create a Facility Availability Slot (9 AM - 6 PM)
        const startTime = `${dateStr}T09:00:00Z`;
        const endTime = `${dateStr}T18:00:00Z`;

        await client.query(`
            INSERT INTO availability (start_time, end_time, status, facility_category)
            VALUES ($1, $2, 'available', 'General')
        `, [startTime, endTime]);

        console.log("Inserted facility availability.");

        // 2. Create a Session that consumes 2 bays (10 AM - 11 AM)
        const sessionStart = `${dateStr}T10:00:00Z`;
        const sessionEnd = `${dateStr}T11:00:00Z`;

        await client.query(`
            INSERT INTO sessions (title, start_time, end_time, category, total_facility_bays, credit_cost, max_capacity)
            VALUES ($1, $2, $3, 'FACILITY', 2, 10, 4)
        `, ['Test Facility Session', sessionStart, sessionEnd]);

        console.log("Inserted facility session (2 bays).");

        console.log("Verification seed complete. Check the Master Schedule for:", dateStr);

    } catch (e) {
        console.error("Seed failed:", e);
    } finally {
        client.release();
        await pool.end();
    }
}

seed();
