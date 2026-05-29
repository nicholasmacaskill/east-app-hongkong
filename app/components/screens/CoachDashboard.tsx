// app/components/screens/CoachDashboard.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import { useRouter } from 'next/navigation';
import { LogOut, RefreshCw, Calendar, Users, Clock, AlertCircle, ChevronDown, ChevronUp, Layers, FileText, X, Send, Play, MessageSquare } from 'lucide-react';
import { safeDate, safetoLocaleDateString, formatHK } from '@/app/lib/dateUtils';
import { safeFetch } from '@/app/lib/apiUtils';
import SessionPlanModal from '@/app/components/modals/SessionPlanModal';
import CreateDrillModal from '@/app/components/modals/CreateDrillModal';
import DrillDetailsModal from '@/app/components/modals/DrillDetailsModal';
import CommunityScreen from '@/app/components/CommunityScreen';
import PrivateMessenger from '@/app/components/PrivateMessenger';

interface Attendee {
    id: string;
    name: string;
    role: string;
    status?: string;
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
    status?: string;
}

export default function CoachDashboard({ currentUserId, userName, userLastName }: { currentUserId: string, userName: string, userLastName?: string }) {
    const [allSessions, setAllSessions] = useState<MasterSession[]>([]);
    const [filteredSessions, setFilteredSessions] = useState<MasterSession[]>([]);
    const [viewMode, setViewMode] = useState<'my_schedule' | 'master_view' | 'drill_hub' | 'community'>('master_view');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [collapsedDates, setCollapsedDates] = useState<string[]>([]);
    const [attendance, setAttendance] = useState<Record<string, boolean>>({});
    const [selectedAttendeeForNote, setSelectedAttendeeForNote] = useState<Attendee | null>(null);
    const [noteContent, setNoteContent] = useState('');
    const [savingNote, setSavingNote] = useState(false);
    const [existingNotes, setExistingNotes] = useState<any[]>([]);
    const [selectedSessionForPlan, setSelectedSessionForPlan] = useState<MasterSession | null>(null);
    
    // Drill Hub States
    const [drills, setDrills] = useState<any[]>([]);
    const [drillsLoading, setDrillsLoading] = useState(false);
    const [showCreateDrill, setShowCreateDrill] = useState(false);
    const [selectedDrill, setSelectedDrill] = useState<any | null>(null);

    const toggleDate = (date: string) => {
        setCollapsedDates(prev =>
            prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]
        );
    };

    const expandAll = () => setCollapsedDates([]);
    const collapseAll = () => setCollapsedDates(Object.keys(groupedSessions));

    const fetchSchedule = async () => {
        try {
            setRefreshing(true);
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const res = await safeFetch('/api/coach/master-schedule', {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });

            if (res.success) {
                setAllSessions(res.data);
            } else {
                console.error("Failed to fetch schedule", res.error);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchDrills = async () => {
        setDrillsLoading(true);
        const { data, error } = await supabase
            .from('coach_drills')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (!error && data) {
            setDrills(data);
        }
        setDrillsLoading(false);
    };

    useEffect(() => {
        fetchSchedule();
        fetchDrills();
    }, [currentUserId]);

    // Filter Logic
    useEffect(() => {
        if (viewMode === 'master_view') {
            setFilteredSessions(allSessions);
        } else {
            // LOGGING START
            console.log("🔍 CoachDashboard Debug:");
            console.log("CurrentUserID:", currentUserId);
            console.log("UserName:", userName, "LastName:", userLastName);
            console.log("Total Sessions:", allSessions.length);

            const myData = allSessions.filter(s => {
                if (s.type === 'slot') {
                    const match = s.coach_id === currentUserId;
                    // console.log(`Slot ${s.id} match: ${match} (coach_id: ${s.coach_id})`);
                    return match;
                } else {
                    const normalize = (name: string) => name?.replace(/\s+/g, ' ').trim().toLowerCase() || '';

                    const instructorName = normalize(s.instructor || '');
                    const coachFirst = (userName || '').trim().toLowerCase();
                    const coachLast = (userLastName || '').trim().toLowerCase();
                    const fullName = normalize(`${coachFirst} ${coachLast}`);

                    let isMatch = false;

                    // Only match if the instructor is this specific coach
                    if (instructorName === fullName) isMatch = true;
                    else if (instructorName === `coach ${fullName}`) isMatch = true;
                    else if (!coachLast && instructorName === normalize(coachFirst)) isMatch = true;
                    else if (!coachLast && instructorName === `coach ${normalize(coachFirst)}`) isMatch = true;
                    else if (instructorName === 'you') isMatch = true;

                    // Log sessions that FAIL the match but imply they are for this coach (debug helper)
                    if (!isMatch && instructorName.includes(coachFirst)) {
                        console.log(`❌ Filter Dropped Session: "${s.title}" | Instructor: "${s.instructor}" (Norm: "${instructorName}") vs Coach: "${fullName}"`);
                    }

                    return isMatch;
                }
            });
            console.log("Filtered Sessions:", myData.length);
            // LOGGING END

            setFilteredSessions(myData);
        }
    }, [viewMode, allSessions, currentUserId, userName, userLastName]);

    const openNoteModal = async (attendee: Attendee) => {
        setSelectedAttendeeForNote(attendee);
        setNoteContent('');
        setExistingNotes([]);
        // Fetch notes
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const res = await safeFetch(`/api/coach/notes?playerId=${attendee.id}`, {
            headers: { 'Authorization': token ? `Bearer ${token}` : '' }
        });

        if (res.success) {
            setExistingNotes(res.data);
        }
    };

    const handleSaveNote = async () => {
        if (!selectedAttendeeForNote || !noteContent.trim()) return;
        setSavingNote(true);
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const res = await safeFetch('/api/coach/notes', {
            method: 'POST',
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ playerId: selectedAttendeeForNote.id, content: noteContent })
        });

        if (res.success) {
            setNoteContent('');
            openNoteModal(selectedAttendeeForNote); // Refresh list
        }
        setSavingNote(false);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    // Helper to group by date
    const groupedSessions = filteredSessions.reduce((acc, session) => {
        const dateKey = safetoLocaleDateString(safeDate(session.start_time), undefined, { weekday: 'short', month: 'short', day: 'numeric' });
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(session);
        return acc;
    }, {} as Record<string, MasterSession[]>);

    // Helpers for styling
    const getStatusColor = (s: MasterSession) => {
        if (s.status === 'cancelled') return 'border-l-4 border-red-500 opacity-50 grayscale'; // Cancelled
        if (s.type === 'slot') return 'border-l-4 border-gray-500 opacity-70'; // Open Slot (Passive)
        if (s.attendees.filter(a => a.status !== 'cancelled').length > 0) return 'border-l-4 border-yellow-400'; // Booked
        if (s.category === 'FACILITY') return 'border-l-4 border-blue-500'; // Facility
        return 'border-l-4 border-emerald-500'; // Open Class
    };

    const getStatusBadge = (s: MasterSession) => {
        if (s.status === 'cancelled') return <span className="bg-red-500/20 text-red-500 text-[9px] font-black px-2 py-0.5 rounded uppercase whitespace-nowrap">CANCELLED</span>;
        if (s.type === 'slot') return <span className="bg-gray-800 text-gray-400 text-[9px] font-black px-2 py-0.5 rounded uppercase whitespace-nowrap">OPEN SLOT</span>;
        const activeAttendees = s.attendees.filter(a => a.status !== 'cancelled');
        if (activeAttendees.length > 0) return <span className="bg-yellow-400/20 text-yellow-400 text-[9px] font-black px-2 py-0.5 rounded uppercase whitespace-nowrap">{activeAttendees.length} Attendees</span>;
        return <span className="bg-emerald-500/20 text-emerald-500 text-[9px] font-black px-2 py-0.5 rounded uppercase whitespace-nowrap">OPEN CLASS</span>;
    };

    if (loading) return <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center font-black animate-pulse uppercase tracking-widest">Loading Master Schedule...</div>;

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-montserrat selection:bg-east-light selection:text-black">
            {/* TOP BAR */}
            <div className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/10 px-6 py-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div className="flex justify-between items-center w-full md:w-auto">
                    <div>
                        <h1 className="text-xl font-black italic uppercase tracking-tighter text-white">EAST <span className="text-east-light">COACH</span></h1>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Dashboard • {userName}</p>
                    </div>
                    {/* Mobile Only Logout - accessible without menu */}
                    <button onClick={handleLogout} className="md:hidden p-2 rounded-full hover:bg-red-500/20 text-gray-400 hover:text-red-500 transition-colors">
                        <LogOut size={18} />
                    </button>
                </div>

                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
                    {/* Availability Metric - Always Visible Now */}
                    <div className="flex flex-row justify-between w-full md:w-auto md:flex-col md:items-end mr-4 bg-[#121212] md:bg-transparent p-3 md:p-0 rounded-lg md:rounded-none border border-white/5 md:border-none">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Available Hours</span>
                        <span className="text-xl font-black italic text-[#28D160] leading-none">
                            {allSessions
                                .filter(s => s.type === 'slot' && s.coach_id === currentUserId)
                                .reduce((acc, curr) => {
                                    const end = safeDate(curr.end_time);
                                    const start = safeDate(curr.start_time);
                                    if (end && start) {
                                        return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                                    }
                                    return acc;
                                }, 0)
                                .toFixed(1)} <span className="text-xs text-gray-600 not-italic">HRS</span>
                        </span>
                    </div>

                    <div className="flex items-center justify-between w-full md:w-auto gap-4">
                        {/* View Toggles */}
                        <div className="bg-[#1e1e1e] p-1 rounded-lg flex border border-white/10 flex-1 md:flex-none justify-center">
                            <button
                                onClick={() => setViewMode('master_view')}
                                className={`flex-1 md:flex-none px-4 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${viewMode === 'master_view' ? 'bg-east-light text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                            >
                                Master View
                            </button>
                            <button
                                onClick={() => setViewMode('my_schedule')}
                                className={`flex-1 md:flex-none px-4 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${viewMode === 'my_schedule' ? 'bg-east-light text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                            >
                                My Schedule
                            </button>
                            <button
                                onClick={() => setViewMode('drill_hub')}
                                className={`flex-1 md:flex-none px-4 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${viewMode === 'drill_hub' ? 'bg-east-light text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                            >
                                Drill Hub
                            </button>
                            <button
                                onClick={() => setViewMode('community')}
                                className={`flex-1 md:flex-none px-4 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1.5 ${viewMode === 'community' ? 'bg-east-light text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                            >
                                <MessageSquare size={12} /> Messages
                            </button>
                        </div>

                        <div className="hidden md:block h-6 w-px bg-white/10" />

                        <div className="flex items-center gap-2">
                            <button onClick={fetchSchedule} className={`p-2 rounded-full hover:bg-white/10 transition-all ${refreshing ? 'animate-spin' : ''}`}>
                                <RefreshCw size={18} className="text-white" />
                            </button>
                            <button onClick={handleLogout} className="hidden md:block p-2 rounded-full hover:bg-red-500/20 hover:text-red-500 transition-colors">
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* QUICK ACTIONS BAR */}
            <div className="bg-[#121212] px-6 py-2 border-b border-white/5 flex justify-between items-center overflow-x-auto no-scrollbar">
                <button onClick={() => setViewMode('drill_hub')} data-testid="manage-drill-hub-btn" className="text-[9px] font-black uppercase text-black hover:text-black transition-colors flex items-center gap-1 bg-east-light hover:bg-white px-3 py-1.5 rounded-full border border-east-light/50 shadow-[0_0_10px_rgba(40,209,96,0.2)] whitespace-nowrap">
                    <Layers size={12} /> Manage Drill Hub
                </button>
                <div className="flex items-center gap-2 ml-auto">
                    <button onClick={expandAll} className="text-[9px] font-black uppercase text-gray-500 hover:text-east-light transition-colors flex items-center gap-1">
                        <ChevronDown size={12} /> Expand All
                    </button>
                    <div className="w-px h-3 bg-white/10" />
                    <button onClick={collapseAll} className="text-[9px] font-black uppercase text-gray-500 hover:text-east-light transition-colors flex items-center gap-1">
                        <ChevronUp size={12} /> Collapse All
                    </button>
                </div>
            </div>

            {/* MAIN TIMELINE */}
            <div className="max-w-3xl mx-auto p-6 space-y-8 pb-24">

                {viewMode === 'community' ? (
                    <div className="h-[80vh] -mx-6 -mt-6 rounded-3xl overflow-hidden border border-white/10 bg-black">
                        <PrivateMessenger currentUserId={currentUserId} />
                    </div>
                ) : viewMode === 'drill_hub' ? (
                    <div className="animate-fadeIn space-y-8">
                        <div className="flex justify-between items-center px-2">
                            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white brightness-125">Drill Library</h2>
                            <button 
                                onClick={() => setShowCreateDrill(true)}
                                className="px-6 py-2 bg-east-light text-black rounded-full text-[10px] font-black uppercase italic hover:bg-white transition-all shadow-[0_0_20px_rgba(40,209,96,0.3)] active:scale-95"
                            >
                                + Publish New
                            </button>
                        </div>

                        {drillsLoading ? (
                            <div className="py-20 text-center">
                                <RefreshCw className="animate-spin mx-auto mb-4 text-east-light" size={32} />
                                <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Loading Library...</p>
                            </div>
                        ) : drills.length === 0 ? (
                            <div className="py-20 text-center border border-dashed border-white/10 rounded-[2rem] bg-white/[0.02]">
                                <Layers className="mx-auto mb-4 text-gray-800" size={48} />
                                <p className="text-[10px] font-black uppercase text-gray-600 tracking-widest">No drills created yet</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-2">
                                {drills.map(drill => (
                                    <div 
                                        key={drill.id} 
                                        onClick={() => window.location.href = `/drill-hub?drill_id=${drill.id}`}
                                        className="relative overflow-hidden rounded-[2.5rem] border border-white/5 group cursor-pointer shadow-2xl bg-[#111] h-64 active:scale-[0.98] transition-all duration-500 hover:border-east-light/50 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                                    >
                                        <img 
                                            src={drill.thumbnail_url || "https://images.unsplash.com/photo-1580748141549-71748ddf0bdc?auto=format&fit=crop&q=80&w=800"} 
                                            className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-70 group-hover:scale-110 transition-all duration-1000" 
                                            alt={drill.title} 
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 z-10">
                                            <div className="w-16 h-16 rounded-[1.5rem] bg-white flex items-center justify-center pl-1">
                                                <Play fill="black" size={24} className="text-black" />
                                            </div>
                                        </div>
                                        <div className="absolute bottom-6 left-8 right-8 z-10">
                                            <h4 className="font-black italic text-2xl text-white uppercase leading-tight line-clamp-2 group-hover:text-east-light transition-colors">
                                                {drill.title}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                                                    {drill.skill_tags?.[0] || 'Fundamentals'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        {Object.keys(groupedSessions).length === 0 && (
                            <div className="text-center py-20 opacity-50">
                                <Calendar size={48} className="mx-auto mb-4" />
                                <h2 className="text-xl font-bold uppercase">No Scheduled {viewMode === 'my_schedule' ? 'Personal' : ''} Sessions</h2>
                                <p className="text-sm">The schedule is clear.</p>
                            </div>
                        )}

                        {Object.entries(groupedSessions).map(([date, daySessions]) => {
                            const isExpanded = !collapsedDates.includes(date);
                            console.log(`[DASHBOARD-DEBUG] date: "${date}" | collapsedDates:`, collapsedDates, "| isExpanded:", isExpanded, "| sessionsCount:", daySessions.length);
                            return (
                                <div key={date} className="animate-fadeIn mb-8">
                                    <button
                                        onClick={() => toggleDate(date)}
                                        className="w-full flex items-center gap-4 mb-4 sticky top-20 z-40 py-2 bg-[#0a0a0a]/50 backdrop-blur-xl group/header"
                                    >
                                        <div className={`p-1.5 rounded-lg border transition-all ${isExpanded ? 'bg-east-light border-east-light text-black' : 'bg-white/5 border-white/10 text-gray-500 group-hover/header:border-east-light'}`}>
                                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        </div>
                                        <h2 className={`text-2xl font-black italic uppercase transition-colors ${isExpanded ? 'text-white' : 'text-white/30 group-hover/header:text-white/50'}`}>{date}</h2>
                                        <div className={`h-px flex-1 transition-all ${isExpanded ? 'bg-east-light/30' : 'bg-white/10'}`} />
                                        <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{daySessions.length} {daySessions.length === 1 ? 'ITEM' : 'ITEMS'}</span>
                                    </button>

                                    {isExpanded && (
                                        <div className="space-y-3 animate-slideDown">
                                            {daySessions.map(session => (
                                                <div key={session.id} className={`bg-[#121212] rounded-r-xl p-4 flex gap-4 ${getStatusColor(session)} shadow-lg hover:bg-[#1a1a1a] transition-colors group relative overflow-hidden`}>
                                                    <div className="flex flex-col items-center justify-center min-w-[60px] border-r border-white/5 pr-4">
                                                        <span className="text-lg font-black italic leading-none">{formatHK(session.start_time, 'h:mma').toLowerCase()}</span>
                                                        <span className="text-[9px] font-bold text-gray-600 uppercase mt-1">
                                                            {Math.round(((safeDate(session.end_time)?.getTime() || 0) - (safeDate(session.start_time)?.getTime() || 0)) / 60000)} MIN
                                                        </span>
                                                    </div>

                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start gap-4 mb-1">
                                                            <div className="flex flex-wrap items-center gap-2 flex-1">
                                                                <h3 className={`font-bold text-sm uppercase tracking-wide leading-tight ${session.type === 'slot' ? 'text-gray-500' : 'text-white'}`}>{session.title}</h3>
                                                                {getStatusBadge(session)}
                                                            </div>
                                                            <div className="flex flex-col items-end gap-2 shrink-0">
                                                                <span className="text-[9px] font-bold text-gray-500 uppercase border border-white/10 px-1.5 py-0.5 rounded">{session.category}</span>
                                                                {session.type !== 'slot' && (
                                                                    <button 
                                                                        onClick={(e) => { e.stopPropagation(); setSelectedSessionForPlan(session); }} 
                                                                        className="text-[9px] font-black uppercase text-[#28D160] hover:text-white transition-colors flex items-center gap-1 bg-[#28D160]/10 hover:bg-[#28D160]/20 px-2 py-1 rounded whitespace-nowrap"
                                                                    >
                                                                        <Layers size={10} /> Build Plan
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 mb-3">
                                                            <span className={`text-[10px] font-bold uppercase ${(session.instructor?.toLowerCase() || '').includes(userName?.toLowerCase() || '') ? 'text-east-light' : 'text-gray-500'}`}>
                                                                {session.instructor}
                                                            </span>
                                                        </div>

                                                        {session.attendees.length > 0 ? (
                                                            <div className="bg-black/40 rounded-lg p-2 border border-white/5">
                                                                <div className="flex items-center gap-2 mb-1.5 opacity-50">
                                                                    <Users size={10} />
                                                                    <span className="text-[9px] font-bold uppercase tracking-widest">Attending ({session.attendees.length})</span>
                                                                </div>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {session.attendees.map(a => {
                                                                        const key = `${session.id}-${a.id}`;
                                                                        const isPresent = attendance[key];

                                                                        const toggleAttendance = async (sessionId: any, attendeeId: string) => {
                                                                            const k = `${sessionId}-${attendeeId}`;
                                                                            const newState = !attendance[k];
                                                                            setAttendance(prev => ({ ...prev, [k]: newState }));
                                                                        };

                                                                        return (
                                                                            <div key={a.id} className="flex items-center gap-2">
                                                                                <div
                                                                                    onClick={() => a.status !== 'cancelled' && toggleAttendance(session.id, a.id)}
                                                                                    className={`flex items-center gap-1.5 px-2 py-1 rounded select-none transition-all ${a.status === 'cancelled' ? 'bg-red-500/10 text-red-500/50 border border-red-500/10 cursor-not-allowed opacity-50' : isPresent ? 'bg-east-light text-black border border-east-light shadow-[0_0_10px_rgba(40,209,96,0.3)] cursor-pointer' : 'bg-white/10 text-white/50 border border-white/5 hover:bg-white/20 cursor-pointer'}`}
                                                                                >
                                                                                    <div className={`w-1.5 h-1.5 rounded-full ${a.status === 'cancelled' ? 'bg-red-500' : isPresent ? 'bg-black animate-pulse' : 'bg-gray-600'}`} />
                                                                                    <span className={`text-[10px] font-black uppercase text-inherit ${a.status === 'cancelled' ? 'line-through decoration-red-500/50' : ''}`}>{a.name}</span>
                                                                                </div>
                                                                                <button
                                                                                    onClick={(e) => { e.stopPropagation(); openNoteModal(a); }}
                                                                                    className="p-1.5 rounded bg-white/5 hover:bg-east-light hover:text-black text-gray-400 transition-all border border-white/5"
                                                                                >
                                                                                    <FileText size={12} />
                                                                                </button>
                                                                            </div>
                                                                        );
                                                                    })}
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
                                    )}
                                </div>
                            );
                        })}
                    </>
                )}

            </div>

            {/* PRIVATE NOTE MODAL */}
            {selectedAttendeeForNote && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
                    <div className="w-full max-w-md bg-[#121212] rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col max-h-[80vh]">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-east-light to-east-dark p-4 flex justify-between items-center">
                            <div>
                                <h2 className="font-black italic text-lg text-black uppercase leading-none">PLAYER NOTES</h2>
                                <p className="text-[10px] font-bold text-black/60 uppercase tracking-widest mt-1">PRIVATE • {selectedAttendeeForNote.name}</p>
                            </div>
                            <button onClick={() => setSelectedAttendeeForNote(null)} className="p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors">
                                <X size={20} className="text-black" />
                            </button>
                        </div>

                        {/* Note Input */}
                        <div className="p-6 border-b border-white/5 bg-black/40">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 block">New Performance Note</label>
                            <div className="relative">
                                <textarea
                                    value={noteContent}
                                    onChange={(e) => setNoteContent(e.target.value)}
                                    placeholder="Add private feedback, strengths, or areas for improvement..."
                                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl p-4 text-sm text-white focus:border-east-light outline-none min-h-[100px] font-medium placeholder:text-gray-700 transition-all"
                                />
                                <button
                                    onClick={handleSaveNote}
                                    disabled={savingNote || !noteContent.trim()}
                                    className="absolute bottom-3 right-3 p-2 bg-east-light text-black rounded-lg hover:bg-white transition-all disabled:opacity-30 disabled:hover:bg-east-light"
                                >
                                    {savingNote ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Send size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Existing Notes List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 hide-scrollbar">
                            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Note History</h3>
                            {existingNotes.length === 0 ? (
                                <div className="text-center py-10 opacity-30">
                                    <FileText size={32} className="mx-auto mb-2" />
                                    <p className="text-[10px] font-bold uppercase">No private notes yet</p>
                                </div>
                            ) : (
                                existingNotes.map((note) => (
                                    <div key={note.id} className="bg-white/5 rounded-2xl p-4 border border-white/5 animate-slideDown">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[8px] font-black text-east-light uppercase tracking-tighter">
                                                {safetoLocaleDateString(safeDate(note.created_at), [], { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                            <span className="text-[8px] font-bold text-gray-600 uppercase">
                                                {formatHK(note.created_at, 'h:mm a')}
                                            </span>
                                        </div>
                                        <p className="text-xs text-white/90 leading-relaxed font-medium">{note.content}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* DRILL MODALS */}
            {showCreateDrill && (
                <CreateDrillModal 
                    coachId={currentUserId} 
                    onClose={() => setShowCreateDrill(false)} 
                    onSuccess={() => {
                        setShowCreateDrill(false);
                        fetchDrills();
                    }}
                />
            )}

            {selectedDrill && (
                <DrillDetailsModal 
                    drill={selectedDrill} 
                    onClose={() => setSelectedDrill(null)} 
                    isCoach={true}
                />
            )}

            {/* SESSION PLAN MODAL */}
            {selectedSessionForPlan && (
                <SessionPlanModal 
                    sessionData={selectedSessionForPlan} 
                    onClose={() => setSelectedSessionForPlan(null)} 
                />
            )}
        </div>
    );
}
