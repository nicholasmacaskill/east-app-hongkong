const { Client } = require('pg');

// Test script to verify session capacity constraints
const client = new Client({
    connectionString: 'postgresql://postgres.ktlicvvczrlppqkcqedv:J0YqJq1EnDuyEF6X@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

async function test() {
    try {
        await client.connect();
        console.log('🧪 Testing Session Capacity Constraints\n');

        // 1. Verify max_capacity column exists
        const schemaCheck = await client.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'sessions' AND column_name = 'max_capacity';
    `);

        if (schemaCheck.rows.length > 0) {
            console.log('✅ max_capacity column exists');
            console.log(`   Default: ${schemaCheck.rows[0].column_default}\n`);
        } else {
            console.error('❌ max_capacity column NOT found!');
            process.exit(1);
        }

        // 2. Verify constraint exists
        const constraintCheck = await client.query(`
      SELECT constraint_name, check_clause 
      FROM information_schema.check_constraints 
      WHERE constraint_name = 'sessions_max_capacity_positive';
    `);

        if (constraintCheck.rows.length > 0) {
            console.log('✅ Capacity constraint exists');
            console.log(`   Clause: ${constraintCheck.rows[0].check_clause}\n`);
        } else {
            console.error('❌ Capacity constraint NOT found!');
            process.exit(1);
        }

        // 3. Verify booking function includes capacity check
        const functionCheck = await client.query(`
      SELECT pg_get_functiondef(oid) as definition
      FROM pg_proc 
      WHERE proname = 'book_session_with_credits';
    `);

        if (functionCheck.rows.length > 0) {
            const funcDef = functionCheck.rows[0].definition;
            if (funcDef.includes('max_capacity') && funcDef.includes('current_bookings')) {
                console.log('✅ Booking function includes capacity checks');
            } else {
                console.error('❌ Booking function missing capacity logic!');
                process.exit(1);
            }
        }

        console.log('\n🎉 All capacity constraint tests passed!');

    } catch (err) {
        console.error('❌ Test failed:', err.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

test();
