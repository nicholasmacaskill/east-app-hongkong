'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, LayoutGrid, X, Loader2, Calendar, Clock, Sparkles, Search } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';
import { useToast } from '@/app/components/ui/Toast';

interface SessionType {
    id: string;
    title: string;
    category: 'CLASS' | 'PRIVATE' | 'FACILITY';
    image_url: string | null;
    description: string | null;
    credit_cost?: number;
    default_capacity?: number;
}

export default function AdminOpsServicesPage() {
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
        startTime: '08:00',
        endTime: '20:00',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6], 
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
            const res = await fetch('/api/admin/services');
            const svcData = await res.json();

            if (!res.ok) {
                console.error('Error fetching services:', svcData.error);
                addToast("Failed to load services", "error");
            } else {
                setServices(svcData || []);
            }

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
                credit_cost: currentService.credit_cost || 0,
                default_capacity: currentService.default_capacity || null
            };

            const serviceId = currentService.id;

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
                addToast(`Failed to save: ${result.error}`, "error");
            } else {
                addToast("Service saved successfully", "success");
                setIsEditing(false);
                setCurrentService({});
                setSelectedCoachIds([]);
                fetchServices();
            }
        } catch (e: any) {
            addToast(`Error: ${e.message}`, "error");
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this service?')) return;

        const res = await fetch(`/api/admin/services?id=${id}`, {
            method: 'DELETE'
        });

        if (!res.ok) {
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
            coachId: '' 
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
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-2">
                        Manage <span className="text-[#28D160]">Services</span>
                    </h1>
                    <p className="text-gray-400 text-sm font-medium"> Roster of all classes, private lessons, and facility access types.</p>
                </div>
                <button
                    onClick={openNew}
                    className="flex items-center gap-2 bg-[#28D160] text-black px-6 py-3 rounded-xl font-black uppercase italic tracking-wider hover:bg-white transition-all shadow-[0_0_20px_rgba(40,209,96,0.3)] active:scale-95"
                >
                    <Plus size={20} /> Add New Service
                </button>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4 text-gray-500">
                        <Loader2 className="animate-spin" size={32} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Hydrating Services...</span>
                    </div>
                ) : services.length === 0 ? (
                    <div className="col-span-full py-20 bg-[#1a1a1a] border border-white/5 rounded-3xl text-center text-gray-500">
                        <LayoutGrid size={48} className="mx-auto mb-4 opacity-10" />
                        <p className="text-sm font-medium">No services found. Start by adding your first operational unit.</p>
                    </div>
                ) : (
                    services.map(service => (
                        <div key={service.id} className="bg-[#1a1a1a] border border-white/5 rounded-3xl p-6 flex flex-col gap-6 group hover:border-[#28D160] transition-all relative overflow-hidden shadow-xl">
                            <div className="flex gap-4">
                                <div className="w-20 h-20 bg-black/40 rounded-2xl overflow-hidden flex-shrink-0 border border-white/5">
                                    {service.image_url ? (
                                        <img src={service.image_url} alt={service.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-700">
                                            <LayoutGrid size={32} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-xl font-black uppercase italic tracking-tight mb-2 group-hover:text-[#28D160] transition-colors truncate">{service.title}</h3>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                            service.category === 'CLASS' ? 'bg-blue-500/20 text-blue-400' :
                                            service.category === 'PRIVATE' ? 'bg-purple-500/20 text-purple-400' :
                                            'bg-[#28D160]/20 text-[#28D160]'
                                        }`}>
                                            {service.category}
                                        </span>
                                        <span className="text-[10px] font-black text-gray-600 uppercase italic">
                                            {service.credit_cost} Credits
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => openGenerator(service)}
                                    className="w-full bg-white/5 border border-white/5 hover:bg-[#28D160] hover:text-black hover:border-transparent rounded-xl py-3 px-4 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                                >
                                    <Sparkles size={14} /> Generate Schedule
                                </button>
                                
                                <div className="flex gap-2">
                                    <button onClick={() => openEdit(service)} className="flex-1 bg-white/5 hover:bg-white/10 p-3 rounded-xl flex items-center justify-center transition-colors">
                                        <Edit2 size={16} className="text-gray-400" />
                                    </button>
                                    <button onClick={() => handleDelete(service.id)} className="flex-1 bg-white/5 hover:bg-red-500/20 p-3 rounded-xl flex items-center justify-center transition-colors group/del">
                                        <Trash2 size={16} className="text-gray-400 group-hover/del:text-red-500" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modals - Simplified for operations */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-[2.5rem] w-full max-w-lg p-10 relative max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl">
                        <button onClick={() => setIsEditing(false)} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors border border-white/5 p-2 rounded-full"><X size={20} /></button>
                        
                        <div className="mb-8">
                            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-[#28D160]">
                                {currentService.id ? 'Refine Service' : 'Blueprint New Service'}
                            </h2>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2 px-1">Service Specification</p>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="px-1 block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Service Title</label>
                                    <input type="text" value={currentService.title || ''} onChange={e => setCurrentService({ ...currentService, title: e.target.value })} className="w-full bg-black/60 border border-white/5 rounded-2xl p-4 text-white font-bold placeholder:text-gray-800 focus:outline-none focus:border-[#28D160] transition-colors" placeholder="e.g. STRENGTH LAB" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="px-1 block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Category</label>
                                        <select value={currentService.category} onChange={e => setCurrentService({ ...currentService, category: e.target.value as any })} className="w-full bg-black/60 border border-white/5 rounded-2xl p-4 text-white font-bold focus:outline-none focus:border-[#28D160] appearance-none">
                                            <option value="CLASS">CLASS</option>
                                            <option value="PRIVATE">PRIVATE</option>
                                            <option value="FACILITY">FACILITY</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="px-1 block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Credits Cost</label>
                                        <input type="number" value={currentService.credit_cost || 0} onChange={e => setCurrentService({ ...currentService, credit_cost: parseInt(e.target.value) || 0 })} className="w-full bg-black/60 border border-white/5 rounded-2xl p-4 text-white font-bold focus:outline-none focus:border-[#28D160]" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="px-1 block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Default Capacity (Athletes per Class)</label>
                                        <input type="number" value={currentService.default_capacity || ''} onChange={e => setCurrentService({ ...currentService, default_capacity: parseInt(e.target.value) || undefined })} className="w-full bg-black/60 border border-white/5 rounded-2xl p-4 text-white font-bold focus:outline-none focus:border-[#28D160]" placeholder={currentService.category === 'CLASS' ? '10' : '1'} />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="px-1 block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Service Description</label>
                                <textarea value={currentService.description || ''} onChange={e => setCurrentService({ ...currentService, description: e.target.value })} className="w-full bg-black/60 border border-white/5 rounded-2xl p-4 text-white font-medium text-sm min-h-[100px] focus:outline-none focus:border-[#28D160] transition-colors" placeholder="Mission briefing for this service..." />
                            </div>

                            {/* Coach Assignment in Modal */}
                            <div className="bg-black/40 border border-white/5 rounded-3xl p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Assign Operational Coaches</label>
                                    <span className="text-[10px] text-[#28D160] font-black uppercase">{selectedCoachIds.length} Recruited</span>
                                </div>
                                <div className="relative mb-4">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700" size={14} />
                                    <input type="text" placeholder="Filter Roster..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs focus:border-[#28D160] outline-none" />
                                </div>
                                <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                    {allCoaches.filter(c => `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())).map(coach => {
                                        const isSelected = selectedCoachIds.includes(coach.id);
                                        return (
                                            <button key={coach.id} onClick={() => isSelected ? setSelectedCoachIds(selectedCoachIds.filter(id => id !== coach.id)) : setSelectedCoachIds([...selectedCoachIds, coach.id])} className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all border ${isSelected ? 'bg-[#28D160]/10 border-[#28D160]/30' : 'bg-black/40 border-transparent hover:border-white/10'}`}>
                                                <div className="w-8 h-8 rounded-xl bg-gray-900 overflow-hidden flex-shrink-0 border border-white/5">{coach.avatar_url ? <img src={coach.avatar_url} className="w-full h-full object-cover grayscale" /> : <div className="w-full h-full bg-white/5" />}</div>
                                                <span className={`text-xs font-black uppercase italic ${isSelected ? 'text-[#28D160]' : 'text-gray-500'}`}>{coach.first_name} {coach.last_name}</span>
                                                {isSelected && <div className="ml-auto w-2 h-2 bg-[#28D160] rounded-full shadow-[0_0_10px_#28D160]" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <button onClick={handleSave} className="w-full bg-[#28D160] text-black font-black uppercase italic py-5 rounded-2xl mt-4 hover:bg-white transition-all shadow-2xl active:scale-95 disabled:opacity-50">DEPLOY SERVICE CHANGES</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Generator Modal */}
            {showGenerator && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-[2.5rem] w-full max-w-md p-10 relative shadow-2xl">
                        <button onClick={() => setShowGenerator(false)} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors border border-white/5 p-2 rounded-full"><X size={20} /></button>

                        <div className="mb-8">
                            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-[#28D160]">Generate Slots</h2>
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mt-2 px-1">{generatorConfig.serviceTitle}</p>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-600 uppercase block mb-2 px-1">Window Start</label>
                                    <input type="date" value={generatorConfig.startDate} onChange={e => setGeneratorConfig({ ...generatorConfig, startDate: e.target.value })} className="w-full bg-black/60 border border-white/5 rounded-xl px-4 py-3 text-xs text-white font-bold outline-none focus:border-[#28D160]" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-600 uppercase block mb-2 px-1">Window End</label>
                                    <input type="date" value={generatorConfig.endDate} onChange={e => setGeneratorConfig({ ...generatorConfig, endDate: e.target.value })} className="w-full bg-black/60 border border-white/5 rounded-xl px-4 py-3 text-xs text-white font-bold outline-none focus:border-[#28D160]" />
                                </div>
                            </div>

                            {/* Time & Duration */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-600 uppercase block mb-2 px-1 text-center">Operational Range (e.g. 19:30)</label>
                                    <div className="flex gap-2">
                                        <input type="text" value={generatorConfig.startTime} onChange={e => setGeneratorConfig({ ...generatorConfig, startTime: e.target.value })} className="w-full bg-black/60 border border-white/5 rounded-xl py-3 text-[10px] text-white text-center font-bold outline-none focus:border-[#28D160]" placeholder="08:00" />
                                        <span className="text-gray-800 self-center">/</span>
                                        <input type="text" value={generatorConfig.endTime} onChange={e => setGeneratorConfig({ ...generatorConfig, endTime: e.target.value })} className="w-full bg-black/60 border border-white/5 rounded-xl py-3 text-[10px] text-white text-center font-bold outline-none focus:border-[#28D160]" placeholder="20:00" />
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-[10px] font-black text-gray-600 uppercase block mb-2 px-1 text-center">Unit Duration</label>
                                <select value={generatorConfig.durationMinutes} onChange={e => setGeneratorConfig({ ...generatorConfig, durationMinutes: parseInt(e.target.value) })} className="w-full bg-black/60 border border-white/5 rounded-xl py-3 text-xs text-white font-bold text-center outline-none focus:border-[#28D160] appearance-none cursor-pointer">
                                    <option value="30">30 MIN</option>
                                    <option value="60">60 MIN</option>
                                    <option value="90">90 MIN</option>
                                    <option value="120">120 MIN</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-600 uppercase block mb-3 px-1">Active Cycle</label>
                                <div className="flex gap-1">
                                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                        <button key={i} onClick={() => {
                                            const days = generatorConfig.daysOfWeek.includes(i) ? generatorConfig.daysOfWeek.filter(x => x !== i) : [...generatorConfig.daysOfWeek, i];
                                            setGeneratorConfig({ ...generatorConfig, daysOfWeek: days });
                                        }} className={`flex-1 h-10 rounded-xl flex items-center justify-center text-[10px] font-black uppercase transition-all ${generatorConfig.daysOfWeek.includes(i) ? 'bg-[#28D160] text-black' : 'bg-black/60 text-gray-700 hover:text-white'}`}>
                                            {d}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button onClick={handleGenerate} disabled={generating} className="w-full bg-[#28D160] text-black font-black italic uppercase py-5 rounded-2xl hover:bg-white transition-all shadow-2xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mt-4 tracking-wider">
                                {generating ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                                {generating ? 'PROCESSING BLUEPRINT...' : 'INITIALIZE GENERATION'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
