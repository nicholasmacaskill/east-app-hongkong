
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
            daysOfWeek,
            durationMinutes = 60,
            coachId
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
            const dayStartStr = `${hkDateStr} ${String(startHour).padStart(2, '0')}:00:00`;
            const dayEndStr = `${hkDateStr} ${String(endHour).padStart(2, '0')}:00:00`;

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
                    max_capacity: service.category === 'CLASS' ? 10 : 1,
                    credit_cost: service.credit_cost,
                    instructor: coachName,
                    session_type_id: service.id,
                    status: 'active'
                });

                slotStart = slotEnd;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // 2. Wipe & Replace Strategy
        // Delete existing slots for this service in this range before generating
        const wipeStart = fromZonedTime(`${startDate} 00:00:00`, APP_TIMEZONE);
        const wipeEnd = fromZonedTime(`${endDate} 23:59:59`, APP_TIMEZONE);

        const { error: deleteError } = await supabaseAdmin
            .from('sessions')
            .delete()
            .eq('session_type_id', serviceId)
            .gte('start_time', wipeStart.toISOString())
            .lte('start_time', wipeEnd.toISOString());

        if (deleteError) {
            console.error("Wipe error:", deleteError);
            return NextResponse.json({ error: 'Failed to clear existing schedule: ' + deleteError.message }, { status: 500 });
        }

        if (sessionsToInsert.length === 0) {
            return NextResponse.json({ success: true, count: 0, message: "No slots matched your criteria. Existing slots cleared." });
        }

        // 3. Batch Insert
        // Use upsert or ignore conflicts? 
        // Usually simple insert. If you run it twice it might duplicate.
        // For now, simple insert. Admin should be careful or we add check.

        // Chunking just in case
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
