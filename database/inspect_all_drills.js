const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(url, key);

async function inspectAll() {
    const { data, error } = await supabase.from('coach_drills').select('id, title, group_tags, skill_tags, age_tags');
    if (error) {
        console.error("Error fetching drills:", error);
        return;
    }
    
    console.log("Total drills in DB:", data.length);
    data.forEach((drill) => {
        console.log(`Drill: "${drill.title}" (ID: ${drill.id})`);
        console.log(`  group_tags:`, drill.group_tags);
        console.log(`  skill_tags:`, drill.skill_tags);
        console.log(`  age_tags:`, drill.age_tags);
    });
}

inspectAll();
