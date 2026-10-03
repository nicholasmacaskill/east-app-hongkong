import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { TournamentBatchPayload } from '@/app/types/stats';

export async function POST(request: Request) {
  try {
    const payload: TournamentBatchPayload = await request.json();
    const { season, team_name, division, competition_name, competition_type, stats } = payload;

    if (!season || !team_name || !competition_name || !stats || !Array.isArray(stats) || stats.length === 0) {
      return NextResponse.json({ error: 'Missing required tournament information or empty stats list' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Prepare rows for upsert
    const rowsToUpsert = stats
      .filter((s) => s.player_id)
      .map((s) => ({
        player_id: s.player_id,
        season,
        team_name,
        division: division || 'U13',
        competition_name,
        competition_type: competition_type || 'TOURNAMENT',
        position_type: s.position_type || 'SKATER',
        jersey_number: s.jersey_number || null,
        position: s.position || null,
        gp: s.gp || 0,
        goals: s.goals || 0,
        assists: s.assists || 0,
        points: (s.goals || 0) + (s.assists || 0),
        pim: s.pim || 0,
        ppg: s.ppg || 0,
        shg: s.shg || 0,
        gwg: s.gwg || 0,
        minutes_played: s.minutes_played || 0,
        wins: s.wins || 0,
        losses: s.losses || 0,
        otl: s.otl || 0,
        goals_against: s.goals_against || 0,
        gaa: s.gaa || 0,
        shots_against: s.shots_against || 0,
        saves: s.saves || 0,
        save_pct: s.save_pct || 0,
        shutouts: s.shutouts || 0,
        accolades: s.accolades || [],
        is_verified: true,
        updated_at: new Date().toISOString(),
      }));

    if (rowsToUpsert.length === 0) {
      return NextResponse.json({ error: 'No matched players selected to save' }, { status: 400 });
    }

    // Upsert into player_hockey_stats using unique constraint (player_id, season, competition_name, team_name)
    const { error: upsertError } = await supabaseAdmin
      .from('player_hockey_stats')
      .upsert(rowsToUpsert, {
        onConflict: 'player_id,season,competition_name,team_name',
      });

    if (upsertError) {
      console.error('Batch save error:', upsertError);
      return NextResponse.json({ error: upsertError.message || 'Failed to save stats' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      savedCount: rowsToUpsert.length,
      competition_name,
      season,
    });
  } catch (error: any) {
    console.error('Tournament batch save error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
