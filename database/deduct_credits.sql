-- Atomic function for QR payments and credit deductions
CREATE OR REPLACE FUNCTION public.deduct_credits(
    p_user_id uuid,
    p_amount integer,
    p_reason text DEFAULT 'QR Payment'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_credits integer;
    v_new_balance integer;
BEGIN
    -- 1. Get current credits with lock
    SELECT credits INTO v_current_credits FROM public.profiles WHERE id = p_user_id FOR UPDATE;
    
    IF v_current_credits IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Profile not found');
    END IF;

    IF v_current_credits < p_amount THEN
        RETURN json_build_object('success', false, 'message', 'Insufficient credits');
    END IF;

    -- 2. Deduct credits
    v_new_balance := v_current_credits - p_amount;
    UPDATE public.profiles SET credits = v_new_balance WHERE id = p_user_id;

    -- 3. Log transaction (assumes transactions table exists)
    -- Check if transactions table exists before inserting
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions') THEN
        INSERT INTO public.transactions (user_id, amount, type, description)
        VALUES (p_user_id, -p_amount, 'topup', p_reason);
    END IF;

    RETURN json_build_object(
        'success', true, 
        'message', 'Payment successful', 
        'new_balance', v_new_balance
    );
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION public.deduct_credits(uuid, integer, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.deduct_credits(uuid, integer, text) TO authenticated;
