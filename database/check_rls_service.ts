import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.production') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testServiceAll() {
    console.log("Fetching training_plans as SERVICE ROLE...");
    const { data: plans, error: planErr } = await supabase
        .from('training_plans')
        .select('*');
        
    console.log("Plans count:", plans?.length);

    if (plans && plans.length > 0) {
        for (const plan of plans) {
            const { data: planDrills, error: pdErr } = await supabase
                .from('training_plan_drills')
                .select('*')
                .eq('plan_id', plan.id);
            console.log(`Plan ID: ${plan.id} | Drills count: ${planDrills?.length}`);
        }
    }
}

testServiceAll();
