import { test as setup } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
    // 1. Create Test User via Admin API
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Missing Supabase Environment Variables for Test Setup');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const timestamp = Date.now();
    const email = `test-parent-${timestamp}@east.com`;
    const password = 'test-password-123';

    // Create User with auto-confirmation
    const { data: user, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            first_name: 'Test',
            last_name: 'Parent',
            role: 'parent'
        }
    });

    if (error || !user.user) throw error;
    const userId = user.user.id; // Corrected: user.user property

    console.log(`Created test user: ${email} (${userId})`);

    // 2. Login via UI (Triggers profile creation/repair)
    await page.goto('/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button:has-text("LOGIN")');

    // 3. Wait for redirect (Profile should exist now)
    await page.waitForURL('/');
    await page.waitForTimeout(2000); // Allow repair-profile async fetch to complete if needed

    // 4. Grant Credits (Admin Override)
    const { error: updateError } = await supabase
        .from('profiles')
        .update({
            credits: 100,
            subscription_status: 'active' // Ensure user can book
        })
        .eq('id', userId);

    if (updateError) {
        // If profile doesn't exist yet, we might need to upsert or wait longer.
        // But login redirect usually implies profiles fetched or repaired.
        // Let's wrap in a retry or just log.
        console.error('Failed to grant credits:', updateError);
        // Try INSERT if update failed (though typically it's an update)
    } else {
        console.log('Granted 100 credits to test user.');
    }

    // 5. Save state
    await page.context().storageState({ path: authFile });
});
