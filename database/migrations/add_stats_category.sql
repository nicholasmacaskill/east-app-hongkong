-- Add category column to players_stats table
-- This allows us to store different sports in the same table

DO $$ 
BEGIN
    -- Add category column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'players_stats' AND column_name = 'category'
    ) THEN
        ALTER TABLE players_stats ADD COLUMN category text;
        RAISE NOTICE 'Added category column to players_stats';
    END IF;

    -- Create index on category for better query performance
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'players_stats' AND indexname = 'idx_players_stats_category'
    ) THEN
        CREATE INDEX idx_players_stats_category ON players_stats(category);
        RAISE NOTICE 'Created index on category column';
    END IF;

    -- Create GIN index on stats JSONB column for better JSONB query performance
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'players_stats' AND indexname = 'idx_players_stats_stats_gin'
    ) THEN
        CREATE INDEX idx_players_stats_stats_gin ON players_stats USING GIN(stats);
        RAISE NOTICE 'Created GIN index on stats column';
    END IF;

    -- Add unique constraint on (player_id, category) if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'players_stats_player_category_unique'
    ) THEN
        ALTER TABLE players_stats 
        ADD CONSTRAINT players_stats_player_category_unique 
        UNIQUE (player_id, category);
        RAISE NOTICE 'Added unique constraint on (player_id, category)';
    END IF;
END $$;
