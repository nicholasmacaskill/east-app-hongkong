import { getSupabaseAdmin } from '../app/lib/supabaseAdmin';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkChurnData() {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        const { data: profiles, error } = await supabaseAdmin
            .from('profiles')
            .select('id, subscription_status, role, first_name, last_name');

        if (error) throw error;

        console.log('--- SUBSCRIPTION STATUS SUMMARY ---');
        const statusCounts: Record<string, number> = {};
        profiles.forEach(p => {
            const status = p.subscription_status || 'null';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        console.table(statusCounts);

        const activeProfiles = profiles.filter(p => ['active', 'trialing'].includes(p.subscription_status || ''));
        const totalChurned = profiles.filter(p => ['cancelled', 'canceled', 'past_due', 'unpaid', 'overdue'].includes(p.subscription_status || '')).length;

        console.log('Active Profiles Count:', activeProfiles.length);
        console.log('Churned Profiles Count:', totalChurned);

        if (activeProfiles.length > 0 || totalChurned > 0) {
            const retentionRate = (activeProfiles.length / (activeProfiles.length + totalChurned)) * 100;
            console.log('Retention Rate:', retentionRate.toFixed(2), '%');
            console.log('Churn Rate:', (100 - retentionRate).toFixed(2), '%');
        } else {
            console.log('No subscribers or churned users found.');
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

checkChurnData();
