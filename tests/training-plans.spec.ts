/**
 * TRAINING PLANS E2E TESTS
 *
 * Tests the creation of standalone training plans and integration with session planning.
 */

import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

const isProd = process.env.PLAYWRIGHT_ENV === 'production';
const envFile = isProd ? '../.env.production.latest' : '../.env.test';
dotenv.config({ path: path.resolve(__dirname, envFile) });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createCoach() {
    const email = `tp-coach-${Date.now()}@east.test`;
    const password = 'TestPassword123!';
    const { data: userData, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: 'coach', first_name: 'Training', last_name: 'Coach' },
    });
    if (error || !userData.user) throw error;
    const id = userData.user.id;
    await supabase.from('profiles').upsert({
        id,
        role: 'coach',
        first_name: 'Training',
        last_name: 'Coach',
        credits: 0,
    });
    return { id, email, password };
}

async function loginAs(page: any, email: string, password: string, portal: 'coach' | 'athlete' = 'coach') {
    await page.goto('/');
    await page.waitForTimeout(2000);
    const portalIndex = portal === 'coach' ? 2 : 0;
    const loginBtns = page.getByRole('button', { name: /^LOGIN$/i });
    await loginBtns.nth(portalIndex).click();
    await page.waitForTimeout(1500);

    await page.fill('input[type="email"], input[name="email"], input#email', email);
    await page.fill('input[type="password"], input[name="password"], input#password', password);
    const submitBtn = page.getByRole('button', { name: /LOGIN/i }).last();
    await submitBtn.click();
    await page.waitForTimeout(4000);
}

test.describe('Training Plans CMS & Session Integration', () => {
    let coach: { id: string; email: string; password: string };
    let createdPlanId: string | null = null;
    let drillId: string | null = null;

    test.beforeAll(async () => {
        coach = await createCoach();

        // Create a published drill for testing
        const { data: drill } = await supabase
            .from('coach_drills')
            .insert({
                title: 'TP E2E Test Drill',
                coach_id: coach.id,
                status: 'published',
                skill_tags: ['stickhandling'],
            })
            .select('id')
            .single();
        drillId = drill?.id ?? null;
    });

    test.afterAll(async () => {
        if (createdPlanId) {
            await supabase.from('training_plan_drills').delete().eq('plan_id', createdPlanId);
            await supabase.from('training_plans').delete().eq('id', createdPlanId);
        }
        if (drillId) {
            await supabase.from('coach_drills').delete().eq('id', drillId);
        }
        await supabase.auth.admin.deleteUser(coach.id);
    });

    test('Coach can navigate to plans tab and create a plan', async ({ page }) => {
        await loginAs(page, coach.email, coach.password, 'coach');
        await page.goto('/drill-hub');
        await page.waitForTimeout(2000);

        // Verify tabs exist and click Plans
        const plansTab = page.getByRole('button', { name: 'Plans' });
        await expect(plansTab).toBeVisible();
        await plansTab.click();
        await page.waitForTimeout(1000);

        // Click Add New and select New Plan
        const addNewBtn = page.getByRole('button', { name: 'Add New' });
        await expect(addNewBtn).toBeVisible();
        await addNewBtn.click();
        await page.waitForTimeout(500);

        const newPlanBtn = page.getByRole('button', { name: 'New Plan' });
        await expect(newPlanBtn).toBeVisible();
        await newPlanBtn.click();
        await page.waitForTimeout(2000);

        // Training Plan modal should open
        await expect(page.locator('text=Edit Training Plan').first()).toBeVisible({ timeout: 10000 });

        // Search and add drill
        const drillCard = page.locator('text=TP E2E Test Drill').first();
        await expect(drillCard).toBeVisible({ timeout: 5000 });
        await drillCard.click();
        await page.waitForTimeout(500);

        // Click Save Training Plan
        const saveBtn = page.getByRole('button', { name: 'Save Training Plan' });
        await saveBtn.click();
        await page.waitForTimeout(2000);

        // Modal closes and new plan shows in plans list
        await expect(page.locator('text=Edit Training Plan').first()).not.toBeVisible();
        await expect(page.locator('text=New Training Plan').first()).toBeVisible({ timeout: 5000 });

        // Capture plan ID for cleanup
        const { data: plans } = await supabase
            .from('training_plans')
            .select('id')
            .eq('coach_id', coach.id)
            .order('created_at', { ascending: false })
            .limit(1);
        if (plans && plans.length > 0) {
            createdPlanId = plans[0].id;
        }
    });
});
