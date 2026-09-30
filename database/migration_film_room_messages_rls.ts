import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    console.log('🚀 Updating Film Room Sessions & Timestamps RLS for message sharing...');

    const sql = `
        -- Drop existing policy
        DROP POLICY IF EXISTS "Film sessions readable by target audience" ON public.film_room_sessions;
        DROP POLICY IF EXISTS "Film timestamps readable by target audience" ON public.film_room_timestamps;

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
                OR EXISTS (
                    SELECT 1 FROM public.messages m
                    WHERE m.shared_film_session_id = film_room_sessions.id
                      AND (
                          m.receiver_id = auth.uid()
                          OR m.sender_id = auth.uid()
                          OR (m.team_id IS NOT NULL AND EXISTS (
                              SELECT 1 FROM public.team_members tm WHERE tm.team_id = m.team_id AND tm.user_id = auth.uid()
                          ))
                      )
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
                        OR EXISTS (
                            SELECT 1 FROM public.messages m
                            WHERE m.shared_film_session_id = s.id
                              AND (
                                  m.receiver_id = auth.uid()
                                  OR m.sender_id = auth.uid()
                                  OR (m.team_id IS NOT NULL AND EXISTS (
                                      SELECT 1 FROM public.team_members tm WHERE tm.team_id = m.team_id AND tm.user_id = auth.uid()
                                  ))
                              )
                        )
                      )
                )
            );
    `;

    const { error } = await supabase.rpc('run_sql', { sql_query: sql });

    if (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }

    console.log('✅ Updated Film Room Sessions & Timestamps RLS successfully.');
}

runMigration();
