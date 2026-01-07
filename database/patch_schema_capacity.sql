-- =============================================
-- PATCH: Add missing columns to 'sessions'
-- DIAGNOSIS: RPC failed because 'max_capacity' was missing.
-- =============================================

-- 1. Add max_capacity if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'max_capacity') THEN
        ALTER TABLE sessions ADD COLUMN max_capacity integer DEFAULT 10;
        RAISE NOTICE 'Added max_capacity to sessions';
    END IF;
END $$;

-- 2. Add coach_image_url if missing (just in case)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'coach_image_url') THEN
        ALTER TABLE sessions ADD COLUMN coach_image_url text;
        RAISE NOTICE 'Added coach_image_url to sessions';
    END IF;
END $$;

-- 3. Add payer_id to registrations if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'registrations' AND column_name = 'payer_id') THEN
        ALTER TABLE registrations ADD COLUMN payer_id uuid REFERENCES public.profiles(id);
        RAISE NOTICE 'Added payer_id to registrations';
    END IF;
END $$;
