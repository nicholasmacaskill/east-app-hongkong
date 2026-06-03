import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.production.latest') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkUpcomingSessions() {
    const now = new Date();
    const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    console.log(`Checking sessions from ${now.toISOString()} to ${in60Days.toISOString()}\n`);

    const { data, error, count } = await supabase
        .from('sessions')
        .select('id, title, start_time, status, instructor', { count: 'exact' })
        .gte('start_time', now.toISOString())
        .lte('start_time', in60Days.toISOString())
        .order('start_time', { ascending: true });

    if (error) { console.error('Error:', error.message); return; }

    console.log(`Total upcoming sessions (next 60 days): ${count}`);
    if (data && data.length > 0) {
        data.slice(0, 20).forEach(s => console.log(`  [${s.status}] ${s.title} — ${s.start_time} — ${s.instructor}`));
    } else {
        console.log('⚠️  No sessions found in the upcoming 60 day window.');

        // Check what the latest session in the DB is
        const { data: latest } = await supabase
            .from('sessions')
            .select('id, title, start_time')
            .order('start_time', { ascending: false })
            .limit(5);
        console.log('\nMost recent sessions in DB:');
        latest?.forEach(s => console.log(`  ${s.title} — ${s.start_time}`));
    }
}

checkUpcomingSessions();
