import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.production.latest') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.production.latest');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    try {
        console.log(`Connecting to production Supabase API: ${supabaseUrl}...`);
        
        const sql = `
            -- 1. Create coach_drills table
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

            -- 2. Create coach_drill_steps table
            CREATE TABLE IF NOT EXISTS public.coach_drill_steps (
                id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
                drill_id uuid REFERENCES public.coach_drills(id) ON DELETE CASCADE,
                step_number integer NOT NULL,
                title text,
                instruction text NOT NULL,
                diagram_url text,
                video_url text,
                created_at timestamp with time zone DEFAULT now()
            );

            -- 3. Create session_drills table
            CREATE TABLE IF NOT EXISTS public.session_drills (
                id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
                session_id bigint REFERENCES public.sessions(id) ON DELETE CASCADE,
                drill_id uuid REFERENCES public.coach_drills(id) ON DELETE CASCADE,
                order_index integer DEFAULT 0,
                created_at timestamp with time zone DEFAULT now()
            );

            -- 4. Enable Row Level Security (RLS)
            ALTER TABLE public.coach_drills ENABLE ROW LEVEL SECURITY;
            ALTER TABLE public.coach_drill_steps ENABLE ROW LEVEL SECURITY;
            ALTER TABLE public.session_drills ENABLE ROW LEVEL SECURITY;

            -- 5. Add RLS Policies
            DO $$ 
            BEGIN
                -- coach_drills policies
                IF NOT EXISTS (
                    SELECT FROM pg_policies WHERE tablename = 'coach_drills' AND policyname = 'Anyone can view published drills'
                ) THEN
                    CREATE POLICY "Anyone can view published drills" ON public.coach_drills FOR SELECT USING (true);
                END IF;

                IF NOT EXISTS (
                    SELECT FROM pg_policies WHERE tablename = 'coach_drills' AND policyname = 'Coaches can manage their drills'
                ) THEN
                    CREATE POLICY "Coaches can manage their drills" ON public.coach_drills 
                    FOR ALL 
                    USING (auth.uid() = coach_id);
                END IF;

                -- coach_drill_steps policies
                IF NOT EXISTS (
                    SELECT FROM pg_policies WHERE tablename = 'coach_drill_steps' AND policyname = 'Anyone can view drill steps'
                ) THEN
                    CREATE POLICY "Anyone can view drill steps" ON public.coach_drill_steps FOR SELECT USING (true);
                END IF;

                IF NOT EXISTS (
                    SELECT FROM pg_policies WHERE tablename = 'coach_drill_steps' AND policyname = 'Coaches can manage drill steps'
                ) THEN
                    CREATE POLICY "Coaches can manage drill steps" ON public.coach_drill_steps 
                    FOR ALL 
                    USING (
                        EXISTS (
                            SELECT 1 FROM public.coach_drills 
                            WHERE coach_drills.id = coach_drill_steps.drill_id 
                            AND coach_drills.coach_id = auth.uid()
                        )
                    );
                END IF;

                -- session_drills policies
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

            -- 6. Grant Permissions
            GRANT ALL ON public.coach_drills TO service_role;
            GRANT ALL ON public.coach_drill_steps TO service_role;
            GRANT ALL ON public.session_drills TO service_role;

            GRANT SELECT ON public.coach_drills TO authenticated;
            GRANT SELECT ON public.coach_drill_steps TO authenticated;
            GRANT SELECT ON public.session_drills TO authenticated;

            GRANT INSERT, UPDATE, DELETE ON public.coach_drills TO authenticated;
            GRANT INSERT, UPDATE, DELETE ON public.coach_drill_steps TO authenticated;
            GRANT INSERT, UPDATE, DELETE ON public.session_drills TO authenticated;

            -- 7. Reload Schema Cache
            NOTIFY pgrst, 'reload schema';
        `;

        const { data, error } = await supabase.rpc('run_sql', { sql_query: sql });
        
        if (error) {
            console.error('❌ Migration via run_sql failed:', error.message);
            process.exit(1);
        } else {
            console.log('✅ Successfully completed database migrations for Drill Hub on production!');
        }

    } catch (e) {
        console.error('❌ Migration failed:', e);
        process.exit(1);
    }
}

runMigration();
