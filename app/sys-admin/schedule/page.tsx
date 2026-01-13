// app/sys-admin/schedule/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import { ChevronLeft, Calendar, User, LayoutGrid, RefreshCw, Plus, X, Trash2, Save, Clock, Info, DollarSign, Upload } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Types
interface Session {
    id?: number;
    title: string;
    description?: string;
    image_url?: string;
    start_time: string;
    end_time: string;
    category: string;
    instructor: string;
    total_facility_bays: number;
    max_capacity: number;
    credit_cost: number;
    session_type_id?: string;
}

interface Service {
    id: string;
    title: string;
    category: string;
}

interface Coach {
    id: string;
    first_name: string;
    last_name: string;
}

const CATEGORIES = ['FACILITY', 'PRIVATE', 'CLASS', 'EVENT']; // Updated to match Enum values for safety

// ... (Rest of file unchanged until Modal)

// Inside Modal (This replace block is too high up, I need to check line numbers for Modal content)
// I will split this into two replacements if needed or target carefully.
// The file is 406 lines. Modal is around line 265.
// I can insert the constant at the top first (StartLine 25), then the UI in the modal (StartLine 280).

// Let's do the constant first.

export default function MasterSchedule() {
    const searchParams = useSearchParams();
    const autoInstructor = searchParams?.get('instructor');
    const hasAutoOpened = React.useRef(false);

    const [sessions, setSessions] = useState<Session[]>([]);
    const [availability, setAvailability] = useState<any[]>([]);
    const [coaches, setCoaches] = useState<Coach[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [coachServices, setCoachServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [activeCategory, setActiveCategory] = useState<string>(searchParams?.get('category')?.toUpperCase() || 'ALL');

    // UI States
    const [showModal, setShowModal] = useState(false);
    const [modalAction, setModalAction] = useState<'CREATE' | 'EDIT'>('CREATE');
    const [editingSession, setEditingSession] = useState<any>(null);
    const [recurring, setRecurring] = useState(false);
    const [repeatDays, setRepeatDays] = useState<number[]>([]); // 0-6 (Sun-Sat)
    const [repeatWeeks, setRepeatWeeks] = useState(4);

    useEffect(() => {
        if (autoInstructor && !hasAutoOpened.current) {
            hasAutoOpened.current = true;
            // Set slight timeout to allow coaches to load? Not strictly needed for string match
            setModalAction('CREATE');

            // Calculate next hour for default time
            const now = new Date();
            now.setMinutes(0, 0, 0);
            const start = new Date(now.getTime() + 60 * 60 * 1000).toISOString(); // Next hour
            const end = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(); // 1 hour duration

            setEditingSession({
                title: `${autoInstructor} - Session`,
                category: 'PRIVATE',
                instructor: autoInstructor,
                start_time: start, // Use ISO String
                end_time: end,
                total_facility_bays: 0,
                max_capacity: 1,
                credit_cost: 100,
                session_type_id: null,
                lockInstructor: true
            });
            setShowModal(true);
        }
    }, [autoInstructor]);

    useEffect(() => {
        fetchSchedule();
        fetchCoaches();
        fetchServices();
        fetchCoachServices();
    }, [selectedDate, activeCategory]);

    const fetchServices = async () => {
        const { data } = await supabase.from('session_types').select('*').order('title');
        setServices(data || []);
    };

    const fetchCoachServices = async () => {
        const { data } = await supabase.from('coach_services').select('*');
        setCoachServices(data || []);
    };

    const fetchSchedule = async () => {
        setLoading(true);
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        // 1. Fetch Sessions
        let query = supabase.from('sessions').select('*');

        if (activeCategory === 'EVENT') {
            // For Events, we show all UPCOMING events across all dates
            const now = new Date();
            query = query.gte('start_time', now.toISOString()).eq('category', 'EVENT');
        } else {
            // For others, we stick to the selected date
            query = query.gte('start_time', startOfDay.toISOString()).lte('start_time', endOfDay.toISOString());
        }

        const { data: sessData, error: sessError } = await query.order('start_time');

        if (sessError) console.error('Error fetching sessions:', sessError);
        else setSessions(sessData || []);

        // 2. Fetch Availability (Open Slots) - Restricted to the selected date
        const { data: availData, error: availError } = await supabase
            .from('availability')
            .select(`
                *,
                profiles:coach_id ( first_name, last_name, avatar_url )
            `)
            .gte('start_time', startOfDay.toISOString())
            .lte('start_time', endOfDay.toISOString())
            .eq('status', 'available');

        if (availError) console.error('Error fetching availability:', availError);
        else setAvailability(availData || []);

        setLoading(false);
    };

    const fetchCoaches = async () => {
        const { data } = await supabase.from('profiles').select('id, first_name, last_name').eq('role', 'coach');
        if (data) {
            const normalized = data.map(c => ({
                ...c,
                first_name: c.first_name?.trim() || '',
                last_name: c.last_name?.trim() || ''
            }));
            setCoaches(normalized);
        }
    };

    const handleCellClick = (timeSlot: string) => {
        const start = `${selectedDate}T${timeSlot}:00`;
        const nextHour = (parseInt(timeSlot) + 1).toString().padStart(2, '0');
        const end = `${selectedDate}T${nextHour}:00`;

        setModalAction('CREATE');
        setEditingSession({
            title: '',
            category: 'FACILITY',
            instructor: '',
            start_time: start,
            end_time: end,
            total_facility_bays: 1,
            max_capacity: 4,
            credit_cost: 100, // Default cost
            session_type_id: null,
            description: '',
            image_url: ''
        });
        setShowModal(true);
    };

    const handleSessionClick = (session: Session) => {
        setModalAction('EDIT');
        setEditingSession({ ...session, lockInstructor: !!session.instructor });
        setShowModal(true);
    };

    const handleSaveSession = async () => {
        if (!editingSession.title || !editingSession.start_time || !editingSession.end_time) {
            alert("Title and times are required.");
            return;
        }

        try {
            const { lockInstructor, ...cleanSessionData } = editingSession;
            let sessionsToCreate = [cleanSessionData];

            if (recurring && modalAction === 'CREATE') {
                const start = new Date(cleanSessionData.start_time);
                const end = new Date(cleanSessionData.end_time);
                sessionsToCreate = [];

                for (let w = 0; w < repeatWeeks; w++) {
                    for (const day of repeatDays) {
                        // Find the target day in the current week loop
                        const targetDate = new Date(start);
                        targetDate.setDate(start.getDate() + (w * 7) + (day - start.getDay()));

                        // Skip if it is in the past compared to the first start time
                        if (targetDate < start && w === 0) continue;

                        const diff = targetDate.getTime() - start.getTime();
                        const newStart = new Date(start.getTime() + diff);
                        const newEnd = new Date(end.getTime() + diff);

                        sessionsToCreate.push({
                            ...cleanSessionData,
                            start_time: newStart.toISOString(),
                            end_time: newEnd.toISOString()
                        });
                    }
                }
            }

            const res = await fetch('/api/admin/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: modalAction,
                    id: editingSession.id,
                    // If creating, we might send an array (the API handles single insert currently, but `.insert([sessionData])` works for arrays too)
                    sessionData: sessionsToCreate.length > 1 ? sessionsToCreate : sessionsToCreate[0]
                })
            });
            const data = await res.json();
            if (data.success) {
                setShowModal(false);
                setRecurring(false);
                setRepeatDays([]);
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

            {/* Category Toggles */}
            <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2">
                {['ALL', 'PRIVATE', 'FACILITY', 'CLASS', 'EVENT'].map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${activeCategory === cat ? 'bg-[#28D160] border-[#28D160] text-black shadow-lg shadow-[#28D160]/20' : 'bg-[#1e1e1e] border-white/5 text-gray-500 hover:border-white/20'}`}
                    >
                        {cat === 'ALL' ? 'Everything' : cat.replace('_', ' ')}
                    </button>
                ))}
            </div>

            {/* Timeline View */}
            <div className="flex-1 space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                        <RefreshCw size={48} className="animate-spin mb-4" />
                        <p className="font-bold uppercase tracking-widest text-xs">Syncing Schedule...</p>
                    </div>
                ) : (() => {
                    // Merge and Filter Items
                    const mergedItems = [
                        ...sessions.map(s => ({ ...s, type: 'session' })),
                        ...availability.map(a => ({
                            id: a.id,
                            title: 'Open Slot',
                            category: 'PRIVATE',
                            instructor: `${a.profiles?.first_name} ${a.profiles?.last_name || ''}`.trim(),
                            start_time: a.start_time,
                            end_time: a.end_time,
                            type: 'slot',
                            coach_id: a.coach_id
                        }))
                    ].filter(item => {
                        if (activeCategory === 'ALL') return true;
                        return item.category === activeCategory;
                    }).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

                    const sortedItems = mergedItems.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

                    // Group by Date for Multi-Day events or clear timeline
                    const grouped = sortedItems.reduce((acc: any, item: any) => {
                        const dateKey = new Date(item.start_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                        if (!acc[dateKey]) acc[dateKey] = [];
                        acc[dateKey].push(item);
                        return acc;
                    }, {});

                    if (sortedItems.length === 0) {
                        return (
                            <div className="text-center py-20 bg-[#1e1e1e] rounded-3xl border border-dashed border-white/10">
                                <Plus size={48} className="mx-auto mb-4 text-gray-700" />
                                <h3 className="text-xl font-black italic uppercase text-gray-500">No {activeCategory !== 'ALL' ? activeCategory.toLowerCase() : ''} items scheduled</h3>
                                <button
                                    onClick={() => handleCellClick("09:00")}
                                    className="mt-4 bg-[#28D160]/10 text-[#28D160] px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest hover:bg-[#28D160]/20 transition-colors"
                                >
                                    Add First Entry
                                </button>
                            </div>
                        );
                    }

                    return Object.entries(grouped).map(([date, dayItems]: [string, any]) => (
                        <div key={date} className="animate-fadeIn pb-6">
                            <div className="flex items-center gap-4 mb-4 sticky top-0 z-10 py-2 bg-black/50 backdrop-blur-xl">
                                <h2 className="text-xl font-black italic uppercase text-white/50">{date}</h2>
                                <div className="h-px bg-white/10 flex-1" />
                            </div>

                            <div className="space-y-3">
                                {dayItems.map((item: any, idx: number) => {
                                    const isSlot = item.type === 'slot';
                                    const startTime = new Date(item.start_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase();
                                    const duration = Math.round((new Date(item.end_time).getTime() - new Date(item.start_time).getTime()) / 60000);

                                    return (
                                        <div
                                            key={item.id || idx}
                                            onClick={() => {
                                                if (isSlot) {
                                                    setModalAction('CREATE');
                                                    setEditingSession({
                                                        title: `${item.instructor} - Session`,
                                                        category: 'PRIVATE',
                                                        instructor: item.instructor,
                                                        start_time: item.start_time,
                                                        end_time: item.end_time,
                                                        total_facility_bays: 0,
                                                        max_capacity: 1,
                                                        credit_cost: 100,
                                                        session_type_id: null,
                                                        lockInstructor: true,
                                                        description: '',
                                                        image_url: ''
                                                    });
                                                    setShowModal(true);
                                                } else {
                                                    handleSessionClick(item);
                                                }
                                            }}
                                            className={`group flex gap-4 p-4 rounded-2xl transition-all cursor-pointer border ${isSlot ? 'bg-black/20 border-white/5 border-dashed hover:border-[#28D160]/30' : 'bg-[#1e1e1e] border-white/10 hover:border-[#28D160] hover:shadow-xl hover:shadow-[#28D160]/5'}`}
                                        >
                                            {/* Time Column */}
                                            <div className="flex flex-col items-center justify-center min-w-[70px] border-r border-white/5 pr-4">
                                                <span className={`text-lg font-black italic leading-none ${isSlot ? 'text-gray-600' : 'text-white'}`}>{startTime}</span>
                                                <span className="text-[9px] font-bold text-gray-600 uppercase mt-1">{duration} MIN</span>
                                            </div>

                                            {/* Info Column */}
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className={`font-black uppercase tracking-tight text-sm ${isSlot ? 'text-gray-600 italic' : 'text-white'}`}>
                                                            {item.title}
                                                        </h3>
                                                        {isSlot ? (
                                                            <span className="bg-white/5 text-gray-500 text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">Available</span>
                                                        ) : (
                                                            <span className={`${item.category === 'FACILITY' ? 'bg-[#28D160]/10 text-[#28D160]' : 'bg-blue-500/10 text-blue-400'} text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-tighter`}>
                                                                {item.category}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {!isSlot && (
                                                        <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                                            <Info size={12} />
                                                            <span className="text-[10px] font-bold uppercase tracking-widest">{item.total_facility_bays > 0 ? `${item.total_facility_bays} Bays` : 'No Bays'}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <User size={12} className={isSlot ? 'text-gray-700' : 'text-[#28D160]'} />
                                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isSlot ? 'text-gray-600' : 'text-gray-300'}`}>
                                                            {item.instructor || 'Unassigned'}
                                                        </span>
                                                    </div>
                                                    {!isSlot && (
                                                        <span className="text-[10px] font-black italic text-[#28D160]">
                                                            {item.credit_cost} <span className="text-[8px] not-italic text-gray-600">CREDITS</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ));
                })()}
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
                            {/* Service Selection */}
                            <div className="space-y-4 bg-black/20 p-4 rounded-2xl border border-white/5">
                                <div>
                                    <label className="text-[10px] font-black text-[#28D160] uppercase tracking-widest ml-1 mb-1 block">
                                        Select Service Type
                                    </label>
                                    <select
                                        value={editingSession.session_type_id || ''}
                                        onChange={e => {
                                            const svc = services.find(s => s.id === e.target.value);
                                            if (svc) {
                                                setEditingSession({
                                                    ...editingSession,
                                                    session_type_id: svc.id,
                                                    category: svc.category,
                                                    title: svc.title
                                                });
                                            } else {
                                                setEditingSession({ ...editingSession, session_type_id: null, category: 'FACILITY' });
                                            }
                                        }}
                                        className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-[#28D160] text-sm font-bold"
                                    >
                                        <option value="">-- CUSTOM / FACILITY --</option>
                                        <optgroup label="CLASSES">
                                            {services.filter(s => s.category === 'CLASS').map(s => (
                                                <option key={s.id} value={s.id}>{s.title}</option>
                                            ))}
                                        </optgroup>
                                        <optgroup label="PRIVATE LESSONS">
                                            {services.filter(s => s.category === 'PRIVATE').map(s => (
                                                <option key={s.id} value={s.id}>{s.title}</option>
                                            ))}
                                        </optgroup>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Public Display Title</label>
                                    <input
                                        value={editingSession.title}
                                        onChange={e => setEditingSession({ ...editingSession, title: e.target.value })}
                                        placeholder="e.g. U14 Shooting Drills"
                                        className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-[#28D160] transition-colors font-bold"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1 block flex items-center gap-1">
                                        <Info size={10} /> Description
                                    </label>
                                    <textarea
                                        value={editingSession.description || ''}
                                        onChange={e => setEditingSession({ ...editingSession, description: e.target.value })}
                                        placeholder="Event details, location, etc."
                                        rows={3}
                                        className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-[#28D160] text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1 block flex items-center gap-1">
                                        <Upload size={10} /> Promo Image URL
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            value={editingSession.image_url || ''}
                                            onChange={e => setEditingSession({ ...editingSession, image_url: e.target.value })}
                                            placeholder="https://..."
                                            className="flex-1 bg-black/50 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-[#28D160] text-xs"
                                        />
                                        {editingSession.image_url && (
                                            <div className="w-12 h-12 rounded-lg border border-white/10 overflow-hidden shrink-0">
                                                <img src={editingSession.image_url} className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Category & Instructor */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Category Override</label>
                                    <select
                                        value={editingSession.category}
                                        onChange={e => setEditingSession({ ...editingSession, category: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-[#28D160] text-[10px] uppercase font-bold"
                                    >
                                        <option value="FACILITY">Open Gym (Facility)</option>
                                        <option value="PRIVATE">Private Lesson</option>
                                        <option value="CLASS">Class</option>
                                        <option value="EVENT">Special Event</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Assign Coach</label>
                                    <select
                                        value={editingSession.instructor}
                                        onChange={e => setEditingSession({ ...editingSession, instructor: e.target.value })}
                                        disabled={editingSession.lockInstructor}
                                        className={`w-full bg-black/50 border border-white/10 p-3 rounded-xl text-xs font-bold outline-none focus:border-[#28D160] ${editingSession.lockInstructor ? 'opacity-50 cursor-not-allowed border-east-light/30' : ''}`}
                                    >
                                        <option value="">No Coach (Staff)</option>
                                        {coaches.filter(c => {
                                            const fullName = `${c.first_name} ${c.last_name}`;
                                            // Always show the locked coach to prevent reset
                                            if (editingSession.lockInstructor && editingSession.instructor === fullName) return true;

                                            if (!editingSession.session_type_id || editingSession.category !== 'PRIVATE') return true;
                                            return coachServices.some(cs => cs.coach_id === c.id && cs.session_type_id === editingSession.session_type_id);
                                        }).map(c => (
                                            <option key={c.id} value={`${c.first_name} ${c.last_name}`}>
                                                {c.first_name} {c.last_name}
                                            </option>
                                        ))}
                                    </select>
                                    {editingSession.lockInstructor && (
                                        <p className="text-[7px] text-[#28D160] mt-1 uppercase font-black italic flex items-center gap-1">
                                            <Info size={8} /> Coach is locked for this entry
                                        </p>
                                    )}
                                    {!editingSession.lockInstructor && editingSession.session_type_id && editingSession.category === 'PRIVATE' && (
                                        <p className="text-[7px] text-gray-500 mt-1 uppercase font-bold">Showing coaches qualified for this service</p>
                                    )}
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

                            {/* Recurring Options */}
                            {modalAction === 'CREATE' && (
                                <div className="space-y-4 bg-black/20 p-4 rounded-2xl border border-white/5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                            <RefreshCw size={12} /> Repeat Session
                                        </label>
                                        <button
                                            onClick={() => setRecurring(!recurring)}
                                            className={`w-10 h-5 rounded-full transition-colors relative ${recurring ? 'bg-[#28D160]' : 'bg-white/10'}`}
                                        >
                                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${recurring ? 'right-1' : 'left-1'}`} />
                                        </button>
                                    </div>

                                    {recurring && (
                                        <div className="space-y-4 animate-fadeIn">
                                            <div className="flex justify-between gap-1">
                                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => {
                                                            if (repeatDays.includes(i)) {
                                                                setRepeatDays(repeatDays.filter(d => d !== i));
                                                            } else {
                                                                setRepeatDays([...repeatDays, i]);
                                                            }
                                                        }}
                                                        className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all border ${repeatDays.includes(i) ? 'bg-[#28D160] border-[#28D160] text-black shadow-lg shadow-[#28D160]/20' : 'bg-black/50 border-white/10 text-gray-600'}`}
                                                    >
                                                        {day}
                                                    </button>
                                                ))}
                                            </div>
                                            <div>
                                                <label className="text-[7px] font-black text-gray-600 uppercase tracking-[0.2em] mb-1 block text-center">Repeat for (Weeks)</label>
                                                <div className="flex items-center justify-center gap-4">
                                                    {[1, 2, 4, 8, 12].map(w => (
                                                        <button
                                                            key={w}
                                                            onClick={() => setRepeatWeeks(w)}
                                                            className={`text-[10px] font-black px-3 py-1 rounded-full transition-all ${repeatWeeks === w ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
                                                        >
                                                            {w}W
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

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
