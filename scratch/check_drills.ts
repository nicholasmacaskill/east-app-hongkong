import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDrills() {
    const { data, error } = await supabase
        .from('coach_drills')
        .select('id, title, skill_tags, status');
    
    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('--- Drill Database Scan ---');
    data.forEach(d => {
        console.log(`Title: ${d.title}`);
        console.log(`Tags: ${JSON.stringify(d.skill_tags)}`);
        console.log(`Status: ${d.status}`);
        console.log('---------------------------');
    });
}

checkDrills();
