// app/api/admin/sessions/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, id, sessionData } = body;

        const supabaseAdmin = getSupabaseAdmin();

        if (action === 'CREATE') {
            const { data, error } = await supabaseAdmin
                .from('sessions')
                .insert([sessionData])
                .select();

            if (error) throw error;
            return NextResponse.json({ success: true, data });
        }

        if (action === 'UPDATE') {
            if (!id) return NextResponse.json({ error: 'ID is required for update' }, { status: 400 });
            const { data, error } = await supabaseAdmin
                .from('sessions')
                .update(sessionData)
                .eq('id', id)
                .select();

            if (error) throw error;
            return NextResponse.json({ success: true, data });
        }

        if (action === 'DELETE') {
            if (!id) return NextResponse.json({ error: 'ID is required for delete' }, { status: 400 });
            const { error } = await supabaseAdmin
                .from('sessions')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('Sessions API error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
