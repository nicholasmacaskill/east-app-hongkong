
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAvailability() {
    console.log("Checking availability table...");
    const { data, error } = await supabase.from('availability').select('*');

    if (error) {
        console.error("Error fetching availability:", error);
    } else {
        console.log(`Found ${data.length} slots.`);
        if (data.length > 0) {
            console.log("Sample slot:", data[0]);
        }
    }
}

checkAvailability();
