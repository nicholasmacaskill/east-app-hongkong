import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// 1. Load test environment
const envPath = path.resolve(process.cwd(), '.env.test.latest');
console.log(`📡 Loading env from: ${envPath}`);
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing credentials in .env.test.latest');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRPC() {
    console.log('🛠️ Fixing deduct_credits RPC on TEST database...');

    const sql = `
    -- Drop all variations to be safe
    DROP FUNCTION IF EXISTS public.deduct_credits(uuid, integer, text);
    DROP FUNCTION IF EXISTS public.deduct_credits(integer, text, uuid);
    
    -- Create the correct function
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
        -- 1. Get current credits with LOCK
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
        VALUES (p_user_id, -p_amount, 'topup', p_reason);

        RETURN json_build_object(
            'success', true, 
            'message', 'Payment successful', 
            'new_balance', v_new_balance
        );
    END;
    $$;

    -- Standard Permissions
    GRANT EXECUTE ON FUNCTION public.deduct_credits(uuid, integer, text) TO service_role;
    GRANT EXECUTE ON FUNCTION public.deduct_credits(uuid, integer, text) TO authenticated;
    `;

    // Execute via our run_sql wrapper or directly if we have a way.
    // In this repo, many scripts use a direct RPC to 'run_sql' if available.
    // Let's try to run it via the rpc('run_sql') which is common in this setup.
    const { error } = await supabase.rpc('run_sql', { sql });

    if (error) {
        console.error('❌ RPC Execution Failed:', error);
        
        // Strategy B: If run_sql is not available, we might need another way or the user to run it.
        // But usually in this project, run_sql is enabled for the service_role.
        process.exit(1);
    } else {
        console.log('✅ Success: deduct_credits RPC has been restored and granted permissions.');
    }
}

fixRPC();
