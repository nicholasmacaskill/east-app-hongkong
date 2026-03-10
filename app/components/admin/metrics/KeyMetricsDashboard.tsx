'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import {
    Users, Activity, CalendarDays, Coins, RefreshCcw, AlertCircle,
    BarChart3, TrendingUp, Zap, MousePointer, DollarSign, X, Mail
} from 'lucide-react';

export default function KeyMetricsDashboard() {
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timelineRange, setTimelineRange] = useState<'monthly' | 'weekly'>('monthly');
    const [showSleeperModal, setShowSleeperModal] = useState(false);
    const [showChurnModal, setShowChurnModal] = useState(false);

    useEffect(() => {
        fetchMetrics();
    }, []);

    const fetchMetrics = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const res = await fetch('/api/admin/metrics', {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.details || data.error || 'Failed to fetch metrics data.');
            }

            setMetrics(data);
        } catch (err: any) {
            console.error('Error fetching metrics map:', err);
            setError(err.message || 'Unknown error occurred.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="w-full flex items-center justify-center p-20 text-gray-400">
                <RefreshCcw className="animate-spin mr-3" size={24} /> Loading metrics...
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-12 bg-[#1a1a1a] border border-red-500/20 rounded-2xl flex flex-col items-center text-center">
                <div className="text-red-500 font-black italic uppercase text-2xl mb-4">Metric Error</div>
                <div className="text-gray-400 font-mono text-xs max-w-lg mb-8 p-4 bg-black rounded border border-white/5 break-words">
                    {error}
                </div>
                <button
                    onClick={fetchMetrics}
                    className="bg-[#28D160] hover:bg-[#20A84D] text-black font-black italic uppercase px-8 py-3 rounded-full transition-all active:scale-95"
                >
                    Retry Connection
                </button>
            </div>
        );
    }

    if (!metrics) {
        return <div className="p-20 text-center text-gray-500 font-bold uppercase italic">No data received</div>;
    }

    const { subscribers, bookings, cancellations, health } = metrics;

    return (
        <>
            <div className="flex flex-col gap-6">

                {/* Row 1: Revenue & Growth KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute top-4 right-4 text-[#28D160]/20"><DollarSign size={80} /></div>
                        <div className="relative z-10">
                            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Estimated MRR</h3>
                            <div className="text-4xl font-black italic text-white">${subscribers.estimatedMRR.toLocaleString()}</div>
                            <div className="mt-4 text-xs font-bold text-gray-500 uppercase">
                                ${subscribers.estimatedARR.toLocaleString()} ARR Equivalent
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute top-4 right-4 text-blue-500/20"><TrendingUp size={80} /></div>
                        <div className="relative z-10">
                            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Subscriber Growth</h3>
                            <div className="text-4xl font-black italic text-blue-400">+{health.momGrowth.toFixed(1)}%</div>
                            <div className="mt-4 text-xs font-bold text-gray-500 uppercase">
                                Month over Month growth
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute top-4 right-4 text-[#28D160]/20"><Users size={80} /></div>
                        <div className="relative z-10">
                            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Active Subscribers</h3>
                            <div className="text-4xl font-black italic">{subscribers.total}</div>
                            <div className="flex justify-between mt-4 text-xs font-bold text-gray-500">
                                <span>{subscribers.monthly} Monthly</span>
                                <span>{subscribers.yearly} Yearly</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowChurnModal(true)}
                        className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 relative overflow-hidden group text-left cursor-pointer hover:border-red-500/40 hover:bg-red-500/5 transition-all"
                    >
                        <div className="absolute top-4 right-4 text-[#28D160]/20 group-hover:text-red-500/20 transition-colors"><Activity size={80} /></div>
                        <div className="relative z-10">
                            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Retention & Churn</h3>
                            <div className="text-4xl font-black italic">{subscribers.retentionRate.toFixed(1)}%</div>
                            <div className="flex justify-between mt-4 text-xs font-bold">
                                <span className="text-gray-500">{subscribers.churned} Total Churned</span>
                                <span className="text-red-500">{(100 - subscribers.retentionRate).toFixed(1)}% Churn Rate</span>
                            </div>
                            <p className="text-[10px] text-[#28D160]/60 font-bold uppercase tracking-wider mt-2 group-hover:text-red-400 transition-colors">Click to view →</p>
                        </div>
                    </button>
                </div>

                {/* Row 2: SaaS Health Tiles */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400"><MousePointer size={24} /></div>
                        <div>
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">MAU (30D)</p>
                            <p className="text-xl font-black italic">{health.mau} <span className="text-[10px] text-gray-600 ml-1">PLAYERS</span></p>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowSleeperModal(true)}
                        className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 flex items-center gap-4 hover:border-red-500/40 hover:bg-red-500/5 transition-all group text-left w-full cursor-pointer"
                    >
                        <div className="p-3 bg-red-500/10 rounded-xl text-red-400"><AlertCircle size={24} /></div>
                        <div>
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Sleepers (At Risk)</p>
                            <p className="text-xl font-black italic">{health.sleepers} <span className="text-[10px] text-gray-600 ml-1">USERS</span></p>
                            <p className="text-[10px] text-red-500/60 font-bold uppercase tracking-wider mt-1 group-hover:text-red-400 transition-colors">Click to view →</p>
                        </div>
                    </button>

                    <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 flex items-center gap-4">
                        <div className="p-3 bg-[#28D160]/10 rounded-xl text-[#28D160]"><Zap size={24} /></div>
                        <div>
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Credit Velocity</p>
                            <p className="text-xl font-black italic">{health.creditVelocity.toLocaleString()} <span className="text-[10px] text-gray-600 ml-1">CR/WK</span></p>
                        </div>
                    </div>

                    <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 flex items-center gap-4">
                        <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500"><BarChart3 size={24} /></div>
                        <div>
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Utilization</p>
                            <p className="text-xl font-black italic">{health.utilizationRate.toFixed(1)}% <span className="text-[10px] text-gray-600 ml-1">CAPACITY</span></p>
                        </div>
                    </div>
                </div>

                {/* Row 3: Booking Summaries */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute top-4 right-4 text-[#28D160]/20"><CalendarDays size={80} /></div>
                        <div className="relative z-10">
                            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Total Bookings</h3>
                            <div className="text-4xl font-black italic">{bookings.total}</div>
                            <div className="mt-4 text-xs font-bold text-gray-500">
                                {cancellations.total} total cancellations
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute top-4 right-4 text-[#28D160]/20"><Coins size={80} /></div>
                        <div className="relative z-10">
                            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Credits Spent</h3>
                            <div className="text-4xl font-black italic text-[#28D160]">{bookings.totalCreditsSpent.toLocaleString()}</div>
                            <div className="mt-4 text-xs font-bold text-[#28D160]/70">
                                Lifetime booking revenue
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Facility Distribution */}
                    <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6">
                        <h3 className="text-lg font-black italic uppercase mb-6 flex items-center justify-between">
                            Bookings by Facility
                        </h3>
                        <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-2">
                            {Object.entries(bookings.byFacility || {}).sort((a: any, b: any) => b[1] - a[1]).map(([facility, count]: any) => {
                                const rev = (bookings.revenueByFacility || {})[facility] || 0;
                                const max = Math.max(...Object.values(bookings.byFacility || {}) as number[], 1);
                                const width = (count / max) * 100;
                                return (
                                    <div key={facility} className="flex flex-col gap-1">
                                        <div className="flex justify-between text-[10px] font-bold text-gray-400">
                                            <span className="uppercase">{facility}</span>
                                            <div className="flex gap-2">
                                                <span>{count} Bookings</span>
                                                <span className="text-[#28D160]">{rev.toLocaleString()} CR</span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-black h-1.5 rounded-full overflow-hidden">
                                            <div className="bg-[#28D160] h-full rounded-full" style={{ width: `${width}%` }}></div>
                                        </div>
                                    </div>
                                );
                            })}
                            {Object.keys(bookings.byFacility || {}).length === 0 && (
                                <p className="text-gray-500 italic text-sm text-center py-4">No facility bookings found.</p>
                            )}
                        </div>
                    </div>

                    {/* Coach Performance */}
                    <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6">
                        <h3 className="text-lg font-black italic uppercase mb-6 flex items-center justify-between">
                            Bookings by Coach
                        </h3>
                        <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-2">
                            {Object.entries(bookings.byCoach || {}).sort((a: any, b: any) => b[1] - a[1]).map(([coach, count]: any) => {
                                const rev = (bookings.revenueByCoach || {})[coach] || 0;
                                const max = Math.max(...Object.values(bookings.byCoach || {}) as number[], 1);
                                const width = (count / max) * 100;
                                return (
                                    <div key={coach} className="flex flex-col gap-1">
                                        <div className="flex justify-between text-[10px] font-bold text-gray-400">
                                            <span>{coach || 'Unassigned'}</span>
                                            <div className="flex gap-2">
                                                <span>{count} Bookings</span>
                                                <span className="text-blue-400">{rev.toLocaleString()} CR</span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-black h-1.5 rounded-full overflow-hidden">
                                            <div className="bg-blue-500 h-full rounded-full" style={{ width: `${width}%` }}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Activity Timeline (Bookings vs Cancellations) */}
                    <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 lg:col-span-2">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-black italic uppercase">Activity Timeline</h3>
                            <div className="flex bg-black border border-white/10 rounded-lg p-1">
                                <button onClick={() => setTimelineRange('monthly')} className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-colors ${timelineRange === 'monthly' ? 'bg-[#28D160] text-black' : 'text-gray-500 hover:text-white'}`}>Monthly</button>
                                <button onClick={() => setTimelineRange('weekly')} className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-colors ${timelineRange === 'weekly' ? 'bg-[#28D160] text-black' : 'text-gray-500 hover:text-white'}`}>Weekly</button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left table-auto">
                                <thead>
                                    <tr className="border-b border-white/5 text-gray-500 text-xs uppercase tracking-widest font-bold">
                                        <th className="py-3 px-2">{timelineRange === 'monthly' ? 'Month' : 'Week'}</th>
                                        <th className="py-3 px-2">Total Bookings</th>
                                        <th className="py-3 px-2">Credits Spent</th>
                                        <th className="py-3 px-2">Cancellations</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(timelineRange === 'monthly' ? bookings.timeline : bookings.timelineWeekly).map((t: any) => {
                                        const cancelData = cancellations.timeline.find((c: any) => c.period === t.period);
                                        const cancelCount = cancelData ? cancelData.cancellations : 0;
                                        return (
                                            <tr key={t.period} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                <td className="py-3 px-2 font-mono text-sm">{t.period}</td>
                                                <td className="py-3 px-2 font-bold">{t.bookings}</td>
                                                <td className="py-3 px-2 text-[#28D160]">{t.spentCredits}</td>
                                                <td className="py-3 px-2 text-red-400">{timelineRange === 'monthly' ? cancelCount : '-'}</td>
                                            </tr>
                                        );
                                    })}
                                    {(timelineRange === 'monthly' ? bookings.timeline : bookings.timelineWeekly).length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="py-8 text-center text-gray-500 italic">No historical booking data available.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Peak Days (DOW) */}
                    <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 lg:col-span-2">
                        <h3 className="text-lg font-black italic uppercase mb-6">Peak Booking Days</h3>
                        <div className="flex h-48 items-end gap-2 px-2">
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                                const count = (bookings.peakDays || {})[day] || 0;
                                const max = Math.max(...Object.values(bookings.peakDays || {}) as number[], 1);
                                const height = (count / max) * 100;
                                return (
                                    <div key={day} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                                        <div className="absolute -top-8 bg-black border border-white/10 px-2 py-1 rounded text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                            {count} bookings
                                        </div>
                                        <div className="w-full bg-blue-500 rounded-t-sm transition-all duration-300 group-hover:bg-white" style={{ height: `${height}%`, minHeight: count > 0 ? '4px' : '0' }}></div>
                                        <div className="text-[10px] text-gray-600 mt-2 font-bold uppercase">{day.substring(0, 3)}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Peak Times */}
                    <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 lg:col-span-2">
                        <h3 className="text-lg font-black italic uppercase mb-6">Peak Booking Times (24h)</h3>
                        <div className="flex items-end gap-1 h-32 w-full pt-8">
                            {Array.from({ length: 24 }).map((_, hour) => {
                                const count = bookings.peakTimes[hour] || 0;
                                const max = Object.values(bookings.peakTimes).length > 0 ? Math.max(...Object.values(bookings.peakTimes) as number[]) : 1;
                                const height = (count / max) * 100;

                                return (
                                    <div key={hour} className="flex-1 flex flex-col items-center group relative cursor-pointer">
                                        <div className="absolute -top-8 bg-black border border-white/10 px-2 py-1 rounded text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                            {count} bookings
                                        </div>
                                        <div className="w-full bg-[#28D160] rounded-t-sm transition-all duration-300 group-hover:bg-white" style={{ height: `${height}%`, minHeight: count > 0 ? '4px' : '0' }}></div>
                                        <div className="text-[8px] text-gray-600 mt-2 font-mono">{hour}:00</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>
            </div>

            {/* Sleeper Modal */}
            {showSleeperModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fadeIn" onClick={() => setShowSleeperModal(false)}>
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-xl max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
                            <div>
                                <h2 className="font-black italic uppercase text-lg">At-Risk Members</h2>
                                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-0.5">Active subscribers with no bookings in 30+ days</p>
                            </div>
                            <button onClick={() => setShowSleeperModal(false)} className="text-gray-500 hover:text-white transition-colors p-1">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="overflow-y-auto flex-1 p-4">
                            {(health.sleeperUsers || []).length === 0 ? (
                                <div className="py-12 text-center text-gray-500 italic">No at-risk members — great retention!</div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {(health.sleeperUsers || []).map((user: any) => (
                                        <div key={user.id} className="flex items-center justify-between gap-4 bg-black/40 border border-white/5 rounded-xl px-4 py-3 hover:border-white/10 transition-colors">
                                            <div className="min-w-0">
                                                <p className="font-bold text-sm text-white truncate">{user.name}</p>
                                                <p className="text-gray-500 text-xs truncate flex items-center gap-1 mt-0.5">
                                                    <Mail size={10} />{user.email}
                                                </p>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                {user.daysSinceBooking === null ? (
                                                    <span className="text-[10px] font-black uppercase tracking-wider bg-red-500/15 text-red-400 px-2 py-1 rounded-lg">Never booked</span>
                                                ) : (
                                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg ${user.daysSinceBooking > 60
                                                        ? 'bg-red-500/15 text-red-400'
                                                        : 'bg-amber-500/15 text-amber-400'
                                                        }`}>
                                                        {user.daysSinceBooking}d ago
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-white/10 shrink-0">
                            <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest text-center">
                                {(health.sleeperUsers || []).length} members shown · sorted by inactivity
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Churned Modal */}
            {showChurnModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fadeIn" onClick={() => setShowChurnModal(false)}>
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-xl max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
                            <div>
                                <h2 className="font-black italic uppercase text-lg">Churned Customers</h2>
                                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-0.5">Users who previously had a membership that is now inactive</p>
                            </div>
                            <button onClick={() => setShowChurnModal(false)} className="text-gray-500 hover:text-white transition-colors p-1">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="overflow-y-auto flex-1 p-4">
                            {(subscribers.churnedUsers || []).length === 0 ? (
                                <div className="py-12 text-center text-gray-500 italic">No churned customers — exceptional retention!</div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {(subscribers.churnedUsers || []).map((user: any) => (
                                        <div key={user.id} className="flex items-center justify-between gap-4 bg-black/40 border border-white/5 rounded-xl px-4 py-3 hover:border-white/10 transition-colors">
                                            <div className="min-w-0">
                                                <p className="font-bold text-sm text-white truncate">{user.name}</p>
                                                <p className="text-gray-500 text-xs truncate flex items-center gap-1 mt-0.5">
                                                    <Mail size={10} />{user.email}
                                                </p>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <span className="text-[10px] font-black uppercase tracking-wider bg-red-500/15 text-red-500 px-2 py-1 rounded-lg">
                                                    {user.status}
                                                </span>
                                                <p className="text-[10px] text-gray-600 font-bold uppercase mt-1">
                                                    Joined {user.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : 'Unknown'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-white/10 shrink-0">
                            <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest text-center">
                                {(subscribers.churnedUsers || []).length} churned users total
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
