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
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || (profile.role !== 'coach' && profile.role !== 'admin')) {
            return NextResponse.json({ error: 'Forbidden: Coaches only.' }, { status: 403 });
        }

        // 2. FETCH SESSIONS (Today & Future)
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const startTimeFilter = todayStart.toISOString();

        // 2A. Fetch Sessions
        const { data: sessions, error: sessionError } = await supabaseAdmin
            .from('sessions')
            .select(`
                *,
                registrations (
                    user_id,
                    profiles:user_id ( first_name, last_name, role )
                )
            `)
            .gte('start_time', startTimeFilter)
            .order('start_time', { ascending: true });

        if (sessionError) {
            console.error('Master Schedule Error (Sessions):', sessionError);
            return NextResponse.json({ error: sessionError.message }, { status: 500 });
        }

        // 2B. Fetch Availability (Open Slots)
        const { data: availability, error: availError } = await supabaseAdmin
            .from('availability')
            .select(`
                *,
                profiles:coach_id ( first_name, last_name, avatar_url )
            `)
            .gte('start_time', startTimeFilter)
            .eq('status', 'available')
            .order('start_time', { ascending: true });

        if (availError) {
            console.error('Master Schedule Error (Availability):', availError);
            // Non-critical, can continue with just sessions if needed, but better to fail or warn
        }

        // 3. TRANSFORM & MERGE DATA
        const formattedSessions = (sessions || []).map((s: any) => ({
            id: s.id, // bigint
            type: 'session',
            title: s.title,
            category: s.category,
            instructor: s.instructor,
            start_time: s.start_time,
            end_time: s.end_time,
            image_url: s.image_url,
            coach_image_url: s.coach_image_url,
            // Map registrations to a clean 'attendees' array
            attendees: (s.registrations || []).map((r: any) => ({
                id: r.user_id,
                name: r.profiles ? `${r.profiles.first_name} ${r.profiles.last_name || ''}`.trim() : 'Unknown User',
                role: r.profiles?.role || 'player'
            }))
        }));

        const formattedAvailability = (availability || []).map((a: any) => ({
            id: a.id, // uuid
            type: 'slot',
            title: 'Open Slot',
            category: 'PRIVATE_SLOT',
            instructor: a.profiles ? `${a.profiles.first_name} ${a.profiles.last_name || ''}`.trim() : 'Unknown Coach',
            start_time: a.start_time,
            end_time: a.end_time,
            image_url: null,
            coach_image_url: a.profiles?.avatar_url,
            coach_id: a.coach_id, // Useful for frontend filtering
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
