
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
    try {
        // 1. AUTHENTICATION & AUTHORIZATION
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

        const supabaseAdmin = getSupabaseAdmin();
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || profile.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Admins only.' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const start = searchParams.get('start');
        const end = searchParams.get('end');

        if (!start || !end) {
            return NextResponse.json({ error: 'Start and End dates are required' }, { status: 400 });
        }

        // 1. Fetch Sessions with Registrations
        const { data: sessions, error: sessionError } = await supabaseAdmin
            .from('sessions')
            .select(`
                *,
                registrations (
                    user_id,
                    status,
                    profiles:user_id ( first_name, last_name )
                )
            `)
            .gte('start_time', start)
            .lte('start_time', end)
            .neq('status', 'cancelled')
            .order('start_time');

        if (sessionError) throw sessionError;

        // 2. Fetch Availability (Coach Slots)
        const { data: availability, error: availError } = await supabaseAdmin
            .from('availability')
            .select(`
                *,
                profiles:coach_id ( first_name, last_name, avatar_url )
            `)
            .gte('start_time', start)
            .lte('start_time', end)
            .eq('status', 'available');

        if (availError) throw availError;

        return NextResponse.json({
            sessions: sessions || [],
            availability: availability || []
        });

    } catch (error: any) {
        console.error('Admin Schedule API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
