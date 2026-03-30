import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// POINT DIRECTLY TO THE LIVE PRODUCTION DB TO PROCESS ACTUAL REFUNDS
dotenv.config({ path: path.resolve(__dirname, '../.env.production') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) process.exit(1);

const supabase = createClient(supabaseUrl, supabaseKey);

async function processRefunds() {
    console.log("=== PROCESSING AUTOMATED INCIDENT REFUNDS (LIVE DB) ===");

    // The users we identified via Ghost Hunter and Resend Logs
    const targetRefunds = [
        { email: 'chavis.suen@gmail.com', creditsToRestore: 300 },
        { email: 'rwong246888@gmail.com', creditsToRestore: 100 },
        { email: 'easthpc@gmail.com', creditsToRestore: 200 },
        // Vincent Ahrens and Dickson Lee Chin Bok (Need to find their IDs)
    ];

    // Attempt to locate Vincent and Dickson via full name if their email isn't exact
    const { data: allProfiles } = await supabase.from('profiles').select('id, contact_email, first_name, last_name, credits');

    const exactTargets = [];

    if (allProfiles) {
        for (const target of targetRefunds) {
            const p = allProfiles.find(x => x.contact_email?.toLowerCase() === target.email.toLowerCase());
            if (p) exactTargets.push({ id: p.id, name: p.contact_email, credits: target.creditsToRestore });
        }
        
        // Find Vincent
        const vincent = allProfiles.find(x => x.first_name?.toLowerCase().includes('vincent') && x.last_name?.toLowerCase().includes('ahrens'));
        if (vincent) exactTargets.push({ id: vincent.id, name: 'Vincent Ahrens', credits: 400 });

        // Find Dickson
        const dickson = allProfiles.find(x => x.first_name?.toLowerCase().includes('dickson'));
        if (dickson) exactTargets.push({ id: dickson.id, name: 'Dickson Lee', credits: 400 });
    }

    for (const user of exactTargets) {
        console.log(`[REFUND INITIATED] Restoring ${user.credits} credits to ${user.name}...`);
        
        // Atomic increment via RPC to ensure concurrency safety
        const { error } = await supabase.rpc('increment_credits', {
            p_user_id: user.id,
            p_amount: user.credits
        });

        if (error) {
            console.error(`❌ Failed to refund ${user.name}:`, error.message);
        } else {
            console.log(`✅ EXACT REFUND SUCCESSFUL: ${user.name}`);
        }
    }
}

processRefunds();
