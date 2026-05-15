import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function wipeAllDrillSchedules() {
    console.log('--- WIPING ALL SCHEDULED DRILLS ---');

    const { error } = await supabase
        .from('session_drills')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete everything

    if (error) {
        console.error('Error wiping schedules:', error.message);
    } else {
        console.log('✅ SUCCESS: All drills have been un-linked from all sessions.');
        console.log('You now have a 100% clean slate on the Drill Hub.');
    }
}

wipeAllDrillSchedules();
