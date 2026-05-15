import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function wipeAllDrills() {
    console.log('--- WIPING ALL DRILLS (COMPLETE RESET) ---');

    // 1. Wipe Drill Steps first (foreign key dependency)
    const { error: stepsError } = await supabase
        .from('coach_drill_steps')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

    if (stepsError) {
        console.error('Error wiping drill steps:', stepsError.message);
        return;
    }
    console.log('✅ Wiped all Drill Steps.');

    // 2. Wipe Drill Metadata
    const { error: drillsError } = await supabase
        .from('coach_drills')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

    if (drillsError) {
        console.error('Error wiping drills:', drillsError.message);
        return;
    }
    console.log('✅ Wiped all Drills.');

    console.log('\n--- VERDICT ---');
    console.log('The Drill Hub is now completely empty. Ready for manual re-population.');
}

wipeAllDrills();
