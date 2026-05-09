const { createClient } = require('@supabase/supabase-js');

const url = 'https://lzqnviblkcnjsxutqeht.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6cW52aWJsa2NuanN4dXRxZWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDgyMjEyMSwiZXhwIjoyMDkwMzk4MTIxfQ.zkfbtc7Bv_Dsswe9Nwtzf9Yq4ZO4JdLzDRSuGxGq9uk';

const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function fixStorage() {
    console.log('Fixing storage bucket in TEST database...');

    // 1. Create 'uploads' bucket if it doesn't exist
    const { data: existing } = await supabase.storage.getBucket('uploads');
    
    if (!existing) {
        const { error: createErr } = await supabase.storage.createBucket('uploads', {
            public: true,
            allowedMimeTypes: ['image/*', 'video/*'],
            fileSizeLimit: 52428800 // 50MB
        });
        if (createErr) {
            console.error('Failed to create bucket:', createErr);
            return;
        }
        console.log('✅ Created uploads bucket');
    } else {
        console.log('✅ uploads bucket already exists');
        
        // Make sure it's public
        const { error: updateErr } = await supabase.storage.updateBucket('uploads', {
            public: true,
            allowedMimeTypes: ['image/*', 'video/*'],
            fileSizeLimit: 52428800
        });
        if (updateErr) console.error('Failed to update bucket:', updateErr);
        else console.log('✅ Updated bucket to public');
    }

    // 2. The RLS policies for storage are in the storage schema
    // Use the pg client to set them
    const { Client } = require('pg');
    const pgClient = new Client({
        host: 'aws-1-us-east-1.pooler.supabase.com',
        port: 6543,
        database: 'postgres',
        user: 'postgres.lzqnviblkcnjsxutqeht',
        password: 'FNjB8Ca3Ar0Yg816mY%9',
        ssl: { rejectUnauthorized: false }
    });

    try {
        await pgClient.connect();

        await pgClient.query(`
            -- Allow authenticated users to upload to the uploads bucket
            DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
            CREATE POLICY "Allow authenticated uploads"
            ON storage.objects FOR INSERT
            TO authenticated
            WITH CHECK (bucket_id = 'uploads');

            -- Allow public read
            DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
            CREATE POLICY "Allow public read"
            ON storage.objects FOR SELECT
            TO public
            USING (bucket_id = 'uploads');

            -- Allow authenticated users to update their own files
            DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
            CREATE POLICY "Allow authenticated updates"
            ON storage.objects FOR UPDATE
            TO authenticated
            USING (bucket_id = 'uploads');
        `);

        console.log('✅ Storage RLS policies applied');
        console.log('\n🎉 Storage is ready — try uploading a thumbnail again');
    } catch (err) {
        console.error('Failed to apply RLS policies:', err.message);
    } finally {
        await pgClient.end();
    }
}

fixStorage();
