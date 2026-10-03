import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Check which environment to run against (.env.local or .env.test)
const envFile = process.argv[2] === 'test' ? '.env.test' : '.env.local';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error(`❌ Missing credentials in ${envFile}`);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    console.log(`🚀 Running Player Hockey Stats Migration on ${envFile}...`);

    const sql = `
        -- 1. Create player_hockey_stats table for competition, tournament and league tracking
        CREATE TABLE IF NOT EXISTS public.player_hockey_stats (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
            season TEXT NOT NULL,
            team_name TEXT NOT NULL,
            division TEXT NOT NULL DEFAULT 'U13',
            competition_name TEXT NOT NULL,
            competition_type TEXT NOT NULL DEFAULT 'TOURNAMENT' CHECK (competition_type IN ('TOURNAMENT', 'LEAGUE', 'EXHIBITION', 'CAMP')),
            position_type TEXT NOT NULL DEFAULT 'SKATER' CHECK (position_type IN ('SKATER', 'GOALIE')),
            jersey_number INTEGER,
            position TEXT,
            
            -- Skater stats
            gp INTEGER DEFAULT 0,
            goals INTEGER DEFAULT 0,
            assists INTEGER DEFAULT 0,
            points INTEGER DEFAULT 0,
            pim INTEGER DEFAULT 0,
            ppg INTEGER DEFAULT 0,
            shg INTEGER DEFAULT 0,
            gwg INTEGER DEFAULT 0,

            -- Goalie stats
            minutes_played INTEGER DEFAULT 0,
            wins INTEGER DEFAULT 0,
            losses INTEGER DEFAULT 0,
            otl INTEGER DEFAULT 0,
            goals_against INTEGER DEFAULT 0,
            gaa NUMERIC(4,2) DEFAULT 0.00,
            shots_against INTEGER DEFAULT 0,
            saves INTEGER DEFAULT 0,
            save_pct NUMERIC(5,3) DEFAULT 0.000,
            shutouts INTEGER DEFAULT 0,

            accolades TEXT[] DEFAULT '{}'::TEXT[],
            is_verified BOOLEAN DEFAULT true,
            verified_by UUID REFERENCES public.profiles(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

            CONSTRAINT unique_player_season_competition UNIQUE (player_id, season, competition_name, team_name)
        );

        -- 2. Indexes
        CREATE INDEX IF NOT EXISTS idx_player_hockey_stats_player_id ON public.player_hockey_stats(player_id);
        CREATE INDEX IF NOT EXISTS idx_player_hockey_stats_season ON public.player_hockey_stats(season);
        CREATE INDEX IF NOT EXISTS idx_player_hockey_stats_competition ON public.player_hockey_stats(competition_name);
        CREATE INDEX IF NOT EXISTS idx_player_hockey_stats_team ON public.player_hockey_stats(team_name);

        -- 3. Row Level Security
        ALTER TABLE public.player_hockey_stats ENABLE ROW LEVEL SECURITY;

        -- Drop existing policies if re-running
        DROP POLICY IF EXISTS "Public and players can view hockey competition stats" ON public.player_hockey_stats;
        DROP POLICY IF EXISTS "Admins and coaches can manage hockey competition stats" ON public.player_hockey_stats;

        -- View policy: public / authenticated read
        CREATE POLICY "Public and players can view hockey competition stats" ON public.player_hockey_stats
            FOR SELECT
            USING (true);

        -- Manage policy: Admins, sys-admins, and coaches
        CREATE POLICY "Admins and coaches can manage hockey competition stats" ON public.player_hockey_stats
            FOR ALL TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM public.profiles p
                    WHERE p.id = auth.uid() AND p.role IN ('admin', 'sys-admin', 'coach')
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.profiles p
                    WHERE p.id = auth.uid() AND p.role IN ('admin', 'sys-admin', 'coach')
                )
            );

        -- 4. Grants
        GRANT ALL ON public.player_hockey_stats TO service_role;
        GRANT SELECT ON public.player_hockey_stats TO anon, authenticated;
        GRANT INSERT, UPDATE, DELETE ON public.player_hockey_stats TO authenticated;
    `;

    const { error } = await supabase.rpc('run_sql', { sql_query: sql });

    if (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }

    console.log('✅ player_hockey_stats table created successfully with RLS and indexes!');
}

runMigration();
