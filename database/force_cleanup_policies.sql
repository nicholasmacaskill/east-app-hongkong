-- FORCE CLEANUP
-- Explicitly drop all found policies by exact name

DROP POLICY IF EXISTS "Public Profiles Access" ON profiles;
DROP POLICY IF EXISTS "Users allow update own profile" ON profiles;
DROP POLICY IF EXISTS "Users allow insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Re-apply ONLY SAFE policies
-- 1. READ: Public (No recursion)
CREATE POLICY "Public Profiles Access" ON profiles FOR SELECT USING (true);

-- 2. UPDATE: Self Only (No recursion)
CREATE POLICY "Users allow update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 3. INSERT: Self Only (No recursion)
CREATE POLICY "Users allow insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- No Admin access via RLS directly to avoid recursion
-- Admins should use service role or a separate 'admin_users' table if needed later
