import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.production') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) process.exit(1);

const supabase = createClient(supabaseUrl, supabaseKey);

async function undoRefunds() {
    console.log("=== REVERSING REFUNDS ===");

    const targetRefunds = [
        { email: 'chavis.suen@gmail.com', creditsToRemove: 300 },
        { email: 'rwong246888@gmail.com', creditsToRemove: 100 },
        { email: 'easthpc@gmail.com', creditsToRemove: 200 }
    ];

    const { data: allProfiles } = await supabase.from('profiles').select('id, contact_email, first_name, last_name, credits');

    const exactTargets = [];

    if (allProfiles) {
        for (const target of targetRefunds) {
            const p = allProfiles.find(x => x.contact_email?.toLowerCase() === target.email.toLowerCase());
            if (p) exactTargets.push({ id: p.id, name: p.contact_email, credits: target.creditsToRemove });
        }
        
        const vincent = allProfiles.find(x => x.first_name?.toLowerCase().includes('vincent') && x.last_name?.toLowerCase().includes('ahrens'));
        if (vincent) exactTargets.push({ id: vincent.id, name: 'Vincent Ahrens', credits: 400 });

        const dickson = allProfiles.find(x => x.first_name?.toLowerCase().includes('dickson'));
        if (dickson) exactTargets.push({ id: dickson.id, name: 'Dickson Lee', credits: 400 });
    }

    for (const user of exactTargets) {
        console.log(`[UNDO INITIATED] Reversing ${user.credits} credits from ${user.name}...`);
        
        // Negative increment reverses it
        const { error } = await supabase.rpc('increment_credits', {
            p_user_id: user.id,
            p_amount: -Math.abs(user.credits)
        });

        if (error) {
            console.error(`❌ Failed to reverse ${user.name}:`, error.message);
        } else {
            console.log(`✅ REVERSAL SUCCESSFUL: ${user.name}`);
        }
    }
}

undoRefunds();
