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

        // 2. Process Slots (Split into Availability and Sessions)
        if (slots && slots.length > 0) {
            const availabilityToUpsert: any[] = [];
            const sessionsToInsert: any[] = [];

            // Helper to get Coach Name
            const { data: coachProfile } = await supabaseAdmin.from('profiles').select('first_name, last_name, avatar_url').eq('id', coachId).single();
            const coachName = coachProfile ? `${coachProfile.first_name} ${coachProfile.last_name}` : 'Coach';

            // Cache for session types
            const sessionTypeCache: Record<string, any> = {};

            for (const slot of slots) {
                if (slot.session_type_id) {
                    // It's a SESSION
                    if (!sessionTypeCache[slot.session_type_id]) {
                        const { data: typeData } = await supabaseAdmin.from('session_types').select('*').eq('id', slot.session_type_id).single();
                        sessionTypeCache[slot.session_type_id] = typeData;
                    }
                    const serviceType = sessionTypeCache[slot.session_type_id];

                    sessionsToInsert.push({
                        title: serviceType?.title || 'Private Session',
                        category: serviceType?.category || 'PRIVATE',
                        instructor: coachName,
                        start_time: slot.start_time,
                        end_time: slot.end_time,
                        image_url: serviceType?.image_url,
                        coach_image_url: coachProfile?.avatar_url,
                        description: `Booked via Coach Availability`,
                        credit_cost: slot.credit_cost || 10,
                        // Note: capacity isn't in sessions schema yet? Assuming default logic or it's implicitly 1 for now if PRIVATE.
                        // If it's a CLASS, we might need a capacity column upgrade, but for now we follow schema.
                    });

                } else {
                    // It's AVAILABILITY
                    availabilityToUpsert.push({
                        ...slot,
                        coach_id: coachId,
                        status: 'available'
                    });
                }
            }

            // Insert Sessions
            if (sessionsToInsert.length > 0) {
                const { error: sessionError } = await supabaseAdmin.from('sessions').insert(sessionsToInsert);
                if (sessionError) throw sessionError;
            }

            // Upsert Availability
            if (availabilityToUpsert.length > 0) {
                const { error: upsertError } = await supabaseAdmin.from('availability').upsert(availabilityToUpsert);
                if (upsertError) throw upsertError;
            }
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error saving availability:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
