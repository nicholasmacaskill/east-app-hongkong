
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugCoachSessions() {
    console.log("--- DEBUGGING COACH SESSIONS ---");

    // 1. Fetch all coaches
    const { data: coaches, error: coachError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role')
        .eq('role', 'coach');

    if (coachError) {
        console.error("Error fetching coaches:", coachError);
        return;
    }

    console.log(`Found ${coaches.length} coaches.`);

    // 2. Fetch all future sessions
    const { data: sessions, error: sessionError } = await supabase
        .from('sessions')
        .select('id, title, instructor, category, start_time')
        .gt('end_time', new Date().toISOString());

    if (sessionError) {
        console.error("Error fetching sessions:", sessionError);
        return;
    }

    console.log(`Found ${sessions.length} future sessions.`);

    // 3. Test Match Logic
    for (const coach of coaches) {
        if (!coach.first_name.toLowerCase().includes('bob')) continue; // Focus on Bob for now

        console.log(`\nChecking Coach: ${coach.first_name} ${coach.last_name || ''} (ID: ${coach.id})`);

        const first = (coach.first_name || '').toLowerCase();
        const last = (coach.last_name || '').toLowerCase();

        const matchedSessions = sessions.filter(s => {
            if (!s.instructor) return false;
            const i = s.instructor.toLowerCase();

            // Logic I implemented
            if (last && i.includes(first) && i.includes(last)) return true;
            if (!last && i.includes(first)) return true;

            return false;
        });

        const uniqueTitles = new Set(matchedSessions.map(s => s.title));
        console.log(`Matched ${matchedSessions.length} sessions. Unique Titles: ${uniqueTitles.size}`);
        console.log("Titles:", Array.from(uniqueTitles));

        // Print details of matched vs NOT matched but suspicious
        console.log("--- MATCHED ---");
        matchedSessions.slice(0, 5).forEach(s => console.log(`  [${s.title}] "${s.instructor}"`));

        console.log("--- SUSPICIOUS NON-MATCHES (Contains 'Bob') ---");
        const suspicious = sessions.filter(s =>
            s.instructor?.toLowerCase().includes('bob') &&
            !matchedSessions.find(ms => ms.id === s.id)
        );
        suspicious.forEach(s => console.log(`  [${s.title}] "${s.instructor}"`));
    }
}

debugCoachSessions();
