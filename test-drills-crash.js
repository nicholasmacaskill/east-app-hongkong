const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
    const { data } = await supabase.from('coach_drills').select('*, coach:profiles(first_name, last_name)');
    console.log("Drills with missing coach names:");
    data.forEach(d => {
        if (!d.coach || !d.coach.first_name || !d.coach.last_name) {
            console.log(d.id, d.title, d.coach);
        }
    });
}
run();
