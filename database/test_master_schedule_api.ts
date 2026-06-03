import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.production.latest') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function testMasterScheduleAPI() {
    console.log('1. Signing in as testcoach@east.com...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'testcoach@east.com',
        password: 'EastTest2026!'
    });

    if (authError || !authData.session) {
        console.error('❌ Login failed:', authError?.message);
        return;
    }

    const token = authData.session.access_token;
    console.log('✅ Logged in. Calling /api/coach/master-schedule...\n');

    const res = await fetch('https://app.eastsportsgroup.com/api/coach/master-schedule', {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    const statusCode = res.status;
    const body = await res.json();

    console.log(`API Response Status: ${statusCode}`);

    if (!res.ok) {
        console.error('❌ API Error:', JSON.stringify(body));
        return;
    }

    if (!Array.isArray(body) || body.length === 0) {
        console.log('⚠️  API returned empty array — no sessions.');
        return;
    }

    console.log(`✅ API returned ${body.length} items.`);
    console.log('\nFirst 5 items:');
    body.slice(0, 5).forEach((s: any) => {
        console.log(`  [${s.status}] ${s.title} | ${s.start_time} | instructor: ${s.instructor}`);
    });

    // Count by status
    const statusCounts: Record<string, number> = {};
    body.forEach((s: any) => {
        statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
    });
    console.log('\nStatus breakdown:', statusCounts);
}

testMasterScheduleAPI();
