import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

test.describe('Database Trigger Integrity', () => {
    
    test('Automatic Profile Creation Trigger is active', async () => {
        const unique = Math.random().toString(36).substring(7);
        const email = `trigger-test-${unique}@east.com`;
        const password = 'TestAuth123!';

        console.log(`Testing trigger with email: ${email}`);

        // 1. Create user in Auth ONLY
        const { data, error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                first_name: 'Trigger',
                last_name: 'IntegrityTest',
                role: 'player',
                mobile: '12345678'
            }
        });

        if (error) throw error;
        const userId = data.user!.id;

        try {
            // 2. Wait and verify Profile was created AUTOMATICALLY by the DB trigger
            // We retry a few times as triggers are fast but not instantaneous over the network
            let profileFound = false;
            for (let i = 0; i < 5; i++) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();
                
                if (profile) {
                    profileFound = true;
                    // Verify data integrity
                    expect(profile.contact_email).toBe(email);
                    expect(profile.first_name).toBe('Trigger');
                    expect(profile.role).toBe('player');
                    break;
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            expect(profileFound).toBe(true);
            console.log('✅ Trigger verified: Profile created automatically.');

        } finally {
            // 3. Cleanup
            await supabase.auth.admin.deleteUser(userId);
            // Profile should be deleted by CASCADE in the DB, but we'll try manually too
            await supabase.from('profiles').delete().eq('id', userId);
        }
    });

    test('Trigger handles missing metadata gracefully', async () => {
        const unique = Math.random().toString(36).substring(7);
        const email = `trigger-minimal-${unique}@east.com`;
        
        const { data, error } = await supabase.auth.admin.createUser({
            email,
            password: 'TestAuth123!',
            email_confirm: true,
            // No metadata provided!
        });

        if (error) throw error;
        const userId = data.user!.id;

        try {
            await new Promise(resolve => setTimeout(resolve, 3000));
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
            
            expect(profile).toBeDefined();
            expect(profile?.role).toBe('player'); // Default fallback
        } finally {
            await supabase.auth.admin.deleteUser(userId);
        }
    });
});
