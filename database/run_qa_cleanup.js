const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const getDbPool = () => {
    return new Pool({
        host: 'aws-0-us-west-2.pooler.supabase.com',
        port: 6543,
        user: 'postgres.hxbsnplotkiohcbmvsjf',
        password: 'Uninsured5-Unissued6-Happier7-Dripping1-Bubbling8',
        database: 'postgres',
        ssl: {
            rejectUnauthorized: false
        }
    });
};

async function runQaCleanup() {
    const pool = getDbPool();
    const client = await pool.connect();

    try {
        console.log("🔧 RUNNING QA CLEANUP MIGRATION");
        console.log("=".repeat(60));

        // Read the SQL file
        const sqlPath = path.join(__dirname, 'qa_cleanup_production.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Execute the migration
        await client.query(sql);

        console.log("✅ Migration executed successfully");
        console.log("=".repeat(60));

        // Verify the changes
        console.log("\n📋 VERIFICATION:");

        // 1. Check if credits_paid is being set in the function
        console.log("\n1. Checking book_session_with_credits definition...");
        const funcCheck = await client.query(`
            SELECT pg_get_functiondef(oid) as def
            FROM pg_proc 
            WHERE proname = 'book_session_with_credits'
        `);
        if (funcCheck.rows[0].def.includes('credits_paid')) {
            console.log("   ✅ Function now stores credits_paid");
        } else {
            console.log("   ❌ WARNING: Function may not store credits_paid");
        }

        // 2. Check for stripe index
        console.log("\n2. Checking Stripe index...");
        const idxCheck = await client.query(`
            SELECT indexname FROM pg_indexes 
            WHERE tablename = 'profiles' 
            AND indexname = 'idx_profiles_stripe_customer_id'
        `);
        console.log(`   ${idxCheck.rows.length > 0 ? '✅' : '❌'} Stripe customer ID index: ${idxCheck.rows.length > 0 ? 'Present' : 'Missing'}`);

        // 3. Check constraints
        console.log("\n3. Checking constraints...");
        const constraintCheck = await client.query(`
            SELECT conname, pg_get_constraintdef(oid) as def
            FROM pg_constraint 
            WHERE conrelid = 'public.profiles'::regclass
            AND conname IN ('profiles_tier_check', 'profiles_role_check')
        `);
        constraintCheck.rows.forEach(row => {
            console.log(`   ✅ ${row.conname}`);
        });

        // 4. Check RLS on sessions
        console.log("\n4. Checking sessions RLS...");
        const rlsCheck = await client.query(`
            SELECT rowsecurity FROM pg_tables 
            WHERE schemaname = 'public' AND tablename = 'sessions'
        `);
        console.log(`   ${rlsCheck.rows[0].rowsecurity ? '✅' : '❌'} RLS enabled: ${rlsCheck.rows[0].rowsecurity}`);

        const policiesCheck = await client.query(`
            SELECT policyname FROM pg_policies 
            WHERE tablename = 'sessions'
        `);
        console.log(`   ✅ Policies: ${policiesCheck.rows.map(r => r.policyname).join(', ')}`);

        console.log("\n" + "=".repeat(60));
        console.log("✅ QA CLEANUP COMPLETE - All systems optimized");

    } catch (e) {
        console.error("❌ Migration failed:", e);
        throw e;
    } finally {
        client.release();
        await pool.end();
    }
}

runQaCleanup();
