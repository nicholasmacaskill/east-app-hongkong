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
            .select('id, tier, membership_tier, subscription_status, created_at, account_status, role, contact_email, first_name, last_name');

        if (profilesError) throw profilesError;

        // Process all active profiles. We removed the "metric purity filter" because 
        // Admin accounts should be able to view their own testing and staging data on the dashboard.
        const customerProfiles = profiles.filter(p => {
            const status = (p.account_status || '').toLowerCase();
            const isDeleted = status === 'deleted';
            return !isDeleted;
        });
        console.log(`Fetched ${profiles.length} profiles, ${customerProfiles.length} active (non-deleted) profiles`);

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
        // Fetch profiles WITH membership_expires for accurate churn detection
        // A user is "churned" if they previously had a membership that is now expired
        // OR their subscription_status is a terminal canceled state
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

        const activeProfiles = customerProfiles.filter(p => {
            const status = (p.subscription_status || '').toLowerCase();
            const accountStatus = (p.account_status || '').toLowerCase();
            return ['active', 'trialing'].includes(status) || accountStatus === 'active';
        });
        const totalSubscribers = activeProfiles.length;

        // Churned: had a membership (membership_tier is set) but are NOT currently active
        // This is the correct denominator for retention: ever-subscribed users who left
        const churnedProfiles = customerProfiles.filter(p => {
            const status = (p.subscription_status || '').toLowerCase();
            const accountStatus = (p.account_status || '').toLowerCase();
            const wasMember = !!(p.membership_tier || p.tier); // Ever had a tier assigned
            const isCurrentlyActive = ['active', 'trialing'].includes(status) || accountStatus === 'active';
            const isTerminalState = ['cancelled', 'canceled', 'past_due', 'unpaid', 'overdue', 'inactive'].includes(status);
            return wasMember && !isCurrentlyActive && isTerminalState;
        });

        const totalChurned = churnedProfiles.length;

        const churnedUsers = churnedProfiles.map(p => ({
            id: p.id,
            name: [p.first_name, p.last_name].filter(Boolean).join(' ') || p.contact_email?.split('@')[0] || 'Unknown',
            email: p.contact_email || '',
            status: p.subscription_status || 'inactive',
            joinedAt: p.created_at
        }));

        // retentionRate: % of ever-subscribed users still active
        const everSubscribed = totalSubscribers + totalChurned;
        const retentionRate = everSubscribed > 0 ? (totalSubscribers / everSubscribed) * 100 : 0;

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
            churnedUsers: churnedUsers,
            retentionRate: retentionRate,
            yearly: yearlySubs,
            monthly: monthlySubs,
            estimatedMRR: estimatedMRR,
            estimatedARR: estimatedMRR * 12
        };

        // 2. Bookings Metrics
        const customerIds = new Set(customerProfiles.map(p => p.id));
        const registrationsList = (registrations || []).filter(r => r && r.sessions && customerIds.has(r.user_id));
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
        const sleeperProfiles = activeProfiles.filter(p => !recentUserIds.has(p.id));
        const sleepers = sleeperProfiles.length;

        // Build sleeper user list with last booking date for drilldown
        const sleeperUsers = sleeperProfiles.map(p => {
            const userBookings = bookingsList.filter(b => b.userId === p.id);
            const lastBooking = userBookings.length > 0
                ? userBookings.reduce((latest, b) =>
                    b.registeredAt > latest.registeredAt ? b : latest
                ).registeredAt.toISOString()
                : null;
            return {
                id: p.id,
                name: [p.first_name, p.last_name].filter(Boolean).join(' ') || p.contact_email?.split('@')[0] || 'Unknown',
                email: p.contact_email || '',
                lastBooking,
                daysSinceBooking: lastBooking
                    ? Math.floor((now.getTime() - new Date(lastBooking).getTime()) / (1000 * 60 * 60 * 24))
                    : null,
            };
        }).sort((a, b) => {
            // Sort: never booked first, then by most days since last booking
            if (a.daysSinceBooking === null) return -1;
            if (b.daysSinceBooking === null) return 1;
            return b.daysSinceBooking - a.daysSinceBooking;
        });

        // Credit Velocity: Avg credits spent per week
        const last7DaysCredits = bookingsList.filter(b => b.registeredAt >= sevenDaysAgo).reduce((sum, b) => sum + b.creditCost, 0);
        const creditVelocity = last7DaysCredits; // Total velocity for the platform

        // Utilization: Booked sessions vs Total sessions (assume avg capacity 10 if not specified)
        const totalSessionSlots = sessionsData.length * 10;
        const utilizationRate = totalSessionSlots > 0 ? (totalBookings / totalSessionSlots) * 100 : 0;

        // Conversion Rate: Active Subscribers / Total Customers (Parents only)
        const totalLeads = customerProfiles.filter(p => p.role === 'parent').length;
        const conversionRate = totalLeads > 0 ? (totalSubscribers / totalLeads) * 100 : 0;

        // Growth Metrics (MoM)
        const firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const currentMonthNewSubs = activeProfiles.filter(p => p.created_at && new Date(p.created_at) >= firstDayOfCurrentMonth).length;
        const lastMonthSubsCount = totalSubscribers - currentMonthNewSubs;
        // Return 0 if no prior subscribers (avoids misleading 100% on a fresh system)
        const momGrowth = lastMonthSubsCount > 0 ? (currentMonthNewSubs / lastMonthSubsCount) * 100 : 0;

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
            },
            health: {
                mau: mau,
                sleepers: sleepers,
                sleeperUsers: sleeperUsers,
                creditVelocity: creditVelocity,
                utilizationRate: utilizationRate,
                conversionRate: conversionRate,
                momGrowth: momGrowth
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
