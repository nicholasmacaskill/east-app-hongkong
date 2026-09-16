'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import { X, Layers, Plus, Search, Save, Download, Upload, Loader2 } from 'lucide-react';

export default function SessionPlanModal({ sessionData, onClose }: { sessionData: any, onClose: () => void }) {
    const [allDrills, setAllDrills] = useState<any[]>([]);
    const [selectedDrillIds, setSelectedDrillIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Training Plan Integration States
    const [trainingPlans, setTrainingPlans] = useState<any[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState<string>('');
    const [showSaveAsPlan, setShowSaveAsPlan] = useState(false);
    const [newPlanTitle, setNewPlanTitle] = useState('');
    const [savingAsPlan, setSavingAsPlan] = useState(false);

    useEffect(() => {
        fetchData();
    }, [sessionData]);

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

            // Fetch already selected drills for this session
            const { data: sessionDrillsData, error: sdError } = await supabase
                .from('session_drills')
                .select('drill_id, order_index')
                .eq('session_id', sessionData.id)
                .order('order_index', { ascending: true });
            
            if (sessionDrillsData) {
                setSelectedDrillIds(sessionDrillsData.map(sd => sd.drill_id));
            }

            // Fetch all training plans
            const { data: plansData } = await supabase
                .from('training_plans')
                .select('id, title')
                .order('created_at', { ascending: false });
            if (plansData) setTrainingPlans(plansData);

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

    const handleLoadTrainingPlan = async (planId: string) => {
        if (!planId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('training_plan_drills')
                .select('drill_id')
                .eq('plan_id', planId)
                .order('order_index', { ascending: true });
            if (error) throw error;
            if (data) {
                setSelectedDrillIds(data.map(d => d.drill_id));
            }
        } catch (e) {
            console.error('Failed to load training plan drills', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAsTrainingPlan = async () => {
        if (!newPlanTitle.trim() || selectedDrillIds.length === 0) return;
        setSavingAsPlan(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            
            // 1. Create the plan
            const { data: plan, error: planErr } = await supabase
                .from('training_plans')
                .insert({
                    title: newPlanTitle,
                    coach_id: user.id,
                    description: `Created from session: ${sessionData.title}`
                })
                .select()
                .single();
            if (planErr) throw planErr;

            // 2. Insert drills
            if (plan && selectedDrillIds.length > 0) {
                const inserts = selectedDrillIds.map((drillId, idx) => ({
                    plan_id: plan.id,
                    drill_id: drillId,
                    order_index: idx
                }));
                await supabase
                    .from('training_plan_drills')
                    .insert(inserts);
            }

            // Refresh training plans list
            const { data: plansData } = await supabase
                .from('training_plans')
                .select('id, title')
                .order('created_at', { ascending: false });
            if (plansData) setTrainingPlans(plansData);

            setShowSaveAsPlan(false);
            setNewPlanTitle('');
            alert('Saved as training plan successfully!');
        } catch (e: any) {
            alert('Failed to save training plan: ' + e.message);
        } finally {
            setSavingAsPlan(false);
        }
    };

    const handleSavePlan = async () => {
        setSaving(true);
        try {
            await supabase
                .from('session_drills')
                .delete()
                .eq('session_id', sessionData.id);
            
            if (selectedDrillIds.length > 0) {
                const inserts = selectedDrillIds.map((drillId, idx) => ({
                    session_id: sessionData.id,
                    drill_id: drillId,
                    order_index: idx
                }));
                
                await supabase
                    .from('session_drills')
                    .insert(inserts);
            }

            onClose(); // Close on success
        } catch (e) {
            console.error("Failed to save plan", e);
        } finally {
            setSaving(false);
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
                        <h2 className="font-black italic text-2xl text-black uppercase leading-none tracking-tighter">Session Plan</h2>
                        <p className="text-xs font-bold text-black/70 uppercase tracking-widest mt-2">{sessionData.title}</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors">
                        <X size={20} className="text-black" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto flex flex-col hide-scrollbar relative">
                    {loading ? (
                        <div className="py-20 text-center animate-pulse text-east-light font-black uppercase text-sm tracking-widest">
                            Loading Library...
                        </div>
                    ) : (
                        <div className="p-6 space-y-8">
                            
                            {/* Training Plan Controls */}
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
                                <h3 className="text-[10px] font-black text-east-light uppercase tracking-widest flex items-center gap-2">
                                    <Layers size={12} /> Training Plan Integration
                                </h3>
                                
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="flex-1 flex gap-2">
                                        <select
                                            value={selectedPlanId}
                                            onChange={(e) => {
                                                setSelectedPlanId(e.target.value);
                                                handleLoadTrainingPlan(e.target.value);
                                            }}
                                            className="flex-1 bg-black border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-east-light"
                                        >
                                            <option value="">-- Load Preset Plan --</option>
                                            {trainingPlans.map(plan => (
                                                <option key={plan.id} value={plan.id}>{plan.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <button
                                        onClick={() => setShowSaveAsPlan(!showSaveAsPlan)}
                                        disabled={selectedDrillIds.length === 0}
                                        className="px-4 py-2 border border-white/10 bg-white/5 text-white rounded-xl text-xs font-bold uppercase hover:bg-white/10 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                                    >
                                        Save as Preset Plan
                                    </button>
                                </div>

                                {showSaveAsPlan && (
                                    <div className="flex gap-2 bg-black/40 p-3 rounded-xl border border-white/5 animate-fadeIn">
                                        <input
                                            type="text"
                                            placeholder="Enter Training Plan Title..."
                                            value={newPlanTitle}
                                            onChange={(e) => setNewPlanTitle(e.target.value)}
                                            className="flex-1 bg-black border border-white/10 rounded-lg px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-east-light"
                                        />
                                        <button
                                            onClick={handleSaveAsTrainingPlan}
                                            disabled={savingAsPlan || !newPlanTitle.trim()}
                                            className="px-4 py-1.5 bg-east-light text-black font-black text-xs uppercase rounded-lg hover:bg-white transition-colors disabled:opacity-50"
                                        >
                                            {savingAsPlan ? <Loader2 size={12} className="animate-spin" /> : 'Save'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* The Plan / Selected Drills */}
                            <div>
                                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Layers size={14} /> The Plan ({selectedDrills.length})
                                </h3>
                                
                                {selectedDrills.length === 0 ? (
                                    <div className="bg-white/5 border border-white/5 border-dashed rounded-xl p-6 text-center">
                                        <p className="text-xs font-bold text-gray-500 uppercase">No drills added to this session yet.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {selectedDrills.map((drill, index) => (
                                            <div key={drill.id} className="bg-white/5 border border-east-light/30 rounded-xl p-3 flex items-center justify-between group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-6 h-6 rounded-full bg-east-light/20 text-east-light flex items-center justify-center text-[10px] font-black">{index + 1}</div>
                                                    <span className="font-bold text-sm uppercase text-white">{drill.title}</span>
                                                </div>
                                                <button onClick={() => toggleDrill(drill.id)} className="text-gray-500 hover:text-red-500 transition-colors p-2">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-white/10 w-full" />

                            {/* Available Library */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Available Drills</h3>
                                    <div className="relative w-1/2">
                                        <input 
                                            type="text" 
                                            placeholder="Search Library..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs font-bold text-white focus:border-east-light focus:outline-none placeholder:text-gray-600 transition-colors"
                                        />
                                        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {unselectedDrills.map(drill => (
                                        <div key={drill.id} onClick={() => toggleDrill(drill.id)} className="bg-black border border-white/5 hover:border-east-light/50 rounded-xl p-4 flex items-start justify-between cursor-pointer transition-colors group">
                                            <div>
                                                <h4 className="font-bold text-xs uppercase text-white mb-1 group-hover:text-east-light transition-colors">{drill.title}</h4>
                                                <div className="flex flex-wrap gap-1">
                                                    {(drill.skill_tags || []).slice(0, 2).map((tag: string) => (
                                                        <span key={tag} className="text-[8px] font-black uppercase text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">{tag}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <button className="text-gray-500 group-hover:text-east-light transition-colors p-1">
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
                <div className="p-4 border-t border-white/10 bg-black">
                    <button 
                        onClick={handleSavePlan}
                        disabled={saving}
                        className="w-full bg-white text-black hover:bg-east-light font-black italic uppercase text-sm py-4 rounded-xl tracking-widest transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {saving ? 'Compiling Plan...' : <><Save size={16} /> Save Training Plan</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
