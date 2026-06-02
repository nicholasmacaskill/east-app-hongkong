const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.production') });

const url = process.env.TEST_SUPABASE_URL || '';
const key = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY || '';

if (!url || !key) {
    console.error("TEST_SUPABASE_URL or TEST_SUPABASE_SERVICE_ROLE_KEY not set in .env.production");
    process.exit(1);
}

const supabase = createClient(url, key);

async function inspectTags() {
    const { data, error } = await supabase.from('coach_drills').select('id, title, group_tags, skill_tags');
    if (error) {
        console.error("Error fetching drills:", error);
        return;
    }
    
    console.log("Total drills in TEST DB:", data.length);
    const uniqueGroupTags = new Set();
    const uniqueSkillTags = new Set();
    const drillTagsList = [];

    for (const drill of data) {
        if (drill.group_tags) {
            drill.group_tags.forEach((tag) => {
                uniqueGroupTags.add(tag);
                if (tag.toLowerCase().includes('power') || tag.toLowerCase().includes('speed') || tag.toLowerCase().includes('conditioning')) {
                    drillTagsList.push({ id: drill.id, title: drill.title, group_tags: drill.group_tags, type: 'group_tag' });
                }
            });
        }
        if (drill.skill_tags) {
            drill.skill_tags.forEach((tag) => {
                uniqueSkillTags.add(tag);
                if (tag.toLowerCase().includes('power') || tag.toLowerCase().includes('speed') || tag.toLowerCase().includes('conditioning')) {
                    drillTagsList.push({ id: drill.id, title: drill.title, skill_tags: drill.skill_tags, type: 'skill_tag' });
                }
            });
        }
    }

    console.log("Unique group_tags in TEST DB:", Array.from(uniqueGroupTags));
    console.log("Unique skill_tags in TEST DB:", Array.from(uniqueSkillTags));
    console.log("Drills with 'power', 'speed', or 'conditioning' in tags in TEST DB:", JSON.stringify(drillTagsList, null, 2));
}

inspectTags();
