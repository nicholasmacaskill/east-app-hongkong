
import getDbPool from '../../app/lib/db';
import { Pool } from 'pg';

// Setup Mock Data
const MOCK_COACH_ID = '722deeb8-289b-4652-9acb-f8e854cfbaf1'; // Ensure this exists
const MOCK_SESSION_TYPE_ID = '87654321-4321-4321-4321-987654321098'; // Needs to be a valid FACILITY/CLASS type

// Mimic the API Logic locally
async function testDualWrite() {
    const pool = getDbPool();
    const client = await pool.connect();

    try {
        console.log("🚀 Testing Coach Availability Dual Write...");

        // 1. Create a dummy session type if needed
        const { rows: types } = await client.query(`SELECT id FROM session_types WHERE category = 'FACILITY' LIMIT 1`);
        let typeId = types[0]?.id;

        if (!typeId) {
            console.log("⚠️ No Facility Type found, creating one...");
            const res = await client.query(`INSERT INTO session_types (title, category) VALUES ('Test Facility', 'FACILITY') RETURNING id`);
            typeId = res.rows[0].id;
        }
        console.log(`✅ Using Session Type ID: ${typeId}`);

        // 2. Prepare Payload (Simulating Frontend)
        const slots = [{
            start_time: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
            end_time: new Date(Date.now() + 90000000).toISOString(),
            session_type_id: typeId,
            credit_cost: 50,
            capacity: 1
        }];

        // 3. Run Logic (Adapted from Route)
        const sessionsToInsert: any[] = [];
        const availabilityToUpsert: any[] = [];

        // Fetch Coach
        const { rows: coaches } = await client.query(`SELECT first_name, last_name, avatar_url FROM profiles WHERE id = $1`, [MOCK_COACH_ID]);
        const coach = coaches[0];
        const coachName = coach ? `${coach.first_name} ${coach.last_name}` : 'Test Coach';

        for (const slot of slots) {
            if (slot.session_type_id) {
                // IT IS A SESSION
                const { rows: typeData } = await client.query(`SELECT * FROM session_types WHERE id = $1`, [slot.session_type_id]);
                const serviceType = typeData[0];

                sessionsToInsert.push({
                    title: serviceType?.title || 'Private Session',
                    category: serviceType?.category || 'PRIVATE',
                    instructor: coachName,
                    start_time: slot.start_time,
                    end_time: slot.end_time,
                    image_url: serviceType?.image_url,
                    coach_image_url: coach?.avatar_url,
                    description: `Booked via Coach Availability`,
                    credit_cost: slot.credit_cost || 10,
                    session_type_id: slot.session_type_id,
                    max_capacity: slot.capacity || 1 // Note: Schema calls it max_capacity usually
                });
            }
        }

        console.log(`📋 identified ${sessionsToInsert.length} sessions to insert.`);

        // 4. Insert
        if (sessionsToInsert.length > 0) {
            for (const s of sessionsToInsert) {
                await client.query(`
                    INSERT INTO sessions 
                    (title, category, instructor, start_time, end_time, image_url, coach_image_url, description, credit_cost, session_type_id, max_capacity)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                `, [s.title, s.category, s.instructor, s.start_time, s.end_time, s.image_url, s.coach_image_url, s.description, s.credit_cost, s.session_type_id, s.max_capacity]);
            }
            console.log("✅ Sessions Inserted Successfully");
        }

        // 5. Verify
        const { rows: verify } = await client.query(`SELECT * FROM sessions WHERE instructor = $1 ORDER BY id DESC LIMIT 1`, [coachName]);
        console.log("🔍 Verification Result:", verify[0]);

    } catch (e) {
        console.error("❌ Test Failed:", e);
    } finally {
        client.release();
        await pool.end();
    }
}

testDualWrite();
