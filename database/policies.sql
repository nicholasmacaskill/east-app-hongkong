-- RLS POLICIES (Production Security)
-- Run this on Production to Secure the App

-- 1. Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_relationships ENABLE ROW LEVEL SECURITY;

-- 2. Profiles Policies
-- Everyone can read stats/names (needed for leaderboards/community)
CREATE POLICY "Public Profiles Access" ON profiles FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users allow update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 3. Registrations
-- Users can see their own bookings
CREATE POLICY "View Own Bookings" ON registrations FOR SELECT USING (auth.uid() = user_id OR auth.uid() = payer_id);

-- 4. Relationships (Family)
-- Parents can see their children
CREATE POLICY "View Relationships" ON player_relationships FOR SELECT USING (auth.uid() = parent_id OR auth.uid() = child_id);

-- 5. Admin Override (Optional, if using Service Role this isn't strictly needed but good for Admin User Login)
-- If we have an 'admin' role in auth.users schema or check profile role
-- CREATE POLICY "Admin All Access" ON profiles FOR ALL USING ( (select role from profiles where id = auth.uid()) = 'admin' );
