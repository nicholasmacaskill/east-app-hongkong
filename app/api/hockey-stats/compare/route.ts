import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { HockeyCardCareerTotals, PlayerHockeyStat } from '@/app/types/stats';

function computeCareerTotals(stats: PlayerHockeyStat[]): HockeyCardCareerTotals {
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

  return {
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
}

export async function GET(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const p1Id = searchParams.get('player1');
    const p2Id = searchParams.get('player2');

    if (!p1Id || !p2Id) {
      return NextResponse.json({ error: 'Please provide both player1 and player2 IDs' }, { status: 400 });
    }

    // Fetch both profiles
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, first_name, last_name, username, avatar_url, team, bio')
      .in('id', [p1Id, p2Id]);

    if (profileError || !profiles || profiles.length === 0) {
      return NextResponse.json({ error: 'Could not fetch athlete profiles' }, { status: 404 });
    }

    const player1Profile = profiles.find((p) => p.id === p1Id) || null;
    const player2Profile = profiles.find((p) => p.id === p2Id) || null;

    if (!player1Profile || !player2Profile) {
      return NextResponse.json({ error: 'One or both players not found' }, { status: 404 });
    }

    // Fetch stats for both players
    const { data: statsData } = await supabaseAdmin
      .from('player_hockey_stats')
      .select('*')
      .in('player_id', [p1Id, p2Id])
      .order('season', { ascending: false });

    const p1Stats = (statsData || []).filter((s) => s.player_id === p1Id);
    const p2Stats = (statsData || []).filter((s) => s.player_id === p2Id);

    const p1Totals = computeCareerTotals(p1Stats);
    const p2Totals = computeCareerTotals(p2Stats);

    const comparisonMetrics = [
      {
        metric: 'Total Points',
        key: 'total_points',
        p1: p1Totals.total_points,
        p2: p2Totals.total_points,
        leader: p1Totals.total_points > p2Totals.total_points ? 'player1' : p2Totals.total_points > p1Totals.total_points ? 'player2' : 'tie',
      },
      {
        metric: 'Total Goals',
        key: 'total_goals',
        p1: p1Totals.total_goals,
        p2: p2Totals.total_goals,
        leader: p1Totals.total_goals > p2Totals.total_goals ? 'player1' : p2Totals.total_goals > p1Totals.total_goals ? 'player2' : 'tie',
      },
      {
        metric: 'Total Assists',
        key: 'total_assists',
        p1: p1Totals.total_assists,
        p2: p2Totals.total_assists,
        leader: p1Totals.total_assists > p2Totals.total_assists ? 'player1' : p2Totals.total_assists > p1Totals.total_assists ? 'player2' : 'tie',
      },
      {
        metric: 'Points Per Game',
        key: 'ppg',
        p1: p1Totals.total_gp > 0 ? Number((p1Totals.total_points / p1Totals.total_gp).toFixed(2)) : 0,
        p2: p2Totals.total_gp > 0 ? Number((p2Totals.total_points / p2Totals.total_gp).toFixed(2)) : 0,
        leader:
          (p1Totals.total_gp > 0 ? p1Totals.total_points / p1Totals.total_gp : 0) >
          (p2Totals.total_gp > 0 ? p2Totals.total_points / p2Totals.total_gp : 0)
            ? 'player1'
            : (p2Totals.total_gp > 0 ? p2Totals.total_points / p2Totals.total_gp : 0) >
              (p1Totals.total_gp > 0 ? p1Totals.total_points / p1Totals.total_gp : 0)
            ? 'player2'
            : 'tie',
      },
      {
        metric: 'Games Played',
        key: 'total_gp',
        p1: p1Totals.total_gp,
        p2: p2Totals.total_gp,
        leader: p1Totals.total_gp > p2Totals.total_gp ? 'player1' : p2Totals.total_gp > p1Totals.total_gp ? 'player2' : 'tie',
      },
      {
        metric: 'Tournaments Competed',
        key: 'total_tournaments',
        p1: p1Totals.total_tournaments,
        p2: p2Totals.total_tournaments,
        leader: p1Totals.total_tournaments > p2Totals.total_tournaments ? 'player1' : p2Totals.total_tournaments > p1Totals.total_tournaments ? 'player2' : 'tie',
      },
      {
        metric: 'Penalty Minutes (PIM)',
        key: 'total_pim',
        p1: p1Totals.total_pim,
        p2: p2Totals.total_pim,
        leader: p1Totals.total_pim < p2Totals.total_pim ? 'player1' : p2Totals.total_pim < p1Totals.total_pim ? 'player2' : 'tie',
      },
    ];

    return NextResponse.json({
      success: true,
      player1: {
        profile: player1Profile,
        stats: p1Stats,
        careerTotals: p1Totals,
      },
      player2: {
        profile: player2Profile,
        stats: p2Stats,
        careerTotals: p2Totals,
      },
      comparisonMetrics,
    });
  } catch (error: any) {
    console.error('Player comparison error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
