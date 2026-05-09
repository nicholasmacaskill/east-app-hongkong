'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import { useSearchParams } from 'next/navigation';
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
    step_order: number;
    title: string;
    description: string;
    image_url?: string;
    video_url?: string;
}

const AGE_GROUPS = ['10-12', '12-16', '16-20', '20-24', '24+'];

export default function DrillHubScreen() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session_id');

    const [drills, setDrills] = useState<Drill[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDrill, setSelectedDrill] = useState<Drill | null>(null);
    const [drillSteps, setDrillSteps] = useState<DrillStep[]>([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [activeAgeFilter, setActiveAgeFilter] = useState<string | null>(null);
    const [activeSkillFilter, setActiveSkillFilter] = useState<string | null>(null);
    const [isSessionPlanMode, setIsSessionPlanMode] = useState(false);

    useEffect(() => {
        if (sessionId) {
            setIsSessionPlanMode(true);
            fetchSessionPlan(sessionId);
        } else {
            fetchDrills();
        }
    }, [sessionId]);

    const fetchSessionPlan = async (sid: string) => {
        setLoading(true);
        // Fetch session_drills
        const { data: sessionDrillsData, error: sdError } = await supabase
            .from('session_drills')
            .select('drill_id, order_index')
            .eq('session_id', sid)
            .order('order_index', { ascending: true });

        if (!sdError && sessionDrillsData && sessionDrillsData.length > 0) {
            const drillIds = sessionDrillsData.map(sd => sd.drill_id);
            
            // Fetch drills
            const { data: drillsData, error: dError } = await supabase
                .from('coach_drills')
                .select('*, coach:profiles(first_name, last_name, avatar_url)')
                .in('id', drillIds);

            if (!dError && drillsData) {
                // Re-order based on sessionDrillsData
                const orderedDrills = drillIds.map(id => drillsData.find(d => d.id === id)).filter(Boolean) as Drill[];
                setDrills(orderedDrills);
            }
        }
        setLoading(false);
    };

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
            .order('step_order', { ascending: true });

        if (!error && data) {
            setDrillSteps(data);
            setCurrentStepIndex(0);
        }
    };

    const handleSelectDrill = (drill: Drill) => {
        setSelectedDrill(drill);
        fetchDrillSteps(drill.id);
    };

    const filteredDrills = drills.filter(d => {
        const matchesAge = !activeAgeFilter || d.age_tags?.includes(activeAgeFilter);
        const matchesSkill = !activeSkillFilter || activeSkillFilter === 'ALL' || d.skill_tags?.some(s => s.toUpperCase() === activeSkillFilter.toUpperCase());
        return matchesAge && matchesSkill;
    });

    if (selectedDrill) {
        const currentStep = drillSteps[currentStepIndex];
        return (
            <div className="min-h-screen bg-[#050505] text-white p-6 animate-fadeIn pb-32 font-montserrat select-none overflow-hidden relative">
                {/* Ambient Background Glows */}
                <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-east-light/5 blur-[120px] rounded-full" />
                    <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-east-light/3 blur-[100px] rounded-full" />
                </div>

                {/* Header Section */}
                <div className="relative z-10 flex justify-between items-start mb-12 pt-8">
                    <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-black tracking-[0.4em] text-east-light uppercase italic">Detailed Instruction</span>
                        <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white leading-[0.9] max-w-[80%] brightness-125">
                            {selectedDrill.title}
                        </h1>
                    </div>
                    <button 
                        onClick={() => setSelectedDrill(null)}
                        className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-east-light/50 transition-all duration-300 group shadow-xl active:scale-90"
                    >
                        <X size={24} className="text-gray-400 group-hover:text-white transition-colors" />
                    </button>
                </div>

                <div className="max-w-xl mx-auto relative z-10">
                    {/* Conducted By Section */}
                    <div className="mb-10">
                        <span className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-5 italic">Tactical Leads</span>
                        <div className="flex gap-4">
                            {['BEN', 'LEE', 'WHIT', 'RHETT'].map((name, i) => (
                                <div key={i} className="flex flex-col items-center gap-3">
                                    <div className="w-16 h-16 rounded-[1.5rem] border-2 border-white/5 overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-black shadow-2xl transition-all duration-500 hover:scale-110 hover:border-east-light/50 group">
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="coach" />
                                    </div>
                                    <span className="text-[9px] font-black italic uppercase text-white/40 tracking-widest">{name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Main Drill Card */}
                    <div className="relative">
                        {drillSteps.length > 0 ? (
                            <div className="bg-[#111] rounded-[4rem] overflow-hidden border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.8)] relative">
                                {/* Card Header Area */}
                                <div className="p-10 pb-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="px-3 py-1 bg-east-light/10 border border-east-light/20 rounded-full">
                                            <span className="text-[9px] font-black italic text-east-light uppercase tracking-widest">Active Sequence</span>
                                        </div>
                                        <div className="flex-1 h-[1px] bg-white/5" />
                                    </div>
                                    <h2 className="text-2xl font-black italic uppercase tracking-tight text-white mb-6 leading-tight flex items-start gap-4">
                                        <span className="text-east-light opacity-50 font-black italic text-4xl leading-none">{currentStep.step_order}</span>
                                        <span className="pt-1">{currentStep.title}</span>
                                    </h2>
                                </div>

                                {/* Whiteboard Area */}
                                <div className="mx-8 mb-10 bg-white rounded-[3rem] overflow-hidden flex items-center justify-center p-10 relative shadow-[inset_0_0_60px_rgba(0,0,0,0.1)] aspect-[3/4]">
                                    {currentStep.image_url ? (
                                        <img src={currentStep.image_url} className="w-full h-full object-contain" alt="diagram" />
                                    ) : (
                                        <div className="text-center opacity-20">
                                            <Layers size={100} className="text-gray-900 mx-auto" />
                                            <p className="mt-4 text-[12px] font-black uppercase text-gray-900 italic tracking-[0.2em]">Visualizing Strategy</p>
                                        </div>
                                    )}
                                    
                                    {/* Glass Overlay for Instruction */}
                                    <div className="absolute bottom-6 left-6 right-6 p-6 bg-black/80 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-2xl">
                                        <p className="text-[11px] font-bold text-gray-300 leading-relaxed italic">
                                            {currentStep.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Step Navigation */}
                                <div className="absolute top-[60%] -left-6 -translate-y-1/2 z-20">
                                    <button 
                                        disabled={currentStepIndex === 0}
                                        onClick={() => setCurrentStepIndex(currentStepIndex - 1)}
                                        className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center disabled:opacity-0 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.2)] active:scale-90"
                                    >
                                        <ChevronLeft size={32} />
                                    </button>
                                </div>
                                <div className="absolute top-[60%] -right-6 -translate-y-1/2 z-20">
                                    <button 
                                        disabled={currentStepIndex === drillSteps.length - 1}
                                        onClick={() => setCurrentStepIndex(currentStepIndex + 1)}
                                        className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center disabled:opacity-0 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.2)] active:scale-90"
                                    >
                                        <ChevronRight size={32} />
                                    </button>
                                </div>
                                
                                {/* Action Footer */}
                                <div className="flex justify-between items-center p-10 pt-0">
                                    <div className="flex gap-6 opacity-30">
                                        <Target size={24} />
                                        <Maximize2 size={24} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-1.5 w-12 bg-white/5 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-east-light transition-all duration-500" 
                                                style={{ width: `${((currentStepIndex + 1) / drillSteps.length) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] font-black italic text-gray-500">{currentStepIndex + 1}/{drillSteps.length}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-[#111] rounded-[4rem] p-32 text-center border border-white/10 border-dashed relative">
                                <Layers size={64} className="mx-auto mb-6 text-gray-800 animate-pulse" />
                                <h3 className="text-sm font-black italic uppercase text-gray-600 tracking-[0.3em]">Constructing Playbook</h3>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white animate-fadeIn pb-40 font-montserrat select-none overflow-hidden relative">
            {/* Ambient Background Glows */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-east-light/5 blur-[150px] rounded-full" />
                <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] bg-east-light/3 blur-[120px] rounded-full" />
            </div>

            {/* Header Area */}
            <div className="relative z-10 p-8 pt-16">
                <div className="flex flex-col gap-3 mb-10">
                    <span className="text-[10px] font-black tracking-[0.5em] text-east-light uppercase italic opacity-80">Evolution System</span>
                    <h1 className="text-6xl font-black italic uppercase tracking-tighter leading-none brightness-125 drop-shadow-2xl">
                        {isSessionPlanMode ? "Training Plan" : "Drill Hub"}
                    </h1>
                </div>

                {!isSessionPlanMode && (
                    <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 -mx-4 px-4">
                        {['ALL', 'SHOOTING', 'PASSING', 'DEFENSE', 'SKATING', 'GOALIE'].map((f) => (
                            <button 
                                key={f} 
                                onClick={() => setActiveSkillFilter(f)}
                                className={`px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 border backdrop-blur-md shadow-2xl active:scale-95 ${(activeSkillFilter === f || (!activeSkillFilter && f === 'ALL')) ? 'bg-east-light text-black border-east-light shadow-[0_0_25px_rgba(40,209,96,0.4)]' : 'bg-[#111] text-gray-500 border-white/5 hover:border-white/20 hover:text-white'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {isSessionPlanMode ? (
                <div className="px-6 space-y-4">
                    {drills.length === 0 && !loading && (
                        <div className="text-center py-20 opacity-50">
                            <p className="text-xs font-black uppercase">No plan found.</p>
                        </div>
                    )}
                    {drills.map((drill, idx) => (
                        <div 
                            key={drill.id} 
                            onClick={() => handleSelectDrill(drill)}
                            className="bg-[#121212] border border-white/10 rounded-2xl p-4 flex items-center justify-between cursor-pointer active:scale-95 transition-all shadow-xl"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-[#28D160] font-black italic text-xl">
                                    {idx + 1}
                                </div>
                                <div>
                                    <h3 className="font-black italic text-lg uppercase">{drill.title}</h3>
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                        {drill.skill_tags?.[0] || 'Fundamentals'}
                                    </span>
                                </div>
                            </div>
                            <ChevronRight className="text-gray-600" />
                        </div>
                    ))}
                </div>
            ) : (
                /* Redesigned Age Group Sections */
                <div className="relative z-10 mt-6 space-y-16">
                    {AGE_GROUPS.map((ageGroup, idx) => {
                        const groupItems = drills.filter(d => d.age_tags?.includes(ageGroup));
                        
                        return (
                            <div key={ageGroup} className="px-8">
                                <div className="flex items-center gap-6 mb-8">
                                    <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white brightness-125">{ageGroup}</h2>
                                    <div className="h-[1px] flex-1 bg-gradient-to-r from-white/20 via-white/5 to-transparent" />
                                    <span className="text-[10px] font-black italic text-gray-600 uppercase tracking-widest">{groupItems.length} DRILLS</span>
                                </div>
                                
                                <div className="flex overflow-x-auto no-scrollbar gap-8 pb-8 -mx-8 px-8">
                                    {(groupItems.length > 0 ? groupItems : Array(4).fill(null)).map((drill, dIdx) => (
                                        <div 
                                            key={drill?.id || dIdx} 
                                            onClick={() => drill && handleSelectDrill(drill)}
                                            className={`shrink-0 w-72 h-96 rounded-[3.5rem] border border-white/5 relative overflow-hidden group transition-all duration-700 shadow-2xl ${drill ? 'cursor-pointer hover:border-east-light hover:-translate-y-4 hover:shadow-[0_40px_80px_rgba(0,0,0,0.6)]' : 'opacity-20'}`}
                                        >
                                            {/* Drill Image/Thumbnail */}
                                            <div className="absolute inset-0 bg-[#0a0a0a]">
                                                <img 
                                                    src={drill?.thumbnail_url || "https://images.unsplash.com/photo-1580748141549-71748ddf0bdc?auto=format&fit=crop&q=80&w=800"} 
                                                    className="w-full h-full object-cover opacity-40 group-hover:opacity-70 group-hover:scale-110 transition-all duration-1000" 
                                                    alt="drill" 
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
                                            </div>

                                            {/* Glow Overlay */}
                                            <div className="absolute inset-0 bg-east-light/0 group-hover:bg-east-light/5 transition-colors duration-700" />

                                            {/* Card Content */}
                                            <div className="absolute inset-0 p-8 flex flex-col justify-end">
                                                {drill && (
                                                    <>
                                                        <div className="mb-4 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                                                            <div className="inline-flex px-3 py-1 bg-east-light/10 border border-east-light/20 rounded-full">
                                                                <span className="text-[9px] font-black italic text-east-light uppercase tracking-widest">
                                                                    {drill.skill_tags?.[0] || 'Fundamentals'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <h3 className="font-black italic text-2xl text-white uppercase leading-[1.1] tracking-tight drop-shadow-2xl group-hover:text-east-light transition-colors duration-500">
                                                            {drill.title || 'Coming Soon'}
                                                        </h3>
                                                        <div className="mt-6 flex items-center justify-between opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-100">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-full border border-white/10 overflow-hidden">
                                                                    <img src={drill.coach?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${drill.coach?.first_name}`} className="w-full h-full object-cover" />
                                                                </div>
                                                                <span className="text-[9px] font-black italic text-gray-400 uppercase">{drill.coach?.first_name} {drill.coach?.last_name}</span>
                                                            </div>
                                                            <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center shadow-2xl group-active:scale-90 transition-transform">
                                                                <Play size={20} className="fill-black ml-1" />
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
