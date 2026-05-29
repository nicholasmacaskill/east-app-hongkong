import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function cleanup() {
    console.log("Cleaning up E2E Test Drills and Teams...");
    
    // Delete Drills
    const { data: drills, error: drillError } = await supabase
        .from('coach_drills')
        .delete()
        .like('title', '%E2E Test Drill%')
        .select();
        
    if (drillError) console.error("Drill cleanup error:", drillError);
    else console.log(`Deleted ${drills?.length || 0} test drills.`);

    // Delete Teams
    const { data: teams, error: teamError } = await supabase
        .from('teams')
        .delete()
        .like('name', '%E2E Squad%')
        .select();

    if (teamError) console.error("Team cleanup error:", teamError);
    else console.log(`Deleted ${teams?.length || 0} test teams.`);
}

cleanup();
