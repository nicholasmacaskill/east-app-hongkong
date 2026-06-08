import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.production') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixPolicies() {
    const sql = `
        -- Ensure training_plans is readable by everyone
        DROP POLICY IF EXISTS "Anyone can view training plans" ON public.training_plans;
        CREATE POLICY "Anyone can view training plans" ON public.training_plans FOR SELECT USING (true);

        DROP POLICY IF EXISTS "Coaches can manage their own training plans" ON public.training_plans;
        CREATE POLICY "Coaches can manage their own training plans" ON public.training_plans 
        FOR ALL 
        USING (auth.uid() = coach_id);

        -- Ensure training_plan_drills is readable by everyone
        DROP POLICY IF EXISTS "Anyone can view training plan drills" ON public.training_plan_drills;
        CREATE POLICY "Anyone can view training plan drills" ON public.training_plan_drills FOR SELECT USING (true);

        DROP POLICY IF EXISTS "Coaches can manage drills in their plans" ON public.training_plan_drills;
        CREATE POLICY "Coaches can manage drills in their plans" ON public.training_plan_drills 
        FOR ALL 
        USING (
            EXISTS (
                SELECT 1 FROM public.training_plans 
                WHERE training_plans.id = plan_id 
                AND training_plans.coach_id = auth.uid()
            )
        );

        -- Grant permissions just in case
        GRANT SELECT ON public.training_plans TO authenticated;
        GRANT SELECT ON public.training_plans TO anon;
        GRANT SELECT ON public.training_plan_drills TO authenticated;
        GRANT SELECT ON public.training_plan_drills TO anon;
        
        GRANT SELECT ON public.coach_drills TO authenticated;
        GRANT SELECT ON public.coach_drills TO anon;
        
        GRANT SELECT ON public.coach_drill_steps TO authenticated;
        GRANT SELECT ON public.coach_drill_steps TO anon;

        NOTIFY pgrst, 'reload schema';
    `;
    const { error } = await supabase.rpc('run_sql', { sql_query: sql });
    if (error) {
        console.error("Error fixing policies:", error);
    } else {
        console.log("Policies fixed successfully.");
    }
}

fixPolicies();
