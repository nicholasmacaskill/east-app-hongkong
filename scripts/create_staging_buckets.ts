import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') }); // Local now points to Staging!

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) process.exit(1);

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupBuckets() {
    console.log("Setting up Supabase Storage Buckets for Staging...");
    const buckets = ['uploads', 'ticket-attachments', 'events'];

    for (const bucket of buckets) {
        console.log(`Checking bucket: ${bucket}...`);
        const { data: bData, error: bError } = await supabase.storage.getBucket(bucket);
        
        if (bError && bError.message.includes('not found')) {
            console.log(`Creating bucket: ${bucket}...`);
            const { error: createError } = await supabase.storage.createBucket(bucket, {
                public: true
            });
            if (createError) console.error(`Error creating ${bucket}:`, createError);
            else console.log(`✅ Created bucket: ${bucket}`);
        } else if (bData) {
            console.log(`✅ Bucket ${bucket} already exists.`);
            // ensure it's public
            await supabase.storage.updateBucket(bucket, { public: true });
        } else {
            console.error(`Error checking ${bucket}:`, bError);
        }
    }
}
setupBuckets();
