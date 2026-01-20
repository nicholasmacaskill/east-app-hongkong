const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testInsert() {
    console.log('Testing transaction insert...');
    // Use an existing profile ID from the previous check_profiles.js output
    const targetId = "3b92caba-e595-4d44-a7de-23dbe0e5b6b3"; // Replace with one from output

    const { data, error } = await supabase.from('transactions').insert({
        user_id: targetId,
        amount: 10,
        type: 'booking',
        description: 'Test manual insert'
    });

    if (error) {
        console.error('Insert failed:', error);
    } else {
        console.log('Insert succeeded:', data);
    }
}

testInsert();
