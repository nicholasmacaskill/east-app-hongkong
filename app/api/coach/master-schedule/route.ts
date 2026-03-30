import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { formatHK } from '@/app/lib/dateUtils';
import { fromZonedTime } from 'date-fns-tz';

export const dynamic = 'force-dynamic';



export async function GET(request: Request) {
    try {
        // 1. AUTHENTICATION & AUTHORIZATION
        // We must verify the person asking is a Coach or Admin.
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

        // Check Role
        const supabaseAdmin = getSupabaseAdmin();
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role, first_name, last_name')
            .eq('id', user.id)
            .single();

        if (!profile || (profile.role !== 'coach' && profile.role !== 'admin' && profile.role !== 'sys-admin')) {
            return NextResponse.json({ error: 'Forbidden: Coaches only.' }, { status: 403 });
        }

        // 2. FETCH DATA (Today & Next 60 Days)
        // Interpret "Today" relative to Hong Kong time
        const todayStr = formatHK(new Date(), 'yyyy-MM-dd');
        const startOfToday = fromZonedTime(`${todayStr} 00:00:00`, 'Asia/Hong_Kong');
        const endOfRange = new Date(startOfToday.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days

        const startTimeFilter = startOfToday.toISOString();
        const endTimeFilter = endOfRange.toISOString();

        // 2A. Fetch Sessions (including facility bookings)
        const { data: sessions, error: sessionError } = await supabaseAdmin
            .from('sessions')
            .select(`
                *,
                registrations (
                    user_id,
                    status,
                    profiles:user_id ( first_name, last_name, role )
                )
            `)
            .gte('start_time', startTimeFilter)
            .lte('start_time', endTimeFilter)
            .order('start_time', { ascending: true })
            .limit(10000); // 10k safety limit

        if (sessionError) {
            console.error('Master Schedule Error (Sessions):', sessionError);
            return NextResponse.json({ error: (sessionError as any).message }, { status: 500 });
        }

        // 2B. Fetch Coach Availability (Open Slots)
        const { data: availability, error: availError } = await supabaseAdmin
            .from('availability')
            .select(`
                *,
                profiles:coach_id ( first_name, last_name, avatar_url )
            `)
            .gte('start_time', startTimeFilter)
            .lte('start_time', endTimeFilter)
            .eq('status', 'available')
            .not('coach_id', 'is', null) // Only coach availability
            .order('start_time', { ascending: true })
            .limit(2000);

        if (availError) {
            console.error('Master Schedule Error (Availability):', availError);
            // Non-critical, can continue with just sessions if needed
        }

        // 2C. Fetch Facility Availability (Open Facility Slots)
        const { data: facilityAvailability, error: facilityAvailError } = await supabaseAdmin
            .from('availability')
            .select('*')
            .gte('start_time', startTimeFilter)
            .lte('start_time', endTimeFilter)
            .eq('status', 'available')
            .not('facility_category', 'is', null) // Only facility availability
            .order('start_time', { ascending: true })
            .limit(1000);

        if (facilityAvailError) {
            console.error('Master Schedule Error (Facility Availability):', facilityAvailError);
        }

        // 3. TRANSFORM & MERGE DATA
        // Separate regular sessions from facility bookings
        const regularSessions = (sessions || []).filter((s: any) => !s.total_facility_bays || s.total_facility_bays === 0);
        const facilityBookings = (sessions || []).filter((s: any) => s.total_facility_bays && s.total_facility_bays > 0);

        // Format regular sessions (Priority 1: Booked sessions)
        const formattedSessions: any[] = regularSessions.map((s: any) => ({
            id: s.id,
            type: 'session',
            title: s.title,
            category: s.category,
            instructor: s.instructor,
            start_time: s.start_time,
            end_time: s.end_time,
            image_url: s.image_url,
            coach_image_url: s.coach_image_url,
            credit_cost: s.credit_cost,
            max_capacity: s.max_capacity,
            status: s.status,
            attendees: (s.registrations || [])
                .map((r: any) => ({
                    id: r.user_id,
                    name: r.profiles ? `${r.profiles.first_name} ${r.profiles.last_name || ''}`.trim() : 'Unknown User',
                    role: r.profiles?.role || 'player',
                    status: r.status
                })),
            priority: (s.registrations || []).filter((r: any) => r.status !== 'cancelled').length > 0 ? 1 : 2
        }));

        // Format coach availability (Priority 2: Coach slots)
        const formattedAvailability: any[] = (availability || []).map((a: any) => ({
            id: a.id,
            type: 'slot',
            title: 'Open Slot',
            category: 'PRIVATE',
            instructor: a.profiles ? `${a.profiles.first_name} ${a.profiles.last_name || ''}`.trim() : 'Unknown Coach',
            start_time: a.start_time,
            end_time: a.end_time,
            image_url: null,
            coach_image_url: a.profiles?.avatar_url,
            coach_id: a.coach_id,
            status: a.status,
            attendees: [],
            priority: 3 // Coach availability
        }));

        // Format facility bookings (Priority 3: Facility sessions)
        const formattedFacilityBookings: any[] = facilityBookings.map((s: any) => ({
            id: s.id,
            type: 'session',
            title: s.total_facility_bays > 1 ? `${s.title} (${s.total_facility_bays} Bays)` : s.title,
            category: 'FACILITY',
            instructor: s.instructor || 'Facility Staff',
            start_time: s.start_time,
            end_time: s.end_time,
            image_url: s.image_url,
            coach_image_url: null,
            credit_cost: s.credit_cost,
            max_capacity: s.max_capacity,
            status: s.status,
            attendees: (s.registrations || [])
                .map((r: any) => ({
                    id: r.user_id,
                    name: r.profiles ? `${r.profiles.first_name} ${r.profiles.last_name || ''}`.trim() : 'Unknown User',
                    role: r.profiles?.role || 'player',
                    status: r.status
                })),
            total_facility_bays: s.total_facility_bays,
            priority: (s.registrations || []).filter((r: any) => r.status !== 'cancelled').length > 0 ? 1 : 4
        }));

        // Format facility availability (Priority 3: Facility slots)
        const formattedFacilityAvailability: any[] = (facilityAvailability || []).map((a: any) => ({
            id: a.id,
            type: 'slot',
            title: `${a.facility_category || 'Facility'} - Available`,
            category: 'FACILITY',
            instructor: 'Facility',
            start_time: a.start_time,
            end_time: a.end_time,
            image_url: null,
            coach_image_url: null,
            status: a.status,
            attendees: [],
            priority: 4, // Facility availability
            facility_category: a.facility_category
        }));

        // Combine all data sources and sort by priority, then time
        const now = new Date();
        const masterSchedule = [
            ...formattedSessions,
            ...formattedAvailability,
            ...formattedFacilityBookings,
            ...formattedFacilityAvailability
        ].filter(item => {
            // TICKET #12: Remove old service calendar entries that were not used
            if (item.type === 'session') {
                const isPast = new Date(item.end_time) < now;
                const hasNoAttendees = !item.attendees || item.attendees.length === 0;
                if (isPast && hasNoAttendees) return false;
            }
            return true;
        }).sort((a, b) => {
            // Primary sort: Priority (1 = booked sessions, 2 = coach slots, 3 = facility)
            if (a.priority !== b.priority) {
                return a.priority - b.priority;
            }
            // Secondary sort: Time (chronological within each priority)
            return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
        });

        // Remove priority field before returning (internal use only)
        const cleanedSchedule = masterSchedule.map(({ priority, ...item }) => item);

        return NextResponse.json(cleanedSchedule);

    } catch (e: any) {
        console.error('Master Schedule Server Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
