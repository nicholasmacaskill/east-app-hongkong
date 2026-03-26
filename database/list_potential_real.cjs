
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listPotentialReal() {
    try {
        let allProfiles = [];
        let from = 0;
        const step = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data, error } = await supabase.from('profiles').select('*').range(from, from + step - 1);
            if (error) throw error;
            allProfiles.push(...data);
            if (data.length < step) hasMore = false;
            else from += step;
        }

        const internalDomains = ['east.com', 'example.com', 'pw.test', 'eastsportsgroup.com'];
        const potentialReal = allProfiles.filter(p => {
            const email = (p.contact_email || '').toLowerCase();
            const domain = email.split('@')[1] || '';
            return !internalDomains.some(d => domain.endsWith(d));
        });

        console.log(`\nPotential Real Users (${potentialReal.length}):`);
        potentialReal.forEach(u => console.log(`- ${u.contact_email} (${u.first_name} ${u.last_name})`));

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

listPotentialReal();
