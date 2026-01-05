'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, Calendar, User, Clock, Trash2, CheckCircle } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';

export default function ScheduleManagement() {
    const [coaches, setCoaches] = useState<any[]>([]);
    const [facilities, setFacilities] = useState<any[]>([]);
    const [selectedCoach, setSelectedCoach] = useState<any>(null);
    const [selectedFacility, setSelectedFacility] = useState<any>(null);
    const [sidebarTab, setSidebarTab] = useState<'coaches' | 'facilities'>('coaches');
    const [slots, setSlots] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Form State
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [facilityId, setFacilityId] = useState('');
    const [coachId, setCoachId] = useState('');

    // Recurring State
    const [isRepeating, setIsRepeating] = useState(false);
    const [repeatUntil, setRepeatUntil] = useState('');
    const [selectedDays, setSelectedDays] = useState<number[]>([]);

    // Master View State
    const [viewMode, setViewMode] = useState<'coach' | 'master'>('coach');
    const [masterSlots, setMasterSlots] = useState<any[]>([]);

    const timeOptions = [];
    for (let i = 6; i <= 22; i++) {
        timeOptions.push(`${i.toString().padStart(2, '0')}:00`);
        timeOptions.push(`${i.toString().padStart(2, '0')}:30`);
    }

    // Add Coach State
    const [showAddCoachForm, setShowAddCoachForm] = useState(false);
    const [newCoach, setNewCoach] = useState({
        first_name: '',
        last_name: '',
        email: '',
        mobile: '',
        bio: ''
    });

    useEffect(() => {
        fetchCoaches();
        fetchFacilities();
    }, []);

    useEffect(() => {
        if (sidebarTab === 'coaches' && selectedCoach) {
            fetchAvailability('coach_id', selectedCoach.id);
            setCoachId(selectedCoach.id);
            setFacilityId('');
        } else if (sidebarTab === 'facilities' && selectedFacility) {
            fetchAvailability('facility_id', selectedFacility.id);
            setFacilityId(selectedFacility.id);
            setCoachId('');
        }
    }, [selectedCoach, selectedFacility, sidebarTab]);

    useEffect(() => {
        if (viewMode === 'master') {
            fetchMasterSchedule();
        }
    }, [viewMode]);

    const fetchCoaches = async () => {
        const { data } = await supabase.from('profiles').select('*').eq('role', 'coach'); // Filter by role coach preferably
        if (data) setCoaches(data);
    };

    const fetchFacilities = async () => {
        const { data } = await supabase.from('facilities').select('*').eq('is_active', true);
        if (data) setFacilities(data);
    };

    const fetchAvailability = async (filterKey: 'coach_id' | 'facility_id', filterValue: string) => {
        setLoading(true);
        const { data } = await supabase
            .from('availability')
            .select('*, facilities(name)')
            .eq(filterKey, filterValue)
            .gte('start_time', new Date().toISOString())
            .order('start_time', { ascending: true });

        if (data) setSlots(data);
        setLoading(false);
    };

    const fetchMasterSchedule = async () => {
        setLoading(true);
        // Join with profiles and facilities
        const { data, error } = await supabase
            .from('availability')
            .select('*, profiles:coach_id(first_name, last_name, avatar_url), facilities(name)')
            .gte('start_time', new Date().toISOString())
            .order('start_time', { ascending: true });

        if (error) console.error(error);
        if (data) setMasterSlots(data);
        setLoading(false);
    };

    const handleAddSlot = async () => {
        if (!coachId && !facilityId) return alert("Select a Coach or Facility");
        if (!date || !startTime || !endTime) return alert("Please fill all fields");

        setLoading(true);
        const slotsToInsert = [];

        const prepareSlot = (sDate: string) => ({
            coach_id: coachId || null,
            facility_id: facilityId || null,
            start_time: new Date(`${sDate}T${startTime}`).toISOString(),
            end_time: new Date(`${sDate}T${endTime}`).toISOString(),
            status: 'available'
        });

        if (!isRepeating) {
            slotsToInsert.push(prepareSlot(date));
        } else {
            const start = new Date(date + 'T00:00:00');
            const end = new Date(repeatUntil + 'T00:00:00');

            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                if (selectedDays.includes(d.getDay())) {
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    slotsToInsert.push(prepareSlot(`${year}-${month}-${day}`));
                }
            }
        }

        const { error } = await supabase.from('availability').insert(slotsToInsert);
        if (error) alert(error.message);
        else {
            if (sidebarTab === 'coaches' && selectedCoach) fetchAvailability('coach_id', selectedCoach.id);
            else if (sidebarTab === 'facilities' && selectedFacility) fetchAvailability('facility_id', selectedFacility.id);
            if (viewMode === 'master') fetchMasterSchedule();
        }

        setLoading(false);
    };

    const handleDeleteSlot = async (id: string) => {
        const { error } = await supabase.from('availability').delete().eq('id', id);
        if (!error) {
            if (sidebarTab === 'coaches' && selectedCoach) fetchAvailability('coach_id', selectedCoach.id);
            else if (sidebarTab === 'facilities' && selectedFacility) fetchAvailability('facility_id', selectedFacility.id);
            if (viewMode === 'master') fetchMasterSchedule();
        }
    };

    const handleAddCoach = async () => {
        if (!newCoach.first_name || !newCoach.last_name || !newCoach.email) return alert("Please fill required fields (Name, Email)");

        try {
            const response = await fetch('/api/admin/create-coach', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: newCoach.email,
                    password: 'password123', // Default temporary password
                    firstName: newCoach.first_name,
                    lastName: newCoach.last_name,
                    mobile: newCoach.mobile,
                    bio: newCoach.bio
                })
            });

            const result = await response.json();

            if (!result.success) {
                alert('Error adding coach: ' + result.error);
            } else {
                alert('Coach added successfully! You can now select them from the list.');
                setShowAddCoachForm(false);
                setNewCoach({ first_name: '', last_name: '', email: '', mobile: '', bio: '' });
                fetchCoaches(); // Refresh list to include new coach
            }
        } catch (err) {
            alert('Failed to connect to server.');
            console.error(err);
        }
    };

    return (
        <div className="flex flex-col gap-6 animate-fadeIn h-[calc(100vh-100px)]">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <Link href="/sys-admin" className="p-2 bg-[#1e1e1e] rounded-lg hover:bg-[#28D160] hover:text-black transition-colors">
                        <ChevronLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black italic uppercase tracking-tighter">Schedule Manager</h1>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowAddCoachForm(true)}
                        className="bg-[#28D160] text-black font-bold text-xs px-4 py-2 rounded-lg hover:bg-white transition-colors uppercase tracking-wide"
                    >
                        + New Coach
                    </button>

                    <div className="flex bg-[#1e1e1e] p-1 rounded-lg border border-white/10">
                        <button
                            onClick={() => setViewMode('coach')}
                            className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-colors ${viewMode === 'coach' ? 'bg-[#28D160] text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            By Coach
                        </button>
                        <button
                            onClick={() => setViewMode('master')}
                            className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-colors ${viewMode === 'master' ? 'bg-[#28D160] text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            Master View
                        </button>
                    </div>
                </div>
            </div>

            {/* Add Coach Modal */}
            {showAddCoachForm && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-[#1e1e1e] p-6 rounded-2xl w-full max-w-md border border-white/10">
                        <h2 className="font-black italic text-xl uppercase mb-4">Add New Coach</h2>
                        <div className="flex flex-col gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">First Name *</label>
                                    <input
                                        value={newCoach.first_name}
                                        onChange={e => setNewCoach({ ...newCoach, first_name: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 p-2 rounded text-white text-sm outline-none focus:border-[#28D160]"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Last Name *</label>
                                    <input
                                        value={newCoach.last_name}
                                        onChange={e => setNewCoach({ ...newCoach, last_name: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 p-2 rounded text-white text-sm outline-none focus:border-[#28D160]"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Contact Email *</label>
                                <input
                                    value={newCoach.email}
                                    onChange={e => setNewCoach({ ...newCoach, email: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 p-2 rounded text-white text-sm outline-none focus:border-[#28D160]"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Mobile</label>
                                <input
                                    value={newCoach.mobile}
                                    onChange={e => setNewCoach({ ...newCoach, mobile: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 p-2 rounded text-white text-sm outline-none focus:border-[#28D160]"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Bio</label>
                                <textarea
                                    value={newCoach.bio}
                                    onChange={e => setNewCoach({ ...newCoach, bio: e.target.value })}
                                    rows={3}
                                    className="w-full bg-black/50 border border-white/10 p-2 rounded text-white text-sm outline-none focus:border-[#28D160]"
                                />
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button onClick={handleAddCoach} className="flex-1 bg-[#28D160] text-black font-bold py-2 rounded uppercase text-xs hover:bg-white">Save Coach</button>
                                <button onClick={() => setShowAddCoachForm(false)} className="flex-1 bg-white/10 text-white font-bold py-2 rounded uppercase text-xs hover:bg-white/20">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {viewMode === 'coach' ? (
                <div className="flex flex-col md:flex-row gap-6 h-full overflow-hidden">
                    {/* 1. Sidebar List */}
                    <div className="w-full md:w-1/3 bg-[#1e1e1e] rounded-2xl border border-white/5 flex flex-col overflow-hidden">
                        <div className="p-1 border-b border-white/5 bg-black/20 flex">
                            <button
                                onClick={() => setSidebarTab('coaches')}
                                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${sidebarTab === 'coaches' ? 'text-[#28D160] border-b-2 border-[#28D160]' : 'text-gray-500 hover:text-white'}`}
                            >
                                Coaches
                            </button>
                            <button
                                onClick={() => setSidebarTab('facilities')}
                                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${sidebarTab === 'facilities' ? 'text-[#28D160] border-b-2 border-[#28D160]' : 'text-gray-500 hover:text-white'}`}
                            >
                                Facilities
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2">
                            {sidebarTab === 'coaches' ? (
                                coaches.map(coach => (
                                    <button
                                        key={coach.id}
                                        onClick={() => {
                                            setSelectedCoach(coach);
                                            setSelectedFacility(null);
                                        }}
                                        className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-colors mb-1 ${selectedCoach?.id === coach.id ? 'bg-[#28D160] text-black' : 'hover:bg-white/5 text-white'}`}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedCoach?.id === coach.id ? 'bg-black/20' : 'bg-white/10'}`}>
                                            {coach.avatar_url ? (
                                                <img src={coach.avatar_url} className="w-full h-full object-cover rounded-full" />
                                            ) : (
                                                <User size={16} />
                                            )}
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="font-bold text-sm truncate">{coach.name || `${coach.first_name} ${coach.last_name}` || 'Unknown'}</p>
                                            <p className={`text-[9px] uppercase font-bold ${selectedCoach?.id === coach.id ? 'text-black/60' : 'text-gray-500'}`}>{coach.contact_email || 'Coach'}</p>
                                        </div>
                                        {selectedCoach?.id === coach.id && <CheckCircle size={16} className="ml-auto" />}
                                    </button>
                                ))
                            ) : (
                                facilities.map(facility => (
                                    <button
                                        key={facility.id}
                                        onClick={() => {
                                            setSelectedFacility(facility);
                                            setSelectedCoach(null);
                                        }}
                                        className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-colors mb-1 ${selectedFacility?.id === facility.id ? 'bg-[#28D160] text-black' : 'hover:bg-white/5 text-white'}`}
                                    >
                                        <div className={`w-12 h-10 rounded-lg flex items-center justify-center overflow-hidden ${selectedFacility?.id === facility.id ? 'bg-black/20' : 'bg-white/10'}`}>
                                            {facility.image_url ? (
                                                <img src={facility.image_url} className="w-full h-full object-cover" />
                                            ) : (
                                                <Calendar size={16} />
                                            )}
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="font-bold text-sm truncate">{facility.name}</p>
                                            <p className={`text-[9px] uppercase font-bold ${selectedFacility?.id === facility.id ? 'text-black/60' : 'text-gray-500'}`}>{facility.credit_cost} Credits</p>
                                        </div>
                                        {selectedFacility?.id === facility.id && <CheckCircle size={16} className="ml-auto" />}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* 2. Schedule Editor */}
                    <div className="flex-1 bg-[#1e1e1e] rounded-2xl border border-white/5 flex flex-col overflow-hidden">
                        {!selectedCoach && !selectedFacility ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                                <Calendar size={48} className="mb-4 opacity-20" />
                                <p>Select a resource to manage schedule</p>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full">
                                <div className="p-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
                                    <h2 className="font-bold text-gray-400 text-xs uppercase tracking-widest">
                                        Editing: <span className="text-white">
                                            {selectedCoach ? (selectedCoach.name || selectedCoach.first_name) : selectedFacility.name}
                                        </span>
                                    </h2>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6">
                                    {/* Add Slot Form */}
                                    <div className="bg-black/40 p-4 rounded-xl border border-white/5 mb-8">
                                        <h3 className="font-black italic text-lg uppercase mb-4">Add Availability</h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Date</label>
                                                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-[#1e1e1e] border border-white/10 p-2 rounded text-white text-xs" />
                                            </div>
                                            {selectedCoach && (
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Assigned Facility (Optional)</label>
                                                    <select
                                                        value={facilityId}
                                                        onChange={e => setFacilityId(e.target.value)}
                                                        className="w-full bg-[#1e1e1e] border border-white/10 p-2 rounded text-white text-xs"
                                                    >
                                                        <option value="">No Facility (Mobile)</option>
                                                        {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                                    </select>
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Start</label>
                                                <select value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full bg-[#1e1e1e] border border-white/10 p-2 rounded text-white text-xs">
                                                    <option value="">Select</option>
                                                    {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">End</label>
                                                <select value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full bg-[#1e1e1e] border border-white/10 p-2 rounded text-white text-xs">
                                                    <option value="">Select</option>
                                                    {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 mb-4">
                                            <input type="checkbox" checked={isRepeating} onChange={e => setIsRepeating(e.target.checked)} id="repeat" />
                                            <label htmlFor="repeat" className="text-xs text-white uppercase font-bold select-none cursor-pointer">Repeat Weekly</label>
                                        </div>

                                        {/* Repeat inputs... */}
                                        {isRepeating && (
                                            <div className="mb-4 p-3 bg-white/5 rounded-lg">
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Repeat Until</label>
                                                <input type="date" value={repeatUntil} onChange={e => setRepeatUntil(e.target.value)} className="w-full bg-[#1e1e1e] border border-white/10 p-2 rounded text-white text-xs mb-3" />
                                                <div className="flex gap-1 justify-between">
                                                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                                        <button key={i} onClick={() => setSelectedDays(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])}
                                                            className={`w-8 h-8 rounded center flex items-center justify-center text-xs font-bold ${selectedDays.includes(i) ? 'bg-[#28D160] text-black' : 'bg-black text-gray-500'}`}>
                                                            {d}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <button onClick={handleAddSlot} disabled={loading} className="w-full bg-[#28D160] text-black font-black uppercase py-2 rounded-lg hover:bg-white transition-colors text-xs">
                                            {loading ? 'Saving...' : 'Add Time Block'}
                                        </button>
                                    </div>

                                    {/* Current Slots */}
                                    <div>
                                        <h3 className="font-bold text-xs text-gray-500 uppercase tracking-widest mb-4">Upcoming Schedule</h3>
                                        <div className="space-y-2">
                                            {slots.length === 0 ? <p className="text-gray-600 text-sm italic">No upcoming slots.</p> : slots.map(slot => (
                                                <div key={slot.id} className="bg-black/40 p-3 rounded-lg flex items-center justify-between border border-white/5 group hover:border-red-500/30 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <Clock size={16} className="text-[#28D160]" />
                                                        <div>
                                                            <p className="text-white font-bold text-xs">
                                                                {new Date(slot.start_time).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                                                            </p>
                                                            <p className="text-gray-400 text-[10px]">
                                                                {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(slot.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                            {slot.facilities && (
                                                                <p className="text-[#28D160] text-[9px] font-bold uppercase mt-1">@ {slot.facilities.name}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button onClick={() => handleDeleteSlot(slot.id)} className="p-2 text-gray-600 hover:text-red-500 transition-colors">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex-1 bg-[#1e1e1e] rounded-2xl border border-white/5 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
                        <h2 className="font-bold text-gray-400 text-xs uppercase tracking-widest">Master Schedule</h2>
                        <span className="text-[10px] text-gray-500">{masterSlots.length} Total Slots</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6">
                        {masterSlots.length === 0 ? (
                            <div className="text-center text-gray-500 mt-10">No upcoming slots available.</div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {masterSlots.map(slot => (
                                    <div key={slot.id} className="bg-black/40 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/20">
                                                {slot.profiles?.avatar_url ? (
                                                    <img src={slot.profiles.avatar_url} className="w-full h-full object-cover" />
                                                ) : <span>{slot.profiles?.first_name?.[0] || '?'}</span>}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-white">
                                                    {slot.profiles ? `${slot.profiles.first_name} ${slot.profiles.last_name}` : slot.facilities?.name || 'Standalone Booking'}
                                                </p>
                                                {slot.profiles && slot.facilities && (
                                                    <p className="text-[#28D160] text-[10px] uppercase font-bold">@ {slot.facilities.name}</p>
                                                )}
                                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                                    <span className="text-[#28D160] font-bold">
                                                        {new Date(slot.start_time).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                                                    </span>
                                                    <span>•</span>
                                                    <span>
                                                        {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(slot.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteSlot(slot.id)} className="text-gray-600 hover:text-red-500 p-2">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
