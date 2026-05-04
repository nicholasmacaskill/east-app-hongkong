const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    const client = new Client({
        host: 'aws-1-us-east-1.pooler.supabase.com',
        port: 6543,
        database: 'postgres',
        user: 'postgres.lzqnviblkcnjsxutqeht',
        password: 'FNjB8Ca3Ar0Yg816mY%9',
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to Staging DB via confirmed pooler host.');

        const sql = `
            CREATE TABLE IF NOT EXISTS public.coach_drills (
                id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
                title text NOT NULL,
                coach_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
                age_tags text[] DEFAULT '{}'::text[],
                level_tags text[] DEFAULT '{}'::text[],
                group_tags text[] DEFAULT '{}'::text[],
                skill_tags text[] DEFAULT '{}'::text[],
                status text DEFAULT 'published',
                created_at timestamp with time zone DEFAULT now(),
                updated_at timestamp with time zone DEFAULT now()
            );

            CREATE TABLE IF NOT EXISTS public.coach_drill_steps (
                id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
                drill_id uuid REFERENCES public.coach_drills(id) ON DELETE CASCADE,
                step_order integer NOT NULL,
                title text,
                description text NOT NULL,
                image_url text,
                created_at timestamp with time zone DEFAULT now()
            );

            -- Add RLS Policies
            ALTER TABLE public.coach_drills ENABLE ROW LEVEL SECURITY;
            ALTER TABLE public.coach_drill_steps ENABLE ROW LEVEL SECURITY;

            -- Viewing Drills: Authenticated users can view drills
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT FROM pg_policies WHERE tablename = 'coach_drills' AND policyname = 'Anyone can view published drills'
                ) THEN
                    CREATE POLICY "Anyone can view published drills" ON public.coach_drills FOR SELECT USING (true);
                END IF;

                IF NOT EXISTS (
                    SELECT FROM pg_policies WHERE tablename = 'coach_drill_steps' AND policyname = 'Anyone can view drill steps'
                ) THEN
                    CREATE POLICY "Anyone can view drill steps" ON public.coach_drill_steps FOR SELECT USING (true);
                END IF;
            END $$;

            -- Grants
            GRANT ALL ON public.coach_drills TO service_role;
            GRANT ALL ON public.coach_drill_steps TO service_role;
            GRANT SELECT ON public.coach_drills TO authenticated;
            GRANT SELECT ON public.coach_drill_steps TO authenticated;
        `;

        await client.query(sql);
        console.log('✅ Successfully created coach_drills and coach_drill_steps tables.');

    } catch (e) {
        console.error('❌ Migration failed:', e);
    } finally {
        await client.end();
    }
}

runMigration();
