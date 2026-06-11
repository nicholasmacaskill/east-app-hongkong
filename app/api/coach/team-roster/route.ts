import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
    try {
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

        // Check if caller is authorized to view team rosters (Coach or Admin/Sys-Admin)
        const { data: callerProfile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!callerProfile || !['coach', 'admin', 'sys-admin'].includes(callerProfile.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch all eligible profiles (players, parents, other coaches)
        const { data: profiles, error: fetchError } = await supabaseAdmin
            .from('profiles')
            .select('id, first_name, last_name, role, avatar_url')
            .neq('role', 'sys-admin')
            .neq('id', user.id) // exclude self
            .order('first_name', { ascending: true });

        if (fetchError) {
            throw fetchError;
        }

        return NextResponse.json({ data: profiles });

    } catch (e: any) {
        console.error('API /coach/team-roster error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
