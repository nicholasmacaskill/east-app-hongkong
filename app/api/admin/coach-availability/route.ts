import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const coachId = searchParams.get('coachId');

    if (!coachId) {
        return NextResponse.json({ success: false, error: 'Coach ID is required' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    try {
        const { data, error } = await supabaseAdmin
            .from('availability')
            .select('*')
            .eq('coach_id', coachId);

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { coachId, slots, deletedSlots } = body;

        if (!coachId) {
            return NextResponse.json({ success: false, error: 'Coach ID is required' }, { status: 400 });
        }

        const supabaseAdmin = getSupabaseAdmin();

        // 1. Delete removed slots
        if (deletedSlots && deletedSlots.length > 0) {
            const { error: deleteError } = await supabaseAdmin
                .from('availability')
                .delete()
                .in('id', deletedSlots);

            if (deleteError) throw deleteError;
        }

        // 2. Upsert new/modified slots
        if (slots && slots.length > 0) {
            // Ensure all slots have coach_id
            const formattedSlots = slots.map((slot: any) => ({
                ...slot,
                coach_id: coachId,
                status: 'available' // Default
            }));

            const { error: upsertError } = await supabaseAdmin
                .from('availability')
                .upsert(formattedSlots);

            if (upsertError) throw upsertError;
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error saving availability:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
