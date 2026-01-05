import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Admin Client for fetching all data (bypassing RLS perms that might limit to "own" bookings)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || (profile.role !== 'coach' && profile.role !== 'admin')) {
            return NextResponse.json({ error: 'Forbidden: Coaches only.' }, { status: 403 });
        }

        // 2. FETCH SESSIONS (Past 24 hours & Future)
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        // We need: Session Info + Registrations -> User Profile (Name)
        const { data: sessions, error: sessionError } = await supabaseAdmin
            .from('sessions')
            .select(`
                *,
                registrations (
                    user_id,
                    profiles:user_id ( first_name, last_name, role )
                )
            `)
            .gte('start_time', twentyFourHoursAgo)
            .order('start_time', { ascending: true });

        if (sessionError) {
            console.error('Master Schedule Error:', sessionError);
            return NextResponse.json({ error: sessionError.message }, { status: 500 });
        }

        // 3. TRANSFORM DATA
        // Flatten the structure for the frontend
        const detailedSessions = sessions.map((s: any) => ({
            id: s.id,
            title: s.title,
            category: s.category,
            instructor: s.instructor,
            start_time: s.start_time,
            end_time: s.end_time,
            image_url: s.image_url,
            // Map registrations to a clean 'attendees' array
            attendees: (s.registrations || []).map((r: any) => ({
                id: r.user_id,
                name: r.profiles ? `${r.profiles.first_name} ${r.profiles.last_name || ''}`.trim() : 'Unknown User',
                role: r.profiles?.role || 'player'
            }))
        }));

        return NextResponse.json(detailedSessions);

    } catch (e: any) {
        console.error('Master Schedule Server Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
