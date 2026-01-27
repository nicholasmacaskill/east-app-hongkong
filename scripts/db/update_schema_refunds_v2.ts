import getDbPool from '../../app/lib/db';

const run = async () => {
    const pool = getDbPool();
    const client = await pool.connect();
    try {
        console.log('Applying Payer ID & Refund Logic Updates...');

        // 1. Add payer_id column
        await client.query(`
      ALTER TABLE registrations 
      ADD COLUMN IF NOT EXISTS payer_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
    `);
        console.log('✅ Added payer_id column.');

        // 2. Update Booking Function
        await client.query(`DROP FUNCTION IF EXISTS book_session_with_credits(uuid, bigint, uuid);`);
        await client.query(`
      CREATE OR REPLACE FUNCTION book_session_with_credits(
        p_user_id uuid,          -- The payer (who pays)
        p_session_id bigint,     -- The session
        p_attendee_id uuid       -- The attendee (who goes)
      )
      RETURNS json
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        v_credit_cost int;
        v_user_credits int;
        v_attendee_id uuid;
      BEGIN
        -- Determine attendee (default to payer if null)
        v_attendee_id := COALESCE(p_attendee_id, p_user_id);

        -- Check if already registered
        IF EXISTS (SELECT 1 FROM registrations WHERE user_id = v_attendee_id AND session_id = p_session_id) THEN
            RETURN json_build_object('success', false, 'message', 'Attendee is already registered.');
        END IF;

        -- Get Cost
        SELECT credit_cost INTO v_credit_cost FROM sessions WHERE id = p_session_id;
        
        -- Get Payer Credits
        SELECT credits INTO v_user_credits FROM profiles WHERE id = p_user_id;

        IF v_credit_cost IS NULL THEN
            RETURN json_build_object('success', false, 'message', 'Session cost not defined.');
        END IF;

        IF v_user_credits < v_credit_cost THEN
            RETURN json_build_object('success', false, 'message', 'Insufficient credits.');
        END IF;

        -- Deduct Credits from PAYER
        UPDATE profiles SET credits = credits - v_credit_cost WHERE id = p_user_id;
        
        -- Create Registration (Record Payer)
        INSERT INTO registrations (user_id, session_id, payer_id) 
        VALUES (v_attendee_id, p_session_id, p_user_id);

        RETURN json_build_object(
            'success', true, 
            'message', 'Booking confirmed!', 
            'new_balance', v_user_credits - v_credit_cost
        );
      END;
      $$;
    `);
        console.log('✅ Updated book_session_with_credits function.');

        // 3. Update Cancel/Refund Function
        await client.query(`DROP FUNCTION IF EXISTS cancel_session_and_refund(uuid, bigint);`);
        await client.query(`
      CREATE OR REPLACE FUNCTION cancel_session_and_refund(
        p_attendee_id uuid,      -- The attendee (who is registered)
        p_session_id bigint
      )
      RETURNS json
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        v_credit_cost int;
        v_payer_id uuid;
        v_registration_exists bool;
      BEGIN
        -- Check registration and get Payer
        SELECT payer_id INTO v_payer_id 
        FROM registrations 
        WHERE user_id = p_attendee_id AND session_id = p_session_id;

        IF NOT FOUND THEN
            RETURN json_build_object('success', false, 'message', 'Booking not found.');
        END IF;

        -- Default payer to attendee if null (legacy data)
        v_payer_id := COALESCE(v_payer_id, p_attendee_id);

        SELECT credit_cost INTO v_credit_cost FROM sessions WHERE id = p_session_id;

        IF v_credit_cost IS NULL THEN
            -- Free session, just delete
            DELETE FROM registrations WHERE user_id = p_attendee_id AND session_id = p_session_id;
            RETURN json_build_object('success', true, 'message', 'Cancellation confirmed.');
        END IF;

        -- Refund the PAYER
        UPDATE profiles SET credits = credits + v_credit_cost WHERE id = v_payer_id;
        
        -- Delete Registration
        DELETE FROM registrations WHERE user_id = p_attendee_id AND session_id = p_session_id;

        RETURN json_build_object(
            'success', true, 
            'message', 'Cancellation successful. Credits refunded to payer.', 
            'refund_amount', v_credit_cost
        );
      END;
      $$;
    `);
        console.log('✅ Updated cancel_session_and_refund function.');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        client.release();
        await pool.end();
    }
};

run();
