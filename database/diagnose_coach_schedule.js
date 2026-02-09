const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnoseCoachSchedule() {
    console.log('🔍 Diagnosing Coach Schedule Issue...\n');

    try {
        // 1. Check session_types table
        console.log('1. Checking session_types (services)...');
        const { data: services, error: servicesError } = await supabase
            .from('session_types')
            .select('*')
            .eq('category', 'COACH');

        if (servicesError) {
            console.log('❌ Error fetching services:', servicesError.message);
        } else if (!services || services.length === 0) {
            console.log('⚠️  No COACH services found in session_types table!');
            console.log('   You need to create a coach service first in the admin panel.');
        } else {
            console.log('✅ Found', services.length, 'coach service(s):');
            services.forEach(s => {
                console.log(`   - ${s.title} (ID: ${s.id}, Cost: ${s.credit_cost || 'NOT SET'})`);
            });
        }

        // 2. Check sessions for coach category
        console.log('\n2. Checking generated sessions for COACH category...');
        const { data: sessions, error: sessionsError } = await supabase
            .from('sessions')
            .select('*')
            .eq('category', 'COACH')
            .gte('start_time', new Date().toISOString())
            .order('start_time', { ascending: true })
            .limit(10);

        if (sessionsError) {
            console.log('❌ Error fetching sessions:', sessionsError.message);
        } else if (!sessions || sessions.length === 0) {
            console.log('⚠️  No future COACH sessions found!');
            console.log('   This means schedule generation hasn\'t run or failed.');
        } else {
            console.log('✅ Found', sessions.length, 'future coach session(s):');
            sessions.forEach(s => {
                console.log(`   - ${s.title} at ${s.start_time} (Cost: ${s.credit_cost}, Status: ${s.status})`);
            });
        }

        // 3. Check for any sessions at all
        console.log('\n3. Checking total sessions count...');
        const { count, error: countError } = await supabase
            .from('sessions')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            console.log('❌ Error counting sessions:', countError.message);
        } else {
            console.log(`Total sessions in database: ${count}`);
        }

        // 4. Recommendations
        console.log('\n📋 Diagnosis Summary:');
        console.log('─'.repeat(60));

        if (!services || services.length === 0) {
            console.log('❌ ISSUE: No coach services configured');
            console.log('   FIX: Go to Admin → Services → Add a COACH service');
        } else if (!sessions || sessions.length === 0) {
            console.log('❌ ISSUE: No coach sessions generated');
            console.log('   FIX: Go to Admin → Services → Select coach → Generate Schedule');
            console.log('   Make sure to:');
            console.log('   - Set start/end dates');
            console.log('   - Set start/end hours');
            console.log('   - Select days of week');
            console.log('   - Select a coach (if applicable)');
        } else {
            console.log('✅ Coach sessions exist! Check the UI filters or session status.');
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    }
}

diagnoseCoachSchedule();
