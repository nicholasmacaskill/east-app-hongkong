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
    category: 'CLASS' | 'PRIVATE' | 'FACILITY';
    image_url: string | null;
    description: string | null;
}

export default function ManageServicesPage() {
    const router = useRouter();
    const { addToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [services, setServices] = useState<SessionType[]>([]);
    const [allCoaches, setAllCoaches] = useState<any[]>([]);
    const [selectedCoachIds, setSelectedCoachIds] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Edit/Create State
    const [isEditing, setIsEditing] = useState(false);
    const [currentService, setCurrentService] = useState<Partial<SessionType>>({});

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        setLoading(true);
        // 1. Fetch Services
        const { data: svcData, error: svcError } = await supabase
            .from('session_types')
            .select('*')
            .order('title');

        if (svcError) {
            console.error('Error fetching services:', svcError);
            addToast("Failed to load services", "error");
        } else {
            setServices((svcData as any) || []);
        }

        // 2. Fetch Coaches
        const { data: coachData } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url')
            .eq('role', 'coach')
            .order('first_name');

        if (coachData) setAllCoaches(coachData);

        setLoading(false);
    };

    const handleSave = async () => {
        console.log("handleSave called", currentService);
        if (!currentService.title || !currentService.category) {
            addToast("Please fill in Title and Category", "error");
            return;
        }

        try {
            setLoading(true); // Re-use loading or add a saving state? Let's use a local saving state if possible, but for now re-use loading could be jarring.
            // Actually let's just log for now.

            const payload = {
                title: currentService.title,
                category: currentService.category,
                image_url: currentService.image_url || null,
                description: currentService.description || null
            };

            console.log("Sending payload:", payload);

            let error;
            let serviceId = currentService.id;

            if (serviceId) {
                // Update
                const { error: updateError } = await supabase
                    .from('session_types')
                    .update(payload)
                    .eq('id', serviceId);
                error = updateError;
            } else {
                // Insert
                const { data: newData, error: insertError } = await supabase
                    .from('session_types')
                    .insert([payload])
                    .select();

                if (newData && newData[0]) serviceId = newData[0].id;
                error = insertError;
            }

            if (error) {
                console.error('Error saving service:', error);
                addToast(`Failed to save: ${error.message || JSON.stringify(error)}`, "error");
            } else {
                // SYNC COACH SERVICES
                if (serviceId) {
                    // 1. Delete existing
                    await supabase.from('coach_services').delete().eq('session_type_id', serviceId);

                    // 2. Insert new ones
                    if (selectedCoachIds.length > 0) {
                        const coachPayloads = selectedCoachIds.map(cid => ({
                            coach_id: cid,
                            session_type_id: serviceId
                        }));
                        await supabase.from('coach_services').insert(coachPayloads);
                    }
                }

                addToast("Service saved successfully", "success");
                setIsEditing(false);
                setCurrentService({});
                setSelectedCoachIds([]);
                fetchServices();
            }
        } catch (e: any) {
            console.error("Exception in handleSave:", e);
            addToast(`Exception: ${e.message}`, "error");
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
            addToast("Failed to delete service", "error");
        } else {
            addToast("Service deleted", "success");
            fetchServices();
        }
    };

    const openEdit = async (service: SessionType) => {
        setCurrentService(service);
        // Fetch existing coach assignments
        const { data } = await supabase
            .from('coach_services')
            .select('coach_id')
            .eq('session_type_id', service.id);

        if (data) setSelectedCoachIds(data.map(d => d.coach_id));
        else setSelectedCoachIds([]);

        setIsEditing(true);
    };

    const openNew = () => {
        setCurrentService({ category: 'CLASS' }); // Default
        setSelectedCoachIds([]);
        setIsEditing(true);
    };

    return (
        <div className="pb-32 w-full overflow-x-hidden">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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
                    className="flex w-full md:w-auto justify-center items-center gap-2 bg-[#28D160] text-black px-4 py-2 rounded-lg font-bold uppercase tracking-wider hover:bg-[#20aa4f] transition-colors self-start md:self-auto"
                >
                    <Plus size={18} /> Add Service
                </button>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <div key={service.id} className="bg-[#1e1e1e] border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 group hover:border-[#28D160] transition-colors">
                            <div className="w-16 h-16 bg-gray-900 rounded-lg overflow-hidden flex-shrink-0 relative">
                                {service.image_url ? (
                                    <img src={service.image_url} alt={service.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                                        <LayoutGrid size={24} />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0 w-full sm:w-auto">
                                <h3 className="font-bold text-lg truncate">{service.title}</h3>
                                <div className="flex flex-wrap gap-1">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-black uppercase whitespace-nowrap ${service.category === 'CLASS' ? 'bg-blue-400' :
                                        service.category === 'PRIVATE' ? 'bg-purple-400' :
                                            'bg-[#28D160]'
                                        }`}>
                                        {service.category}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity self-end sm:self-auto">
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
                    <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
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
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                                <textarea
                                    value={currentService.description || ''}
                                    onChange={e => setCurrentService({ ...currentService, description: e.target.value })}
                                    className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#28D160] min-h-[80px]"
                                    placeholder="Describe this service for the booking modal..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        onClick={() => setCurrentService({ ...currentService, category: 'CLASS' })}
                                        className={`p-3 rounded-lg border font-bold text-[10px] transition-colors ${currentService.category === 'CLASS' ? 'bg-blue-500/20 border-blue-500 text-blue-500' : 'bg-black border-white/10 text-gray-500 hover:border-white/30'}`}
                                    >
                                        CLASS
                                    </button>
                                    <button
                                        onClick={() => setCurrentService({ ...currentService, category: 'PRIVATE' })}
                                        className={`p-3 rounded-lg border font-bold text-[10px] transition-colors ${currentService.category === 'PRIVATE' ? 'bg-purple-500/20 border-purple-500 text-purple-500' : 'bg-black border-white/10 text-gray-500 hover:border-white/30'}`}
                                    >
                                        PRIVATE
                                    </button>
                                    <button
                                        onClick={() => setCurrentService({ ...currentService, category: 'FACILITY' })}
                                        className={`p-3 rounded-lg border font-bold text-[10px] transition-colors ${currentService.category === 'FACILITY' ? 'bg-[#28D160]/20 border-[#28D160] text-[#28D160]' : 'bg-black border-white/10 text-gray-500 hover:border-white/30'}`}
                                    >
                                        FACILITY
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
                                        <img src={currentService.image_url} alt="Preview" className="h-20 mx-auto rounded-lg object-cover" />
                                    </div>
                                )}
                            </div>

                            {/* Coach Selection */}
                            <div className="border-t border-white/5 pt-4">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Assign Coaches</label>
                                    <span className="text-[10px] text-[#28D160] font-black uppercase">{selectedCoachIds.length} Selected</span>
                                </div>

                                <input
                                    type="text"
                                    placeholder="Search coaches..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs mb-3 focus:border-[#28D160] outline-none"
                                />

                                <div className="max-h-40 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                                    {allCoaches
                                        .filter(c => `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()))
                                        .map(coach => {
                                            const isSelected = selectedCoachIds.includes(coach.id);
                                            return (
                                                <button
                                                    key={coach.id}
                                                    onClick={() => {
                                                        if (isSelected) setSelectedCoachIds(selectedCoachIds.filter(id => id !== coach.id));
                                                        else setSelectedCoachIds([...selectedCoachIds, coach.id]);
                                                    }}
                                                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors border ${isSelected ? 'bg-[#28D160]/10 border-[#28D160]/30' : 'bg-black/40 border-transparent hover:bg-white/5'}`}
                                                >
                                                    <div className="w-6 h-6 rounded-full bg-gray-800 overflow-hidden flex-shrink-0">
                                                        {coach.avatar_url ? <img src={coach.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-east-light/20" />}
                                                    </div>
                                                    <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                                                        {coach.first_name} {coach.last_name}
                                                    </span>
                                                    {isSelected && <div className="ml-auto w-2 h-2 bg-[#28D160] rounded-full shadow-[0_0_8px_#28D160]" />}
                                                </button>
                                            );
                                        })
                                    }
                                </div>
                            </div>

                            <button
                                onClick={handleSave}
                                className="w-full bg-[#28D160] text-black font-bold uppercase py-4 rounded-xl mt-4 hover:bg-[#20aa4f] transition-colors shadow-lg active:scale-95 transition-transform"
                            >
                                {currentService.id ? 'Update Service' : 'Create Service'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
