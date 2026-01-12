import getDbPool from '../app/lib/db';
import fs from 'fs';
import path from 'path';

// Helper to load .env.local if not loaded automatically
try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join('=').trim().replace(/(^"|"$)/g, '');
                if (key && !key.startsWith('#')) {
                    process.env[key] = value;
                }
            }
        });
    }
} catch (e) {
    console.error("Failed to load .env.local", e);
}

async function runMigration() {
    console.log('Running Session Types Migration...');

    const pool = getDbPool();
    const client = await pool.connect();

    try {
        const sqlPath = path.join(process.cwd(), 'database', 'add_session_types.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log(`Executing SQL from ${sqlPath}...`);
        await client.query(sql);

        console.log('✅ Migration successful: session_types and coach_services tables created.');
    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
