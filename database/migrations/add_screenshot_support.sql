-- Add screenshot support to Engineering Tickets
-- Run this in the Supabase Dashboard SQL Editor

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
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload ticket attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ticket-attachments');

-- Allow public viewing
CREATE POLICY "Anyone can view ticket attachments"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'ticket-attachments');
