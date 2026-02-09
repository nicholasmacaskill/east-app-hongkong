'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Edit2, LayoutGrid, Save, X, Loader2, Calendar, Clock, Sparkles } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';
import { useToast } from '@/app/components/ui/Toast';

interface SessionType {
    id: string;
    title: string;
    category: 'CLASS' | 'PRIVATE' | 'FACILITY';
    image_url: string | null;
    description: string | null;
    credit_cost?: number;
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

    // Generator State
    const [showGenerator, setShowGenerator] = useState(false);
    const [generatorConfig, setGeneratorConfig] = useState({
        serviceId: '',
        serviceTitle: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
        startHour: 8,
        endHour: 20,
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // All days
        durationMinutes: 60,
        coachId: ''
    });
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        setLoading(true);
        try {
            // 1. Fetch Services
            const res = await fetch('/api/admin/services');
            const svcData = await res.json();

            if (!res.ok) {
                console.error('Error fetching services:', svcData.error);
                addToast("Failed to load services", "error");
            } else {
                setServices(svcData || []);
            }

            // 2. Fetch Coaches
            const { data: coachData } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, avatar_url')
                .eq('role', 'coach')
                .order('first_name');

            if (coachData) setAllCoaches(coachData);
        } catch (e: any) {
            console.error('Error in fetchServices:', e);
            addToast("Failed to load data", "error");
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!currentService.title || !currentService.category) {
            addToast("Please fill in Title and Category", "error");
            return;
        }

