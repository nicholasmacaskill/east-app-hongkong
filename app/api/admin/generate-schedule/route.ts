
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';

export async function POST(request: Request) {
    try {
        const { serviceId, startDate, endDate, startHour, endHour, daysOfWeek, durationMinutes = 60 } = await request.json();

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

        const sessionsToInsert: any[] = [];
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Iterate days
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            // Check day of week (0=Sun, 1=Mon...)
            if (daysOfWeek && !daysOfWeek.includes(d.getDay())) continue;

            // Iterate hours
            for (let h = startHour; h < endHour; h++) {
                const slotStart = new Date(d);
                slotStart.setHours(h, 0, 0, 0);

                const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);

                // Construct Session
                sessionsToInsert.push({
                    title: service.title,
                    category: 'FACILITY', // Only for facilities? Or allow generic classes?
                    description: service.description,
                    image_url: service.image_url,
                    start_time: slotStart.toISOString(),
                    end_time: slotEnd.toISOString(),
                    max_capacity: 1, // Default for facility, maybe 1?
                    credit_cost: 100, // Default or fetch from somewhere?
                    instructor: 'Facility',
                    session_type_id: service.id
                });
            }
        }

        if (sessionsToInsert.length === 0) {
            return NextResponse.json({ success: true, count: 0, message: "No slots matched your criteria." });
        }

        // 2. Batch Insert
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
