-- STORAGE BUCKET SETUP
-- Automatically create the 'avatars' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow Public Access to Avatars
CREATE POLICY "Public Avatars Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- Allow Authenticated Uploads
CREATE POLICY "Authenticated Avatar Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );
