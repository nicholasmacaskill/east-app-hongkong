import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const JRDUCKS_DB_URL = process.env.JRDUCKS_DATABASE_URL || 'postgresql://postgres:Plot3-Dismount8-Coach2-Anthem0-Emission3@db.hzltndrltyseifwbmjeg.supabase.co:5432/postgres';

async function runJrDucksMigration() {
    console.log('🦆 Starting Anaheim Jr. Ducks Film Room Migration...');

    const client = new Client({
        connectionString: JRDUCKS_DB_URL,
        ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log(' Connected to Anaheim Jr. Ducks Supabase PostgreSQL database.');

    const sql = `
        -- 1. Film Room Sessions Table
        CREATE TABLE IF NOT EXISTS public.film_room_sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            description TEXT DEFAULT '',
            youtube_url TEXT NOT NULL,
            video_id TEXT NOT NULL,
            target_type TEXT NOT NULL CHECK (target_type IN ('all', 'team', 'player')) DEFAULT 'all',
            target_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
            target_player_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
            tags TEXT[] DEFAULT '{}'::TEXT[],
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );

        -- 2. Film Room Timestamps Table
        CREATE TABLE IF NOT EXISTS public.film_room_timestamps (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            session_id UUID NOT NULL REFERENCES public.film_room_sessions(id) ON DELETE CASCADE,
            timestamp_seconds INTEGER NOT NULL,
            timestamp_label TEXT NOT NULL,
            title TEXT NOT NULL,
            notes TEXT DEFAULT '',
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );

        -- 3. Messages table integration: add shared_film_session_id
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                  AND table_name = 'messages' 
                  AND column_name = 'shared_film_session_id'
            ) THEN
                ALTER TABLE public.messages ADD COLUMN shared_film_session_id UUID REFERENCES public.film_room_sessions(id) ON DELETE SET NULL;
            END IF;
        END $$;

        -- 4. Indexes for optimal performance
        CREATE INDEX IF NOT EXISTS idx_film_room_sessions_coach ON public.film_room_sessions(coach_id);
        CREATE INDEX IF NOT EXISTS idx_film_room_sessions_target_team ON public.film_room_sessions(target_team_id);
        CREATE INDEX IF NOT EXISTS idx_film_room_sessions_target_player ON public.film_room_sessions(target_player_id);
        CREATE INDEX IF NOT EXISTS idx_film_room_timestamps_session ON public.film_room_timestamps(session_id);
        CREATE INDEX IF NOT EXISTS idx_messages_shared_film_session ON public.messages(shared_film_session_id);

        -- 5. Row Level Security
        ALTER TABLE public.film_room_sessions ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.film_room_timestamps ENABLE ROW LEVEL SECURITY;

        -- Drop existing policies
        DROP POLICY IF EXISTS "Film sessions readable by target audience" ON public.film_room_sessions;
        DROP POLICY IF EXISTS "Coaches and admins can manage film sessions" ON public.film_room_sessions;
        DROP POLICY IF EXISTS "Film timestamps readable by target audience" ON public.film_room_timestamps;
        DROP POLICY IF EXISTS "Coaches and admins can manage film timestamps" ON public.film_room_timestamps;

        -- film_room_sessions SELECT policy
        CREATE POLICY "Film sessions readable by target audience" ON public.film_room_sessions
            FOR SELECT TO authenticated
            USING (
                auth.uid() = coach_id
                OR target_type = 'all'
                OR target_player_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.profiles p
                    WHERE p.id = auth.uid() AND p.role IN ('admin', 'sys-admin')
                )
                OR EXISTS (
                    SELECT 1 FROM public.team_members tm
                    WHERE tm.team_id = film_room_sessions.target_team_id AND tm.user_id = auth.uid()
                )
                OR EXISTS (
                    SELECT 1 FROM public.profiles player
                    WHERE player.id = film_room_sessions.target_player_id AND player.parent_id = auth.uid()
                )
            );

        -- film_room_sessions manage policy
        CREATE POLICY "Coaches and admins can manage film sessions" ON public.film_room_sessions
            FOR ALL TO authenticated
            USING (
                auth.uid() = coach_id
                OR EXISTS (
                    SELECT 1 FROM public.profiles p
                    WHERE p.id = auth.uid() AND p.role IN ('admin', 'sys-admin')
                )
            )
            WITH CHECK (
                auth.uid() = coach_id
                OR EXISTS (
                    SELECT 1 FROM public.profiles p
                    WHERE p.id = auth.uid() AND p.role IN ('admin', 'sys-admin')
                )
            );

        -- film_room_timestamps SELECT policy
        CREATE POLICY "Film timestamps readable by target audience" ON public.film_room_timestamps
            FOR SELECT TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM public.film_room_sessions s
                    WHERE s.id = film_room_timestamps.session_id
                      AND (
                        auth.uid() = s.coach_id
                        OR s.target_type = 'all'
                        OR s.target_player_id = auth.uid()
                        OR EXISTS (
                            SELECT 1 FROM public.profiles p
                            WHERE p.id = auth.uid() AND p.role IN ('admin', 'sys-admin')
                        )
                        OR EXISTS (
                            SELECT 1 FROM public.team_members tm
                            WHERE tm.team_id = s.target_team_id AND tm.user_id = auth.uid()
                        )
                        OR EXISTS (
                            SELECT 1 FROM public.profiles player
                            WHERE player.id = s.target_player_id AND player.parent_id = auth.uid()
                        )
                      )
                )
            );

        -- film_room_timestamps manage policy
        CREATE POLICY "Coaches and admins can manage film timestamps" ON public.film_room_timestamps
            FOR ALL TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM public.film_room_sessions s
                    WHERE s.id = film_room_timestamps.session_id
                      AND (
                        auth.uid() = s.coach_id
                        OR EXISTS (
                            SELECT 1 FROM public.profiles p
                            WHERE p.id = auth.uid() AND p.role IN ('admin', 'sys-admin')
                        )
                      )
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.film_room_sessions s
                    WHERE s.id = film_room_timestamps.session_id
                      AND (
                        auth.uid() = s.coach_id
                        OR EXISTS (
                            SELECT 1 FROM public.profiles p
                            WHERE p.id = auth.uid() AND p.role IN ('admin', 'sys-admin')
                        )
                      )
                )
            );

        -- Grants
        GRANT ALL ON public.film_room_sessions TO service_role;
        GRANT ALL ON public.film_room_timestamps TO service_role;
        GRANT SELECT, INSERT, UPDATE, DELETE ON public.film_room_sessions TO authenticated;
        GRANT SELECT, INSERT, UPDATE, DELETE ON public.film_room_timestamps TO authenticated;
    `;

    await client.query(sql);
    console.log('✅ Film Room tables and RLS policies created in Jr Ducks DB.');

    // Seed signature session for Scott Niedermayer
    const coachRes = await client.query(`
        SELECT id FROM public.profiles WHERE contact_email = 'scott.niedermayer@jrducks.com' LIMIT 1
    `);

    if (coachRes.rows.length > 0) {
        const coachId = coachRes.rows[0].id;
        console.log(`🦆 Seeding Anaheim Jr Ducks Film Session for Coach Scott Niedermayer (${coachId})...`);

        // Check if already seeded
        const existingSession = await client.query(`
            SELECT id FROM public.film_room_sessions WHERE coach_id = $1 AND title LIKE 'Anaheim Jr. Ducks%' LIMIT 1
        `, [coachId]);

        let sessionId: string;
        if (existingSession.rows.length === 0) {
            const insertSession = await client.query(`
                INSERT INTO public.film_room_sessions (
                    coach_id,
                    title,
                    description,
                    youtube_url,
                    video_id,
                    target_type,
                    tags
                ) VALUES (
                    $1,
                    'Anaheim Jr. Ducks 16U AAA - Neutral Zone Regroup & Forecheck Breakdown',
                    'Scott Niedermayer tactical film breakdown: gap control on retrievals, weakside defensive positioning, and F1/F2 angling on the 1-2-2 forecheck.',
                    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                    'dQw4w9WgXcQ',
                    'all',
                    ARRAY['Anaheim Ducks', 'Forecheck', 'Gap Control', 'Breakouts']
                ) RETURNING id;
            `, [coachId]);
            sessionId = insertSession.rows[0].id;

            // Insert timestamps
            await client.query(`
                INSERT INTO public.film_room_timestamps (session_id, timestamp_seconds, timestamp_label, title, notes, sort_order)
                VALUES
                ($1, 15, '00:15', 'F1 Angling & Neutral Zone Lock', 'F1 must force opposing puck carrier to their backhand along the boards. Do not overcommit.', 0),
                ($1, 45, '00:45', 'D-to-D Weakside Reverse Execution', 'Strongside D reads pressure early and reverses to weakside partner. Partner provides clean passing angle.', 1),
                ($1, 80, '01:20', 'Low Center Support Outlet', 'Center stays below the faceoff dots to provide high-percentage support outlet through the middle.', 2);
            `, [sessionId]);

            console.log('✅ Seeded Anaheim Jr. Ducks tactical film session with 3 timestamps.');
        } else {
            console.log('ℹ️ Anaheim Jr Ducks session already exists in DB.');
        }
    }

    await client.end();
    console.log('🎉 Jr Ducks Film Room Migration & Seed Complete!');
}

runJrDucksMigration().catch((err) => {
    console.error('❌ Jr Ducks Migration failed:', err);
    process.exit(1);
});
