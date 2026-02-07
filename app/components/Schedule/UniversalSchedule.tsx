'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { format, addDays, subDays, isSameDay, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, AlertCircle, Clock, User, Plus, Loader2 } from 'lucide-react';
import { safeDate, safetoLocaleDateString, formatHK } from '@/app/lib/dateUtils';
import { useToast } from '@/app/components/ui/Toast';

// --- Types ---
export interface ScheduleItem {
    id?: number | string;
    title: string;
    start_time: string; // ISO string
    end_time: string;   // ISO string
    instructor?: string;
    coach_id?: string;
    category: string;
    type: 'session' | 'slot'; // 'session' = actual booking/class, 'slot' = availability
    isBooked?: boolean; // NEW: To prioritize booked sessions
    meta?: any; // Extra data like attendees, descriptions, etc.
}

interface UniversalScheduleProps {
    date: Date;
    onDateChange: (date: Date) => void;
    items: ScheduleItem[];
    loading?: boolean;
    mode: 'ADMIN' | 'COACH';
    onSlotClick?: (time: string, date: Date) => void;
    onItemClick?: (item: ScheduleItem) => void;
    selectedCoachId?: string;
    // New Props for Multi-Select
    selectionMode?: boolean;
    selectedIds?: (number | string)[];
    onSelectionChange?: (ids: (number | string)[]) => void;
}

