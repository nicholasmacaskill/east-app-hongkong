-- Migration: Fix RLS Read Access for Parents and Standardize Admin Roles
-- Bug #10 Resolution

BEGIN;

-- 1. TRANSACTIONS TABLE
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
CREATE POLICY "Users can view their own transactions" ON transactions
FOR SELECT USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM player_relationships 
    WHERE parent_id = auth.uid() AND child_id = user_id
  )
);

DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;
CREATE POLICY "Admins can view all transactions" ON transactions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'sys-admin')
  )
);


-- 2. PLAYERS_STATS TABLE
DROP POLICY IF EXISTS "Users can view own stats" ON players_stats;
CREATE POLICY "Users can view own stats" ON players_stats
FOR SELECT USING (
  auth.uid() = player_id 
  OR EXISTS (
    SELECT 1 FROM player_relationships 
    WHERE parent_id = auth.uid() AND child_id = player_id
  )
);

DROP POLICY IF EXISTS "Coaches can verify stats" ON players_stats;
CREATE POLICY "Coaches can verify stats" ON players_stats 
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('coach', 'admin', 'sys-admin')
    )
);


-- 3. PROFILES TABLE
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles 
FOR SELECT USING (
  auth.uid() = id 
  OR EXISTS (
    SELECT 1 FROM player_relationships 
    WHERE parent_id = auth.uid() AND child_id = id
  )
);

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'sys-admin')
    )
);


-- 4. REGISTRATIONS TABLE
DROP POLICY IF EXISTS "Users can view own registrations" ON registrations;
CREATE POLICY "Users can view own registrations" ON registrations
FOR SELECT USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM player_relationships 
    WHERE parent_id = auth.uid() AND child_id = user_id
  )
);

DROP POLICY IF EXISTS "Admins can view all registrations" ON registrations;
CREATE POLICY "Admins can view all registrations" ON registrations
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'sys-admin')
    )
);

COMMIT;
