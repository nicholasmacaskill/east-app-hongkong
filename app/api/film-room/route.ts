import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { extractYouTubeVideoId, formatSecondsToLabel } from '@/app/lib/youtubeUtils';
import { CreateFilmRoomSessionInput } from '@/app/types';

async function getAuthenticatedUser(request: Request) {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    let user: any = null;
    const supabaseAdmin = getSupabaseAdmin();

    if (token) {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data, error } = await supabase.auth.getUser(token);
        if (!error && data?.user) {
            user = data.user;
        }
    }

    if (!user) {
        try {
            const cookieStore = await cookies();
            const supabaseAuth = createServerClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                {
                    cookies: {
                        getAll() {
                            return cookieStore.getAll();
                        },
                        setAll(cookiesToSet) {
                            try {
                                cookiesToSet.forEach(({ name, value, options }) =>
                                    cookieStore.set(name, value, options)
                                );
                            } catch {
                                // Ignore in Route Handler
                            }
                        },
                    },
                }
            );
            const { data: cookieAuth, error: cookieErr } = await supabaseAuth.auth.getUser();
            if (!cookieErr && cookieAuth?.user) {
                user = cookieAuth.user;
            }
        } catch (e) {
            // Ignore cookie error
        }
    }

    if (!user) {
        return null;
    }

    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id, first_name, last_name, role, parent_id')
        .eq('id', user.id)
        .single();

    return { user, profile, supabaseAdmin };
}

