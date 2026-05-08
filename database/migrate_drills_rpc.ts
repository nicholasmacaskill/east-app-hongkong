import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
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

    console.log("Attempting migration via RPC...");
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
        console.error('RPC exec_sql Error:', error);
        
        const { error: error2 } = await supabase.rpc('run_sql', { sql_query: sql });
        if (error2) {
             console.error('RPC run_sql Error:', error2);
             console.log("No known SQL RPC found. Saving to schema.sql instead.");
        } else {
             console.log("Migration successful via run_sql!");
        }
    } else {
        console.log("Migration successful via exec_sql!");
    }
}
runMigration();
