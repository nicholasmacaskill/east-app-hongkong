'use client';
import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Edit2, Plus, Trash2, Camera, Calendar, Clock, Image as ImageIcon, Mic } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';
import { useToast } from '@/app/components/ui/Toast';
import { safeDate, safetoLocaleDateString } from '@/app/lib/dateUtils'; // NEW

const SettingsContainer = ({ children }: { children: React.ReactNode }) => {
    React.useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, []);

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 text-white p-6 animate-fadeIn overflow-y-auto select-none overscroll-y-none">
            <div className="max-w-md mx-auto h-full flex flex-col">
                {children}
            </div>
        </div>
    );
};

const SettingsHeader = ({ title, onBack, isClose = false }: { title: string, onBack: () => void, isClose?: boolean }) => (
    <div className="flex items-center justify-between mb-8 shrink-0">
        <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors p-2 -ml-2">
            {isClose ? <X size={24} /> : <ChevronLeft size={24} />}
        </button>
        <h2 className="font-montserrat font-bold text-xl tracking-tight">{title}</h2>
        <div className="w-8"></div>
    </div>
);

interface AvailabilitySlot {
    id: string;
    start_time: string;
    end_time: string;
    status: string;
}

export default function ScheduleModal({ onClose, coachId, onScheduleUpdate }: {
    onClose: () => void,
    coachId: string,
    onScheduleUpdate?: () => void
}) {
    const [view, setView] = useState<'menu' | 'manual' | 'photo'>('menu');
    const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
    const [loading, setLoading] = useState(false);
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const { addToast } = useToast();

    // Form State
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    // Recurring State
    const [isRepeating, setIsRepeating] = useState(false);
    const [repeatUntil, setRepeatUntil] = useState('');
    const [selectedDays, setSelectedDays] = useState<number[]>([]); // 0=Sun, 6=Sat

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Helpers
    const timeOptions: string[] = [];
    for (let i = 6; i <= 22; i++) {
        timeOptions.push(`${i.toString().padStart(2, '0')}:00`);
        timeOptions.push(`${i.toString().padStart(2, '0')}:30`);
    }

    useEffect(() => {
        fetchAvailability();
        fetchSchedulePhoto();
    }, [coachId]);

    const fetchAvailability = async () => {
        const { data, error } = await supabase
            .from('availability')
            .select('*')
            .eq('coach_id', coachId)
            // Use current time safely
            .gte('start_time', new Date().toISOString())
            .order('start_time', { ascending: true });

        if (data) setSlots(data);
    };

    const fetchSchedulePhoto = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('schedule_photo_url')
            .eq('id', coachId)
            .single();
        if (data?.schedule_photo_url) setPhotoUrl(data.schedule_photo_url);
    }

    const handleAddSlot = async () => {
        if (!date || !startTime || !endTime) {
            addToast("Please fill all fields", "warning");
            return;
        }
        if (isRepeating && (!repeatUntil || selectedDays.length === 0)) {
            addToast("Please select repeat days and end date", "warning");
            return;
        }

        setLoading(true);
        const slotsToInsert = [];

        if (!isRepeating) {
            const startISO = new Date(`${date}T${startTime}`).toISOString();
            const endISO = new Date(`${date}T${endTime}`).toISOString();
            slotsToInsert.push({ coach_id: coachId, start_time: startISO, end_time: endISO, status: 'available' });
        } else {
            // Generate Recurring Slots
            const start = new Date(date);
            const end = new Date(repeatUntil);

            if (end < start) {
                addToast("End date must be after start date", "error");
                setLoading(false);
                return;
            }

            // Safety: Limit to 6 months (~180 days) to prevent freeze
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays > 180) {
                addToast("For performance, please schedule max 6 months at a time.", "warning");
                setLoading(false);
                return;
            }

            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                if (selectedDays.includes(d.getDay())) {
                    // Create ISO strings for this specific date
                    const dayStr = d.toISOString().split('T')[0];
                    const s = new Date(`${dayStr}T${startTime}`).toISOString();
                    const e = new Date(`${dayStr}T${endTime}`).toISOString();
                    slotsToInsert.push({ coach_id: coachId, start_time: s, end_time: e, status: 'available' });
                }
            }
        }

        const { error } = await supabase.from('availability').insert(slotsToInsert);

        if (error) {
            addToast(error.message, "error");
        } else {
            addToast("Schedule Updated Successfully!", "success");
            if (onScheduleUpdate) onScheduleUpdate();
            else {
                // If no parent update provided, just fetch locally (fallback)
                fetchAvailability();
                onClose();
            }
        }
        setLoading(false);
    };

    const handleDeleteSlot = async (id: string) => {
        const { error } = await supabase.from('availability').delete().eq('id', id);
        if (!error) {
            fetchAvailability();
            if (onScheduleUpdate) onScheduleUpdate();
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;
        setLoading(true);
        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `schedule-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage.from('uploads').upload(filePath, file);

        if (uploadError) {
            addToast('Upload failed', "error");
            setLoading(false);
            return;
        }

        const { data } = supabase.storage.from('uploads').getPublicUrl(filePath);
        const publicUrl = data.publicUrl;

        const { error: dbError } = await supabase
            .from('profiles')
            .update({ schedule_photo_url: publicUrl })
            .eq('id', coachId);

        if (!dbError) {
            setPhotoUrl(publicUrl);
            if (onScheduleUpdate) onScheduleUpdate();
        }
        setLoading(false);
    };


    // Sub-components
    const Menu = () => (
        <div className="flex flex-col gap-4 mt-8">
            <button onClick={() => setView('manual')} className="bg-[#1e1e1e] p-6 rounded-2xl flex items-center justify-between group hover:bg-[#28D160] transition-colors">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center group-hover:bg-white/20">
                        <Calendar className="text-white" size={24} />
                    </div>
                    <div className="text-left">
                        <h3 className="font-black italic text-lg text-white uppercase leading-none">ADD TIME BLOCKS</h3>
                        <p className="text-[10px] font-bold text-gray-400 group-hover:text-white/80 mt-1 uppercase">Set specific hours</p>
                    </div>
                </div>
                <ChevronRight className="text-gray-600 group-hover:text-white" />
            </button>

            <button onClick={() => setView('photo')} className="bg-[#1e1e1e] p-6 rounded-2xl flex items-center justify-between group hover:bg-[#28D160] transition-colors">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center group-hover:bg-white/20">
                        <ImageIcon className="text-white" size={24} />
                    </div>
                    <div className="text-left">
                        <h3 className="font-black italic text-lg text-white uppercase leading-none">UPLOAD SCHEDULE</h3>
                        <p className="text-[10px] font-bold text-gray-400 group-hover:text-white/80 mt-1 uppercase">Photo of paper schedule</p>
                    </div>
                </div>
                <ChevronRight className="text-gray-600 group-hover:text-white" />
            </button>

            {/* Upcoming Slots Preview */}
            <div className="mt-8">
                <h3 className="font-bold text-xs text-gray-500 uppercase tracking-widest mb-4">UPCOMING SLOTS</h3>
                <div className="flex flex-col gap-2">
                    {slots.length === 0 && <p className="text-gray-600 text-sm italic">No slots set.</p>}
                    {slots.slice(0, 3).map(slot => (
                        <div key={slot.id} className="bg-[#1e1e1e] p-3 rounded-lg flex justify-between items-center border border-white/5">
                            <span className="text-white font-bold text-sm">
                                {safetoLocaleDateString(safeDate(slot.start_time), 'en-US')} <span className="text-gray-500">|</span> {safeDate(slot.start_time)?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const ManualEntry = () => (
        <div className="flex flex-col h-full">
            <div className="bg-[#1e1e1e] p-6 rounded-2xl mb-8">
                <h3 className="font-black italic text-lg text-white uppercase mb-4">NEW BLOCK</h3>
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">START DATE</label>
                        <input type="date" value={date} onChange={e => {
                            setDate(e.target.value);
                            // Auto-select the day of week
                            if (e.target.value) {
                                const day = new Date(e.target.value).getDay();
                                if (!selectedDays.includes(day)) setSelectedDays([...selectedDays, day]);
                            }
                        }} className="w-full bg-black/40 border-b border-gray-700 text-white p-2 rounded focus:border-[#28D160] outline-none font-bold" />
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1 flex flex-col gap-2">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">START TIME</label>
                            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto scrollbar-hide">
                                {timeOptions.map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setStartTime(t)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${startTime === t ? 'bg-[#28D160] text-black' : 'bg-black/40 text-gray-400 hover:bg-white/10'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col gap-2">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">END TIME</label>
                            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto scrollbar-hide">
                                {timeOptions.map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setEndTime(t)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${endTime === t ? 'bg-[#28D160] text-black' : 'bg-black/40 text-gray-400 hover:bg-white/10'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RECURRING TOGGLE */}
                    <div className="flex flex-col gap-3 mt-2 bg-black/20 p-3 rounded-xl border border-white/5">
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsRepeating(!isRepeating)}>
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${isRepeating ? 'bg-[#28D160] border-[#28D160]' : 'border-gray-500'}`}>
                                {isRepeating && <div className="w-2 h-2 bg-black rounded-full" />}
                            </div>
                            <span className="text-xs font-bold text-white uppercase select-none">Repeat this slot?</span>
                        </div>

                        {isRepeating && (
                            <div className="flex flex-col gap-3 animate-fadeIn">
                                {/* Day Selector */}
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">REPEAT ON</label>
                                    <div className="flex justify-between">
                                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                            <button
                                                key={i}
                                                onClick={() => {
                                                    setSelectedDays(prev => prev.includes(i) ? prev.filter(day => day !== i) : [...prev, i])
                                                }}
                                                className={`w-8 h-8 rounded-full text-[10px] font-black flex items-center justify-center transition-all ${selectedDays.includes(i) ? 'bg-[#28D160] text-black' : 'bg-white/10 text-gray-500 hover:bg-white/20'}`}
                                            >
                                                {d}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {/* Until Date */}
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">UNTIL</label>
                                    <input type="date" value={repeatUntil} onChange={e => setRepeatUntil(e.target.value)} className="w-full bg-black/40 border-b border-gray-700 text-white p-2 rounded focus:border-[#28D160] outline-none font-bold" />
                                </div>
                            </div>
                        )}
                    </div>

                    <button onClick={handleAddSlot} disabled={loading} className="mt-2 w-full bg-[#28D160] text-black font-black italic uppercase py-3 rounded-xl hover:bg-white transition-colors">
                        {loading ? 'ADDING...' : (isRepeating ? 'ADD RECURRING SLOTS' : 'ADD SLOT')}
                    </button>
                    <div className="text-center">
                        <span className="text-[9px] font-bold text-gray-500 uppercase">
                            {isRepeating ? 'Recurs weekly until end date' : 'Single time block'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <h3 className="font-bold text-xs text-gray-500 uppercase tracking-widest mb-4">YOUR SLOTS</h3>
                <div className="flex flex-col gap-2 pb-20">
                    {slots.map(slot => (
                        <div key={slot.id} className="bg-[#1e1e1e] p-4 rounded-xl flex justify-between items-center border border-white/5 group">
                            <div className="flex flex-col">
                                <span className="text-[#28D160] font-black italic text-md uppercase">{safetoLocaleDateString(safeDate(slot.start_time), 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                <span className="text-white font-bold text-xs mt-1">
                                    {safeDate(slot.start_time)?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {safeDate(slot.end_time)?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <button onClick={() => handleDeleteSlot(slot.id)} className="p-2 text-gray-600 hover:text-red-500 transition-colors">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const PhotoUpload = () => (
        <div className="flex flex-col items-center mt-8 px-4">
            <div
                className="w-full aspect-[3/4] bg-[#1e1e1e] rounded-2xl border-2 border-dashed border-gray-700 flex flex-col items-center justify-center cursor-pointer hover:border-[#28D160] hover:bg-[#28D160]/10 transition-all relative overflow-hidden group"
                onClick={() => fileInputRef.current?.click()}
            >
                {photoUrl ? (
                    <>
                        <img src={photoUrl} className="w-full h-full object-contain" />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="font-black italic text-white uppercase">REPLACE PHOTO</span>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="w-16 h-16 rounded-full bg-black/40 flex items-center justify-center mb-4">
                            {loading ? <span className="animate-spin text-2xl">↻</span> : <Camera size={32} className="text-gray-400" />}
                        </div>
                        <span className="text-gray-500 font-bold text-sm uppercase">TAP TO UPLOAD</span>
                    </>
                )}
            </div>
            <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />

            <div className="mt-8 text-center max-w-xs">
                <p className="text-gray-500 text-xs leading-relaxed">
                    Upload a photo of your handwritten schedule. We'll keep it on file for reference.
                </p>
            </div>
        </div>
    );


    return (
        <SettingsContainer>
            <SettingsHeader
                title={view === 'menu' ? "Set Schedule" : view === 'manual' ? "Add Time Blocks" : "Upload Photo"}
                onBack={() => view === 'menu' ? onClose() : setView('menu')}
                isClose={view === 'menu'}
            />
            {view === 'menu' && <Menu />}
            {view === 'manual' && <ManualEntry />}
            {view === 'photo' && <PhotoUpload />}
        </SettingsContainer>
    );
}
React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
}, []);

return (
    <div className="fixed inset-0 z-[100] bg-black/95 text-white p-6 animate-fadeIn overflow-y-auto select-none overscroll-y-none">
        <div className="max-w-md mx-auto h-full flex flex-col">
            {children}
        </div>
    </div>
);
};

const SettingsHeader = ({ title, onBack, isClose = false }: { title: string, onBack: () => void, isClose?: boolean }) => (
    <div className="flex items-center justify-between mb-8 shrink-0">
        <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors p-2 -ml-2">
            {isClose ? <X size={24} /> : <ChevronLeft size={24} />}
        </button>
        <h2 className="font-montserrat font-bold text-xl tracking-tight">{title}</h2>
        <div className="w-8"></div>
    </div>
);

interface AvailabilitySlot {
    id: string;
    start_time: string;
    end_time: string;
    status: string;
}

export default function ScheduleModal({ onClose, coachId, onScheduleUpdate }: {
    onClose: () => void,
    coachId: string,
    onScheduleUpdate?: () => void
}) {
    const [view, setView] = useState<'menu' | 'manual' | 'photo'>('menu');
    const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
    const [loading, setLoading] = useState(false);
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const { addToast } = useToast();

    // Form State
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    // Recurring State
    const [isRepeating, setIsRepeating] = useState(false);
    const [repeatUntil, setRepeatUntil] = useState('');
    const [selectedDays, setSelectedDays] = useState<number[]>([]); // 0=Sun, 6=Sat

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Helpers
    const timeOptions: string[] = [];
    for (let i = 6; i <= 22; i++) {
        timeOptions.push(`${i.toString().padStart(2, '0')}:00`);
        timeOptions.push(`${i.toString().padStart(2, '0')}:30`);
    }

    useEffect(() => {
        fetchAvailability();
        fetchSchedulePhoto();
    }, [coachId]);

    const fetchAvailability = async () => {
        const { data, error } = await supabase
            .from('availability')
            .select('*')
            .eq('coach_id', coachId)
            .gte('start_time', new Date().toISOString())
            .order('start_time', { ascending: true });

        if (data) setSlots(data);
    };

    const fetchSchedulePhoto = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('schedule_photo_url')
            .eq('id', coachId)
            .single();
        if (data?.schedule_photo_url) setPhotoUrl(data.schedule_photo_url);
    }

    const handleAddSlot = async () => {
        if (!date || !startTime || !endTime) {
            addToast("Please fill all fields", "warning");
            return;
        }
        if (isRepeating && (!repeatUntil || selectedDays.length === 0)) {
            addToast("Please select repeat days and end date", "warning");
            return;
        }

        setLoading(true);
        const slotsToInsert = [];

        if (!isRepeating) {
            const startISO = new Date(`${date}T${startTime}`).toISOString();
            const endISO = new Date(`${date}T${endTime}`).toISOString();
            slotsToInsert.push({ coach_id: coachId, start_time: startISO, end_time: endISO, status: 'available' });
        } else {
            // Generate Recurring Slots
            const start = new Date(date);
            const end = new Date(repeatUntil);

            if (end < start) {
                addToast("End date must be after start date", "error");
                setLoading(false);
                return;
            }

            // Safety: Limit to 6 months (~180 days) to prevent freeze
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays > 180) {
                addToast("For performance, please schedule max 6 months at a time.", "warning");
                setLoading(false);
                return;
            }

            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                if (selectedDays.includes(d.getDay())) {
                    // Create ISO strings for this specific date
                    const dayStr = d.toISOString().split('T')[0];
                    const s = new Date(`${dayStr}T${startTime}`).toISOString();
                    const e = new Date(`${dayStr}T${endTime}`).toISOString();
                    slotsToInsert.push({ coach_id: coachId, start_time: s, end_time: e, status: 'available' });
                }
            }
        }

        const { error } = await supabase.from('availability').insert(slotsToInsert);

        if (error) {
            addToast(error.message, "error");
        } else {
            addToast("Schedule Updated Successfully!", "success");
            if (onScheduleUpdate) onScheduleUpdate();
            else {
                // If no parent update provided, just fetch locally (fallback)
                fetchAvailability();
                onClose();
            }
        }
        setLoading(false);
    };

    const handleDeleteSlot = async (id: string) => {
        const { error } = await supabase.from('availability').delete().eq('id', id);
        if (!error) {
            fetchAvailability();
            if (onScheduleUpdate) onScheduleUpdate();
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;
        setLoading(true);
        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `schedule-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage.from('uploads').upload(filePath, file);

        if (uploadError) {
            addToast('Upload failed', "error");
            setLoading(false);
            return;
        }

        const { data } = supabase.storage.from('uploads').getPublicUrl(filePath);
        const publicUrl = data.publicUrl;

        const { error: dbError } = await supabase
            .from('profiles')
            .update({ schedule_photo_url: publicUrl })
            .eq('id', coachId);

        if (!dbError) {
            setPhotoUrl(publicUrl);
            if (onScheduleUpdate) onScheduleUpdate();
        }
        setLoading(false);
    };


    // Sub-components
    const Menu = () => (
        <div className="flex flex-col gap-4 mt-8">
            <button onClick={() => setView('manual')} className="bg-[#1e1e1e] p-6 rounded-2xl flex items-center justify-between group hover:bg-[#28D160] transition-colors">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center group-hover:bg-white/20">
                        <Calendar className="text-white" size={24} />
                    </div>
                    <div className="text-left">
                        <h3 className="font-black italic text-lg text-white uppercase leading-none">ADD TIME BLOCKS</h3>
                        <p className="text-[10px] font-bold text-gray-400 group-hover:text-white/80 mt-1 uppercase">Set specific hours</p>
                    </div>
                </div>
                <ChevronRight className="text-gray-600 group-hover:text-white" />
            </button>

            <button onClick={() => setView('photo')} className="bg-[#1e1e1e] p-6 rounded-2xl flex items-center justify-between group hover:bg-[#28D160] transition-colors">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center group-hover:bg-white/20">
                        <ImageIcon className="text-white" size={24} />
                    </div>
                    <div className="text-left">
                        <h3 className="font-black italic text-lg text-white uppercase leading-none">UPLOAD SCHEDULE</h3>
                        <p className="text-[10px] font-bold text-gray-400 group-hover:text-white/80 mt-1 uppercase">Photo of paper schedule</p>
                    </div>
                </div>
                <ChevronRight className="text-gray-600 group-hover:text-white" />
            </button>

            {/* Upcoming Slots Preview */}
            <div className="mt-8">
                <h3 className="font-bold text-xs text-gray-500 uppercase tracking-widest mb-4">UPCOMING SLOTS</h3>
                <div className="flex flex-col gap-2">
                    {slots.length === 0 && <p className="text-gray-600 text-sm italic">No slots set.</p>}
                    {slots.slice(0, 3).map(slot => (
                        <div key={slot.id} className="bg-[#1e1e1e] p-3 rounded-lg flex justify-between items-center border border-white/5">
                            <span className="text-white font-bold text-sm">
                                {new Date(slot.start_time).toLocaleDateString()} <span className="text-gray-500">|</span> {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const ManualEntry = () => (
        <div className="flex flex-col h-full">
            <div className="bg-[#1e1e1e] p-6 rounded-2xl mb-8">
                <h3 className="font-black italic text-lg text-white uppercase mb-4">NEW BLOCK</h3>
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">START DATE</label>
                        <input type="date" value={date} onChange={e => {
                            setDate(e.target.value);
                            // Auto-select the day of week
                            if (e.target.value) {
                                const day = new Date(e.target.value).getDay();
                                if (!selectedDays.includes(day)) setSelectedDays([...selectedDays, day]);
                            }
                        }} className="w-full bg-black/40 border-b border-gray-700 text-white p-2 rounded focus:border-[#28D160] outline-none font-bold" />
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1 flex flex-col gap-2">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">START TIME</label>
                            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto scrollbar-hide">
                                {timeOptions.map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setStartTime(t)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${startTime === t ? 'bg-[#28D160] text-black' : 'bg-black/40 text-gray-400 hover:bg-white/10'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col gap-2">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">END TIME</label>
                            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto scrollbar-hide">
                                {timeOptions.map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setEndTime(t)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${endTime === t ? 'bg-[#28D160] text-black' : 'bg-black/40 text-gray-400 hover:bg-white/10'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RECURRING TOGGLE */}
                    <div className="flex flex-col gap-3 mt-2 bg-black/20 p-3 rounded-xl border border-white/5">
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsRepeating(!isRepeating)}>
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${isRepeating ? 'bg-[#28D160] border-[#28D160]' : 'border-gray-500'}`}>
                                {isRepeating && <div className="w-2 h-2 bg-black rounded-full" />}
                            </div>
                            <span className="text-xs font-bold text-white uppercase select-none">Repeat this slot?</span>
                        </div>

                        {isRepeating && (
                            <div className="flex flex-col gap-3 animate-fadeIn">
                                {/* Day Selector */}
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">REPEAT ON</label>
                                    <div className="flex justify-between">
                                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                            <button
                                                key={i}
                                                onClick={() => {
                                                    setSelectedDays(prev => prev.includes(i) ? prev.filter(day => day !== i) : [...prev, i])
                                                }}
                                                className={`w-8 h-8 rounded-full text-[10px] font-black flex items-center justify-center transition-all ${selectedDays.includes(i) ? 'bg-[#28D160] text-black' : 'bg-white/10 text-gray-500 hover:bg-white/20'}`}
                                            >
                                                {d}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {/* Until Date */}
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">UNTIL</label>
                                    <input type="date" value={repeatUntil} onChange={e => setRepeatUntil(e.target.value)} className="w-full bg-black/40 border-b border-gray-700 text-white p-2 rounded focus:border-[#28D160] outline-none font-bold" />
                                </div>
                            </div>
                        )}
                    </div>

                    <button onClick={handleAddSlot} disabled={loading} className="mt-2 w-full bg-[#28D160] text-black font-black italic uppercase py-3 rounded-xl hover:bg-white transition-colors">
                        {loading ? 'ADDING...' : (isRepeating ? 'ADD RECURRING SLOTS' : 'ADD SLOT')}
                    </button>
                    <div className="text-center">
                        <span className="text-[9px] font-bold text-gray-500 uppercase">
                            {isRepeating ? 'Recurs weekly until end date' : 'Single time block'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <h3 className="font-bold text-xs text-gray-500 uppercase tracking-widest mb-4">YOUR SLOTS</h3>
                <div className="flex flex-col gap-2 pb-20">
                    {slots.map(slot => (
                        <div key={slot.id} className="bg-[#1e1e1e] p-4 rounded-xl flex justify-between items-center border border-white/5 group">
                            <div className="flex flex-col">
                                <span className="text-[#28D160] font-black italic text-md uppercase">{new Date(slot.start_time).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                <span className="text-white font-bold text-xs mt-1">
                                    {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(slot.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <button onClick={() => handleDeleteSlot(slot.id)} className="p-2 text-gray-600 hover:text-red-500 transition-colors">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const PhotoUpload = () => (
        <div className="flex flex-col items-center mt-8 px-4">
            <div
                className="w-full aspect-[3/4] bg-[#1e1e1e] rounded-2xl border-2 border-dashed border-gray-700 flex flex-col items-center justify-center cursor-pointer hover:border-[#28D160] hover:bg-[#28D160]/10 transition-all relative overflow-hidden group"
                onClick={() => fileInputRef.current?.click()}
            >
                {photoUrl ? (
                    <>
                        <img src={photoUrl} className="w-full h-full object-contain" />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="font-black italic text-white uppercase">REPLACE PHOTO</span>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="w-16 h-16 rounded-full bg-black/40 flex items-center justify-center mb-4">
                            {loading ? <span className="animate-spin text-2xl">↻</span> : <Camera size={32} className="text-gray-400" />}
                        </div>
                        <span className="text-gray-500 font-bold text-sm uppercase">TAP TO UPLOAD</span>
                    </>
                )}
            </div>
            <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />

            <div className="mt-8 text-center max-w-xs">
                <p className="text-gray-500 text-xs leading-relaxed">
                    Upload a photo of your handwritten schedule. We'll keep it on file for reference.
                </p>
            </div>
        </div>
    );


    return (
        <SettingsContainer>
            <SettingsHeader
                title={view === 'menu' ? "Set Schedule" : view === 'manual' ? "Add Time Blocks" : "Upload Photo"}
                onBack={() => view === 'menu' ? onClose() : setView('menu')}
                isClose={view === 'menu'}
            />
            {view === 'menu' && <Menu />}
            {view === 'manual' && <ManualEntry />}
            {view === 'photo' && <PhotoUpload />}
        </SettingsContainer>
    );
}
