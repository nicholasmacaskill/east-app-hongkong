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
    step_number: number;
    title: string;
    instruction: string;
    diagram_url?: string;
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
    }, [sessionId, activeSkillFilter]);

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
        let query = supabase
            .from('coach_drills')
            .select('*, coach:profiles(first_name, last_name, avatar_url)')
            .eq('status', 'published')
            .order('created_at', { ascending: false });

        if (activeSkillFilter && activeSkillFilter !== 'ALL') {
            query = query.contains('skill_tags', [activeSkillFilter]);
        }

        const { data, error } = await query;

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

    const filteredDrills = drills.filter(d => {
        const matchesAge = !activeAgeFilter || d.age_tags?.includes(activeAgeFilter);
        const matchesSkill = !activeSkillFilter || activeSkillFilter === 'ALL' || d.skill_tags?.some(s => s.toUpperCase() === activeSkillFilter.toUpperCase());
        return matchesAge && matchesSkill;
    });

    if (selectedDrill) {
        const currentStep = drillSteps[currentStepIndex];
        return (
            <div className="min-h-screen bg-[#050505] text-white animate-fadeIn font-montserrat select-none overflow-hidden relative flex flex-col">
                {/* Ambient Background Glows */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                    <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-east-light/10 blur-[150px] rounded-full animate-pulse" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-east-light/5 blur-[120px] rounded-full" />
                </div>

                {/* Top Navigation Bar */}
                <div className="relative z-20 flex justify-between items-center px-12 py-10 backdrop-blur-md bg-black/20 border-b border-white/5">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setSelectedDrill(null)}
                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-east-light transition-all group"
                            >
                                <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Hub
                            </button>
                            <span className="w-1 h-1 bg-white/20 rounded-full" />
                            <span className="text-[10px] font-black tracking-[0.4em] text-east-light uppercase italic">Tactical Sequence</span>
                        </div>
                        <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white leading-tight brightness-125">
                            {selectedDrill.title}
                        </h1>
                    </div>
                    
                    <div className="flex items-center gap-8">
                        {/* Single Tactical Lead */}
                        <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-2xl border border-white/5">
                            <div className="text-right">
                                <span className="block text-[8px] font-black uppercase text-gray-500 tracking-widest mb-0.5">Tactical Lead</span>
                                <span className="block text-[11px] font-black italic uppercase text-white tracking-widest">
                                    {selectedDrill.coach?.first_name || 'Coach'} {selectedDrill.coach?.last_name || ''}
                                </span>
                            </div>
                            <div className="w-10 h-10 rounded-xl border border-east-light/30 overflow-hidden shadow-2xl">
                                <img 
                                    src={selectedDrill.coach?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedDrill.coach?.first_name || 'Coach'}`} 
                                    className="w-full h-full object-cover" 
                                    alt="coach" 
                                />
                            </div>
                        </div>

                        <button 
                            onClick={() => setSelectedDrill(null)}
                            className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-east-light/50 transition-all group active:scale-90"
                        >
                            <X size={20} className="text-gray-400 group-hover:text-white" />
                        </button>
                    </div>
                </div>

                {/* Main Cinematic Content */}
                <div className="flex-1 relative z-10 flex flex-col md:flex-row overflow-hidden">
                    
                    {/* Left: Diagram Area (Large) */}
                    <div className="flex-[1.5] relative bg-black/40 flex items-center justify-center p-12 overflow-hidden border-r border-white/5">
                        {drillSteps.length > 0 ? (
                            <div className="relative w-full h-full flex items-center justify-center group">
                                {/* Diagram Container */}
                                <div className="relative w-full max-w-4xl aspect-video rounded-[3rem] overflow-hidden border border-white/10 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-sm shadow-[0_40px_100px_rgba(0,0,0,0.6)] flex items-center justify-center p-10">
                                    {currentStep.diagram_url ? (
                                        <img 
                                            src={currentStep.diagram_url} 
                                            className="w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-fadeIn" 
                                            alt="diagram" 
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-6 opacity-20">
                                            <Layers size={120} className="text-white" />
                                            <span className="text-sm font-black uppercase tracking-[0.4em] italic">Awaiting Visuals</span>
                                        </div>
                                    )}

                                    {/* Progress Ring Overlay (Top Right) */}
                                    <div className="absolute top-8 right-8 w-16 h-16 flex items-center justify-center">
                                        <svg className="w-full h-full -rotate-90">
                                            <circle cx="32" cy="32" r="28" fill="none" stroke="white" strokeWidth="2" className="opacity-10" />
                                            <circle 
                                                cx="32" 
                                                cy="32" 
                                                r="28" 
                                                fill="none" 
                                                stroke="#28D160" 
                                                strokeWidth="3" 
                                                strokeDasharray="176" 
                                                strokeDashoffset={176 - (176 * ((currentStepIndex + 1) / drillSteps.length))}
                                                className="transition-all duration-700 ease-out drop-shadow-[0_0_8px_#28D160]"
                                            />
                                        </svg>
                                        <span className="absolute text-[10px] font-black italic">{currentStepIndex + 1}/{drillSteps.length}</span>
                                    </div>
                                </div>

                                {/* Floating Nav Buttons */}
                                <button 
                                    disabled={currentStepIndex === 0}
                                    onClick={() => setCurrentStepIndex(currentStepIndex - 1)}
                                    className="absolute left-4 w-16 h-16 bg-white/5 hover:bg-white text-white hover:text-black rounded-full flex items-center justify-center border border-white/10 transition-all shadow-2xl disabled:opacity-0 active:scale-90 backdrop-blur-xl z-20"
                                >
                                    <ChevronLeft size={32} />
                                </button>
                                <button 
                                    disabled={currentStepIndex === drillSteps.length - 1}
                                    onClick={() => setCurrentStepIndex(currentStepIndex + 1)}
                                    className="absolute right-4 w-16 h-16 bg-white text-black rounded-full flex items-center justify-center transition-all shadow-[0_0_30px_#28D16066] disabled:opacity-0 active:scale-90 z-20"
                                >
                                    <ChevronRight size={32} />
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-8 text-center py-40">
                                <div className="relative">
                                    <Layers size={80} className="text-east-light animate-pulse opacity-40" />
                                    <div className="absolute inset-0 bg-east-light/20 blur-3xl rounded-full" />
                                </div>
                                <h3 className="text-xl font-black italic uppercase text-gray-600 tracking-[0.5em]">Constructing Playbook</h3>
                            </div>
                        )}
                    </div>

                    {/* Right: Instruction Sidebar */}
                    <div className="flex-1 min-w-[400px] bg-black/60 backdrop-blur-2xl p-12 flex flex-col justify-center gap-12 border-l border-white/5">
                        {drillSteps.length > 0 && (
                            <div className="space-y-12 animate-slideInRight">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <span className="text-6xl font-black italic text-east-light opacity-50 tracking-tighter leading-none">0{currentStep.step_number}</span>
                                        <div className="h-[2px] flex-1 bg-gradient-to-r from-east-light/30 to-transparent" />
                                    </div>
                                    <h2 className="text-4xl font-black italic uppercase tracking-tight text-white leading-tight">
                                        {currentStep.title}
                                    </h2>
                                </div>

                                <div className="space-y-6">
                                    <span className="block text-[10px] font-black uppercase tracking-[0.4em] text-east-light italic">Tactical Briefing</span>
                                    <p className="text-lg text-gray-300 font-medium leading-relaxed italic border-l-2 border-east-light/30 pl-8 py-2 bg-gradient-to-r from-east-light/5 to-transparent rounded-r-3xl">
                                        {currentStep.instruction}
                                    </p>
                                </div>

                                <div className="flex gap-4 pt-10">
                                    <div className="flex-1 bg-white/5 rounded-3xl p-6 border border-white/5 hover:border-white/20 transition-all group">
                                        <span className="block text-[9px] font-black uppercase text-gray-500 tracking-widest mb-2 italic">Sequence Completion</span>
                                        <div className="flex items-end gap-2">
                                            <span className="text-3xl font-black italic text-white group-hover:text-east-light transition-colors">{Math.round(((currentStepIndex + 1) / drillSteps.length) * 100)}%</span>
                                            <span className="text-[10px] font-bold text-gray-600 mb-1.5 uppercase">Syncing...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Horizontal Step Thumbnails / Progress Bar at bottom */}
                <div className="relative z-20 h-24 bg-black/40 backdrop-blur-3xl border-t border-white/5 flex items-center px-12 gap-4 overflow-x-auto no-scrollbar">
                    {drillSteps.map((s, i) => (
                        <button 
                            key={i}
                            onClick={() => setCurrentStepIndex(i)}
                            className={`shrink-0 h-12 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 flex items-center gap-3 border ${currentStepIndex === i ? 'bg-east-light text-black border-east-light shadow-[0_0_20px_rgba(40,209,96,0.3)] scale-105' : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/20 hover:text-white'}`}
                        >
                            <span className={currentStepIndex === i ? 'text-black' : 'text-east-light opacity-50'}>0{s.step_number}</span>
                            {s.title}
                        </button>
                    ))}
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
                                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-1000" 
                                                    alt="drill" 
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/20 to-transparent" />
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
