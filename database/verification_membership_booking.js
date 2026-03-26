const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

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
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function verify() {
    console.log('🧪 Starting Phase 3 Verification...');

    const testEmail = `verify_${Date.now()}@test.com`;
    
    // 2. Create test user
    const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: 'password123',
        email_confirm: true
    });

    if (createError) {
        console.error('❌ Failed to create test user:', JSON.stringify(createError, null, 2));
        throw createError;
    }

    if (!authUser || !authUser.user) {
        throw new Error('❌ Auth user creation returned null');
    }

    const userId = authUser.user.id;
    console.log(`👤 Created Test User: ${userId}`);

    try {
        // 3. Setup: 1000 credits, Inactive Membership
        console.log('⚙️ Setting up: 1000 credits, Inactive Membership...');
        const { error: setupError } = await supabase.from('profiles').update({
            credits: 1000,
            subscription_status: 'inactive',
            account_status: 'inactive',
            membership_expires: null
        }).eq('id', userId);

        if (setupError) throw setupError;

        // 4. Find a session to book
        const { data: session } = await supabase.from('sessions').select('id').limit(1).single();
        if (!session) throw new Error('No sessions found for testing');

        console.log(`📅 Attempting to book session ${session.id} as INACTIVE user...`);

        // 5. Attempt Booking (Should Fail)
        const { data: failResult, error: failError } = await supabase.rpc('master_book_atomic', {
            p_user_id: userId,
            p_session_id: session.id,
            p_attendee_ids: [userId]
        });

        if (failError) {
            console.error('❌ RPC Error during negative test:', JSON.stringify(failError, null, 2));
            throw failError;
        }
        
        if (failResult && !failResult.success && failResult.code === 'SUBSCRIPTION_LOCKED') {
            console.log('✅ PASS: Booking rejected with SUBSCRIPTION_LOCKED as expected.');
        } else {
            console.error('❌ FAIL: Booking should have been rejected with SUBSCRIPTION_LOCKED. Result:', JSON.stringify(failResult, null, 2));
        }

        // 6. Setup: Grant Manual Membership
        console.log('🔓 Granting manual membership (Expires tomorrow)...');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        await supabase.from('profiles').update({
            membership_expires: tomorrow.toISOString()
        }).eq('id', userId);

        // 7. Attempt Booking (Should Succeed)
        console.log(`📅 Attempting to book session ${session.id} as ACTIVE user...`);
        const { data: passResult, error: passError } = await supabase.rpc('master_book_atomic', {
            p_user_id: userId,
            p_session_id: session.id,
            p_attendee_ids: [userId]
        });

        if (passError) {
            console.error('❌ RPC Error during positive test:', JSON.stringify(passError, null, 2));
            throw passError;
        }

        if (passResult && passResult.success) {
            console.log('✅ PASS: Booking successful with valid manual membership.');
        } else {
            console.error('❌ FAIL: Booking failed even with active membership. Result:', JSON.stringify(passResult, null, 2));
        }

        // 8. Test Top-Up doesn't activate
        console.log('💰 Testing Top-up (increment_credits) does NOT activate account...');
        // Reset to inactive first
        await supabase.from('profiles').update({
            subscription_status: 'inactive',
            account_status: 'inactive',
            membership_expires: null
        }).eq('id', userId);

        const { error: incError } = await supabase.rpc('increment_credits', { p_user_id: userId, p_amount: 500 });
        if (incError) throw incError;
        
        const { data: freshProfile } = await supabase.from('profiles').select('account_status').eq('id', userId).single();
        if (freshProfile.account_status === 'inactive') {
            console.log('✅ PASS: increment_credits did NOT change account_status to active.');
        } else {
            console.error('❌ FAIL: increment_credits still activated the account. Status:', freshProfile.account_status);
        }

    } catch (e) {
        console.error('🔥 Error during verification:', e);
    } finally {
        // Cleanup
        console.log('🧹 Cleaning up test user...');
        await supabase.auth.admin.deleteUser(userId);
    }
}

verify();
