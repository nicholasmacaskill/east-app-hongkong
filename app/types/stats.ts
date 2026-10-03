// This interface MUST match the columns selected in your SQL query exactly.
export interface PlayerStats {
  // --- Profile Header (Green Banner) ---
  age: number;
  season: number;
  team: string; // E.g., 'RHINOS'

  // --- Games Row (Streaks tab) ---
  games_played_season: number;
  games_played_total: number;
  games_missed_healthy: number;
  games_missed_injured: number;

  // --- Points Row (Streaks tab) ---
  goals_season: number;
  goals_total: number;
  assists_season: number;
  assists_total: number;

  // --- Full Stats Tab (Scoring/Specials) ---
  gp: number; 
  points: number;
  gwg: number; 
  ppg: number; 
  shg: number; 
  pim: number; 
  
  // --- Milestones (Boolean flags) ---
  top_scorer_team: boolean;
  top_scorer_league: boolean;
  least_pim_team: boolean;
  most_shots_team: boolean;
}

export type HockeyCompetitionType = 'TOURNAMENT' | 'LEAGUE' | 'EXHIBITION' | 'CAMP';
export type HockeyPositionType = 'SKATER' | 'GOALIE';

export interface PlayerHockeyStat {
  id: string;
  player_id: string;
  season: string;               // e.g. "2024-25"
  team_name: string;            // e.g. "EAST Stars U13 (25/26)"
  division: string;             // e.g. "U11", "U13", "U15", "U18"
  competition_name: string;     // e.g. "Quebec International Pee-Wee Tournament"
  competition_type: HockeyCompetitionType;
  position_type: HockeyPositionType;
  jersey_number?: number | null;
  position?: string | null;     // 'F', 'D', 'C', 'LW', 'RW', 'G'

  // Skater stats
  gp: number;
  goals: number;
  assists: number;
  points: number;
  pim: number;
  ppg: number;
  shg: number;
  gwg: number;

  // Goalie stats
  minutes_played?: number;
  wins?: number;
  losses?: number;
  otl?: number;
  goals_against?: number;
  gaa?: number;
  shots_against?: number;
  saves?: number;
  save_pct?: number;
  shutouts?: number;

  accolades?: string[];
  is_verified: boolean;
  verified_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface HockeyCardCareerTotals {
  total_gp: number;
  total_goals: number;
  total_assists: number;
  total_points: number;
  total_pim: number;
  total_ppg: number;
  total_gwg: number;
  // Goalie totals
  total_wins: number;
  total_losses: number;
  total_shutouts: number;
  avg_gaa: number;
  avg_save_pct: number;
  total_tournaments: number;
}

export interface MatchedProfile {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  avatar_url?: string | null;
  team?: string | null;
}

export interface ParsedTournamentRow {
  raw_name: string;
  jersey_number?: number | null;
  position?: string | null;
  position_type: HockeyPositionType;
  gp: number;
  goals: number;
  assists: number;
  points: number;
  pim: number;
  ppg?: number;
  shg?: number;
  gwg?: number;
  // Goalie fields if goalie
  minutes_played?: number;
  wins?: number;
  losses?: number;
  otl?: number;
  goals_against?: number;
  gaa?: number;
  shots_against?: number;
  saves?: number;
  save_pct?: number;
  shutouts?: number;
  // Matching status
  matched_profile: MatchedProfile | null;
  match_confidence: 'exact' | 'high' | 'medium' | 'unmatched';
}

export interface TournamentBatchPayload {
  season: string;
  team_name: string;
  division: string;
  competition_name: string;
  competition_type: HockeyCompetitionType;
  stats: Array<{
    player_id: string;
    position_type: HockeyPositionType;
    jersey_number?: number | null;
    position?: string | null;
    gp: number;
    goals: number;
    assists: number;
    points: number;
    pim: number;
    ppg?: number;
    shg?: number;
    gwg?: number;
    minutes_played?: number;
    wins?: number;
    losses?: number;
    otl?: number;
    goals_against?: number;
    gaa?: number;
    shots_against?: number;
    saves?: number;
    save_pct?: number;
    shutouts?: number;
    accolades?: string[];
  }>;
}