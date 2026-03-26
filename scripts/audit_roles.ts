import { getSupabaseAdmin } from '../app/lib/supabaseAdmin';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function auditRoles() {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        const { data: profiles, error } = await supabaseAdmin
            .from('profiles')
            .select('id, role, subscription_status, account_status, contact_email');

        if (error) throw error;

        console.log('--- ROLE & SUBSCRIPTION AUDIT ---');
        const roleStats: Record<string, { total: number, activeSub: number, test: number }> = {};

        profiles.forEach(p => {
            const role = p.role || 'unknown';
            if (!roleStats[role]) roleStats[role] = { total: 0, activeSub: 0, test: 0 };

            roleStats[role].total++;

            const status = (p.subscription_status || '').toLowerCase();
            const accStatus = (p.account_status || '').toLowerCase();
            if (['active', 'trialing'].includes(status) || accStatus === 'active') {
                roleStats[role].activeSub++;
            }

            if (p.contact_email?.includes('test') || p.contact_email?.includes('demo') || p.contact_email?.includes('example')) {
                roleStats[role].test++;
            }
        });

        console.table(roleStats);

        // --- ANOMALY DETECTION ---
        const sysAdmins = roleStats['sys-admin']?.total || 0;
        if (sysAdmins > 5) {
            throw new Error(`🚩 SECURITY ANOMALY: Too many sys-admins detected (${sysAdmins}). Max allowed: 5.`);
        }

        const suspiciousSubs = profiles.filter(p => !p.contact_email?.includes('@') && p.role !== 'player').length;
        if (suspiciousSubs > 0) {
            throw new Error(`🚩 DATA ANOMALY: Detected ${suspiciousSubs} profiles with invalid emails and elevated roles.`);
        }

        console.log('✅ Audit Completed: No critical anomalies detected.');

    } catch (err: any) {
        console.error('❌ Audit Failed:', err?.message || err);
        process.exit(1); // Ensure CI fails
    }
}

auditRoles();
