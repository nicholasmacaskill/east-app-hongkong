// app/api/admin/sessions/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, id, sessionData } = body;

        const supabaseAdmin = getSupabaseAdmin();

        if (action === 'CREATE') {
            const inputs = Array.isArray(sessionData) ? sessionData : [sessionData];

            // Map strictly to schema columns to avoid 'column does not exist' errors
            const recordsToInsert = inputs.map((s: any) => ({
                title: s.title,
                description: s.description,
                image_url: s.image_url,
                start_time: s.start_time,
                end_time: s.end_time,
                category: s.category,
                instructor: s.instructor,
                max_capacity: s.max_capacity,
                credit_cost: s.credit_cost,
                coach_image_url: s.coach_image_url,
                // Include facility_id if needed, but ensure column exists.
                // total_facility_bays is NOT a column in schema usually.
                session_type_id: s.session_type_id || null
            }));

            const { data, error } = await supabaseAdmin
                .from('sessions')
                .insert(recordsToInsert)
                .select();

            if (error) throw error;
            return NextResponse.json({ success: true, count: data.length, data });
        }

        if (action === 'EDIT' || action === 'UPDATE') {
            if (!id) return NextResponse.json({ error: 'ID is required for update' }, { status: 400 });
            const { data, error } = await supabaseAdmin
                .from('sessions')
                .update({
                    title: sessionData.title,
                    description: sessionData.description,
                    image_url: sessionData.image_url,
                    start_time: sessionData.start_time,
                    end_time: sessionData.end_time,
                    category: sessionData.category,
                    instructor: sessionData.instructor,
                    max_capacity: sessionData.max_capacity,
                    credit_cost: sessionData.credit_cost,
                    coach_image_url: sessionData.coach_image_url
                })
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
