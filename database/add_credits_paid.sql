-- Add credits_paid column to registrations for accurate refunds
-- Idempotent check

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'registrations' 
        AND column_name = 'credits_paid'
    ) THEN
        ALTER TABLE registrations 
        ADD COLUMN credits_paid INTEGER DEFAULT 0;
        
        RAISE NOTICE 'Column credits_paid added to registrations';
    END IF;
END $$;
