import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

test.describe('Coach Availability Management', () => {
    let testCoachId: string;
    let testServiceTypeId: string;

    // Setup: Create test coach
    test.beforeAll(async () => {
        // 1. Create Coach User
        const email = `test-coach-${Date.now()}@east.com`;
        const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
            email,
            password: 'password123',
            email_confirm: true,
            user_metadata: { first_name: 'Test', last_name: 'Coach', role: 'coach' }
        });

        if (authErr) throw new Error(`Coach creation failed: ${authErr.message}`);
        testCoachId = authData.user.id;

        // 2. Ensure Profile exists
        const { error: profileError } = await supabase.from('profiles').upsert({
            id: testCoachId,
            role: 'coach',
            first_name: 'Test',
            last_name: 'Coach'
        });

        if (profileError) throw new Error(`Profile creation failed: ${profileError.message}`);

        // Verify profile was created
        const { data: profileCheck } = await supabase.from('profiles').select('id').eq('id', testCoachId).single();
        if (!profileCheck) throw new Error('Profile verification failed');

        console.log(`[SETUP] Profile verified for coach: ${testCoachId}`);

        // 3. Create Test Service Type for Session Generation
        const { data: serviceType, error: svcErr } = await supabase
            .from('session_types')
            .insert({
                title: 'Availability Test Service',
                category: 'PRIVATE',
                description: 'E2E Test Service'
            })
            .select()
            .single();

        if (svcErr) throw new Error(`Service Type creation failed: ${svcErr.message}`);
        testServiceTypeId = serviceType.id;

        console.log(`[SETUP] Created Coach: ${testCoachId}, Service: ${testServiceTypeId}`);
    });

    test.afterAll(async () => {
        // Cleanup
        if (testCoachId) {
            await supabase.from('availability').delete().eq('coach_id', testCoachId);
            await supabase.from('sessions').delete().eq('instructor', 'Test Coach');
            await supabase.auth.admin.deleteUser(testCoachId);
            await supabase.from('profiles').delete().eq('id', testCoachId);
        }
        if (testServiceTypeId) {
            await supabase.from('session_types').delete().eq('id', testServiceTypeId);
        }
    });

    test('Bulk availability API creates slots correctly', async ({ page }) => {
        // This test verifies the API endpoint directly via browser context
        page.on('console', msg => console.log(`[BROWSER]: ${msg.text()}`));

        // Navigate to app (need to be logged in for auth)
        await page.goto('/sys-admin/directory');
        await expect(page.locator('h1')).toBeVisible();

        // Use page.evaluate to call the API from browser context (has auth cookies)
        const response = await page.evaluate(async ({ coachId }) => {
            const today = new Date();

            // Generate 3 availability slots
            const slots = [];
            for (let hour = 9; hour < 12; hour++) {
                const start = new Date(today);
                start.setHours(hour, 0, 0, 0);
                const end = new Date(today);
                end.setHours(hour + 1, 0, 0, 0);

                slots.push({
                    coach_id: coachId,
                    start_time: start.toISOString(),
                    end_time: end.toISOString(),
                    is_recurring: false,
                    status: 'available'
                });
            }

            const res = await fetch('/api/admin/coach-availability', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    coachId: coachId,
                    slots: slots,
                    deletedSlots: []
                })
            });

            return await res.json();
        }, { coachId: testCoachId });

        console.log('[API RESPONSE]', response);

        if (!response.success) {
            console.error('[API ERROR]', response.error || response);
        }

        expect(response.success).toBe(true);

        // Verify database
        const { data: slots, error } = await supabase
            .from('availability')
            .select('*')
            .eq('coach_id', testCoachId);

        if (error) throw error;

        console.log(`[DB VERIFIED] ${slots?.length} slots created`);
        expect(slots?.length).toBe(3);

        // Verify slot details
        for (const slot of slots!) {
            expect(slot.coach_id).toBe(testCoachId);
            expect(slot.status).toBe('available');
            expect(slot.start_time).toBeTruthy();
            expect(slot.end_time).toBeTruthy();
        }
    });

    test('Bulk session API creates sessions with service type', async ({ page }) => {
        page.on('console', msg => console.log(`[BROWSER]: ${msg.text()}`));

        await page.goto('/sys-admin/directory');
        await expect(page.locator('h1')).toBeVisible();

        // Call API to create sessions
        const response = await page.evaluate(async ({ coachId, serviceTypeId }) => {
            const today = new Date();

            // Generate 2 session slots
            const slots = [];
            for (let hour = 14; hour < 16; hour++) {
                const start = new Date(today);
                start.setHours(hour, 0, 0, 0);
                const end = new Date(today);
                end.setHours(hour + 1, 0, 0, 0);

                slots.push({
                    coach_id: coachId,
                    start_time: start.toISOString(),
                    end_time: end.toISOString(),
                    is_recurring: false,
                    status: 'available',
                    session_type_id: serviceTypeId,
                    credit_cost: 20,
                    capacity: 1
                });
            }

            const res = await fetch('/api/admin/coach-availability', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    coachId: coachId,
                    slots: slots,
                    deletedSlots: []
                })
            });

            return await res.json();
        }, { coachId: testCoachId, serviceTypeId: testServiceTypeId });

        console.log('[API RESPONSE]', response);

        if (!response.success) {
            console.error('[API ERROR]', response.error || response);
        }

        expect(response.success).toBe(true);

        // Wait a moment for DB propagation
        await page.waitForTimeout(1000);

        // Verify sessions created in DB
        // Query by session_type_id since that's more reliable
        const { data: sessions, error } = await supabase
            .from('sessions')
            .select('*')
            .eq('session_type_id', testServiceTypeId);

        if (error) {
            console.error('[DB ERROR]', error);
            throw error;
        }

        console.log(`[DB VERIFIED] Found ${sessions?.length} sessions for service type ${testServiceTypeId}`);

        if (!sessions || sessions.length === 0) {
            // Debug: check all sessions
            const { data: allSessions } = await supabase.from('sessions').select('*').limit(10);
            console.log('[DEBUG] Recent sessions:', allSessions);
        }

        expect(sessions?.length).toBeGreaterThanOrEqual(2);

        // Verify session details
        const session = sessions![0];
        expect(session.credit_cost).toBe(20);
        expect(session.max_capacity).toBe(1);
        expect(session.session_type_id).toBe(testServiceTypeId);
        expect(session.category).toBe('PRIVATE');
    });
});
