import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual .env.local parser to avoid dependencies
const envPath = path.resolve(process.cwd(), '.env.local');
let env: any = {};

if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            env[key.trim()] = value.trim().replace(/"/g, '');
        }
    });
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("Checking for 'Parent User'...");

    // 1. Get Parent ID
    const { data: parents, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', 'parent@east.com');

    let parent: any; // Declare parent outside the if/else block

    if (pError || !parents || parents.length === 0) {
        console.log("⚠️ Parent profile not found. Checking Auth...");

        // Check if Auth user exists first to avoid error
        // Admin API doesn't have "getUserByEmail" easily exposed in all versions, but createUser throws if exists.
        // Let's try to just INSERT profile directly. If auth user exists, we need their ID.
        // We can list users to find the ID.

        const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers();
        const existingAuth = users?.find(u => u.email === 'parent@east.com');

        let parentId;

        if (existingAuth) {
            console.log("✅ Auth user found. Creating missing profile...");
            parentId = existingAuth.id;
        } else {
            console.log("Creating new Parent Auth...");
            const { data: pAuth, error: pAuthErr } = await supabase.auth.admin.createUser({
                email: 'parent@east.com',
                password: 'password123',
                email_confirm: true
            });
            if (pAuthErr) { console.error("Auth create failed", pAuthErr); return; }
            parentId = pAuth.user.id;
        }

        // Create Parent Profile
        const { error: pProfErr } = await supabase
            .from('profiles')
            .upsert({
                id: parentId,
                first_name: 'Parent',
                last_name: 'User',
                username: 'parent@east.com',
                role: 'parent'
            });

        if (pProfErr) {
            console.error("Failed to create parent profile:", pProfErr);
            return;
        }

        // Re-fetch to get object
        const { data: newParents } = await supabase.from('profiles').select('*').eq('username', 'parent@east.com');
        if (!newParents || newParents.length === 0) return;
        parent = newParents[0];
    } else {
        parent = parents[0];
    }
    console.log(`Found Parent: ${parent.first_name} (${parent.id})`);

    // 2. Check for Children
    const { data: children, error: cError } = await supabase
        .from('profiles')
        .select('*')
        .eq('parent_id', parent.id);

    if (cError) {
        console.error("Error fetching children:", cError);
        return;
    }

    if (children && children.length > 0) {
        console.log(`✅ Parent has ${children.length} children linked:`);
        children.forEach(c => console.log(` - ${c.first_name} ${c.last_name} (${c.role})`));
    } else {
        console.log("⚠️ No children found. Seeding a child now...");

        // Create random email for child
        const email = `child_${Date.now()}@test.com`;

        // Create Auth User
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: email,
            password: 'password123',
            email_confirm: true
        });

        if (authError) {
            console.error("Failed to create child auth:", authError);
            return;
        }

        // Create Profile linked to Parent
        const { error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: authData.user.id,
                first_name: 'Timmy',
                last_name: 'Junior',
                username: email,
                role: 'player',
                parent_id: parent.id // LINKING HERE
            });

        if (profileError) {
            console.error("Failed to create child profile:", profileError);
        } else {
            console.log("✅ Created child 'Timmy Junior' and linked to parent.");
        }
    }
}

main();
