import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function verifyDeployment() {
    console.log(`🚀 Starting Post-Deploy Verification for ${baseUrl}...`);

    try {
        // 1. Check Heartbeat
        console.log(`📡 Checking heartbeat at ${baseUrl}/api/health...`);
        const healthResponse = await fetch(`${baseUrl}/api/health`);
        const healthData = await healthResponse.json();

        if (healthResponse.status !== 200 || healthData.status !== 'healthy') {
            throw new Error(`🚩 HEARTBEAT FAILED: ${JSON.stringify(healthData)}`);
        }
        console.log('✅ Heartbeat: Healthy');

        // 2. Verify Database Connectivity via Service Role
        console.log('🔗 Verifying Supabase Admin connectivity...');
        const supabaseAdmin = createClient(supabaseUrl!, serviceRoleKey!);
        const { count, error } = await supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true });

        if (error) {
            throw new Error(`🚩 DB CONNECTIVITY FAILED: ${error.message}`);
        }
        console.log(`✅ DB Connection: Verified (Profile Count: ${count})`);

        // 3. Booking Engine Sanity Check
        console.log('📅 Verifying Booking Engine RPC (master_book_atomic)...');
        // Use a random UUID to ensure we get a "User profile not found" or "Account Locked" error
        // instead of a 500 or "Function not found".
        const dummyId = '00000000-0000-0000-0000-000000000000';
        const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('master_book_atomic', {
            p_user_id: dummyId,
            p_session_id: 1, // Dummy session
            p_attendee_ids: [dummyId]
        });

        if (rpcError) {
             // If function is missing or has signature mismatch, this will fail.
             throw new Error(`🚩 RPC SIGNATURE FAILURE: ${rpcError.message}`);
        }

        // We expect "User profile not found" which is success: false but message: 'User profile not found'
        if (rpcResult && rpcResult.message && rpcResult.message.includes('not found')) {
            console.log('✅ Booking RPC: Verified (Responded correctly to dummy input)');
        } else {
            console.warn(`⚠️ Booking RPC returned unexpected result: ${JSON.stringify(rpcResult)}`);
        }

        console.log('🏁 Deployment Verification: SUCCESSFUL');

    } catch (err: any) {
        console.error('❌ DEPLOYMENT VERIFICATION FAILED!');
        console.error(err.message || err);
        process.exit(1);
    }
}

verifyDeployment();
