import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { getSupabaseAdmin } from '../app/lib/supabaseAdmin';

async function initUploadsBucket() {
    const supabase = getSupabaseAdmin();
    const bucketName = 'uploads';

    console.log(`Checking for bucket: ${bucketName}...`);

    // 1. Create bucket if it doesn't exist
    const { data: bucket, error: bucketError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'video/mp4', 'video/quicktime'],
        fileSizeLimit: 52428800 // 50MB
    });

    if (bucketError && bucketError.message !== 'Bucket already exists') {
        console.error('Error creating bucket:', bucketError);
        return;
    }

    console.log(`✅ Bucket '${bucketName}' is ready.`);

    // Policies are usually handled via SQL migrations for better version control,
    // but we can ensure they are set up.
    console.log('Ensure RLS policies for storage are applied via SQL if not already.');
}

initUploadsBucket().catch(console.error);
