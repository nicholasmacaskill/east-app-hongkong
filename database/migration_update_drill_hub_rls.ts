import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.production.latest') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateRLS() {
    try {
        console.log(`Connecting to production Supabase API: ${supabaseUrl}...`);
        
        const sql = `
            DO $$ 
            BEGIN
                -- Allow sys-admin and admin to manage all drills
                IF NOT EXISTS (
                    SELECT FROM pg_policies WHERE tablename = 'coach_drills' AND policyname = 'Admins can manage all drills'
                ) THEN
                    CREATE POLICY "Admins can manage all drills" ON public.coach_drills 
                    FOR ALL 
                    USING (
                        EXISTS (
                            SELECT 1 FROM public.profiles 
                            WHERE profiles.id = auth.uid() 
                            AND profiles.role IN ('admin', 'sys-admin')
                        )
                    );
                END IF;

                -- Allow sys-admin and admin to manage all drill steps
                IF NOT EXISTS (
                    SELECT FROM pg_policies WHERE tablename = 'coach_drill_steps' AND policyname = 'Admins can manage all drill steps'
                ) THEN
                    CREATE POLICY "Admins can manage all drill steps" ON public.coach_drill_steps 
                    FOR ALL 
                    USING (
                        EXISTS (
                            SELECT 1 FROM public.profiles 
                            WHERE profiles.id = auth.uid() 
                            AND profiles.role IN ('admin', 'sys-admin')
                        )
                    );
                END IF;
            END $$;

            NOTIFY pgrst, 'reload schema';
        `;

        const { data, error } = await supabase.rpc('run_sql', { sql_query: sql });
        
        if (error) {
            console.error('❌ Migration failed:', error.message);
        } else {
            console.log('✅ Successfully added admin RLS policies to Drill Hub!');
        }

    } catch (e) {
        console.error('❌ Migration error:', e);
    }
}

updateRLS();
