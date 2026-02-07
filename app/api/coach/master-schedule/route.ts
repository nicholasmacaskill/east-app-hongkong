import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';



export async function GET(request: Request) {
    try {
        // 1. AUTHENTICATION & AUTHORIZATION
        // We must verify the person asking is a Coach or Admin.
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check Role
        const supabaseAdmin = getSupabaseAdmin();
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role, first_name, last_name')
            .eq('id', user.id)
            .single();

        if (!profile || (profile.role !== 'coach' && profile.role !== 'admin')) {
            return NextResponse.json({ error: 'Forbidden: Coaches only.' }, { status: 403 });
        }

        // 2. FETCH DATA (Today & Next 60 Days)
        // Since the user increased the Supabase limit to 10,000, we can now fetch 
        // a broader range (60 days) to show a comprehensive Master Schedule.
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const startTimeFilter = todayStart.toISOString();

        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 60);
        const endTimeFilter = endDate.toISOString();

        // 2A. Fetch Sessions
        const { data: sessions, error: sessionError } = await supabaseAdmin
            .from('sessions')
            .select(`
                *,
                registrations (
                    user_id,
                    status,
                    profiles:user_id ( first_name, last_name, role )
                )
            `)
            .gte('start_time', startTimeFilter)
            .lte('start_time', endTimeFilter)
            .order('start_time', { ascending: true })
            .limit(5000); // Safety limit

        if (sessionError) {
            console.error('Master Schedule Error (Sessions):', sessionError);
            return NextResponse.json({ error: (sessionError as any).message }, { status: 500 });
        }

        // 2B. Fetch Availability (Open Slots)
        const { data: availability, error: availError } = await supabaseAdmin
            .from('availability')
            .select(`
                *,
                profiles:coach_id ( first_name, last_name, avatar_url )
            `)
            .gte('start_time', startTimeFilter)
            .lte('start_time', endTimeFilter)
            .eq('status', 'available')
            .order('start_time', { ascending: true })
            .limit(2000);

        if (availError) {
            console.error('Master Schedule Error (Availability):', availError);
            // Non-critical, can continue with just sessions if needed, but better to fail or warn
        }

        // 3. TRANSFORM & MERGE DATA
        // Use shared types from app/types to ensure consistency
        const formattedSessions: any[] = (sessions || []).map((s: any) => ({
            id: s.id, // bigint
            type: 'session',
            title: s.title,
            category: s.category,
            instructor: s.instructor,
            start_time: s.start_time,
            end_time: s.end_time,
            image_url: s.image_url,
            coach_image_url: s.coach_image_url,
            credit_cost: s.credit_cost,
            max_capacity: s.max_capacity,
            status: s.status,
            // Map registrations to a clean 'attendees' array
            attendees: (s.registrations || [])
                .map((r: any) => ({
                    id: r.user_id,
                    name: r.profiles ? `${r.profiles.first_name} ${r.profiles.last_name || ''}`.trim() : 'Unknown User',
                    role: r.profiles?.role || 'player',
                    status: r.status
                }))
        }));

        const formattedAvailability: any[] = (availability || []).map((a: any) => ({
            id: a.id, // uuid
            type: 'slot',
            title: 'Open Slot',
            category: 'PRIVATE', // Standardized category for slots
            instructor: a.profiles ? `${a.profiles.first_name} ${a.profiles.last_name || ''}`.trim() : 'Unknown Coach',
            start_time: a.start_time,
            end_time: a.end_time,
            image_url: null,
            coach_image_url: a.profiles?.avatar_url,
            coach_id: a.coach_id, // Useful for frontend filtering
            status: a.status,
            attendees: []
        }));

        // Combine and Sort
        const masterSchedule = [...formattedSessions, ...formattedAvailability].sort((a, b) =>
            new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        );

        return NextResponse.json(masterSchedule);

    } catch (e: any) {
        console.error('Master Schedule Server Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
