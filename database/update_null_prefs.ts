
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

// Manual env load
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
    console.log("Could not read .env.local");
}

async function updateNulls() {
    const dbPort = process.env.DB_PORT || '54322';
    const config = {
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'postgres',
        port: parseInt(dbPort, 10),
    };

    const pool = new Pool(config);

    try {
        console.log("Updating NULL preferences to empty objects...");
        await pool.query("UPDATE profiles SET preferences = '{}'::jsonb WHERE preferences IS NULL;");
        console.log("✅ Update successful.");
    } catch (err: any) {
        console.error("❌ Update failed:", err.message);
    } finally {
        await pool.end();
    }
}

updateNulls();
