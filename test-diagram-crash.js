const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
    const { data } = await supabase.from('coach_drill_steps').select('id, drill_id, diagram_url');
    console.log("Steps with weird diagram_urls:");
    data.forEach(d => {
        if (d.diagram_url && !d.diagram_url.startsWith('http') && !d.diagram_url.startsWith('/')) {
            console.log(d.id, d.drill_id, d.diagram_url);
        }
    });
}
run();
