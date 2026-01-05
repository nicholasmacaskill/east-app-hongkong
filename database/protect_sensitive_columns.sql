-- REVOKE all update privileges from authenticated users on profiles
REVOKE UPDATE ON profiles FROM authenticated;

-- GRANT update privileges ONLY on safe columns
GRANT UPDATE (
  username, 
  first_name, 
  last_name, 
  mobile, 
  contact_email,
  avatar_url, 
  bio, 
  gallery_images, 
  schedule_photo_url,
  intro_video_url, 
  preferences, 
  team, 
  position
) ON profiles TO authenticated;

-- Explicitly DENY update on sensitive columns (Optional, but good for clarity, though REVOKE + specific GRANT covers it)
-- Note: Postgres doesn't have DENY per se for roles in the same way MS SQL does, 
-- but by NOT granting UPDATE on these columns, we achieve the result.

-- Ensure Admin/Service Role still have access
GRANT ALL ON profiles TO service_role;
GRANT ALL ON profiles TO postgres;

-- Verify policy comment (Documentation only)
COMMENT ON TABLE profiles IS 'Secure Profiles Table - Credits/Role Read-Only for Auth Users';
