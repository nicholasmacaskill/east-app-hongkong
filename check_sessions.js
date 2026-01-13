
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
    const { data, error } = await supabase
        .from('sessions')
        .select('id, title, instructor, session_type_id, category')
        .order('id', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error:', error);
    } else {
        console.table(data);
    }
}

check();
