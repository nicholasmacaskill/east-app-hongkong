'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Edit2, Upload, X, Save, Calendar, Clock, DollarSign } from 'lucide-react';
import { useToast } from '@/app/components/ui/Toast';
import { safeDate, safetoLocaleDateString, formatHK, toHKPickerValue } from '@/app/lib/dateUtils';

interface EventItem {
    id: number;
    title: string;
    description: string;
    image_url: string;
    start_time: string;
    end_time: string;
    credit_cost: number;
    instructor?: string;
}

export default function AdminEventsPage() {
    const router = useRouter();
    const [events, setEvents] = useState<EventItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentItem, setCurrentItem] = useState<Partial<EventItem>>({});
    const { addToast } = useToast();
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('sessions')
            .select('*')
            .eq('category', 'EVENT')
            .order('start_time', { ascending: false });

        if (error) console.error('Error fetching events:', error);
        else setEvents(data || []);
        setLoading(false);
    };

    const handleEdit = (item: EventItem) => {
        setCurrentItem({
            ...item,
            // Ensure dates are converted to local string for input[type="datetime-local"]
            start_time: item.start_time,
            end_time: item.end_time
        });
        setIsEditing(true);
    };

    const handleCreate = () => {
        const now = new Date();
        const OneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

        setCurrentItem({
            title: '',
            description: '',
            image_url: '',
            start_time: now.toISOString(),
            end_time: OneHourLater.toISOString(), // Default 1 hour duration
            credit_cost: 0,
            instructor: 'East HK'
        });
        setIsEditing(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this event? This will remove it from user calendars.')) return;

        const { error } = await supabase
            .from('sessions')
            .delete()
            .eq('id', id);

        if (error) addToast('Error deleting event: ' + error.message, 'error');
        else {
            addToast('Event deleted', 'success');
            fetchEvents();
        }
    };

    const handleSave = async () => {
        if (!currentItem.title || !currentItem.description || !currentItem.start_time || !currentItem.end_time) {
            addToast('Title, Description, and Dates are required.', 'warning');
            return;
        }

        const payload = {
            title: currentItem.title,
            description: currentItem.description,
            image_url: currentItem.image_url,
            start_time: safeDate(currentItem.start_time)?.toISOString(),
            end_time: safeDate(currentItem.end_time)?.toISOString(),
            credit_cost: Number(currentItem.credit_cost) || 0,
            instructor: currentItem.instructor || 'East HK',
            category: 'EVENT'
        };

        let error;
        if (currentItem.id) {
            // Update
            const res = await supabase
                .from('sessions')
                .update(payload)
                .eq('id', currentItem.id);
            error = res.error;
        } else {
            // Create
            const res = await supabase
                .from('sessions')
                .insert(payload);
            error = res.error;
        }

        if (error) {
            addToast('Error saving event: ' + error.message, 'error');
        } else {
            addToast('Event saved successfully', 'success');
            setIsEditing(false);
            fetchEvents();
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setUploading(true);
        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `event-${Math.random()}.${fileExt}`;
        const filePath = `news/${fileName}`; // Reuse news bucket folder or create 'events' if strict

        const { error: uploadError } = await supabase.storage
            .from('uploads')
            .upload(filePath, file);

        if (uploadError) {
            addToast('Error uploading image: ' + uploadError.message, 'error');
            setUploading(false);
            return;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('uploads')
            .getPublicUrl(filePath);

        setCurrentItem({ ...currentItem, image_url: publicUrl });
        setUploading(false);
    };

    // Helper to format datetime-local value using HK timezone
    const toHKPicker = (isoString?: string) => toHKPickerValue(isoString);

    return (
        <div className="p-4 md:p-8 text-white bg-black min-h-screen font-montserrat pb-24">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6 md:mb-10">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-east-light">Event Management</h1>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">Special events and workshops</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex w-full md:w-auto justify-center items-center gap-2 bg-east-light text-black px-6 py-3 rounded-full font-black italic uppercase tracking-wider hover:bg-white transition-all shadow-lg active:scale-95"
                >
                    <Plus size={18} />
                    Create Event
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center py-20 gap-3">
                    <div className="w-6 h-6 border-2 border-east-light border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Fetching Events</p>
                </div>
            ) : (
                <div className="grid gap-4 md:gap-6">
                    {events.map(item => (
                        <div key={item.id} className="bg-[#111111] border border-white/5 p-4 md:p-5 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center gap-4 md:gap-6 shadow-xl hover:border-white/10 transition-all group">
                            <div className="w-full h-48 md:w-28 md:h-28 bg-black rounded-xl overflow-hidden shrink-0 border border-white/5 relative">
                                {item.image_url ? (
                                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-800">
                                        <Calendar size={32} />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-black italic text-xl uppercase tracking-tight text-white mb-2">{item.title}</h3>
                                <p className="text-gray-400 text-sm line-clamp-2 mb-4 font-medium leading-relaxed">{item.description}</p>
                                <div className="flex flex-wrap items-center gap-3 md:gap-5 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                    <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full">
                                        <Calendar size={12} className="text-east-light" />
                                        {safetoLocaleDateString(item.start_time)}
                                    </span>
                                    <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full">
                                        <Clock size={12} className="text-east-light" />
                                        {formatHK(item.start_time, 'h:mm a')}
                                    </span>
                                    <span className="flex items-center gap-1.5 bg-east-light/10 text-east-light px-2.5 py-1 rounded-full border border-east-light/20">
                                        <DollarSign size={12} />
                                        {item.credit_cost > 0 ? `${item.credit_cost} Credits` : 'FREE'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-row md:flex-col gap-2 mt-2 md:mt-0">
                                <button
                                    onClick={() => handleEdit(item)}
                                    className="flex-1 md:flex-none p-3 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all flex justify-center items-center"
                                >
                                    <Edit2 size={20} />
                                </button>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="flex-1 md:flex-none p-3 bg-red-500/10 text-red-400 hover:text-white hover:bg-red-500 rounded-xl transition-all flex justify-center items-center"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {events.length === 0 && (
                        <div className="text-center py-20 border border-dashed border-white/5 rounded-3xl">
                            <p className="text-gray-500 italic uppercase font-black tracking-widest text-xs">No upcoming events found.</p>
                        </div>
                    )}
                </div>
            )}

            {/* EDITOR MODAL */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-[#111111] w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/10">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/20">
                            <div>
                                <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">
                                    {currentItem.id ? 'Edit Event' : 'New Event'}
                                </h2>
                                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">Event Configuration</p>
                            </div>
                            <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-white transition-colors">
                                <X size={28} />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto space-y-8 no-scrollbar">
                            {/* Image Section */}
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">Cover Image</label>
                                <div className="flex items-center gap-6">
                                    <div className="w-40 h-40 bg-black rounded-2xl overflow-hidden border border-white/10 relative group">
                                        {currentItem.image_url ? (
                                            <img src={currentItem.image_url} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-800">
                                                <Upload size={32} />
                                            </div>
                                        )}
                                        {uploading && (
                                            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-east-light text-[10px] font-black uppercase tracking-widest">
                                                <div className="w-4 h-4 border-2 border-east-light border-t-transparent rounded-full animate-spin mb-2" />
                                                Uploading...
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center hover:bg-white/10 transition-all cursor-pointer">
                                                <span className="text-xs font-bold uppercase tracking-widest text-white">Select New Image</span>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-3 font-medium">JPG, PNG or WebP. recommended: 1200x800px.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 font-montserrat">Event Title</label>
                                    <input
                                        type="text"
                                        value={currentItem.title || ''}
                                        onChange={e => setCurrentItem({ ...currentItem, title: e.target.value })}
                                        className="w-full bg-black border border-white/10 rounded-xl p-4 text-white font-black italic uppercase placeholder:text-gray-700 focus:outline-none focus:border-east-light transition-all"
                                        placeholder="E.G. SUMMER CAMP CHAMPIONSHIP"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Description</label>
                                    <textarea
                                        value={currentItem.description || ''}
                                        onChange={e => setCurrentItem({ ...currentItem, description: e.target.value })}
                                        className="w-full bg-black border border-white/10 rounded-xl p-4 text-white text-sm h-32 focus:outline-none focus:border-east-light transition-all placeholder:text-gray-700"
                                        placeholder="PROVIDE DETAILED EVENT INFORMATION..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Starts At</label>
                                        <input
                                            type="datetime-local"
                                            value={toHKPicker(currentItem.start_time)}
                                            onChange={e => setCurrentItem({ ...currentItem, start_time: new Date(e.target.value).toISOString() })}
                                            className="w-full bg-black border border-white/10 rounded-xl p-4 text-white text-xs uppercase focus:outline-none focus:border-east-light transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Ends At</label>
                                        <input
                                            type="datetime-local"
                                            value={toHKPicker(currentItem.end_time)}
                                            onChange={e => setCurrentItem({ ...currentItem, end_time: new Date(e.target.value).toISOString() })}
                                            className="w-full bg-black border border-white/10 rounded-xl p-4 text-white text-xs uppercase focus:outline-none focus:border-east-light transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-east-light mb-2 italic">Credit Cost</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                value={currentItem.credit_cost || 0}
                                                onChange={e => setCurrentItem({ ...currentItem, credit_cost: parseInt(e.target.value) })}
                                                className="w-full bg-black border border-east-light/20 rounded-xl p-4 text-east-light font-black italic text-xl focus:outline-none focus:border-east-light transition-all"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-east-light/50 uppercase italic">CREDITS</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Special Instructor</label>
                                        <input
                                            type="text"
                                            value={currentItem.instructor || ''}
                                            onChange={e => setCurrentItem({ ...currentItem, instructor: e.target.value })}
                                            className="w-full bg-black border border-white/10 rounded-xl p-4 text-white text-xs uppercase focus:outline-none focus:border-east-light transition-all"
                                            placeholder="E.G. COACH NICK"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 border-t border-white/5 flex gap-4 bg-black/20">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="flex-1 px-6 py-4 rounded-xl text-xs font-black uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/5 transition-all outline-none"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-[2] bg-east-light text-black font-black italic uppercase text-lg py-4 rounded-xl hover:bg-white transition-all shadow-lg shadow-east-light/10 flex items-center justify-center gap-3 active:scale-[0.98]"
                            >
                                <Save size={20} />
                                Save & Publish
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
