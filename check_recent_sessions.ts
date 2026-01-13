
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkRecentSessions() {
    console.log("Checking last 5 sessions created...");
    const { data: sessions, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('category', 'PRIVATE')
        .order('id', { ascending: false }) // Filter by high ID
        .limit(5);

    if (error) {
        console.error("Error fetching sessions:", error);
        return;
    }

    console.log("Recent Sessions:");
    sessions.forEach(s => {
        console.log(`[${s.id}] ${s.title} (${s.category}) - ${s.start_time} to ${s.end_time}`);
        console.log(`    Instructor: ${s.instructor}`);
        console.log(`    Created At: ${s.created_at || 'N/A'}`); // created_at might not exist in type def but likely in DB
    });
}

checkRecentSessions();
