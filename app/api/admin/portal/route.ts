
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { createClient } from '@supabase/supabase-js';
import { logAdminAction } from '@/app/lib/audit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function verifyAdmin(request: Request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return { error: 'Unauthorized', status: 401 };

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) return { error: 'Unauthorized', status: 401 };

    const supabaseAdmin = getSupabaseAdmin();
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role, first_name, last_name')
        .eq('id', user.id)
        .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'sys-admin')) {
        return { error: 'Forbidden', status: 403 };
    }

    return { user, profile };
}

export async function GET(request: Request) {
    const auth = await verifyAdmin(request);
    if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
        .from('po_portal_tickets')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

export async function POST(request: Request) {
    const auth = await verifyAdmin(request);
    if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { title, whatsapp_text, technical_spec } = await request.json();

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
        .from('po_portal_tickets')
        .insert({
            title,
            whatsapp_text,
            technical_spec: technical_spec || {},
            created_by: auth.user.id,
            status: 'Suggested'
        })
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const adminName = `${auth.profile.first_name || ''} ${auth.profile.last_name || ''}`.trim() || auth.user.email;
    await logAdminAction(
        auth.user.id,
        'PORTAL_TICKET_CREATED',
        'portal_ticket',
        data.id,
        { title },
        adminName,
        'PO Portal'
    );

    return NextResponse.json(data);
}

export async function PATCH(request: Request) {
    const auth = await verifyAdmin(request);
    if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { id, status, technical_spec, rejection_reason, ai_memory_summary } = await request.json();

    if (!id) return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });

    const supabaseAdmin = getSupabaseAdmin();
    
    // Fetch old status for logging
    const { data: oldTicket } = await supabaseAdmin
        .from('po_portal_tickets')
        .select('status, title')
        .eq('id', id)
        .single();

    const { data, error } = await supabaseAdmin
        .from('po_portal_tickets')
        .update({
            status,
            technical_spec,
            rejection_reason,
            ai_memory_summary,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const adminName = `${auth.profile.first_name || ''} ${auth.profile.last_name || ''}`.trim() || auth.user.email;
    await logAdminAction(
        auth.user.id,
        'PORTAL_TICKET_UPDATED',
        'portal_ticket',
        id,
        { 
            oldStatus: oldTicket?.status, 
            newStatus: status,
            title: oldTicket?.title
        },
        adminName,
        'PO Portal'
    );

    return NextResponse.json(data);
}
