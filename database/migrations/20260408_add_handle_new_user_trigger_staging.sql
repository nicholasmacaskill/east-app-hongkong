-- Migration: Add handle_new_user trigger to staging
-- This trigger auto-creates a profile row when a new auth user is created.
-- Was missing from staging, causing user creation to not produce a profile.
-- NOTE: staging profiles schema has no 'username' column - omitted accordingly.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    first_name,
    last_name,
    contact_email,
    username,
    role,
    credits
  )
  VALUES (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.email,
    split_part(new.email, '@', 1),
    COALESCE(new.raw_user_meta_data->>'role', 'player'),
    0
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
