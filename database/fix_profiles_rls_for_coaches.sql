-- ================================================================
-- FIX: profiles RLS — coaches can SELECT other profiles
-- (needed for CreateTeamModal member list to populate)
-- ================================================================

-- Drop any old conflicting policies first to avoid duplicates
DROP POLICY IF EXISTS "Coaches can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Community limited profile access" ON public.profiles;

-- Allow coaches/admins/sys-admins to read ALL profiles
CREATE POLICY "Coaches can view all profiles"
ON public.profiles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role IN ('coach', 'sys-admin', 'admin')
    )
);

-- ================================================================
-- FIX: teams & team_members RLS policies
-- ================================================================

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Coaches can view their own teams; members can view teams they belong to
DROP POLICY IF EXISTS "Coaches can view own teams" ON public.teams;
CREATE POLICY "Coaches can view own teams"
ON public.teams FOR SELECT
USING (
    auth.uid() = coach_id
    OR EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = teams.id AND tm.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('sys-admin', 'admin')
    )
);

-- Coaches can create teams they own
DROP POLICY IF EXISTS "Coaches can create teams" ON public.teams;
CREATE POLICY "Coaches can create teams"
ON public.teams FOR INSERT
WITH CHECK (
    auth.uid() = coach_id
    AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('coach', 'sys-admin', 'admin')
    )
);

-- Coaches can update & delete their own teams
DROP POLICY IF EXISTS "Coaches can update own teams" ON public.teams;
CREATE POLICY "Coaches can update own teams"
ON public.teams FOR UPDATE
USING (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Coaches can delete own teams" ON public.teams;
CREATE POLICY "Coaches can delete own teams"
ON public.teams FOR DELETE
USING (auth.uid() = coach_id);

-- Members: coaches see all members of their teams; users see their own memberships
DROP POLICY IF EXISTS "Coaches and members can view team_members" ON public.team_members;
CREATE POLICY "Coaches and members can view team_members"
ON public.team_members FOR SELECT
USING (
    auth.uid() = user_id
    OR EXISTS (
        SELECT 1 FROM public.teams t
        WHERE t.id = team_members.team_id AND t.coach_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('sys-admin', 'admin')
    )
);

-- Coaches can add/remove members from their own teams
DROP POLICY IF EXISTS "Coaches can insert team_members" ON public.team_members;
CREATE POLICY "Coaches can insert team_members"
ON public.team_members FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.teams t
        WHERE t.id = team_members.team_id AND t.coach_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Coaches can delete team_members" ON public.team_members;
CREATE POLICY "Coaches can delete team_members"
ON public.team_members FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.teams t
        WHERE t.id = team_members.team_id AND t.coach_id = auth.uid()
    )
);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
