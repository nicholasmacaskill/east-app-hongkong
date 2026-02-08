import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function migrate() {
    console.log('🚀 Starting Leaderboard CMS Schema Migration...');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('❌ Missing credentials in .env.local');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const sql = `
        CREATE TABLE IF NOT EXISTS public.leaderboard_entries (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            sport TEXT NOT NULL, -- 'hockey', 'golf', 'hyrox', 'team_standings'
            category TEXT NOT NULL, -- 'players', 'goalies', 'teams', etc.
            name TEXT NOT NULL,
            team TEXT,
            avatar_url TEXT,
            stats JSONB DEFAULT '{}'::JSONB,
            rank INTEGER,
            year TEXT DEFAULT '2025-2026 Winter',
            division TEXT DEFAULT 'All',
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Enable RLS
        ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;

        -- Policies
        DROP POLICY IF EXISTS "Public can view leaderboard entries" ON public.leaderboard_entries;
        CREATE POLICY "Public can view leaderboard entries"
        ON public.leaderboard_entries FOR SELECT
        USING (true);

        -- Grant Access
        GRANT SELECT ON public.leaderboard_entries TO anon, authenticated;
        GRANT ALL ON public.leaderboard_entries TO service_role;
    `;

    // Note: We'll use a raw SQL execution if possible, or run it through the supabase client
    // Since we don't have a direct 'sql' execution on the client, we usually rely on a helper or RPC
    // Looking at previous migrations, they often use a 'run_sql' RPC if available, or we just execute via a DB tool.
    // However, I'll try to use the run_sql RPC which seems to be present in this project based on add_membership_columns.ts

    const { error } = await supabase.rpc('run_sql', { sql });

    if (error) {
        console.error('❌ Migration Failed:', error);
        // Optional: If RPC fails, remind user to run it manually in Supabase SQL editor
        console.log('SQL to run manually:\n', sql);
        process.exit(1);
    }

    console.log('✅ Leaderboard CMS Schema Migration Successful!');
}

migrate();
