import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectProfiles() {
    console.log('Fetching profiles...');
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Total profiles: ${data.length}`);
    
    const SEED_EMAILS = [
        'admin@east.com',
        'coach@east.com',
        'parent@east.com',
        'player@east.com'
    ];

    const testUsers = data.filter(p => {
        const email = (p.contact_email || '').toLowerCase();
        const username = (p.username || '').toLowerCase();
        
        const matchesTest = email.includes('test') || username.includes('test') || email.includes('pw.test') || email.includes('login');
        const isSeed = SEED_EMAILS.includes(email);
        
        return matchesTest && !isSeed;
    });

    console.log(`Found ${testUsers.length} suspicious test profiles:`);
    testUsers.forEach(u => {
        console.log(`- ID: ${u.id}, Email: ${u.contact_email}, Username: ${u.username}, Role: ${u.role}, Created: ${u.created_at}`);
    });
}

inspectProfiles();
