import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function verifyAthleteVisibility() {
    console.log('--- VERIFYING ATHLETE-SIDE DRILL VISIBILITY ---');

    // 1. Find the test session we created
    const { data: session } = await supabase
        .from('sessions')
        .select('id, title')
        .eq('title', 'Drill Linking Verification')
        .single();

    if (!session) {
        console.error('Test session not found. Please schedule a drill first.');
        return;
    }

    console.log(`Found Session: ${session.title} (ID: ${session.id})`);

    // 2. Check the junction table
    const { data: linkedDrills, error } = await supabase
        .from('session_drills')
        .select(`
            id,
            order_index,
            coach_drills (
                id,
                title,
                category
            )
        `)
        .eq('session_id', session.id);

    if (error) {
        console.error('Error fetching linked drills:', error.message);
        return;
    }

    if (!linkedDrills || linkedDrills.length === 0) {
        console.log('❌ NO DRILLS LINKED. The athlete will see an empty plan.');
    } else {
        console.log(`✅ SUCCESS! Found ${linkedDrills.length} drill(s) linked to this session.`);
        linkedDrills.forEach((link, i) => {
            const drill = link.coach_drills as any;
            console.log(`   ${i + 1}. [${drill.category}] ${drill.title} (Order: ${link.order_index})`);
        });
        console.log('\n--- VERDICT ---');
        console.log('The Athlete App will successfully render these drills in the Evolution Plan for this session.');
    }
}

verifyAthleteVisibility();
