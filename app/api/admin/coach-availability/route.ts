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
        // 1. Fetch Availability Records
        const { data: availabilityData, error: availError } = await supabaseAdmin
            .from('availability')
            .select('*')
            .eq('coach_id', coachId);

        if (availError) throw availError;

        // 2. Fetch Sessions (via Instructor Name match)
        // Note: Legacy schema relies on name string, not foreign key.
        const { data: profile } = await supabaseAdmin.from('profiles').select('first_name, last_name').eq('id', coachId).single();
        const coachName = profile ? `${profile.first_name} ${profile.last_name}` : '';

        let sessionData: any[] = [];
        if (coachName) {
            const { data: sessions, error: sessionError } = await supabaseAdmin
                .from('sessions')
                .select('*')
                .eq('instructor', coachName);

            if (!sessionError && sessions) {
                sessionData = sessions;
            }
        }

        // 3. Merge and Normalize
        const normalizedSlots = [
            ...(availabilityData || []).map(a => ({
                id: a.id,
                coach_id: a.coach_id,
                start_time: a.start_time,
                end_time: a.end_time,
                is_recurring: a.is_recurring,
                status: a.status
            })),
            ...sessionData.map(s => ({
                id: s.id.toString(), // Ensure string ID for frontend
                coach_id: coachId,
                start_time: s.start_time,
                end_time: s.end_time,
                is_recurring: false,
                status: 'available',
                session_type_id: s.session_type_id,
                credit_cost: s.credit_cost,
                capacity: 1 // Default or from DB if added later
            }))
        ];

        return NextResponse.json({ success: true, data: normalizedSlots });
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
        // Needs careful handling: deletedSlots might contain UUIDs (availability) or numeric Strings (sessions)
        if (deletedSlots && deletedSlots.length > 0) {
            const availIds = deletedSlots.filter((id: string) => id.length > 10 && isNaN(Number(id))); // Rough UUID check
            const sessionIds = deletedSlots.filter((id: string) => !isNaN(Number(id)));

            if (availIds.length > 0) {
                await supabaseAdmin.from('availability').delete().in('id', availIds);
            }
            if (sessionIds.length > 0) {
                await supabaseAdmin.from('sessions').delete().in('id', sessionIds);
            }
        }

        // 2. Process Slots (Only insert NEW ones)
        // We filter for slots without IDs (newly generated bulk slots)
        if (slots && slots.length > 0) {
            const newSlots = slots.filter((s: any) => !s.id);

            const availabilityToInsert: any[] = [];
            const sessionsToInsert: any[] = [];

            // Helper to get Coach Name
            const { data: coachProfile } = await supabaseAdmin.from('profiles').select('first_name, last_name, avatar_url').eq('id', coachId).single();
            const coachName = coachProfile ? `${coachProfile.first_name} ${coachProfile.last_name}` : 'Coach';

            // Cache for session types
            const sessionTypeCache: Record<string, any> = {};

            for (const slot of newSlots) {
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
                        session_type_id: slot.session_type_id,
                        capacity: slot.capacity || 1
                    });

                } else {
                    // It's AVAILABILITY
                    availabilityToInsert.push({
                        coach_id: coachId,
                        start_time: slot.start_time,
                        end_time: slot.end_time,
                        is_recurring: false,
                        status: 'available'
                    });
                }
            }

            // Insert Sessions
            if (sessionsToInsert.length > 0) {
                const { error: sessionError } = await supabaseAdmin.from('sessions').insert(sessionsToInsert);
                if (sessionError) throw sessionError;
            }

            // Insert Availability
            if (availabilityToInsert.length > 0) {
                const { error: insertError } = await supabaseAdmin.from('availability').insert(availabilityToInsert);
                if (insertError) throw insertError;
            }
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error saving availability:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
