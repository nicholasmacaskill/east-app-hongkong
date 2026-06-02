import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.production
dotenv.config({ path: path.resolve(__dirname, '../.env.production') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.production');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    try {
        console.log(`Connecting to production Supabase API: ${supabaseUrl}...`);

        const sql = `
            CREATE TABLE IF NOT EXISTS public.training_plans (
                id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
                coach_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
                title text NOT NULL,
                description text,
                created_at timestamp with time zone DEFAULT now(),
                updated_at timestamp with time zone DEFAULT now()
            );

            CREATE TABLE IF NOT EXISTS public.training_plan_drills (
                id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
                plan_id uuid REFERENCES public.training_plans(id) ON DELETE CASCADE,
                drill_id uuid REFERENCES public.coach_drills(id) ON DELETE CASCADE,
                order_index integer DEFAULT 0,
                created_at timestamp with time zone DEFAULT now()
            );

            -- Add RLS Policies
            ALTER TABLE public.training_plans ENABLE ROW LEVEL SECURITY;
            ALTER TABLE public.training_plan_drills ENABLE ROW LEVEL SECURITY;

            DO $$ 
            BEGIN
                -- training_plans policies
                IF NOT EXISTS (
                    SELECT FROM pg_policies WHERE tablename = 'training_plans' AND policyname = 'Anyone can view training plans'
                ) THEN
                    CREATE POLICY "Anyone can view training plans" ON public.training_plans FOR SELECT USING (true);
                END IF;

                IF NOT EXISTS (
                    SELECT FROM pg_policies WHERE tablename = 'training_plans' AND policyname = 'Coaches can manage their own training plans'
                ) THEN
                    CREATE POLICY "Coaches can manage their own training plans" ON public.training_plans 
                    FOR ALL 
                    USING (auth.uid() = coach_id);
                END IF;

                -- training_plan_drills policies
                IF NOT EXISTS (
                    SELECT FROM pg_policies WHERE tablename = 'training_plan_drills' AND policyname = 'Anyone can view training plan drills'
                ) THEN
                    CREATE POLICY "Anyone can view training plan drills" ON public.training_plan_drills FOR SELECT USING (true);
                END IF;

                IF NOT EXISTS (
                    SELECT FROM pg_policies WHERE tablename = 'training_plan_drills' AND policyname = 'Coaches can manage drills in their plans'
                ) THEN
                    CREATE POLICY "Coaches can manage drills in their plans" ON public.training_plan_drills 
                    FOR ALL 
                    USING (
                        EXISTS (
                            SELECT 1 FROM public.training_plans 
                            WHERE training_plans.id = plan_id 
                            AND training_plans.coach_id = auth.uid()
                        )
                    );
                END IF;
            END $$;

            -- Grants
            GRANT ALL ON public.training_plans TO service_role;
            GRANT SELECT ON public.training_plans TO authenticated;
            GRANT INSERT, UPDATE, DELETE ON public.training_plans TO authenticated;

            GRANT ALL ON public.training_plan_drills TO service_role;
            GRANT SELECT ON public.training_plan_drills TO authenticated;
            GRANT INSERT, UPDATE, DELETE ON public.training_plan_drills TO authenticated;

            -- Reload Schema Cache
            NOTIFY pgrst, 'reload schema';
        `;

        const { data, error } = await supabase.rpc('run_sql', { sql_query: sql });

        if (error) {
            console.error('❌ Migration via run_sql failed:', error.message);
            process.exit(1);
        } else {
            console.log('✅ Successfully created training_plans and training_plan_drills tables via run_sql RPC.');
        }

    } catch (e) {
        console.error('❌ Migration failed:', e);
        process.exit(1);
    }
}

runMigration();
