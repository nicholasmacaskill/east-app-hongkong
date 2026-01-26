const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function fixFamilyActivation() {
    console.log('\n🔧 Fixing family activation for existing parents...\n');

    // Get parents with family tier who are active
    const { data: parents, error: parentError } = await supabaseAdmin
        .from('profiles')
        .select('id, first_name, subscription_status, membership_expires, tier')
        .eq('role', 'parent')
        .eq('subscription_status', 'active')
        .like('tier', 'family%');

    if (parentError) {
        console.error('Error fetching parents:', parentError);
        return;
    }

    console.log(`Found ${parents.length} active family parents.`);

    for (const parent of parents || []) {
        console.log(`Processing parent: ${parent.first_name} (${parent.id})`);

        // Find inactive children
        const { data: children } = await supabaseAdmin
            .from('profiles')
            .select('id, first_name, subscription_status, account_status')
            .eq('parent_id', parent.id)
            .neq('subscription_status', 'active');

        if (children && children.length > 0) {
            console.log(`   Found ${children.length} inactive children. Activating...`);

            for (const child of children) {
                const { error: updateError } = await supabaseAdmin
                    .from('profiles')
                    .update({
                        subscription_status: 'active',
                        account_status: 'active',
                        membership_expires: parent.membership_expires,
                        membership_start: new Date().toISOString()
                    })
                    .eq('id', child.id);

                if (updateError) {
                    console.error(`   ❌ Failed to activate ${child.first_name}:`, updateError);
                } else {
                    console.log(`   ✅ Activated ${child.first_name} (${child.id})`);
                }
            }
        } else {
            console.log('   No inactive children found.');
        }
    }
}

fixFamilyActivation().catch(console.error);
