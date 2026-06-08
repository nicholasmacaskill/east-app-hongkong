import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    const client = await pool.connect();
    try {
        console.log('🔒 Running: Fix profiles RLS for coaches + team tables RLS...');

        await client.query(`
            -- ================================================================
            -- FIX 1: Allow coaches (and all authenticated users) to SELECT 
            -- other profiles so the CreateTeamModal member list populates.
            -- The "Community limited profile access" policy was never applied
            -- in production; only own-profile and admin policies exist.
            -- ================================================================
            DROP POLICY IF EXISTS "Coaches can view all profiles" ON public.profiles;
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
            -- FIX 2: Ensure RLS is enabled on teams / team_members,
            -- and that coaches can fully manage their own teams.
            -- ================================================================
            ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
            ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

            -- Coaches can view their own teams
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

            -- Coaches can insert teams they own
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

            -- Coaches can update their own teams
            DROP POLICY IF EXISTS "Coaches can update own teams" ON public.teams;
            CREATE POLICY "Coaches can update own teams"
            ON public.teams FOR UPDATE
            USING (auth.uid() = coach_id);

            -- Coaches can delete their own teams
            DROP POLICY IF EXISTS "Coaches can delete own teams" ON public.teams;
            CREATE POLICY "Coaches can delete own teams"
            ON public.teams FOR DELETE
            USING (auth.uid() = coach_id);

            -- Team members: members of a team can see their membership,
            -- coaches can see all members of their teams
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

            -- Coaches can add members to their own teams
            DROP POLICY IF EXISTS "Coaches can insert team_members" ON public.team_members;
            CREATE POLICY "Coaches can insert team_members"
            ON public.team_members FOR INSERT
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.teams t
                    WHERE t.id = team_members.team_id AND t.coach_id = auth.uid()
                )
            );

            -- Coaches can remove members from their own teams
            DROP POLICY IF EXISTS "Coaches can delete team_members" ON public.team_members;
            CREATE POLICY "Coaches can delete team_members"
            ON public.team_members FOR DELETE
            USING (
                EXISTS (
                    SELECT 1 FROM public.teams t
                    WHERE t.id = team_members.team_id AND t.coach_id = auth.uid()
                )
            );
        `);

        console.log('✅ RLS policies updated for profiles, teams, and team_members.');

        // Reload PostgREST schema cache
        await client.query(`NOTIFY pgrst, 'reload schema'`);
        console.log('✅ Schema cache reloaded.');

    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
