import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { createClient } from '@supabase/supabase-js';
import { announcementSchema, validateInput } from '@/app/lib/validation';
import { sanitize } from '@/app/lib/sanitize';
import { logAdminAction } from '@/app/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        // Authentication check
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabaseAdmin = getSupabaseAdmin();
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || (profile.role !== 'admin' && profile.role !== 'sys-admin')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch all announcements (admin can see drafts)
        const { data: announcements, error } = await supabaseAdmin
            .from('announcements')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching announcements:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(announcements);
    } catch (e: any) {
        console.error('Announcements GET Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // 1. Validate Input
        const validation = validateInput(announcementSchema, body);
        if (!validation.success) {
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        // 2. Sanitize Input
        const { title, content, type, published, event_date, image_url, external_url, additional_images } = validation.data;
        const safeTitle = sanitize(title);
        const safeContent = sanitize(content, false); // Allow basic HTML (rich text) if intended, or true for strict

        // Authentication check
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabaseAdmin = getSupabaseAdmin();
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || (profile.role !== 'admin' && profile.role !== 'sys-admin')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Create announcement
        const { data: announcement, error } = await supabaseAdmin
            .from('announcements')
            .insert({
                title: safeTitle,
                content: safeContent,
                type,
                published: published || false,
                event_date: event_date || null,
                image_url: image_url || null,
                external_url: external_url || null,
                additional_images: additional_images || [],
                created_by: user.id
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating announcement:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // AUDIT LOGGING
        await logAdminAction(user.id, 'ANNOUNCEMENT_CREATED', 'announcement', announcement.id, { title: safeTitle });

        return NextResponse.json(announcement);
    } catch (e: any) {
        console.error('Announcements POST Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 });
        }

        // 1. Validate Input
        const validation = validateInput(announcementSchema, body);
        if (!validation.success) {
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        // 2. Sanitize Input
        const { title, content, type, published, event_date, image_url, external_url, additional_images } = validation.data;
        const safeTitle = sanitize(title);
        const safeContent = sanitize(content, false);

        // Authentication check
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabaseAdmin = getSupabaseAdmin();
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || (profile.role !== 'admin' && profile.role !== 'sys-admin')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Update announcement
        const { data: announcement, error } = await supabaseAdmin
            .from('announcements')
            .update({
                title: safeTitle,
                content: safeContent,
                type,
                published,
                event_date: event_date || null,
                image_url: image_url || null,
                external_url: external_url || null,
                additional_images: additional_images || [],
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating announcement:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // AUDIT LOGGING
        await logAdminAction(user.id, 'ANNOUNCEMENT_UPDATED', 'announcement', id, { title: safeTitle });

        return NextResponse.json(announcement);
    } catch (e: any) {
        console.error('Announcements PUT Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 });
        }

        // Authentication check
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabaseAdmin = getSupabaseAdmin();
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || (profile.role !== 'admin' && profile.role !== 'sys-admin')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Delete announcement
        const { error } = await supabaseAdmin
            .from('announcements')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting announcement:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // AUDIT LOGGING
        await logAdminAction(user.id, 'ANNOUNCEMENT_DELETED', 'announcement', id);

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error('Announcements DELETE Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
