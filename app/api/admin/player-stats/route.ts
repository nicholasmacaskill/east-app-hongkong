// app/api/admin/player-stats/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';

export async function POST(request: Request) {
    try {
        const { playerId, stats, category = 'season_2024' } = await request.json();

        if (!playerId || !stats) {
            return NextResponse.json({ error: 'Missing playerId or stats' }, { status: 400 });
        }

        const supabaseAdmin = getSupabaseAdmin();

        // Check if stats exist for this player and category
        const { data: existing } = await supabaseAdmin
            .from('players_stats')
            .select('id')
            .eq('player_id', playerId)
            .eq('category', category)
            .single();

        if (existing) {
            // Update existing
            const { error } = await supabaseAdmin
                .from('players_stats')
                .update({
                    stats: stats,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existing.id);

            if (error) throw error;
        } else {
            // Insert new
            const { error } = await supabaseAdmin
                .from('players_stats')
                .insert({
                    player_id: playerId,
                    category: category,
                    stats: stats,
                    verified: false
                });

            if (error) throw error;
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Player stats save error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const playerId = searchParams.get('playerId');
        const category = searchParams.get('category') || 'season_2024';

        if (!playerId) {
            return NextResponse.json({ error: 'Missing playerId' }, { status: 400 });
        }

        const supabaseAdmin = getSupabaseAdmin();

        const { data, error } = await supabaseAdmin
            .from('players_stats')
            .select('*')
            .eq('player_id', playerId)
            .eq('category', category)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = not found
            throw error;
        }

        return NextResponse.json({ stats: data?.stats || null });

    } catch (error: any) {
        console.error('Player stats fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
