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

        // 2. Get Explicitly Available Coaches from 'availability' table
        // A coach is available if they have a record spanning THIS time slot
        const { data: availableRecords, error: availErr } = await supabaseAdmin
            .from('availability')
            .select('coach_id')
            .lte('start_time', startTime)
            .gte('end_time', endTime)
            .eq('status', 'available');

        if (availErr) throw availErr;
        const explicitlyAvailableIds = new Set(availableRecords?.map(r => r.coach_id) || []);

        // 3. Get Conflicting Sessions
        // A session conflicts if it overlaps: (StartA < EndB) and (EndA > StartB)
        const { data: conflicts, error: conflictError } = await supabaseAdmin
            .from('sessions')
            .select('instructor')
            .lt('start_time', endTime)
            .gt('end_time', startTime)
            .neq('category', 'NEWS')
            .neq('category', 'EVENT');

        if (conflictError) throw conflictError;

        // 4. Filter
        const busyInstructors = new Set(conflicts?.map(s => s.instructor) || []);

        const finalAvailableCoaches = coaches?.filter(coach => {
            // Must be explicitly available in working hours
            if (!explicitlyAvailableIds.has(coach.id)) return false;

            const fullName = `${coach.first_name} ${coach.last_name}`;
            if (!fullName.trim()) return false;

            // Must NOT have a conflict (exact name match or first name match)
            const isBusy = Array.from(busyInstructors).some(busyName =>
                (busyName && busyName.toLowerCase() === fullName.toLowerCase()) ||
                (busyName && busyName.toLowerCase() === coach.first_name.toLowerCase())
            );

            return !isBusy;
        });

        return NextResponse.json(finalAvailableCoaches || []);

    } catch (e: any) {
        console.error('Available Coaches API Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
