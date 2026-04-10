import { NextResponse } from 'next/server';
import { getSupabaseAdmin, getPartnerSupabaseAdmin } from '@/app/lib/supabaseAdmin';

export async function POST(req: Request) {
    const syncToken = req.headers.get('x-sync-token');
    const secret = process.env.TICKET_SYNC_SECRET;

    if (!secret || syncToken !== secret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const payload = await req.json();
        const { table, type, record, old_record } = payload;

        if (table !== 'engineering_tickets') {
            return NextResponse.json({ error: 'Unsupported table' }, { status: 400 });
        }

        // Loop Prevention: If the update came from the sync agent, ignore it
        if (record?.assigned_agent === 'Sync Agent') {
            return NextResponse.json({ message: 'Sync origin ignored' });
        }

        const partnerSupabase = getPartnerSupabaseAdmin();
        if (!partnerSupabase) {
            return NextResponse.json({ error: 'Partner configuration missing' }, { status: 500 });
        }

        // 1. Resolve Reporter in Target Environment
        let targetReporterId = record.reporter_id;
        try {
            // We need to look up the reporter by email because UUIDs differ
            const sourceSupabase = getSupabaseAdmin();
            const { data: sourceProfile } = await sourceSupabase
                .from('profiles')
                .select('contact_email')
                .eq('id', record.reporter_id)
                .single();

            if (sourceProfile?.contact_email) {
                const { data: targetProfile } = await partnerSupabase
                    .from('profiles')
                    .select('id')
                    .eq('contact_email', sourceProfile.contact_email)
                    .single();
                
                if (targetProfile) {
                    targetReporterId = targetProfile.id;
                }
            }
        } catch (e) {
            console.error('[SYNC_REPORTER_RESOLVE_ERROR]', e);
        }

        const syncData = {
            ...record,
            reporter_id: targetReporterId,
            assigned_agent: 'Sync Agent', // Mark as synced to prevent loops
            updated_at: new Date().toISOString()
        };

        if (type === 'DELETE') {
            const { error } = await partnerSupabase
                .from('engineering_tickets')
                .delete()
                .eq('sync_id', old_record.sync_id);
            if (error) throw error;
        } else {
            // INSERT or UPDATE
            const { error } = await partnerSupabase
                .from('engineering_tickets')
                .upsert(syncData, { onConflict: 'sync_id' });
            if (error) throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[SYNC_ERROR]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
