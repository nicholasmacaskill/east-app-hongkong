-- 1. Create Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount integer NOT NULL,
    type text NOT NULL CHECK (type IN ('topup', 'membership', 'transfer', 'booking', 'refund')),
    stripe_session_id text UNIQUE, 
    description text,
    created_at timestamp with time zone DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Users can see their own transactions
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own transactions' AND tablename = 'transactions') THEN
        CREATE POLICY "Users can view their own transactions" 
        ON public.transactions FOR SELECT 
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all transactions' AND tablename = 'transactions') THEN
        CREATE POLICY "Admins can view all transactions" 
        ON public.transactions FOR ALL 
        USING (EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'sys-admin'
        ));
    END IF;
END $$;
