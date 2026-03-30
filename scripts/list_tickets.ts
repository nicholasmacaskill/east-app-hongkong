import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.production') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function listTickets() {
    console.log('--- Current Engineering Tickets (Production) ---');
    const { data: tickets, error } = await supabase
        .from('engineering_tickets')
        .select('*')
        .order('id', { ascending: true });

    if (error) {
        console.error('Error fetching tickets:', error.message);
        return;
    }

    tickets.forEach(t => {
        const approval = t.ceo_approval ? '✅ CEO' : '❌ CEO';
        console.log(`[ID:${t.id}] [${t.status.toUpperCase()}] ${t.title} (${t.priority}) - ${approval}`);
    });
}

listTickets();
