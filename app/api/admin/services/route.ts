import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { logAdminAction } from '@/app/lib/audit';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function GET() {
    try {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
            .from('session_types')
            .select('*')
            .order('title');

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, category, image_url, description, coachIds, credit_cost, default_capacity } = body;

        const supabase = getSupabaseAdmin();

        // 1. Create service
        const { data: service, error: serviceError } = await supabase
            .from('session_types')
            .insert([{ title, category, image_url, description, credit_cost, default_capacity }])
            .select()
            .single();

        if (serviceError) throw serviceError;

        // 2. Sync coaches if provided
        if (coachIds && coachIds.length > 0) {
            const coachPayloads = coachIds.map((cid: string) => ({
                coach_id: cid,
                session_type_id: service.id
            }));
            await supabase.from('coach_services').insert(coachPayloads);
        }

        // 3. Audit Log
        await logAction(request, 'ANNOUNCEMENT_CREATED', 'service', service.id, { title, category }, `Created service: ${title}`);

        return NextResponse.json({ success: true, service });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, title, category, image_url, description, coachIds, credit_cost, default_capacity } = body;

        const supabase = getSupabaseAdmin();

        // 1. Update service
        const { error: serviceError } = await supabase
            .from('session_types')
            .update({ title, category, image_url, description, credit_cost, default_capacity })
            .eq('id', id);

        if (serviceError) throw serviceError;

        // 2. Sync coaches
        if (coachIds !== undefined) {
            await supabase.from('coach_services').delete().eq('session_type_id', id);
            if (coachIds.length > 0) {
                const coachPayloads = coachIds.map((cid: string) => ({
                    coach_id: cid,
                    session_type_id: id
                }));
                await supabase.from('coach_services').insert(coachPayloads);
            }
        }

        // 3. Audit Log
        await logAction(request, 'ANNOUNCEMENT_UPDATED', 'service', id, { title, category }, `Updated service: ${title}`);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const supabase = getSupabaseAdmin();

        // Get name for audit
        const { data: service } = await supabase.from('session_types').select('title').eq('id', id).single();

        // TICKET #12: Clear out all calendar entries when a service is deleted
        const { error: sessionsError } = await supabase.from('sessions').delete().eq('session_type_id', id);
        if (sessionsError) console.error("Failed to clean up associated sessions:", sessionsError);

        const { error } = await supabase.from('session_types').delete().eq('id', id);
        if (error) throw error;

        // Audit Log
        await logAction(request, 'ANNOUNCEMENT_DELETED', 'service', id, {}, `Deleted service: ${service?.title || id}`);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function logAction(request: Request, action: any, targetType: string, targetId: string, details: any, targetName: string) {
    const cookieStore = await cookies();
    const supabaseAuth = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll() { return cookieStore.getAll() }, setAll(c) { } } }
    );
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (user) {
        const supabaseAdmin = getSupabaseAdmin();
        const { data: adminProfile } = await supabaseAdmin.from('profiles').select('first_name, last_name').eq('id', user.id).single();
        const adminName = adminProfile ? `${adminProfile.first_name} ${adminProfile.last_name}` : user.email;
        await logAdminAction(user.id, action, targetType, targetId, details, adminName, targetName);
    }
}
