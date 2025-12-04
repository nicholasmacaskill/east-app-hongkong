// Run with: npx ts-node app/db/seed.ts
import pool from '@/app/lib/db';

async function seedDatabase() {
  try {
    await pool.query(`
      INSERT INTO players_stats (
        player_id, age, season, team, games_played_season, games_played_total,
        games_missed_healthy, games_missed_injured, goals_season, goals_total,
        assists_season, assists_total, gp, points, gwg, ppg, shg, pim,
        top_scorer_team, top_scorer_league, least_pim_team, most_shots_team
      ) VALUES (
        12, 31, 3, 'RHINOS', 48, 194, 1, 7, 110, 300, 50, 120, 3, 6, 1, 1, 34, 10,
        true, true, true, true
      )
      ON CONFLICT (player_id) DO UPDATE SET
        age = 31, season = 3, team = 'RHINOS'
    `);
    console.log('Database seeded successfully');
  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    await pool.end();
  }
}

seedDatabase();