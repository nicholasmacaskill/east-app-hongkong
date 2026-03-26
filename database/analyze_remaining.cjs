
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeRemaining() {
    try {
        console.log('🔍 Analyzing remaining 2,905 profiles...');
        
        let allProfiles = [];
        let from = 0;
        const step = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, contact_email, first_name, last_name, role, created_at')
                .range(from, from + step - 1);
            
            if (error) throw error;
            allProfiles.push(...data);
            if (data.length < step) hasMore = false;
            else from += step;
        }

        const internalDomains = ['east.com', 'example.com', 'pw.test', 'eastsportsgroup.com'];
        const whitelisted = ['admin@east.com', 'coach@east.com', 'parent@east.com', 'player@east.com'];

        const stats = {
            internal: 0,
            real: 0,
            whitelisted: 0,
            others: 0
        };

        const internalUsers = [];
        const anomalousRealUsers = []; // e.g. real domain but suspicious creation date or name

        allProfiles.forEach(p => {
            const email = (p.contact_email || '').toLowerCase();
            const domain = email.split('@')[1] || '';
            const isWhitelisted = whitelisted.includes(email);
            const isInternal = internalDomains.some(d => domain.endsWith(d));

            if (isWhitelisted) {
                stats.whitelisted++;
            } else if (isInternal) {
                stats.internal++;
                internalUsers.push(p);
            } else {
                stats.real++;
            }
        });

        console.log(`\n📊 Profile Stats:`);
        console.log(`Total Profiles: ${allProfiles.length}`);
        console.log(`Whitelisted: ${stats.whitelisted}`);
        console.log(`Internal/Ghost (Non-Whitelisted): ${stats.internal}`);
        console.log(`Potential Real Users: ${stats.real}`);

        if (internalUsers.length > 0) {
            console.log('\n🔍 Samples of remaining Internal/Ghost accounts:');
            internalUsers.slice(0, 20).forEach(u => console.log(`- ${u.contact_email} (ID: ${u.id}) Name: ${u.first_name} ${u.last_name}`));
        }

        // Check for "Vision" once more in names of "real" looking users
        const visionInReal = allProfiles.filter(p => !whitelisted.includes((p.contact_email || '').toLowerCase()) && 
            (JSON.stringify(p).toLowerCase().includes('vision')));
        
        if (visionInReal.length > 0) {
            console.log('\n✅ "Vision" found in these records:');
            visionInReal.forEach(v => console.log(`- ${v.contact_email} Name: ${v.first_name} ${v.last_name}`));
        }

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

analyzeRemaining();
