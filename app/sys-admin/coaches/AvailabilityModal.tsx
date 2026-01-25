'use client';
import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Save, Clock, Trash2, Plus, Info } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';
import { useToast } from '@/app/components/ui/Toast';
import { safeDate } from '@/app/lib/dateUtils';

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
    // New fields for Session Generation
    session_type_id?: string;
    credit_cost?: number;
    capacity?: number;
}

// Helpers
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

export default function AvailabilityModal({ coach, onClose }: AvailabilityModalProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { addToast } = useToast();
    const [serviceTypes, setServiceTypes] = useState<any[]>([]);

    // Tracking changes
    const [deletedSlotIds, setDeletedSlotIds] = useState<string[]>([]);
    const [addedSlots, setAddedSlots] = useState<TimeSlot[]>([]);

    // Bulk Add State
    const [showBulkTool, setShowBulkTool] = useState(false);
    const [bulkConfig, setBulkConfig] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setDate(new Date().getDate() + 28)).toISOString().split('T')[0], // 4 weeks
        startHour: 9,
        endHour: 17,
        selectedDays: [1, 3, 5], // Mon, Wed, Fri default
        // New Configs
        selectedServiceId: '',
        creditCost: 10,
        capacity: 1
    });

    useEffect(() => {
        fetchAvailability();
        fetchServiceTypes();
    }, [coach.id]);

    const fetchServiceTypes = async () => {
        const { data } = await supabase.from('session_types').select('*').order('title');
        if (data) setServiceTypes(data);
    };

    const fetchAvailability = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/coach-availability?coachId=${coach.id}`);
            const data = await res.json();
            if (data.success) {
                setSlots(data.data);
            } else {
                addToast('Failed to load availability: ' + data.error, 'error');
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

            const sStart = safeDate(s.start_time);
            const sEnd = safeDate(s.end_time);
            if (!sStart || !sEnd) return false;
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
            // Add it (Simple Availability)
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

    const generateBulkSlots = () => {
        // Parse dates as Local Noon to avoid UTC/timezone shifting issues
        const [startYear, startMonth, startDay] = bulkConfig.startDate.split('-').map(Number);
        const [endYear, endMonth, endDay] = bulkConfig.endDate.split('-').map(Number);

        const start = new Date(startYear, startMonth - 1, startDay, 12, 0, 0);
        const end = new Date(endYear, endMonth - 1, endDay, 12, 0, 0);

        const newBulkSlots: TimeSlot[] = [];

        // Iterate
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            // Check day of week (Local 0-6)
            if (bulkConfig.selectedDays.includes(d.getDay())) {
                for (let h = bulkConfig.startHour; h < bulkConfig.endHour; h++) {
                    const slotStart = new Date(d);
                    slotStart.setHours(h, 0, 0, 0);

                    const slotEnd = new Date(d);
                    slotEnd.setHours(h + 1, 0, 0, 0);

                    // If Service Type selected, include it
                    newBulkSlots.push({
                        coach_id: coach.id,
                        start_time: slotStart.toISOString(),
                        end_time: slotEnd.toISOString(),
                        is_recurring: false,
                        status: 'available',
                        session_type_id: bulkConfig.selectedServiceId || undefined,
                        credit_cost: bulkConfig.selectedServiceId ? bulkConfig.creditCost : undefined,
                        capacity: bulkConfig.selectedServiceId ? bulkConfig.capacity : undefined
                    });
                }
            }
        }

        setAddedSlots([...addedSlots, ...newBulkSlots]);
        setShowBulkTool(false);
        const typeLabel = bulkConfig.selectedServiceId ? 'SESSIONS' : 'Availability Slots';
        addToast(`Generated ${newBulkSlots.length} ${typeLabel} from ${bulkConfig.startDate} to ${bulkConfig.endDate}. Click Save.`, 'success');
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/coach-availability', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    coachId: coach.id,
                    slots: addedSlots, // Now includes session_type_id etc if set
                    deletedSlots: deletedSlotIds
                })
            });

            const data = await res.json();
            if (data.success) {
                addToast('Availability/Sessions saved successfully!', 'success');
                onClose();
            } else {
                addToast('Error saving: ' + data.error, 'error');
            }
        } catch (e) {
            console.error(e);
            addToast('Error saving availability.', 'error');
        }
        setSaving(false);
    };

    // Prepare display slots
    const displaySlots = [...slots, ...addedSlots].filter(s => !s.id || !deletedSlotIds.includes(s.id));

    return (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#1e1e1e] w-full max-w-5xl rounded-3xl border border-white/10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/10 shrink-0">
                    <div>
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">
                            Availability: <span className="text-[#28D160]">{coach.first_name} {coach.last_name}</span>
                        </h2>
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">Manage monthly schedule</p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-500 hover:text-white">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-[#151515] border-b border-white/5 gap-4 md:gap-0">
                        <div className="flex items-center justify-center md:justify-start gap-4">
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

                        <div className="flex items-center justify-between md:justify-end gap-4">
                            <button
                                onClick={() => setShowBulkTool(!showBulkTool)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 transition-colors ${showBulkTool ? 'bg-[#28D160] text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
                            >
                                <Plus size={14} /> Bulk Add
                            </button>
                            <div className="h-6 w-px bg-white/10" />
                            <div className="flex gap-2">
                                <div className="flex items-center gap-2 px-3 py-1 bg-[#28D160]/10 rounded border border-[#28D160]/20">
                                    <div className="w-3 h-3 bg-[#28D160] rounded-sm"></div>
                                    <span className="text-[10px] uppercase font-bold text-[#28D160]">Available</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bulk Tool Panel */}
                    {showBulkTool && (
                        <div className="bg-[#1a1a1a] p-5 border-b border-white/10 animate-fadeIn">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-black italic text-[#28D160] uppercase text-sm">Bulk Availability Generator</h3>
                            </div>

                            {/* 1. Date, Time & Days */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
                                <div className="md:col-span-4">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1.5">Date Range</label>
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="date"
                                            value={bulkConfig.startDate}
                                            onChange={e => setBulkConfig({ ...bulkConfig, startDate: e.target.value })}
                                            className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#28D160] w-full"
                                        />
                                        <span className="text-gray-500">—</span>
                                        <input
                                            type="date"
                                            value={bulkConfig.endDate}
                                            onChange={e => setBulkConfig({ ...bulkConfig, endDate: e.target.value })}
                                            className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#28D160] w-full"
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-3">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1.5">Hours (24h)</label>
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="number" min="0" max="23"
                                            value={bulkConfig.startHour}
                                            onChange={e => setBulkConfig({ ...bulkConfig, startHour: parseInt(e.target.value) })}
                                            className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#28D160] w-full text-center"
                                        />
                                        <span className="text-gray-500 text-[10px] font-bold">TO</span>
                                        <input
                                            type="number" min="0" max="24"
                                            value={bulkConfig.endHour}
                                            onChange={e => setBulkConfig({ ...bulkConfig, endHour: parseInt(e.target.value) })}
                                            className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#28D160] w-full text-center"
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-5">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1.5">Days of Week</label>
                                    <div className="flex gap-1">
                                        {DAYS.map((d, i) => (
                                            <button
                                                key={d}
                                                onClick={() => {
                                                    const newDays = bulkConfig.selectedDays.includes(i)
                                                        ? bulkConfig.selectedDays.filter(d => d !== i)
                                                        : [...bulkConfig.selectedDays, i];
                                                    setBulkConfig({ ...bulkConfig, selectedDays: newDays });
                                                }}
                                                className={`
                                                flex-1 h-8 rounded-lg flex items-center justify-center text-[10px] font-black uppercase transition-all
                                                ${bulkConfig.selectedDays.includes(i) ? 'bg-[#28D160] text-black shadow-[0_0_15px_rgba(40,209,96,0.3)]' : 'bg-black/40 text-gray-500 hover:bg-white/10 hover:text-white'}
                                            `}
                                            >
                                                {d.charAt(0)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* 2. Service Options */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end border-t border-white/5 pt-6">
                                <div className="md:col-span-5">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <label className="text-[10px] font-bold text-[#28D160] uppercase block">Service Type (Optional)</label>
                                        <Info size={10} className="text-gray-500" />
                                    </div>
                                    <select
                                        value={bulkConfig.selectedServiceId}
                                        onChange={e => setBulkConfig({ ...bulkConfig, selectedServiceId: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#28D160]"
                                    >
                                        <option value="">-- Generic Availability --</option>
                                        {serviceTypes.map(st => (
                                            <option key={st.id} value={st.id}>{st.title} ({st.category})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1.5">Credit Cost</label>
                                    <input
                                        type="number" min="0"
                                        disabled={!bulkConfig.selectedServiceId}
                                        value={bulkConfig.creditCost}
                                        onChange={e => setBulkConfig({ ...bulkConfig, creditCost: parseInt(e.target.value) })}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#28D160] disabled:opacity-20"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1.5">Capacity</label>
                                    <input
                                        type="number" min="1"
                                        disabled={!bulkConfig.selectedServiceId}
                                        value={bulkConfig.capacity}
                                        onChange={e => setBulkConfig({ ...bulkConfig, capacity: parseInt(e.target.value) })}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#28D160] disabled:opacity-20"
                                    />
                                </div>

                                <div className="md:col-span-3">
                                    <button
                                        onClick={generateBulkSlots}
                                        className="w-full bg-[#28D160] text-black font-black uppercase text-xs py-2.5 rounded-xl hover:bg-white transition-all shadow-lg active:scale-95"
                                    >
                                        Generate Slots
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Calendar Grid */}
                    <div className="overflow-x-auto bg-[#1e1e1e] p-4">
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
                                                const sStart = safeDate(s.start_time);
                                                // Simple hour check
                                                return sStart && slotStart.getTime() === sStart.getTime();
                                            });

                                            return (
                                                <div
                                                    key={`${day}-${hour}`}
                                                    className={`
                                                    h-14 border-b border-r border-white/5 transition-all
                                                    ${isAvailable ? 'bg-[#28D160]/20 border-[#28D160]/30' : ''}
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

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 flex flex-col md:flex-row justify-end gap-3 bg-[#151515] shrink-0">
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
