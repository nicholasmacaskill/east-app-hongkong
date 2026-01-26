import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function checkFamilyActivation() {
    // Get the most recent parent purchase
    const { data: parents, error: parentError } = await supabaseAdmin
        .from('profiles')
        .select('id, name, email, tier, subscription_status, stripe_customer_id, created_at')
        .eq('role', 'parent')
        .not('stripe_customer_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5);

    if (parentError) {
        console.error('Error fetching parents:', parentError);
        return;
    }

    console.log(`\n📋 Recent parent accounts with subscriptions:\n`);
    for (const parent of parents || []) {
        console.log(`\n👤 Parent: ${parent.name || parent.email} (${parent.id})`);
        console.log(`   Tier: ${parent.tier}`);
        console.log(`   Status: ${parent.subscription_status}`);

        // Check for children
        const { data: children, error: childError } = await supabaseAdmin
            .from('profiles')
            .select('id, name, email, parent_id, subscription_status, account_status, membership_expires')
            .eq('parent_id', parent.id);

        if (children && children.length > 0) {
            console.log(`   👶 ${children.length} children found:`);
            for (const child of children) {
                console.log(`      - ${child.name || child.email || child.id}`);
                console.log(`        subscription_status: ${child.subscription_status}`);
                console.log(`        account_status: ${child.account_status}`);
                console.log(`        membership_expires: ${child.membership_expires}`);
            }
        } else {
            console.log(`   ⚠️ No children found`);
        }
    }
}

checkFamilyActivation().catch(console.error);
