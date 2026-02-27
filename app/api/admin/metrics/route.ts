import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
            },
        });

        const { data: { session }, error: authError } = await supabase.auth.getSession();

        if (authError || !session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabaseAdmin = getSupabaseAdmin();
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

        if (!profile || profile.role !== 'sys-admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch Subscribers
        const { data: profiles, error: profilesError } = await supabaseAdmin
            .from('profiles')
            .select('id, tier, subscription_status, created_at, account_status');

        if (profilesError) throw profilesError;

        // Fetch Registrations with Sessions
        const { data: registrations, error: registrationsError } = await supabaseAdmin
            .from('registrations')
            .select(`
                id,
                registered_at,
                sessions (
                    id,
                    title,
                    category,
                    instructor,
                    start_time,
                    credit_cost
                )
            `);

        if (registrationsError) throw registrationsError;

        // Fetch Cancellations
        const { data: cancellations, error: cancellationsError } = await supabaseAdmin
            .from('booking_cancellations')
            .select(`
                id,
                created_at,
                refunded_credits,
                sessions (
                    id,
                    title,
                    category,
                    instructor,
                    credit_cost
                )
            `);

        if (cancellationsError) throw cancellationsError;

        // Fetch all sessions (so we can get total sessions by coach/category)
        const { data: sessionsData, error: sessionsError } = await supabaseAdmin
            .from('sessions')
            .select('id, category, instructor, start_time, credit_cost');

        if (sessionsError) throw sessionsError;

        // --- Aggregation logic ---

        // 1. Subscribers Metrics
        const totalSubscribers = profiles.filter(p => ['active', 'trialing'].includes(p.subscription_status || '')).length;
        const totalChurned = profiles.filter(p => ['cancelled', 'canceled', 'past_due', 'unpaid'].includes(p.subscription_status || '')).length;
        const retentionRate = profiles.length > 0 ? (totalSubscribers / (totalSubscribers + totalChurned)) * 100 : 0;

        let yearlySubs = 0;
        let monthlySubs = 0;
        profiles.forEach(p => {
            if (['active', 'trialing'].includes(p.subscription_status || '')) {
                if ((p.tier || '').toLowerCase().includes('yearly') || (p.tier || '').toLowerCase().includes('annual')) {
                    yearlySubs++;
                } else {
                    monthlySubs++; // default to monthly for anything else
                }
            }
        });

        const subscriberMetrics = {
            total: totalSubscribers,
            churned: totalChurned,
            retentionRate: retentionRate,
            yearly: yearlySubs,
            monthly: monthlySubs,
        };

        // 2. Bookings Metrics
        const bookingsList = registrations
            .filter(r => r.sessions)
            .map(r => ({
                id: r.id,
                registeredAt: new Date(r.registered_at),
                sessionDate: new Date((r.sessions as any).start_time),
                category: (r.sessions as any).category || 'General',
                instructor: (r.sessions as any).instructor || 'Unknown',
                creditCost: (r.sessions as any).credit_cost || 0,
            }));

        const totalBookings = bookingsList.length;
        const totalCreditsSpent = bookingsList.reduce((sum, b) => sum + b.creditCost, 0);

        // Group by category (facility)
        const bookingsByCategory = bookingsList.reduce((acc, b) => {
            acc[b.category] = (acc[b.category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Group by coach
        const bookingsByCoach = bookingsList.reduce((acc, b) => {
            acc[b.instructor] = (acc[b.instructor] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Time distribution (peak times by hour)
        const peakTimesByHour = bookingsList.reduce((acc, b) => {
            const hour = b.sessionDate.getHours();
            acc[hour] = (acc[hour] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);

        // 3. Activity Timeline (Monthly bookings for charting)
        const bookingsTimeline = bookingsList.reduce((acc, b) => {
            const monthYear = `${b.registeredAt.getFullYear()}-${String(b.registeredAt.getMonth() + 1).padStart(2, '0')}`;
            if (!acc[monthYear]) acc[monthYear] = { bookings: 0, revenue: 0 };
            acc[monthYear].bookings += 1;
            acc[monthYear].revenue += b.creditCost;
            return acc;
        }, {} as Record<string, { bookings: number, revenue: number }>);

        // Map timeline for charting
        const timelineData = Object.keys(bookingsTimeline).sort().map(key => ({
            period: key,
            bookings: bookingsTimeline[key].bookings,
            spentCredits: bookingsTimeline[key].revenue
        }));

        // 4. Cancellations
        const totalCancellations = cancellations.length;

        const cancellationsTimeline = cancellations.reduce((acc, c) => {
            const d = new Date(c.created_at);
            const monthYear = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            acc[monthYear] = (acc[monthYear] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const cancelTimelineData = Object.keys(cancellationsTimeline).sort().map(key => ({
            period: key,
            cancellations: cancellationsTimeline[key]
        }));

        return NextResponse.json({
            subscribers: subscriberMetrics,
            bookings: {
                total: totalBookings,
                totalCreditsSpent: totalCreditsSpent,
                byCategory: bookingsByCategory,
                byCoach: bookingsByCoach,
                peakTimes: peakTimesByHour,
                timeline: timelineData,
            },
            cancellations: {
                total: totalCancellations,
                timeline: cancelTimelineData
            }
        });

    } catch (error: any) {
        console.error('Metrics API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch metrics', details: error.message }, { status: 500 });
    }
}
