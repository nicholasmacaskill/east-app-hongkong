const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function regenerateShootingPads() {
    console.log("Starting Emergency Generation of Shooting Pad (Front) and (Back) on Live Database...");
    
    let injectedCount = 0;
    
    // Generate 30 days of data, 9am to 4pm (blocks ending at 5pm)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const payloads = [];

    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
        const baseDate = new Date(today);
        baseDate.setDate(today.getDate() + dayOffset);

        for (let startHour = 9; startHour <= 16; startHour++) {
            const slotStart = new Date(baseDate);
            slotStart.setHours(startHour, 0, 0, 0);

            const slotEnd = new Date(baseDate);
            slotEnd.setHours(startHour + 1, 0, 0, 0);

            // Front Pad
            payloads.push({
                title: 'Shooting Pad (Front)',
                category: 'FACILITY',
                instructor: 'Staff',
                start_time: slotStart.toISOString(),
                end_time: slotEnd.toISOString(),
                image_url: 'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/Facility4.png?v=1765941249',
                description: 'Front Synthetic Ice Full Size Shooting Lane',
                credit_cost: 100
            });

            // Back Pad
            payloads.push({
                title: 'Shooting Pad (Back)',
                category: 'FACILITY',
                instructor: 'Staff',
                start_time: slotStart.toISOString(),
                end_time: slotEnd.toISOString(),
                image_url: 'https://cdn.shopify.com/s/files/1/0759/3721/8848/files/Facility4.png?v=1765941249',
                description: 'Back Synthetic Ice Full Size Shooting Lane',
                credit_cost: 100
            });
            
            injectedCount += 2;
        }
    }

    console.log(`Prepared ${payloads.length} sessions... Executing insert in batches.`);
    
    for (let i = 0; i < payloads.length; i += 50) {
        const batch = payloads.slice(i, i + 50);
        const { error } = await supabase.from('sessions').insert(batch);
        if (error) {
            console.error("Batch insert failed:", error);
        }
    }

    console.log(`✅ Emergency Restore Completed. Total sessions recovered: ${injectedCount}.`);
}

regenerateShootingPads();
