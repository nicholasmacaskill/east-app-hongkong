'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import {
    Users, Activity, CalendarDays, Coins, RefreshCcw, AlertCircle,
    BarChart3, TrendingUp, Zap, MousePointer, DollarSign,
    ZapOff, ShieldCheck, Info
} from 'lucide-react';
import RefractionMasterCard from './RefractionMasterCard';
import RunningText from './RunningText';

export default function KeyMetricsDashboard() {
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timelineRange, setTimelineRange] = useState<'monthly' | 'weekly'>('monthly');

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

    const { subscribers, bookings, cancellations, health, telemetry } = metrics;

    return (
        <div className="flex flex-col gap-8 pb-32">

            {/* VIEWPORT 1: SYSTEM RESONANCE (Growth & Stability) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <RefractionMasterCard momentum={subscribers.momentum} className="md:col-span-1">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">System Resonance</p>
                            <h3 className="text-2xl font-black italic uppercase leading-none">Net Revenue</h3>
                        </div>
                        <div className={`p-2 rounded-lg bg-white/5 ${subscribers.momentum === 'cyan' ? 'text-cyan-400' : 'text-magenta-400'}`}>
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <div className="text-5xl font-black italic tracking-tighter mb-2">
                        ${subscribers.estimatedMRR.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${subscribers.momentum === 'cyan' ? 'text-cyan-400' : 'text-magenta-400'}`}>
                            {subscribers.velocity > 0 ? '+' : ''}{subscribers.velocity.toFixed(1)}% Velocity
                        </span>
                        <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">/ MoM</span>
                    </div>
                </RefractionMasterCard>

                <RefractionMasterCard momentum={subscribers.momentum}>
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Active Mass</p>
                            <h3 className="text-2xl font-black italic uppercase leading-none">Subscribers</h3>
                        </div>
                        <div className="p-2 rounded-lg bg-white/5 text-gray-400">
                            <Users size={20} />
                        </div>
                    </div>
                    <div className="text-5xl font-black italic tracking-tighter mb-2">{subscribers.total}</div>
                    <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        <span>{subscribers.monthly} Monthly</span>
                        <span>{subscribers.yearly} Yearly</span>
                    </div>
                </RefractionMasterCard>

                <RefractionMasterCard momentum={subscribers.momentum === 'cyan' ? 'cyan' : 'none'}>
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Stability Index</p>
                            <h3 className="text-2xl font-black italic uppercase leading-none">Retention</h3>
                        </div>
                        <div className="p-2 rounded-lg bg-white/5 text-gray-400">
                            <ShieldCheck size={20} />
                        </div>
                    </div>
                    <div className="text-5xl font-black italic tracking-tighter mb-2">{subscribers.retentionRate.toFixed(1)}%</div>
                    <div className="text-[10px] font-bold text-red-500/70 uppercase tracking-widest">
                        {(100 - subscribers.retentionRate).toFixed(1)}% Critical Leakage
                    </div>
                </RefractionMasterCard>
            </div>

            {/* VIEWPORT 2: KINETIC ENERGY (Execution & Throughput) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RefractionMasterCard momentum={bookings.momentum} className="lg:col-span-1 border-l-cyan-500/30">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <p className="text-cyan-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Kinetic Energy</p>
                            <h3 className="text-4xl font-black italic uppercase leading-none tracking-tighter">Intent Throughput</h3>
                        </div>
                        <Zap className="text-cyan-400 animate-pulse" size={32} />
                    </div>
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Credit Flow</p>
                            <div className="text-3xl font-black italic text-cyan-400">{bookings.totalCreditsSpent.toLocaleString()}</div>
                        </div>
                        <div>
                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Velocity (48h)</p>
                            <div className={`text-3xl font-black italic ${bookings.velocity > 0 ? 'text-cyan-400' : 'text-magenta-400'}`}>
                                {bookings.velocity > 0 ? '+' : ''}{bookings.velocity.toFixed(1)}%
                            </div>
                        </div>
                    </div>

                    {/* Action Lever */}
                    <button className="w-full py-4 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-xl transition-all group/lever overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/lever:translate-x-full transition-transform duration-1000" />
                        <span className="relative z-10 text-[10px] font-black italic uppercase tracking-[0.3em] text-cyan-400">Manifest Demand Boost</span>
                    </button>
                </RefractionMasterCard>

                <div className="grid grid-cols-1 gap-6">
                    <RefractionMasterCard className="p-0 overflow-hidden">
                        <div className="p-6 border-b border-white/5">
                            <h3 className="text-xs font-black italic uppercase tracking-widest text-gray-500">Facility Resonance</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            {Object.entries(bookings.byFacility || {}).sort((a: any, b: any) => b[1] - a[1]).slice(0, 4).map(([facility, count]: any) => {
                                const max = Math.max(...Object.values(bookings.byFacility || {}) as number[], 1);
                                return (
                                    <div key={facility} className="space-y-1">
                                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                                            <span className="text-gray-400">{facility}</span>
                                            <span className="text-cyan-400">{count} Events</span>
                                        </div>
                                        <div className="h-1 bg-black rounded-full overflow-hidden">
                                            <div className="h-full bg-cyan-500 opacity-50" style={{ width: `${(count / max) * 100}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </RefractionMasterCard>
                </div>
            </div>

            {/* VIEWPORT 3: FRICTION POINTS (System Drag & Opaque Glass) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <RefractionMasterCard momentum={health.momentum} className="border-l-magenta-500/30">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-magenta-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Friction Points</p>
                            <h3 className="text-2xl font-black italic uppercase leading-none">Sleepers</h3>
                        </div>
                        <ZapOff className="text-magenta-400" size={24} />
                    </div>
                    <div className="text-5xl font-black italic tracking-tighter mb-4 text-magenta-400">{health.sleepers}</div>
                    <p className="text-[10px] text-gray-600 font-bold uppercase mb-6">At-risk identities detected in system</p>

                    {/* Action Lever */}
                    <button className="w-full py-3 bg-magenta-500/10 hover:bg-magenta-500/20 border border-magenta-500/20 rounded-xl transition-all text-[10px] font-black italic uppercase tracking-[0.2em] text-magenta-400">
                        Trigger Re-engagement Swarm
                    </button>
                </RefractionMasterCard>

                <RefractionMasterCard>
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Opacity Index</p>
                            <h3 className="text-2xl font-black italic uppercase leading-none">Utilization</h3>
                        </div>
                        <BarChart3 className="text-amber-500" size={24} />
                    </div>
                    <div className="text-5xl font-black italic tracking-tighter mb-2">{health.utilizationRate.toFixed(1)}%</div>
                    <div className="w-full bg-black h-2 rounded-full overflow-hidden mb-4">
                        <div className="h-full bg-amber-500" style={{ width: `${health.utilizationRate}%` }} />
                    </div>
                    <p className="text-[10px] text-gray-600 font-bold uppercase">Average platform capacity drain</p>
                </RefractionMasterCard>

                <RefractionMasterCard>
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Negative Force</p>
                            <h3 className="text-2xl font-black italic uppercase leading-none">Voided</h3>
                        </div>
                        <AlertCircle className="text-red-500" size={24} />
                    </div>
                    <div className="text-5xl font-black italic tracking-tighter mb-2">{cancellations.total}</div>
                    <p className="text-[10px] text-gray-600 font-bold uppercase">Total historical session cancellations</p>
                </RefractionMasterCard>
            </div>

            {/* TELEMETRY LAYER (THE SYSTEM NERVOUS SYSTEM) */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-t border-white/5 py-4">
                <div className="container mx-auto px-6 flex items-center gap-6">
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        <span className="text-[10px] font-black italic uppercase tracking-widest text-cyan-400">Live Telemetry</span>
                    </div>
                    <RunningText
                        text={telemetry?.join('  ::  ') || 'ESTABLISHING CONNECTION TO SYSTEM NERVOUS SYSTEM...'}
                        speed={40}
                        className="text-[10px] font-mono text-gray-500 uppercase flex-1"
                    />
                    <div className="shrink-0 flex gap-4">
                        <button onClick={fetchMetrics} className="text-gray-500 hover:text-white transition-colors">
                            <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <div className="text-[10px] font-mono text-gray-700">HK-NODE-01</div>
                    </div>
                </div>
            </div>

        </div>
    );
}
