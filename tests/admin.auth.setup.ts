import { test as setup } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const authFile = 'playwright/.auth/admin.json';

setup('authenticate as admin', async ({ page }) => {
    setup.setTimeout(120000);
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Missing Supabase Environment Variables for Test Setup');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const timestamp = Date.now();
    const email = `test-admin-${timestamp}@east.com`;
    const password = 'test-password-123';

    // 1. Create User with auto-confirmation and sys-admin role
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

    // 2. Explicitly upsert profile to ensure sys-admin role and credits
    const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
            id: user.user.id,
            contact_email: email,
            first_name: 'Test',
            last_name: 'Admin',
            role: 'sys-admin',
            credits: 1000
        });

    if (updateError) console.error('Failed to set admin role:', updateError);

    console.log(`Created test admin: ${email} (${user.user.id})`);

    // 3. Login via /login
    await page.goto('/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button:has-text("LOGIN")');

    // 4. Wait for redirect to /sys-admin
    await page.waitForURL(/\/sys-admin/, { timeout: 15000 });

    // 5. Save state
    await page.context().storageState({ path: authFile });
});
