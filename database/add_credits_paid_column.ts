import getDbPool from '../app/lib/db';

async function migrate() {
    console.log('--- REGISTRATIONS SCHEMA PATCH ---');
    const pool = getDbPool();
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
        console.error('❌ Migration failed:', e);
    } finally {
        client.release();
        await pool.end();
        console.log('--- MIGRATION FINISHED ---');
    }
}

migrate();
