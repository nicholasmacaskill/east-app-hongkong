
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: '.env.local' });
import { getSupabaseAdmin } from '../app/lib/supabaseAdmin';

async function run() {
    const supabase = getSupabaseAdmin();
    const userId = 'd285fa7f-d9c1-44bd-8f49-0203e2ef6f23'; // Penalty Tester

    const { data: regs, error } = await supabase
        .from('registrations')
        .select(`
      id,
      status,
      session_id,
      sessions (
        id,
        title,
        start_time,
        end_time,
        instructor
      )
    `)
        .eq('user_id', userId)
        .eq('status', 'confirmed')
        .order('session_id', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error fetching sessions:', error);
        return;
    }

    console.log(`Upcoming/Recent Bookings for Ben MacAskill2:`);
    regs.forEach(reg => {
        const session: any = reg.sessions;
        if (session) {
            console.log(`- ${session.title} (${session.start_time}) [ID: ${session.id}] Instructor: ${session.instructor}`);
        }
    });
}

run();
