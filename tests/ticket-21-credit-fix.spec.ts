import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// Use the authenticated Admin session created in admin.auth.setup.ts
test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('Ticket #21 Verification - Admin Credit Top-Ups', () => {

    test('Sys-Admin can successfully adjust player credits without Unauthorized errors', async ({ page, request }) => {
        // 1. Setup Database Connection
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 2. Provision a dummy player for this specific test to add credits to
        const timestamp = Date.now();
        const testEmail = `player-credit-test-${timestamp}@east.com`;
        
        const { data: userData, error: authError } = await supabase.auth.admin.createUser({
            email: testEmail,
            password: 'test-password-123',
            email_confirm: true,
            user_metadata: {
                first_name: 'Credit',
                last_name: 'Tester',
                role: 'player'
            }
        });
        
        expect(authError).toBeNull();
        expect(userData.user).toBeDefined();
        const testPlayerId = userData.user!.id;

        // Force a profile upsert to guarantee they exist and have 0 credits
        await supabase.from('profiles').upsert({
            id: testPlayerId,
            contact_email: testEmail,
            first_name: 'Credit',
            last_name: 'Tester',
            role: 'player',
            credits: 0
        });

        // 3. Verify Initial State
        const { data: initialProfile } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', testPlayerId)
            .single();
            
        expect(initialProfile?.credits).toBe(0);

        // 4. Hit the API directly using the Authenticated Browser Context
        // This simulates the UI making a fetch() request and passing up the admin's session cookie.
        // In Ticket #21, this would fail with "Unauthorized" due to cookie extraction issues.
        const response = await request.post('/api/admin/adjust-credits', {
            data: {
                userId: testPlayerId,
                amount: 50,
                description: 'Ticket #21 Verification Top-Up'
            }
        });

        // 5. Assert the Fix
        const responseData = await response.json();
        
        // It must NOT be 401 Unauthorized
        expect(response.status()).toBe(200);
        expect(responseData.success).toBe(true);
        expect(responseData.newCredits).toBe(50);

        // 6. Double Check the Database
        const { data: finalProfile } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', testPlayerId)
            .single();
            
        expect(finalProfile?.credits).toBe(50);
        
        // 7. Check the transaction log
        const { data: transactions } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', testPlayerId);
            
        expect(transactions?.length).toBe(1);
        expect(transactions![0].amount).toBe(50);
        expect(transactions![0].description).toBe('Ticket #21 Verification Top-Up');

        console.log('✅ Ticket #21 Fix Verified: Admin session extraction logic allows credits to be applied successfully.');

        // Cleanup
        await supabase.auth.admin.deleteUser(testPlayerId);
    });

});
