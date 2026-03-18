'use client';

import React, { useEffect, useState } from 'react';
import { Users, Search, Plus, Calendar, Mail, Edit2, Loader2, Sparkles, Activity, Star } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';
import AvailabilityModal from '@/app/sys-admin/coaches/AvailabilityModal';
import { useToast } from '@/app/components/ui/Toast';

export default function AdminOpsCoachesPage() {
    const { addToast } = useToast();
    const [coaches, setCoaches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCoach, setSelectedCoach] = useState<any>(null);
    const [showAvailability, setShowAvailability] = useState(false);

    useEffect(() => {
        fetchCoaches();
    }, []);

    const fetchCoaches = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'coach')
                .order('first_name');

            if (error) throw error;
            setCoaches(data || []);
        } catch (err: any) {
            addToast("Failed to load coaches", "error");
        }
        setLoading(false);
    };

    const filteredCoaches = coaches.filter(c => 
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-2">
                        Coach <span className="text-[#28D160]">Roster</span>
                    </h1>
                    <p className="text-gray-400 text-sm font-medium">Manage your elite team of instructors and their availability.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input 
                            type="text" 
                            placeholder="Find a coach..." 
                            className="bg-[#1a1a1a] border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-[#28D160] transition-colors w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Coach Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4 text-gray-500">
                        <Loader2 className="animate-spin" size={32} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Hydrating Roster...</span>
                    </div>
                ) : filteredCoaches.length === 0 ? (
                    <div className="col-span-full py-20 bg-[#1a1a1a] border border-white/5 rounded-3xl text-center text-gray-500">
                        <Users size={48} className="mx-auto mb-4 opacity-10" />
                        <p className="text-sm font-medium">No coaches found in the roster.</p>
                    </div>
                ) : (
                    filteredCoaches.map(coach => (
                        <div key={coach.id} className="bg-[#1a1a1a] border border-white/5 rounded-3xl p-6 flex flex-col gap-6 group hover:border-[#28D160] transition-all relative overflow-hidden shadow-xl">
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 bg-black/40 rounded-2xl overflow-hidden flex-shrink-0 border border-white/5 relative">
                                    {coach.avatar_url ? (
                                        <img src={coach.avatar_url} alt={coach.first_name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-700">
                                            <Users size={32} />
                                        </div>
                                    )}
                                    <div className="absolute top-1 right-1">
                                        <div className="w-2 h-2 bg-[#28D160] rounded-full shadow-[0_0_8px_#28D160]" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-xl font-black uppercase italic tracking-tight mb-1 group-hover:text-[#28D160] transition-colors truncate">{coach.first_name} {coach.last_name}</h3>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Star size={10} className="text-[#28D160] fill-[#28D160]" />
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pro Coach</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold italic">
                                        <Mail size={10} />
                                        {coach.email}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                                <div className="bg-black/40 rounded-xl p-3 border border-white/5">
                                    <p className="text-[8px] font-black text-gray-600 uppercase mb-1">Weekly Slots</p>
                                    <p className="text-sm font-black italic">--</p>
                                </div>
                                <div className="bg-black/40 rounded-xl p-3 border border-white/5">
                                    <p className="text-[8px] font-black text-gray-600 uppercase mb-1">Efficiency</p>
                                    <p className="text-sm font-black italic text-[#28D160]">94%</p>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    setSelectedCoach(coach);
                                    setShowAvailability(true);
                                }}
                                className="w-full bg-white/5 border border-white/5 hover:bg-[#28D160] hover:text-black hover:border-transparent rounded-xl py-4 px-4 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                            >
                                <Calendar size={14} /> Handle Availability
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Availability Modal Integration */}
            {showAvailability && selectedCoach && (
                <AvailabilityModal 
                    coach={selectedCoach} 
                    onClose={() => {
                        setShowAvailability(false);
                        setSelectedCoach(null);
                        fetchCoaches(); // Refresh roster
                    }} 
                />
            )}
        </div>
    );
}
