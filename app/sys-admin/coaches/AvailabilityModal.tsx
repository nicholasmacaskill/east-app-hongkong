'use client';
import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Save, Clock, Trash2, Plus, Info, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';
import { useToast } from '@/app/components/ui/Toast';
import { safeDate, safetoLocaleDateString, formatHK, APP_TIMEZONE } from '@/app/lib/dateUtils';
import { fromZonedTime } from 'date-fns-tz';

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
    booking_count?: number; // Added for sorting
}

// Helpers
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

export default function AvailabilityModal({ coach, onClose }: AvailabilityModalProps) {
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { addToast } = useToast();
    const [serviceTypes, setServiceTypes] = useState<any[]>([]);

    // Tracking changes
    const [deletedSlotIds, setDeletedSlotIds] = useState<string[]>([]);
    const [addedSlots, setAddedSlots] = useState<TimeSlot[]>([]);

    // View State
    const [expandedDates, setExpandedDates] = useState<string[]>([]);

    // Selection State (for Bulk Delete)
    const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);
    const [selectionMode, setSelectionMode] = useState(false);

    // Bulk Add State
    const [showBulkTool, setShowBulkTool] = useState(false);
    const [bulkConfig, setBulkConfig] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setDate(new Date().getDate() + 28)).toISOString().split('T')[0], // 4 weeks
        startHour: 9,
        endHour: 17,
        selectedDays: [1, 3, 5],
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
                // Ensure IDs are strings to match selection logic
                const loadedSlots = data.data.map((s: any) => ({
                    ...s,
                    id: s.id.toString()
                }));
                setSlots(loadedSlots);
            } else {
                addToast('Failed to load availability: ' + data.error, 'error');
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    // --- Helpers ---
    const toggleDate = (date: string) => {
        setExpandedDates(prev =>
            prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]
        );
    };

    const expandAll = () => setExpandedDates(Object.keys(groupedSlots));
    const collapseAll = () => setExpandedDates([]);

    const toggleSelection = (id: string) => {
        setSelectedSlotIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    // --- Bulk Add Logic ---
    const generateBulkSlots = () => {
        const start = new Date(bulkConfig.startDate);
        const end = new Date(bulkConfig.endDate);

        const newBulkSlots: TimeSlot[] = [];

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            // Get correct HK day of week
            const currentHKDay = (parseInt(formatHK(d, 'i')) % 7);
            const hkDateStr = formatHK(d, 'yyyy-MM-dd');

            if (bulkConfig.selectedDays.includes(currentHKDay)) {
                for (let h = bulkConfig.startHour; h < bulkConfig.endHour; h++) {
                    const naiveStr = `${hkDateStr} ${String(h).padStart(2, '0')}:00:00`;
                    const slotStart = fromZonedTime(naiveStr, APP_TIMEZONE);
                    const slotEnd = new Date(slotStart.getTime() + 60 * 60000); // 1hr

                    // Generate a temporary ID for local management
                    const tempId = `temp_${Date.now()}_${Math.random()}`;

                    newBulkSlots.push({
                        id: tempId,
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
        addToast(`Generated ${newBulkSlots.length} items. Click Save to confirm.`, 'success');
    };

    // --- Bulk Delete Logic ---
    const handleDeleteSelected = () => {
        if (!confirm(`Delete ${selectedSlotIds.length} items?`)) return;

        const dbIdsToDelete: string[] = [];
        let newAddedSlots = [...addedSlots];

        selectedSlotIds.forEach(id => {
            if (id.startsWith('temp_')) {
                newAddedSlots = newAddedSlots.filter(s => s.id !== id);
            } else {
                dbIdsToDelete.push(id);
            }
        });

        setDeletedSlotIds([...deletedSlotIds, ...dbIdsToDelete]);
        setAddedSlots(newAddedSlots);
        setSelectedSlotIds([]);
        setSelectionMode(false);
        addToast(`Removed ${selectedSlotIds.length} items from view. Save to apply.`, 'info');
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const finalAddedSlots = addedSlots.map(s => {
                const { id, ...rest } = s;
                return rest;
            });

            const res = await fetch('/api/admin/coach-availability', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    coachId: coach.id,
                    slots: finalAddedSlots,
                    deletedSlots: deletedSlotIds
                })
            });

            const data = await res.json();
            if (data.success) {
                addToast('Schedule saved successfully!', 'success');
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

    // --- Grouping & Rendering ---
    const allActiveSlots = [...slots, ...addedSlots].filter(s => !deletedSlotIds.includes(s.id!));

    const groupedSlots = allActiveSlots.reduce((acc, slot) => {
        const dateKey = safetoLocaleDateString(safeDate(slot.start_time), undefined, { weekday: 'short', month: 'short', day: 'numeric' });
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(slot);
        return acc;
    }, {} as Record<string, TimeSlot[]>);

    const sortedDateKeys = Object.keys(groupedSlots).sort((a, b) => {
        return new Date(a).getTime() - new Date(b).getTime();
    });

    return (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#1e1e1e] w-full max-w-5xl rounded-3xl border border-white/10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/10 shrink-0 bg-[#1e1e1e] z-50">
                    <div>
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">
                            Availability: <span className="text-[#28D160]">{coach.first_name} {coach.last_name}</span>
                        </h2>
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">Manage monthly schedule</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-500 hover:text-white">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col md:flex-row items-center justify-between p-4 bg-[#151515] border-b border-white/5 shrink-0 gap-4">
                    <div className="flex items-center gap-2">
                        <button onClick={expandAll} className="text-[10px] font-bold uppercase text-gray-400 hover:text-white flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                            <ChevronDown size={12} /> Expand All
                        </button>
                        <button onClick={collapseAll} className="text-[10px] font-bold uppercase text-gray-400 hover:text-white flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                            <ChevronUp size={12} /> Collapse All
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowBulkTool(!showBulkTool)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 transition-colors ${showBulkTool ? 'bg-[#28D160] text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
                        >
                            <Plus size={14} /> Bulk Add
                        </button>

                        <div className="h-6 w-px bg-white/10" />

                        <button
                            onClick={() => {
                                setSelectionMode(!selectionMode);
                                setSelectedSlotIds([]);
                            }}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors border ${selectionMode ? 'bg-east-light text-black border-east-light' : 'bg-transparent text-gray-400 border-white/10 hover:text-white'}`}
                        >
                            {selectionMode ? 'Done Selecting' : 'Select Multiple'}
                        </button>
                    </div>
                </div>

                {/* Bulk Tool Panel */}
                {showBulkTool && (
                    <div className="bg-[#1a1a1a] p-5 border-b border-white/10 animate-fadeIn shrink-0">
                        <div className="flex flex-wrap gap-4 items-end">
                            <div>
                                <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">From</label>
                                <input type="date" value={bulkConfig.startDate} onChange={e => setBulkConfig({ ...bulkConfig, startDate: e.target.value })} className="bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white" />
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">To</label>
                                <input type="date" value={bulkConfig.endDate} onChange={e => setBulkConfig({ ...bulkConfig, endDate: e.target.value })} className="bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white" />
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Start Hr</label>
                                <input type="number" value={bulkConfig.startHour} onChange={e => setBulkConfig({ ...bulkConfig, startHour: parseInt(e.target.value) })} className="bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white w-12" />
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">End Hr</label>
                                <input type="number" value={bulkConfig.endHour} onChange={e => setBulkConfig({ ...bulkConfig, endHour: parseInt(e.target.value) })} className="bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white w-12" />
                            </div>
                            <div className="flex-1">
                                <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Days</label>
                                <div className="flex gap-1">
                                    {[0, 1, 2, 3, 4, 5, 6].map(d => (
                                        <button key={d} onClick={() => {
                                            const newDays = bulkConfig.selectedDays.includes(d) ? bulkConfig.selectedDays.filter(x => x !== d) : [...bulkConfig.selectedDays, d];
                                            setBulkConfig({ ...bulkConfig, selectedDays: newDays });
                                        }} className={`w-6 h-6 rounded text-[9px] font-bold ${bulkConfig.selectedDays.includes(d) ? 'bg-[#28D160] text-black' : 'bg-black/50 text-gray-500'}`}>
                                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'][d]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex-1 min-w-[150px]">
                                <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Service (Optional)</label>
                                <select
                                    value={bulkConfig.selectedServiceId}
                                    onChange={e => {
                                        const svcId = e.target.value;
                                        const svc = serviceTypes.find(s => s.id === svcId);
                                        setBulkConfig({
                                            ...bulkConfig,
                                            selectedServiceId: svcId,
                                            creditCost: Number(svc?.credit_cost ?? bulkConfig.creditCost),
                                            capacity: Number(svc?.category === 'CLASS' ? 10 : 1)
                                        });
                                    }}
                                    className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white"
                                >
                                    <option value="">Generic Slot</option>
                                    {serviceTypes.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                                </select>
                            </div>
                            <div className="w-16">
                                <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Credits</label>
                                <input type="number" value={bulkConfig.creditCost} onChange={e => setBulkConfig({ ...bulkConfig, creditCost: parseInt(e.target.value) || 0 })} className="bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white w-full" />
                            </div>
                            <div className="w-12">
                                <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Cap</label>
                                <input type="number" value={bulkConfig.capacity} onChange={e => setBulkConfig({ ...bulkConfig, capacity: parseInt(e.target.value) || 1 })} className="bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white w-full" />
                            </div>
                        </div>
                        <button onClick={generateBulkSlots} className="bg-[#28D160] text-black font-black uppercase text-xs px-4 py-1.5 rounded hover:bg-white transition-colors">
                            Generate
                        </button>
                    </div>
                )}

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {sortedDateKeys.length === 0 && !loading && (
                        <div className="text-center py-20 opacity-30">
                            <Clock size={48} className="mx-auto mb-4" />
                            <p className="text-sm font-bold uppercase">No availability set</p>
                        </div>
                    )}

                    {sortedDateKeys.map(date => {
                        const daySlots = groupedSlots[date];
                        const isExpanded = expandedDates.includes(date);

                        const sortedItems = [...daySlots].sort((a, b) => {
                            const aBooked = (a.booking_count || 0) > 0;
                            const bBooked = (b.booking_count || 0) > 0;
                            if (aBooked && !bBooked) return -1;
                            if (!aBooked && bBooked) return 1;
                            return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
                        });

                        return (
                            <div key={date} className="animate-fadeIn">
                                <div className="flex items-center gap-2 mb-2 sticky top-0 bg-[#1e1e1e] z-10 py-2">
                                    <button
                                        onClick={() => toggleDate(date)}
                                        className={`flex-1 flex items-center gap-4 bg-[#121212] p-3 rounded-xl border transition-all group ${isExpanded ? 'border-east-light/30' : 'border-white/5 hover:border-white/20'}`}
                                    >
                                        <div className={`p-1 rounded ${isExpanded ? 'bg-east-light text-black' : 'bg-white/10 text-gray-400'}`}>
                                            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                        </div>
                                        <span className="font-black italic text-lg text-white uppercase">{date}</span>
                                        <div className="h-px bg-white/5 flex-1" />
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{daySlots.length} Items</span>
                                    </button>

                                    {selectionMode && (
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 accent-[#28D160] cursor-pointer"
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    const ids = daySlots.map(s => s.id!);
                                                    setSelectedSlotIds(prev => [...new Set([...prev, ...ids])]);
                                                } else {
                                                    const ids = daySlots.map(s => s.id!);
                                                    setSelectedSlotIds(prev => prev.filter(x => !ids.includes(x)));
                                                }
                                            }}
                                        />
                                    )}
                                </div>

                                {isExpanded && (
                                    <div className="space-y-2 pl-4">
                                        {sortedItems.map(item => {
                                            const duration = Math.round((new Date(item.end_time).getTime() - new Date(item.start_time).getTime()) / 60000);
                                            const isSelected = selectedSlotIds.includes(item.id!);
                                            const isBooked = (item.booking_count || 0) > 0;

                                            let borderClass = 'border-l-4 border-gray-500';
                                            if (item.session_type_id) borderClass = 'border-l-4 border-blue-500';
                                            if (isBooked) borderClass = 'border-l-4 border-yellow-400';

                                            return (
                                                <div
                                                    key={item.id}
                                                    onClick={() => selectionMode && toggleSelection(item.id!)}
                                                    className={`
                                                        bg-[#151515] rounded-r-xl p-3 flex gap-4 ${borderClass} border-y border-r border-[#151515] 
                                                        hover:bg-[#1a1a1a] transition-all cursor-pointer group relative
                                                        ${isSelected ? 'bg-white/5 ring-1 ring-[#28D160]' : ''}
                                                    `}
                                                >
                                                    {selectionMode && (
                                                        <div className="absolute inset-y-0 left-0 w-12 flex items-center justify-center bg-black/20 backdrop-blur-sm z-20">
                                                            <input type="checkbox" checked={isSelected} readOnly className="w-4 h-4 accent-[#28D160]" />
                                                        </div>
                                                    )}

                                                    <div className={`flex flex-col items-center justify-center min-w-[60px] border-r border-white/5 pr-4 ${selectionMode ? 'pl-8' : ''}`}>
                                                        <span className="text-sm font-black italic leading-none text-white">
                                                            {formatHK(item.start_time, 'h:mma').toLowerCase()}
                                                        </span>
                                                        <span className="text-[9px] font-bold text-gray-600 uppercase mt-0.5">{duration} min</span>
                                                    </div>

                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            {isBooked ? (
                                                                <span className="bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                                                                    <Users size={8} /> {item.booking_count} Booked
                                                                </span>
                                                            ) : item.session_type_id ? (
                                                                <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                                                                    Open Session
                                                                </span>
                                                            ) : (
                                                                <span className="bg-gray-800 text-gray-500 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                                                                    Slot
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs font-bold text-gray-300">
                                                            {item.session_type_id ? (serviceTypes.find(s => s.id === item.session_type_id)?.title || 'Private Session') : 'General Availability'}
                                                        </p>
                                                    </div>

                                                    {!selectionMode && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (confirm('Delete this slot?')) {
                                                                    setDeletedSlotIds([...deletedSlotIds, item.id!]);
                                                                    addToast('Slot removed. Save to apply.', 'info');
                                                                }
                                                            }}
                                                            className="self-center p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 flex justify-between items-center bg-[#151515] shrink-0 z-50">
                    <div>
                        {selectionMode && selectedSlotIds.length > 0 && (
                            <button
                                onClick={handleDeleteSelected}
                                className="px-6 py-3 bg-red-500 text-white font-black uppercase text-xs rounded-xl hover:bg-red-600 transition-colors flex items-center gap-2 shadow-lg shadow-red-500/20"
                            >
                                <Trash2 size={14} /> Delete {selectedSlotIds.length} Selected
                            </button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-6 py-3 bg-white/5 text-white font-bold uppercase text-xs rounded-xl hover:bg-white/10 transition-colors">
                            Cancel
                        </button>
                        <button onClick={handleSave} disabled={saving} className="px-8 py-3 bg-[#28D160] text-black font-black uppercase italic text-xs rounded-xl hover:bg-white transition-colors flex items-center gap-2 disabled:opacity-50">
                            {saving ? 'Saving...' : <><Save size={16} /> Save Changes</>}
                        </button>
                    </div>
                </div>

            </div>
        </div >
    );
}
