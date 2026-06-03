'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import { X, Layers, Plus, Search, Save, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { TrainingPlan } from '@/app/types';

export default function TrainingPlanModal({ planData, onClose }: { planData: TrainingPlan, onClose: () => void }) {
    const [allDrills, setAllDrills] = useState<any[]>([]);
    const [selectedDrillIds, setSelectedDrillIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [title, setTitle] = useState(planData.title);
    const [description, setDescription] = useState(planData.description || '');

    useEffect(() => {
        fetchData();
    }, [planData]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch all published drills
            const { data: drillsData, error: drillsError } = await supabase
                .from('coach_drills')
                .select('*')
                .eq('status', 'published')
                .order('created_at', { ascending: false });
            
            if (drillsData) setAllDrills(drillsData);

            // Fetch already selected drills for this plan
            const { data: planDrillsData, error: pdError } = await supabase
                .from('training_plan_drills')
                .select('drill_id, order_index')
                .eq('plan_id', planData.id)
                .order('order_index', { ascending: true });
            
            if (planDrillsData) {
                // Keep the exact ordered list of drill IDs
                setSelectedDrillIds(planDrillsData.map(pd => pd.drill_id));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const toggleDrill = (drillId: string) => {
        setSelectedDrillIds(prev => {
            if (prev.includes(drillId)) {
                return prev.filter(id => id !== drillId);
            } else {
                return [...prev, drillId];
            }
        });
    };

    const moveDrill = (index: number, direction: 'up' | 'down') => {
        const newIds = [...selectedDrillIds];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newIds.length) return;
        
        // Swap elements
        const temp = newIds[index];
        newIds[index] = newIds[targetIndex];
        newIds[targetIndex] = temp;
        
        setSelectedDrillIds(newIds);
    };

    const handleSavePlan = async () => {
        if (!title.trim()) {
            alert("Please enter a title for the training plan");
            return;
        }
        setSaving(true);
        try {
            // Update plan details
            const { error: updateError } = await supabase
                .from('training_plans')
                .update({ title: title.trim(), description: description.trim() })
                .eq('id', planData.id);
            
            if (updateError) throw updateError;

            // Delete existing relations
            await supabase
                .from('training_plan_drills')
                .delete()
                .eq('plan_id', planData.id);
            
            // Insert new relations
            if (selectedDrillIds.length > 0) {
                const inserts = selectedDrillIds.map((drillId, idx) => ({
                    plan_id: planData.id,
                    drill_id: drillId,
                    order_index: idx
                }));
                
                const { error: insertError } = await supabase
                    .from('training_plan_drills')
                    .insert(inserts);
                if (insertError) throw insertError;
            }

            onClose(); // Close on success
        } catch (e) {
            console.error("Failed to save plan", e);
            alert("Error saving training plan");
        } finally {
            setSaving(false);
        }
    };

    const handleDeletePlan = async () => {
        if (!window.confirm("Are you sure you want to permanently delete this training plan? This cannot be undone.")) return;
        setDeleting(true);
        try {
            await supabase
                .from('training_plan_drills')
                .delete()
                .eq('plan_id', planData.id);

            const { error: deleteError } = await supabase
                .from('training_plans')
                .delete()
                .eq('id', planData.id);
            
            if (deleteError) throw deleteError;

            onClose();
        } catch (e) {
            console.error("Failed to delete plan", e);
            alert("Error deleting plan");
        } finally {
            setDeleting(false);
        }
    };

    const filteredDrills = allDrills.filter(d => 
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        d.skill_tags?.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Split drills into Selected and Available
    const selectedDrills = selectedDrillIds.map(id => allDrills.find(d => d.id === id)).filter(Boolean);
    const unselectedDrills = filteredDrills.filter(d => !selectedDrillIds.includes(d.id));

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn font-montserrat">
            <div className="w-full max-w-2xl bg-[#121212] rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col max-h-[90vh]">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-[#28D160] to-[#1e9c47] p-6 flex justify-between items-start">
                    <div>
                        <h2 className="font-black italic text-xl sm:text-2xl text-black uppercase leading-none tracking-tighter">Edit Training Plan</h2>
                        <p className="text-[10px] font-bold text-black/70 uppercase tracking-widest mt-2">{planData.title}</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors">
                        <X size={20} className="text-black" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto flex flex-col hide-scrollbar relative">
                    {loading ? (
                        <div className="py-20 text-center animate-pulse text-[#28D160] font-black uppercase text-sm tracking-widest">
                            Loading Library...
                        </div>
                    ) : (
                        <div className="p-6 space-y-8">
                            
                            {/* Plan Settings */}
                            <div className="space-y-4 bg-white/5 p-5 rounded-2xl border border-white/5">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                    Plan Settings
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-[9px] font-black uppercase text-gray-500 tracking-wider mb-1">Plan Title</label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="e.g. Stickhandling Mastery"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-[#28D160] focus:outline-none transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black uppercase text-gray-500 tracking-wider mb-1">Description (Optional)</label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="e.g. Focus on quick hands and edge control transitions..."
                                            rows={2}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-[#28D160] focus:outline-none transition-colors resize-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* The Plan / Selected Drills */}
                            <div>
                                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Layers size={14} /> The Plan ({selectedDrills.length})
                                </h3>
                                
                                {selectedDrills.length === 0 ? (
                                    <div className="bg-white/5 border border-white/5 border-dashed rounded-xl p-6 text-center">
                                        <p className="text-xs font-bold text-gray-500 uppercase">No drills added to this plan yet.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {selectedDrills.map((drill, index) => (
                                            <div key={drill.id} className="bg-white/5 border border-[#28D160]/30 rounded-xl p-3 flex items-center justify-between group">
                                                <div className="flex items-center gap-3 animate-fadeIn">
                                                    <div className="w-6 h-6 rounded-full bg-[#28D160]/20 text-[#28D160] flex items-center justify-center text-[10px] font-black">{index + 1}</div>
                                                    <span className="font-bold text-sm uppercase text-white truncate max-w-[180px] sm:max-w-none">{drill.title}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button 
                                                        onClick={() => moveDrill(index, 'up')}
                                                        disabled={index === 0}
                                                        className="text-gray-500 hover:text-white disabled:opacity-20 p-1 hover:bg-white/5 rounded transition-all"
                                                    >
                                                        <ChevronUp size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => moveDrill(index, 'down')}
                                                        disabled={index === selectedDrills.length - 1}
                                                        className="text-gray-500 hover:text-white disabled:opacity-20 p-1 hover:bg-white/5 rounded transition-all"
                                                    >
                                                        <ChevronDown size={16} />
                                                    </button>
                                                    <div className="w-px h-4 bg-white/10 mx-1" />
                                                    <button onClick={() => toggleDrill(drill.id)} className="text-gray-500 hover:text-red-500 transition-colors p-1 hover:bg-red-500/5 rounded">
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-white/10 w-full" />

                            {/* Available Library */}
                            <div>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                    <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Available Drills</h3>
                                    <div className="relative w-full sm:w-1/2">
                                        <input 
                                            type="text" 
                                            placeholder="Search Library..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs font-bold text-white focus:border-[#28D160] focus:outline-none placeholder:text-gray-600 transition-colors"
                                        />
                                        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {unselectedDrills.map(drill => (
                                        <div key={drill.id} onClick={() => toggleDrill(drill.id)} className="bg-black border border-white/5 hover:border-[#28D160]/50 rounded-xl p-4 flex items-start justify-between cursor-pointer transition-colors group">
                                            <div>
                                                <h4 className="font-bold text-xs uppercase text-white mb-1 group-hover:text-[#28D160] transition-colors">{drill.title}</h4>
                                                <div className="flex flex-wrap gap-1">
                                                    {(drill.skill_tags || []).slice(0, 2).map((tag: string) => (
                                                        <span key={tag} className="text-[8px] font-black uppercase text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">{tag}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <button className="text-gray-500 group-hover:text-[#28D160] transition-colors p-1">
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {unselectedDrills.length === 0 && (
                                        <div className="col-span-full py-8 text-center text-xs font-bold text-gray-600 uppercase">
                                            No more drills found.
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    )}
                </div>

                {/* Footer Action */}
                <div className="p-4 border-t border-white/10 bg-black flex flex-col sm:flex-row gap-3">
                    <button 
                        onClick={handleDeletePlan}
                        disabled={deleting || saving}
                        className="flex-1 sm:flex-none px-6 py-4 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white font-black italic uppercase text-xs rounded-xl tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {deleting ? 'Deleting...' : <><Trash2 size={14} /> Delete Plan</>}
                    </button>
                    <button 
                        onClick={handleSavePlan}
                        disabled={saving || deleting}
                        className="flex-1 bg-white text-black hover:bg-[#28D160] font-black italic uppercase text-xs py-4 rounded-xl tracking-widest transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {saving ? 'Compiling Plan...' : <><Save size={14} /> Save Training Plan</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
