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
    host: 'aws-1-us-east-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.lzqnviblkcnjsxutqeht',
    password: 'FNjB8Ca3Ar0Yg816mY%9',
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    try {
        await client.connect();
        console.log('--- Connected to DB. Starting Session Drills Schema Setup ---');

        const sql = `
            CREATE TABLE IF NOT EXISTS public.session_drills (
                id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
                session_id bigint REFERENCES public.sessions(id) ON DELETE CASCADE,
                drill_id uuid REFERENCES public.coach_drills(id) ON DELETE CASCADE,
                order_index integer DEFAULT 0,
                created_at timestamp with time zone DEFAULT now()
            );

            -- Add RLS Policies
            ALTER TABLE public.session_drills ENABLE ROW LEVEL SECURITY;

            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT FROM pg_policies WHERE tablename = 'session_drills' AND policyname = 'Anyone can view session drills'
                ) THEN
                    CREATE POLICY "Anyone can view session drills" ON public.session_drills FOR SELECT USING (true);
                END IF;

                IF NOT EXISTS (
                    SELECT FROM pg_policies WHERE tablename = 'session_drills' AND policyname = 'Coaches and Admins can manage session drills'
                ) THEN
                    CREATE POLICY "Coaches and Admins can manage session drills" ON public.session_drills 
                    FOR ALL 
                    USING (
                        EXISTS (
                            SELECT 1 FROM public.profiles 
                            WHERE profiles.id = auth.uid() 
                            AND profiles.role IN ('coach', 'admin', 'sys-admin')
                        )
                    );
                END IF;
            END $$;

            -- Grants
            GRANT ALL ON public.session_drills TO service_role;
            GRANT SELECT ON public.session_drills TO authenticated;
            GRANT INSERT, UPDATE, DELETE ON public.session_drills TO authenticated;
        `;

        await client.query(sql);
        console.log('✅ Successfully created session_drills table.');

    } catch (e) {
        console.error('❌ Migration failed:', e);
    } finally {
        await client.end();
    }
}

runMigration();
