// app/api/admin/leaderboard/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const sport = searchParams.get('sport');
        const year = searchParams.get('year') || '2025-2026 Winter';
        const division = searchParams.get('division');

        const supabaseAdmin = getSupabaseAdmin();

        let query = supabaseAdmin
            .from('leaderboard_entries')
            .select('*')
            .eq('year', year);

        if (sport) {
            query = query.eq('sport', sport);
        }
        if (division && division !== 'All') {
            query = query.eq('division', division);
        }

        const { data, error } = await query.order('rank', { ascending: true });

        if (error) throw error;

        return NextResponse.json(data);

    } catch (error: any) {
        console.error('Leaderboard fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, sport, category, name, team, avatar_url, stats, rank, year, division } = body;

        if (!sport || !category || !name) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabaseAdmin = getSupabaseAdmin();

        const payload = {
            sport,
            category,
            name,
            team,
            avatar_url,
            stats,
            rank,
            year: year || '2025-2026 Winter',
            division: division || 'All',
            updated_at: new Date().toISOString()
        };

        if (id) {
            // Update existing
            const { error } = await supabaseAdmin
                .from('leaderboard_entries')
                .update(payload)
                .eq('id', id);

            if (error) throw error;
        } else {
            // Insert new
            const { error } = await supabaseAdmin
                .from('leaderboard_entries')
                .insert(payload);

            if (error) throw error;
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Leaderboard save error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing entry ID' }, { status: 400 });
        }

        const supabaseAdmin = getSupabaseAdmin();
        const { error } = await supabaseAdmin
            .from('leaderboard_entries')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Leaderboard delete error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
