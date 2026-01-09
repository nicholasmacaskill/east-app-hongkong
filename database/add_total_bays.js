const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
try {
    const envPath = path.resolve(__dirname, '..', '.env.local');
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

const pool = new Pool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'postgres',
    port: parseInt(process.env.DB_PORT || '54322', 10),
});

async function run() {
    console.log("Connecting to:", {
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT || '54322', 10),
        database: process.env.DB_NAME || 'postgres'
    });

    console.log("Adding total_facility_bays to sessions...");
    const client = await pool.connect();
    try {
        await client.query(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'total_facility_bays') THEN
                    ALTER TABLE sessions ADD COLUMN total_facility_bays integer DEFAULT 0;
                    RAISE NOTICE 'Added total_facility_bays to sessions';
                END IF;
            END $$;
        `);
        console.log("✅ Success");
    } catch (e) {
        console.error("❌ Failed", e.message);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
