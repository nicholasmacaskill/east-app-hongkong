
const { createClient } = require('@supabase/supabase-js');

async function cleanupProfiles() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error("❌ Missing Supabase environment variables.");
        return;
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
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ first_name: cleanFirst, last_name: cleanLast })
                    .eq('id', coach.id);

                if (updateError) {
                    console.error(`❌ Failed to update coach ${coach.id}:`, updateError);
                } else {
                    console.log(`✅ Cleaned up: "${coach.first_name} ${coach.last_name}" -> "${cleanFirst} ${cleanLast}"`);
                    updatedCount++;
                }
            }
        }

        console.log(`🏁 Finished. Updated ${updatedCount} coach profiles.`);

    } catch (err) {
        console.error("❌ Error cleaning up profiles:", err);
    }
}

cleanupProfiles();
