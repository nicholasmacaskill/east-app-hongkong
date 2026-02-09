// Add category column to players_stats using direct SQL
const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
    console.log('Running stats category migration via direct SQL...');

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });

    try {
        // Add category column
        await pool.query(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'players_stats' AND column_name = 'category'
                ) THEN
                    ALTER TABLE players_stats ADD COLUMN category text;
                END IF;
            END $$;
        `);
        console.log('✓ Category column added/verified');

        // Create index on category
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_players_stats_category 
            ON players_stats(category);
        `);
        console.log('✓ Category index created');

        // Create GIN index on stats JSONB
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_players_stats_stats_gin 
            ON players_stats USING GIN(stats);
        `);
        console.log('✓ GIN index on stats created');

        console.log('\n✅ Migration completed successfully!');
    } catch (error) {
        console.error('Migration failed:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigration();
