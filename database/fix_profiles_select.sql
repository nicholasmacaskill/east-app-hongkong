-- Ensure Public Select is ON
DROP POLICY IF EXISTS "Public Profiles Access" ON profiles;
CREATE POLICY "Public Profiles Access" ON profiles FOR SELECT USING (true);

-- Ensure Grants are correct
GRANT SELECT ON profiles TO anon, authenticated;
