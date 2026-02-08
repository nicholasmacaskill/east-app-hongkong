
const { Client } = require('pg');
const path = require('path');
const fs = require('fs');

// Manually parse .env.local
try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            process.env[key.trim()] = valueParts.join('=').trim();
        }
    });
} catch (e) {
    console.warn("Warning: Could not read .env.local", e.message);
}

const connectionString = process.env.DATABASE_URL;

async function seed() {
    const client = new Client({ connectionString });
    await client.connect();

    try {
        console.log("Adding facility_category column if missing...");
        await client.query(`ALTER TABLE availability ADD COLUMN IF NOT EXISTS facility_category text;`);

        console.log("Seeding test facility data via direct PG connection...");

        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];

        // 1. Create a Facility Availability Slot (9 AM - 6 PM HKT)
        const startTime = `${dateStr}T01:00:00Z`; // 9 AM HKT
        const endTime = `${dateStr}T10:00:00Z`;   // 6 PM HKT

        await client.query(`
            INSERT INTO availability (start_time, end_time, status, facility_category)
            VALUES ($1, $2, 'available', 'General')
        `, [startTime, endTime]);

        console.log("✅ Inserted facility availability.");

        // 2. Create a Session that consumes 2 bays (10 AM - 11 AM HKT)
        const sessionStart = `${dateStr}T02:00:00Z`; // 10 AM HKT
        const sessionEnd = `${dateStr}T03:00:00Z`;   // 11 AM HKT

        await client.query(`
            INSERT INTO sessions (title, start_time, end_time, category, total_facility_bays, credit_cost, max_capacity, instructor)
            VALUES ($1, $2, $3, 'FACILITY', 2, 10, 4, 'Facility Staff')
        `, ['Test Facility Session', sessionStart, sessionEnd]);

        console.log("✅ Inserted facility session (2 bays).");

        console.log("Verification seed complete. Check the Master Schedule for:", dateStr);

    } catch (e) {
        console.error("Seed failed:", e);
    } finally {
        await client.end();
    }
}

seed();
