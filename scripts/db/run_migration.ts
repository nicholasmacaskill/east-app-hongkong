
import getDbPool from '../../app/lib/db';
import fs from 'fs';
import path from 'path';

async function runMigration() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error('❌ Please provide a SQL file path.');
        process.exit(1);
    }

    const filePath = args[0];
    const fullPath = path.resolve(process.cwd(), filePath);

    if (!fs.existsSync(fullPath)) {
        console.error(`❌ File not found: ${fullPath}`);
        process.exit(1);
    }

    const sqlContent = fs.readFileSync(fullPath, 'utf-8');
    console.log(`🚀 Executing migration: ${filePath}`);

    const pool = getDbPool();
    const client = await pool.connect();

    try {
        await client.query(sqlContent);
        console.log('✅ Migration executed successfully.');
    } catch (e) {
        console.error('❌ Migration failed:', e);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
