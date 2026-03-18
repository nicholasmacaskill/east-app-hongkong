'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, LayoutGrid, Calendar, ClipboardList, ArrowRight } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';

export default function AdminOpsDashboard() {
    const [stats, setStats] = useState({
        coaches: 0,
        services: 0,
        todayBookings: 0,
        pendingTasks: 3
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch Coach Count
                const { count: coachCount } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true })
                    .eq('role', 'coach');

                // Fetch Service Count (Session Types)
                const { count: typeCount } = await supabase
                    .from('session_types')
                    .select('*', { count: 'exact', head: true });

                setStats(prev => ({
                    ...prev,
                    coaches: coachCount || 0,
                    services: typeCount || 0
                }));
            } catch (err) {
                console.error("Error fetching stats:", err);
            }
        };
        fetchStats();
    }, []);

    const StatCard = ({ title, value, icon: Icon, color }: any) => (
        <div className="bg-[#1e1e1e] border border-white/5 p-6 rounded-2xl flex items-center justify-between">
            <div>
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">{title}</p>
                <p className="text-3xl font-black italic">{value}</p>
            </div>
            <div className={`p-4 rounded-xl ${color}`}>
                <Icon size={24} className="text-black" />
            </div>
        </div>
    );

    const MenuButton = ({ href, title, description, icon: Icon }: any) => (
        <Link href={href} className="group bg-[#1a1a1a] border border-white/5 p-8 rounded-3xl hover:border-[#28D160] transition-all flex flex-col gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                <Icon size={120} />
            </div>
            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-[#28D160] transition-colors">
                <Icon size={28} className="text-gray-400 group-hover:text-black transition-colors" />
            </div>
            <div>
                <h3 className="text-xl font-black uppercase italic tracking-tighter mb-2 group-hover:text-[#28D160] transition-colors">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#28D160] opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                Manage Now <ArrowRight size={12} />
            </div>
        </Link>
    );

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Hero Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none mb-4">
                        Investor <span className="text-[#28D160]">Admin Panel</span>
                    </h1>
                    <p className="text-gray-400 font-medium max-w-lg">
                        Manage your team, define your services, and orchestrate the ultimate athlete experience from one unified cockpit.
                    </p>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard title="Active Coaches" value={stats.coaches} icon={Users} color="bg-blue-400" />
                <StatCard title="Service Types" value={stats.services} icon={LayoutGrid} color="bg-purple-400" />
            </div>

            {/* Navigation Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MenuButton 
                    href="/admin-ops/coaches" 
                    title="Coaches" 
                    description="Roster management, availability slots, and performance tracking."
                    icon={Users}
                />
                <MenuButton 
                    href="/admin-ops/services" 
                    title="Services" 
                    description="Define classes, private lessons, and facility access rules."
                    icon={LayoutGrid}
                />
                <MenuButton 
                    href="/admin-ops/schedule" 
                    title="Schedule" 
                    description="Automated slot generation and master calendar control."
                    icon={Calendar}
                />
                <MenuButton 
                    href="/admin-ops/bookings" 
                    title="Bookings" 
                    description="Track your specific administrative actions and booking history."
                    icon={ClipboardList}
                />
            </div>
        </div>
    );
}
