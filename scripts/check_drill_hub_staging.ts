import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// POINTING TO STAGING (test branch)
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) process.exit(1);

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDrillHub() {
    console.log("=== CHECKING DRILL HUB TABLES IN STAGING ===");
    
    const { data: drills, error: drillsErr } = await supabase.from('coach_drills').select('*').limit(1);
    const { data: steps, error: stepsErr } = await supabase.from('coach_drill_steps').select('*').limit(1);

    if (drillsErr) {
        console.log("❌ Table 'coach_drills' does not exist or is inaccessible.");
    } else {
        console.log("✅ Table 'coach_drills' exists.");
    }

    if (stepsErr) {
        console.log("❌ Table 'coach_drill_steps' does not exist or is inaccessible.");
    } else {
        console.log("✅ Table 'coach_drill_steps' exists.");
    }
}
checkDrillHub();
