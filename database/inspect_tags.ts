import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(url, key);

async function inspectTags() {
    const { data, error } = await supabase.from('coach_drills').select('id, title, group_tags, skill_tags');
    if (error) {
        console.error("Error fetching drills:", error);
        return;
    }
    
    console.log("Total drills:", data.length);
    const uniqueGroupTags = new Set<string>();
    const uniqueSkillTags = new Set<string>();
    const drillTagsList: any[] = [];

    for (const drill of data) {
        if (drill.group_tags) {
            drill.group_tags.forEach((tag: string) => {
                uniqueGroupTags.add(tag);
                if (tag.toLowerCase().includes('power')) {
                    drillTagsList.push({ id: drill.id, title: drill.title, group_tags: drill.group_tags, type: 'group_tag' });
                }
            });
        }
        if (drill.skill_tags) {
            drill.skill_tags.forEach((tag: string) => {
                uniqueSkillTags.add(tag);
                if (tag.toLowerCase().includes('power')) {
                    drillTagsList.push({ id: drill.id, title: drill.title, skill_tags: drill.skill_tags, type: 'skill_tag' });
                }
            });
        }
    }

    console.log("Unique group_tags:", Array.from(uniqueGroupTags));
    console.log("Unique skill_tags:", Array.from(uniqueSkillTags));
    console.log("Drills with 'power' in tags:", JSON.stringify(drillTagsList, null, 2));
}

inspectTags();
