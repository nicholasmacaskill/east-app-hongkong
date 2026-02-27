
-- Consolidated RLS Fix for Profiles
DROP POLICY IF EXISTS "Profiles SELECT policy" ON profiles;
DROP POLICY IF EXISTS "Profiles UPDATE policy" ON profiles;
DROP POLICY IF EXISTS "Profiles SELECT" ON profiles;
DROP POLICY IF EXISTS "Profiles UPDATE" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Parent can view children profiles" ON profiles;
DROP POLICY IF EXISTS "Users allow update own or child profile" ON profiles;
DROP POLICY IF EXISTS "Community limited profile access" ON profiles;
DROP POLICY IF EXISTS "Public Profiles Access" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Public can view coach profiles" ON profiles;
DROP POLICY IF EXISTS "Admin/Coach can view all profiles" ON profiles;

-- 1. SELECT: Everyone authenticated can see profiles (required for dashboard/linking)
CREATE POLICY "Allow authenticated select all" ON profiles
FOR SELECT USING (auth.uid() IS NOT NULL);

-- 2. UPDATE: Users can update own, parents can update child, admins can update all
CREATE POLICY "Allow robust update" ON profiles
FOR UPDATE USING (
    auth.uid() = id -- Self
    OR parent_id = auth.uid() -- Parent link
    OR id IN (SELECT child_id FROM player_relationships WHERE parent_id = auth.uid()) -- Rel link
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'sys-admin') -- Admin override
)
WITH CHECK (
    auth.uid() = id
    OR parent_id = auth.uid()
    OR id IN (SELECT child_id FROM player_relationships WHERE parent_id = auth.uid())
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'sys-admin')
);

-- Ensure DELETE is also covered for admins if needed
CREATE POLICY "Allow admin delete" ON profiles
FOR DELETE USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'sys-admin')
);
