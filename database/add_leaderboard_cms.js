const { Pool } = require('pg');
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
    console.log('--- LEADERBOARD CMS SCHEMA MIGRATION ---');

    const config = {
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT || '54322', 10),
        database: process.env.DB_NAME || 'postgres',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres'
    };

    console.log('Connecting to database...');

    const pool = new Pool(config);
    const client = await pool.connect();

    try {
        console.log('Creating leaderboard_entries table...');

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

            -- Enable RLS if not already enabled
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

        await client.query(sql);
        console.log('✅ Leaderboard entries table created successfully.');

    } catch (e) {
        console.error('❌ Migration failed:', e.message);
    } finally {
        client.release();
        await pool.end();
        console.log('--- MIGRATION FINISHED ---');
    }
}

migrate();
