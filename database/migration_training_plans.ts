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
        console.log('--- Connected to DB. Starting Training Plans Schema Setup ---');

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
        `;

        await client.query(sql);
        console.log('✅ Successfully created training_plans and training_plan_drills tables.');

    } catch (e) {
        console.error('❌ Migration failed:', e);
    } finally {
        await client.end();
    }
}

runMigration();
