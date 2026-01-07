
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
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function reproduceRoute() {
    const parentId = '431d2e1a-3e96-469c-936c-5c6f6080d3ce';
    const email = `test.repro.${Date.now()}@example.com`;
    const firstName = 'Test';
    const lastName = 'Repro';

    console.log(`\n--- REPRODUCING ROUTE LOGIC ---`);

    // 0. Validate Parent
    console.log(`[ADD CHILD] Validating Parent ID: ${parentId}`);
    const { data: parentExists, error: parentCheckErr } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', parentId)
        .single();

    if (parentCheckErr || !parentExists) {
        console.error(`[ADD CHILD] Parent ID ${parentId} NOT FOUND.`);
        return;
    }
    console.log(`[ADD CHILD] Parent found.`);

    // 1. Create User
    console.log("Creating Auth User...");
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        email_confirm: true,
        user_metadata: { first_name: firstName, last_name: lastName, role: 'player' },
        password: 'password123'
    });

    if (authError) {
        console.error('Auth Error:', authError);
        return;
    }

    const childId = authData.user.id;
    console.log(`Child ID Created: ${childId}`);

    // 2. UPSERT Profile (The suspected failure point)
    // Replicating route.ts payload exactly
    console.log("Attempting UPSERT...");
    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
            id: childId,
            first_name: firstName,
            last_name: lastName,
            username: email,
            contact_email: email,
            parent_id: parentId, // LINK TO PARENT
            role: 'player',
            bio: 'Athlete',
            credits: 0
        });

    if (profileError) {
        console.error('Profile Error:', profileError);
    } else {
        console.log("UPSERT SUCCESS! (Cleaning up...)");
        await supabaseAdmin.auth.admin.deleteUser(childId);
    }
}

reproduceRoute();
