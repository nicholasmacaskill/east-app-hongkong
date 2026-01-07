// app/sys-admin/schedule/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import { ChevronLeft, Calendar, User, LayoutGrid, RefreshCw } from 'lucide-react';
import Link from 'next/link';

// Types
interface Session {
    id: number;
    title: string;
    start_time: string;
    end_time: string;
    category: string;
    instructor: string;
    total_facility_bays: number; // bays required
    max_capacity: number; // max users
}

interface Registration {
    id: number;
    session_id: number;
    user_id: string;
    user?: {
        first_name: string;
        last_name: string;
    };
}

// Resources (Bays + Coaches)
const RESOURCES = [
    { id: 'bay_1', name: 'Bay 1', type: 'facility' },
    { id: 'bay_2', name: 'Bay 2', type: 'facility' },
    { id: 'bay_3', name: 'Bay 3', type: 'facility' },
    { id: 'bay_4', name: 'Bay 4', type: 'facility' },
    { id: 'coach_ben', name: 'Coach Ben', type: 'coach' },
    { id: 'coach_sarah', name: 'Coach Sarah', type: 'coach' },
    // In a real app complexity, these would be dynamic
];

// Time Slots (08:00 to 22:00)
const TIME_SLOTS = Array.from({ length: 15 }, (_, i) => {
    const hour = i + 8;
    return `${hour < 10 ? '0' : ''}${hour}:00`;
});

export default function MasterSchedule() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchSchedule();
    }, [selectedDate]);

    const fetchSchedule = async () => {
        setLoading(true);

        // Fetch Sessions for Date
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        const { data: sessionData, error: sessError } = await supabase
            .from('sessions')
            .select('*')
            .gte('start_time', startOfDay.toISOString())
            .lte('start_time', endOfDay.toISOString())
            .order('start_time');

        if (sessError) console.error('Error fetching sessions:', sessError);
        else setSessions(sessionData || []);

        // Fetch Registrations (to see who is in the bays)
        // Optimization: In a real app we'd filter by session IDs
        const { data: regData, error: regError } = await supabase
            .from('registrations')
            .select('*, user:profiles(first_name, last_name)');

        if (regError) console.error('Error fetching registrations:', regError);
        else setRegistrations(regData || []);

        setLoading(false);
    };

    // Helper to check if a resource is occupied at a given time
    const getCellContent = (resourceId: string, timeSlot: string) => {
        // 1. Convert timeSlot to ISO range for comparison
        const slotStart = new Date(`${selectedDate}T${timeSlot}:00`);
        const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000); // Assume 1 hour blocks for grid simplicity

        // 2. Find sessions overlapping this slot
        const activeSessions = sessions.filter(s => {
            const sessStart = new Date(s.start_time);
            const sessEnd = new Date(s.end_time);
            return sessStart < slotEnd && sessEnd > slotStart;
        });

        if (activeSessions.length === 0) return null;

        // 3. Map Session to Resource
        // This is the tricky part: Mapping abstract "Session" to specific "Bay 1".
        // Currently, our schema doesn't explicit assign "Bay 1". It just has "total_facility_bays".
        // For this VISUALIZATION, we'll implement a simple allocation heuristic:
        // - If it's a facility session, fill Bays 1..N based on total_facility_bays
        // - If it has an instructor, fill the Coach column

        for (const session of activeSessions) {
            // Check Coach Column
            if (resourceId.startsWith('coach_')) {
                const coachName = resourceId.replace('coach_', '').toLowerCase();
                if (session.instructor?.toLowerCase().includes(coachName)) {
                    return {
                        type: 'session',
                        title: session.title,
                        category: session.category,
                        color: 'bg-blue-600'
                    };
                }
            }

            // Check Facility Bays
            if (resourceId.startsWith('bay_') && session.total_facility_bays > 0) {
                // Heuristic: Session assumes availability of ANY bay. 
                // For visualization, we'll just show it in the first available bays.
                // In a real system, we'd need a specific 'resource_allocation' table.
                // For now, if "Private Lesson" consumes 1 bay, show it in Bay 1.
                // If "Open Gym" consumes 4 bays, show it in Bay 1-4.

                const bayNum = parseInt(resourceId.replace('bay_', ''));
                if (bayNum <= session.total_facility_bays) {
                    return {
                        type: 'session',
                        title: session.title,
                        category: session.category,
                        color: 'bg-[#28D160] text-black'
                    };
                }
            }
        }

        return null;
    };

    return (
        <div className="flex flex-col gap-6 animate-fadeIn pb-20 min-h-screen bg-black text-white p-6 font-montserrat">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/sys-admin" className="p-2 bg-[#1e1e1e] rounded-lg hover:bg-[#28D160] hover:text-black transition-colors">
                        <ChevronLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black italic uppercase tracking-tighter">Master Schedule</h1>
                        <p className="text-gray-400 text-xs text-[10px] font-bold uppercase tracking-widest">Global Facility Overview</p>
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

            {/* Grid Container */}
            <div className="flex-1 overflow-x-auto border border-white/10 rounded-2xl bg-[#1e1e1e]">
                <div className="min-w-[1000px]">
                    {/* Header Row */}
                    <div className="flex border-b border-white/10 sticky top-0 bg-[#1e1e1e] z-10">
                        <div className="w-20 p-4 border-r border-white/10 font-bold text-xs text-gray-500 uppercase tracking-wider bg-[#151515]">Time</div>
                        {RESOURCES.map(resource => (
                            <div key={resource.id} className="flex-1 p-4 border-r border-white/10 min-w-[120px] text-center bg-[#151515]">
                                <span className={`text-xs font-black uppercase italic tracking-tighter ${resource.type === 'coach' ? 'text-blue-400' : 'text-[#28D160]'}`}>
                                    {resource.name}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Time Slots */}
                    {TIME_SLOTS.map(time => (
                        <div key={time} className="flex border-b border-white/5 hover:bg-white/5 transition-colors group">
                            {/* Time Label */}
                            <div className="w-20 p-3 border-r border-white/10 flex items-center justify-center text-[10px] font-bold text-gray-400 bg-[#1e1e1e] group-hover:bg-[#252525] sticky left-0 z-10 border-r border-white/10">
                                {time}
                            </div>

                            {/* Resource Cells */}
                            {RESOURCES.map(resource => {
                                const content = getCellContent(resource.id, time);
                                return (
                                    <div key={`${resource.id}-${time}`} className="flex-1 border-r border-white/5 min-w-[120px] relative p-1">
                                        {content ? (
                                            <div className={`w-full h-full rounded-lg ${content.color} p-2 text-xs flex flex-col justify-center shadow-lg`}>
                                                <span className="font-bold uppercase tracking-tight leading-tight">{content.title}</span>
                                                <span className="text-[9px] opacity-80 uppercase tracking-widest mt-1">{content.category}</span>
                                            </div>
                                        ) : (
                                            // Start / End indicators for drag-drop (future)
                                            <div className="w-full h-full opacity-0 hover:opacity-100 flex items-center justify-center">
                                                <PlusIcon />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

const PlusIcon = () => (
    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white/50">
        <span className="text-xl leading-none mb-1">+</span>
    </div>
);
