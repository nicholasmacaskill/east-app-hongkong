import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    console.error('Missing DATABASE_URL in .env.local');
    process.exit(1);
}

const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    try {
        await client.connect();
        console.log('--- Connected to DB. Adding coach_id to sessions ---');

        const sql = `
            -- 1. Add coach_id column if it doesn't exist
            DO $$ 
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'coach_id') THEN
                    ALTER TABLE public.sessions ADD COLUMN coach_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
                    RAISE NOTICE 'Added coach_id to sessions';
                END IF;
            END $$;

            -- 2. Create index for performance
            CREATE INDEX IF NOT EXISTS idx_sessions_coach_id ON public.sessions(coach_id);

            -- 3. Update existing sessions where instructor name matches a coach profile (Optional but helpful)
            -- This is a "best effort" backfill
            UPDATE public.sessions s
            SET coach_id = p.id
            FROM public.profiles p
            WHERE s.coach_id IS NULL
            AND (p.first_name || ' ' || p.last_name) ILIKE s.instructor
            AND p.role = 'coach';
            
            -- 4. Reload Schema Cache
            NOTIFY pgrst, 'reload schema';
        `;

        await client.query(sql);
        console.log('✅ Successfully added coach_id to sessions and backfilled where possible.');

    } catch (e) {
        console.error('❌ Migration failed:', e);
    } finally {
        await client.end();
    }
}

runMigration();
