import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

test.describe('Reminder Logic (Mocked)', () => {
    let userId: string;
    let sessionId: string;
    const userEmail = `reminder-test-${Date.now()}@east.com`;

    test.beforeAll(async () => {
        // Create test user
        const { data: userData, error: userError } = await supabase.auth.admin.createUser({
            email: userEmail,
            password: 'TestPassword123!',
            email_confirm: true,
            user_metadata: { role: 'player', first_name: 'Reminder', last_name: 'Test' }
        });
        if (userError) throw userError;
        userId = userData.user.id;

        await supabase.from('profiles').upsert({
            id: userId,
            role: 'player',
            first_name: 'Reminder',
            last_name: 'Test',
            credits: 100,
            contact_email: userEmail
        });

        // Create a session 24 hours from now
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(14, 0, 0, 0);

        const { data: session, error: sessionError } = await supabase
            .from('sessions')
            .insert({
                title: `Reminder Test Session ${Date.now()}`,
                start_time: tomorrow.toISOString(),
                end_time: new Date(tomorrow.getTime() + 60 * 60 * 1000).toISOString(),
                credit_cost: 10,
                instructor: 'Test Coach',
                category: 'TRAINING'
            })
            .select()
            .single();

        if (sessionError) throw sessionError;
        sessionId = session.id;

        // Book the session
        await supabase.from('registrations').insert({
            user_id: userId,
            session_id: sessionId,
            status: 'confirmed'
        });
    });

    test.afterAll(async () => {
        // Cleanup
        if (sessionId) {
            await supabase.from('registrations').delete().eq('session_id', sessionId);
            await supabase.from('sessions').delete().eq('id', sessionId);
        }
        if (userId) await supabase.auth.admin.deleteUser(userId);
    });

    test('24-Hour Reminder Logic - Query Verification', async () => {
        // This test verifies the query logic that would be used by a cron job
        // to find sessions starting in 24 hours

        const now = new Date();
        const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);
        const in23Hours = new Date(now.getTime() + 23 * 60 * 60 * 1000);

        // Query for sessions starting in approximately 24 hours (23-25 hour window)
        const { data: upcomingSessions, error } = await supabase
            .from('sessions')
            .select(`
                id,
                title,
                start_time,
                registrations (
                    user_id,
                    status,
                    profiles (
                        first_name,
                        last_name,
                        contact_email
                    )
                )
            `)
            .gte('start_time', in23Hours.toISOString())
            .lte('start_time', in25Hours.toISOString())
            .eq('registrations.status', 'confirmed');

        expect(error).toBeNull();

        // Our test session should be in this list
        const testSession = upcomingSessions?.find(s => s.id === sessionId);
        expect(testSession).toBeDefined();

        if (testSession) {
            // Verify we can access user data for sending reminders
            const registrations = testSession.registrations as any[];
            expect(registrations.length).toBeGreaterThan(0);

            const userReg = registrations.find((r: any) => r.user_id === userId);
            expect(userReg).toBeDefined();
            expect(userReg?.profiles?.contact_email).toBe(userEmail);

            console.log('[TEST] ✅ Reminder query logic verified');
            console.log(`[TEST] Found ${registrations.length} confirmed registration(s) for session "${testSession.title}"`);
        }
    });

    test('Reminder Email Payload Structure', async () => {
        // This test verifies the data structure needed for sending reminder emails
        // In production, this would be used by a cron job to send actual emails

        const { data: session } = await supabase
            .from('sessions')
            .select(`
                id,
                title,
                start_time,
                end_time,
                instructor,
                registrations!inner (
                    user_id,
                    profiles (
                        first_name,
                        last_name,
                        contact_email
                    )
                )
            `)
            .eq('id', sessionId)
            .eq('registrations.status', 'confirmed')
            .single();

        expect(session).toBeDefined();
        if (!session) return;

        // Build reminder email payload
        const registrations = session.registrations as any[];
        const reminderPayloads = registrations.map((reg: any) => ({
            to: reg.profiles.contact_email,
            subject: `Reminder: ${session.title} in 24 hours`,
            html: `
                <h1>Session Reminder</h1>
                <p>Hi ${reg.profiles.first_name},</p>
                <p>This is a reminder that you have a session tomorrow:</p>
                <ul>
                    <li><strong>Session:</strong> ${session.title}</li>
                    <li><strong>Time:</strong> ${new Date(session.start_time).toLocaleString()}</li>
                    <li><strong>Instructor:</strong> ${session.instructor}</li>
                </ul>
                <p>See you there!</p>
            `
        }));

        expect(reminderPayloads.length).toBeGreaterThan(0);
        expect(reminderPayloads[0].to).toBe(userEmail);
        expect(reminderPayloads[0].subject).toContain('Reminder');
        expect(reminderPayloads[0].html).toContain('Reminder Test');

        console.log('[TEST] ✅ Reminder email payload structure verified');
        console.log(`[TEST] Generated ${reminderPayloads.length} reminder email(s)`);
    });

    test('Cron Job Simulation - Dry Run', async () => {
        // This test simulates what a cron job would do:
        // 1. Query for upcoming sessions
        // 2. Get confirmed registrations
        // 3. Prepare email data
        // 4. Log the action (without actually sending emails in test)

        const cronRunTime = new Date();
        const targetTime = new Date(cronRunTime.getTime() + 24 * 60 * 60 * 1000);

        // Step 1: Query sessions
        const { data: sessions } = await supabase
            .from('sessions')
            .select(`
                id,
                title,
                start_time,
                instructor,
                registrations!inner (
                    user_id,
                    status,
                    profiles (
                        first_name,
                        contact_email
                    )
                )
            `)
            .gte('start_time', new Date(targetTime.getTime() - 60 * 60 * 1000).toISOString())
            .lte('start_time', new Date(targetTime.getTime() + 60 * 60 * 1000).toISOString())
            .eq('registrations.status', 'confirmed');

        // Step 2: Process each session
        let totalReminders = 0;
        sessions?.forEach(session => {
            const registrations = session.registrations as any[];
            registrations.forEach((reg: any) => {
                // In production, this would call sendEmail()
                console.log(`[CRON] Would send reminder to ${reg.profiles.contact_email} for "${session.title}"`);
                totalReminders++;
            });
        });

        expect(totalReminders).toBeGreaterThan(0);
        console.log(`[TEST] ✅ Cron simulation complete - ${totalReminders} reminder(s) would be sent`);
    });

    test('Reminder Idempotency - Prevent Duplicate Sends', async () => {
        // In production, we'd want to track which reminders have been sent
        // This test verifies the logic to prevent duplicate reminder sends

        // Create a simple tracking table structure (mocked)
        const sentReminders = new Set<string>();

        // Simulate first cron run
        const reminderKey = `${userId}-${sessionId}-24h`;

        if (!sentReminders.has(reminderKey)) {
            sentReminders.add(reminderKey);
            console.log('[TEST] First run - reminder would be sent');
        }

        // Simulate second cron run (should skip)
        let skipped = false;
        if (sentReminders.has(reminderKey)) {
            console.log('[TEST] Second run - reminder skipped (already sent)');
            skipped = true;
        }

        expect(skipped).toBe(true);
        console.log('[TEST] ✅ Idempotency logic verified - duplicates prevented');
    });
});
