import getDbPool from '../../app/lib/db';
import path from 'path';

async function runMigration() {
    console.log('🏗️ Adding session_type_id to sessions table...');

    const pool = getDbPool();
    const client = await pool.connect();

    try {
        // 1. Add Column
        console.log('1. Adding column session_type_id...');
        try {
            await client.query(`ALTER TABLE public.sessions ADD COLUMN session_type_id UUID;`);
        } catch (e: any) {
            if (e.code === '42701') {
                console.log('Column already exists.');
            } else {
                throw e;
            }
        }

        // 2. Add Foreign Key
        console.log('2. Adding foreign key constraint...');
        try {
            await client.query(`
                ALTER TABLE public.sessions 
                ADD CONSTRAINT fk_session_type 
                FOREIGN KEY (session_type_id) 
                REFERENCES public.session_types(id) 
                ON DELETE SET NULL;
            `);
        } catch (e: any) {
            if (e.code === '42710') {
                console.log('Constraint already exists.');
            } else {
                throw e;
            }
        }

        console.log('✅ Migration successful: sessions table updated.');

    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
