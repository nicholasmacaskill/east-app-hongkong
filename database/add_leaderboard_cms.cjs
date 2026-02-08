const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
try {
    const envPath = path.resolve(__dirname, '..', '.env.local');
    if (fs.existsSync(envPath)) {
        const envFile = fs.readFileSync(envPath, 'utf8');
        envFile.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                const val = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
                process.env[key.trim()] = val;
            }
        });
        console.log('Loaded .env.local');
    }
} catch (e) {
    console.warn("Warning: Could not read .env.local", e.message);
}

async function migrate() {
    console.log('🚀 Starting Leaderboard CMS Schema Migration (via RPC)...');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        console.error('❌ Missing credentials in .env.local');
        process.exit(1);
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
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leaderboard_entries' AND policyname = 'Public can view leaderboard entries') THEN
                CREATE POLICY "Public can view leaderboard entries"
                ON public.leaderboard_entries FOR SELECT
                USING (true);
            END IF;
        END $$;

        -- Grant Access
        GRANT SELECT ON public.leaderboard_entries TO anon, authenticated;
        GRANT ALL ON public.leaderboard_entries TO service_role;
    `;

    const { error } = await supabase.rpc('run_sql', { sql_query: sql });

    if (error) {
        console.error('❌ Migration Failed (RPC Error):', error);
        process.exit(1);
    }

    console.log('✅ Leaderboard CMS Schema Migration Successful!');
}

migrate();