        try {
            setLoading(true);

            const payload = {
                title: currentService.title,
                category: currentService.category,
                image_url: currentService.image_url || null,
                description: currentService.description || null,
                credit_cost: currentService.credit_cost || 0
            };

            let serviceId = currentService.id;

            const res = await fetch('/api/admin/services', {
                method: serviceId ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...payload,
                    id: serviceId,
                    coachIds: selectedCoachIds
                })
            });

            const result = await res.json();

            if (!res.ok) {
                console.error('Error saving service:', result.error);
                addToast(`Failed to save: ${result.error}`, "error");
            } else {
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
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this service?')) return;

        const res = await fetch(`/api/admin/services?id=${id}`, {
            method: 'DELETE'
        });

        if (!res.ok) {
            const result = await res.json();
            console.error('Error deleting service:', result.error);
            addToast("Failed to delete service", "error");
        } else {
            addToast("Service deleted", "success");
            fetchServices();
        }
    };

    const openEdit = async (service: SessionType) => {
        setCurrentService(service);
        const { data } = await supabase
            .from('coach_services')
            .select('coach_id')
            .eq('session_type_id', service.id);

        if (data) setSelectedCoachIds(data.map(d => d.coach_id));
        else setSelectedCoachIds([]);

        setIsEditing(true);
    };

    const openNew = () => {
        setCurrentService({ category: 'CLASS' });
        setSelectedCoachIds([]);
        setIsEditing(true);
    };

    const openGenerator = (service: SessionType) => {
        setGeneratorConfig({
            ...generatorConfig,
            serviceId: service.id,
            serviceTitle: service.title,
            coachId: '' // Reset coach
        });
        setShowGenerator(true);
    };

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const res = await fetch('/api/admin/generate-schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(generatorConfig)
            });
            const data = await res.json();
            if (data.success) {
                addToast(data.message, "success");
                setShowGenerator(false);
            } else {
                addToast(data.error || "Generation failed", "error");
            }
        } catch (e: any) {
            addToast(`Error: ${e.message}`, "error");
        }
        setGenerating(false);
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
                        <div key={service.id} className="bg-[#1e1e1e] border border-white/5 rounded-xl p-4 flex flex-col items-start gap-4 group hover:border-[#28D160] transition-colors relative">
                            <div className="flex w-full gap-4">
                                <div className="w-16 h-16 bg-gray-900 rounded-lg overflow-hidden flex-shrink-0 relative">
                                    {service.image_url ? (
                                        <img src={service.image_url} alt={service.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                                            <LayoutGrid size={24} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
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
                            </div>

                            <div className="flex w-full justify-between items-center border-t border-white/5 pt-3 mt-1">
                                <button
                                    onClick={() => openGenerator(service)}
                                    className="text-[10px] font-bold uppercase tracking-wider text-[#28D160] hover:text-white flex items-center gap-1 transition-colors"
                                >
                                    <Sparkles size={12} /> Generate Schedule
                                </button>

                                <div className="flex items-center gap-2">
                                    <button onClick={() => openEdit(service)} className="p-2 hover:bg-white/10 rounded-lg text-blue-400">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(service.id)} className="p-2 hover:bg-white/10 rounded-lg text-red-400">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Edit Modal */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
                        <button onClick={() => setIsEditing(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={24} /></button>
                        <h2 className="text-xl font-bold mb-6">{currentService.id ? 'Edit Service' : 'Create New Service'}</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Service Title</label>
                                <input type="text" value={currentService.title || ''} onChange={e => setCurrentService({ ...currentService, title: e.target.value })} className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#28D160]" placeholder="e.g. Golf, Hyrox" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Credit Cost</label>
                                <input type="number" value={currentService.credit_cost || 0} onChange={e => setCurrentService({ ...currentService, credit_cost: parseInt(e.target.value) || 0 })} className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#28D160]" placeholder="100" />
                            </div>
                            {/* ... (Rest of existing edit modal fields) ... */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                                <textarea value={currentService.description || ''} onChange={e => setCurrentService({ ...currentService, description: e.target.value })} className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#28D160] min-h-[80px]" placeholder="Describe this service..." />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['CLASS', 'PRIVATE', 'FACILITY'].map(cat => (
                                        <button key={cat} onClick={() => setCurrentService({ ...currentService, category: cat as any })} className={`p-3 rounded-lg border font-bold text-[10px] transition-colors ${currentService.category === cat ? 'bg-white/10 border-white text-white' : 'bg-black border-white/10 text-gray-500'}`}>{cat}</button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Image URL</label>
                                <input type="text" value={currentService.image_url || ''} onChange={e => setCurrentService({ ...currentService, image_url: e.target.value })} className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#28D160]" placeholder="https://..." />
                            </div>

                            {/* Coach Selection */}
                            <div className="border-t border-white/5 pt-4">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Assign Coaches</label>
                                    <span className="text-[10px] text-[#28D160] font-black uppercase">{selectedCoachIds.length} Selected</span>
                                </div>
                                <input type="text" placeholder="Search coaches..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs mb-3 focus:border-[#28D160] outline-none" />
                                <div className="max-h-40 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                                    {allCoaches.filter(c => `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())).map(coach => {
                                        const isSelected = selectedCoachIds.includes(coach.id);
                                        return (
                                            <button key={coach.id} onClick={() => isSelected ? setSelectedCoachIds(selectedCoachIds.filter(id => id !== coach.id)) : setSelectedCoachIds([...selectedCoachIds, coach.id])} className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors border ${isSelected ? 'bg-[#28D160]/10 border-[#28D160]/30' : 'bg-black/40 border-transparent hover:bg-white/5'}`}>
                                                <div className="w-6 h-6 rounded-full bg-gray-800 overflow-hidden flex-shrink-0">{coach.avatar_url ? <img src={coach.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-east-light/20" />}</div>
                                                <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-gray-400'}`}>{coach.first_name} {coach.last_name}</span>
                                                {isSelected && <div className="ml-auto w-2 h-2 bg-[#28D160] rounded-full shadow-[0_0_8px_#28D160]" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <button onClick={handleSave} className="w-full bg-[#28D160] text-black font-bold uppercase py-4 rounded-xl mt-4 hover:bg-[#20aa4f] transition-colors shadow-lg active:scale-95 transition-transform">{currentService.id ? 'Update Service' : 'Create Service'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Generator Modal */}
            {showGenerator && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl w-full max-w-lg p-6 relative shadow-2xl">
                        <button onClick={() => setShowGenerator(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={24} /></button>

                        <div className="mb-6">
                            <h2 className="text-xl font-black italic uppercase tracking-tighter text-[#28D160]">Generate Schedule</h2>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">{generatorConfig.serviceTitle}</p>
                        </div>

                        <div className="space-y-6">
                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1.5 flex items-center gap-1"><Calendar size={10} /> Start Date</label>
                                    <input type="date" value={generatorConfig.startDate} onChange={e => setGeneratorConfig({ ...generatorConfig, startDate: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#28D160]" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1.5 flex items-center gap-1"><Calendar size={10} /> End Date</label>
                                    <input type="date" value={generatorConfig.endDate} onChange={e => setGeneratorConfig({ ...generatorConfig, endDate: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#28D160]" />
                                </div>
                            </div>

                            {/* Time */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1.5 flex items-center gap-1"><Clock size={10} /> Hours (0-23)</label>
                                    <div className="flex gap-2">
                                        <input type="number" min="0" max="23" value={generatorConfig.startHour} onChange={e => setGeneratorConfig({ ...generatorConfig, startHour: parseInt(e.target.value) })} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white text-center outline-none focus:border-[#28D160]" />
                                        <span className="text-gray-500 self-center">-</span>
                                        <input type="number" min="0" max="24" value={generatorConfig.endHour} onChange={e => setGeneratorConfig({ ...generatorConfig, endHour: parseInt(e.target.value) })} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white text-center outline-none focus:border-[#28D160]" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1.5">Slot Duration</label>
                                    <select value={generatorConfig.durationMinutes} onChange={e => setGeneratorConfig({ ...generatorConfig, durationMinutes: parseInt(e.target.value) })} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#28D160]">
                                        <option value="30">30 Minutes</option>
                                        <option value="60">60 Minutes</option>
                                        <option value="90">90 Minutes</option>
                                        <option value="120">2 Hours</option>
                                    </select>
                                </div>
                            </div>

                            {/* Days Selection */}
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1.5">Active Days</label>
                                <div className="flex gap-1">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                                        <button key={d} onClick={() => {
                                            const days = generatorConfig.daysOfWeek.includes(i) ? generatorConfig.daysOfWeek.filter(x => x !== i) : [...generatorConfig.daysOfWeek, i];
                                            setGeneratorConfig({ ...generatorConfig, daysOfWeek: days });
                                        }} className={`flex-1 h-8 rounded-lg flex items-center justify-center text-[10px] font-black uppercase transition-all ${generatorConfig.daysOfWeek.includes(i) ? 'bg-[#28D160] text-black' : 'bg-black/40 text-gray-500 hover:bg-white/10'}`}>
                                            {d.charAt(0)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Coach Selection (Optional) */}
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1.5 flex justify-between items-center">
                                    <span>Assigned Coach <span className="text-gray-600 font-normal lowercase">(optional)</span></span>
                                </label>
                                <select
                                    value={generatorConfig.coachId}
                                    onChange={e => setGeneratorConfig({ ...generatorConfig, coachId: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#28D160]"
                                >
                                    <option value="">No Specific Coach (Facility/Staff)</option>
                                    {allCoaches.map(coach => (
                                        <option key={coach.id} value={coach.id}>
                                            {coach.first_name} {coach.last_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button onClick={handleGenerate} disabled={generating} className="w-full bg-[#28D160] text-black font-black uppercase py-4 rounded-xl hover:bg-white transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2">
                                {generating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                                {generating ? 'Generating Content...' : 'Generate Slots Now'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
