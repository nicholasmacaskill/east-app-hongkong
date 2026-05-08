import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Parse the DATABASE_URL to connect directly
// Supabase pooling URL usually works: 
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.ktlicvvczrlppqkcqedv:Password123!@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    try {
        await client.connect();
        console.log('--- Connected to DB. Creating drills table ---');

        const sql = `
            CREATE TABLE IF NOT EXISTS public.drills (
                id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
                coach_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
                title text NOT NULL,
                description text,
                difficulty text,
                duration text,
                category text,
                video_url text,
                image_url text,
                created_at timestamp with time zone DEFAULT now()
            );

            -- Add RLS Policies
            ALTER TABLE public.drills ENABLE ROW LEVEL SECURITY;

            -- Viewing Drills: Authenticated users can view drills
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT FROM pg_policies WHERE tablename = 'drills' AND policyname = 'Anyone can view drills'
                ) THEN
                    CREATE POLICY "Anyone can view drills" ON public.drills FOR SELECT USING (true);
                END IF;
                
                IF NOT EXISTS (
                    SELECT FROM pg_policies WHERE tablename = 'drills' AND policyname = 'Coaches can insert their own drills'
                ) THEN
                    CREATE POLICY "Coaches can insert their own drills" ON public.drills FOR INSERT WITH CHECK (auth.uid() = coach_id);
                END IF;
            END $$;

            -- Grants
            GRANT ALL ON public.drills TO service_role;
            GRANT SELECT ON public.drills TO authenticated;
            GRANT INSERT ON public.drills TO authenticated;
        `;

        await client.query(sql);
        console.log('✅ Successfully created drills table.');

    } catch (e) {
        console.error('❌ Migration failed:', e);
    } finally {
        await client.end();
    }
}

runMigration();
