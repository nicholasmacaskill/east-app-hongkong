import { test, expect } from '@playwright/test';
import { generateVisualQAReport } from './helpers/generate-visual-report';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ARTIFACT_DIR = '/Users/nicholasmacaskill/.gemini/antigravity-ide/brain/2bbf483f-e586-47f1-aeb9-2732d39850f6';
const testTitle = `Visual 30D Window Test Class ${Date.now()}`;

test.describe('Visual Checks in Headless Mode', () => {
    let testSessionId: number | null = null;
    let testServiceId: string | null = null;
    let createdChildId: string | null = null;

    test.beforeAll(async () => {
        // 1. Create a Test Service (Class Type)
        const { data: service, error: svcError } = await supabase
            .from('session_types')
            .insert({
                title: testTitle,
                category: 'CLASS',
                description: 'Testing 30-day extended class booking window visualization',
                image_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600'
            })
            .select()
            .single();

        if (svcError) throw new Error(`Setup Failed (Service): ${svcError.message}`);
        testServiceId = service.id;

        // 2. Create a test session 21 days out
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 21);
        futureDate.setHours(14, 0, 0, 0);
        const endDate = new Date(futureDate.getTime() + 60 * 60 * 1000);

        const { data: sessionData, error: sessionErr } = await supabase
            .from('sessions')
            .insert({
                title: testTitle,
                description: 'Testing 30-day extended class booking window visualization',
                start_time: futureDate.toISOString(),
                end_time: endDate.toISOString(),
                category: 'CLASS',
                session_type_id: testServiceId,
                instructor: 'Coach Visual',
                credit_cost: 2,
                total_facility_bays: 1,
                max_capacity: 12
            })
            .select()
            .single();

        if (sessionErr) throw new Error(`Setup Failed (Session): ${sessionErr.message}`);
        testSessionId = sessionData.id;
    });

    test.afterAll(async () => {
        if (testSessionId) {
            await supabase.from('registrations').delete().eq('session_id', testSessionId);
            await supabase.from('sessions').delete().eq('id', testSessionId);
        }
        if (testServiceId) {
            await supabase.from('session_types').delete().eq('id', testServiceId);
        }
        if (createdChildId) {
            await supabase.from('player_relationships').delete().eq('child_id', createdChildId);
            await supabase.from('profiles').delete().eq('id', createdChildId);
            await supabase.auth.admin.deleteUser(createdChildId);
        }
    });

    test('capture visual proofs of all requested features', async ({ page }) => {
        // Set a sleek desktop viewport for crisp visuals
        await page.setViewportSize({ width: 1280, height: 900 });

        // --- 1. HOME & PARENT PROFILE VISUAL CHECK ---
        console.log('[VISUAL] Navigating to Home...');
        await page.goto('/');
        await expect(page.locator('h2:has-text("Breaking News")')).toBeVisible({ timeout: 15000 });

        // Navigate to Profile
        console.log('[VISUAL] Opening Parent Profile...');
        const profileNav = page.locator('button', { hasText: 'Profile' }).first();
        await profileNav.click();
        await expect(page.locator('span:has-text("PARENT ACCT")')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('span:has-text("STATUS: ACTIVE")')).toBeVisible();

        // Capture screenshot of Parent Profile (unlocked, active status)
        await page.screenshot({ path: `${ARTIFACT_DIR}/visual_parent_profile_active.png`, fullPage: false });
        console.log('[VISUAL] Saved visual_parent_profile_active.png');

        // --- 2. ADD ATHLETE / CHILD MODAL VISUAL CHECK ---
        console.log('[VISUAL] Opening Add Athlete modal...');
        const registerBtn = page.locator('button:has-text("+ Register New Athlete")');
        await registerBtn.click();
        await expect(page.locator('h3:has-text("Register Athlete")')).toBeVisible();

        // Fill in sample athlete details
        await page.fill('[data-testid="child-first-name-input"]', 'Lucas');
        await page.fill('[data-testid="child-last-name-input"]', 'Miller');
        await page.fill('[data-testid="child-sport-input"]', 'Ice Hockey');

        // Capture screenshot of Add Athlete modal
        await page.screenshot({ path: `${ARTIFACT_DIR}/visual_add_athlete_modal.png` });
        console.log('[VISUAL] Saved visual_add_athlete_modal.png');

        // Save athlete
        await page.click('[data-testid="child-save-btn"]');
        await expect(page.locator('h4:has-text("Lucas")')).toBeVisible({ timeout: 10000 });

        // Query created child ID for cleanup
        const { data: childProfile } = await supabase
            .from('profiles')
            .select('id')
            .ilike('first_name', 'Lucas')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        if (childProfile) {
            createdChildId = childProfile.id;
        }

        // --- 3. CONVERT TO FULL ATHLETE MODAL VISUAL CHECK ---
        console.log('[VISUAL] Opening Convert to Athlete modal...');
        const childCard = page.locator(`[data-testid="child-section-${createdChildId}"]`);
        await expect(childCard).toBeVisible();

        // Capture child card with Convert button
        await page.screenshot({ path: `${ARTIFACT_DIR}/visual_child_card_with_convert.png` });
        console.log('[VISUAL] Saved visual_child_card_with_convert.png');

        const convertBtn = childCard.locator('button:has-text("Convert")');
        await convertBtn.click();
        await expect(page.locator('h3:has-text("Convert to Full Athlete")')).toBeVisible();

        // Fill sample conversion email
        await page.fill('[data-testid="convert-email-input"]', 'lucas.miller@example.com');
        await page.fill('[data-testid="convert-password-input"]', 'SecurePass2026!');

        // Capture screenshot of Convert modal
        await page.screenshot({ path: `${ARTIFACT_DIR}/visual_convert_athlete_modal.png` });
        console.log('[VISUAL] Saved visual_convert_athlete_modal.png');

        // Close convert modal using data-testid
        await page.click('[data-testid="convert-modal-close-btn"]');

        // --- 4. 30-DAY CLASS BOOKING MODAL VISUAL CHECK ---
        console.log('[VISUAL] Navigating to Home with full page refresh...');
        await page.goto('/');
        await expect(page.locator('h2:has-text("Breaking News")')).toBeVisible({ timeout: 10000 });

        // Find and click the service card matching our test class
        console.log(`[VISUAL] Looking for service card: ${testTitle}`);
        const serviceCard = page.locator(`text=${testTitle}`).first();
        await expect(serviceCard).toBeVisible({ timeout: 10000 });
        await serviceCard.click();

        // Verify Class Modal opens
        await expect(page.locator('h2', { hasText: new RegExp(testTitle, 'i') }).first()).toBeVisible({ timeout: 10000 });
        console.log('[VISUAL] Class Modal opened!');

        // Capture 30-day class modal with date tab bar
        await page.screenshot({ path: `${ARTIFACT_DIR}/visual_class_modal_30day_window.png` });
        console.log('[VISUAL] Saved visual_class_modal_30day_window.png');

        // Close class modal
        const modalCloseBtn = page.locator('button:has-text("✕")').first();
        if (await modalCloseBtn.isVisible()) {
            await modalCloseBtn.click();
        }

        // --- 5. MEMBERSHIP MATRIX BENEFIT BADGE (30D) VISUAL CHECK ---
        console.log('[VISUAL] Navigating to Membership page...');
        await page.goto('/membership');
        await expect(page.locator('text=Early Bird Rates').first()).toBeVisible({ timeout: 10000 });

        // Capture membership matrix showing 30D badge
        await page.screenshot({ path: `${ARTIFACT_DIR}/visual_membership_matrix_30d.png`, fullPage: false });
        console.log('[VISUAL] Saved visual_membership_matrix_30d.png');

        // Compile HTML Visual QA Dashboard
        generateVisualQAReport();
    });
});
