import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';

type AssessmentMediaInput = {
    media_type: 'image' | 'video';
    media_url: string;
};

async function authenticateCoach(request: Request) {
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
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || !['coach', 'admin', 'sys-admin'].includes(profile.role)) {
        return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
    }

    return { user, profile, supabaseAdmin };
}

export async function GET(request: Request) {
    try {
        const auth = await authenticateCoach(request);
        if ('error' in auth && auth.error) return auth.error;

        const { user, profile, supabaseAdmin } = auth;
        const { searchParams } = new URL(request.url);
        const playerId = searchParams.get('playerId');
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

            if (profile.role === 'coach' && assessment.coach_id !== user.id) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }

            return NextResponse.json(assessment);
        }

        if (!playerId) {
            return NextResponse.json({ error: 'Missing playerId or assessmentId' }, { status: 400 });
        }

        let query = supabaseAdmin
            .from('player_assessments')
            .select(`
                *,
                media:player_assessment_media(*)
            `)
            .eq('player_id', playerId)
            .order('created_at', { ascending: false });

        if (profile.role === 'coach') {
            query = query.eq('coach_id', user.id);
        }

        const { data, error } = await query;
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data || []);
    } catch (e: unknown) {
        console.error('Coach Assessments GET Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const auth = await authenticateCoach(request);
        if ('error' in auth && auth.error) return auth.error;

        const { user, supabaseAdmin } = auth;
        const body = await request.json();
        const {
            playerId,
            title,
            notes = '',
            media = [],
            sendToPlayer = true,
        } = body as {
            playerId?: string;
            title?: string;
            notes?: string;
            media?: AssessmentMediaInput[];
            sendToPlayer?: boolean;
        };

        if (!playerId || !title?.trim()) {
            return NextResponse.json({ error: 'Missing playerId or title' }, { status: 400 });
        }

        const { data: assessment, error: assessmentError } = await supabaseAdmin
            .from('player_assessments')
            .insert({
                coach_id: user.id,
                player_id: playerId,
                title: title.trim(),
                notes: notes.trim(),
            })
            .select()
            .single();

        if (assessmentError || !assessment) {
            return NextResponse.json({ error: assessmentError?.message || 'Failed to create assessment' }, { status: 500 });
        }

        const mediaItems = (media as AssessmentMediaInput[]).filter((item) => item?.media_url);
        if (mediaItems.length > 0) {
            const { error: mediaError } = await supabaseAdmin
                .from('player_assessment_media')
                .insert(
                    mediaItems.map((item, index) => ({
                        assessment_id: assessment.id,
                        media_type: item.media_type,
                        media_url: item.media_url,
                        sort_order: index,
                    }))
                );

            if (mediaError) {
                await supabaseAdmin.from('player_assessments').delete().eq('id', assessment.id);
                return NextResponse.json({ error: mediaError.message }, { status: 500 });
            }
        }

        if (sendToPlayer) {
            const { error: messageError } = await supabaseAdmin.from('messages').insert({
                sender_id: user.id,
                receiver_id: playerId,
                content: `New video assessment: ${title.trim()}`,
                shared_assessment_id: assessment.id,
            });

            if (messageError) {
                console.error('Failed to notify player about assessment:', messageError.message);
            }
        }

        const { data: fullAssessment } = await supabaseAdmin
            .from('player_assessments')
            .select(`
                *,
                media:player_assessment_media(*)
            `)
            .eq('id', assessment.id)
            .single();

        return NextResponse.json(fullAssessment);
    } catch (e: unknown) {
        console.error('Coach Assessments POST Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}