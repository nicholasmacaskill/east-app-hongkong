-- Create the atomic credit increment function
CREATE OR REPLACE FUNCTION public.increment_credits(p_user_id UUID, p_amount INT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.profiles
    SET 
        credits = COALESCE(credits, 0) + p_amount,
        account_status = 'active'
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION public.increment_credits(UUID, INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_credits(UUID, INT) TO authenticated;
