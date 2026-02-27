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
        console.log(`Fetched ${profiles.length} profiles`);

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
        console.log(`Fetched ${registrations.length} registrations`);

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
        console.log(`Fetched ${cancellations.length} cancellations`);

        // Fetch all sessions (so we can get total sessions by coach/category)
        const { data: sessionsData, error: sessionsError } = await supabaseAdmin
            .from('sessions')
            .select('id, category, instructor, start_time, credit_cost');

        if (sessionsError) throw sessionsError;

        // --- Aggregation logic ---

        // 1. Subscribers Metrics
        const totalSubscribers = profiles.filter(p => ['active', 'trialing'].includes(p.subscription_status || '')).length;
        const totalChurned = profiles.filter(p => ['cancelled', 'canceled', 'past_due', 'unpaid'].includes(p.subscription_status || '')).length;
        const retentionRate = (totalSubscribers + totalChurned) > 0 ? (totalSubscribers / (totalSubscribers + totalChurned)) * 100 : 100;

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
        const registrationsList = (registrations || []).filter(r => r && r.sessions);
        const bookingsList = registrationsList.map(r => {
            const s = r.sessions as any;
            return {
                id: r.id,
                registeredAt: r.registered_at ? new Date(r.registered_at) : new Date(),
                sessionDate: s.start_time ? new Date(s.start_time) : new Date(),
                title: s.title || 'Untitled',
                category: s.category || 'General',
                instructor: s.instructor || 'Unknown',
                creditCost: Number(s.credit_cost) || 0,
            };
        });

        const totalBookings = bookingsList.length;
        const totalCreditsSpent = bookingsList.reduce((sum, b) => sum + (Number(b.creditCost) || 0), 0);

        // Safe Aggregation Helpers
        const safeGroup = (list: any[], keyFn: (item: any) => string) => {
            return list.reduce((acc, item) => {
                const key = keyFn(item) || 'Unknown';
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
        };

        const safeSum = (list: any[], keyFn: (item: any) => string, valFn: (item: any) => number) => {
            return list.reduce((acc, item) => {
                const key = keyFn(item) || 'Unknown';
                acc[key] = (acc[key] || 0) + (Number(valFn(item)) || 0);
                return acc;
            }, {} as Record<string, number>);
        };

        const bookingsByCategory = safeGroup(bookingsList, b => b.category);
        const bookingsByFacility = safeGroup(bookingsList.filter(b => b.category === 'FACILITY'), b => b.title);
        const bookingsByCoach = safeGroup(bookingsList, b => b.instructor);
        const peakTimesByHour = bookingsList.reduce((acc, b) => {
            const hour = b.sessionDate.getHours();
            acc[hour] = (acc[hour] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);

        const daysLabel = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const peakDays = safeGroup(bookingsList, b => daysLabel[b.sessionDate.getDay()]);

        const getWeekNumber = (date: Date) => {
            try {
                const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
                const dayNum = d.getUTCDay() || 7;
                d.setUTCDate(d.getUTCDate() + 4 - dayNum);
                const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
                return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
            } catch (e) { return 0; }
        };

        const timelineMonthly = bookingsList.reduce((acc, b) => {
            const d = b.registeredAt;
            const monthYear = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (!acc[monthYear]) acc[monthYear] = { bookings: 0, revenue: 0 };
            acc[monthYear].bookings += 1;
            acc[monthYear].revenue += b.creditCost;
            return acc;
        }, {} as Record<string, { bookings: number, revenue: number }>);

        const timelineWeekly = bookingsList.reduce((acc, b) => {
            const week = getWeekNumber(b.registeredAt);
            const year = b.registeredAt.getFullYear();
            const weekKey = `${year}-W${String(week).padStart(2, '0')}`;
            if (!acc[weekKey]) acc[weekKey] = { bookings: 0, revenue: 0 };
            acc[weekKey].bookings += 1;
            acc[weekKey].revenue += b.creditCost;
            return acc;
        }, {} as Record<string, { bookings: number, revenue: number }>);

        const timelineData = Object.keys(timelineMonthly).sort().map(key => ({
            period: key, bookings: timelineMonthly[key].bookings, spentCredits: timelineMonthly[key].revenue
        }));

        const weeklyTimelineData = Object.keys(timelineWeekly).sort().reverse().slice(0, 12).reverse().map(key => ({
            period: key, bookings: timelineWeekly[key].bookings, spentCredits: timelineWeekly[key].revenue
        }));

        const revenueByFacility = safeSum(bookingsList.filter(b => b.category === 'FACILITY'), b => b.title, b => b.creditCost);
        const revenueByCoach = safeSum(bookingsList, b => b.instructor, b => b.creditCost);

        // 4. Cancellations
        const cancellationsList = (cancellations || []).filter(c => c);
        const totalCancellations = cancellationsList.length;
        const cancellationsTimeline = cancellationsList.reduce((acc, c) => {
            if (!c.created_at) return acc;
            const d = new Date(c.created_at);
            const monthYear = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            acc[monthYear] = (acc[monthYear] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const cancelTimelineData = Object.keys(cancellationsTimeline).sort().map(key => ({
            period: key, cancellations: cancellationsTimeline[key]
        }));

        return NextResponse.json({
            subscribers: subscriberMetrics,
            bookings: {
                total: totalBookings,
                totalCreditsSpent: totalCreditsSpent,
                byCategory: bookingsByCategory,
                byFacility: bookingsByFacility,
                byCoach: bookingsByCoach,
                peakTimes: peakTimesByHour,
                peakDays: peakDays,
                timeline: timelineData,
                timelineWeekly: weeklyTimelineData,
                revenueByFacility: revenueByFacility,
                revenueByCoach: revenueByCoach,
            },
            cancellations: {
                total: totalCancellations,
                timeline: cancelTimelineData
            }
        });

    } catch (error: any) {
        console.error('Metrics API Error:', error);
        return NextResponse.json({
            error: 'Failed to fetch metrics',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
