-- ============================================================================
-- FIX TRANSACTIONS TABLE CONSTRAINT
-- ============================================================================
-- This SQL fixes the transactions table CHECK constraint to allow all
-- transaction types including 'manual' for admin credit adjustments.
--
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ============================================================================

-- 1. Drop the existing constraint
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;

-- 2. Add new constraint with all supported types
ALTER TABLE public.transactions ADD CONSTRAINT transactions_type_check 
CHECK (type IN ('topup', 'membership', 'transfer', 'booking', 'refund', 'manual'));

-- 3. Verify the constraint was added
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.transactions'::regclass
AND conname = 'transactions_type_check';

-- Expected output should show:
-- transactions_type_check | CHECK ((type = ANY (ARRAY['topup'::text, 'membership'::text, 'transfer'::text, 'booking'::text, 'refund'::text, 'manual'::text])))
