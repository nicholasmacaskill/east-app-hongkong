-- =============================================
-- Migration: Add Membership Tier to Profiles
-- =============================================
-- Purpose: Add membership_tier column to support tiered pricing
-- Options: individual, family_2, family_3plus

BEGIN;

-- Add membership_tier column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS membership_tier TEXT 
CHECK (membership_tier IN ('individual', 'family_2', 'family_3plus')) 
DEFAULT 'individual';

-- Update existing users to 'individual' tier
UPDATE profiles 
SET membership_tier = 'individual' 
WHERE membership_tier IS NULL;

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_profiles_membership_tier 
ON profiles(membership_tier);

COMMIT;

-- Verification Query
SELECT membership_tier, COUNT(*) as user_count
FROM profiles
GROUP BY membership_tier;
