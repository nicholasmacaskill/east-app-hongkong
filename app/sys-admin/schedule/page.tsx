// app/sys-admin/schedule/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import { ChevronLeft, Calendar, User, LayoutGrid, RefreshCw, Plus, X, Trash2, Save, Clock, Info, DollarSign } from 'lucide-react';
import Link from 'next/link';

// Types
interface Session {
    id?: number;
    title: string;
    start_time: string;
    end_time: string;
    category: string;
    instructor: string;
    total_facility_bays: number;
    max_capacity: number;
    credit_cost: number;
}

interface Coach {
    id: string;
    first_name: string;
    last_name: string;
}

// Fixed Resources for Grid
const RESOURCES = [
    { id: 'bay_1', name: 'The Blue Bay', type: 'facility' },
    { id: 'bay_2', name: 'Shooting Bay', type: 'facility' },
    { id: 'bay_3', name: 'Trackman 1', type: 'facility' },
    { id: 'bay_4', name: 'Trackman 2', type: 'facility' },
    { id: 'coach_col', name: 'Coach Tracking', type: 'coach' }, // Visualization of coach sessions
];

const CATEGORIES = ['Open Gym', 'Private Lesson', 'Class', 'Elite Training', 'Special Event'];

const TIME_SLOTS = Array.from({ length: 15 }, (_, i) => {
    const hour = i + 8;
    return `${hour < 10 ? '0' : ''}${hour}:00`;
});

