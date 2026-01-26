import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

test.describe('Email Trigger Verification (Headless)', () => {

    test.beforeEach(async () => {
        // Clear test_emails table before each test
        await supabase.from('test_emails').delete().gte('created_at', '1970-01-01');
    });

    test('Debug Email Endpoint - Logs to Database', async ({ request }) => {
        // Trigger the debug email endpoint
        const response = await request.get('/api/debug-email');
        expect(response.ok()).toBeTruthy();

        // Wait a moment for the async logging to complete
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Verify email was logged to database
        const { data: emails, error } = await supabase
            .from('test_emails')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1);

        expect(error).toBeNull();
        expect(emails).toBeDefined();
        expect(emails!.length).toBeGreaterThan(0);

        const email = emails![0];
        expect(email.to_address).toBe('delivered@resend.dev');
        expect(email.subject).toContain('Debug Email Test');
        expect(email.html_body).toContain('email sending works');

        console.log('✅ Debug email logged successfully:', {
            to: email.to_address,
            subject: email.subject,
            source: email.trigger_source
        });
    });

    test('Welcome Email - Can Be Verified via Database', async () => {
        // This is a placeholder test showing how you would verify
        // welcome emails triggered during user registration

        // In a real test, you would:
        // 1. Create a test user via API
        // 2. Query test_emails for the welcome email
        // 3. Verify content

        const { data: emails } = await supabase
            .from('test_emails')
            .select('*')
            .eq('trigger_source', 'welcome');

        // For now, just verify the query works
        expect(emails).toBeDefined();
        console.log(`Found ${emails?.length || 0} welcome email(s) in database`);
    });
});
