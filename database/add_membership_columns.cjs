const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function migrate() {
    console.log('🚀 Starting Membership Lifecycle Schema Migration (via pg)...');

    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

    if (!connectionString) {
        throw new Error('❌ Missing POSTGRES_URL or DATABASE_URL in .env.local');
    }

    const pool = new Pool({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
    });

    const client = await pool.connect();

    try {
        // 1. Add membership_start column
        await client.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'membership_start') THEN
                    ALTER TABLE public.profiles ADD COLUMN membership_start timestamp with time zone;
                    RAISE NOTICE 'Added membership_start column';
                END IF;
            END $$;
        `);

        // 2. Add membership_expires column
        await client.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'membership_expires') THEN
                    ALTER TABLE public.profiles ADD COLUMN membership_expires timestamp with time zone;
                    RAISE NOTICE 'Added membership_expires column';
                END IF;
            END $$;
        `);

        // 3. Add membership_history column
        await client.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'membership_history') THEN
                    ALTER TABLE public.profiles ADD COLUMN membership_history jsonb DEFAULT '[]'::jsonb;
                    RAISE NOTICE 'Added membership_history column';
                END IF;
            END $$;
        `);

        console.log('✅ Membership Lifecycle Schema Migration Successful!');
    } catch (err) {
        console.error('❌ Migration Failed:', err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
