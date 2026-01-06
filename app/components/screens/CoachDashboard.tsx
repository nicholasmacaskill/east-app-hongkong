'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import { useRouter } from 'next/navigation';
import { LogOut, RefreshCw, Calendar, Users, Clock, AlertCircle } from 'lucide-react';

interface Attendee {
    id: string;
    name: string;
    role: string;
}

interface MasterSession {
    id: string | number;
    type: 'session' | 'slot';
    title: string;
    category: string;
    instructor: string;
    start_time: string;
    end_time: string;
    attendees: Attendee[];
    coach_id?: string; // For filtering availability
}

export default function CoachDashboard({ currentUserId, userName }: { currentUserId: string, userName: string }) {
    const [allSessions, setAllSessions] = useState<MasterSession[]>([]);
    const [filteredSessions, setFilteredSessions] = useState<MasterSession[]>([]);
    const [viewMode, setViewMode] = useState<'my_schedule' | 'master_view'>('master_view');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchSchedule = async () => {
        try {
            setRefreshing(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const res = await fetch('/api/coach/master-schedule', {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                setAllSessions(data);
            } else {
                console.error("Failed to fetch schedule");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchSchedule();
    }, []);

    // Filter Logic
    useEffect(() => {
        if (viewMode === 'master_view') {
            setFilteredSessions(allSessions);
        } else {
            // My Schedule: 
            // 1. Sessions where instructor name matches (loose check, or ideally ID but sessions table store instructor name text)
            // 2. Slots where coach_id matches currentUserId
            const myData = allSessions.filter(s => {
                if (s.type === 'slot') {
                    return s.coach_id === currentUserId;
                } else {
                    // Session: check if instructor string contains name parts or exact match
                    // This is imperfect if names are non-unique, but fits current schema
                    return s.instructor.toLowerCase().includes(userName.toLowerCase()) ||
                        s.instructor.toLowerCase() === 'you';
                }
            });
            setFilteredSessions(myData);
        }
    }, [viewMode, allSessions, currentUserId, userName]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    // Helper to group by date
    const groupedSessions = filteredSessions.reduce((acc, session) => {
        const dateKey = new Date(session.start_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(session);
        return acc;
    }, {} as Record<string, MasterSession[]>);

    // Helpers for styling
    const getStatusColor = (s: MasterSession) => {
        if (s.type === 'slot') return 'border-l-4 border-gray-500 opacity-70'; // Open Slot (Passive)
        if (s.attendees.length > 0) return 'border-l-4 border-yellow-400'; // Booked
        if (s.category === 'FACILITY') return 'border-l-4 border-blue-500'; // Facility
        return 'border-l-4 border-emerald-500'; // Open Class
    };

    const getStatusBadge = (s: MasterSession) => {
        if (s.type === 'slot') return <span className="bg-gray-800 text-gray-400 text-[9px] font-black px-2 py-0.5 rounded uppercase">OPEN SLOT</span>;
        if (s.attendees.length > 0) return <span className="bg-yellow-400/20 text-yellow-400 text-[9px] font-black px-2 py-0.5 rounded uppercase">{s.attendees.length} Attendees</span>;
        return <span className="bg-emerald-500/20 text-emerald-500 text-[9px] font-black px-2 py-0.5 rounded uppercase">OPEN CLASS</span>;
    };

    if (loading) return <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center font-black animate-pulse uppercase tracking-widest">Loading Master Schedule...</div>;

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-montserrat selection:bg-east-light selection:text-black">
            {/* TOP BAR */}
            <div className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/10 px-6 py-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-xl font-black italic uppercase tracking-tighter text-white">EAST <span className="text-east-light">COACH</span></h1>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Dashboard • {userName}</p>
                </div>

                <div className="flex items-center gap-4">
                    {/* View Toggles */}
                    <div className="bg-[#1e1e1e] p-1 rounded-lg flex border border-white/10">
                        <button
                            onClick={() => setViewMode('master_view')}
                            className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${viewMode === 'master_view' ? 'bg-east-light text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            Master View
                        </button>
                        <button
                            onClick={() => setViewMode('my_schedule')}
                            className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${viewMode === 'my_schedule' ? 'bg-east-light text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            My Schedule
                        </button>
                    </div>

                    <div className="h-6 w-px bg-white/10" />

                    <button onClick={fetchSchedule} className={`p-2 rounded-full hover:bg-white/10 transition-all ${refreshing ? 'animate-spin' : ''}`}>
                        <RefreshCw size={18} className="text-white" />
                    </button>
                    <button onClick={handleLogout} className="p-2 rounded-full hover:bg-red-500/20 hover:text-red-500 transition-colors">
                        <LogOut size={18} />
                    </button>
                </div>
            </div>

            {/* MAIN TIMELINE */}
            <div className="max-w-3xl mx-auto p-6 space-y-8 pb-24">

                {Object.keys(groupedSessions).length === 0 && (
                    <div className="text-center py-20 opacity-50">
                        <Calendar size={48} className="mx-auto mb-4" />
                        <h2 className="text-xl font-bold uppercase">No Scheduled {viewMode === 'my_schedule' ? 'Personal' : ''} Sessions</h2>
                        <p className="text-sm">The schedule is clear.</p>
                    </div>
                )}

                {Object.entries(groupedSessions).map(([date, daySessions]) => (
                    <div key={date} className="animate-fadeIn">
                        {/* Date Header */}
                        <div className="flex items-center gap-4 mb-4 sticky top-20 z-40 py-2 bg-[#0a0a0a]/50 backdrop-blur-xl pointer-events-none">
                            <h2 className="text-2xl font-black italic uppercase text-white/50">{date}</h2>
                            <div className="h-px bg-white/10 flex-1" />
                        </div>

                        {/* Sessions Grid */}
                        <div className="space-y-3">
                            {daySessions.map(session => (
                                <div key={session.id} className={`bg-[#121212] rounded-r-xl p-4 flex gap-4 ${getStatusColor(session)} shadow-lg hover:bg-[#1a1a1a] transition-colors group relative overflow-hidden`}>

                                    {/* Time Column */}
                                    <div className="flex flex-col items-center justify-center min-w-[60px] border-r border-white/5 pr-4">
                                        <span className="text-lg font-black italic leading-none">{new Date(session.start_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).replace(' ', '').toLowerCase()}</span>
                                        <span className="text-[9px] font-bold text-gray-600 uppercase mt-1">
                                            {Math.round((new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 60000)} MIN
                                        </span>
                                    </div>

                                    {/* Info Column */}
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className={`font-bold text-sm uppercase tracking-wide ${session.type === 'slot' ? 'text-gray-500' : 'text-white'}`}>{session.title}</h3>
                                                {getStatusBadge(session)}
                                            </div>
                                            <span className="text-[9px] font-bold text-gray-500 uppercase border border-white/10 px-1.5 py-0.5 rounded">{session.category}</span>
                                        </div>

                                        <div className="flex items-center gap-2 mb-3">
                                            <span className={`text-[10px] font-bold uppercase ${session.instructor.toLowerCase().includes(userName.toLowerCase()) ? 'text-east-light' : 'text-gray-500'}`}>
                                                {session.instructor}
                                            </span>
                                        </div>

                                        {/* Attendees Section */}
                                        {session.attendees.length > 0 ? (
                                            <div className="bg-black/40 rounded-lg p-2 border border-white/5">
                                                <div className="flex items-center gap-2 mb-1.5 opacity-50">
                                                    <Users size={10} />
                                                    <span className="text-[9px] font-bold uppercase tracking-widest">Attending ({session.attendees.length})</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {session.attendees.map(a => (
                                                        <div key={a.id} className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded select-all hover:bg-white/20 transition-colors cursor-default">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-east-light" />
                                                            <span className="text-[10px] font-bold uppercase">{a.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            session.type !== 'slot' && (
                                                <div className="text-[10px] font-bold text-gray-700 italic flex items-center gap-1 uppercase">
                                                    <AlertCircle size={10} /> No registered athletes
                                                </div>
                                            )
                                        )}
                                    </div>

                                </div>
                            ))}
                        </div>
                    </div>
                ))}

            </div>
        </div>
    );
}
