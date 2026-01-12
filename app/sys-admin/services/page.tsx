'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Edit2, LayoutGrid, Save, X, Loader2 } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';
import { useToast } from '@/app/components/ui/Toast';

interface SessionType {
    id: string;
    title: string;
    category: 'CLASS' | 'PRIVATE';
    image_url: string | null;
}

export default function ManageServicesPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [services, setServices] = useState<SessionType[]>([]);

    // Edit/Create State
    const [isEditing, setIsEditing] = useState(false);
    const [currentService, setCurrentService] = useState<Partial<SessionType>>({});

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('session_types')
            .select('*')
            .order('title');

        if (error) {
            console.error('Error fetching services:', error);
            toast("Failed to load services", "error");
        } else {
            setServices((data as any) || []);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!currentService.title || !currentService.category) {
            toast("Please fill in Title and Category", "error");
            return;
        }

        const payload = {
            title: currentService.title,
            category: currentService.category,
            image_url: currentService.image_url || null
        };

        let error;
        if (currentService.id) {
            // Update
            const { error: updateError } = await supabase
                .from('session_types')
                .update(payload)
                .eq('id', currentService.id);
            error = updateError;
        } else {
            // Insert
            const { error: insertError } = await supabase
                .from('session_types')
                .insert([payload]);
            error = insertError;
        }

        if (error) {
            console.error('Error saving service:', error);
            toast("Failed to save service", "error");
        } else {
            toast("Service saved successfully", "success");
            setIsEditing(false);
            setCurrentService({});
            fetchServices();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this service?')) return;

        const { error } = await supabase
            .from('session_types')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting service:', error);
            toast("Failed to delete service", "error");
        } else {
            toast("Service deleted", "success");
            fetchServices();
        }
    };

    const openEdit = (service: SessionType) => {
        setCurrentService(service);
        setIsEditing(true);
    };

    const openNew = () => {
        setCurrentService({ category: 'CLASS' }); // Default
        setIsEditing(true);
    };

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8 pb-32">
            {/* Header */}
            <div className="max-w-4xl mx-auto mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/sys-admin" className="p-2 bg-gray-900 rounded-full hover:bg-gray-800 transition-colors">
                        <ArrowLeft size={20} className="text-gray-400" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black italic uppercase tracking-tighter">Manage Services</h1>
                        <p className="text-gray-400 text-sm">Define Class & Private Lesson Types</p>
                    </div>
                </div>
                <button
                    onClick={openNew}
                    className="flex items-center gap-2 bg-[#28D160] text-black px-4 py-2 rounded-lg font-bold uppercase tracking-wider hover:bg-[#20aa4f] transition-colors"
                >
                    <Plus size={18} /> Add Service
                </button>
            </div>

            {/* List */}
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                {loading ? (
                    <div className="col-span-full flex justify-center py-12">
                        <Loader2 className="animate-spin text-gray-500" />
                    </div>
                ) : services.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        No services defined. Add one to get started.
                    </div>
                ) : (
                    services.map(service => (
                        <div key={service.id} className="bg-[#1e1e1e] border border-white/5 rounded-xl p-4 flex items-center gap-4 group hover:border-[#28D160] transition-colors">
                            <div className="w-16 h-16 bg-gray-900 rounded-lg overflow-hidden flex-shrink-0 relative">
                                {service.image_url ? (
                                    <img src={service.image_url} alt={service.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                                        <LayoutGrid size={24} />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-lg">{service.title}</h3>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-black uppercase ${service.category === 'CLASS' ? 'bg-blue-400' : 'bg-purple-400'}`}>
                                    {service.category}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEdit(service)} className="p-2 hover:bg-white/10 rounded-lg text-blue-400">
                                    <Edit2 size={18} />
                                </button>
                                <button onClick={() => handleDelete(service.id)} className="p-2 hover:bg-white/10 rounded-lg text-red-400">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl w-full max-w-md p-6 relative">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            <X size={24} />
                        </button>

                        <h2 className="text-xl font-bold mb-6">
                            {currentService.id ? 'Edit Service' : 'New Service'}
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Service Title</label>
                                <input
                                    type="text"
                                    value={currentService.title || ''}
                                    onChange={e => setCurrentService({ ...currentService, title: e.target.value })}
                                    className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#28D160]"
                                    placeholder="e.g. Golf, Hyrox"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setCurrentService({ ...currentService, category: 'CLASS' })}
                                        className={`p-3 rounded-lg border font-bold text-sm transition-colors ${currentService.category === 'CLASS' ? 'bg-blue-500/20 border-blue-500 text-blue-500' : 'bg-black border-white/10 text-gray-500 hover:border-white/30'}`}
                                    >
                                        CLASS
                                    </button>
                                    <button
                                        onClick={() => setCurrentService({ ...currentService, category: 'PRIVATE' })}
                                        className={`p-3 rounded-lg border font-bold text-sm transition-colors ${currentService.category === 'PRIVATE' ? 'bg-purple-500/20 border-purple-500 text-purple-500' : 'bg-black border-white/10 text-gray-500 hover:border-white/30'}`}
                                    >
                                        PRIVATE
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Image URL</label>
                                <input
                                    type="text"
                                    value={currentService.image_url || ''}
                                    onChange={e => setCurrentService({ ...currentService, image_url: e.target.value })}
                                    className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#28D160]"
                                    placeholder="https://..."
                                />
                                {currentService.image_url && (
                                    <div className="mt-2 text-center">
                                        <img src={currentService.image_url} alt="Preview" className="h-32 mx-auto rounded-lg object-cover" />
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleSave}
                                className="w-full bg-[#28D160] text-black font-bold uppercase py-4 rounded-xl mt-4 hover:bg-[#20aa4f] transition-colors"
                            >
                                Save Service
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
