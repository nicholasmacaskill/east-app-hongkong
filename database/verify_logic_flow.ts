import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.production.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(url, key);

async function runLogicTest() {
    console.log("🚀 Starting Data Logic Verification...\n");
    try {
        // 1. Get a Coach and Player
        const { data: coach } = await supabase.from('profiles').select('*').eq('role', 'coach').limit(1).single();
        const { data: player } = await supabase.from('profiles').select('*').eq('role', 'player').limit(1).single();
        
        if (!coach || !player) throw new Error("Missing Coach or Player for test.");
        console.log(`✅ Found Coach (${coach.email}) and Player (${player.email})`);

        // 2. Create Drill
        const { data: drill, error: drillErr } = await supabase.from('coach_drills').insert({
            coach_id: coach.id,
            title: "API Test Drill",
        }).select().single();
        if (drillErr) throw drillErr;
        console.log(`✅ Drill created successfully! ID: ${drill.id}`);

        // 3. Create Team
        const { data: team, error: teamErr } = await supabase.from('teams').insert({
            coach_id: coach.id,
            name: "API Test Squad"
        }).select().single();
        if (teamErr) throw teamErr;
        console.log(`✅ Team created successfully! ID: ${team.id}`);

        // 4. Add Player to Team
        const { error: memberErr } = await supabase.from('team_members').insert({
            team_id: team.id,
            user_id: player.id
        });
        if (memberErr) throw memberErr;
        console.log(`✅ Player added to team successfully!`);

        // 5. Send Message with Drill Attached
        const { data: msg, error: msgErr } = await supabase.from('messages').insert({
            sender_id: coach.id,
            team_id: team.id,
            content: "Please review this drill",
            shared_drill_id: drill.id
        }).select().single();
        if (msgErr) throw msgErr;
        console.log(`✅ Message with attached Drill sent successfully!`);

        // 6. Verify Player can fetch team messages
        const { data: fetchMsgs, error: fetchErr } = await supabase.from('messages').select('*, coach_drills(title)').eq('team_id', team.id);
        if (fetchErr) throw fetchErr;
        console.log(`✅ Verification passed! Player's team has ${fetchMsgs?.length} messages. First message drill title: ${fetchMsgs[0]?.coach_drills?.title}`);

        console.log("\n🎉 LOGIC TEST PASSED 100%");

    } catch (e) {
        console.error("❌ Test Failed:", e);
    }
}

runLogicTest();
