// Add stats JSONB column to players_stats table
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function addStatsColumn() {
    console.log('Adding stats JSONB column to players_stats...\n');

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });

    try {
        // Add stats column
        await pool.query(`
            ALTER TABLE players_stats 
            ADD COLUMN IF NOT EXISTS stats jsonb DEFAULT '{}'::jsonb;
        `);
        console.log('✓ Stats JSONB column added');

        // Create GIN index on stats
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_players_stats_stats_gin 
            ON players_stats USING GIN(stats);
        `);
        console.log('✓ GIN index on stats created');

        // Add unique constraint on (player_id, category)
        await pool.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint 
                    WHERE conname = 'players_stats_player_category_unique'
                ) THEN
                    ALTER TABLE players_stats 
                    ADD CONSTRAINT players_stats_player_category_unique 
                    UNIQUE (player_id, category);
                END IF;
            END $$;
        `);
        console.log('✓ Unique constraint on (player_id, category) added');

        console.log('\n✅ Database migration completed successfully!');
    } catch (error) {
        console.error('Migration failed:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

addStatsColumn();
