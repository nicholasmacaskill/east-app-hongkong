'use client';
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/app/lib/supabase';
import { Search, Users, MessageSquare, Plus, Video, Layers, Send, X, ChevronLeft } from 'lucide-react';
import { useToast } from '@/app/components/ui/Toast';
import CreateTeamModal from '@/app/components/modals/CreateTeamModal';

export default function PrivateMessenger({ currentUserId, chatWithUserId, shareDrillId, sharePlanId }: { currentUserId: string, chatWithUserId?: string | null, shareDrillId?: string | null, sharePlanId?: string | null }) {
    const { addToast } = useToast();
    const [view, setView] = useState<'list' | 'chat'>(chatWithUserId ? 'chat' : 'list');
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateTeam, setShowCreateTeam] = useState(false);

    // Data states
    const [teams, setTeams] = useState<any[]>([]);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [currentUserProfile, setCurrentUserProfile] = useState<any | null>(null);

    // Active chat state
    const [activeChatId, setActiveChatId] = useState<string | null>(null); // can be a user_id or a team_id
    const [isTeamChat, setIsTeamChat] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [messageInput, setMessageInput] = useState('');

    // Unread tracking
    const [lastMessages, setLastMessages] = useState<Record<string, any>>({});
    const [readReceipts, setReadReceipts] = useState<Record<string, string>>({});

    // Attachments
    const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const videoFileRef = useRef<HTMLInputElement>(null);

    const [showContentPicker, setShowContentPicker] = useState(false);
    const [pickerTab, setPickerTab] = useState<'drills' | 'plans'>('drills');
    const [coachDrills, setCoachDrills] = useState<any[]>([]);
    const [selectedDrill, setSelectedDrill] = useState<any | null>(null);

    const [trainingPlans, setTrainingPlans] = useState<any[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<any | null>(null);

    useEffect(() => {
        fetchTeamsAndProfiles();
        fetchDrillsAndPlans();
    }, [currentUserId]);

    const fetchDrillsAndPlans = async () => {
        const { data: drills } = await supabase.from('coach_drills').select('*').order('created_at', { ascending: false });
        if (drills) {
            setCoachDrills(drills);
            if (shareDrillId) {
                const matchedDrill = drills.find(d => d.id === shareDrillId);
                if (matchedDrill) setSelectedDrill(matchedDrill);
            }
        }

        const { data: plans } = await supabase.from('training_plans').select('*').order('created_at', { ascending: false });
        if (plans) {
            setTrainingPlans(plans);
            if (sharePlanId) {
                const matchedPlan = plans.find(p => p.id === sharePlanId);
                if (matchedPlan) setSelectedPlan(matchedPlan);
            }
        }
    };

    const fetchTeamsAndProfiles = async () => {
        // Fetch current user profile
        const { data: myProfile } = await supabase.from('profiles').select('*').eq('id', currentUserId).single();
        if (myProfile) setCurrentUserProfile(myProfile);

        // Fetch Teams — coaches see teams they created, players see teams they are members of
        let myTeams: any[] = [];
        if (myProfile?.role === 'coach' || myProfile?.role === 'sys-admin' || myProfile?.role === 'admin') {
            // Coaches/admins see teams they created
            const { data } = await supabase.from('teams').select('*').eq('coach_id', currentUserId);
            if (data) myTeams = data;
        } else {
            // Players/parents see teams they are members of via team_members table
            const { data: membershipData } = await supabase
                .from('team_members')
                .select('team_id')
                .eq('user_id', currentUserId);
            if (membershipData && membershipData.length > 0) {
                const teamIds = membershipData.map(m => m.team_id);
                const { data: teamsData } = await supabase
                    .from('teams')
                    .select('*')
                    .in('id', teamIds);
                if (teamsData) myTeams = teamsData;
            }
        }
        setTeams(myTeams);

        // Fetch Profiles for 1-on-1 chats
        const { data: allProfiles, error: profilesError } = await supabase.from('profiles').select('*').neq('id', currentUserId);
        if (profilesError) console.error('❌ Profiles fetch error:', profilesError);
        if (allProfiles) {
            let allowedProfiles = allProfiles;
            console.log(`✅ Loaded ${allProfiles.length} profiles for DM list`);

            // Prevent players from messaging other players directly
            // Players can only see and message coaches, parents, admins, and sys-admins
            if (myProfile?.role === 'player') {
                allowedProfiles = allProfiles.filter(p => p.role !== 'player');
            }

            setProfiles(allowedProfiles);

            if (chatWithUserId) {
                // Check if the target user exists AND is allowed (not a player if current user is a player)
                const targetUser = allProfiles.find(p => p.id === chatWithUserId);
                if (targetUser) {
                    // If current user is a player, only allow chatting with non-players
                    if (myProfile?.role === 'player' && targetUser.role === 'player') {
                        console.warn('❌ Players cannot message other players');
                    } else {
                        setActiveChatId(chatWithUserId);
                        setIsTeamChat(false);
                        fetchMessages(chatWithUserId, false);
                    }
                }
            }
        }

        // Fetch recent messages for sorting and unread indicators
        const teamIds = myTeams?.map(t => t.id) || [];
        const { data: dmData } = await supabase.from('messages')
            .select('*')
            .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
            .order('created_at', { ascending: false });

        const { data: teamData } = teamIds.length > 0
            ? await supabase.from('messages').select('*').in('team_id', teamIds).order('created_at', { ascending: false })
            : { data: [] };

        const combined = [...(dmData || []), ...(teamData || [])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        const latest: Record<string, any> = {};
        combined.forEach(msg => {
            const chatId = msg.team_id || (msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id);
            if (chatId && !latest[chatId]) {
                latest[chatId] = msg;
            }
        });
        setLastMessages(latest);

        // Load read receipts from local storage
        if (typeof window !== 'undefined') {
            const receipts: Record<string, string> = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key?.startsWith(`chat_read_${currentUserId}_`)) {
                    const chatId = key.replace(`chat_read_${currentUserId}_`, '');
                    receipts[chatId] = localStorage.getItem(key) || '';
                }
            }
            setReadReceipts(receipts);
        }
    };

    useEffect(() => {
        if (!activeChatId) return;

        // Realtime subscription
        const channel = supabase.channel(`chat:${activeChatId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },
                (payload) => {
                    // Only add if it belongs to this chat and we didn't just send it
                    const msg = payload.new;
                    if (msg.sender_id !== currentUserId) {
                        if (isTeamChat && msg.team_id === activeChatId) {
                            setMessages(prev => [...prev, msg]);
                            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                        } else if (!isTeamChat && (msg.sender_id === activeChatId || msg.receiver_id === activeChatId)) {
                            setMessages(prev => [...prev, msg]);
                            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                        }
                    }
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [activeChatId, isTeamChat, currentUserId]);

    const fetchMessages = async (chatId: string, isTeam: boolean) => {
        if (isTeam) {
            const { data } = await supabase.from('messages')
                .select('*')
                .eq('team_id', chatId)
                .order('created_at', { ascending: true });
            if (data) setMessages(data);
        } else {
            const { data } = await supabase.from('messages')
                .select('*')
                .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${chatId}),and(sender_id.eq.${chatId},receiver_id.eq.${currentUserId})`)
                .order('created_at', { ascending: true });
            if (data) setMessages(data);
        }
    };

    const handleOpenChat = (id: string, isTeam: boolean) => {
        // Prevent players from opening DMs with other players
        if (!isTeam && currentUserProfile?.role === 'player') {
            const targetProfile = profiles.find(p => p.id === id);
            if (targetProfile?.role === 'player') {
                console.warn('❌ Blocked: Players cannot open chat with other players');
                addToast('You cannot message other players', 'error');
                return;
            }
        }
        setActiveChatId(id);
        setIsTeamChat(isTeam);
        setView('chat');
        fetchMessages(id, isTeam);

        // Mark as read immediately when opening
        if (lastMessages[id]) {
            if (typeof window !== 'undefined') {
                localStorage.setItem(`chat_read_${currentUserId}_${id}`, lastMessages[id].id.toString());
                setReadReceipts(prev => ({ ...prev, [id]: lastMessages[id].id.toString() }));
            }
        }
    };

    const handleSendMessage = async () => {
        if ((!messageInput.trim() && !selectedVideo && !selectedDrill && !selectedPlan) || !activeChatId) return;

        // Prevent players from sending DMs to other players (server-side check)
        if (!isTeamChat && currentUserProfile?.role === 'player') {
            const targetProfile = profiles.find(p => p.id === activeChatId);
            if (targetProfile?.role === 'player') {
                console.warn('❌ Blocked: Players cannot message other players');
                addToast('You cannot message other players', 'error');
                setIsUploading(false);
                return;
            }
        }

        setIsUploading(true);
        let uploadedVideoUrl = null;

        if (selectedVideo) {
            const fileExt = selectedVideo.name.split('.').pop();
            const fileName = `video-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('uploads').upload(fileName, selectedVideo);
            if (!uploadError) {
                const { data } = supabase.storage.from('uploads').getPublicUrl(fileName);
                uploadedVideoUrl = data.publicUrl;
            } else {
                console.error("Video upload failed", uploadError);
                addToast("Failed to upload video", "error");
            }
        }

        const newMsg = {
            sender_id: currentUserId,
            content: messageInput,
            video_url: uploadedVideoUrl,
            shared_drill_id: selectedDrill ? selectedDrill.id : null,
            shared_plan_id: selectedPlan ? selectedPlan.id : null,
            ...(isTeamChat ? { team_id: activeChatId } : { receiver_id: activeChatId })
        };

        setMessageInput('');
        setSelectedVideo(null);
        setSelectedDrill(null);
        setSelectedPlan(null);
        const { error } = await supabase.from('messages').insert(newMsg);
        if (error) {
            console.error("Message Insert Error:", error);
            alert("Failed to send message: " + error.message);
        } else {
            fetchMessages(activeChatId, isTeamChat);
        }
        setIsUploading(false);
    };

    const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedVideo(e.target.files[0]);
        }
    };

    const filteredProfiles = profiles.filter(p =>
        (p.first_name + " " + p.last_name).toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.role && p.role.toLowerCase().includes(searchQuery.toLowerCase()))
    ).sort((a, b) => {
        const aTime = lastMessages[a.id] ? new Date(lastMessages[a.id].created_at).getTime() : 0;
        const bTime = lastMessages[b.id] ? new Date(lastMessages[b.id].created_at).getTime() : 0;
        return bTime - aTime;
    });

    const filteredTeams = teams.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase())).sort((a, b) => {
        const aTime = lastMessages[a.id] ? new Date(lastMessages[a.id].created_at).getTime() : 0;
        const bTime = lastMessages[b.id] ? new Date(lastMessages[b.id].created_at).getTime() : 0;
        return bTime - aTime;
    });

    if (view === 'chat') {
        const chatTitle = isTeamChat
            ? teams.find(t => t.id === activeChatId)?.name
            : profiles.find(p => p.id === activeChatId)?.first_name + " " + profiles.find(p => p.id === activeChatId)?.last_name;

        return (
            <div className="h-full flex flex-col bg-[#050505] text-white">
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/50">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setView('list')} className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition">
                            <ChevronLeft size={20} />
                        </button>
                        <div>
                            <h3 className="font-black italic uppercase text-lg">{chatTitle}</h3>
                            <span className="text-[10px] font-bold text-gray-500 uppercase">{isTeamChat ? 'Team Chat' : 'Direct Message'}</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                    {messages.map(msg => {
                        const isMe = msg.sender_id === currentUserId;
                        const senderProfile = profiles.find(p => p.id === msg.sender_id);
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-2xl p-4 ${isMe ? 'bg-[#28D160]/20 border border-[#28D160]/30 rounded-tr-none' : 'bg-white/5 border border-white/10 rounded-tl-none'}`}>
                                    {!isMe && isTeamChat && senderProfile && (
                                        <p className="text-[9px] font-black uppercase text-gray-500 mb-1">{senderProfile.first_name} {senderProfile.last_name}</p>
                                    )}
                                    <p className="text-sm">{msg.content}</p>
                                    {msg.video_url && (
                                        <div className="mt-2 rounded-xl overflow-hidden border border-white/10">
                                            <video src={msg.video_url} controls className="w-full max-h-64 object-cover bg-black" />
                                        </div>
                                    )}
                                    {msg.shared_drill_id && (
                                        <div onClick={() => window.open(`/drill-hub?drill_id=${msg.shared_drill_id}`, '_blank')} className="mt-2 p-3 bg-black/50 rounded-xl flex items-center gap-3 border border-[#28D160]/30 cursor-pointer hover:bg-[#28D160]/10 transition group">
                                            <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center border border-white/10 group-hover:border-[#28D160]/50 transition overflow-hidden shrink-0">
                                                {coachDrills.find(d => d.id === msg.shared_drill_id)?.thumbnail_url ? (
                                                    <img src={coachDrills.find(d => d.id === msg.shared_drill_id)?.thumbnail_url} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Layers size={20} className="text-[#28D160]" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="text-[10px] font-black uppercase text-[#28D160] block leading-none mb-1">Attached Drill</span>
                                                <span className="text-xs font-bold text-white block truncate">
                                                    {coachDrills.find(d => d.id === msg.shared_drill_id)?.title || 'View Drill'}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    {msg.shared_plan_id && (
                                        <div onClick={() => window.open(`/drill-hub?plan_id=${msg.shared_plan_id}`, '_blank')} className="mt-2 p-3 bg-black/50 rounded-xl flex items-center gap-3 border border-[#28D160]/30 cursor-pointer hover:bg-[#28D160]/10 transition group">
                                            <div className="w-10 h-10 rounded-lg bg-[#28D160]/20 flex items-center justify-center border border-[#28D160]/30 group-hover:scale-110 transition shrink-0">
                                                <Layers size={20} className="text-[#28D160]" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="text-[10px] font-black uppercase text-[#28D160] block leading-none mb-1">Training Plan</span>
                                                <span className="text-xs font-bold text-white block truncate">
                                                    {trainingPlans.find(p => p.id === msg.shared_plan_id)?.title || 'View Training Plan'}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-white/10 bg-black/50 relative">
                    {showContentPicker && (
                        <div className="absolute bottom-full left-4 mb-2 w-72 max-h-96 bg-[#111] border border-white/10 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden">
                            <div className="p-3 border-b border-white/10 flex flex-col gap-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Attach Content</span>
                                    <button onClick={() => setShowContentPicker(false)} className="text-gray-500 hover:text-white"><X size={14} /></button>
                                </div>
                                <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
                                    <button onClick={() => setPickerTab('drills')} className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg transition ${pickerTab === 'drills' ? 'bg-[#28D160]/20 text-[#28D160]' : 'text-gray-500 hover:text-white'}`}>Drills</button>
                                    <button onClick={() => setPickerTab('plans')} className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg transition ${pickerTab === 'plans' ? 'bg-[#28D160]/20 text-[#28D160]' : 'text-gray-500 hover:text-white'}`}>Plans</button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-2 p-3 no-scrollbar">
                                {pickerTab === 'drills' && (
                                    <>
                                        {coachDrills.map(drill => (
                                            <button
                                                key={drill.id}
                                                onClick={() => { setSelectedDrill(drill); setShowContentPicker(false); setSelectedPlan(null); }}
                                                className="w-full text-left flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition"
                                            >
                                                <div className="w-10 h-10 rounded-lg bg-black overflow-hidden flex items-center justify-center border border-white/5 shrink-0">
                                                    {drill.thumbnail_url ? <img src={drill.thumbnail_url} className="w-full h-full object-cover" /> : <Layers size={16} className="text-gray-500" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <span className="text-xs font-bold text-white block truncate">{drill.title}</span>
                                                    <span className="text-[9px] font-black text-[#28D160] uppercase">{drill.category}</span>
                                                </div>
                                            </button>
                                        ))}
                                        {coachDrills.length === 0 && <span className="text-[10px] text-gray-500 text-center block py-4">No drills found.</span>}
                                    </>
                                )}
                                {pickerTab === 'plans' && (
                                    <>
                                        {trainingPlans.map(plan => (
                                            <button
                                                key={plan.id}
                                                onClick={() => { setSelectedPlan(plan); setShowContentPicker(false); setSelectedDrill(null); }}
                                                className="w-full text-left flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition"
                                            >
                                                <div className="w-10 h-10 rounded-lg bg-[#28D160]/10 flex items-center justify-center border border-[#28D160]/30 shrink-0">
                                                    <Layers size={16} className="text-[#28D160]" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <span className="text-xs font-bold text-white block truncate">{plan.title}</span>
                                                    <span className="text-[9px] font-black text-gray-500 uppercase">Training Plan</span>
                                                </div>
                                            </button>
                                        ))}
                                        {trainingPlans.length === 0 && <span className="text-[10px] text-gray-500 text-center block py-4">No plans found.</span>}
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {(selectedVideo || selectedDrill || selectedPlan) && (
                        <div className="mb-3 space-y-2">
                            {selectedVideo && (
                                <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Video size={16} className="text-[#28D160]" />
                                        <span className="text-xs font-medium text-gray-300 truncate max-w-[200px]">{selectedVideo.name}</span>
                                    </div>
                                    <button onClick={() => setSelectedVideo(null)} className="p-1 hover:bg-white/10 rounded-full transition text-gray-400 hover:text-red-400">
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                            {selectedDrill && (
                                <div className="p-3 bg-white/5 rounded-xl border border-[#28D160]/30 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Layers size={16} className="text-[#28D160]" />
                                        <span className="text-xs font-medium text-white truncate max-w-[200px]">{selectedDrill.title}</span>
                                    </div>
                                    <button onClick={() => setSelectedDrill(null)} className="p-1 hover:bg-white/10 rounded-full transition text-gray-400 hover:text-red-400">
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                            {selectedPlan && (
                                <div className="p-3 bg-white/5 rounded-xl border border-[#28D160]/30 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Layers size={16} className="text-[#28D160]" />
                                        <span className="text-xs font-medium text-white truncate max-w-[200px]">{selectedPlan.title}</span>
                                    </div>
                                    <button onClick={() => setSelectedPlan(null)} className="p-1 hover:bg-white/10 rounded-full transition text-gray-400 hover:text-red-400">
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="flex gap-2 items-center">
                        <button onClick={() => setShowContentPicker(!showContentPicker)} className={`p-3 md:p-4 rounded-xl md:rounded-2xl transition shrink-0 ${selectedDrill || selectedPlan ? 'bg-[#28D160]/20 text-[#28D160] border border-[#28D160]/30' : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'}`} title="Attach Content">
                            <Plus size={18} className="md:w-5 md:h-5" />
                        </button>
                        <button onClick={() => videoFileRef.current?.click()} className={`p-3 md:p-4 rounded-xl md:rounded-2xl transition shrink-0 ${selectedVideo ? 'bg-[#28D160]/20 text-[#28D160] border border-[#28D160]/30' : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'}`} title="Attach Video">
                            <Video size={18} className="md:w-5 md:h-5" />
                        </button>
                        <input type="file" accept="video/*" ref={videoFileRef} onChange={handleVideoSelect} className="hidden" />
                        <input
                            type="text"
                            value={messageInput}
                            onChange={e => setMessageInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Type a message..."
                            className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 outline-none focus:border-[#28D160]/50 transition text-sm"
                        />
                        <button disabled={isUploading || (!messageInput.trim() && !selectedVideo && !selectedDrill && !selectedPlan)} onClick={handleSendMessage} className="p-3 md:p-4 bg-[#28D160] text-black rounded-xl md:rounded-2xl shrink-0 hover:bg-white transition hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isUploading ? <span className="text-[10px] font-black uppercase">Wait</span> : <Send size={18} className="md:w-5 md:h-5" />}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-[#050505] text-white">
            <div className="p-6 border-b border-white/10">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-3xl font-black italic uppercase tracking-tighter">Messages</h2>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Private Coaching Threads</p>
                    </div>
                    {(currentUserProfile?.role === 'coach' || currentUserProfile?.role === 'sys-admin') && (
                        <button onClick={() => setShowCreateTeam(true)} className="p-3 bg-[#28D160]/10 text-[#28D160] rounded-xl hover:bg-[#28D160]/20 transition flex items-center gap-2 border border-[#28D160]/30">
                            <Plus size={16} /> <span className="text-[10px] font-black uppercase">New Team</span>
                        </button>
                    )}
                </div>

                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search teams, players, or parents..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[#28D160]/50 transition text-sm"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
                {filteredTeams.length > 0 && (
                    <div>
                        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-3 px-2">My Teams</h3>
                        <div className="space-y-2">
                            {filteredTeams.map(team => {
                                const latestMsg = lastMessages[team.id];
                                const isUnread = latestMsg && latestMsg.sender_id !== currentUserId && readReceipts[team.id] !== latestMsg.id.toString();
                                return (
                                    <button key={team.id} onClick={() => handleOpenChat(team.id, true)} className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-4 hover:border-white/20 transition group text-left relative">
                                        <div className="w-12 h-12 rounded-xl bg-[#28D160]/20 flex items-center justify-center border border-[#28D160]/30 group-hover:scale-110 transition-transform">
                                            <Users size={20} className="text-[#28D160]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-black italic uppercase truncate">{team.name}</h4>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase truncate">{latestMsg ? latestMsg.content || 'Attachment' : 'Team Chat'}</p>
                                        </div>
                                        {isUnread && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.6)]" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div>
                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-3 px-2">Direct Messages</h3>
                    <div className="space-y-2">
                        {filteredProfiles.map(p => {
                            const latestMsg = lastMessages[p.id];
                            const isUnread = latestMsg && latestMsg.sender_id !== currentUserId && readReceipts[p.id] !== latestMsg.id.toString();
                            return (
                                <button key={p.id} onClick={() => handleOpenChat(p.id, false)} className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-4 hover:border-white/20 transition group text-left relative">
                                    <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 group-hover:scale-110 transition-transform shrink-0">
                                        <img src={p.avatar_url || "https://placehold.co/100"} alt={p.first_name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-black italic uppercase truncate">{p.first_name} {p.last_name}</h4>
                                        <div className="flex items-center gap-2">
                                            <p className="text-[10px] text-[#28D160] font-bold uppercase shrink-0">{p.role}</p>
                                            {latestMsg && <p className="text-[10px] text-gray-500 font-bold uppercase truncate border-l border-white/10 pl-2 ml-2">{latestMsg.content || 'Attachment'}</p>}
                                        </div>
                                    </div>
                                    {isUnread && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.6)]" />}
                                </button>
                            );
                        })}
                        {filteredProfiles.length === 0 && filteredTeams.length === 0 && (
                            <div className="p-8 text-center border border-white/5 rounded-2xl bg-white/5 mt-4">
                                <Users className="mx-auto text-gray-500 mb-3" size={24} />
                                <p className="text-xs font-bold text-gray-400">No conversations found.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showCreateTeam && (
                <CreateTeamModal
                    coachId={currentUserId}
                    onClose={() => setShowCreateTeam(false)}
                    onSuccess={() => {
                        setShowCreateTeam(false);
                        fetchTeamsAndProfiles();
                    }}
                />
            )}
        </div>
    );
}