// GET: Fetch Film Room Sessions or single session with timestamps
export async function GET(request: Request) {
    try {
        const auth = await getAuthenticatedUser(request);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { user, profile, supabaseAdmin } = auth;
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('id');
        const teamId = searchParams.get('teamId');
        const playerId = searchParams.get('playerId');

        // Fetch single session with complete timestamp list
        if (sessionId) {
            const { data: session, error } = await supabaseAdmin
                .from('film_room_sessions')
                .select(`
                    *,
                    coach:profiles!film_room_sessions_coach_id_fkey(id, first_name, last_name, avatar_url),
                    target_team:teams(id, name),
                    target_player:profiles!film_room_sessions_target_player_id_fkey(id, first_name, last_name, avatar_url)
                `)
                .eq('id', sessionId)
                .single();

            if (error || !session) {
                return NextResponse.json({ error: 'Film session not found' }, { status: 404 });
            }

            // Fetch timestamps for this session
            const { data: timestamps, error: tsError } = await supabaseAdmin
                .from('film_room_timestamps')
                .select('*')
                .eq('session_id', sessionId)
                .order('sort_order', { ascending: true })
                .order('timestamp_seconds', { ascending: true });

            if (tsError) {
                console.error('Failed to fetch timestamps:', tsError);
            }

            return NextResponse.json({
                ...session,
                timestamps: timestamps || []
            });
        }

        // List sessions based on user role and permissions
        let query = supabaseAdmin
            .from('film_room_sessions')
            .select(`
                *,
                coach:profiles!film_room_sessions_coach_id_fkey(id, first_name, last_name, avatar_url),
                target_team:teams(id, name),
                target_player:profiles!film_room_sessions_target_player_id_fkey(id, first_name, last_name, avatar_url),
                timestamps:film_room_timestamps(id, timestamp_seconds, timestamp_label, title, notes, sort_order)
            `)
            .order('created_at', { ascending: false });

        const isCoachOrAdmin = profile && ['coach', 'admin', 'sys-admin'].includes(profile.role);

        if (!isCoachOrAdmin) {
            // Player or Parent: Retrieve only sessions for all, this player, or their team
            const targetPlayerIds = [user.id];

            // If parent, include children
            if (profile?.role === 'parent') {
                const { data: children } = await supabaseAdmin
                    .from('profiles')
                    .select('id')
                    .eq('parent_id', user.id);
                if (children) {
                    children.forEach((c) => targetPlayerIds.push(c.id));
                }
            }

            // Get team IDs for player
            const { data: memberTeams } = await supabaseAdmin
                .from('team_members')
                .select('team_id')
                .in('user_id', targetPlayerIds);

            const teamIds = (memberTeams || []).map((t) => t.team_id).filter(Boolean);

            const filterConditions = [
                `target_type.eq.all`,
                `target_player_id.in.(${targetPlayerIds.join(',')})`
            ];

            if (teamIds.length > 0) {
                filterConditions.push(`target_team_id.in.(${teamIds.join(',')})`);
            }

            query = query.or(filterConditions.join(','));
        } else {
            // Optional filters for coach/admin
            if (teamId) {
                query = query.eq('target_team_id', teamId);
            }
            if (playerId) {
                query = query.eq('target_player_id', playerId);
            }
        }

        const { data: sessions, error } = await query;

        if (error) {
            console.error('Error fetching film sessions:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(sessions || []);
    } catch (err: any) {
        console.error('Film Room GET exception:', err);
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
    }
}

// POST: Create a new Film Room session with timestamps
export async function POST(request: Request) {
    try {
        const auth = await getAuthenticatedUser(request);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { user, profile, supabaseAdmin } = auth;
        const isCoachOrAdmin = profile && ['coach', 'admin', 'sys-admin'].includes(profile.role);

        if (!isCoachOrAdmin) {
            return NextResponse.json({ error: 'Forbidden: Only coaches and staff can create film sessions' }, { status: 403 });
        }

        const body = (await request.json()) as CreateFilmRoomSessionInput;
        const { title, description, youtube_url, target_type = 'all', target_team_id, target_player_id, tags = [], timestamps = [] } = body;

        if (!title || !title.trim()) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        if (!youtube_url || !youtube_url.trim()) {
            return NextResponse.json({ error: 'YouTube URL is required' }, { status: 400 });
        }

        const videoId = extractYouTubeVideoId(youtube_url);
        if (!videoId) {
            return NextResponse.json({ error: 'Invalid YouTube URL or video ID could not be detected' }, { status: 400 });
        }

        // 1. Insert session
        const { data: session, error: sessionError } = await supabaseAdmin
            .from('film_room_sessions')
            .insert({
                coach_id: user.id,
                title: title.trim(),
                description: description?.trim() || '',
                youtube_url: youtube_url.trim(),
                video_id: videoId,
                target_type: target_type || 'all',
                target_team_id: target_type === 'team' ? target_team_id : null,
                target_player_id: target_type === 'player' ? target_player_id : null,
                tags: tags || []
            })
            .select('*')
            .single();

        if (sessionError || !session) {
            console.error('Session insert error:', sessionError);
            return NextResponse.json({ error: sessionError?.message || 'Failed to create film session' }, { status: 500 });
        }

        // 2. Insert timestamps if provided
        let savedTimestamps: any[] = [];
        if (timestamps.length > 0) {
            const timestampRows = timestamps.map((ts, index) => ({
                session_id: session.id,
                timestamp_seconds: Math.max(0, ts.timestamp_seconds || 0),
                timestamp_label: ts.timestamp_label || formatSecondsToLabel(ts.timestamp_seconds || 0),
                title: ts.title?.trim() || `Marker ${index + 1}`,
                notes: ts.notes?.trim() || '',
                sort_order: typeof ts.sort_order === 'number' ? ts.sort_order : index
            }));

            const { data: insertedTs, error: tsError } = await supabaseAdmin
                .from('film_room_timestamps')
                .insert(timestampRows)
                .select('*')
                .order('sort_order', { ascending: true })
                .order('timestamp_seconds', { ascending: true });

            if (tsError) {
                console.error('Timestamps insert error:', tsError);
            } else {
                savedTimestamps = insertedTs || [];
            }
        }

        return NextResponse.json({
            ...session,
            timestamps: savedTimestamps
        });
    } catch (err: any) {
        console.error('Film Room POST exception:', err);
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
    }
}

// PUT: Update an existing Film Room session and its timestamps
export async function PUT(request: Request) {
    try {
        const auth = await getAuthenticatedUser(request);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { user, profile, supabaseAdmin } = auth;
        const isCoachOrAdmin = profile && ['coach', 'admin', 'sys-admin'].includes(profile.role);

        if (!isCoachOrAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = (await request.json()) as CreateFilmRoomSessionInput;
        const { id, title, description, youtube_url, target_type, target_team_id, target_player_id, tags, timestamps } = body;

        if (!id) {
            return NextResponse.json({ error: 'Session ID is required for update' }, { status: 400 });
        }

        // Verify session existence and permissions
        const { data: existingSession, error: checkError } = await supabaseAdmin
            .from('film_room_sessions')
            .select('id, coach_id')
            .eq('id', id)
            .single();

        if (checkError || !existingSession) {
            return NextResponse.json({ error: 'Film session not found' }, { status: 404 });
        }

        // Check ownership unless admin/sys-admin
        if (existingSession.coach_id !== user.id && !['admin', 'sys-admin'].includes(profile.role)) {
            return NextResponse.json({ error: 'Unauthorized to edit this session' }, { status: 403 });
        }

        // Prepare updates
        const updateData: any = { updated_at: new Date().toISOString() };
        if (title !== undefined) updateData.title = title.trim();
        if (description !== undefined) updateData.description = description.trim();
        if (youtube_url !== undefined) {
            const videoId = extractYouTubeVideoId(youtube_url);
            if (!videoId) {
                return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
            }
            updateData.youtube_url = youtube_url.trim();
            updateData.video_id = videoId;
        }
        if (target_type !== undefined) updateData.target_type = target_type;
        if (target_team_id !== undefined) updateData.target_team_id = target_type === 'team' ? target_team_id : null;
        if (target_player_id !== undefined) updateData.target_player_id = target_type === 'player' ? target_player_id : null;
        if (tags !== undefined) updateData.tags = tags;

        const { data: updatedSession, error: updateError } = await supabaseAdmin
            .from('film_room_sessions')
            .update(updateData)
            .eq('id', id)
            .select('*')
            .single();

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        // Replace timestamps if provided
        let savedTimestamps: any[] = [];
        if (Array.isArray(timestamps)) {
            // Delete existing timestamps and re-insert fresh list
            await supabaseAdmin
                .from('film_room_timestamps')
                .delete()
                .eq('session_id', id);

            if (timestamps.length > 0) {
                const timestampRows = timestamps.map((ts, index) => ({
                    session_id: id,
                    timestamp_seconds: Math.max(0, ts.timestamp_seconds || 0),
                    timestamp_label: ts.timestamp_label || formatSecondsToLabel(ts.timestamp_seconds || 0),
                    title: ts.title?.trim() || `Marker ${index + 1}`,
                    notes: ts.notes?.trim() || '',
                    sort_order: typeof ts.sort_order === 'number' ? ts.sort_order : index
                }));

                const { data: insertedTs, error: tsError } = await supabaseAdmin
                    .from('film_room_timestamps')
                    .insert(timestampRows)
                    .select('*')
                    .order('sort_order', { ascending: true })
                    .order('timestamp_seconds', { ascending: true });

                if (tsError) {
                    console.error('Error re-inserting timestamps:', tsError);
                } else {
                    savedTimestamps = insertedTs || [];
                }
            }
        }

        return NextResponse.json({
            ...updatedSession,
            timestamps: savedTimestamps
        });
    } catch (err: any) {
        console.error('Film Room PUT exception:', err);
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE: Delete a Film Room session
export async function DELETE(request: Request) {
    try {
        const auth = await getAuthenticatedUser(request);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { user, profile, supabaseAdmin } = auth;
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('id');

        if (!sessionId) {
            return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
        }

        const isCoachOrAdmin = profile && ['coach', 'admin', 'sys-admin'].includes(profile.role);
        if (!isCoachOrAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Verify ownership
        const { data: session } = await supabaseAdmin
            .from('film_room_sessions')
            .select('id, coach_id')
            .eq('id', sessionId)
            .single();

        if (!session) {
            return NextResponse.json({ error: 'Film session not found' }, { status: 404 });
        }

        if (session.coach_id !== user.id && !['admin', 'sys-admin'].includes(profile.role)) {
            return NextResponse.json({ error: 'Unauthorized to delete this session' }, { status: 403 });
        }

        const { error } = await supabaseAdmin
            .from('film_room_sessions')
            .delete()
            .eq('id', sessionId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Film session deleted' });
    } catch (err: any) {
        console.error('Film Room DELETE exception:', err);
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
    }
}
