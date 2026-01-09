import getDbPool from '../app/lib/db';

async function migrate() {
    console.log('--- SESSION SCHEMA PATCH ---');
    const pool = getDbPool();
    const client = await pool.connect();

    try {
        console.log('Checking for total_facility_bays column...');
        await client.query(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'total_facility_bays') THEN
                    ALTER TABLE sessions ADD COLUMN total_facility_bays integer DEFAULT 0;
                    RAISE NOTICE 'Added total_facility_bays to sessions';
                END IF;
            END $$;
        `);
        console.log('✅ total_facility_bays check complete.');

        console.log('Checking for credit_cost column (ensuring it exists)...');
        // credit_cost usually exists but let's be safe
        await client.query(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'credit_cost') THEN
                    ALTER TABLE sessions ADD COLUMN credit_cost integer DEFAULT 10;
                    RAISE NOTICE 'Added credit_cost to sessions';
                END IF;
            END $$;
        `);
        console.log('✅ credit_cost check complete.');

    } catch (e) {
        console.error('❌ Migration failed:', e);
    } finally {
        client.release();
        await pool.end();
        console.log('--- MIGRATION FINISHED ---');
    }
}

migrate();
