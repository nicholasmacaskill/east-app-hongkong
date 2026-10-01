import { test as setup } from '@playwright/test';
import { getTestSupabaseAdmin, initTestEnvironment } from './helpers/test-env';

const authFile = 'playwright/.auth/player.json';

setup('authenticate as player', async ({ page }) => {
    setup.setTimeout(120000);
    initTestEnvironment();

    const supabase = getTestSupabaseAdmin();
    const timestamp = Date.now();
    const email = `test-player-${timestamp}@pw.test`;
    const password = 'TestPassword123!';
    const firstName = 'Test';
    const lastName = 'Player';

    // 1. Create player user in Auth
    const { data: user, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            first_name: firstName,
            last_name: lastName,
            role: 'player'
        }
    });

    if (error || !user.user) {
        throw new Error(`[Player Setup] Failed to create user: ${error?.message}`);
    }

    const userId = user.user.id;

    // 2. Ensure profile exists with player role and username
    const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
            id: userId,
            first_name: firstName,
            last_name: lastName,
            contact_email: email,
            username: `player_${timestamp.toString().slice(-6)}`,
            role: 'player',
            credits: 20,
            account_status: 'active'
        });

    if (profileError) {
        console.error('[Player Setup] Profile upsert error:', profileError);
    }

    console.log(`[Player Setup] Created test player: ${email} (${userId})`);

    // 3. Login via UI
    await page.goto('/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button:has-text("LOGIN")');

    // 4. Wait for home navigation
    await page.waitForURL('/', { timeout: 20000 });
    await page.waitForTimeout(1000);

    // 5. Save player session
    await page.context().storageState({ path: authFile });
    console.log(`[Player Setup] Saved player storage state to ${authFile}`);
});
