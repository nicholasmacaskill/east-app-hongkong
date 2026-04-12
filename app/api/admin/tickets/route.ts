import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { sendWhatsAppNotification } from '@/app/lib/whatsapp';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
            .from('engineering_tickets')
            .select(`
                *,
                reporter:profiles!reporter_id(first_name, last_name, avatar_url)
            `)
            .order('updated_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[TICKETS_GET]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    console.log('[TICKETS_POST] Request received');
    try {
        const formData = await req.formData();
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const priority = formData.get('priority') as string;
        const reporter_id = formData.get('reporter_id') as string;
        const screenshot = formData.get('screenshot') as File | null;

        console.log('[TICKETS_POST] Data:', { title, reporter_id, hasScreenshot: !!screenshot });

        if (!title || !reporter_id) {
            console.error('[TICKETS_POST] Missing required fields');
            return NextResponse.json({ error: 'Title and Reporter ID are required' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();
        let screenshot_url = null;

        // Upload screenshot if provided
        if (screenshot && screenshot.size > 0) {
            console.log('[TICKETS_POST] Uploading screenshot:', screenshot.name);
            const fileExt = screenshot.name.split('.').pop();
            const fileName = `screenshots/${reporter_id}/${Date.now()}.${fileExt}`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('ticket-attachments')
                .upload(fileName, screenshot, {
                    contentType: screenshot.type,
                    upsert: false
                });

            if (uploadError) {
                console.error('[TICKETS_POST] Storage upload error:', uploadError);
                throw new Error(`Failed to upload screenshot: ${uploadError.message}`);
            }

            // Get public URL
            const { data: publicUrlData } = supabase.storage
                .from('ticket-attachments')
                .getPublicUrl(fileName);
            
            screenshot_url = publicUrlData.publicUrl;
            console.log('[TICKETS_POST] Screenshot URL:', screenshot_url);
        }

        console.log('[TICKETS_POST] Inserting into database...');
        const { data, error } = await supabase
            .from('engineering_tickets')
            .insert({
                title,
                description,
                priority: priority || 'medium',
                category: 'bug',
                reporter_id,
                status: 'open',
                screenshot_url
            })
            .select()
            .single();

        if (error) {
            console.error('[TICKETS_POST] Database insert error:', error);
            throw error;
        }

        console.log('[TICKETS_POST] Success:', data.id);

        // Async trigger notification - don't block the response
        const reporterName = formData.get('reporter_name') as string || 'Engineering Agent';
        sendWhatsAppNotification({
            id: data.id,
            title: data.title,
            priority: data.priority,
            reporter_name: reporterName
        }).catch(err => console.error('[WHATSAPP_NOTIFY_ASYNC_ERROR]', err));

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[TICKETS_POST] Final catch error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
            .from('engineering_tickets')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[TICKETS_PATCH]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();
        const { error } = await supabase
            .from('engineering_tickets')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[TICKETS_DELETE]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
