import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';

async function authenticateUser(request: Request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
        return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
        return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role, first_name, last_name')
        .eq('id', user.id)
        .single();

    return { user, profile, supabaseAdmin };
}

export async function GET(request: Request) {
    try {
        const auth = await authenticateUser(request);
        if ('error' in auth && auth.error) return auth.error;

        const { user, profile, supabaseAdmin } = auth;
        const { searchParams } = new URL(request.url);
        const assessmentId = searchParams.get('assessmentId');

        if (assessmentId) {
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

            const isAllowed =
                assessment.player_id === user.id ||
                assessment.coach_id === user.id ||
                ['admin', 'sys-admin'].includes(profile?.role || '');

            if (!isAllowed) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }

            return NextResponse.json(assessment);
        }

        if (profile?.role !== 'player') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { data: assessments, error: listError } = await supabaseAdmin
            .from('player_assessments')
            .select(`
                id,
                title,
                notes,
                created_at,
                coach_id,
                media:player_assessment_media(id, media_type)
            `)
            .eq('player_id', user.id)
            .order('created_at', { ascending: false });

        if (listError) {
            return NextResponse.json({ error: listError.message }, { status: 500 });
        }

        const coachIds = [...new Set((assessments || []).map((a) => a.coach_id))];
        const { data: coaches } = coachIds.length
            ? await supabaseAdmin
                .from('profiles')
                .select('id, first_name, last_name')
                .in('id', coachIds)
            : { data: [] };

        const coachMap = Object.fromEntries(
            (coaches || []).map((c) => [
                c.id,
                `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Coach',
            ])
        );

        const items = (assessments || []).map((a) => {
            const media = (a.media as { id: string; media_type: string }[]) || [];
            return {
                id: a.id,
                title: a.title,
                notes: a.notes,
                created_at: a.created_at,
                coach_id: a.coach_id,
                coach_name: coachMap[a.coach_id] || 'Coach',
                media_count: media.length,
                has_video: media.some((m) => m.media_type === 'video'),
            };
        });

        return NextResponse.json(items);
    } catch (e: unknown) {
        console.error('Player Assessments GET Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}