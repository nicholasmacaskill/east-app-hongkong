'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/app/lib/supabase';
import { ChevronLeft, ChevronRight, Calendar, User, LayoutGrid, RefreshCw, Plus, X, Trash2, Save, Clock, Info, Upload, Star } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { format, addDays, subDays, startOfWeek, isSameDay } from 'date-fns';
import { safeDate, safetoLocaleDateString, toHKISO, formatHK, toHKPickerValue } from '@/app/lib/dateUtils';
import { useToast } from '@/app/components/ui/Toast';

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
    status?: string;
    registrations?: {
        user_id: string;
        status: string;
        profiles: {
            first_name: string;
            last_name: string;
        }
    }[];
}

interface Service {
    id: string;
    title: string;
    category: string;
    credit_cost?: number;
}

interface Coach {
    id: string;
    first_name: string;
    last_name: string;
}

function ScheduleContent() {
    const searchParams = useSearchParams();
    const autoInstructor = searchParams?.get('instructor');
    const hasAutoOpened = React.useRef(false);
    const { addToast } = useToast();

    const [sessions, setSessions] = useState<Session[]>([]);
    const [availability, setAvailability] = useState<any[]>([]);
    const [coaches, setCoaches] = useState<Coach[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [coachServices, setCoachServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(formatHK(new Date(), 'yyyy-MM-dd'));
    const [viewStartDate, setViewStartDate] = useState(startOfWeek(safeDate(formatHK(new Date(), 'yyyy-MM-dd')) || new Date(), { weekStartsOn: 1 }));
    const [activeCategory, setActiveCategory] = useState<string>(searchParams?.get('category')?.toUpperCase() || 'ALL');
    const [filterCoachId, setFilterCoachId] = useState<string>('ALL');
    const [filterFacilityId, setFilterFacilityId] = useState<string>('ALL');

    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(viewStartDate, i));

    const handlePrevWeek = () => setViewStartDate(subDays(viewStartDate, 7));
    const handleNextWeek = () => setViewStartDate(addDays(viewStartDate, 7));

    // UI States
    const [showModal, setShowModal] = useState(false);
    const [modalAction, setModalAction] = useState<'CREATE' | 'EDIT'>('CREATE');
    const [editingSession, setEditingSession] = useState<any>(null);
    const [recurring, setRecurring] = useState(false);
    const [repeatDays, setRepeatDays] = useState<number[]>([]); 
    const [repeatWeeks, setRepeatWeeks] = useState(4);
    const [registrations, setRegistrations] = useState<any[]>([]); 

    useEffect(() => {
        if (autoInstructor && !hasAutoOpened.current) {
            hasAutoOpened.current = true;
            setModalAction('CREATE');
            const now = new Date();
            now.setMinutes(0, 0, 0);
            const start = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
            const end = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();

            setEditingSession({
                title: `${autoInstructor} - Session`,
                category: 'PRIVATE',
                instructor: autoInstructor,
                start_time: start,
                end_time: end,
                total_facility_bays: 0,
                max_capacity: 1,
                credit_cost: 100,
                session_type_id: undefined,
                lockInstructor: true,
                description: '',
                image_url: ''
            });
            setShowModal(true);
        }
    }, [autoInstructor]);

    useEffect(() => {
        fetchSchedule();
        fetchCoaches();
        fetchServices();
        fetchCoachServices();
    }, [viewStartDate, activeCategory]);

    const fetchSchedule = async () => {
        setLoading(true);
        const startOfView = new Date(viewStartDate);
        startOfView.setHours(0, 0, 0, 0);

        const endOfView = new Date(viewStartDate);
        endOfView.setDate(endOfView.getDate() + 7);
        endOfView.setHours(23, 59, 59, 999);

        try {
            let start = startOfView.toISOString();
            let end = endOfView.toISOString();

            if (activeCategory === 'EVENT') {
                const now = new Date();
                start = now.toISOString();
            }

            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const res = await fetch(`/api/admin/schedule?start=${start}&end=${end}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (data.error) {
                addToast("Failed to load schedule", "error");
            } else {
                setSessions(data.sessions || []);
                setAvailability(data.availability || []);
            }
        } catch (e) {
            console.error('Fetch schedule error:', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchCoaches = async () => {
        const { data } = await supabase.from('profiles').select('id, first_name, last_name').eq('role', 'coach');
        if (data) setCoaches(data.map(c => ({ ...c, first_name: c.first_name?.trim() || '', last_name: c.last_name?.trim() || '' })));
    };

    const fetchServices = async () => {
        const { data } = await supabase.from('session_types').select('*').order('title');
        setServices(data || []);
    };

    const fetchCoachServices = async () => {
        const { data } = await supabase.from('coach_services').select('*');
        setCoachServices(data || []);
    };

    const fetchRegistrations = async (sessionId: number) => {
        const { data } = await supabase
            .from('registrations')
            .select('*, profiles(first_name, last_name)')
            .eq('session_id', sessionId);
        setRegistrations(data || []);
    };

    const handleCellClick = (timeSlot: string) => {
        const start = toHKISO(`${selectedDate}T${timeSlot}:00`);
        const nextHourNum = parseInt(timeSlot.split(':')[0]) + 1;
        const nextHour = nextHourNum.toString().padStart(2, '0');
        const end = toHKISO(`${selectedDate}T${nextHour}:00`);

        setModalAction('CREATE');
        setEditingSession({
            title: autoInstructor ? `${autoInstructor} - Session` : '',
            category: autoInstructor ? 'PRIVATE' : 'FACILITY',
            instructor: autoInstructor || '',
            start_time: start,
            end_time: end,
            total_facility_bays: 0,
            max_capacity: autoInstructor ? 1 : 4,
            credit_cost: 100,
            session_type_id: undefined,
            lockInstructor: !!autoInstructor,
            description: '',
            image_url: ''
        });
        setShowModal(true);
        setRegistrations([]);
    };

    const handleSessionClick = (session: any) => {
        setModalAction('EDIT');
        setEditingSession({ ...session, lockInstructor: !!session.instructor });
        setShowModal(true);

        if (session.registrations && session.registrations.length > 0) {
            setRegistrations(session.registrations);
        } else if (session.id) {
            fetchRegistrations(session.id);
        } else {
            setRegistrations([]);
        }
    };

    const handleSaveSession = async () => {
        if (!editingSession.title || !editingSession.start_time || !editingSession.end_time) {
            addToast("Title and times are required.", "warning");
            return;
        }

        try {
            const { lockInstructor, ...cleanSessionData } = editingSession;
            let sessionsToCreate = [cleanSessionData];

            if (recurring && modalAction === 'CREATE') {
                const start = new Date(toHKISO(cleanSessionData.start_time));
                const end = new Date(toHKISO(cleanSessionData.end_time));
                sessionsToCreate = [];
                for (let w = 0; w < repeatWeeks; w++) {
                    for (const day of repeatDays) {
                        const targetDate = new Date(start);
                        targetDate.setDate(start.getDate() + (w * 7) + (day - start.getDay()));
                        if (targetDate < start && w === 0) continue;
                        const diff = targetDate.getTime() - start.getTime();
                        sessionsToCreate.push({
                            ...cleanSessionData,
                            start_time: new Date(start.getTime() + diff).toISOString(),
                            end_time: new Date(end.getTime() + diff).toISOString()
                        });
                    }
                }
            } else {
                sessionsToCreate = [{
                    ...cleanSessionData,
                    start_time: toHKISO(cleanSessionData.start_time),
                    end_time: toHKISO(cleanSessionData.end_time)
                }];
            }

            const res = await fetch('/api/admin/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: modalAction,
                    id: editingSession.id,
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
                addToast(data.error, "error");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteSession = async () => {
        if (!confirm("Are you sure you want to CANCEL this session? It will remain visible in the schedule but marked as cancelled.")) return;
        try {
            const res = await fetch('/api/admin/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'DELETE', id: editingSession.id })
            });
            if ((await res.json()).success) {
                setShowModal(false);
                fetchSchedule();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const normalizeName = (name: string) => name?.replace(/\s+/g, ' ').trim().toLowerCase() || '';

    // Filter Logic
    const rawItems: any[] = [
        ...sessions.map(s => ({ ...s, type: 'session', session_type_title: services.find(svc => svc.id === s.session_type_id)?.title || s.title })),
        ...availability.map(a => {
            const isFacility = !a.coach_id || a.facility_category;
            return {
                id: a.id,
                title: isFacility ? (a.facility_category || 'Facility Hours') : 'Open Slot',
                category: isFacility ? 'FACILITY' : (a.category || 'PRIVATE'),
                instructor: a.profiles ? `${a.profiles.first_name} ${a.profiles.last_name || ''}`.trim() : 'Facility',
                start_time: a.start_time,
                end_time: a.end_time,
                type: 'slot',
                coach_id: a.coach_id,
                facility_category: a.facility_category,
                session_type_title: a.facility_category || 'Facility Hours'
            };
        })
    ];

    const filteredItems = rawItems.filter((item: any) => {
        const sDate = safeDate(item.start_time);
        if (!sDate || !isSameDay(sDate, new Date(selectedDate))) return false;
        if (activeCategory !== 'ALL' && item.category !== activeCategory) return false;
        if (filterCoachId !== 'ALL') {
            if (item.type === 'slot') return item.coach_id === filterCoachId;
            const coach = coaches.find(c => c.id === filterCoachId);
            if (coach) {
                const instrName = normalizeName(item.instructor || '');
                const coachName = normalizeName(`${coach.first_name} ${coach.last_name}`);
                if (instrName !== coachName && instrName !== `coach ${coachName}`) return false;
            }
        }
        if (filterFacilityId !== 'ALL') {
            if (item.category !== 'FACILITY') return false;
            let isMatch = item.session_type_title === filterFacilityId || item.title === filterFacilityId || item.facility_category === filterFacilityId;
            if (item.type === 'slot') {
                if (!item.facility_category || item.facility_category === 'ALL') isMatch = true;
                else if (item.facility_category === filterFacilityId) isMatch = true;
            }
            if (!isMatch) return false;
        }
        return true;
    });

    const TOTAL_BAYS = 4;
    const mergedItems = filteredItems.map(item => {
        if (item.type === 'slot' && item.category === 'FACILITY') {
            const slotStart = new Date(item.start_time).getTime();
            const slotEnd = new Date(item.end_time).getTime();
            const overlappingSessions = filteredItems.filter(s => {
                if (s.type !== 'session' || s.status === 'cancelled') return false;
                const sStart = new Date(s.start_time).getTime();
                const sEnd = new Date(s.end_time).getTime();
                return slotStart < sEnd && sStart < slotEnd;
            });
            const baysUsed = overlappingSessions.reduce((sum, s) => sum + (s.total_facility_bays || 0), 0);
            return { ...item, availableBays: Math.max(0, TOTAL_BAYS - baysUsed), totalBays: TOTAL_BAYS };
        }
        return item;
    }).sort((a, b) => {
        const hasRegsA = a.type === 'session' && a.registrations && a.registrations.length > 0;
        const hasRegsB = b.type === 'session' && b.registrations && b.registrations.length > 0;
        const priorityA = hasRegsA ? 1 : (a.type === 'session' ? 2 : 3);
        const priorityB = hasRegsB ? 1 : (b.type === 'session' ? 2 : 3);
        if (priorityA !== priorityB) return priorityA - priorityB;
        return (safeDate(a.start_time)?.getTime() || 0) - (safeDate(b.start_time)?.getTime() || 0);
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-2">
                        Master <span className="text-[#28D160]">Schedule</span>
                    </h1>
                    <p className="text-gray-400 text-sm font-medium">Coordinate the entire facility's timeline and coach deployments.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-between bg-[#1a1a1a] rounded-2xl px-2 py-1 border border-white/5">
                        <button onClick={handlePrevWeek} className="p-3 hover:bg-white/5 rounded-xl transition-colors text-gray-500 hover:text-white">
                            <ChevronLeft size={20} />
                        </button>
                        <div className="px-4 py-1 flex flex-col items-center min-w-[140px]">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#28D160]">{format(new Date(selectedDate), 'MMMM yyyy')}</span>
                        </div>
                        <button onClick={handleNextWeek} className="p-3 hover:bg-white/5 rounded-xl transition-colors text-gray-500 hover:text-white">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                    <button onClick={fetchSchedule} className="p-4 bg-[#1a1a1a] rounded-2xl hover:bg-white/5 transition-colors border border-white/5 group">
                        <RefreshCw size={22} className={loading ? 'animate-spin text-[#28D160]' : 'text-gray-600 group-hover:text-[#28D160]'} />
                    </button>
                </div>
            </div>

            {/* Date Strip */}
            <div className="bg-[#1a1a1a] p-3 rounded-[2rem] border border-white/5 shadow-2xl">
                <div className="grid grid-cols-7 gap-3">
                    {weekDays.map((day, i) => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const isSelected = dateStr === selectedDate;
                        const isToday = isSameDay(day, new Date());
                        return (
                            <button key={i} onClick={() => setSelectedDate(dateStr)} className={`flex flex-col items-center justify-center py-5 rounded-3xl transition-all border ${isSelected ? 'bg-[#28D160] border-transparent text-black shadow-xl shadow-[#28D160]/20 scale-105 z-10' : 'bg-black/20 border-white/5 text-gray-500 hover:border-white/20 hover:bg-white/5'}`}>
                                <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isSelected ? 'text-black/60' : 'text-gray-700'}`}>{format(day, 'EEE')}</span>
                                <span className="text-xl font-black italic leading-none">{format(day, 'd')}</span>
                                {isToday && !isSelected && <div className="mt-2 w-1.5 h-1.5 bg-[#28D160] rounded-full animate-pulse" />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col lg:flex-row gap-6 items-center justify-between pb-4">
                <div className="flex overflow-x-auto no-scrollbar gap-2 w-full lg:w-auto p-1">
                    {['ALL', 'PRIVATE', 'FACILITY', 'CLASS', 'EVENT'].map(cat => (
                        <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${activeCategory === cat ? 'bg-[#28D160] border-transparent text-black shadow-lg shadow-[#28D160]/20' : 'bg-[#1a1a1a] border-white/5 text-gray-500 hover:border-[#28D160]/30'}`}>
                            {cat === 'ALL' ? 'Universe' : cat.replace('_', ' ')}
                        </button>
                    ))}
                </div>
                <div className="flex gap-3 w-full lg:w-auto">
                    <select value={filterFacilityId} onChange={(e) => setFilterFacilityId(e.target.value)} className="bg-[#1a1a1a] border border-white/5 text-white text-[10px] font-black uppercase p-4 rounded-xl outline-none focus:border-[#28D160] flex-1 lg:w-56 appearance-none cursor-pointer">
                        <option value="ALL">All Facilities</option>
                        {Array.from(new Set(services.filter(s => s.category === 'FACILITY').map(s => s.title))).map(title => (
                            <option key={title} value={title}>{title}</option>
                        ))}
                    </select>
                    <select value={filterCoachId} onChange={(e) => setFilterCoachId(e.target.value)} className="bg-[#1a1a1a] border border-white/5 text-white text-[10px] font-black uppercase p-4 rounded-xl outline-none focus:border-[#28D160] flex-1 lg:w-56 appearance-none cursor-pointer">
                        <option value="ALL">All Coaches</option>
                        {coaches.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
                    </select>
                </div>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-[#1a1a1a] rounded-[3rem] border border-white/5">
                        <RefreshCw size={56} className="animate-spin mb-6 text-[#28D160]/20" />
                        <p className="font-black uppercase tracking-[0.2em] text-[10px] text-gray-600 italic">Syncing Temporal Roster...</p>
                    </div>
                ) : mergedItems.length === 0 ? (
                    <div className="text-center py-32 bg-[#1a1a1a] rounded-[3rem] border border-dashed border-white/10 group">
                        <Plus size={64} className="mx-auto mb-6 text-gray-800 group-hover:text-[#28D160] transition-colors" />
                        <h3 className="text-2xl font-black italic uppercase text-gray-700">No active deployments</h3>
                        <button onClick={() => handleCellClick("09:00")} className="mt-6 bg-[#28D160] text-black px-10 py-4 rounded-2xl font-black text-xs uppercase italic tracking-widest hover:bg-white transition-all shadow-xl active:scale-95">Initialize Schedule</button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {mergedItems.map((item, idx) => {
                            const isSlot = item.type === 'slot';
                            const startTime = formatHK(item.start_time, 'h:mm a').toLowerCase();
                            const duration = Math.round(((safeDate(item.end_time)?.getTime() || 0) - (safeDate(item.start_time)?.getTime() || 0)) / 60000);
                            return (
                                <div key={item.id || idx} onClick={() => isSlot ? handleCellClick(formatHK(item.start_time, 'HH:mm')) : handleSessionClick(item)} className={`group flex gap-6 p-5 rounded-3xl transition-all cursor-pointer border ${isSlot ? 'bg-black/20 border-white/5 border-dashed hover:border-[#28D160]/30' : 'bg-[#1a1a1a] border-white/10 hover:border-[#28D160] hover:shadow-2xl hover:shadow-[#28D160]/5'} ${item.status === 'cancelled' ? 'opacity-30 grayscale' : ''}`}>
                                    <div className="flex flex-col items-center justify-center min-w-[90px] border-r border-white/5 pr-6">
                                        <span className={`text-xl font-black italic leading-none ${isSlot ? 'text-gray-700' : 'text-white'}`}>{startTime}</span>
                                        <span className="text-[10px] font-black text-gray-700 uppercase mt-2">{duration} MIN</span>
                                    </div>
                                    <div className="flex-1 py-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-3">
                                                <h3 className={`font-black uppercase italic tracking-tighter text-lg ${isSlot ? 'text-gray-700' : (item.status === 'cancelled' ? 'text-gray-600 line-through' : 'text-white')}`}>{item.title}</h3>
                                                {!isSlot && <span className={`${item.category === 'FACILITY' ? 'bg-[#28D160]/10 text-[#28D160]' : 'bg-blue-500/10 text-blue-400'} text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest`}>{item.category}</span>}
                                                {isSlot && item.category === 'FACILITY' && (
                                                    <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${item.availableBays > 0 ? 'bg-orange-500/10 text-orange-400' : 'bg-red-500/10 text-red-500'}`}>
                                                        {item.availableBays} / {item.totalBays} Bays Free
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-5 h-5 rounded-lg bg-white/5 flex items-center justify-center">
                                                        <User size={12} className={isSlot ? 'text-gray-800' : 'text-[#28D160]'} />
                                                    </div>
                                                    <span className={`text-xs font-black uppercase italic tracking-tight ${isSlot ? 'text-gray-700' : 'text-gray-400'}`}>{item.instructor || 'Staff Command'}</span>
                                                </div>
                                                {item.registrations && item.registrations.length > 0 && (
                                                    <div className="flex items-center gap-2 ml-8 mt-1">
                                                        <Star size={10} className="text-[#28D160] fill-[#28D160]" />
                                                        <span className="text-[10px] text-[#28D160] font-black uppercase italic tracking-widest">{item.registrations.length} Active Duty Athletes</span>
                                                    </div>
                                                )}
                                            </div>
                                            {!isSlot && (
                                                <div className="flex items-center gap-6">
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-black text-gray-700 uppercase leading-none">Price</p>
                                                        <p className="text-sm font-black italic text-[#28D160] leading-none mt-1">{item.credit_cost}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && editingSession && (
                <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4">
                    <div className="bg-[#1a1a1a] p-10 rounded-[3rem] w-full max-w-xl border border-white/10 shadow-[0_0_100px_rgba(40,209,96,0.1)] overflow-y-auto max-h-[90vh] no-scrollbar">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h2 className="font-black italic text-4xl uppercase tracking-tighter text-[#28D160]">{modalAction === 'CREATE' ? 'New Deployment' : 'Review Session'}</h2>
                                <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.2em] mt-2 px-1">Resource Allocation Protocol</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-3 bg-white/5 border border-white/5 rounded-full hover:bg-white/10 transition-colors text-gray-500 hover:text-white"><X size={24} /></button>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-6 bg-black/40 p-8 rounded-[2rem] border border-white/5 shadow-inner">
                                <div>
                                    <label className="text-[10px] font-black text-[#28D160] uppercase tracking-widest px-2 mb-3 block italic">Template Alignment</label>
                                    <select value={editingSession.session_type_id || ''} onChange={e => {
                                        const svc = services.find(s => s.id === e.target.value);
                                        if (svc) setEditingSession({ ...editingSession, session_type_id: svc.id, category: svc.category, title: svc.title, credit_cost: svc.credit_cost || 100 });
                                        else setEditingSession({ ...editingSession, session_type_id: undefined, category: 'FACILITY' });
                                    }} className="w-full bg-black/80 border border-white/5 p-5 rounded-2xl text-white outline-none focus:border-[#28D160]/50 text-sm font-black italic appearance-none cursor-pointer">
                                        <option value="">-- CUSTOM PROTOCOL --</option>
                                        <optgroup label="CLASSES">{services.filter(s => s.category === 'CLASS').map(s => <option key={s.id} value={s.id}>{s.title}</option>)}</optgroup>
                                        <optgroup label="PRIVATE LESSONS">{services.filter(s => s.category === 'PRIVATE').map(s => <option key={s.id} value={s.id}>{s.title}</option>)}</optgroup>
                                        <optgroup label="FACILITIES">{services.filter(s => s.category === 'FACILITY').map(s => <option key={s.id} value={s.id}>{s.title}</option>)}</optgroup>
                                    </select>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest px-2 mb-3 block">Display Identity</label>
                                        <input value={editingSession.title} onChange={e => setEditingSession({ ...editingSession, title: e.target.value })} className="w-full bg-black/80 border border-white/5 p-5 rounded-2xl text-white outline-none focus:border-[#28D160]/50 font-black italic text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest px-2 mb-3 block">Deployment Lead</label>
                                        <select value={editingSession.instructor} onChange={e => setEditingSession({ ...editingSession, instructor: e.target.value })} disabled={editingSession.lockInstructor} className={`w-full bg-black/80 border border-white/5 p-5 rounded-2xl text-xs font-black italic outline-none focus:border-[#28D160]/50 appearance-none cursor-pointer ${editingSession.lockInstructor ? 'opacity-50 grayscale' : ''}`}>
                                            <option value="">COMMAND STAFF</option>
                                            {coaches.map(c => <option key={c.id} value={`${c.first_name} ${c.last_name}`}>{c.first_name} {c.last_name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                    <div className="md:col-span-1">
                                         <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest px-2 mb-3 block">Credit Cost</label>
                                         <input type="number" value={editingSession.credit_cost} onChange={e => setEditingSession({ ...editingSession, credit_cost: parseInt(e.target.value) || 0 })} className="w-full bg-black/80 border border-white/5 p-5 rounded-2xl text-white font-black italic text-center" />
                                    </div>
                                    <div>
                                         <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest px-2 mb-3 block">Max Load</label>
                                         <input type="number" value={editingSession.max_capacity} onChange={e => setEditingSession({ ...editingSession, max_capacity: parseInt(e.target.value) || 1 })} className="w-full bg-black/80 border border-white/5 p-5 rounded-2xl text-white font-black italic text-center" />
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                         <label className="text-[10px] font-black text-orange-500/80 uppercase tracking-widest px-2 mb-3 block">Facility Bays</label>
                                         <input type="number" value={editingSession.total_facility_bays} onChange={e => setEditingSession({ ...editingSession, total_facility_bays: parseInt(e.target.value) || 0 })} className="w-full bg-black/80 border border-white/5 p-5 rounded-2xl text-orange-500 font-black italic text-center outline-none focus:border-orange-500" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-black/40 p-8 rounded-[2rem] border border-white/5">
                                <div>
                                    <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest px-2 mb-3 block">Mission Start</label>
                                    <input type="datetime-local" value={toHKPickerValue(editingSession.start_time)} onChange={e => setEditingSession({ ...editingSession, start_time: e.target.value })} className="w-full bg-black/80 border border-white/5 p-4 rounded-xl text-[11px] text-white font-black uppercase tracking-widest outline-none shadow-inner" style={{ colorScheme: 'dark' }} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest px-2 mb-3 block">Mission End</label>
                                    <input type="datetime-local" value={toHKPickerValue(editingSession.end_time)} onChange={e => setEditingSession({ ...editingSession, end_time: e.target.value })} className="w-full bg-black/80 border border-white/5 p-4 rounded-xl text-[11px] text-white font-black uppercase tracking-widest outline-none shadow-inner" style={{ colorScheme: 'dark' }} />
                                </div>
                            </div>

                            {modalAction === 'CREATE' && (
                                <div className="bg-black/40 p-8 rounded-[2rem] border border-white/5">
                                    <div className="flex items-center justify-between mb-6">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic flex items-center gap-3">Recurring Protocol</label>
                                        <button onClick={() => setRecurring(!recurring)} className={`w-12 h-6 rounded-full transition-all relative ${recurring ? 'bg-[#28D160]' : 'bg-white/5 border border-white/10'}`}>
                                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${recurring ? 'right-1 shadow-lg' : 'left-1'}`} />
                                        </button>
                                    </div>
                                    {recurring && (
                                        <div className="space-y-6 animate-fadeIn">
                                            <div className="flex justify-between gap-1">
                                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                                                    <button key={i} onClick={() => setRepeatDays(repeatDays.includes(i) ? repeatDays.filter(d => d !== i) : [...repeatDays, i])} className={`flex-1 h-12 rounded-xl text-[10px] font-black transition-all border ${repeatDays.includes(i) ? 'bg-[#28D160] border-transparent text-black shadow-xl shadow-[#28D160]/20' : 'bg-black/80 border-white/5 text-gray-800 hover:text-white'}`}>{day}</button>
                                                ))}
                                            </div>
                                            <div className="flex justify-between gap-2">
                                                {[1, 2, 4, 8, 12].map(w => <button key={w} onClick={() => setRepeatWeeks(w)} className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all ${repeatWeeks === w ? 'bg-white text-black' : 'bg-black/40 text-gray-700 hover:text-white'}`}>{w} WEEK CYCLE</button>)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {modalAction === 'EDIT' && registrations?.length > 0 && (
                                <div className="bg-black/40 p-8 rounded-[2rem] border border-white/5">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6 block italic">Deployed Athletes ({registrations.length})</label>
                                    <div className="space-y-3 max-h-[150px] overflow-y-auto no-scrollbar">
                                        {registrations.map(reg => (
                                            <div key={reg.id} className="flex justify-between items-center bg-black/60 p-4 rounded-2xl border border-white/5 transition-hover hover:border-[#28D160]/30">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-[#28D160]/10 flex items-center justify-center text-[10px] font-black text-[#28D160] border border-[#28D160]/20 italic">{reg.profiles?.first_name?.[0]}{reg.profiles?.last_name?.[0]}</div>
                                                    <div>
                                                        <p className="text-sm font-black italic uppercase tracking-tight text-white">{reg.profiles?.first_name} {reg.profiles?.last_name}</p>
                                                        <p className="text-[8px] text-gray-600 font-black uppercase tracking-widest">{reg.status}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-4 pt-4">
                                <button onClick={handleSaveSession} className="flex-1 bg-[#28D160] text-black font-black italic uppercase text-sm py-6 rounded-2xl hover:bg-white transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3"><Save size={20} /> Deploy Changes</button>
                                {modalAction === 'EDIT' && <button onClick={handleDeleteSession} className="bg-red-600/10 text-red-500 border border-red-500/20 px-8 rounded-2xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={24} /></button>}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AdminOpsSchedulePage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center py-32 opacity-50">
                <RefreshCw size={56} className="animate-spin mb-6 text-[#28D160]/20" />
                <p className="font-black uppercase tracking-[0.2em] text-[10px] text-gray-600 italic">Initializing Schedule Module...</p>
            </div>
        }>
            <ScheduleContent />
        </Suspense>
    );
}
