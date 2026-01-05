import fs from 'fs';
import path from 'path';

// Load environment variables manually since dotenv is not installed
try {
    const envPath = path.resolve(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        console.log('📄 Found .env.local, parsing...');
        envContent.split('\n').forEach(line => {
            // Match KEY=VALUE, ignoring comments #
            const match = line.match(/^\s*([^#=]+)=(.+)$/);
            if (match) {
                const key = match[1].trim();
                let value = match[2].trim();
                // Remove wrapping quotes if present
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                process.env[key] = value;
            }
        });
    } else {
        console.warn('⚠️ .env.local file not found at:', envPath);
    }
} catch (e) {
    console.warn('⚠️ Could not load .env.local, checking process.env directly.');
}

console.log('🔌 Connecting to DB Host:', process.env.DB_HOST || 'localhost (default)');
console.log('🔌 Connecting to DB Port:', process.env.DB_PORT || '54322 (default)');

async function runMigration() {
    const sqlPath = path.resolve(__dirname, 'protect_sensitive_columns.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('🔒 Applying Column-Level Security to Profiles Table...');

    const { Pool } = require('pg');

    const pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '54322', 10),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'postgres',
    });

    try {
        const client = await pool.connect();
        await client.query(sql);
        console.log('✅ Success: Critical Security Patch Applied. `credits` column is now immutable by client.');
        client.release();
    } catch (err: any) {
        console.error('❌ Migration Failed:', err);
        // Log more details if auth failed
        if (err.code === '28P01') { // invalid_password
            console.error('Check your DB_PASSWORD in .env.local');
        }
    } finally {
        await pool.end();
    }
}

runMigration();
