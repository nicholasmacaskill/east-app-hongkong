-- Create a table to link Parents (users) to Children (profiles)
-- This allows a parent to manage multiple player profiles
CREATE TABLE IF NOT EXISTS player_relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) DEFAULT 'parent_child', -- scalable for guardians, etc.
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(parent_id, child_id)
);

-- Enable RLS
ALTER TABLE player_relationships ENABLE ROW LEVEL SECURITY;

-- Policy: Parents can see their own relationships
CREATE POLICY "Parents can view their relationships"
  ON player_relationships FOR SELECT
  USING (auth.uid() = parent_id);

-- Policy: Parents can insert relationships for themselves
CREATE POLICY "Parents can insert relationships"
  ON player_relationships FOR INSERT
  WITH CHECK (auth.uid() = parent_id);
  
-- Policy: Parents can delete their relationships
CREATE POLICY "Parents can delete relationships"
  ON player_relationships FOR DELETE
  USING (auth.uid() = parent_id);

-- Add column to profiles to distinguish Real Users vs Managed Children
-- If 'is_managed' is true, they might not have a login.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_managed BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES auth.users(id);

-- Ensure players_stats has all necessary fields (from previous review it seemed okay, but ensuring constraints)
-- Linking to the specific game or session might be useful later, but for now season/total is key.
