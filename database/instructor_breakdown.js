
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function getBreakdown() {
    let counts = {};
    let offset = 0;
    let total = 0;

    console.log("📊 Fetching all sessions to analyze counts...");

    while (true) {
        const { data, error } = await supabase
            .from('sessions')
            .select('instructor')
            .range(offset, offset + 999);

        if (error) {
            console.error("Error:", error);
            break;
        }

        if (!data || data.length === 0) break;

        data.forEach(s => {
            const key = s.instructor || 'Unassigned';
            counts[key] = (counts[key] || 0) + 1;
            total++;
        });

        if (data.length < 1000) break;
        offset += 1000;
        process.stdout.write("."); // Progress indicator
    }

    console.log("\n\n✅ Breakdown of all sessions in database:");
    console.table(counts);
    console.log(`\nTotal sessions found: ${total}`);
}

getBreakdown();
