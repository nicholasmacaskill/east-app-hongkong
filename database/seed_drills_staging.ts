import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const client = new Client({
    host: 'aws-1-us-east-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.lzqnviblkcnjsxutqeht',
    password: 'FNjB8Ca3Ar0Yg816mY%9',
    ssl: { rejectUnauthorized: false }
});

async function seed() {
    try {
        await client.connect();
        console.log('--- Seeding Drill Hub Content (Direct PG) ---');

        // 1. Get a coach ID
        const coachRes = await client.query("SELECT id FROM public.profiles WHERE contact_email = 'qanic@east.com' LIMIT 1");
        if (coachRes.rows.length === 0) {
            console.error('❌ Default coach (qanic@east.com) not found.');
            return;
        }
        const coachId = coachRes.rows[0].id;

        // 2. Clear existing
        await client.query("DELETE FROM public.coach_drill_steps");
        await client.query("DELETE FROM public.coach_drills");

        const mockDrills = [
            {
                title: 'Triangle Sprint',
                coach_id: coachId,
                age_tags: ['10-12', '12-16'],
                level_tags: ['Intermediate'],
                skill_tags: ['Speed', 'Transition']
            },
            {
                title: 'Anaheim Ducks Offensive Entry',
                coach_id: coachId,
                age_tags: ['12-16', '16-20'],
                level_tags: ['Advanced'],
                skill_tags: ['Offense', 'Tactics']
            },
            {
                title: 'Florida Panthers Technical Drill',
                coach_id: coachId,
                age_tags: ['16-20', '20-24'],
                level_tags: ['Elite'],
                skill_tags: ['Defense', 'Vision']
            }
        ];

        for (const drill of mockDrills) {
            console.log(`Inserting Drill: ${drill.title}...`);
            const res = await client.query(
                "INSERT INTO public.coach_drills (title, coach_id, age_tags, level_tags, skill_tags, status) VALUES ($1, $2, $3, $4, $5, 'published') RETURNING id",
                [drill.title, drill.coach_id, drill.age_tags, drill.level_tags, drill.skill_tags]
            );
            const drillId = res.rows[0].id;

            // Steps
            const steps = [
                {
                    step_number: 1,
                    title: 'Initial Formation',
                    instruction: 'Form a tight circle at center ice for the tactical briefing.',
                    diagram_url: 'https://images.unsplash.com/photo-1510566337590-2fc1f21d0faa?w=400'
                },
                {
                    step_number: 2,
                    title: 'Pattern Execution',
                    instruction: 'Execute the triangular pattern with maximum intensity.',
                    diagram_url: 'https://images.unsplash.com/photo-1550256200-eee95d03f30a?w=400'
                }
            ];

            for (const step of steps) {
                await client.query(
                    "INSERT INTO public.coach_drill_steps (drill_id, step_number, title, instruction, diagram_url) VALUES ($1, $2, $3, $4, $5)",
                    [drillId, step.step_number, step.title, step.instruction, step.diagram_url]
                );
            }
            console.log(`  - ✅ Steps Inserted.`);
        }

        console.log('\n--- SEEDING COMPLETE ---');
    } catch (e) {
        console.error('❌ Seeding failed:', e);
    } finally {
        await client.end();
    }
}

seed();
