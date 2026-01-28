
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function cleanupProfiles() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error("❌ Missing Supabase environment variables in .env.local");
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        console.log("Connected to Supabase.");

        // Fetch all coach profiles
        const { data: coaches, error: fetchError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .eq('role', 'coach');

        if (fetchError) throw fetchError;

        let updatedCount = 0;
        for (const coach of coaches) {
            const cleanFirst = coach.first_name?.trim();
            const cleanLast = coach.last_name?.trim();

            if (cleanFirst !== coach.first_name || cleanLast !== coach.last_name) {
                console.log(`🧹 Cleaning up: "${coach.first_name}" "${coach.last_name}"`);
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({
                        first_name: cleanFirst,
                        last_name: cleanLast
                    })
                    .eq('id', coach.id);

                if (updateError) {
                    console.error(`❌ Failed to update coach ${coach.id}:`, updateError);
                } else {
                    console.log(`✅ Success: "${coach.first_name} ${coach.last_name}" -> "${cleanFirst} ${cleanLast}"`);
                    updatedCount++;
                }
            }
        }

        console.log(`🏁 Finished profiles. Updated ${updatedCount} coach profiles.`);

        // --- SESSION CLEANUP ---
        console.log("🧹 Starting sessions cleanup...");
        const { data: sessions, error: sessionFetchError } = await supabase
            .from('sessions')
            .select('id, instructor')
            .ilike('instructor', '%  %'); // Find any with double spaces

        if (sessionFetchError) throw sessionFetchError;

        let sessionUpdatedCount = 0;
        for (const session of sessions) {
            const cleanInstructor = session.instructor?.replace(/\s+/g, ' ').trim();
            if (cleanInstructor !== session.instructor) {
                const { error: sessionUpdateError } = await supabase
                    .from('sessions')
                    .update({ instructor: cleanInstructor })
                    .eq('id', session.id);

                if (sessionUpdateError) {
                    console.error(`❌ Failed to update session ${session.id}:`, sessionUpdateError);
                } else {
                    console.log(`✅ Cleaned session ${session.id}: "${session.instructor}" -> "${cleanInstructor}"`);
                    sessionUpdatedCount++;
                }
            }
        }
        console.log(`🏁 Finished sessions. Updated ${sessionUpdatedCount} sessions.`);

    } catch (err) {
        console.error("❌ Error during cleanup:", err);
    }
}

cleanupProfiles();
