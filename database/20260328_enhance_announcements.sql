-- database/20260328_enhance_announcements.sql
-- Add external_url and additional_images to announcements table

ALTER TABLE announcements ADD COLUMN IF NOT EXISTS external_url TEXT;

-- Use JSONB for additional_images to allow for flexible metadata (caption, alt text) if needed later
-- or just an array of strings. Let's use TEXT[] for simplicity as requested in the plan.
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS additional_images TEXT[] DEFAULT '{}';

-- Re-run schema cache refresh if needed (handled by most Supabase clients automatically)
