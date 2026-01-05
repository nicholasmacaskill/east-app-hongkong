const { Pool } = require('pg');

const getDbPool = () => {
    return new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '54322', 10),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'postgres',
    });
};

const sql = `
-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_commands ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES TABLE POLICIES
-- ============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile (excluding sensitive fields)
-- Note: RLS policies cannot prevent field updates directly
-- Sensitive fields (credits, role, stripe_*) should be protected via application logic
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Service role has full access (for backend operations)
-- This is handled by GRANT statements, not RLS

-- ============================================
-- SECURE COLUMN PRIVILEGES (CRITICAL)
-- ============================================
-- Prevent authenticated users from updating sensitive columns like 'credits'
REVOKE UPDATE ON public.profiles FROM authenticated;

GRANT UPDATE (
  username, 
  first_name, 
  last_name, 
  mobile, 
  contact_email,
  avatar_url, 
  bio, 
  gallery_images, 
  schedule_photo_url,
  intro_video_url, 
  preferences, 
  team, 
  position
) ON public.profiles TO authenticated;

-- ============================================

-- ============================================
-- REGISTRATIONS TABLE POLICIES
-- ============================================

-- Users can view their own registrations
CREATE POLICY "Users can view own registrations"
ON public.registrations FOR SELECT
USING (auth.uid() = user_id);

-- Users can delete their own registrations (cancellations)
CREATE POLICY "Users can cancel own registrations"
ON public.registrations FOR DELETE
USING (auth.uid() = user_id);

-- Admins can view all registrations
CREATE POLICY "Admins can view all registrations"
ON public.registrations FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- ============================================
-- SESSIONS TABLE POLICIES
-- ============================================

-- All authenticated users can view sessions
CREATE POLICY "Authenticated users can view sessions"
ON public.sessions FOR SELECT
TO authenticated
USING (true);

-- Only admins can create sessions
CREATE POLICY "Admins can create sessions"
ON public.sessions FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Only admins can update sessions
CREATE POLICY "Admins can update sessions"
ON public.sessions FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Only admins can delete sessions
CREATE POLICY "Admins can delete sessions"
ON public.sessions FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- ============================================
-- PLAYERS_STATS TABLE POLICIES
-- ============================================

-- Users can view their own stats
CREATE POLICY "Users can view own stats"
ON public.players_stats FOR SELECT
USING (auth.uid() = player_id);

-- Public can view verified stats only
CREATE POLICY "Public can view verified stats"
ON public.players_stats FOR SELECT
USING (is_verified = true);

-- Coaches and admins can verify stats
CREATE POLICY "Coaches can verify stats"
ON public.players_stats FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('coach', 'admin')
    )
);

-- Users can insert their own stats
CREATE POLICY "Users can insert own stats"
ON public.players_stats FOR INSERT
WITH CHECK (auth.uid() = player_id AND is_verified = false);

-- ============================================
-- POSTS TABLE POLICIES
-- ============================================

-- Users can view all posts (public social feed)
CREATE POLICY "Users can view all posts"
ON public.posts FOR SELECT
TO authenticated
USING (true);

-- Users can create their own posts
CREATE POLICY "Users can create own posts"
ON public.posts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own posts
CREATE POLICY "Users can update own posts"
ON public.posts FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own posts
CREATE POLICY "Users can delete own posts"
ON public.posts FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- LIKES TABLE POLICIES
-- ============================================

-- Users can view all likes
CREATE POLICY "Users can view all likes"
ON public.likes FOR SELECT
TO authenticated
USING (true);

-- Users can create their own likes
CREATE POLICY "Users can create own likes"
ON public.likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own likes
CREATE POLICY "Users can delete own likes"
ON public.likes FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- MESSAGES TABLE POLICIES
-- ============================================

-- Users can view messages they sent
CREATE POLICY "Users can view sent messages"
ON public.messages FOR SELECT
USING (auth.uid() = sender_id);

-- Users can view messages they received
CREATE POLICY "Users can view received messages"
ON public.messages FOR SELECT
USING (auth.uid() = receiver_id);

-- Users can send messages
CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Users can delete their sent messages
CREATE POLICY "Users can delete sent messages"
ON public.messages FOR DELETE
USING (auth.uid() = sender_id);

-- ============================================
-- AVAILABILITY TABLE POLICIES
-- ============================================

-- All authenticated users can view availability
CREATE POLICY "Users can view availability"
ON public.availability FOR SELECT
TO authenticated
USING (true);

-- Coaches can manage their own availability
CREATE POLICY "Coaches can manage own availability"
ON public.availability FOR ALL
USING (
    auth.uid() = coach_id 
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role IN ('coach', 'admin')
    )
);

-- Admins can manage all availability
CREATE POLICY "Admins can manage all availability"
ON public.availability FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- ============================================
-- VOICE_COMMANDS TABLE POLICIES
-- ============================================

-- Coaches can view their own voice commands
CREATE POLICY "Coaches can view own voice commands"
ON public.voice_commands FOR SELECT
USING (auth.uid() = coach_id);

-- Coaches can create their own voice commands
CREATE POLICY "Coaches can create own voice commands"
ON public.voice_commands FOR INSERT
WITH CHECK (
    auth.uid() = coach_id 
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role IN ('coach', 'admin')
    )
);

-- Admins can view all voice commands
CREATE POLICY "Admins can view all voice commands"
ON public.voice_commands FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);
`;

(async () => {
    const pool = getDbPool();
    const client = await pool.connect();
    try {
        console.log("🔒 Running Security Migration: Enabling RLS and creating policies...");
        await client.query(sql);
        console.log("✅ Success: RLS enabled and policies created for all tables.");
    } catch (e) {
        console.error("❌ Migration Failed:", e);
    } finally {
        client.release();
        await pool.end();
    }
})();
