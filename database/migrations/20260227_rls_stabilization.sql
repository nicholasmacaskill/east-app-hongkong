
-- RLS Stabilization for Singapore Hosting Environment
-- Consolidates profile security with explicit overrides for system roles

-- 1. Drop conflicting policies
DROP POLICY IF EXISTS "Profiles SELECT policy" ON profiles;
DROP POLICY IF EXISTS "Profiles UPDATE policy" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated select all" ON profiles;
DROP POLICY IF EXISTS "Allow robust update" ON profiles;
DROP POLICY IF EXISTS "Allow admin delete" ON profiles;

-- 2. Profiles SELECT: 
-- Authenticated users need to see basic profile data (names, roles) for the app to function
-- This prevents the "blank screen" issue on the home screen when RLS is first enabled.
CREATE POLICY "Allow select for authenticated" ON profiles
FOR SELECT USING (auth.uid() IS NOT NULL);

-- 3. Profiles UPDATE:
-- Users update self, Parents update child, Admins update all.
CREATE POLICY "Allow update for owners and parents" ON profiles
FOR UPDATE USING (
    auth.uid() = id -- Self
    OR parent_id = auth.uid() -- Parent link column
    OR id IN (SELECT child_id FROM player_relationships WHERE parent_id = auth.uid()) -- Link table
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'sys-admin') -- Admin role
)
WITH CHECK (
    auth.uid() = id
    OR parent_id = auth.uid()
    OR id IN (SELECT child_id FROM player_relationships WHERE parent_id = auth.uid())
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'sys-admin')
);

-- 4. Registry Read Access (Required for home screen sessions)
-- Ensure 'session_types' and 'sessions' are globally readable by authenticated users
-- (Sometimes migration resets these to restricted)
ALTER TABLE session_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Session Types" ON session_types;
CREATE POLICY "Public Read Session Types" ON session_types FOR SELECT USING (true); -- Publicly readable types

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Sessions" ON sessions;
CREATE POLICY "Public Read Sessions" ON sessions FOR SELECT USING (true); -- Publicly readable schedule

-- 5. Admin Full Override (Profiles)
CREATE POLICY "Admin full access" ON profiles
FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'sys-admin')
);
