import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual .env.local parser
const envPath = path.resolve(process.cwd(), '.env.local');
let env: any = {};
if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            env[key.trim()] = value.trim().replace(/"/g, '');
        }
    });
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("Purging stock video...");

    // Set intro_video_url to null for the users we seeded
    const { error, count } = await supabase
        .from('profiles')
        .update({ intro_video_url: null })
        .or('username.eq.admin.east,username.eq.parent@east.com')
        .select();

    if (error) {
        console.error("❌ Error purging video:", error);
    } else {
        console.log(`✅ Successfully purged video from profiles.`);
    }
}

main();
