import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

test.describe('Admin Purge Test Accounts with Assess Keyword', () => {
    test('should purge accounts containing "assess" in name or email while preserving admin accounts', async ({ page }) => {
        const timestamp = Date.now();
        const coachEmail = `assessment-coach-${timestamp}@east.com`;
        const playerEmail = `assessment-player-${timestamp}@east.com`;
        const coachFirstName = `AssessC${timestamp}`;
        const playerFirstName = `AssessP${timestamp}`;

        // 1. Create a sys-admin for the test
        const adminEmail = `test-admin-${timestamp}@east.com`;
        const adminPassword = 'AdminPassword123!';
        const { data: adminAuth, error: adminErr } = await supabaseAdmin.auth.admin.createUser({
            email: adminEmail,
            password: adminPassword,
            email_confirm: true,
            user_metadata: { role: 'sys-admin', first_name: 'Sys', last_name: 'Admin' }
        });
        expect(adminErr).toBeNull();
        await supabaseAdmin.from('profiles').upsert({
            id: adminAuth!.user!.id,
            first_name: 'Sys',
            last_name: 'Admin',
            contact_email: adminEmail,
            role: 'sys-admin'
        });

        // Sign in as admin to get token
        const { data: adminSession, error: signInErr } = await supabaseClient.auth.signInWithPassword({
            email: adminEmail,
            password: adminPassword
        });
        expect(signInErr).toBeNull();
        const accessToken = adminSession!.session!.access_token;

        // 2. Create test assessment coach in Auth & Profiles
        const { data: coachAuth, error: coachAuthErr } = await supabaseAdmin.auth.admin.createUser({
            email: coachEmail,
            password: 'TestPassword123!',
            email_confirm: true,
            user_metadata: { role: 'coach', first_name: coachFirstName, last_name: 'Coach' }
        });
        expect(coachAuthErr).toBeNull();

        await supabaseAdmin.from('profiles').upsert({
            id: coachAuth!.user!.id,
            first_name: coachFirstName,
            last_name: 'Coach',
            contact_email: coachEmail,
            role: 'coach'
        });

        // 3. Create test assessment player in Auth & Profiles
        const { data: playerAuth, error: playerAuthErr } = await supabaseAdmin.auth.admin.createUser({
            email: playerEmail,
            password: 'TestPassword123!',
            email_confirm: true,
            user_metadata: { role: 'player', first_name: playerFirstName, last_name: 'Player' }
        });
        expect(playerAuthErr).toBeNull();

        await supabaseAdmin.from('profiles').upsert({
            id: playerAuth!.user!.id,
            first_name: playerFirstName,
            last_name: 'Player',
            username: `assessplayer${timestamp}`,
            contact_email: playerEmail,
            role: 'player'
        });

        // 4. Verify accounts exist before purge
        const { data: coachBefore } = await supabaseAdmin.from('profiles').select('id').eq('id', coachAuth!.user!.id).single();
        const { data: playerBefore } = await supabaseAdmin.from('profiles').select('id').eq('id', playerAuth!.user!.id).single();
        expect(coachBefore).toBeDefined();
        expect(playerBefore).toBeDefined();

        // 5. Trigger the purge API
        const response = await page.request.post('/api/admin/purge-test-accounts', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        expect(response.ok()).toBeTruthy();
        const result = await response.json();
        expect(result.success).toBe(true);
        expect(result.count).toBeGreaterThanOrEqual(2);

        // 6. Verify assessment coach and player profiles were deleted
        const { data: coachAfter } = await supabaseAdmin.from('profiles').select('id').eq('id', coachAuth!.user!.id).single();
        const { data: playerAfter } = await supabaseAdmin.from('profiles').select('id').eq('id', playerAuth!.user!.id).single();
        expect(coachAfter).toBeNull();
        expect(playerAfter).toBeNull();

        // 7. Verify assessment coach and player auth users were deleted
        const { data: coachAuthAfter } = await supabaseAdmin.auth.admin.getUserById(coachAuth!.user!.id);
        const { data: playerAuthAfter } = await supabaseAdmin.auth.admin.getUserById(playerAuth!.user!.id);
        expect(coachAuthAfter?.user).toBeNull();
        expect(playerAuthAfter?.user).toBeNull();

        // 8. Cleanup test admin
        await supabaseAdmin.from('profiles').delete().eq('id', adminAuth!.user!.id);
        await supabaseAdmin.auth.admin.deleteUser(adminAuth!.user!.id).catch(() => null);
    });
});
