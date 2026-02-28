import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

test.describe('Auth Registration E2E: Custom API + Resend + Profile Sync', () => {
    const testEmail = `test-user-${Date.now()}@pw.test`;
    const testPassword = 'TestPassword123!';
    const testFullName = 'John Doe Alpha';
    let userId: string;

    test.afterAll(async () => {
        if (userId) {
            // Cleanup: Delete auth user and profile
            await supabase.auth.admin.deleteUser(userId);
        }
    });

    test('Custom registration API creates user and syncs profile', async ({ request }) => {
        // 1. Call the custom registration API
        const response = await request.post('/api/auth/register', {
            data: {
                email: testEmail,
                password: testPassword,
                fullName: testFullName,
                phone: '+852 9000 0000',
                role: 'player'
            }
        });

        const resBody = await response.json();
        console.log('[TEST] Registration API Response:', resBody);

        expect(response.ok()).toBe(true);
        expect(resBody.success).toBe(true);

        // 2. Verify Auth User exists
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;

        const createdUser = users.find(u => u.email === testEmail);
        expect(createdUser).toBeDefined();
        userId = createdUser!.id;

        // 3. Verify Profile Sync (The core fix) - with retry for async trigger
        let profile = null;
        let attempts = 0;
        while (!profile && attempts < 10) {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
            if (data) {
                profile = data;
            } else {
                await new Promise(resolve => setTimeout(resolve, 500));
                attempts++;
            }
        }

        expect(profile).toBeDefined();
        console.log('[TEST] Verified Profile:', profile);

        expect(profile.first_name).toBe('John');
        expect(profile.last_name).toBe('Doe Alpha');
        expect(profile.contact_email).toBe(testEmail);
        expect(profile.mobile).toBe('+852 9000 0000');
        expect(profile.role).toBe('player');
    });
});
