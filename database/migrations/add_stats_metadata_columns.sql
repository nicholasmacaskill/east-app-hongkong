-- Add missing metadata columns to players_stats table
-- These columns are in the schema but may not exist in the actual database

DO $$ 
BEGIN
    -- Add verified column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'players_stats' AND column_name = 'verified'
    ) THEN
        ALTER TABLE players_stats ADD COLUMN verified boolean DEFAULT false;
        RAISE NOTICE 'Added verified column to players_stats';
    END IF;

    -- Add verified_by column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'players_stats' AND column_name = 'verified_by'
    ) THEN
        ALTER TABLE players_stats ADD COLUMN verified_by uuid REFERENCES profiles(id);
        RAISE NOTICE 'Added verified_by column to players_stats';
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'players_stats' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE players_stats ADD COLUMN updated_at timestamp with time zone DEFAULT now();
        RAISE NOTICE 'Added updated_at column to players_stats';
    END IF;

    -- Create trigger to auto-update updated_at on row changes
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_players_stats_updated_at'
    ) THEN
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = now();
            RETURN NEW;
        END;
        $$ language 'plpgsql';

        CREATE TRIGGER update_players_stats_updated_at
            BEFORE UPDATE ON players_stats
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        
        RAISE NOTICE 'Created trigger to auto-update updated_at column';
    END IF;
END $$;
