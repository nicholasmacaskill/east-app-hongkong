
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanAvailability() {
    console.log("Cleaning availability table...");
    // Delete rows where coach_id is NULL
    const { error, count } = await supabase
        .from('availability')
        .delete({ count: 'exact' })
        .is('coach_id', null);

    if (error) {
        console.error("Error deleting:", error);
    } else {
        console.log(`Deleted ${count} invalid slots.`);
    }
}

cleanAvailability();
