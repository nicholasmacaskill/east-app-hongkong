'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import { Users, Coins, CalendarDays, Activity, RefreshCcw } from 'lucide-react';

export default function KeyMetricsDashboard() {
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

            if (!res.ok) {
                throw new Error('Failed to fetch metrics data.');
            }

            const data = await res.json();
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

    if (error || !metrics) {
        return (
            <div className="p-8 bg-black border border-white/5 rounded-2xl flex flex-col items-center">
                <p className="text-red-500 mb-4">{error}</p>
                <button onClick={fetchMetrics} className="bg-[#1e1e1e] hover:bg-white/10 px-4 py-2 border border-white/10 rounded uppercase text-xs font-bold">Retry</button>
            </div>
        );
    }

    const { subscribers, bookings, cancellations } = metrics;

    return (
        <div className="flex flex-col gap-6">

            {/* Top Level KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

                <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-4 right-4 text-[#28D160]/20"><Activity size={80} /></div>
                    <div className="relative z-10">
                        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Retention Rate</h3>
                        <div className="text-4xl font-black italic">{subscribers.retentionRate.toFixed(1)}%</div>
                        <div className="mt-4 text-xs font-bold text-gray-500">
                            {subscribers.churned} total churned
                        </div>
                    </div>
                </div>

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
                    <div className="flex flex-col gap-4">
                        {Object.entries(bookings.byCategory).sort((a: any, b: any) => b[1] - a[1]).map(([category, count]: any) => {
                            const max = Math.max(...Object.values(bookings.byCategory) as number[]);
                            const width = max > 0 ? (count / max) * 100 : 0;
                            return (
                                <div key={category} className="flex flex-col gap-1">
                                    <div className="flex justify-between text-xs font-bold text-gray-400">
                                        <span className="uppercase">{category || 'General'}</span>
                                        <span>{count}</span>
                                    </div>
                                    <div className="w-full bg-black h-2 rounded-full overflow-hidden">
                                        <div className="bg-[#28D160] h-full rounded-full" style={{ width: `${width} % ` }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Coach Performance */}
                <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6">
                    <h3 className="text-lg font-black italic uppercase mb-6 flex items-center justify-between">
                        Bookings by Coach
                    </h3>
                    <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-2">
                        {Object.entries(bookings.byCoach).sort((a: any, b: any) => b[1] - a[1]).map(([coach, count]: any) => {
                            const max = Math.max(...Object.values(bookings.byCoach) as number[]);
                            const width = max > 0 ? (count / max) * 100 : 0;
                            return (
                                <div key={coach} className="flex flex-col gap-1">
                                    <div className="flex justify-between text-xs font-bold text-gray-400">
                                        <span>{coach || 'Unassigned'}</span>
                                        <span>{count}</span>
                                    </div>
                                    <div className="w-full bg-black h-2 rounded-full overflow-hidden">
                                        <div className="bg-blue-500 h-full rounded-full" style={{ width: `${width} % ` }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Activity Timeline (Bookings vs Cancellations) */}
                <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 lg:col-span-2">
                    <h3 className="text-lg font-black italic uppercase mb-6">Activity Timeline (Monthly)</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left table-auto">
                            <thead>
                                <tr className="border-b border-white/5 text-gray-500 text-xs uppercase tracking-widest font-bold">
                                    <th className="py-3 px-2">Month</th>
                                    <th className="py-3 px-2">Total Bookings</th>
                                    <th className="py-3 px-2">Credits Spent</th>
                                    <th className="py-3 px-2">Cancellations</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.timeline.map((t: any) => {
                                    const cancelData = cancellations.timeline.find((c: any) => c.period === t.period);
                                    const cancelCount = cancelData ? cancelData.cancellations : 0;
                                    return (
                                        <tr key={t.period} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="py-3 px-2 font-mono text-sm">{t.period}</td>
                                            <td className="py-3 px-2 font-bold">{t.bookings}</td>
                                            <td className="py-3 px-2 text-[#28D160]">{t.spentCredits}</td>
                                            <td className="py-3 px-2 text-red-400">{cancelCount}</td>
                                        </tr>
                                    );
                                })}
                                {bookings.timeline.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-gray-500 italic">No historical booking data available.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Peak Times */}
                <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 lg:col-span-2">
                    <h3 className="text-lg font-black italic uppercase mb-6">Peak Booking Times (24h)</h3>
                    <div className="flex items-end gap-1 h-32 w-full pt-8">
                        {Array.from({ length: 24 }).map((_, hour) => {
                            const count = bookings.peakTimes[hour] || 0;
                            const max = Object.values(bookings.peakTimes).length > 0 ? Math.max(...Object.values(bookings.peakTimes) as number[]) : 0;
                            const height = max > 0 ? (count / max) * 100 : 0;

                            return (
                                <div key={hour} className="flex-1 flex flex-col items-center group relative cursor-pointer">
                                    <div className="absolute -top-8 bg-black border border-white/10 px-2 py-1 rounded text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity z-10 pointers-events-none">
                                        {count} bookings
                                    </div>
                                    <div className="w-full bg-[#28D160] rounded-t-sm transition-all duration-300 group-hover:bg-white" style={{ height: `${height} % `, minHeight: count > 0 ? '4px' : '0' }}></div>
                                    <div className="text-[8px] text-gray-600 mt-2 font-mono">{hour}:00</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
}
