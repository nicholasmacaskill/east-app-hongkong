'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import { 
    ChevronRight, 
    ChevronLeft, 
    Filter, 
    Play, 
    Layers, 
    Target, 
    Users as UsersIcon,
    ArrowRight,
    Search,
    X,
    Maximize2,
    Plus
} from 'lucide-react';

interface Drill {
    id: string;
    title: string;
    coach_id: string;
    age_tags: string[];
    level_tags: string[];
    group_tags: string[];
    skill_tags: string[];
    thumbnail_url?: string;
    coach?: {
        first_name: string;
        last_name: string;
        avatar_url: string;
    }
}

interface DrillStep {
    id: string;
    drill_id: string;
    step_number: number;
    title: string;
    instruction: string;
    diagram_url?: string;
    video_url?: string;
}

const AGE_GROUPS = ['10-12', '12-16', '16-20', '20-24', '24+'];

export default function DrillHubScreen() {
    const [drills, setDrills] = useState<Drill[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDrill, setSelectedDrill] = useState<Drill | null>(null);
    const [drillSteps, setDrillSteps] = useState<DrillStep[]>([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [activeAgeFilter, setActiveAgeFilter] = useState<string | null>(null);

    useEffect(() => {
        fetchDrills();
    }, []);

    const fetchDrills = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('coach_drills')
            .select('*, coach:profiles(first_name, last_name, avatar_url)')
            .eq('status', 'published')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setDrills(data);
        }
        setLoading(false);
    };

    const fetchDrillSteps = async (drillId: string) => {
        const { data, error } = await supabase
            .from('coach_drill_steps')
            .select('*')
            .eq('drill_id', drillId)
            .order('step_number', { ascending: true });

        if (!error && data) {
            setDrillSteps(data);
            setCurrentStepIndex(0);
        }
    };

    const handleSelectDrill = (drill: Drill) => {
        setSelectedDrill(drill);
        fetchDrillSteps(drill.id);
    };

    const filteredDrills = activeAgeFilter 
        ? drills.filter(d => d.age_tags?.includes(activeAgeFilter))
        : drills;

    if (selectedDrill) {
        const currentStep = drillSteps[currentStepIndex];
        return (
            <div className="min-h-screen bg-black text-white p-6 animate-fadeIn pb-24">
                <button 
                    onClick={() => setSelectedDrill(null)}
                    className="flex items-center gap-2 text-[10px] font-black italic uppercase tracking-widest text-[#28D160] mb-8 hover:text-white transition-colors"
                >
                    <ChevronLeft size={16} /> Explore More Drills
                </button>

                <div className="max-w-2xl mx-auto">
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-6">{selectedDrill.title}</h1>
                    
                    <div className="flex items-center gap-6 mb-8 pb-8 border-b border-white/10">
                        <div>
                            <span className="block text-[8px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">Conducted By</span>
                            <div className="flex -space-x-2">
                                <div className="w-10 h-10 rounded-full border-2 border-black overflow-hidden bg-gray-900">
                                    <img src={selectedDrill.coach?.avatar_url || "https://placehold.co/100"} className="w-full h-full object-cover" alt="coach" />
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 h-px bg-white/5 mx-4" />
                        <div>
                            <span className="block text-[8px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2 text-right">Relevant Tags</span>
                            <div className="flex gap-2 justify-end">
                                {[...selectedDrill.age_tags, ...selectedDrill.level_tags].slice(0, 2).map((tag, i) => (
                                    <span key={i} className="bg-[#28D160]/10 text-[#28D160] border border-[#28D160]/20 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">{tag}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {drillSteps.length > 0 ? (
                        <div className="space-y-8">
                            <div className="bg-[#121212] rounded-[2rem] border border-white/5 p-8 shadow-2xl relative overflow-hidden group">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="text-[10px] font-black italic text-[#28D160] uppercase tracking-widest mb-1">Phase {currentStepIndex + 1} of {drillSteps.length}</h3>
                                        <h2 className="text-2xl font-black italic uppercase tracking-tight text-white">{currentStep.title}</h2>
                                    </div>
                                    <div className="bg-white/5 p-3 rounded-2xl">
                                        <Layers size={20} className="text-gray-500" />
                                    </div>
                                </div>

                                <div className="aspect-square bg-white rounded-3xl mb-8 overflow-hidden border-8 border-white/5 relative shadow-inner">
                                    {currentStep.diagram_url ? (
                                        <img src={currentStep.diagram_url} className="w-full h-full object-contain p-4" alt="diagram" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-black p-10 text-center">
                                            <div className="w-px h-20 bg-black/10 absolute top-0 left-1/2" />
                                            <div className="w-20 h-px bg-black/10 absolute top-1/2 left-0" />
                                            <div className="w-px h-20 bg-black/10 absolute bottom-0 left-1/2" />
                                            <div className="w-20 h-px bg-black/10 absolute top-1/2 right-0" />
                                            <div className="w-4 h-4 rounded-full border border-black/20" />
                                            <p className="mt-4 font-montserrat font-black italic text-sm uppercase opacity-20">No Diagram Loaded</p>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-white/5">
                                    <p className="font-montserrat font-bold italic text-sm text-gray-400 leading-relaxed uppercase">
                                        {currentStep.instruction}
                                    </p>
                                </div>
                            </div>

                            {/* Navigation */}
                            <div className="flex gap-4">
                                <button 
                                    disabled={currentStepIndex === 0}
                                    onClick={() => setCurrentStepIndex(currentStepIndex - 1)}
                                    className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-20 py-5 rounded-2xl transition-all flex items-center justify-center gap-2"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button 
                                    disabled={currentStepIndex === drillSteps.length - 1}
                                    onClick={() => setCurrentStepIndex(currentStepIndex + 1)}
                                    className="flex-[2] bg-[#28D160] text-black font-black italic uppercase italic tracking-tighter py-5 rounded-2xl transition-all shadow-xl shadow-[#28D160]/20 flex items-center justify-center gap-2"
                                >
                                    Next Phase <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="py-20 text-center bg-white/5 rounded-[2rem] border border-white/5 border-dashed">
                            <Layers size={48} className="mx-auto mb-4 text-gray-700" />
                            <h3 className="text-sm font-black italic uppercase text-gray-500 tracking-widest">Awaiting Sequence Sync</h3>
                            <p className="text-[10px] uppercase font-bold text-gray-600 mt-2">Steps are currently being finalized by the coaching staff.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-6 animate-fadeIn pb-24 font-montserrat select-none">
            <div className="mb-10 text-center sm:text-left">
                <h1 className="text-5xl font-black italic uppercase tracking-tighter mb-2">DRILL HUB</h1>
                <div className="flex gap-3 overflow-x-auto no-scrollbar py-4 -mx-2 px-2 justify-center sm:justify-start">
                    {['AGE', 'LEVEL', 'GROUP', 'SKILL'].map(f => (
                        <button key={f} className="bg-[#121212] border border-white/10 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-[#28D160] hover:border-[#28D160] transition-all">
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-12 relative">
                {AGE_GROUPS.map((ageGroup) => {
                    const groupItems = drills.filter(d => d.age_tags?.includes(ageGroup));
                    if (groupItems.length === 0) return null;

                    return (
                        <div key={ageGroup} className="relative">
                            <div className="flex items-center gap-4 mb-6">
                                <h2 className="text-3xl font-black italic uppercase tracking-tighter text-[#28D160]">{ageGroup}</h2>
                                <div className="h-px flex-1 bg-gradient-to-r from-[#28D160]/40 to-transparent" />
                            </div>

                            <div className="flex overflow-x-auto no-scrollbar gap-6 pb-4">
                                {groupItems.map((drill) => (
                                    <div 
                                        key={drill.id} 
                                        onClick={() => handleSelectDrill(drill)}
                                        className="shrink-0 w-[200px] h-[200px] bg-[#121212] rounded-3xl border-2 border-white/5 relative group cursor-pointer hover:border-[#28D160] transition-all shadow-xl active:scale-95"
                                    >
                                        <div className="absolute inset-0 p-4 flex flex-col justify-end bg-gradient-to-t from-black via-black/20 to-transparent z-10">
                                            <h3 className="text-sm font-black italic uppercase tracking-tight text-white mb-2 line-clamp-2">{drill.title}</h3>
                                            <div className="flex gap-1">
                                                {(drill.skill_tags || []).slice(0, 2).map((s, i) => (
                                                    <span key={i} className="text-[7px] font-black uppercase text-gray-500 tracking-widest border border-white/10 px-1 py-0.5 rounded italic whitespace-nowrap">{s}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="w-full h-full p-8 flex items-center justify-center opacity-20 group-hover:opacity-40 transition-opacity">
                                            <Layers size={80} className="text-white" />
                                        </div>
                                        <div className="absolute top-4 right-4 bg-east-light text-black p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all scale-50 group-hover:scale-100 shadow-xl">
                                            <Plus size={14} strokeWidth={3} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}

                {drills.length === 0 && !loading && (
                    <div className="py-32 text-center opacity-30 grayscale">
                        <ChevronRight size={48} className="mx-auto mb-4" />
                        <h2 className="text-xl font-black italic uppercase tracking-tighter">Drill Library Initializing</h2>
                        <p className="text-xs font-bold uppercase mt-2">Connecting to the Global Drill Repository...</p>
                    </div>
                )}
            </div>
        </div>
    );
}
