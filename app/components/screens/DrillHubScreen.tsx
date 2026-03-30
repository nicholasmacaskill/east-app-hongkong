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
            <div className="min-h-screen bg-black text-white p-6 animate-fadeIn pb-24 font-montserrat select-none">
                <div className="flex justify-between items-center mb-10">
                    <h2 className="text-3vw font-black italic uppercase tracking-tighter text-white opacity-80">{selectedDrill.title}</h2>
                    <button 
                        onClick={() => setSelectedDrill(null)}
                        className="text-[10px] font-black italic uppercase tracking-widest text-[#28D160] hover:text-white transition-colors"
                    >
                        EXPLORE MORE DRILLS
                    </button>
                </div>

                <div className="max-w-md mx-auto">
                    {/* Conducted By Section */}
                    <div className="mb-8">
                        <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-3 italic">Conducted By</span>
                        <div className="flex gap-4">
                            {['BEN', 'LEE', 'WHIT', 'RHETT'].map((name, i) => (
                                <div key={i} className="flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 rounded-xl border-2 border-east-light overflow-hidden bg-gray-900 shadow-[0_0_15px_rgba(40,209,96,0.3)]">
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`} className="w-full h-full object-cover" alt="coach" />
                                    </div>
                                    <span className="text-[8px] font-black italic uppercase text-white/60 tracking-widest">{name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Relevant Tags */}
                    <div className="mb-10">
                        <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-3 italic">Relevant Tags</span>
                        <div className="flex gap-3">
                            {['AGE', 'LEVEL', 'GROUP'].map(tag => (
                                <div key={tag} className="bg-[#121212] border border-white/10 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-white italic">
                                    {tag}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Main Drill Card */}
                    <div className="relative group">
                        {drillSteps.length > 0 ? (
                            <div className="bg-[#1A1A1A] rounded-[2.5rem] border border-white/10 p-8 shadow-2xl relative">
                                <h3 className="text-sm font-black italic text-[#28D160] uppercase tracking-tighter mb-1">ANAHEIM DUCKS</h3>
                                <h2 className="text-lg font-black italic uppercase tracking-tight text-white mb-6">
                                    STEP {currentStep.step_number}: {currentStep.title}
                                </h2>

                                <div className="aspect-[3/4] bg-white rounded-3xl mb-8 overflow-hidden border-4 border-white/10 relative flex items-center justify-center p-6">
                                    {currentStep.diagram_url ? (
                                        <img src={currentStep.diagram_url} className="w-full h-full object-contain" alt="diagram" />
                                    ) : (
                                        <Layers size={120} className="text-gray-200" />
                                    )}
                                </div>

                                {/* Step Navigation Arrows */}
                                <button 
                                    disabled={currentStepIndex === 0}
                                    onClick={() => setCurrentStepIndex(currentStepIndex - 1)}
                                    className="absolute left-[-20px] top-1/2 -translate-y-1/2 w-12 h-12 bg-black/40 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center disabled:opacity-0 transition-opacity"
                                >
                                    <ChevronLeft size={24} className="text-white" />
                                </button>
                                <button 
                                    disabled={currentStepIndex === drillSteps.length - 1}
                                    onClick={() => setCurrentStepIndex(currentStepIndex + 1)}
                                    className="absolute right-[-20px] top-1/2 -translate-y-1/2 w-12 h-12 bg-black/40 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center disabled:opacity-0 transition-opacity"
                                >
                                    <ChevronRight size={24} className="text-white" />
                                </button>
                            </div>
                        ) : (
                            <div className="bg-[#1A1A1A] rounded-[2.5rem] p-20 text-center border border-white/5 border-dashed">
                                <Layers size={48} className="mx-auto mb-4 text-gray-700" />
                                <h3 className="text-sm font-black italic uppercase text-gray-500 tracking-widest">Awaiting Content</h3>
                            </div>
                        )}
                    </div>

                    {/* Footer Icons */}
                    <div className="flex justify-center gap-10 mt-12 opacity-60">
                        <Target size={24} />
                        <ArrowRight size={24} className="rotate-45" />
                        <Maximize2 size={24} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white animate-fadeIn pb-24 font-montserrat select-none">
            {/* Header */}
            <div className="p-6 pt-10">
                <h1 className="text-5xl font-black italic uppercase tracking-tighter mb-8 brightness-125">DRILL HUB</h1>
                <div className="flex gap-3 overflow-x-auto no-scrollbar py-2 -mx-2 px-2">
                    {['AGE', 'LEVEL', 'GROUP', 'SKILL'].map(f => (
                        <button key={f} className="bg-white border border-white px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Age Group Bands */}
            <div className="mt-4">
                {AGE_GROUPS.map((ageGroup, idx) => {
                    const groupItems = drills.filter(d => d.age_tags?.includes(ageGroup));
                    const isEven = idx % 2 === 0;

                    return (
                        <div 
                            key={ageGroup} 
                            className={`py-8 px-6 ${isEven ? 'bg-[#15803d]' : 'bg-[#166534]'} border-b border-black/20`}
                        >
                            <h2 className="text-xl font-black italic uppercase tracking-tighter text-white/40 mb-6">{ageGroup}</h2>
                            
                            <div className="flex overflow-x-auto no-scrollbar gap-4 pb-2">
                                {(groupItems.length > 0 ? groupItems : Array(4).fill(null)).map((drill, dIdx) => (
                                    <div 
                                        key={drill?.id || dIdx} 
                                        onClick={() => drill && handleSelectDrill(drill)}
                                        className={`shrink-0 w-32 h-32 bg-white rounded-2xl border-4 border-black/10 flex items-center justify-center p-4 shadow-xl transition-all active:scale-95 ${drill ? 'cursor-pointer hover:border-east-light' : 'opacity-20'}`}
                                    >
                                        <img 
                                            src={drill?.thumbnail_url || "https://png.pngtree.com/png-vector/20220703/ourmid/pngtree-hockey-puck-isolated-on-white-background-png-image_5677093.png"} 
                                            className="w-full h-full object-contain grayscale brightness-50 contrast-125" 
                                            alt="drill" 
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
