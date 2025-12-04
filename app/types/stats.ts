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