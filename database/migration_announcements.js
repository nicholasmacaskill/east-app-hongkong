const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    console.log('🚀 Creating Announcements Table for News & Events...\n');

    console.log('📋 Please run this SQL in Supabase SQL Editor:\n');
    console.log(`
-- Create announcements table for news and events
CREATE TABLE IF NOT EXISTS public.announcements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    content text NOT NULL,
    type text NOT NULL CHECK (type IN ('news', 'event')),
    published boolean DEFAULT false,
    event_date timestamp with time zone,
    image_url text,
    created_by uuid REFERENCES public.profiles(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_announcements_published ON public.announcements(published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_type ON public.announcements(type);
CREATE INDEX IF NOT EXISTS idx_announcements_event_date ON public.announcements(event_date) WHERE type = 'event';

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view published announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins can manage all announcements" ON public.announcements;

-- Policy: Public can view published announcements
CREATE POLICY "Public can view published announcements"
ON public.announcements FOR SELECT
USING (published = true);

-- Policy: Admins can manage all announcements
CREATE POLICY "Admins can manage all announcements"
ON public.announcements FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND (role = 'sys-admin' OR role = 'admin')
    )
);

-- Grant permissions
GRANT SELECT ON public.announcements TO anon;
GRANT SELECT ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
    `);

    // Test if table exists
    const { data, error } = await supabase
        .from('announcements')
        .select('id')
        .limit(1);

    if (error) {
        console.log('\n❌ Table does not exist yet. Please run the SQL above.');
    } else {
        console.log('\n✅ Announcements table already exists!');
    }
}

runMigration().catch(console.error);
