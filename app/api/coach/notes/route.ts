import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';

/**
 * API for Coaches to manage private notes for players.
 */

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const playerId = searchParams.get('playerId');

        if (!playerId) {
            return NextResponse.json({ error: 'Missing playerId' }, { status: 400 });
        }

        // 1. Auth & Authorization
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

        if (!profile || (profile.role !== 'coach' && profile.role !== 'admin' && profile.role !== 'sys-admin')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 2. Fetch Notes (Coaches only see their own notes for that player)
        // Note: Admin might need to see all, but for now we keep it coach-specific
        const query = supabaseAdmin
            .from('coach_notes')
            .select('*')
            .eq('player_id', playerId);

        // If it's a coach, only show their own notes. Admins see all.
        if (profile.role === 'coach') {
            query.eq('coach_id', user.id);
        }

        const { data: notes, error: notesError } = await query.order('created_at', { ascending: false });

        if (notesError) {
            return NextResponse.json({ error: notesError.message }, { status: 500 });
        }

        return NextResponse.json(notes);

    } catch (e: any) {
        console.error('Coach Notes GET Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { playerId, content } = body;

        if (!playerId || !content) {
            return NextResponse.json({ error: 'Missing playerId or content' }, { status: 400 });
        }

        // 1. Auth & Authorization
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

        if (!profile || (profile.role !== 'coach' && profile.role !== 'admin' && profile.role !== 'sys-admin')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 2. Save Note
        const { data: note, error: noteError } = await supabaseAdmin
            .from('coach_notes')
            .insert({
                coach_id: user.id,
                player_id: playerId,
                content: content.trim()
            })
            .select()
            .single();

        if (noteError) {
            return NextResponse.json({ error: noteError.message }, { status: 500 });
        }

        return NextResponse.json(note);

    } catch (e: any) {
        console.error('Coach Notes POST Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
