-- Enable the extension if not checked (usually enabled)
-- create extension if not exists "uuid-ossp";

-- 1. Create the Function
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    first_name, 
    last_name, 
    contact_email, -- Ensure this matches your schema (might be 'email')
    username,
    role,
    credits
  )
  VALUES (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.email,
    split_part(new.email, '@', 1), -- Fallback username
    COALESCE(new.raw_user_meta_data->>'role', 'player'),
    0
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Verify
SELECT * FROM information_schema.triggers WHERE event_object_table = 'users';
