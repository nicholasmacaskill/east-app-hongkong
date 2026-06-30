import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';

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

        const { data: { user }, error: authError } = await supabase.auth.getUser(
            authHeader.replace('Bearer ', '')
        );

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const assessmentId = searchParams.get('assessmentId');

        if (!assessmentId) {
            return NextResponse.json({ error: 'Missing assessmentId' }, { status: 400 });
        }

        const supabaseAdmin = getSupabaseAdmin();
        const { data: assessment, error } = await supabaseAdmin
            .from('player_assessments')
            .select(`
                *,
                media:player_assessment_media(*)
            `)
            .eq('id', assessmentId)
            .single();

        if (error || !assessment) {
            return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
        }

        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        const isAllowed =
            assessment.player_id === user.id ||
            assessment.coach_id === user.id ||
            ['admin', 'sys-admin'].includes(profile?.role || '');

        if (!isAllowed) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json(assessment);
    } catch (e: unknown) {
        console.error('Player Assessments GET Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}