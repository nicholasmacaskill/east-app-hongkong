const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
try {
    const envPath = path.resolve(__dirname, '..', '.env.local');
    if (fs.existsSync(envPath)) {
        const envFile = fs.readFileSync(envPath, 'utf8');
        envFile.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                const val = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
                process.env[key.trim()] = val;
            }
        });
        console.log('Loaded .env.local');
    }
} catch (e) {
    console.warn("Warning: Could not read .env.local", e.message);
}

async function migrate() {
    console.log('--- REGISTRATIONS SCHEMA PATCH (JS) ---');

    // Fallback constants if env vars missing (User local dev defaults)
    const config = {
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT || '54322', 10),
        database: process.env.DB_NAME || 'postgres',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres'
    };

    console.log('Connecting with config:', { ...config, password: '***' });

    const pool = new Pool(config);
    const client = await pool.connect();

    try {
        console.log('Checking for credits_paid column in registrations...');
        await client.query(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'registrations' AND column_name = 'credits_paid') THEN
                    ALTER TABLE registrations ADD COLUMN credits_paid integer DEFAULT 0;
                    RAISE NOTICE 'Added credits_paid to registrations';
                END IF;
            END $$;
        `);
        console.log('✅ credits_paid check complete.');

    } catch (e) {
        console.error('❌ Migration failed:', e.message);
    } finally {
        client.release();
        await pool.end();
        console.log('--- MIGRATION FINISHED ---');
    }
}

migrate();
