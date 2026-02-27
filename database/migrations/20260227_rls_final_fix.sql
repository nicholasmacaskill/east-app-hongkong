
-- Final RLS Fix for Parent/Child Profile Access
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Parent can view children profiles" ON profiles;
DROP POLICY IF EXISTS "Users allow update own or child profile" ON profiles;
DROP POLICY IF EXISTS "Community limited profile access" ON profiles;
DROP POLICY IF EXISTS "Public Profiles Access" ON profiles;

-- SELECT POLICY
-- 1. Users can see their own
-- 2. Parents can see their children (via parent_id column)
-- 3. Any authenticated user can see names/avatars (community)
CREATE POLICY "Profiles SELECT policy" ON profiles
FOR SELECT
USING (
    auth.uid() = id
    OR
    parent_id = auth.uid()
    OR
    id IN (SELECT child_id FROM player_relationships WHERE parent_id = auth.uid())
    OR
    auth.uid() IS NOT NULL
);

-- UPDATE POLICY
-- 1. Users can update their own
-- 2. Parents can update their children
CREATE POLICY "Profiles UPDATE policy" ON profiles
FOR UPDATE
USING (
    auth.uid() = id
    OR
    parent_id = auth.uid()
    OR
    id IN (SELECT child_id FROM player_relationships WHERE parent_id = auth.uid())
)
WITH CHECK (
    auth.uid() = id
    OR
    parent_id = auth.uid()
    OR
    id IN (SELECT child_id FROM player_relationships WHERE parent_id = auth.uid())
);
