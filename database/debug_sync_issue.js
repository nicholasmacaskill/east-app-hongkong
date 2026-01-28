
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function debugSchedule() {
    console.log("🔍 Debugging Schedule for Good Coach...");

    // 1. Get Coach ID
    const { data: coach } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .ilike('last_name', '%Coach%') // Assuming "Good Coach"
        .eq('first_name', 'Good')
        .single();

    if (!coach) {
        console.error("❌ Coach 'Good Coach' not found!");
        return;
    }
    console.log(`✅ Found Coach: ${coach.first_name} ${coach.last_name} (${coach.id})`);

    // 2. Check Availability (slots) for Feb 2026
    const { data: availability } = await supabase
        .from('availability')
        .select('*')
        .eq('coach_id', coach.id)
        .gte('start_time', '2026-02-01')
        .lte('start_time', '2026-02-15');

    console.log(`\n📅 Availability (Slots) Found: ${availability?.length}`);
    if (availability?.length > 0) {
        console.table(availability.slice(0, 5)); // Show first 5
    }

    // 3. Check Sessions for Feb 2026
    const { data: sessions } = await supabase
        .from('sessions')
        .select('id, title, instructor, start_time, session_type_id')
        .eq('instructor', 'Good Coach') // Check Normalized Name
        .gte('start_time', '2026-02-01')
        .lte('start_time', '2026-02-15');

    console.log(`\n🏋️ Sessions Found (by Name): ${sessions?.length}`);
    if (sessions?.length > 0) {
        console.table(sessions.slice(0, 5));
    }

    // 4. Check Sessions by Coach ID (if column exists/used?)
    // This is checking if maybe they are saved by coach_id but NOT name?
    // Note: Schema analysis showed 'instructor' string column is primarily used in legacy, 
    // but verify if there's any other link.
}

debugSchedule();
