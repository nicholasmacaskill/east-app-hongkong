import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';



export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');

    if (!startTime || !endTime) {
        return NextResponse.json({ error: 'Missing startTime or endTime' }, { status: 400 });
    }

    // console.log(`Checking coaches for: ${startTime} to ${endTime}`);

    try {
        const supabaseAdmin = getSupabaseAdmin();

        // 1. Get ALL Coaches
        const { data: coaches, error: coachError } = await supabaseAdmin
            .from('profiles')
            .select('id, first_name, last_name, avatar_url, bio')
            .eq('role', 'coach');

        if (coachError) throw coachError;

        // 2. Get Conflicting Sessions
        // A session conflicts if it overlaps: (StartA < EndB) and (EndA > StartB)
        // EXCLUDE 'NEWS' and 'EVENT' as they are often announcements, not actual bookings blocking the coach
        const { data: conflicts, error: conflictError } = await supabaseAdmin
            .from('sessions')
            .select('instructor')
            .lt('start_time', endTime)
            .gt('end_time', startTime)
            .neq('category', 'NEWS')
            .neq('category', 'EVENT');

        if (conflictError) throw conflictError;

        // 3. Filter
        // Create a Set of busy instructor names
        const busyInstructors = new Set(conflicts?.map(s => s.instructor) || []);
        console.log(`Busy Instructors during ${startTime}-${endTime}:`, Array.from(busyInstructors));

        const availableCoaches = coaches?.filter(coach => {
            const fullName = `${coach.first_name} ${coach.last_name}`;
            // If the coach's name appears in busy list, exclude them.
            // Also exclude if name is empty (sanity check)
            if (!fullName.trim()) return false;
            return !busyInstructors.has(fullName);
        });

        // console.log(`Found ${availableCoaches?.length || 0} active coaches`);

        return NextResponse.json(availableCoaches || []);

    } catch (e: any) {
        console.error('Available Coaches API Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
