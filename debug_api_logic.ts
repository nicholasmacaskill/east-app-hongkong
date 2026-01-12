
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAvailability() {
    // Tuesday Jan 13, 2026 12:00 PM
    const startTime = '2026-01-13T12:00:00+08:00'; // Assuming +08 for HK? Or UTC? User is HK? 
    // Wait, ISO string in App uses local time usually. 
    // Let's use flexible string or just a broad range.

    // Actually, let's just inspect ALL sessions on Jan 13 and see strings.
    // And ALL coaches.

    console.log("--- DEBUGGING API LOGIC ---");

    // 1. Get Coaches
    const { data: coaches } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role')
        .eq('role', 'coach');

    console.log("Coaches Found:", coaches?.map(c => `${c.first_name} ${c.last_name}`));

    // 2. Get Sessions on Jan 13 (approx)
    const startRange = '2026-01-13T00:00:00';
    const endRange = '2026-01-13T23:59:59';

    const { data: sessions } = await supabase
        .from('sessions')
        .select('title, instructor, start_time, end_time')
        .gte('start_time', startRange)
        .lte('end_time', endRange);

    console.log("Sessions Found on Jan 13:", sessions?.length);
    sessions?.forEach(s => {
        console.log(`  - ${s.start_time} to ${s.end_time}: ${s.instructor} (${s.title})`);
    });

    // 3. Simulate Filter
    const busyInstructors = new Set(sessions?.map(s => s.instructor));
    console.log("Busy Instructor Set:", Array.from(busyInstructors));

    const available = coaches?.filter(c => {
        const name = `${c.first_name} ${c.last_name}`;
        const isBusy = busyInstructors.has(name);
        console.log(`  Checking ${name}: Busy? ${isBusy}`);
        return !isBusy;
    });

    console.log("Available Coaches:", available?.map(c => `${c.first_name} ${c.last_name}`));
}

checkAvailability();
