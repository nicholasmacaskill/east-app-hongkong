import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import getDbPool from '../../app/lib/db';

async function runMigration() {
    console.log('🏗️ Adding credit_cost to session_types table...');

    const pool = getDbPool();
    const client = await pool.connect();

    try {
        console.log('1. Adding column credit_cost...');
        try {
            await client.query(`ALTER TABLE public.session_types ADD COLUMN credit_cost INTEGER DEFAULT 100;`);
            console.log('✅ Column credit_cost added.');
        } catch (e: any) {
            if (e.code === '42701') {
                console.log('Column already exists.');
            } else {
                throw e;
            }
        }

        console.log('✅ Migration successful: session_types table updated.');

    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
