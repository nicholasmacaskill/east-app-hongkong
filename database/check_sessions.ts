import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.production.latest') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkSessions() {
    // First - what columns exist
    const { data: sample } = await supabase.from('sessions').select('*').limit(1);
    if (sample && sample[0]) {
        console.log('Session columns:', Object.keys(sample[0]).join(', '));
    }

    // Count all sessions
    const { count: total } = await supabase.from('sessions').select('*', { count: 'exact', head: true });
    console.log(`\nTotal sessions in DB: ${total}`);

    // Get all sessions with coach info
    const { data: sessions, error } = await supabase
        .from('sessions')
        .select('id, title, start_time, coach_id, status')
        .order('start_time', { ascending: false })
        .limit(50);

    if (error) {
        // try alternate column name
        const { data: sessions2, error: e2 } = await supabase
            .from('sessions')
            .select('*')
            .limit(50);
        if (e2) { console.error('Error:', e2.message); return; }
        console.log('\nAll sessions:');
        sessions2?.forEach((s: any) => console.log(JSON.stringify(s)));
        return;
    }

    // Check if any sessions belong to deleted test coaches
    const deletedCoachIds = [
        '5ef0cb1c-f9ba-454e-90f6-041efc80b869', // testcoach@east.com
        '81f640e8-4af7-4c5a-b214-772d09830c1e', // coach.test@east.com
    ];

    const affected = sessions?.filter(s => deletedCoachIds.includes(s.coach_id));
    const safe = sessions?.filter(s => !deletedCoachIds.includes(s.coach_id));

    console.log(`\n✅ Sessions from REAL coaches (unaffected): ${safe?.length ?? 0}`);
    console.log(`⚠️  Sessions from deleted TEST coaches: ${affected?.length ?? 0}`);

    if (safe && safe.length > 0) {
        console.log('\nReal coach sessions:');
        safe.forEach(s => console.log(`  [${s.status}] ${s.title || s.id} | coach: ${s.coach_id}`));
    }
}

checkSessions();
