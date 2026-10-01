import { test as setup } from '@playwright/test';
import { getTestSupabaseAdmin, initTestEnvironment } from './helpers/test-env';

const authFile = 'playwright/.auth/coach.json';

setup('authenticate as coach', async ({ page }) => {
    setup.setTimeout(120000);
    initTestEnvironment();

    const supabase = getTestSupabaseAdmin();
    const timestamp = Date.now();
    const email = `test-coach-${timestamp}@pw.test`;
    const password = 'TestPassword123!';
    const firstName = 'Test';
    const lastName = 'Coach';

    // 1. Create coach user in Auth
    const { data: user, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            first_name: firstName,
            last_name: lastName,
            role: 'coach'
        }
    });

    if (error || !user.user) {
        throw new Error(`[Coach Setup] Failed to create user: ${error?.message}`);
    }

    const userId = user.user.id;

    // 2. Ensure profile exists with coach role
    const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
            id: userId,
            first_name: firstName,
            last_name: lastName,
            contact_email: email,
            role: 'coach',
            account_status: 'active'
        });

    if (profileError) {
        console.error('[Coach Setup] Profile upsert error:', profileError);
    }

    console.log(`[Coach Setup] Created test coach: ${email} (${userId})`);

    // 3. Login via UI
    await page.goto('/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button:has-text("LOGIN")');

    // 4. Wait for home navigation & coach dashboard
    await page.waitForURL('/', { timeout: 20000 });
    await page.waitForTimeout(1000);

    // 5. Save coach session
    await page.context().storageState({ path: authFile });
    console.log(`[Coach Setup] Saved coach storage state to ${authFile}`);
});
