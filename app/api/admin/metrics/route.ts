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
            .select('id, tier, membership_tier, subscription_status, created_at, account_status');

        if (profilesError) throw profilesError;
        console.log(`Fetched ${profiles.length} profiles`);

        // Fetch Registrations with Sessions
        const { data: registrations, error: registrationsError } = await supabaseAdmin
            .from('registrations')
            .select(`
                id,
                user_id,
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
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

        const activeProfiles = profiles.filter(p => ['active', 'trialing'].includes(p.subscription_status || ''));
        const totalSubscribers = activeProfiles.length;
        const totalChurned = profiles.filter(p => ['cancelled', 'canceled', 'past_due', 'unpaid', 'overdue'].includes(p.subscription_status || '')).length;
        const retentionRate = (totalSubscribers + totalChurned) > 0 ? (totalSubscribers / (totalSubscribers + totalChurned)) * 100 : 100;

        let monthlySubs = 0;
        let yearlySubs = 0;
        let estimatedMRR = 0;

        activeProfiles.forEach(p => {
            const tier = (p.membership_tier || p.tier || '').toLowerCase();
            const isYearly = tier.includes('yearly') || tier.includes('annual');

            // Pricing Logic based on membership tiers
            let monthlyPrice = 0;
            if (tier.includes('family-3')) monthlyPrice = 5500;
            else if (tier.includes('family-2')) monthlyPrice = 4000;
            else if (tier.includes('family-1') || tier.includes('pro') || tier.includes('individual')) monthlyPrice = 2000;
            else monthlyPrice = 2000; // Default pro

            if (isYearly) {
                yearlySubs++;
                estimatedMRR += (monthlyPrice); // MRR is monthly equivalent
            } else {
                monthlySubs++;
                estimatedMRR += monthlyPrice;
            }
        });

        const subscriberMetrics = {
            total: totalSubscribers,
            churned: totalChurned,
            retentionRate: retentionRate,
            yearly: yearlySubs,
            monthly: monthlySubs,
            estimatedMRR: estimatedMRR,
            estimatedARR: estimatedMRR * 12
        };

        // 2. Bookings Metrics
        const registrationsList = (registrations || []).filter(r => r && r.sessions);
        const bookingsList = registrationsList.map(r => {
            const s = r.sessions as any;
            return {
                id: r.id,
                userId: r.user_id,
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

        // 3. Health & SaaS Metrics
        const recentRegistrations = bookingsList.filter(b => b.registeredAt >= thirtyDaysAgo);
        const mau = new Set(recentRegistrations.map(r => r.userId || 'unknown')).size;

        // Sleeper Subscribers: Active subscribers with no bookings in last 30 days
        const recentUserIds = new Set(recentRegistrations.map(r => r.userId));
        const sleepers = activeProfiles.filter(p => !recentUserIds.has(p.id)).length;

        // Credit Velocity: Avg credits spent per week
        const last7DaysCredits = bookingsList.filter(b => b.registeredAt >= sevenDaysAgo).reduce((sum, b) => sum + b.creditCost, 0);
        const creditVelocity = last7DaysCredits; // Total velocity for the platform

        // Utilization: Booked sessions vs Total sessions (assume avg capacity 10 if not specified)
        const totalSessionSlots = sessionsData.length * 10;
        const utilizationRate = totalSessionSlots > 0 ? (totalBookings / totalSessionSlots) * 100 : 0;

        // Conversion Rate: Active Subscribers / Total Users
        const conversionRate = profiles.length > 0 ? (totalSubscribers / profiles.length) * 100 : 0;

        // Growth Metrics (MoM)
        const firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const currentMonthNewSubs = activeProfiles.filter(p => p.created_at && new Date(p.created_at) >= firstDayOfCurrentMonth).length;
        const lastMonthSubsCount = totalSubscribers - currentMonthNewSubs; // Simple approximation
        const momGrowth = lastMonthSubsCount > 0 ? (currentMonthNewSubs / lastMonthSubsCount) * 100 : 100;

        // Velocity & Momentum Calculations for Glass Pivot
        // Kinetic Velocity: Credit Throughput in last 48h vs previous 48h
        const fortyEightHoursAgo = new Date(now.getTime() - (48 * 60 * 60 * 1000));
        const ninetySixHoursAgo = new Date(now.getTime() - (96 * 60 * 60 * 1000));

        const throughputCurrent = bookingsList.filter(b => b.registeredAt >= fortyEightHoursAgo).reduce((sum, b) => sum + b.creditCost, 0);
        const throughputPrevious = bookingsList.filter(b => b.registeredAt >= ninetySixHoursAgo && b.registeredAt < fortyEightHoursAgo).reduce((sum, b) => sum + b.creditCost, 0);
        const kineticVelocity = throughputPrevious > 0 ? ((throughputCurrent - throughputPrevious) / throughputPrevious) * 100 : 0;

        // Resonance Momentum: New subscribers vs previous period
        const resonanceMomentum = momGrowth > 0 ? 'cyan' : 'magenta';
        const kineticMomentum = kineticVelocity > 0 ? 'cyan' : 'magenta';
        const frictionMomentum = sleepers > (totalSubscribers * 0.1) ? 'magenta' : 'none';

        // Telemetry Stream: Latest 5 events
        const telemetry = [
            ...bookingsList.slice(-3).map(b => `[booking_manifested] :: ${b.category.toLowerCase()} :: ${b.title.toLowerCase()} :: ${b.registeredAt.toLocaleTimeString()}`),
            ...cancellationsList.slice(-2).map(c => `[session_voided] :: ${c.id.substring(0, 8)} :: ${new Date(c.created_at || '').toLocaleTimeString()}`)
        ].sort().reverse();

        return NextResponse.json({
            subscribers: {
                ...subscriberMetrics,
                momentum: resonanceMomentum,
                velocity: momGrowth
            },
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
                momentum: kineticMomentum,
                velocity: kineticVelocity
            },
            cancellations: {
                total: totalCancellations,
                timeline: cancelTimelineData
            },
            health: {
                mau: mau,
                sleepers: sleepers,
                creditVelocity: creditVelocity,
                utilizationRate: utilizationRate,
                conversionRate: conversionRate,
                momGrowth: momGrowth,
                momentum: frictionMomentum
            },
            telemetry: telemetry
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
