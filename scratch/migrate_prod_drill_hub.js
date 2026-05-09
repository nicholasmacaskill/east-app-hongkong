const { Client } = require('pg');

// Production database connection from .env.east-app-hk.prod
// DATABASE_URL from .env.local = postgresql://postgres:[Oak7-Gloomily7-Nearness5-Friction9-Shell3]@db.ktlicvvczrlppqkcqedv.supabase.co:5432/postgres
const client = new Client({
    host: 'aws-0-us-east-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.ktlicvvczrlppqkcqedv',
    password: 'Oak7-Gloomily7-Nearness5-Friction9-Shell3',
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();
        console.log('Connected to PRODUCTION database (ktlicvvczrlppqkcqedv)');

        const sql = `
            -- Create coach_drills table
            CREATE TABLE IF NOT EXISTS public.coach_drills (
                id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
                title text NOT NULL,
                coach_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
                age_tags text[] DEFAULT '{}'::text[],
                level_tags text[] DEFAULT '{}'::text[],
                group_tags text[] DEFAULT '{}'::text[],
                skill_tags text[] DEFAULT '{}'::text[],
                status text DEFAULT 'published',
                thumbnail_url text,
                created_at timestamp with time zone DEFAULT now(),
                updated_at timestamp with time zone DEFAULT now()
            );

            -- Create coach_drill_steps table
            CREATE TABLE IF NOT EXISTS public.coach_drill_steps (
                id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
                drill_id uuid REFERENCES public.coach_drills(id) ON DELETE CASCADE,
                step_order integer NOT NULL,
                title text,
                description text NOT NULL,
                image_url text,
                created_at timestamp with time zone DEFAULT now()
            );

            -- Enable RLS
            ALTER TABLE public.coach_drills ENABLE ROW LEVEL SECURITY;
            ALTER TABLE public.coach_drill_steps ENABLE ROW LEVEL SECURITY;

            -- RLS Policies
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'coach_drills' AND policyname = 'Anyone can view published drills') THEN
                    CREATE POLICY "Anyone can view published drills" ON public.coach_drills FOR SELECT USING (true);
                END IF;
                IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'coach_drills' AND policyname = 'Coaches can manage their drills') THEN
                    CREATE POLICY "Coaches can manage their drills" ON public.coach_drills FOR ALL USING (auth.uid() = coach_id);
                END IF;
                IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'coach_drill_steps' AND policyname = 'Anyone can view drill steps') THEN
                    CREATE POLICY "Anyone can view drill steps" ON public.coach_drill_steps FOR SELECT USING (true);
                END IF;
                IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'coach_drill_steps' AND policyname = 'Coaches can manage drill steps') THEN
                    CREATE POLICY "Coaches can manage drill steps" ON public.coach_drill_steps FOR ALL USING (
                        EXISTS (SELECT 1 FROM public.coach_drills WHERE id = drill_id AND coach_id = auth.uid())
                    );
                END IF;
            END $$;

            -- Grants
            GRANT ALL ON public.coach_drills TO service_role;
            GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_drills TO authenticated;
            GRANT ALL ON public.coach_drill_steps TO service_role;
            GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_drill_steps TO authenticated;

            -- Reload schema cache
            NOTIFY pgrst, 'reload schema';
        `;

        await client.query(sql);
        console.log('✅ coach_drills and coach_drill_steps ensured in PRODUCTION database');
        console.log('✅ RLS policies applied');
        console.log('✅ Schema cache reloaded');
    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        await client.end();
    }
}

run();
