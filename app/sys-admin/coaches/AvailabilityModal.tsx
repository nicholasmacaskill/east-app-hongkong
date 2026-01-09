'use client';
import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Save, Clock, Trash2, Plus } from 'lucide-react';

interface AvailabilityModalProps {
    coach: any;
    onClose: () => void;
}

interface TimeSlot {
    id?: string;
    coach_id: string;
    start_time: string; // ISO string
    end_time: string;   // ISO string
    is_recurring: boolean;
    status: string;
}

// Helpers
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

export default function AvailabilityModal({ coach, onClose }: AvailabilityModalProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Tracking changes
    const [deletedSlotIds, setDeletedSlotIds] = useState<string[]>([]);
    const [addedSlots, setAddedSlots] = useState<TimeSlot[]>([]);

    useEffect(() => {
        fetchAvailability();
    }, [coach.id]);

    const fetchAvailability = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/coach-availability?coachId=${coach.id}`);
            const data = await res.json();
            if (data.success) {
                setSlots(data.data);
            } else {
                alert('Failed to load availability: ' + data.error);
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const getWeekRange = () => {
        const start = new Date(currentDate);
        start.setDate(start.getDate() - start.getDay()); // Sunday
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        end.setHours(23, 59, 59, 999);

        return { start, end };
    };

    const { start: weekStart, end: weekEnd } = getWeekRange();

    const getDaysInWeek = () => {
        const days = [];
        const d = new Date(weekStart);
        while (d <= weekEnd) {
            days.push(new Date(d));
            d.setDate(d.getDate() + 1);
        }
        return days;
    };

    const weekDays = getDaysInWeek();

    const handlePrevWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 7);
        setCurrentDate(newDate);
    };

    const handleNextWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 7);
        setCurrentDate(newDate);
    };

    const handleSlotClick = (date: Date, hour: number) => {
        // Create a new slot for this hour
        const start = new Date(date);
        start.setHours(hour, 0, 0, 0);
        const end = new Date(start);
        end.setHours(hour + 1, 0, 0, 0); // 1 hour default

        // Check if slot already exists overlapping
        const existing = [...slots, ...addedSlots].find(s => {
            // Exclude deleted ones
            if (s.id && deletedSlotIds.includes(s.id)) return false;

            const sStart = new Date(s.start_time);
            const sEnd = new Date(s.end_time);
            return (start >= sStart && start < sEnd) || (end > sStart && end <= sEnd);
        });

        if (existing) {
            // Remove it
            if (existing.id) {
                setDeletedSlotIds([...deletedSlotIds, existing.id]);
            } else {
                // Must be in addedSlots, filter it out
                setAddedSlots(addedSlots.filter(s => s !== existing));
            }
        } else {
            // Add it
            const newSlot: TimeSlot = {
                coach_id: coach.id,
                start_time: start.toISOString(),
                end_time: end.toISOString(),
                is_recurring: false, // Default to specific date for now
                status: 'available'
            };
            setAddedSlots([...addedSlots, newSlot]);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/coach-availability', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    coachId: coach.id,
                    slots: addedSlots,
                    deletedSlots: deletedSlotIds
                })
            });

            const data = await res.json();
            if (data.success) {
                alert('Availability saved successfully!');
                onClose();
            } else {
                alert('Error saving: ' + data.error);
            }
        } catch (e) {
            console.error(e);
            alert('Error saving availability.');
        }
        setSaving(false);
    };

    // Prepare display slots
    const displaySlots = [...slots, ...addedSlots].filter(s => !s.id || !deletedSlotIds.includes(s.id));

    return (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#1e1e1e] w-full max-w-5xl rounded-3xl border border-white/10 shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/10">
                    <div>
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">
                            Availability: <span className="text-[#28D160]">{coach.first_name} {coach.last_name}</span>
                        </h2>
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">Manage weekly schedule</p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-500 hover:text-white">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex items-center justify-between p-4 bg-[#151515] border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <button onClick={handlePrevWeek} className="p-2 bg-[#1e1e1e] border border-white/5 rounded-lg hover:border-[#28D160] transition-colors">
                            <ChevronLeft size={16} />
                        </button>
                        <span className="font-bold text-sm uppercase tracking-wider w-40 text-center">
                            {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <button onClick={handleNextWeek} className="p-2 bg-[#1e1e1e] border border-white/5 rounded-lg hover:border-[#28D160] transition-colors">
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <div className="flex items-center gap-2 px-3 py-1 bg-[#28D160]/10 rounded border border-[#28D160]/20">
                            <div className="w-3 h-3 bg-[#28D160] rounded-sm"></div>
                            <span className="text-[10px] uppercase font-bold text-[#28D160]">Available</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded border border-white/10">
                            <div className="w-3 h-3 border border-dashed border-gray-500 rounded-sm"></div>
                            <span className="text-[10px] uppercase font-bold text-gray-500">Click to Add/Remove</span>
                        </div>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="flex-1 overflow-auto bg-[#1e1e1e] p-4">
                    <div className="grid grid-cols-[60px_1fr] min-w-[800px]">
                        {/* Time Column */}
                        <div className="pt-10">
                            {HOURS.map(hour => (
                                <div key={hour} className="h-14 text-right pr-3 text-[10px] font-bold text-gray-500 -mt-2">
                                    {hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                                </div>
                            ))}
                        </div>

                        {/* Days Columns */}
                        <div className="grid grid-cols-7 border-l border-white/5">
                            {/* Header Row */}
                            {weekDays.map(day => (
                                <div key={day.toString()} className="text-center pb-2 border-b border-white/5">
                                    <div className="text-[10px] text-gray-500 uppercase font-black">{DAYS[day.getDay()]}</div>
                                    <div className={`text-sm font-bold ${day.toDateString() === new Date().toDateString() ? 'text-[#28D160]' : 'text-white'}`}>
                                        {day.getDate()}
                                    </div>
                                </div>
                            ))}

                            {/* Cells */}
                            {HOURS.map(hour => (
                                <React.Fragment key={hour}>
                                    {weekDays.map(day => {
                                        // Check availability
                                        const slotStart = new Date(day);
                                        slotStart.setHours(hour, 0, 0, 0);

                                        const isAvailable = displaySlots.some(s => {
                                            const sStart = new Date(s.start_time);
                                            const sEnd = new Date(s.end_time);
                                            // Simple hour check
                                            return slotStart.getTime() === sStart.getTime();
                                        });

                                        return (
                                            <div
                                                key={`${day}-${hour}`}
                                                onClick={() => handleSlotClick(day, hour)}
                                                className={`
                                                    h-14 border-b border-r border-white/5 cursor-pointer transition-all hover:bg-white/5
                                                    ${isAvailable ? 'bg-[#28D160]/20 border-[#28D160]/30 hover:bg-[#28D160]/30' : ''}
                                                `}
                                            >
                                                {isAvailable && (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Clock size={12} className="text-[#28D160]" />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 flex justify-end gap-3 bg-[#151515]">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-white/5 text-white font-bold uppercase text-xs rounded-xl hover:bg-white/10 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-8 py-3 bg-[#28D160] text-black font-black uppercase italic text-xs rounded-xl hover:bg-white transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : <><Save size={16} /> Save Changes</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
