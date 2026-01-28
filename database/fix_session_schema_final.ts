import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '.env.local' }); // Try .env.local first
dotenv.config(); // Fallback

const { Pool } = pg;

// DB Config
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function fixSchema() {
    console.log("🛠️ Starting Schema Repair...");
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Check/Add session_type_id
        console.log("Checking session_type_id...");
        await client.query(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'session_type_id') THEN
                    ALTER TABLE public.sessions ADD COLUMN session_type_id UUID REFERENCES public.session_types(id) ON DELETE SET NULL;
                    RAISE NOTICE 'Added session_type_id to sessions';
                ELSE
                    RAISE NOTICE 'session_type_id already exists';
                END IF;
            END $$;
        `);

        // 2. Check/Add max_capacity
        console.log("Checking max_capacity...");
        await client.query(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'max_capacity') THEN
                    ALTER TABLE public.sessions ADD COLUMN max_capacity INTEGER DEFAULT 10;
                    RAISE NOTICE 'Added max_capacity to sessions';
                ELSE
                    RAISE NOTICE 'max_capacity already exists';
                END IF;
            END $$;
        `);

        // 3. Check/Add coach_image_url (often missing)
        console.log("Checking coach_image_url...");
        await client.query(`
           DO $$ 
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'coach_image_url') THEN
                    ALTER TABLE public.sessions ADD COLUMN coach_image_url TEXT;
                    RAISE NOTICE 'Added coach_image_url to sessions';
                ELSE
                    RAISE NOTICE 'coach_image_url already exists';
                END IF;
            END $$;
        `);

        // 4. Force Schema Cache Reload
        console.log("🔄 Reloading Schema Cache...");
        await client.query(`NOTIFY pgrst, 'reload schema';`);

        await client.query('COMMIT');
        console.log("✅ Schema Repair Complete!");

    } catch (e) {
        await client.query('ROLLBACK');
        console.error("❌ Schema Repair Failed:", e);
    } finally {
        client.release();
        await pool.end();
    }
}

fixSchema();
