-- STORAGE BUCKET SETUP
-- Automatically create the 'avatars' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Automatically create the 'uploads' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Allow Public Access to Avatars & Uploads
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id IN ('avatars', 'uploads') );

-- Allow Authenticated Uploads
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id IN ('avatars', 'uploads') AND auth.role() = 'authenticated' );

-- Allow Authenticated Updates/Deletes (for own files)
CREATE POLICY "Authenticated Owner Access"
ON storage.objects FOR UPDATE
USING ( bucket_id IN ('avatars', 'uploads') AND auth.role() = 'authenticated' );
