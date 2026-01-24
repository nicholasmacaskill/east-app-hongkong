
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Environment Variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixScheduleData() {
    console.log('🚀 Starting Schedule Data Fix...');

    // 1. Get Facility Session Types
    const { data: sessionTypes, error: typesError } = await supabase
        .from('session_types')
        .select('*')
        .eq('category', 'FACILITY');

    if (typesError || !sessionTypes) {
        console.error('❌ Error fetching session types:', typesError);
        return;
    }

    console.log(`✅ Found ${sessionTypes.length} Facility Types`);

    // 2. Generate Sessions for Next 30 Days (8am - 8pm)
    const sessionsToInsert: any[] = [];
    const today = new Date();

    for (let d = 1; d <= 30; d++) {
        const dateQuery = new Date(today);
        dateQuery.setDate(today.getDate() + d); // Start tomorrow

        for (let h = 8; h <= 20; h++) { // 8 AM to 8 PM
            const startTime = new Date(dateQuery);
            startTime.setHours(h, 0, 0, 0);

            const endTime = new Date(startTime);
            endTime.setHours(h + 1, 0, 0, 0); // 1 hour slots

            for (const type of sessionTypes) {
                sessionsToInsert.push({
                    title: type.title,
                    category: 'FACILITY',
                    description: type.description,
                    image_url: type.image_url,
                    start_time: startTime.toISOString(),
                    end_time: endTime.toISOString(),
                    max_capacity: 1, // Facilities usually atomic? Or check types? Default 1 for pads.
                    credit_cost: 100, // Default for facilities
                    instructor: 'Facility',
                    session_type_id: type.id // Link to type
                });
            }
        }
    }

    // Batch Insert Sessions (Chunking)
    const chunkSize = 500;
    for (let i = 0; i < sessionsToInsert.length; i += chunkSize) {
        const chunk = sessionsToInsert.slice(i, i + chunkSize);
        const { error } = await supabase.from('sessions').insert(chunk);
        if (error) console.error('Error inserting sessions chunk:', error);
        else console.log(`✅ Inserted sessions chunk ${i / chunkSize + 1}`);
    }


    // 3. Fix Coach Availability (Coach Ben)
    // Find Coach Ben
    const { data: coaches } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .ilike('first_name', 'Ben')
        .eq('role', 'coach')
        .limit(1);

    if (coaches && coaches.length > 0) {
        const coach = coaches[0];
        console.log(`FOUND Coach: ${coach.first_name} (${coach.id})`);

        // Insert Availability
        // First clear old availability to avoid overlaps/dupes (simplistic approach for fix script)
        // await supabase.from('availability').delete().eq('coach_id', coach.id); 
        // ^ Unsafe to delete if bookings exist? Availability is usually fine to delete/re-add if stateless.
        // Let's just insert checking for conflicts? 
        // Or just INSERT generic availability.

        const availToInsert: any[] = [];
        for (let d = 1; d <= 30; d++) {
            const dateQuery = new Date(today);
            dateQuery.setDate(today.getDate() + d);

            // 9am to 5pm
            const start = new Date(dateQuery);
            start.setHours(9, 0, 0, 0);
            const end = new Date(dateQuery);
            end.setHours(17, 0, 0, 0);

            availToInsert.push({
                coach_id: coach.id,
                start_time: start.toISOString(),
                end_time: end.toISOString(),
                status: 'available'
            });
        }

        const { error: availError } = await supabase.from('availability').insert(availToInsert);
        if (!availError) console.log(`✅ Inserted 30 days of availability for Coach Ben`);
        else console.error('Error inserting availability:', availError);

    } else {
        console.warn("⚠️ Coach Ben not found. Skipping availability fix.");
    }


    console.log('🏁 Data Fix Complete');
}

fixScheduleData().catch(console.error);

