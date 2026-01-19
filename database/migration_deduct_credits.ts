import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    console.log('🚀 Migration: Create handle_qr_payment RPC');

    // This RPC handles atomic deduction and logs the transaction in one go.
    const sql = `
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
        -- 1. Get current credits
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

        -- 3. Log transaction
        INSERT INTO public.transactions (user_id, amount, type, description)
        VALUES (p_user_id, -p_amount, 'topup', p_reason); -- Using 'topup' as a generic type or we could add 'payment'

        RETURN json_build_object(
            'success', true, 
            'message', 'Payment successful', 
            'new_balance', v_new_balance
        );
    END;
    $$;

    GRANT EXECUTE ON FUNCTION public.deduct_credits(uuid, integer, text) TO service_role;
    GRANT EXECUTE ON FUNCTION public.deduct_credits(uuid, integer, text) TO authenticated;
    `;

    const { error } = await supabase.rpc('run_sql', { sql });

    if (error) {
        console.error('❌ RPC Creation Failed (run_sql likely missing):', error);
        console.log('⚠️ Please run the SQL in deduct_credits.sql manually if needed.');
    } else {
        console.log('✅ Success: deduct_credits RPC created.');
    }
}

runMigration();
