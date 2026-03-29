'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, ArrowRight, ArrowLeft, Image as ImageIcon, Save, X, LayoutGrid } from 'lucide-react';

type TagOption = string;
const AGE_TAGS: TagOption[] = ['10-12', '12-16', '16-20', '20-24', '24+'];
const LEVEL_TAGS: TagOption[] = ['Beginner', 'Intermediate', 'Advanced', 'Elite', 'Pro'];
const GROUP_TAGS: TagOption[] = ['Solo', 'Forwards', 'Defense', 'Goalies', 'Team'];
const SKILL_TAGS: TagOption[] = ['Skating', 'Shooting', 'Passing', 'Stickhandling', 'Game IQ', 'Tactics'];

export default function DrillHubCMSPage() {
    const [drills, setDrills] = useState<any[]>([]);
    const [coaches, setCoaches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [isCreating, setIsCreating] = useState(false);
    const [editingDrill, setEditingDrill] = useState<any>(null);

    // Form State
    const [title, setTitle] = useState('');
    const [coachId, setCoachId] = useState('');
    const [selectedAges, setSelectedAges] = useState<string[]>([]);
    const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch coaches
            const { data: cData } = await supabase
                .from('profiles')
                .select('id, first_name, last_name')
                .eq('role', 'coach');
            if (cData) setCoaches(cData);

            // Fetch drills
            const { data: dData, error } = await supabase
                .from('coach_drills')
                .select('*, coach:profiles(first_name, last_name)')
                .order('created_at', { ascending: false });
            
            if (!error && dData) {
                setDrills(dData);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (list: string[], setList: (v: string[]) => void, item: string) => {
        if (list.includes(item)) setList(list.filter(i => i !== item));
        else setList([...list, item]);
    };

    const handleSaveDrill = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                title,
                coach_id: coachId,
                age_tags: selectedAges,
                level_tags: selectedLevels,
                group_tags: selectedGroups,
                skill_tags: selectedSkills,
                status: 'published'
            };

            if (editingDrill) {
                const { error } = await supabase
                    .from('coach_drills')
                    .update(payload)
                    .eq('id', editingDrill.id);
                if (error) throw error;
                toast.success("Drill updated!");
            } else {
                const { error } = await supabase
                    .from('coach_drills')
                    .insert([payload]);
                if (error) throw error;
                toast.success("Drill created!");
            }
            
            setIsCreating(false);
            setEditingDrill(null);
            resetForm();
            fetchData();
        } catch (error: any) {
            toast.error(error.message || "Failed to save drill");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this drill?')) return;
        try {
            const { error } = await supabase.from('coach_drills').delete().eq('id', id);
            if (error) throw error;
            toast.success("Drill removed");
            fetchData();
        } catch (error: any) {
            toast.error("Failed to delete");
        }
    };

    const openEdit = (drill: any) => {
        setEditingDrill(drill);
        setTitle(drill.title);
        setCoachId(drill.coach_id);
        setSelectedAges(drill.age_tags || []);
        setSelectedLevels(drill.level_tags || []);
        setSelectedGroups(drill.group_tags || []);
        setSelectedSkills(drill.skill_tags || []);
        setIsCreating(true);
    };

    const resetForm = () => {
        setTitle('');
        setCoachId('');
        setSelectedAges([]);
        setSelectedLevels([]);
        setSelectedGroups([]);
        setSelectedSkills([]);
    };

    const renderTagSelector = (label: string, options: string[], selected: string[], setSelected: (v: string[]) => void) => (
        <div className="mb-4">
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">{label}</label>
            <div className="flex flex-wrap gap-2">
                {options.map(opt => {
                    const active = selected.includes(opt);
                    return (
                        <button
                            key={opt}
                            type="button"
                            onClick={() => toggleSelection(selected, setSelected, opt)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                                active ? 'bg-[#28D160] text-black shadow-lg shadow-[#28D160]/20' : 'bg-black/40 border border-white/10 text-gray-400 hover:border-white/30'
                            }`}
                        >
                            {opt}
                        </button>
                    )
                })}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col gap-6 font-montserrat min-h-[80vh]">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white">Drill Hub CMS</h1>
                    <p className="text-gray-400 text-sm mt-1">Manage standard drills, diagrams, and curricula for Coach Auth users.</p>
                </div>
                {!isCreating && (
                    <button 
                        onClick={() => { resetForm(); setIsCreating(true); }}
                        className="bg-[#28D160] hover:bg-white text-black px-6 py-3 rounded-xl font-black uppercase italic tracking-tighter text-sm flex items-center gap-2 shadow-xl hover:scale-105 transition-transform"
                    >
                        <Plus size={18} /> New Drill
                    </button>
                )}
            </div>

            {isCreating ? (
                <div className="bg-[#1e1e1e] border border-white/10 rounded-3xl p-8 relative shadow-2xl overflow-hidden mt-4">
                    <button 
                        onClick={() => { setIsCreating(false); setEditingDrill(null); }}
                        className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                    
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-8">
                        {editingDrill ? 'Edit Drill Profile' : 'Create New Drill'}
                    </h2>

                    <form onSubmit={handleSaveDrill} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* LEFT COL: Core Metadata */}
                        <div className="flex flex-col gap-5">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Drill Title</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Triangle Sprint..."
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:border-[#28D160] text-lg font-bold transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Primary Coach</label>
                                <select
                                    required
                                    value={coachId}
                                    onChange={(e) => setCoachId(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:border-[#28D160] uppercase tracking-tighter text-sm italic font-bold appearance-none transition-colors"
                                >
                                    <option value="">Select a Coach...</option>
                                    {coaches.map(c => (
                                        <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="mt-4 bg-[#28D160] text-black w-full py-4 rounded-xl font-black uppercase italic tracking-tighter text-sm hover:bg-white transition-colors flex items-center justify-center gap-2"
                            >
                                <Save size={18} /> {editingDrill ? 'Update Meta' : 'Initialize Drill'}
                            </button>
                        </div>

                        {/* RIGHT COL: Tags */}
                        <div className="bg-black/20 rounded-2xl p-6 border border-white/5">
                            <h3 className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6 pb-2 border-b border-white/5">Categorization Tags</h3>
                            {renderTagSelector("Age Groups", AGE_TAGS, selectedAges, setSelectedAges)}
                            {renderTagSelector("Skill Levels", LEVEL_TAGS, selectedLevels, setSelectedLevels)}
                            {renderTagSelector("Player Types", GROUP_TAGS, selectedGroups, setSelectedGroups)}
                            {renderTagSelector("Focus Skills", SKILL_TAGS, selectedSkills, setSelectedSkills)}
                        </div>
                    </form>

                    {/* Step Editor Component will go down here later, visible only if editingDrill is not null */}
                    {editingDrill && (
                        <div className="mt-12 pt-12 border-t border-white/10">
                            <h2 className="text-xl font-black italic uppercase tracking-tighter mb-4 text-[#28D160]">Drill Steps & Diagrams</h2>
                            <p className="text-sm text-gray-400 mb-6">Manage the phase-by-phase breakdown for {editingDrill.title}.</p>
                            
                            <div className="bg-black/30 border border-white/5 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center">
                                <ImageIcon size={48} className="text-gray-600 mb-4" />
                                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-300">Coming Next</h3>
                                <p className="text-xs text-gray-500 mt-2 max-w-sm">The step-by-step canvas editor and diagram uploader will be enabled in Phase 2.</p>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                    {loading ? (
                        <div className="col-span-full py-20 flex justify-center text-[#28D160]">
                            <div className="w-8 h-8 border-4 border-current border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : drills.length === 0 ? (
                        <div className="col-span-full bg-[#1e1e1e] border border-white/10 rounded-3xl p-10 text-center flex flex-col items-center justify-center min-h-[300px]">
                            <LayoutGrid size={48} className="text-gray-600 mb-4" />
                            <h3 className="text-lg font-black uppercase italic tracking-tighter text-white">No Drills Found</h3>
                            <p className="text-sm text-gray-500 mt-2">Create the first drill to begin building the curriculum.</p>
                        </div>
                    ) : (
                        drills.map((drill) => (
                            <div key={drill.id} className="bg-[#1e1e1e] border-2 border-white/5 rounded-3xl p-6 group hover:border-[#28D160] transition-all relative overflow-hidden flex flex-col">
                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                    <button onClick={() => openEdit(drill)} className="bg-white/10 p-2 rounded-lg hover:bg-white/20 text-white transition-colors">
                                        <Edit2 size={14} />
                                    </button>
                                    <button onClick={() => handleDelete(drill.id)} className="bg-red-500/10 p-2 rounded-lg hover:bg-red-500/20 text-red-500 transition-colors">
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                <div className="flex-1">
                                    <div className="text-[10px] font-bold text-[#28D160] uppercase tracking-widest mb-1">
                                        {drill.coach ? `${drill.coach.first_name} ${drill.coach.last_name}` : 'Unknown Coach'}
                                    </div>
                                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-4 line-clamp-2">
                                        {drill.title}
                                    </h3>

                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {[...(drill.age_tags||[]), ...(drill.skill_tags||[])].slice(0, 4).map((tag: string, idx: number) => (
                                            <span key={idx} className="bg-white/5 text-gray-300 px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border border-white/5">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/5 mt-auto flex items-center justify-between text-gray-500">
                                    <span className="text-[10px] uppercase font-bold tracking-widest">
                                        {new Date(drill.created_at).toLocaleDateString()}
                                    </span>
                                    <button onClick={() => openEdit(drill)} className="text-[#28D160] hover:text-white transition-colors flex items-center gap-1 text-xs font-black italic uppercase tracking-tighter">
                                        Manage Steps <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
