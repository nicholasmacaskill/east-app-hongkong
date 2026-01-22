import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import getDbPool from '../app/lib/db';

async function restoreTables() {
    const pool = getDbPool();
    const client = await pool.connect();
    try {
        console.log('📖 Reading schema.sql...');
        const schemaPath = path.resolve(__dirname, 'schema.sql');
        const schemaContent = fs.readFileSync(schemaPath, 'utf8');

        console.log('🔨 Applying schema to live database...');
        // Split by semicolon but handle potential single-line edge cases (rough split)
        // Better: just run the whole blob
        await client.query(schemaContent);
        console.log('✅ Schema application successful!');
    } catch (err) {
        console.error('❌ Error restoring tables:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

restoreTables();
