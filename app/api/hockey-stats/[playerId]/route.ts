import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { HockeyCardCareerTotals, PlayerHockeyStat } from '@/app/types/stats';

export async function GET(request: Request, { params }: { params: Promise<{ playerId: string }> }) {
  try {
    const { playerId } = await params;

    if (!playerId) {
      return NextResponse.json({ error: 'Missing playerId' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('player_hockey_stats')
      .select('*')
      .eq('player_id', playerId)
      .order('season', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching player hockey stats:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const stats: PlayerHockeyStat[] = data || [];

    // Calculate career totals
    let totalGp = 0;
    let totalGoals = 0;
    let totalAssists = 0;
    let totalPoints = 0;
    let totalPim = 0;
    let totalPpg = 0;
    let totalGwg = 0;
    let totalWins = 0;
    let totalLosses = 0;
    let totalShutouts = 0;
    let weightedGaaSum = 0;
    let weightedSavePctSum = 0;
    let goalieGames = 0;

    stats.forEach((row) => {
      totalGp += row.gp || 0;
      totalGoals += row.goals || 0;
      totalAssists += row.assists || 0;
      totalPoints += row.points || 0;
      totalPim += row.pim || 0;
      totalPpg += row.ppg || 0;
      totalGwg += row.gwg || 0;

      if (row.position_type === 'GOALIE' && (row.gp || 0) > 0) {
        totalWins += row.wins || 0;
        totalLosses += row.losses || 0;
        totalShutouts += row.shutouts || 0;
        weightedGaaSum += (row.gaa || 0) * (row.gp || 1);
        weightedSavePctSum += (row.save_pct || 0) * (row.gp || 1);
        goalieGames += row.gp || 1;
      }
    });

    const careerTotals: HockeyCardCareerTotals = {
      total_gp: totalGp,
      total_goals: totalGoals,
      total_assists: totalAssists,
      total_points: totalPoints,
      total_pim: totalPim,
      total_ppg: totalPpg,
      total_gwg: totalGwg,
      total_wins: totalWins,
      total_losses: totalLosses,
      total_shutouts: totalShutouts,
      avg_gaa: goalieGames > 0 ? Number((weightedGaaSum / goalieGames).toFixed(2)) : 0,
      avg_save_pct: goalieGames > 0 ? Number((weightedSavePctSum / goalieGames).toFixed(3)) : 0,
      total_tournaments: stats.length,
    };

    return NextResponse.json({
      success: true,
      stats,
      careerTotals,
    });
  } catch (error: any) {
    console.error('Player hockey stats fetch error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
