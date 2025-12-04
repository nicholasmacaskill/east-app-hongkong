// File: east-app-recent/app/db/seed.ts

// ⬅️ FIX: Import and call the new function
const getDbPool = require('../lib/db.ts').default;

async function seedDatabase() {
  // ⬅️ NEW: The pool is now retrieved by calling the function
  const pool = getDbPool(); 
  
  try {
    // ... rest of the code remains the same ...

async function seedDatabase() {
  try {
    // Create table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS players_stats (
        player_id SERIAL PRIMARY KEY,
        age INTEGER,
        season INTEGER,
        team VARCHAR(255),
        games_played_season INTEGER,
        games_played_total INTEGER,
        games_missed_healthy INTEGER,
        games_missed_injured INTEGER,
        goals_season INTEGER,
        goals_total INTEGER,
        assists_season INTEGER,
        assists_total INTEGER,
        gp INTEGER,
        points INTEGER,
        gwg INTEGER,
        ppg INTEGER,
        shg INTEGER,
        pim INTEGER,
        top_scorer_team BOOLEAN,
        top_scorer_league BOOLEAN,
        least_pim_team BOOLEAN,
        most_shots_team BOOLEAN,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert sample player data
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
    console.log('✅ Database seeded successfully');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
  } finally {
    await pool.end();
  }
}

seedDatabase();