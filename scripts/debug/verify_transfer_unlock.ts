import getDbPool from '../../app/lib/db';

(async () => {
    const pool = getDbPool();
    const client = await pool.connect();

    try {
        console.log("🧪 Testing transfer_credits logic...");

        // 1. Create dummy parent and child
        const parentId = '00000000-0000-0000-0000-000000000001';
        const childId = '00000000-0000-0000-0000-000000000002';

        // Setup: Ensure parent has credits and child is locked
        await client.query(`
            -- Create profiles if not exist
            INSERT INTO auth.users (id, email) VALUES ($1, 'test-parent@example.com') ON CONFLICT DO NOTHING;
        `, [parentId]);
        await client.query(`
            INSERT INTO auth.users (id, email) VALUES ($1, 'test-child@example.com') ON CONFLICT DO NOTHING;
        `, [childId]);
        await client.query(`
            INSERT INTO profiles (id, role, credits) VALUES ($1, 'parent', 1000) ON CONFLICT (id) DO UPDATE SET credits = 1000;
        `, [parentId]);
        await client.query(`
            INSERT INTO profiles (id, role, parent_id, credits, subscription_status) VALUES ($1, 'player', $2, 0, 'inactive') 
            ON CONFLICT (id) DO UPDATE SET parent_id = $2, credits = 0, subscription_status = 'inactive';
        `, [childId, parentId]);

        console.log("   Setup complete: Parent (1000cr), Child (0cr, locked)");

        // 2. Perform transfer
        console.log("   Executing transfer...");
        const res = await client.query(`SELECT transfer_credits($1, $2, 100)`, [parentId, childId]);
        console.log("   Transfer result:", res.rows[0].transfer_credits);

        // 3. Verify child is unlocked
        const checkRes = await client.query(`SELECT credits, subscription_status FROM profiles WHERE id = $1`, [childId]);
        const child = checkRes.rows[0];

        console.log(`   Child Status: ${child.subscription_status}`);
        console.log(`   Child Credits: ${child.credits}`);

        if (child.subscription_status === 'active' && child.credits === 100) {
            console.log("✅ SUCCESS: Child unlocked and received credits!");
        } else {
            console.error("❌ FAILURE: Child did not unlock properly.");
        }

        // Cleanup
        await client.query('DELETE FROM profiles WHERE id IN ($1, $2)', [parentId, childId]);
        await client.query('DELETE FROM auth.users WHERE id IN ($1, $2)', [parentId, childId]);

    } catch (e) {
        console.error("❌ Test Failed:", e);
    } finally {
        client.release();
        await pool.end();
    }
})();
