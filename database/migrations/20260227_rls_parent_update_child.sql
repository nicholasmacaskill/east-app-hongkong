
-- 1. Drop the old policies
DROP POLICY IF EXISTS "Users allow update own profile" ON profiles;
DROP POLICY IF EXISTS "Users allow update own or child profile" ON profiles;

-- 2. Create the new policy that allows updates to self OR children
CREATE POLICY "Users allow update own or child profile" ON profiles 
FOR UPDATE 
USING (
    auth.uid() = id 
    OR 
    id IN (SELECT child_id FROM player_relationships WHERE parent_id = auth.uid())
);
