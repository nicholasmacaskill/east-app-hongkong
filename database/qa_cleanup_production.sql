-- ==============================================================================
-- PRODUCTION QA CLEANUP MIGRATION
-- ==============================================================================
-- Purpose: Fix critical bugs and optimize database for production readiness
-- Date: Jan 18, 2026
-- Safe to run: YES (Idempotent)
-- ==============================================================================

-- ==============================================================================
-- CRITICAL FIX #1: Update book_session_with_credits to store credits_paid
-- ==============================================================================
-- WHY: The current live version doesn't store credits_paid, breaking refunds.
-- The API route manually patches it after booking, but this is fragile.

CREATE OR REPLACE FUNCTION public.book_session_with_credits(
    p_user_id uuid,
    p_session_id bigint,
    p_attendee_id uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_credit_cost int;
    v_user_credits int;
    v_sub_status text;
    v_final_attendee_id uuid;
    v_new_balance int;
BEGIN
    -- Determine who is actually attending
    v_final_attendee_id := COALESCE(p_attendee_id, p_user_id);

    -- Get session cost
    SELECT credit_cost INTO v_credit_cost FROM sessions WHERE id = p_session_id;
    
    -- Get payer credits and subscription status
    SELECT credits, subscription_status INTO v_user_credits, v_sub_status 
    FROM profiles WHERE id = p_user_id;

    IF v_credit_cost IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Session cost not defined.');
    END IF;

    -- Subscription check: Must be active or trialing
    IF v_sub_status IS NULL OR (v_sub_status != 'active' AND v_sub_status != 'trialing') THEN
        RETURN json_build_object('success', false, 'message', 'Membership dormant. Renew to unlock credits.');
    END IF;

    -- Credit check
    IF v_user_credits < v_credit_cost THEN
        RETURN json_build_object('success', false, 'message', 'Insufficient credits.');
    END IF;

    -- Deduct credits from PAYER
    UPDATE profiles SET credits = credits - v_credit_cost WHERE id = p_user_id
    RETURNING credits INTO v_new_balance;
    
    -- ✅ CRITICAL: Store credits_paid for accurate refunds
    INSERT INTO registrations (user_id, session_id, payer_id, credits_paid) 
    VALUES (v_final_attendee_id, p_session_id, p_user_id, v_credit_cost);

    RETURN json_build_object(
        'success', true, 
        'message', 'Booking confirmed!', 
        'new_balance', v_new_balance
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'message', 'Booking failed: ' || SQLERRM);
END;
$$;

COMMENT ON FUNCTION public.book_session_with_credits IS 'Atomic facility booking with credit deduction and refund tracking';

-- ==============================================================================
-- PERFORMANCE FIX #2: Add missing index on stripe_customer_id
-- ==============================================================================
-- WHY: Stripe webhooks query this column on every renewal/checkout event

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id 
ON public.profiles(stripe_customer_id);

COMMENT ON INDEX idx_profiles_stripe_customer_id IS 'Optimizes Stripe webhook lookups';

-- ==============================================================================
-- DATA INTEGRITY FIX #3: Add check constraints for tier and role
-- ==============================================================================
-- WHY: Prevent invalid data from entering via API bugs or manual edits

-- STEP 1: Migrate any invalid tier values to valid ones
UPDATE public.profiles 
SET tier = 'individual' 
WHERE tier NOT IN ('free', 'individual', 'family_2', 'family_3plus')
AND tier IS NOT NULL;

-- STEP 2: Add check constraint for tier column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_tier_check'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_tier_check 
        CHECK (tier IN ('free', 'individual', 'family_2', 'family_3plus'));
        
        RAISE NOTICE 'Added tier check constraint';
    END IF;
END $$;

-- Add check constraint for role column (matching current schema.sql expectations)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_role_check' 
        AND conrelid = 'public.profiles'::regclass
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_role_check 
        CHECK (role IN ('player', 'coach', 'parent', 'sys-admin'));
        
        RAISE NOTICE 'Added role check constraint';
    ELSE
        RAISE NOTICE 'Role check constraint already exists';
    END IF;
END $$;

-- ==============================================================================
-- SECURITY FIX #4: Enable RLS on sessions table
-- ==============================================================================
-- WHY: sessions is the ONLY table without RLS enabled. This is a security gap.

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Create a public read policy (sessions are viewable by everyone)
DROP POLICY IF EXISTS "sessions_public_read" ON public.sessions;
CREATE POLICY "sessions_public_read" 
ON public.sessions 
FOR SELECT 
USING (true);

-- Only service_role (admin API) can modify sessions
DROP POLICY IF EXISTS "sessions_service_role_all" ON public.sessions;
CREATE POLICY "sessions_service_role_all" 
ON public.sessions 
FOR ALL 
USING (auth.role() = 'service_role');

COMMENT ON POLICY "sessions_public_read" ON public.sessions IS 'Allow all users to view sessions';
COMMENT ON POLICY "sessions_service_role_all" ON public.sessions IS 'Only admins can modify sessions';

-- ==============================================================================
-- VERIFICATION & CLEANUP
-- ==============================================================================

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Final verification queries (output for logging)
DO $$ 
BEGIN
    RAISE NOTICE '✅ QA Cleanup Migration Complete';
    RAISE NOTICE '   - book_session_with_credits: NOW stores credits_paid';
    RAISE NOTICE '   - Stripe index: Added for performance';
    RAISE NOTICE '   - Role/Tier constraints: Enforced at DB level';
    RAISE NOTICE '   - Sessions RLS: Enabled with public read policy';
END $$;
