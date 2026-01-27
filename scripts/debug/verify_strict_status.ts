import getDbPool from '../../app/lib/db';

(async () => {
    const pool = getDbPool();
    const client = await pool.connect();

    // IDs for test
    const activeParentId = '00000000-0000-0000-0000-000000000010';
    const activeChildId = '00000000-0000-0000-0000-000000000011';

    const inactiveParentId = '00000000-0000-0000-0000-000000000020';
    const inactiveChildId = '00000000-0000-0000-0000-000000000021';

    try {
        console.log("🧪 Testing strict family status logic...");

        // Cleanup first
        await client.query('DELETE FROM profiles WHERE id IN ($1, $2, $3, $4)', [activeParentId, activeChildId, inactiveParentId, inactiveChildId]);
        await client.query('DELETE FROM auth.users WHERE id IN ($1, $2, $3, $4)', [activeParentId, activeChildId, inactiveParentId, inactiveChildId]);

        // ============================================
        // SCENARIO 1: ACTIVE PARENT
        // ============================================
        console.log("\n--- Scenario 1: Active Parent ---");

        // Setup Active Parent and Locked Child
        await client.query('INSERT INTO auth.users (id, email) VALUES ($1, $2) ON CONFLICT DO NOTHING', [activeParentId, 'active-parent@test.com']);
        await client.query('INSERT INTO profiles (id, role, credits, subscription_status) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET subscription_status = $4, credits = $3', [activeParentId, 'parent', 1000, 'active']);

        await client.query('INSERT INTO auth.users (id, email) VALUES ($1, $2) ON CONFLICT DO NOTHING', [activeChildId, 'active-child@test.com']);
        await client.query('INSERT INTO profiles (id, role, parent_id, credits, subscription_status) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET subscription_status = $5, credits = $4, parent_id = $3', [activeChildId, 'player', activeParentId, 0, 'inactive']);

        // Transfer 100 credits
        await client.query('SELECT transfer_credits($1, $2, 100)', [activeParentId, activeChildId]);

        // Check Child
        const res1 = await client.query('SELECT subscription_status, credits FROM profiles WHERE id = $1', [activeChildId]);
        const child1 = res1.rows[0];

        if (child1.subscription_status === 'active' && child1.credits === 100) {
            console.log("✅ SUCCESS: Child unlocked (subscription_status='active')");
        } else {
            console.error(`❌ FAILED: Child status is '${child1.subscription_status}' (expected 'active')`);
        }


        // ============================================
        // SCENARIO 2: INACTIVE PARENT
        // ============================================
        console.log("\n--- Scenario 2: Inactive Parent ---");

        // Setup Inactive Parent and Locked Child
        await client.query('INSERT INTO auth.users (id, email) VALUES ($1, $2) ON CONFLICT DO NOTHING', [inactiveParentId, 'inactive-parent@test.com']);
        await client.query('INSERT INTO profiles (id, role, credits, subscription_status) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET subscription_status = $4, credits = $3', [inactiveParentId, 'parent', 1000, 'canceled']);

        await client.query('INSERT INTO auth.users (id, email) VALUES ($1, $2) ON CONFLICT DO NOTHING', [inactiveChildId, 'inactive-child@test.com']);
        await client.query('INSERT INTO profiles (id, role, parent_id, credits, subscription_status) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET subscription_status = $5, credits = $4, parent_id = $3', [inactiveChildId, 'player', inactiveParentId, 0, 'inactive']);

        // Transfer 100 credits
        await client.query('SELECT transfer_credits($1, $2, 100)', [inactiveParentId, inactiveChildId]);

        // Check Child
        const res2 = await client.query('SELECT subscription_status, credits FROM profiles WHERE id = $1', [inactiveChildId]);
        const child2 = res2.rows[0];

        if (child2.subscription_status === 'inactive' && child2.credits === 100) {
            console.log("✅ SUCCESS: Child remained locked (subscription_status='inactive')");
        } else {
            console.error(`❌ FAILED: Child status is '${child2.subscription_status}' (expected 'inactive')`);
        }

        // Cleanup
        await client.query('DELETE FROM profiles WHERE id IN ($1, $2, $3, $4)', [activeParentId, activeChildId, inactiveParentId, inactiveChildId]);
        await client.query('DELETE FROM auth.users WHERE id IN ($1, $2, $3, $4)', [activeParentId, activeChildId, inactiveParentId, inactiveChildId]);

    } catch (e) {
        console.error("❌ Test Error:", e);
    } finally {
        client.release();
        await pool.end();
    }
})();
