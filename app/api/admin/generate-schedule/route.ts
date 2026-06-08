
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { fromZonedTime } from 'date-fns-tz';
import { APP_TIMEZONE, formatHK } from '@/app/lib/dateUtils';

export async function POST(request: Request) {
    try {
        const {
            serviceId,
            startDate,
            endDate,
            startHour,
            endHour,
            startTime,
            endTime,
            daysOfWeek,
            durationMinutes = 60,
            coachId,
            appendMode = false
        } = await request.json();

        if (!serviceId || !startDate || !endDate) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabaseAdmin = getSupabaseAdmin();

        // 1. Fetch Service Details
        const { data: service, error: svcError } = await supabaseAdmin
            .from('session_types')
            .select('*')
            .eq('id', serviceId)
            .single();

        if (svcError || !service) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 });
        }

        // 2. Fetch Coach Details if coachId is provided
        let coachName = 'Facility';
        let coachImageUrl = null;
        if (coachId) {
            const { data: coachProfile } = await supabaseAdmin
                .from('profiles')
                .select('first_name, last_name, avatar_url')
                .eq('id', coachId)
                .single();
            if (coachProfile) {
                coachName = `${coachProfile.first_name} ${coachProfile.last_name}`;
                coachImageUrl = coachProfile.avatar_url;
            }
        } else if (service.category !== 'FACILITY') {
            // Default instructor for non-facility services if no coach selected
            coachName = 'Staff';
        }

        const sessionsToInsert: any[] = [];

        // Interpret input dates as HK time start/end of day
        const start = fromZonedTime(`${startDate} 00:00:00`, APP_TIMEZONE);
        const end = fromZonedTime(`${endDate} 23:59:59`, APP_TIMEZONE);

        // Iterate days
        const currentDate = new Date(start);
        while (currentDate <= end) {
            // Get current HK date info
            const hkDateStr = formatHK(currentDate, 'yyyy-MM-dd');
            const currentHKDay = (parseInt(formatHK(currentDate, 'i')) % 7); // Mon=1...Sat=6, Sun=0

            // Check day of week
            if (daysOfWeek && !daysOfWeek.includes(currentHKDay)) {
                currentDate.setDate(currentDate.getDate() + 1);
                continue;
            }

            // Iterate intervals based on durationMinutes
            let startT = startTime || (String(startHour).includes(':') ? startHour : `${String(startHour).padStart(2, '0')}:00`);
            let endT = endTime || (String(endHour).includes(':') ? endHour : `${String(endHour).padStart(2, '0')}:00`);

            // Ensure leading zero if HH:mm format is used with single digit hour (e.g. "7:30" -> "07:30")
            if (String(startT).length === 4 && String(startT).includes(':')) startT = '0' + startT;
            if (String(endT).length === 4 && String(endT).includes(':')) endT = '0' + endT;

            const dayStartStr = `${hkDateStr} ${startT}:00`;
            const dayEndStr = `${hkDateStr} ${endT}:00`;

            let slotStart = fromZonedTime(dayStartStr, APP_TIMEZONE);
            const dayEnd = fromZonedTime(dayEndStr, APP_TIMEZONE);

            while (slotStart.getTime() < dayEnd.getTime()) {
                const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);

                // Prevent creating sessions that overflow past the intended end hour
                if (slotEnd.getTime() > dayEnd.getTime()) {
                    break;
                }

                // Construct Session
                sessionsToInsert.push({
                    title: service.title,
                    category: service.category,
                    description: service.description,
                    image_url: service.image_url,
                    coach_image_url: coachImageUrl,
                    start_time: slotStart.toISOString(),
                    end_time: slotEnd.toISOString(),
                    max_capacity: service.default_capacity || (service.category === 'CLASS' ? 10 : 1),
                    credit_cost: service.credit_cost,
                    instructor: coachName,
                    session_type_id: service.id,
                    status: 'active'
                });

                slotStart = slotEnd;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // 2. Wipe & Replace vs Append Strategy
        const wipeStart = fromZonedTime(`${startDate} 00:00:00`, APP_TIMEZONE);
        const wipeEnd = fromZonedTime(`${endDate} 23:59:59`, APP_TIMEZONE);

        if (!appendMode) {
            // Original behaviour: delete all unbooked slots in range, then re-insert
            // Only delete sessions with no bookings to protect booked slots
            const { data: bookedSessions } = await supabaseAdmin
                .from('bookings')
                .select('session_id')
                .not('session_id', 'is', null);

            const bookedIds = new Set((bookedSessions || []).map((b: any) => b.session_id));

            const { data: existingInRange } = await supabaseAdmin
                .from('sessions')
                .select('id')
                .eq('session_type_id', serviceId)
                .gte('start_time', wipeStart.toISOString())
                .lte('start_time', wipeEnd.toISOString());

            const toDelete = (existingInRange || [])
                .filter((s: any) => !bookedIds.has(s.id))
                .map((s: any) => s.id);

            if (toDelete.length > 0) {
                const { error: deleteError } = await supabaseAdmin
                    .from('sessions')
                    .delete()
                    .in('id', toDelete);

                if (deleteError) {
                    console.error("Wipe error:", deleteError);
                    return NextResponse.json({ error: 'Failed to clear existing schedule: ' + deleteError.message }, { status: 500 });
                }
            }
        } else {
            // Append mode: fetch existing slots in range and skip duplicates
            const { data: existingSlots } = await supabaseAdmin
                .from('sessions')
                .select('start_time')
                .eq('session_type_id', serviceId)
                .gte('start_time', wipeStart.toISOString())
                .lte('start_time', wipeEnd.toISOString());

            const existingStartTimes = new Set(
                (existingSlots || []).map((s: any) => new Date(s.start_time).toISOString())
            );

            // Filter out sessions that already exist
            const deduped = sessionsToInsert.filter(
                s => !existingStartTimes.has(new Date(s.start_time).toISOString())
            );

            if (deduped.length === 0) {
                return NextResponse.json({ success: true, count: 0, message: "No new slots to add — all selected times already exist." });
            }

            // Replace sessionsToInsert with deduplicated list
            sessionsToInsert.length = 0;
            deduped.forEach(s => sessionsToInsert.push(s));
        }

        if (sessionsToInsert.length === 0) {
            return NextResponse.json({ success: true, count: 0, message: "No slots matched your criteria. Existing slots cleared." });
        }

        // 3. Batch Insert
        const chunkSize = 100;
        for (let i = 0; i < sessionsToInsert.length; i += chunkSize) {
            const chunk = sessionsToInsert.slice(i, i + chunkSize);
            const { error } = await supabaseAdmin.from('sessions').insert(chunk);
            if (error) {
                console.error("Batch insert error:", error);
                throw error;
            }
        }

        return NextResponse.json({
            success: true,
            count: sessionsToInsert.length,
            message: `Generated ${sessionsToInsert.length} sessions.`
        });

    } catch (e: any) {
        console.error('Generate Schedule Error:', e);
        return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
    }
}
