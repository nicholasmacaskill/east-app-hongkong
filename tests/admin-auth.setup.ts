import { test as setup } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const adminAuthFile = 'playwright/.auth/admin.json';

setup('authenticate as admin', async ({ page }) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Missing Supabase Environment Variables for Test Setup');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const timestamp = Date.now();
    const email = `test-admin-${timestamp}@east.com`;
    const password = 'admin-password-123';

    // Create Admin User
    const { data: user, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            first_name: 'Test',
            last_name: 'Admin',
            role: 'sys-admin'
        }
    });

    if (error || !user.user) throw error;
    const userId = user.user.id;

    console.log(`Created test admin: ${email} (${userId})`);

    // Login via UI
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);

    // Force click to handle animation/instability
    await page.locator('button:has-text("LOGIN")').click({ force: true });

    // Wait for redirect
    await page.waitForURL('/', { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Ensure admin role in profile
    const { error: updateError } = await supabase
        .from('profiles')
        .update({
            role: 'sys-admin',
            credits: 1000
        })
        .eq('id', userId);

    if (updateError) {
        console.error('Failed to set admin role:', updateError);
    } else {
        console.log('Set admin role for test user.');
    }

    // Save state
    await page.context().storageState({ path: adminAuthFile });
});
