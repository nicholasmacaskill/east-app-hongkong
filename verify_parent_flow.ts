
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Manual Env Load
try {
    const envPath = path.resolve('.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach((line: string) => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
                const [key, ...vals] = trimmed.split('=');
                const val = vals.join('=').replace(/^["']|["']$/g, '');
                process.env[key.trim()] = val;
            }
        });
    }
} catch (e) {
    console.log("Could not read .env.local");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const PARENT_ID = '833deeb8-390c-5763-9acb-f8e854cfbaf2';

async function runAudit() {
    console.log("--- STARTING AUDIT ---");

    // 1. Fetch Parent
    console.log("1. Fetching Parent...");
    const { data: parent } = await supabase.from('profiles').select('credits').eq('id', PARENT_ID).single();
    // 1b. Reset Credits
    console.log("   Top Up Credits to 1000...");
    await supabase.from('profiles').update({ credits: 1000 }).eq('id', PARENT_ID);

    // 2. Fetch Children
    console.log("2. Fetching Children...");
    const { data: children } = await supabase.from('player_relationships').select('child_id').eq('parent_id', PARENT_ID);
    let childId = children && children.length > 0 ? children[0].child_id : null;

    if (!childId) {
        console.log("   No child found. Creating relationship with Player User...");
        const PLAYER_ID = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';
        const { error } = await supabase.from('player_relationships').upsert(
            { parent_id: PARENT_ID, child_id: PLAYER_ID },
            { onConflict: 'parent_id, child_id', ignoreDuplicates: true }
        );
        childId = PLAYER_ID;
        console.log("   Linked Parent to Player.");
    }
    console.log(`   Target Child ID: ${childId}`);

    // 3. Find Session
    const { data: sessions } = await supabase.from('sessions').select('*').eq('category', 'CLASS').limit(1);
    const session = sessions![0];
    const COST = session.credit_cost || 10;
    console.log(`   Target Session: ${session.title} (ID: ${session.id}, Cost: ${COST})`);

    // 4. CLEANUP
    if (childId) {
        await supabase.from('registrations').delete().eq('session_id', session.id).in('user_id', [PARENT_ID, childId]);
    }

    // 5. TEST: Book for Parent AND Child
    console.log("\n--- TEST: BOOKING (Parent + Child) ---");
    const rpc1 = await supabase.rpc('book_session_with_credits', { p_user_id: PARENT_ID, p_session_id: session.id, p_attendee_id: PARENT_ID });
    console.log(`   Booking 1 (Parent): ${rpc1.data?.message} (Success: ${rpc1.data?.success})`);

    const rpc2 = await supabase.rpc('book_session_with_credits', { p_user_id: PARENT_ID, p_session_id: session.id, p_attendee_id: childId });
    console.log(`   Booking 2 (Child):  ${rpc2.data?.message} (Success: ${rpc2.data?.success})`);

    // 6. VERIFY CREDITS
    console.log("\n--- VERIFICATION ---");
    const { data: parentPost } = await supabase.from('profiles').select('credits').eq('id', PARENT_ID).single();
    const expected = 1000 - (COST * 2);
    console.log(`   Credits After:  ${parentPost!.credits}`);
    console.log(`   Expected:       ${expected}`);

    if (parentPost!.credits !== expected) {
        console.error("   ❌ CREDIT CALCULATION WRONG");
    } else {
        console.log("   ✅ Credits Correct");
    }

    // 8. TEST: DELETE Child so we can re-test Refund
    // Actually skipping refund test since it passed before, let's look at CALENDAR SHAPE

    // 9. TEST: CALENDAR DATA SHAPE
    console.log("\n--- TEST: CALENDAR SHAPE ---");

    const { data: calData } = await supabase
        .from('registrations')
        .select(`
            session_id,
            user_id,
            sessions (id, title),
            profiles!registrations_user_id_fkey (id, first_name)
        `)
        .in('user_id', [PARENT_ID, childId]);

    console.log("   Calendar Rows:", calData?.length);
    calData?.forEach((row: any) => {
        // IMPORTANT: This logs exactly what standard Supabase selection returns
        console.log(`   - Session: ${row.sessions.title} | Attendee Field Type: ${Array.isArray(row.profiles) ? 'ARRAY' : 'OBJECT'} | Value:`, JSON.stringify(row.profiles));
    });
}

runAudit();
