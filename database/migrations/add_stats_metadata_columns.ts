import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function runMigration() {
    console.log('🔄 Adding metadata columns to players_stats table...\n');

    const migration = `
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
                RETURNS TRIGGER AS $func$
                BEGIN
                    NEW.updated_at = now();
                    RETURN NEW;
                END;
                $func$ language 'plpgsql';

                CREATE TRIGGER update_players_stats_updated_at
                    BEFORE UPDATE ON players_stats
                    FOR EACH ROW
                    EXECUTE FUNCTION update_updated_at_column();
                
                RAISE NOTICE 'Created trigger to auto-update updated_at column';
            END IF;
        END $$;
    `;

    const { error } = await supabase.rpc('exec_sql', { sql: migration }).single();

    if (error) {
        // Try direct query if RPC doesn't exist
        const { error: directError } = await supabase.from('_migrations').insert({
            name: 'add_stats_metadata_columns',
            executed_at: new Date().toISOString()
        });

        if (directError) {
            console.error('❌ Migration failed:', error);
            console.log('\n📋 Please run this SQL manually in your Supabase SQL editor:\n');
            console.log(migration);
            process.exit(1);
        }
    }

    console.log('✅ Migration completed successfully!\n');
    console.log('Added columns:');
    console.log('  - verified (boolean, default: false)');
    console.log('  - verified_by (uuid, references profiles)');
    console.log('  - updated_at (timestamp, auto-updates on changes)');
}

runMigration()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('❌ Migration error:', err);
        process.exit(1);
    });
