'use client';

import React, { useState, useEffect, useRef } from 'react';
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
    Upload,
    Save,
    Loader2,
    Calendar,
    X,
    Plus,
    Video,
    Trash2,
    PenTool,
    Image as ImageIcon,
    Check,
    MessageSquare
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
    tactical_data?: string;
}

const AGE_GROUPS = ['10-12', '12-16', '16-20', '20-24', '24+'];

export default function DrillHubScreen() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session_id');

    const [drills, setDrills] = useState<Drill[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [selectedDrill, setSelectedDrill] = useState<Drill | null>(null);
    const [drillSteps, setDrillSteps] = useState<DrillStep[]>([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [activeAgeFilter, setActiveAgeFilter] = useState<string | null>(null);
    const [activeSkillFilter, setActiveSkillFilter] = useState<string | null>(null);
    const [isSessionPlanMode, setIsSessionPlanMode] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'visual' | 'analysis'>('visual');
    const [isEditing, setIsEditing] = useState(false);
    const [uploadingMedia, setUploadingMedia] = useState(false);
    const [sessions, setSessions] = useState<any[]>([]);
    const [showSessionPicker, setShowSessionPicker] = useState(false);
    const [schedulingDrill, setSchedulingDrill] = useState(false);
    const [isScheduled, setIsScheduled] = useState(false);
    const [linkedSession, setLinkedSession] = useState<any>(null);
    const drillIdParam = searchParams.get('drill_id');
    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUser(user);
                const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
                if (profile) setUserRole(profile.role);
            }
        };
        checkUser();

        if (sessionId) {
            setIsSessionPlanMode(true);
            fetchSessionPlan(sessionId);
        } else if (drillIdParam && !activeSkillFilter) {
            fetchSingleDrill(drillIdParam);
        } else {
            fetchDrills();
        }
    }, [sessionId, activeSkillFilter, searchParams]);

    useEffect(() => {
        if (userRole && !['coach', 'admin', 'sys-admin'].includes(userRole)) {
            setIsEditing(false);
        }
    }, [userRole]);

    const fetchSingleDrill = async (id: string) => {
        setLoading(true);
        const { data, error } = await supabase
            .from('coach_drills')
            .select('*, coach:profiles(first_name, last_name, avatar_url)')
            .eq('id', id)
            .single();

        if (!error && data) {
            setSelectedDrill(data);
            fetchDrillSteps(data.id);
        }
        setLoading(false);
    };

    const fetchSessionPlan = async (sid: string) => {
        setLoading(true);
        const { data: sessionDrillsData, error: sdError } = await supabase
            .from('session_drills')
            .select('drill_id, order_index')
            .eq('session_id', sid)
            .order('order_index', { ascending: true });

        if (!sdError && sessionDrillsData && sessionDrillsData.length > 0) {
            const drillIds = sessionDrillsData.map(sd => sd.drill_id);
            const { data: drillsData, error: dError } = await supabase
                .from('coach_drills')
                .select('*, coach:profiles(first_name, last_name, avatar_url)')
                .in('id', drillIds);

            if (!dError && drillsData) {
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

    const fetchSessions = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase.from('profiles').select('first_name, last_name, role').eq('id', user.id).single();
        if (!profile) return;

        const fullName = `${profile.first_name} ${profile.last_name}`;

        let { data, error } = await supabase
            .from('sessions')
            .select('*')
            .or(`coach_id.eq.${user.id},instructor.ilike.%${fullName}%`)
            .gte('start_time', new Date().toISOString())
            .order('start_time', { ascending: true });
        
        if ((!data || data.length === 0) && ['admin', 'sys-admin'].includes(profile.role || '')) {
            const { data: allSessions } = await supabase
                .from('sessions')
                .select('*')
                .gte('start_time', new Date().toISOString())
                .order('start_time', { ascending: true })
                .limit(20);
            data = allSessions;
        }
        
        if (!error && data) setSessions(data);
    };

    const handleAddToSession = async (sessionId: string) => {
        if (!selectedDrill) return;
        setSchedulingDrill(true);
        try {
            const { data: currentDrills } = await supabase
                .from('session_drills')
                .select('order_index')
                .eq('session_id', sessionId)
                .order('order_index', { ascending: false })
                .limit(1);
            
            const nextOrder = currentDrills && currentDrills.length > 0 ? currentDrills[0].order_index + 1 : 0;

            const { error } = await supabase
                .from('session_drills')
                .insert({
                    session_id: sessionId,
                    drill_id: selectedDrill.id,
                    order_index: nextOrder
                });

            if (error) throw error;
            setIsScheduled(true);
            setLinkedSession(sessions.find(s => s.id === sessionId));
            alert('Drill added to plan!');
            setShowSessionPicker(false);
        } catch (e: any) {
            alert(`Failed to schedule: ${e.message}`);
        } finally {
            setSchedulingDrill(false);
        }
    };

    const handleRemoveFromSession = async (sessionId: string) => {
        if (!selectedDrill) return;
        try {
            const { error } = await supabase
                .from('session_drills')
                .delete()
                .eq('session_id', sessionId)
                .eq('drill_id', selectedDrill.id);

            if (error) throw error;
            
            setLinkedSession(null);
            setIsScheduled(false);
            alert('Drill removed from plan.');
        } catch (e: any) {
            alert(`Failed to remove: ${e.message}`);
        }
    };

    const handleMediaReplace = async (type: 'image' | 'video', file: File) => {
        if (!selectedDrill || drillSteps.length === 0) return;
        setUploadingMedia(true);
        try {
            const stepId = drillSteps[currentStepIndex].id;
            const ext = file.name.split('.').pop();
            const fileName = `drill-replace-${type}-${stepId}-${Date.now()}.${ext}`;
            
            const { error: uploadErr } = await supabase.storage.from('uploads').upload(fileName, file);
            if (uploadErr) throw uploadErr;

            const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(fileName);
            
            const updateData = type === 'image' ? { diagram_url: publicUrl } : { video_url: publicUrl };
            const { error: dbErr } = await supabase.from('coach_drill_steps').update(updateData).eq('id', stepId);
            if (dbErr) throw dbErr;

            const newSteps = [...drillSteps];
            if (type === 'image') newSteps[currentStepIndex].diagram_url = publicUrl;
            else newSteps[currentStepIndex].video_url = publicUrl;
            setDrillSteps(newSteps);
            
            alert(`${type.toUpperCase()} updated successfully!`);
        } catch (e: any) {
            console.error(e);
            alert(`Failed to update ${type}: ${e.message}`);
        } finally {
            setUploadingMedia(false);
        }
    };

    // --- Filtering Logic ---
    const filteredDrills = React.useMemo(() => {
        if (!drills || drills.length === 0) return [];
        return drills.filter(d => {
            const matchesAge = !activeAgeFilter || d.age_tags?.includes(activeAgeFilter);
            
            // Robust Skill Filtering
            let matchesSkill = false;
            if (!activeSkillFilter || activeSkillFilter === 'ALL') {
                matchesSkill = true;
            } else if (Array.isArray(d.skill_tags)) {
                matchesSkill = d.skill_tags.some(s => 
                    typeof s === 'string' && s.toUpperCase().includes(activeSkillFilter.toUpperCase())
                );
            } else if (typeof d.skill_tags === 'string') {
                matchesSkill = (d.skill_tags as string).toUpperCase().includes(activeSkillFilter.toUpperCase());
            }

            return matchesAge && matchesSkill;
        });
    }, [drills, activeAgeFilter, activeSkillFilter]);

    if (selectedDrill) {
        const currentStep = drillSteps[currentStepIndex];
        return (
            <div className="min-h-screen bg-[#050505] text-white animate-fadeIn font-montserrat select-none overflow-hidden relative flex flex-col">
                <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                    <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-east-light/10 blur-[150px] rounded-full animate-pulse" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-east-light/5 blur-[120px] rounded-full" />
                </div>

                <div className="relative z-30 flex flex-col md:flex-row gap-4 md:gap-0 justify-between items-start md:items-center px-4 sm:px-8 lg:px-12 py-4 sm:py-6 lg:py-10 backdrop-blur-md bg-black/20 border-b border-white/5">
                    <div className="flex flex-col gap-1 w-full md:w-auto">
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => {
                                    window.history.replaceState({}, '', window.location.pathname);
                                    setSelectedDrill(null);
                                    setShowSessionPicker(false);
                                    if (window.history.length > 1 && !drillIdParam) window.history.back();
                                }}
                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-east-light transition-all group"
                            >
                                <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back
                            </button>
                            <span className="w-1 h-1 bg-white/20 rounded-full" />
                            <span className="text-[10px] font-black tracking-[0.4em] text-east-light uppercase italic">
                                {isEditing ? 'Studio Mode' : 'Tactical Sequence'}
                            </span>
                        </div>
                        <h1 className="text-xl sm:text-2xl md:text-4xl font-black italic uppercase tracking-tighter text-white leading-tight brightness-125">
                            {selectedDrill.title}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full md:w-auto justify-start md:justify-end">
                        {['coach', 'admin', 'sys-admin'].includes(userRole || '') && (
                            linkedSession ? (
                                <div className="bg-[#28D160]/10 border border-[#28D160]/30 rounded-2xl px-3 py-1.5 sm:px-4 sm:py-2 flex items-center gap-3 sm:gap-4 animate-fadeIn">
                                    <div className="flex flex-col">
                                        <span className="text-[7px] font-black italic text-[#28D160] uppercase tracking-widest">Active Plan</span>
                                        <h3 className="text-[10px] font-black uppercase text-white truncate max-w-[100px] sm:max-w-[120px]">{linkedSession.title}</h3>
                                    </div>
                                    <button 
                                        onClick={() => handleRemoveFromSession(linkedSession.id)}
                                        className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors group"
                                    >
                                        <X size={12} className="text-gray-500 group-hover:text-red-500" />
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => {
                                        fetchSessions();
                                        setShowSessionPicker(true);
                                    }}
                                    disabled={showSessionPicker}
                                    className={`px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${showSessionPicker ? 'bg-white/5 text-gray-500 border border-white/10' : 'bg-[#28D160] text-black border-none hover:shadow-[0_0_20px_#28D16066]'}`}
                                >
                                    <Calendar size={12} className="sm:w-3.5 sm:h-3.5" />
                                    {showSessionPicker ? 'SELECT SESSION...' : 'SCHEDULE DRILL'}
                                </button>
                            )
                        )}

                        {isEditing && (
                            <button 
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 bg-white text-black border-none hover:scale-105"
                            >
                                <Save size={12} className="sm:w-3.5 sm:h-3.5" />
                                SAVE DRILL
                            </button>
                        )}
                        
                        {!isEditing && (userRole === 'sys-admin' || (selectedDrill && currentUser?.id === selectedDrill.coach_id)) && (
                            <button 
                                onClick={() => setIsEditing(true)}
                                className="px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 bg-white/5 text-[#28D160] border border-[#28D160]/20 hover:bg-[#28D160]/10"
                            >
                                <Plus size={12} className="sm:w-3.5 sm:h-3.5" />
                                EDIT DRILL
                            </button>
                        )}

                        {(!['coach', 'admin', 'sys-admin'].includes(userRole || '') && selectedDrill?.coach_id) && (
                            <button 
                                onClick={() => window.location.href = `/?tab=community&chatWith=${selectedDrill.coach_id}`}
                                className="px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 bg-[#28D160]/10 text-[#28D160] border border-[#28D160]/30 hover:bg-[#28D160]/20 shadow-[0_0_15px_rgba(40,209,96,0.15)] active:scale-95"
                            >
                                <MessageSquare size={12} className="sm:w-3.5 sm:h-3.5" />
                                MESSAGE COACH
                            </button>
                        )}

                        <button 
                            onClick={() => {
                                setSelectedDrill(null);
                                setShowSessionPicker(false);
                                if (!drillIdParam) window.history.back();
                            }}
                            className="p-2.5 sm:p-3 bg-white/5 border border border-white/10 rounded-xl text-gray-500 hover:text-white transition-all"
                        >
                            <X size={16} className="sm:w-4.5 sm:h-4.5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 relative z-10 flex flex-col lg:flex-row overflow-hidden overflow-y-auto lg:overflow-hidden">
                    <div className="w-full lg:flex-1 relative bg-[#050505] flex items-center justify-center min-h-[350px] sm:min-h-[450px] lg:min-h-0 border-b lg:border-b-0 border-white/5">
                        {drillSteps.length > 0 ? (
                            <div className="w-full h-full relative flex items-center justify-center p-3 sm:p-6 lg:p-12">
                                <div className="relative w-full max-w-[800px] aspect-video bg-[#0a0a0a] rounded-2xl sm:rounded-[2rem] shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/5 overflow-hidden group flex items-center justify-center p-2 sm:p-6 lg:p-10">
                                    {activeTab === 'visual' ? (
                                        (currentStep.diagram_url || currentStep.tactical_data) ? (
                                            <img 
                                                src={currentStep.diagram_url || currentStep.tactical_data} 
                                                className="w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-fadeIn" 
                                                alt="diagram" 
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center gap-4 sm:gap-6 opacity-20">
                                                <Layers className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 text-white" />
                                                <span className="text-xs sm:text-sm font-black uppercase tracking-[0.4em] italic">Awaiting Visuals</span>
                                            </div>
                                        )
                                    ) : (
                                        <div className="flex flex-col items-center gap-4 sm:gap-6 opacity-20">
                                            <Video className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 text-white" />
                                            <span className="text-xs sm:text-sm font-black uppercase tracking-[0.4em] italic">Analysis Stream</span>
                                        </div>
                                    )}

                                    <div className="absolute top-4 right-4 sm:top-8 sm:right-8 w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center">
                                        <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
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
                                        <span className="absolute text-[8px] sm:text-[10px] font-black italic">{currentStepIndex + 1}/{drillSteps.length}</span>
                                    </div>
                                </div>

                                {/* Floating Nav Buttons */}
                                <button 
                                    disabled={currentStepIndex === 0}
                                    onClick={() => setCurrentStepIndex(currentStepIndex - 1)}
                                    className="absolute left-2 sm:left-4 w-10 h-10 sm:w-16 sm:h-16 bg-white/5 hover:bg-white text-white hover:text-black rounded-full flex items-center justify-center border border-white/10 transition-all shadow-2xl disabled:opacity-0 active:scale-90 backdrop-blur-xl z-20"
                                >
                                    <ChevronLeft size={20} className="sm:w-8 sm:h-8" />
                                </button>
                                <button 
                                    disabled={currentStepIndex === drillSteps.length - 1}
                                    onClick={() => setCurrentStepIndex(currentStepIndex + 1)}
                                    className="absolute right-2 sm:right-4 w-10 h-10 sm:w-16 sm:h-16 bg-white text-black rounded-full flex items-center justify-center transition-all shadow-[0_0_30px_#28D16066] disabled:opacity-0 active:scale-90 z-20"
                                >
                                    <ChevronRight size={20} className="sm:w-8 sm:h-8" />
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
                    <div className="w-full lg:w-[400px] lg:min-w-[400px] bg-black/60 backdrop-blur-2xl p-6 sm:p-8 lg:p-12 flex flex-col justify-center gap-6 lg:gap-12 border-t lg:border-t-0 lg:border-l border-white/5">
                        {drillSteps.length > 0 && (
                            <div className="space-y-6 sm:space-y-12 animate-slideInRight">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <span className="text-4xl sm:text-5xl lg:text-6xl font-black italic text-east-light opacity-50 tracking-tighter leading-none">0{currentStep.step_number}</span>
                                        <div className="h-[2px] flex-1 bg-gradient-to-r from-east-light/30 to-transparent" />
                                    </div>
                                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black italic uppercase tracking-tight text-white leading-tight">
                                        {currentStep.title}
                                    </h2>
                                </div>

                                <div className="space-y-4 sm:space-y-6">
                                    <span className="block text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] text-east-light italic">Drill Briefing</span>
                                    {isEditing && (userRole === 'coach' || userRole === 'admin' || userRole === 'sys-admin') ? (
                                        <textarea 
                                            value={currentStep.instruction}
                                            onChange={(e) => {
                                                const newSteps = [...drillSteps];
                                                newSteps[currentStepIndex].instruction = e.target.value;
                                                setDrillSteps(newSteps);
                                                // Auto-save logic could go here
                                                supabase.from('coach_drill_steps').update({ instruction: e.target.value }).eq('id', currentStep.id).then();
                                            }}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 text-sm sm:text-base lg:text-lg text-white font-medium italic outline-none focus:border-[#28D160] transition-all min-h-[120px] sm:min-h-[150px]"
                                        />
                                    ) : (
                                        <p className="text-sm sm:text-base lg:text-lg text-gray-300 font-medium leading-relaxed italic border-l-2 border-east-light/30 pl-4 sm:pl-8 py-2 bg-gradient-to-r from-east-light/5 to-transparent rounded-r-3xl">
                                            {currentStep.instruction}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-3 sm:gap-4 pt-2 sm:pt-4">
                                    <button 
                                        onClick={() => setActiveTab('visual')}
                                        className={`w-full py-4 sm:py-5 px-6 sm:px-8 rounded-2xl font-black italic text-[10px] sm:text-xs uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-between border ${activeTab === 'visual' ? 'bg-[#28D160] text-black border-[#28D160] shadow-[0_20px_40px_rgba(40,209,96,0.3)]' : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/20 hover:text-white'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span>Drill Briefing</span>
                                            {isEditing && (
                                                <div 
                                                    onClick={(e) => { e.stopPropagation(); imageInputRef.current?.click(); }}
                                                    className="p-1.5 bg-east-light/20 text-east-light rounded-lg hover:bg-east-light hover:text-black transition-all"
                                                >
                                                    {uploadingMedia ? <Loader2 className="animate-spin" size={12} /> : <Upload size={12} />}
                                                </div>
                                            )}
                                        </div>
                                        <ImageIcon size={18} />
                                    </button>

                                    <button 
                                        onClick={() => setActiveTab('analysis')}
                                        className={`w-full py-4 sm:py-5 px-6 sm:px-8 rounded-2xl font-black italic text-[10px] sm:text-xs uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-between border ${activeTab === 'analysis' ? 'bg-white text-black border-white shadow-[0_20px_40px_rgba(255,255,255,0.15)]' : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/20 hover:text-white'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span>Analysis Stream</span>
                                            {isEditing && (
                                                <div 
                                                    onClick={(e) => { e.stopPropagation(); videoInputRef.current?.click(); }}
                                                    className="p-1.5 bg-east-light/20 text-east-light rounded-lg hover:bg-east-light hover:text-black transition-all"
                                                >
                                                    {uploadingMedia ? <Loader2 className="animate-spin" size={12} /> : <Upload size={12} />}
                                                </div>
                                            )}
                                        </div>
                                        <Video size={18} />
                                    </button>

                                    {/* Hidden Inputs */}
                                    <input 
                                        type="file" 
                                        ref={imageInputRef} 
                                        className="hidden" 
                                        accept="image/*" 
                                        onChange={(e) => e.target.files?.[0] && handleMediaReplace('image', e.target.files[0])} 
                                    />
                                    <input 
                                        type="file" 
                                        ref={videoInputRef} 
                                        className="hidden" 
                                        accept="video/*" 
                                        onChange={(e) => e.target.files?.[0] && handleMediaReplace('video', e.target.files[0])} 
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Horizontal Step Thumbnails / Progress Bar at bottom */}
                <div className="relative z-20 h-24 bg-black/40 backdrop-blur-3xl border-t border-white/5 flex items-center px-12 gap-4 overflow-x-auto no-scrollbar">
                    {drillSteps.map((s, i) => (
                        <div key={i} className="relative group/step">
                            <button 
                                onClick={() => setCurrentStepIndex(i)}
                                className={`shrink-0 h-12 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 flex items-center gap-3 border ${currentStepIndex === i ? 'bg-east-light text-black border-east-light shadow-[0_0_20px_rgba(40,209,96,0.3)] scale-105' : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/20 hover:text-white'}`}
                            >
                                <span className={currentStepIndex === i ? 'text-black' : 'text-east-light opacity-50'}>0{s.step_number}</span>
                                {s.title}
                            </button>
                            {(isEditing && (userRole === 'coach' || userRole === 'admin' || userRole === 'sys-admin')) && (
                                <button 
                                    onClick={async () => {
                                        if (drillSteps.length <= 1) return;
                                        await supabase.from('coach_drill_steps').delete().eq('id', s.id);
                                        const newSteps = drillSteps.filter((_, idx) => idx !== i);
                                        setDrillSteps(newSteps);
                                        setCurrentStepIndex(Math.max(0, i - 1));
                                    }}
                                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/step:opacity-100 transition-opacity shadow-xl"
                                >
                                    <X size={10} />
                                </button>
                            )}
                        </div>
                    ))}
                    {(isEditing && (userRole === 'coach' || userRole === 'admin' || userRole === 'sys-admin')) && (
                        <button 
                            onClick={async () => {
                                const { data } = await supabase.from('coach_drill_steps').insert({
                                    drill_id: selectedDrill.id,
                                    step_number: drillSteps.length + 1,
                                    title: 'New Slide',
                                    instruction: 'Add coaching instruction here...'
                                }).select().single();
                                if (data) {
                                    setDrillSteps([...drillSteps, data]);
                                    setCurrentStepIndex(drillSteps.length);
                                }
                            }}
                            className="shrink-0 w-12 h-12 bg-white/5 border border-dashed border-white/20 rounded-xl flex items-center justify-center text-gray-500 hover:text-east-light hover:border-east-light transition-all"
                        >
                            <Plus size={20} />
                        </button>
                    )}
                </div>

                {/* Session Picker Modal */}
                {showSessionPicker && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-fadeIn">
                        <div className="w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-[3rem] p-10 space-y-8 shadow-[0_50px_100px_rgba(0,0,0,0.8)]">
                            <div className="flex justify-between items-center">
                                <h2 className="text-3xl font-black italic uppercase tracking-tighter">Schedule Drill</h2>
                                <button onClick={() => setShowSessionPicker(false)} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
                                {schedulingDrill ? (
                                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                        <Loader2 className="w-12 h-12 text-east-light animate-spin" />
                                        <p className="text-gray-500 font-bold italic uppercase tracking-widest text-xs">Fetching sessions...</p>
                                    </div>
                                ) : sessions.length === 0 ? (
                                    <p className="text-gray-500 font-medium italic">No upcoming sessions found...</p>
                                ) : (
                                    sessions.map(s => (
                                        <button 
                                            key={s.id}
                                            onClick={() => handleAddToSession(s.id)}
                                            disabled={schedulingDrill}
                                            className="w-full p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-east-light hover:bg-east-light/5 text-left transition-all group flex justify-between items-center"
                                        >
                                            <div>
                                                <p className="font-black uppercase tracking-widest text-xs text-east-light mb-1">{s.title}</p>
                                                <p className="text-lg font-medium italic text-gray-300">{new Date(s.start_time).toLocaleDateString()} @ {new Date(s.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                            <ArrowRight size={20} className="text-gray-600 group-hover:translate-x-2 group-hover:text-east-light transition-all" />
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
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
            <div className="relative z-10 p-4 sm:p-8 pt-12 sm:pt-16">
                <div className="flex flex-col gap-3 mb-8 sm:mb-10">
                    <span className="text-[9px] sm:text-[10px] font-black tracking-[0.5em] text-east-light uppercase italic opacity-80">Evolution System</span>
                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-black italic uppercase tracking-tighter leading-none brightness-125 drop-shadow-2xl">
                        {isSessionPlanMode ? "Training Plan" : "Drill Hub"}
                    </h1>
                </div>

                {!isSessionPlanMode && (
                    <div className="flex gap-2 sm:gap-4 overflow-x-auto no-scrollbar py-2 -mx-4 px-4">
                        {['ALL', 'SHOOTING', 'PASSING', 'DEFENSE', 'SKATING', 'STICKHANDLING', 'GOALIE'].map((f) => (
                            <button 
                                key={f} 
                                onClick={() => setActiveSkillFilter(f)}
                                className={`px-6 sm:px-10 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all duration-500 border backdrop-blur-md shadow-2xl active:scale-95 ${(activeSkillFilter === f || (!activeSkillFilter && f === 'ALL')) ? 'bg-east-light text-black border-east-light shadow-[0_0_25px_rgba(40,209,96,0.4)]' : 'bg-[#111] text-gray-500 border-white/5 hover:border-white/20 hover:text-white'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {isSessionPlanMode ? (
                <div className="px-4 sm:px-6 space-y-4">
                    {drills.length === 0 && !loading && (
                        <div className="text-center py-20 opacity-50">
                            <p className="text-xs font-black uppercase">No plan found.</p>
                        </div>
                    )}
                    {filteredDrills.map((drill, idx) => (
                        <div 
                            key={drill.id} 
                            onClick={() => handleSelectDrill(drill)}
                            className="bg-[#121212] border border-white/10 rounded-2xl p-4 flex items-center justify-between cursor-pointer active:scale-95 transition-all shadow-xl"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/5 rounded-xl flex items-center justify-center text-[#28D160] font-black italic text-lg sm:text-xl">
                                    {idx + 1}
                                </div>
                                <div>
                                    <h3 className="font-black italic text-base sm:text-lg uppercase">{drill.title}</h3>
                                    <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                        {drill.skill_tags?.[0] || 'Fundamentals'}
                                    </span>
                                </div>
                            </div>
                            <ChevronRight className="text-gray-600 w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                    ))}
                </div>
            ) : (
                /* Redesigned Age Group Sections */
                <div className="relative z-10 mt-2 sm:mt-6 space-y-10 sm:space-y-16">
                    {AGE_GROUPS.map((ageGroup, idx) => {
                        const groupItems = filteredDrills.filter(d => d.age_tags?.includes(ageGroup));
                        if (groupItems.length === 0) return null;
                        
                        return (
                            <div key={ageGroup} className="px-4 sm:px-8">
                                <div className="flex items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
                                    <h2 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tighter text-white brightness-125">{ageGroup}</h2>
                                    <div className="h-[1px] flex-1 bg-gradient-to-r from-white/20 via-white/5 to-transparent" />
                                    <span className="text-[9px] sm:text-[10px] font-black italic text-gray-600 uppercase tracking-widest">{groupItems.length} DRILLS</span>
                                </div>
                                
                                <div className="flex overflow-x-auto no-scrollbar gap-4 sm:gap-8 pb-4 sm:pb-8 -mx-4 sm:-mx-8 px-4 sm:px-8">
                                    {groupItems.map((drill, dIdx) => (
                                        <div 
                                            key={drill.id} 
                                            onClick={() => handleSelectDrill(drill)}
                                            className="shrink-0 w-64 sm:w-72 h-80 sm:h-96 rounded-[2.5rem] sm:rounded-[3.5rem] border border-white/5 relative overflow-hidden group transition-all duration-700 shadow-2xl cursor-pointer hover:border-east-light hover:-translate-y-4 hover:shadow-[0_40px_80px_rgba(0,0,0,0.6)]"
                                        >
                                            {/* Drill Image/Thumbnail */}
                                            <div className="absolute inset-0 bg-[#0a0a0a]">
                                                <img 
                                                    src={drill.thumbnail_url || "https://images.unsplash.com/photo-1580748141549-71748ddf0bdc?auto=format&fit=crop&q=80&w=800"} 
                                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-1000" 
                                                    alt="drill" 
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/20 to-transparent" />
                                            </div>

                                            {/* Glow Overlay */}
                                            <div className="absolute inset-0 bg-east-light/0 group-hover:bg-east-light/5 transition-colors duration-700" />

                                            {/* Card Content */}
                                            <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-end">
                                                {drill && (
                                                    <>
                                                        <div className="mb-4 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                                                            <div className="inline-flex px-3 py-1 bg-east-light/10 border border-east-light/20 rounded-full">
                                                                <span className="text-[9px] font-black italic text-east-light uppercase tracking-widest">
                                                                    {drill.skill_tags?.[0] || 'Fundamentals'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <h3 className="font-black italic text-xl sm:text-2xl text-white uppercase leading-[1.1] tracking-tight drop-shadow-2xl group-hover:text-east-light transition-colors duration-500">
                                                            {drill.title || 'Coming Soon'}
                                                        </h3>
                                                        <div className="mt-6 flex items-center justify-between opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-100">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-full border border-white/10 overflow-hidden">
                                                                    <img src={drill.coach?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${drill.coach?.first_name}`} className="w-full h-full object-cover" />
                                                                </div>
                                                                <span className="text-[9px] font-black italic text-gray-400 uppercase">{drill.coach?.first_name} {drill.coach?.last_name}</span>
                                                            </div>
                                                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white text-black flex items-center justify-center shadow-2xl group-active:scale-90 transition-transform">
                                                                <Play size={16} className="sm:w-5 sm:h-5 fill-black ml-1" />
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
