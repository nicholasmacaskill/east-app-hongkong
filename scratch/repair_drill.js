const { Client } = require('pg');
const c = new Client({ 
    host: 'aws-1-us-east-1.pooler.supabase.com', 
    port: 6543, 
    database: 'postgres', 
    user: 'postgres.lzqnviblkcnjsxutqeht', 
    password: 'FNjB8Ca3Ar0Yg816mY%9', 
    ssl: { rejectUnauthorized: false } 
});

const drillId = '68bf5ca2-7372-4272-84af-c218730fbb14';

async function fix() {
    try {
        await c.connect();
        await c.query('DELETE FROM public.coach_drill_steps WHERE drill_id = $1', [drillId]);
        
        const sql = `
            INSERT INTO public.coach_drill_steps (drill_id, step_number, title, instruction, diagram_url)
            VALUES 
            ($1, 1, 'Initial Formation', 'Form a tight circle at center ice for the tactical briefing. Maintain low center of gravity.', 'https://images.unsplash.com/photo-1580748141549-71748ddf0bdc?auto=format&fit=crop&q=80&w=800'),
            ($1, 2, 'Pattern Execution', 'Execute the triangular pattern with maximum intensity. Focus on rapid edge transitions.', 'https://images.unsplash.com/photo-1510566337590-2fc1f21d0faa?w=800'),
            ($1, 3, 'Final Strike', 'Commit to the shot with full rotation. Eyes on the top shelf target.', 'https://images.unsplash.com/photo-1550256200-eee95d03f30a?w=800')
        `;
        
        await c.query(sql, [drillId]);
        console.log('✅ Slapper Roo repaired with 3 cinematic steps');
    } catch (e) {
        console.error(e);
    } finally {
        await c.end();
    }
}

fix();
