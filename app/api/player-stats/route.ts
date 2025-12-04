// File: east-app-recent/app/api/player-stats/route.ts

import { NextResponse } from 'next/server';
// import { Pool } from 'pg'; 
import { PlayerStats } from '@/app/types/stats'; 

// 1. MOCK DATA FOR TESTING (Instantly resolves the 500 error)
const mockStats: PlayerStats = {
  age: 29, 
  season: 5, 
  team: 'SHARKS', 
  games_played_season: 80, 
  games_played_total: 450,
  games_missed_healthy: 0, 
  games_missed_injured: 2, 
  goals_season: 45, 
  goals_total: 150,
  assists_season: 55, 
  assists_total: 250,
  gp: 10,
  points: 100,
  gwg: 5,
  ppg: 10,
  shg: 2,
  pim: 30,
  top_scorer_team: true,
  top_scorer_league: false,
  least_pim_team: true,
  most_shots_team: true,
};

// The GET handler returns the mock data immediately.
export async function GET(request: Request) {
  if (request.method !== 'GET') {
    return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
  }

  try {
    // ⬅️ MOCKING ENABLED: Return static data for testing frontend logic
    return NextResponse.json(mockStats, { status: 200 });

  } catch (error) {
    console.error('API Error:', error);
    // Returning 500 here helps identify live connection issues later
    return NextResponse.json({ 
      message: 'Internal Server Error (Mocking failed or file corrupted).',
    }, { status: 500 });
  }
}