-- Add RLS policies for players_stats table
-- This allows sys-admin users to manage stats while keeping data secure

-- Enable RLS on players_stats if not already enabled
ALTER TABLE players_stats ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "sys_admin_all_access" ON players_stats;
DROP POLICY IF EXISTS "players_read_own_stats" ON players_stats;
DROP POLICY IF EXISTS "public_read_stats" ON players_stats;

-- Policy 1: sys-admin users have full access (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "sys_admin_all_access" ON players_stats
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'sys-admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'sys-admin'
        )
    );

-- Policy 2: Players can read their own stats
CREATE POLICY "players_read_own_stats" ON players_stats
    FOR SELECT
    TO authenticated
    USING (player_id = auth.uid());

-- Policy 3: Public (unauthenticated) users can read all stats for leaderboard
CREATE POLICY "public_read_stats" ON players_stats
    FOR SELECT
    TO anon
    USING (true);
