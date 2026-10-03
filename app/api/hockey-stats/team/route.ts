import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';

export async function GET(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const division = searchParams.get('division') || 'U13';
    const season = searchParams.get('season');
    const competition = searchParams.get('competition');

    // 1. Fetch competition stats for this team/division
    let query = supabaseAdmin
      .from('player_hockey_stats')
      .select('*, profiles:profiles!player_hockey_stats_player_id_fkey(id, first_name, last_name, username, avatar_url, team)');

    if (division && division !== 'ALL') {
      query = query.ilike('division', `%${division}%`);
    }

    if (season && season !== 'ALL') {
      query = query.eq('season', season);
    }

    if (competition && competition !== 'ALL') {
      query = query.eq('competition_name', competition);
    }

    const { data: statsData, error: statsError } = await query;
    if (statsError) {
      console.error('Error fetching team stats:', statsError);
      return NextResponse.json({ error: statsError.message }, { status: 500 });
    }

    // 2. Also fetch all active roster players in profiles for this division
    // so we can show full roster even if some players haven't logged tournament stats yet
    let rosterQuery = supabaseAdmin
      .from('profiles')
      .select('id, first_name, last_name, username, avatar_url, team')
      .eq('role', 'player');

    if (division && division !== 'ALL') {
      rosterQuery = rosterQuery.ilike('team', `%${division}%`);
    }

    const { data: rosterData } = await rosterQuery;

    // Aggregate stats by player for the selected view
    const playerStatsMap: Record<string, any> = {};

    (statsData || []).forEach((row: any) => {
      const pid = row.player_id;
      const prof = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      if (!playerStatsMap[pid]) {
        playerStatsMap[pid] = {
          player_id: pid,
          profile: prof,
          jersey_number: row.jersey_number,
          position: row.position || (row.position_type === 'GOALIE' ? 'G' : 'F'),
          position_type: row.position_type,
          division: row.division,
          season: row.season,
          gp: 0,
          goals: 0,
          assists: 0,
          points: 0,
          pim: 0,
          ppg: 0,
          shg: 0,
          gwg: 0,
          // Goalie
          minutes_played: 0,
          wins: 0,
          losses: 0,
          goals_against: 0,
          shots_against: 0,
          saves: 0,
          shutouts: 0,
          competitions: [] as string[],
        };
      }

      const p = playerStatsMap[pid];
      p.gp += row.gp || 0;
      p.goals += row.goals || 0;
      p.assists += row.assists || 0;
      p.points += row.points || 0;
      p.pim += row.pim || 0;
      p.ppg += row.ppg || 0;
      p.shg += row.shg || 0;
      p.gwg += row.gwg || 0;

      p.minutes_played += row.minutes_played || 0;
      p.wins += row.wins || 0;
      p.losses += row.losses || 0;
      p.goals_against += row.goals_against || 0;
      p.shots_against += row.shots_against || 0;
      p.saves += row.saves || 0;
      p.shutouts += row.shutouts || 0;

      if (!p.competitions.includes(row.competition_name)) {
        p.competitions.push(row.competition_name);
      }
    });

    // Merge in roster players who haven't logged stats yet
    (rosterData || []).forEach((prof: any) => {
      if (!playerStatsMap[prof.id]) {
        playerStatsMap[prof.id] = {
          player_id: prof.id,
          profile: prof,
          jersey_number: null,
          position: 'F',
          position_type: 'SKATER',
          division: division || 'U13',
          season: season || '2024-25',
          gp: 0,
          goals: 0,
          assists: 0,
          points: 0,
          pim: 0,
          ppg: 0,
          shg: 0,
          gwg: 0,
          minutes_played: 0,
          wins: 0,
          losses: 0,
          goals_against: 0,
          shots_against: 0,
          saves: 0,
          shutouts: 0,
          competitions: [],
        };
      }
    });

    const allAggregated = Object.values(playerStatsMap);

    // Compute PPG (Points per game) and goalie averages
    allAggregated.forEach((p: any) => {
      p.pts_per_game = p.gp > 0 ? Number((p.points / p.gp).toFixed(2)) : 0;
      p.gaa = p.gp > 0 && p.position_type === 'GOALIE' ? Number(((p.goals_against * 60) / Math.max(p.minutes_played, 60)).toFixed(2)) : 0;
      p.save_pct = p.shots_against > 0 ? Number((p.saves / p.shots_against).toFixed(3)) : 0;
    });

    // Split into Skaters and Goalies
    const skaters = allAggregated
      .filter((p: any) => p.position_type !== 'GOALIE')
      .sort((a: any, b: any) => b.points - a.points || b.goals - a.goals || a.profile?.first_name?.localeCompare(b.profile?.first_name));

    const goalies = allAggregated
      .filter((p: any) => p.position_type === 'GOALIE')
      .sort((a: any, b: any) => b.wins - a.wins || (a.gaa || 99) - (b.gaa || 99));

    // Team summary totals
    const teamSummary = {
      total_players: allAggregated.length,
      total_skaters: skaters.length,
      total_goalies: goalies.length,
      total_goals: skaters.reduce((sum: number, s: any) => sum + s.goals, 0),
      total_assists: skaters.reduce((sum: number, s: any) => sum + s.assists, 0),
      total_points: skaters.reduce((sum: number, s: any) => sum + s.points, 0),
      total_pim: allAggregated.reduce((sum: number, s: any) => sum + s.pim, 0),
      top_scorer: skaters[0] || null,
      top_goal_scorer: [...skaters].sort((a, b) => b.goals - a.goals)[0] || null,
    };

    return NextResponse.json({
      success: true,
      division,
      season: season || '2024-25',
      skaters,
      goalies,
      teamSummary,
    });
  } catch (error: any) {
    console.error('Team stats API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
