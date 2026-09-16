-- ================================================================
-- FIX: messages table columns + RLS + profiles RLS
-- Fixes: (1) Messages not sending  (2) Zero athletes in CreateTeamModal
-- Run in: Supabase SQL Editor → Production project
-- ================================================================

-- ────────────────────────────────────────────────────────────────
-- PART 1: Ensure messages table has all columns PrivateMessenger needs
-- ────────────────────────────────────────────────────────────────

-- receiver_id for 1-on-1 DMs
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- team_id for team group chats
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;

-- video_url for video feedback attachments
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS video_url TEXT;

-- shared_drill_id for drill attachments
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS shared_drill_id UUID REFERENCES public.coach_drills(id) ON DELETE SET NULL;

-- shared_plan_id for training plan attachments
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS shared_plan_id UUID REFERENCES public.training_plans(id) ON DELETE SET NULL;

-- Make content nullable (team messages may only have attachments, no text)
ALTER TABLE public.messages ALTER COLUMN content DROP NOT NULL;

-- Make legacy conversation_id nullable (no longer the primary key concept)
ALTER TABLE public.messages ALTER COLUMN conversation_id DROP NOT NULL;

-- ────────────────────────────────────────────────────────────────
-- PART 2: Fix messages RLS
-- ────────────────────────────────────────────────────────────────

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop all old policies to start fresh
DROP POLICY IF EXISTS "Users can view sent messages"       ON public.messages;
DROP POLICY IF EXISTS "Users can view received messages"   ON public.messages;
DROP POLICY IF EXISTS "Users can send messages"            ON public.messages;
DROP POLICY IF EXISTS "Users can delete sent messages"     ON public.messages;
DROP POLICY IF EXISTS "Team members can view team messages" ON public.messages;
DROP POLICY IF EXISTS "Team members can send team messages" ON public.messages;
DROP POLICY IF EXISTS "Allow authenticated to send messages" ON public.messages;

-- SELECT: sender sees their own messages
CREATE POLICY "Users can view sent messages"
ON public.messages FOR SELECT
USING (auth.uid() = sender_id);

-- SELECT: receiver sees DMs addressed to them
CREATE POLICY "Users can view received messages"
ON public.messages FOR SELECT
USING (auth.uid() = receiver_id);

-- SELECT: team members can read team chat
CREATE POLICY "Team members can view team messages"
ON public.messages FOR SELECT
USING (
    team_id IS NOT NULL AND
    EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = messages.team_id
          AND tm.user_id = auth.uid()
    )
);

-- INSERT: only the sender can insert, and they must set themselves as sender
CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- DELETE: only the sender can delete their messages
CREATE POLICY "Users can delete sent messages"
ON public.messages FOR DELETE
USING (auth.uid() = sender_id);

-- ────────────────────────────────────────────────────────────────
-- PART 3: Fix profiles RLS so coaches can read all profiles
--         (Required: CreateTeamModal shows 0 athletes without this)
-- ────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop conflicting old policies
DROP POLICY IF EXISTS "Coaches can view all profiles"           ON public.profiles;
DROP POLICY IF EXISTS "Community limited profile access"        ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON public.profiles;

-- All authenticated users can read all profiles
-- (Coaches need this to populate member list; DM list also needs it)
CREATE POLICY "Authenticated users can read all profiles"
ON public.profiles FOR SELECT
USING (auth.uid() IS NOT NULL);

-- ────────────────────────────────────────────────────────────────
-- Reload schema cache
-- ────────────────────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';