export function UniversalSchedule({
    date,
    onDateChange,
    items,
    loading = false,
    mode,
    onSlotClick,
    onItemClick,
    selectedCoachId,
    selectionMode = false,
    selectedIds = [],
    onSelectionChange
}: UniversalScheduleProps) {
    const { addToast } = useToast();
    const [currentTime, setCurrentTime] = useState<Date | null>(null);

    // Update current time indicator
    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 60000);
        setCurrentTime(new Date());
        return () => clearInterval(interval);
    }, []);

    // --- Helpers ---
    const handlePrevDay = () => onDateChange(subDays(date, 1));
    const handleNextDay = () => onDateChange(addDays(date, 1));

    const handleItemInteraction = (item: ScheduleItem) => {
        if (selectionMode && onSelectionChange) {
            if (item.type === 'slot') return; // Cannot select slots for deletion usually
            const newIds = selectedIds.includes(item.id!)
                ? selectedIds.filter(id => id !== item.id)
                : [...selectedIds, item.id!];
            onSelectionChange(newIds);
        } else {
            if (onItemClick) onItemClick(item);
        }
    };

    /**
     * Group items by Date -> Time for the timeline
     * Sorting:
     * 1. Booked Sessions (Active) -> Top
     * 2. Start Time (Earliest) -> Ascending
     */
    const sortedItems = useMemo(() => {
        return [...items].sort((a, b) => {
            // 1. Priority: Booked items first
            if (a.isBooked && !b.isBooked) return -1;
            if (!a.isBooked && b.isBooked) return 1;

            // 2. Secondary: Time
            const tA = new Date(a.start_time).getTime();
            const tB = new Date(b.start_time).getTime();
            return tA - tB;
        });
    }, [items]);

    // --- Render ---

    return (
        <div className="flex flex-col h-full bg-[#0a0a0a] text-white">

            {/* 1. Date Navigation Bar */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#121212]">
                <div className="flex items-center gap-4">
                    <button onClick={handlePrevDay} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white">
                        <ChevronLeft size={20} />
                    </button>

                    <div className="flex flex-col items-center">
                        <div className="relative">
                            <input
                                type="date"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                value={format(date, 'yyyy-MM-dd')}
                                onChange={(e) => onDateChange(new Date(e.target.value))}
                            />
                            <div className="flex items-center gap-2 cursor-pointer hover:text-east-light transition-colors">
                                <Calendar size={16} />
                                <span className="text-sm font-black uppercase tracking-widest">
                                    {format(date, 'EEEE, MMMM do')}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button onClick={handleNextDay} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white">
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onDateChange(new Date())}
                        className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-white/5 border border-white/10 rounded hover:bg-white/10 transition-colors"
                    >
                        Today
                    </button>
                </div>
            </div>

            {/* 2. Timeline Canvas */}
            <div className="flex-1 overflow-y-auto p-4 relative min-h-[500px]">

                {loading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center opacity-50 z-20 bg-black/50">
                        <Loader2 size={32} className="animate-spin mb-2" />
                        <span className="text-xs font-bold uppercase tracking-widest">Loading Schedule...</span>
                    </div>
                ) : (
                    <div className="space-y-3 pb-20">
                        {sortedItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-white/30 border border-dashed border-white/10 rounded-xl">
                                <Clock size={48} className="mb-4 opacity-50" />
                                <p className="text-sm font-bold uppercase tracking-widest">No sessions scheduled</p>
                                <p className="text-xs mt-2">Click below to add one</p>
                            </div>
                        ) : (
                            sortedItems.map((item) => {
                                const duration = Math.round((new Date(item.end_time).getTime() - new Date(item.start_time).getTime()) / 60000);
                                const isSelected = selectedIds.includes(item.id!);

                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => handleItemInteraction(item)}
                                        className={`
                                        relative flex group cursor-pointer transition-all
                                        ${item.type === 'slot'
                                                ? 'bg-black/20 border-white/5 border-dashed hover:border-east-light/30'
                                                : isSelected
                                                    ? 'bg-east-light/20 border-east-light shadow-[0_0_15px_rgba(40,209,96,0.3)] scale-[1.02] z-10'
                                                    : item.isBooked
                                                        ? 'bg-[#1e1e1e] border-east-light/50 shadow-lg shadow-east-light/10 ring-1 ring-east-light/20'
                                                        : 'bg-[#1e1e1e] border-white/10 hover:border-east-light hover:shadow-lg hover:shadow-east-light/5'
                                            }
                                        border rounded-xl p-3
                                    `}
                                    >
                                        {/* Selection Checkbox Visual */}
                                        {selectionMode && item.type !== 'slot' && (
                                            <div className={`absolute top-3 right-3 w-4 h-4 rounded border flex items-center justify-center transition-all ${isSelected ? 'bg-east-light border-east-light' : 'border-white/30 bg-black/50'}`}>
                                                {isSelected && <div className="w-2 h-2 rounded bg-black" />}
                                            </div>
                                        )}

                                        {/* Time Column */}
                                        <div className="flex flex-col items-center justify-center min-w-[70px] pr-4 border-r border-white/5">
                                            <span className="text-lg font-black italic leading-none">
                                                {formatHK(item.start_time, 'h:mm')}
                                                <span className="text-[10px] font-normal text-white/50 ml-0.5">{formatHK(item.start_time, 'a').toLowerCase()}</span>
                                            </span>
                                            <span className="text-[9px] font-bold text-gray-600 mt-1 uppercase">
                                                {duration} MIN
                                            </span>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 pl-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className={`font-bold uppercase text-sm ${item.type === 'slot' ? 'text-white/40 italic' : 'text-white'}`}>
                                                            {item.title}
                                                        </h3>
                                                        {item.isBooked && (
                                                            <span className="bg-east-light text-black text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">
                                                                Booked
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {item.instructor && (
                                                            <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-white/50">
                                                                <User size={10} /> {item.instructor}
                                                            </div>
                                                        )}
                                                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${item.category === 'PRIVATE' ? 'bg-purple-500/10 text-purple-400' :
                                                            item.category === 'FACILITY' ? 'bg-blue-500/10 text-blue-400' :
                                                                'bg-east-light/10 text-east-light'
                                                            }`}>
                                                            {item.category}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}

                        {/* Add Slot Button (Floating or Bottom) */}
                        {mode === 'ADMIN' && (
                            <button
                                onClick={() => onSlotClick && onSlotClick('09:00', date)}
                                className="w-full py-4 border border-dashed border-white/10 rounded-xl text-white/20 hover:text-east-light hover:border-east-light/30 hover:bg-east-light/5 transition-all flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest mt-4"
                            >
                                <Plus size={16} /> Add Session manually
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
