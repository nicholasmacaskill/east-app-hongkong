
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: '.env.local' });
import { getSupabaseAdmin } from '../app/lib/supabaseAdmin';

async function run() {
    const supabase = getSupabaseAdmin();

    // Find a registration with a confirmed status that has profile info
    const { data: regs, error } = await supabase
        .from('registrations')
        .select(`
      user_id,
      status,
      profiles!inner (
        first_name,
        last_name,
        role
      )
    `)
        .eq('status', 'confirmed')
        .order('registered_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error fetching registrations:', error);
        return;
    }

    if (!regs || regs.length === 0) {
        console.log('No confirmed registrations found.');
        return;
    }

    console.log('Active Bookings found for these users:');
    regs.forEach(reg => {
        const profile: any = reg.profiles;
        console.log(`- ${profile.first_name} ${profile.last_name} (Role: ${profile.role}, ID: ${reg.user_id})`);
    });
}

run();
