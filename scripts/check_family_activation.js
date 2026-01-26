const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function checkFamilyActivation() {
    console.log('\n📋 Checking recent parent accounts with family subscriptions...\n');

    const { data: parents, error: parentError } = await supabaseAdmin
        .from('profiles')
        .select('id, first_name, contact_email, tier, subscription_status, created_at')
        .eq('role', 'parent')
        .not('tier', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5);

    if (parentError) {
        console.error('Error:', parentError);
        return;
    }

    for (const parent of parents || []) {
        console.log(`👤 Parent: ${parent.first_name || parent.contact_email || parent.id}`);
        console.log(`   Tier: ${parent.tier}`);
        console.log(`   Status: ${parent.subscription_status}`);

        const { data: children } = await supabaseAdmin
            .from('profiles')
            .select('id, first_name, contact_email, subscription_status, account_status, membership_expires')
            .eq('parent_id', parent.id);

        if (children && children.length > 0) {
            console.log(`   👶 Children (${children.length}):`);
            for (const child of children) {
                console.log(`      - ${child.first_name || child.contact_email || child.id}`);
                console.log(`        sub_status: ${child.subscription_status}`);
                console.log(`        acc_status: ${child.account_status}`);
                console.log(`        expires: ${child.membership_expires || 'none'}`);
            }
        } else {
            console.log(`   ⚠️ No children linked`);
        }
        console.log('');
    }
}

checkFamilyActivation().catch(console.error);
