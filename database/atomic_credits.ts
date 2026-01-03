const { Pool } = require('pg');

const getDbPool = () => {
    return new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '54322', 10),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'postgres',
    });
};

const sql = `
CREATE OR REPLACE FUNCTION public.deduct_credits(
    p_user_id uuid,
    p_amount int,
    p_reason text
) RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_current_credits int;
    v_new_balance int;
BEGIN
    -- 1. Get current credits with locking
    SELECT credits INTO v_current_credits
    FROM public.profiles
    WHERE id = p_user_id
    FOR UPDATE;

    IF v_current_credits IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Profile not found');
    END IF;

    -- 2. Check sufficiency
    IF v_current_credits < p_amount THEN
        RETURN json_build_object('success', false, 'message', 'Insufficient credits. Balance: ' || v_current_credits);
    END IF;

    -- 3. Perform deduction
    v_new_balance := v_current_credits - p_amount;
    
    UPDATE public.profiles
    SET credits = v_new_balance
    WHERE id = p_user_id;

    -- 4. Return success
    RETURN json_build_object(
        'success', true, 
        'message', 'Deducted ' || p_amount || ' credits for: ' || p_reason,
        'new_balance', v_new_balance
    );
END;
$$;
`;

(async () => {
    const pool = getDbPool();
    const client = await pool.connect();
    try {
        console.log("🚀 Creating RPC: deduct_credits...");
        await client.query(sql);
        console.log("✅ Success: RPC deduct_credits created.");
    } catch (e) {
        console.error("❌ Failed to create RPC:", e);
    } finally {
        client.release();
        await pool.end();
    }
})();
