import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.production' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyRefundFix() {
    console.log("🧪 Starting Live Refund Verification...");

    const testEmail = `test_refund_${Date.now()}@example.com`;
    let userId: string | null = null;
    let sessionId: number | null = null;
    let registrationId: number | null = null;

    try {
        // 1. Create Test User
        const { data: user, error: userError } = await supabase.auth.admin.createUser({
            email: testEmail,
            email_confirm: true,
            user_metadata: { role: 'player' }
        });

        if (userError || !user.user) throw new Error(`User creation failed: ${userError?.message}`);
        userId = user.user.id;
        console.log(`Created test user: ${userId}`);

        // Ensure Profile Exists
        const { data: existingProfile } = await supabase.from('profiles').select('id').eq('id', userId).single();
        if (!existingProfile) {
            console.log("Profile not found after create, inserting manually...");
            await supabase.from('profiles').insert({
                id: userId,
                contact_email: testEmail,
                first_name: 'Test',
                last_name: 'User',
                role: 'player',
                credits: 100
            });
        } else {
            await supabase.from('profiles').update({ credits: 100 }).eq('id', userId);
        }

        // 2. Create Test Session
        const { data: session, error: sessionError } = await supabase
            .from('sessions')
            .insert({
                title: 'Refund Test Session',
                start_time: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
                end_time: new Date(Date.now() + 90000000).toISOString(),
                credit_cost: 10
            })
            .select()
            .single();

        if (sessionError || !session) throw new Error(`Session creation failed: ${sessionError?.message}`);
        sessionId = session.id;
        console.log(`Created test session: ${sessionId}`);

        // 3. Register User
        const { data: reg, error: regError } = await supabase
            .from('registrations')
            .insert({
                user_id: userId,
                session_id: sessionId,
                payer_id: userId,
                credits_paid: 10
            })
            .select()
            .single();

        if (regError) {
            console.log("Registration insert failed, retrying without credits_paid...");
            const { data: reg2, error: regError2 } = await supabase
                .from('registrations')
                .insert({ user_id: userId, session_id: sessionId, payer_id: userId })
                .select().single();
            if (regError2) throw new Error(`Registration failed: ${regError2.message}`);
            registrationId = reg2.id;
        } else {
            registrationId = reg.id;
        }

        console.log(`Registered user for session. Initial Credits: 100`);

        // Deduct credits manually
        await supabase.from('profiles').update({ credits: 90 }).eq('id', userId);

        // 4. Execute Refund RPC V2
        const refundAmount = 5;
        console.log(`Calling cancel_session_and_refund_v2 with refund=${refundAmount}...`);

        const { data: rpcResult, error: rpcError } = await supabase.rpc('cancel_session_and_refund_v2', {
            p_attendee_id: userId,
            p_session_id: sessionId,
            p_refund_amount: refundAmount
        });

        if (rpcError) throw new Error(`RPC failed: ${rpcError.message}`);
        console.log("RPC Result:", rpcResult);

        // 5. Verify Credits (Should be 95)
        const { data: profile } = await supabase.from('profiles').select('credits').eq('id', userId).single();
        if (profile?.credits !== 95) {
            throw new Error(`Credit verification failed. Expected 95, got ${profile?.credits}`);
        }
        console.log("✅ Credit verification passed (90 -> 95). Code is working!");

        // 6. Verify Registration Deleted
        const { data: checkReg } = await supabase.from('registrations').select('*').eq('user_id', userId).eq('session_id', sessionId);
        if (checkReg && checkReg.length > 0) {
            throw new Error("Registration was not deleted!");
        }
        console.log("✅ Registration deletion verified");

    } catch (e: any) {
        console.error("❌ Test Failed:", e.message);
        process.exit(1);
    } finally {
        // Cleanup
        if (userId) await supabase.auth.admin.deleteUser(userId);
        if (sessionId) await supabase.from('sessions').delete().eq('id', sessionId);
        console.log("Cleanup complete.");
    }
}

verifyRefundFix();
