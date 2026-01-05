-- FIX INFINITE RECURSION
-- Only dropping policies on 'profiles', not other tables.

DROP POLICY IF EXISTS "Public Profiles Access" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users allow update own profile" ON profiles;
DROP POLICY IF EXISTS "Admin All Access" ON profiles;
DROP POLICY IF EXISTS "Admin Access" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;

-- 1. READ: Public (No recursion)
CREATE POLICY "Public Profiles Access" ON profiles FOR SELECT USING (true);

-- 2. UPDATE: Self Only (No recursion)
CREATE POLICY "Users allow update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 3. INSERT: Self Only (No recursion)
CREATE POLICY "Users allow insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. DELETE: Self Only (No recursion)
-- CREATE POLICY "Users allow delete own profile" ON profiles FOR DELETE USING (auth.uid() = id);

-- NOTE: If we need Admin access, we CANNOT query 'profiles' directly in the policy without causing recursion.
-- We must use `auth.jwt() ->> 'role'` or a `SECURITY DEFINER` function for complex checks.
-- For now, we skip the admin policy to restore stability.
