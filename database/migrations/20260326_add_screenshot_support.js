const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

function loadEnv() {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join('=').trim().replace(/(^"|"$)/g, '');
                if (key && !key.startsWith('#')) {
                    process.env[key] = value;
                }
            }
        });
    }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function runMigration() {
    console.log('🚀 Migration: Add screenshot support to Engineering Tickets');

    const sql = `
-- 1. Add screenshot_url column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'engineering_tickets' 
        AND column_name = 'screenshot_url'
    ) THEN
        ALTER TABLE public.engineering_tickets 
        ADD COLUMN screenshot_url TEXT;
    END IF;
END $$;

-- 2. Create storage bucket for screenshots (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-attachments', 'ticket-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage policies for ticket attachments
DO $$
BEGIN
    -- Policy for authenticated users to upload
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Authenticated users can upload ticket attachments'
    ) THEN
        CREATE POLICY "Authenticated users can upload ticket attachments"
        ON storage.objects
        FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'ticket-attachments');
    END IF;

    -- Policy for public viewing
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Anyone can view ticket attachments'
    ) THEN
        CREATE POLICY "Anyone can view ticket attachments"
        ON storage.objects
        FOR SELECT
        TO public
        USING (bucket_id = 'ticket-attachments');
    END IF;
END $$;
`;

    console.log('📡 Sending migration to Supabase...');
    const { error } = await supabase.rpc('run_sql', { sql_query: sql });

    if (error) {
        console.error('❌ Migration Failed:', JSON.stringify(error, null, 2));
        process.exit(1);
    }

    console.log('✅ Screenshot support added successfully!');
}

runMigration();
