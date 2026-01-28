import { test as setup } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const authFile = 'playwright/.auth/admin.json';

setup('authenticate as admin', async ({ page }) => {
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

    setup.setTimeout(120000);
    // 1. Create Test Admin via Admin API
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Missing Supabase Environment Variables for Test Setup');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const timestamp = Date.now();
    const email = `test-admin-${timestamp}@east.com`;
    const password = 'test-password-123';

    // Create User with auto-confirmation and sys-admin role
    const { data: user, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            first_name: 'Test',
            last_name: 'Admin',
            role: 'sys-admin' // Critical: Set role to sys-admin
        }
    });

    if (error || !user.user) throw error;

    // Explicitly update profile role to sys-admin to ensure DB sync
    // (In case trigger doesn't pick up metadata correctly or just to be safe)
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'sys-admin' })
        .eq('id', user.user.id);

    if (updateError) console.error('Failed to set admin role:', updateError);

    console.log(`Created test admin: ${email} (${user.user.id})`);

    // 2. Login via UI (Admin Protocol)
    // Small delay to ensure DB propagation
    await new Promise(resolve => setTimeout(resolve, 2000));

    await page.goto('/');

    // Select ADMIN PORTAL
    await page.click('button:has-text("ADMIN PORTAL")');

    // Enter Credentials
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button:has-text("LOGIN")');

    // 3. Wait for redirect to Admin Dashboard
    // Admin dashboard usually /sys-admin
    await page.waitForURL(/\/sys-admin/);

    // 4. Save state
    await page.context().storageState({ path: authFile });
});
