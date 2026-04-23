-- Migration to ensure transaction types include 'purchase' and 'manual'
-- Since we found no existing constraint on the test DB, we apply a fresh one.

DO $$ 
BEGIN
    -- 1. Just in case there is an unnamed constraint we missed, we'll try to identify and drop 
    -- any constraint that looks like our previous types list.
    -- (Skipping this as the pg_constraint check was empty)

    -- 2. Add the robust check constraint
    -- We include: topup, membership, transfer, booking, refund, manual, purchase, checkin
    ALTER TABLE public.transactions 
    ADD CONSTRAINT transactions_type_check 
    CHECK (type IN ('topup', 'membership', 'transfer', 'booking', 'refund', 'manual', 'purchase', 'checkin'));

END $$;
