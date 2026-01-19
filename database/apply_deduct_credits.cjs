
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const sql = `
CREATE OR REPLACE FUNCTION public.deduct_credits(
    p_user_id UUID,
    p_amount INTEGER,
    p_reason TEXT DEFAULT 'QR Payment'
) RETURNS JSON AS $$
DECLARE
    v_current_credits INTEGER;
    v_new_credits INTEGER;
BEGIN
    -- 1. Get current credits
    SELECT credits INTO v_current_credits FROM public.profiles WHERE id = p_user_id FOR UPDATE;
    
    IF v_current_credits IS NULL OR v_current_credits < p_amount THEN
        RETURN json_build_object('success', false, 'error', 'Insufficient credits');
    END IF;
    
    -- 2. Deduct credits
    UPDATE public.profiles 
    SET credits = credits - p_amount 
    WHERE id = p_user_id 
    RETURNING credits INTO v_new_credits;
    
    RETURN json_build_object('success', true, 'new_balance', v_new_credits);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

async function applySql() {
    console.log('Attempting to apply SQL via RPC...');

    // We try 'exec_sql' or 'run_sql' if it exists
    const { data, error } = await supabase.rpc('run_sql', { sql });

    if (error) {
        console.error('Failed to run SQL via RPC:', error.message);
        console.log('Please run the SQL manually in the Supabase Dashboard.');
    } else {
        console.log('SQL applied successfully via run_sql!');
    }
}

applySql();
