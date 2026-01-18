
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

let supabaseUrl = '';
let supabaseKey = '';

try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf-8');

    envContent.split('\n').forEach(line => {
        const [key, ...values] = line.split('=');
        if (key && values.length > 0) {
            const val = values.join('=').trim().replace(/^['"]|['"]$/g, '');
            if (key.trim() === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = val;
            if (key.trim() === 'SUPABASE_SERVICE_ROLE_KEY') supabaseKey = val;
        }
    });
} catch (e) { console.error(e); }

if (!supabaseUrl || !supabaseKey) { console.error("Missing credentials"); process.exit(1); }
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectConstraints() {
    console.log("--- INSPECTING CONSTRAINTS ON profiles TABLE ---");

    // Note: Supabase JS client doesn't support querying information_schema easily via .from()
    // because it's not exposed in the API without setup.
    // BUT we can try RPC if there is a 'exec_sql' or similar. 
    // OR we can infer it by trying to insert bad data and reading error.

    // Actually, we can assume the error message "profiles_parent_id_fkey" is accurate.
    // The question is: What does it point to?

    // Let's try to fetch a known parent and see its ID format.
    const parentId = '431d2e1a-3e96-469c-936c-5c6f6080d3ce'; // The user causing issues
    const { data: parent } = await supabase.from('profiles').select('id, parent_id').eq('id', parentId).single();
    console.log("Parent Profile:", parent);

    // 1. Create Dummy Auth User
    const email = `test.child.${Date.now()}@example.com`;
    console.log(`Creating dummy auth user: ${email}`);

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: 'password123',
        user_metadata: { first_name: 'Test', last_name: 'Child' },
        email_confirm: true
    });

    if (authError) {
        console.error("AUTH ERROR:", authError);
        return;
    }

    const childId = authData.user.id;
    console.log(`Auth User Created: ${childId}`);

    // 2. Insert Profile with Valid Parent Link
    console.log(`Attempting insert with parent_id: ${parentId}`);

    const { error } = await supabase.from('profiles').insert({
        id: childId,
        first_name: 'TestChild',
        last_name: 'Debug',
        parent_id: parentId,
        role: 'player',
        credits: 0,
        // email: email,  <- Removed because column doesn't exist
        contact_email: email
    });

    if (error) {
        console.error("PROFILE INSERT ERROR:", error);
    } else {
        console.log("PROFILE INSERT SUCCESS! (Cleaning up...)");
        await supabase.auth.admin.deleteUser(childId);
    }
}

inspectConstraints();
