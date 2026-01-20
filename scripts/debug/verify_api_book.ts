
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
const supabase = createClient(supabaseUrl, supabaseKey!);

const PARENT_ID = '833deeb8-390c-5763-9acb-f8e854cfbaf2';
const CHILD_ID = 'ea6e1862-00f8-4bb4-9d61-112db7c5bb3b';
const SESSION_ID = 10; // Hyrox
const COST = 250;

async function runApiAudit() {
    console.log("--- STARTING API AUDIT ---");

    // 1. Setup: Reset State
    console.log("1. Resetting State (Credits to 1000, Clearing Bookings)...");
    await supabase.from('profiles').update({ credits: 1000 }).eq('id', PARENT_ID);
    await supabase.from('registrations').delete().eq('session_id', SESSION_ID).in('user_id', [PARENT_ID, CHILD_ID]);

    // 2. API CALL
    console.log("2. Calling API: POST http://localhost:3000/api/sessions/book");
    const payload = {
        userId: PARENT_ID,
        sessionId: SESSION_ID,
        attendeeIds: [PARENT_ID, CHILD_ID]
    };
    console.log("   Payload:", JSON.stringify(payload));

    try {
        const res = await fetch('http://localhost:3000/api/sessions/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        console.log("   API Response:", res.status, JSON.stringify(data));
    } catch (e) {
        console.error("   ❌ API CALL FAILED:", e);
        return;
    }

    // 3. Verify Credits
    console.log("3. Verifying Credits...");
    const { data: parent } = await supabase.from('profiles').select('credits').eq('id', PARENT_ID).single();
    const expected = 1000 - (COST * 2); // 500

    console.log(`   Credits: ${parent?.credits}`);
    console.log(`   Expected: ${expected}`);

    if (parent?.credits !== expected) {
        console.error("   ❌ CREDIT DEDUCTION FAILED");
    } else {
        console.log("   ✅ CREDIT DEDUCTION SUCCESS");
    }

    // 4. Verify Bookings
    const { data: regs } = await supabase.from('registrations').select('user_id').eq('session_id', SESSION_ID);
    console.log(`   Registrations Found: ${regs?.length} (Expected 2)`);
}

runApiAudit();
