import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// 1. Load test environment
const envPath = path.resolve(process.cwd(), '.env.test.latest');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyRPC() {
    console.log('🔍 Verifying deduct_credits RPC on TEST database...');

    // Try to call the RPC with a non-existent UUID
    // If it exists, it should return { success: false, message: 'Profile not found' }
    // If it doesn't exist, it will return a PGRST202 error
    const { data, error } = await supabase.rpc('deduct_credits', {
        p_user_id: '00000000-0000-0000-0000-000000000000',
        p_amount: 10,
        p_reason: 'Verification Test'
    });

    if (error) {
        console.error('❌ Verification Failed:', error);
        process.exit(1);
    } else {
        console.log('✅ RPC is REACHABLE.');
        console.log('📦 Data returned:', data);
        
        if (data.success === false && data.message === 'Profile not found') {
            console.log('✅ Logic confirmation: The function is working exactly as expected.');
        } else {
            console.log('⚠️ Logic check: Unexpected response data.');
        }
    }
}

verifyRPC();
