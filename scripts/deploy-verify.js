const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Manual env loading if .env.local exists (local testing)
function loadEnv() {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join('=').trim().replace(/(^"|"$)/g, '');
                if (key && !key.startsWith('#')) {
                    process.env[key] = value;
                }
            }
        });
    }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function verifyDeployment() {
    console.log(`🚀 Starting Post-Deploy Verification for ${baseUrl}...`);

    if (!supabaseUrl || !serviceRoleKey) {
        console.error('❌ Missing Supabase credentials in environment.');
        process.exit(1);
    }

    try {
        // 1. Check Heartbeat
        console.log(`📡 Checking heartbeat at ${baseUrl}/api/health...`);
        const healthResponse = await fetch(`${baseUrl}/api/health`);
        
        if (healthResponse.status !== 200) {
            const text = await healthResponse.text();
            throw new Error(`🚩 HEARTBEAT FAILED: Status ${healthResponse.status}. Body: ${text.substring(0, 100)}`);
        }
        
        const healthData = await healthResponse.json();
        if (healthData.status !== 'healthy') {
            throw new Error(`🚩 SYSTEM UNHEALTHY: ${JSON.stringify(healthData)}`);
        }
        console.log('✅ Heartbeat: Healthy');

        // 2. Verify Database Connectivity via Service Role
        console.log('🔗 Verifying Supabase Admin connectivity...');
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
        const { count, error } = await supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true });

        if (error) {
            throw new Error(`🚩 DB CONNECTIVITY FAILED: ${error.message}`);
        }
        console.log(`✅ DB Connection: Verified (Profile Count: ${count})`);

        // 3. Booking Engine Sanity Check
        console.log('📅 Verifying Booking Engine RPC (master_book_atomic)...');
        const dummyId = '00000000-0000-0000-0000-000000000000';
        const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('master_book_atomic', {
            p_user_id: dummyId,
            p_session_id: 1,
            p_attendee_ids: [dummyId]
        });

        if (rpcError) {
             throw new Error(`🚩 RPC SIGNATURE FAILURE: ${rpcError.message}`);
        }

        if (rpcResult && rpcResult.message && rpcResult.message.includes('not found')) {
            console.log('✅ Booking RPC: Verified (Responded correctly to dummy input)');
        } else {
            console.warn(`⚠️ Booking RPC returned unexpected result: ${JSON.stringify(rpcResult)}`);
        }

        console.log('🏁 Deployment Verification: SUCCESSFUL');

    } catch (err) {
        console.error('❌ DEPLOYMENT VERIFICATION FAILED!');
        console.error(err.message || err);
        process.exit(1);
    }
}

verifyDeployment();