export default function MasterSchedule() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [coaches, setCoaches] = useState<Coach[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // UI States
    const [showModal, setShowModal] = useState(false);
    const [modalAction, setModalAction] = useState<'CREATE' | 'EDIT'>('CREATE');
    const [editingSession, setEditingSession] = useState<any>(null);

    useEffect(() => {
        fetchSchedule();
        fetchCoaches();
    }, [selectedDate]);

    const fetchSchedule = async () => {
        setLoading(true);
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        const { data, error } = await supabase
            .from('sessions')
            .select('*')
            .gte('start_time', startOfDay.toISOString())
            .lte('start_time', endOfDay.toISOString())
            .order('start_time');

        if (error) console.error('Error:', error);
        else setSessions(data || []);
        setLoading(false);
    };

    const fetchCoaches = async () => {
        const { data } = await supabase.from('profiles').select('id, first_name, last_name').eq('role', 'coach');
        setCoaches(data || []);
    };

    const handleCellClick = (timeSlot: string) => {
        const start = `${selectedDate}T${timeSlot}:00`;
        const nextHour = (parseInt(timeSlot) + 1).toString().padStart(2, '0');
        const end = `${selectedDate}T${nextHour}:00`;

        setModalAction('CREATE');
        setEditingSession({
            title: '',
            category: 'Open Gym',
            instructor: '',
            start_time: start,
            end_time: end,
            total_facility_bays: 1,
            max_capacity: 4,
            credit_cost: 100 // Default cost
        });
        setShowModal(true);
    };

    const handleSessionClick = (session: Session) => {
        setModalAction('EDIT');
        setEditingSession({ ...session });
        setShowModal(true);
    };

    const handleSaveSession = async () => {
        if (!editingSession.title || !editingSession.start_time || !editingSession.end_time) {
            alert("Title and times are required.");
            return;
        }

        try {
            const res = await fetch('/api/admin/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: modalAction,
                    id: editingSession.id,
                    sessionData: editingSession
                })
            });
            const data = await res.json();
            if (data.success) {
                setShowModal(false);
                fetchSchedule();
            } else {
                alert(data.error);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteSession = async () => {
        if (!confirm("Are you sure you want to delete this session?")) return;
        try {
            const res = await fetch('/api/admin/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'DELETE',
                    id: editingSession.id
                })
            });
            const data = await res.json();
            if (data.success) {
                setShowModal(false);
                fetchSchedule();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const getCellContent = (resourceId: string, timeSlot: string) => {
        const slotStart = new Date(`${selectedDate}T${timeSlot}:00`);
        const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);

        const activeSessions = sessions.filter(s => {
            const sessStart = new Date(s.start_time);
            const sessEnd = new Date(s.end_time);
            return sessStart < slotEnd && sessEnd > slotStart;
        });

        if (activeSessions.length === 0) return null;

        for (const session of activeSessions) {
            // Coach Column Visualization (shows ANY session with an instructor)
            if (resourceId === 'coach_col' && session.instructor) {
                return { session, type: 'instructor', title: session.instructor, color: 'bg-blue-600' };
            }

            // Facility Bays
            if (resourceId.startsWith('bay_') && session.total_facility_bays > 0) {
                const bayNum = parseInt(resourceId.replace('bay_', ''));
                if (bayNum <= session.total_facility_bays) {
                    return { session, type: 'facility', title: session.title, color: 'bg-[#28D160] text-black' };
                }
            }
        }
        return null;
    };

    return (
        <div className="flex flex-col gap-6 animate-fadeIn pb-20 min-h-screen bg-black text-white p-6 font-montserrat select-none">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/sys-admin" className="p-2 bg-[#1e1e1e] rounded-lg hover:bg-[#28D160] hover:text-black transition-colors">
                        <ChevronLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black italic uppercase tracking-tighter">Master Schedule</h1>
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Global Facility Editor</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-[#1e1e1e] rounded-lg px-3 py-2 gap-2 border border-white/10">
                        <Calendar size={16} className="text-gray-400" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={e => setSelectedDate(e.target.value)}
                            className="bg-transparent outline-none text-xs font-bold uppercase tracking-widest text-white"
                        />
                    </div>
                    <button onClick={fetchSchedule} className="p-2 bg-[#1e1e1e] rounded-lg hover:bg-white/10 transition-colors">
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-x-auto border border-white/10 rounded-2xl bg-[#1e1e1e] shadow-2xl">
                <div className="min-w-[1000px]">
                    {/* Header Row */}
                    <div className="flex border-b border-white/10 sticky top-0 bg-[#1e1e1e] z-10">
                        <div className="w-20 p-4 border-r border-white/10 font-bold text-xs text-gray-500 uppercase tracking-wider bg-[#151515]">Time</div>
                        {RESOURCES.map(resource => (
                            <div key={resource.id} className="flex-1 p-4 border-r border-white/10 min-w-[120px] text-center bg-[#151515]">
                                <span className={`text-[10px] font-black uppercase italic tracking-widest ${resource.type === 'coach' ? 'text-blue-400' : 'text-[#28D160]'}`}>
                                    {resource.name}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Time Slots */}
                    {TIME_SLOTS.map(time => (
                        <div key={time} className="flex border-b border-white/5 hover:bg-white/5 transition-colors group h-20">
                            <div className="w-20 p-3 border-r border-white/10 flex items-center justify-center text-[10px] font-black text-gray-500 bg-[#1e1e1e] group-hover:bg-[#252525] sticky left-0 z-10">
                                {time}
                            </div>

                            {RESOURCES.map(resource => {
                                const content = getCellContent(resource.id, time);
                                return (
                                    <div
                                        key={`${resource.id}-${time}`}
                                        className="flex-1 border-r border-white/5 min-w-[120px] relative p-1 cursor-crosshair group/cell"
                                        onClick={() => content ? handleSessionClick(content.session) : handleCellClick(time)}
                                    >
                                        {content ? (
                                            <div className={`w-full h-full rounded-lg ${content.color} p-2 text-xs flex flex-col justify-center shadow-lg transition-transform hover:scale-[1.02] active:scale-95`}>
                                                <span className="font-black uppercase tracking-tight leading-tight line-clamp-1">{content.title}</span>
                                                <span className="text-[8px] opacity-70 uppercase font-bold tracking-widest mt-0.5">{content.type === 'instructor' ? 'Coach' : 'Facility'}</span>
                                            </div>
                                        ) : (
                                            <div className="w-full h-full opacity-0 group-hover/cell:opacity-100 flex items-center justify-center transition-opacity">
                                                <Plus size={16} className="text-[#28D160]" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Session Editor Modal */}
            {showModal && editingSession && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#1e1e1e] p-8 rounded-[2rem] w-full max-w-lg border border-white/10 shadow-2xl overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="font-black italic text-2xl uppercase tracking-tighter text-[#28D160]">
                                    {modalAction === 'CREATE' ? 'Add Session' : 'Edit Session'}
                                </h2>
                                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Global Resource Allocation</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-500 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-5">
                            {/* Title */}
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Session Title</label>
                                <input
                                    value={editingSession.title}
                                    onChange={e => setEditingSession({ ...editingSession, title: e.target.value })}
                                    placeholder="e.g. U14 Shooting Drills"
                                    className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-[#28D160] transition-colors"
                                />
                            </div>

                            {/* Category & Instructor */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Category</label>
                                    <select
                                        value={editingSession.category}
                                        onChange={e => setEditingSession({ ...editingSession, category: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-[#28D160] text-sm uppercase font-bold"
                                    >
                                        <option value="FACILITY">Open Gym (Facility)</option>
                                        <option value="PRIVATE">Private Lesson</option>
                                        <option value="CLASS">Class</option>
                                        <option value="EVENT">Special Event</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Instructor</label>
                                    <select
                                        value={editingSession.instructor}
                                        onChange={e => setEditingSession({ ...editingSession, instructor: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-[#28D160] text-sm font-bold"
                                    >
                                        <option value="">None</option>
                                        {coaches.map(c => (
                                            <option key={c.id} value={`${c.first_name} ${c.last_name}`}>
                                                {c.first_name} {c.last_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Credit Cost */}
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1 block flex items-center gap-1">
                                    <DollarSign size={10} /> Credit Cost
                                </label>
                                <input
                                    type="number"
                                    value={editingSession.credit_cost}
                                    onChange={e => setEditingSession({ ...editingSession, credit_cost: parseInt(e.target.value) })}
                                    className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-[#28D160] transition-colors"
                                />
                            </div>

                            {/* Start & End Times */}
                            <div className="grid grid-cols-2 gap-4 bg-black/20 p-4 rounded-2xl border border-white/5">
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1 block flex items-center gap-1">
                                        <Clock size={10} /> Start Time
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={editingSession.start_time.slice(0, 16)}
                                        onChange={e => setEditingSession({ ...editingSession, start_time: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 p-2 rounded-lg text-[11px] text-white outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1 block flex items-center gap-1">
                                        <Clock size={10} /> End Time
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={editingSession.end_time.slice(0, 16)}
                                        onChange={e => setEditingSession({ ...editingSession, end_time: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 p-2 rounded-lg text-[11px] text-white outline-none"
                                    />
                                </div>
                            </div>

                            {/* Capacity & Bays */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Facility Bays (1-4)</label>
                                    <input
                                        type="number"
                                        min="0" max="4"
                                        value={editingSession.total_facility_bays}
                                        onChange={e => setEditingSession({ ...editingSession, total_facility_bays: parseInt(e.target.value) })}
                                        className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-[#28D160]"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Max Users</label>
                                    <input
                                        type="number"
                                        value={editingSession.max_capacity}
                                        onChange={e => setEditingSession({ ...editingSession, max_capacity: parseInt(e.target.value) })}
                                        className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-[#28D160]"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button
                                    onClick={handleSaveSession}
                                    className="flex-1 bg-[#28D160] text-black font-black italic uppercase text-sm py-4 rounded-xl hover:bg-white transition-all shadow-xl shadow-[#28D160]/10 flex items-center justify-center gap-2"
                                >
                                    <Save size={18} /> Save Session
                                </button>
                                {modalAction === 'EDIT' && (
                                    <button
                                        onClick={handleDeleteSession}
                                        className="bg-red-600/20 text-red-500 border border-red-500/30 p-4 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
