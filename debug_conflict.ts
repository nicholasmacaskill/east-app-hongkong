
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConflict() {
    console.log("--- TESTING TIME OVERLAP ---");

    // Session in DB: 11:00 AM - 12:00 PM HK (03:00 - 04:00 UTC)
    // Querying for: 12:00 PM - 01:00 PM HK (04:00 - 05:00 UTC)

    // Exact UTC Strings
    const sessionStart = '2026-01-13T03:00:00+00:00';
    const sessionEnd = '2026-01-13T04:00:00+00:00';

    const queryStart = '2026-01-13T04:00:00+00:00';
    const queryEnd = '2026-01-13T05:00:00+00:00';

    console.log(`Checking Conflict for Query: ${queryStart} to ${queryEnd}`);

    // Run the Query
    const { data, error } = await supabase
        .from('sessions')
        .select('title, instructor, start_time, end_time')
        .lt('start_time', queryEnd) // Start < 5:00 (03:00 < 5:00) TRUE
        .gt('end_time', queryStart) // End > 4:00 (04:00 > 4:00) FALSE?
        .eq('instructor', 'Ben MacAskill'); // Check Ben specifically

    if (error) console.error(error);

    console.log(`Found ${data?.length} conflicting sessions.`);
    data?.forEach(s => console.log(`  Conflict: ${s.title} (${s.start_time} - ${s.end_time})`));

    // EDGE CASE CHECK: >= vs >
    // API uses .gt()
}

testConflict();
