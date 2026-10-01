import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/app/lib/supabase';
import { safeFetch } from '@/app/lib/apiUtils';
import { Search, Users, MessageSquare, Plus, Video, Layers, Send, X, ChevronLeft, ClipboardCheck, Film, Play, Clock, Edit2, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/app/components/ui/Toast';
import CreateTeamModal, { TeamToEdit } from '@/app/components/modals/CreateTeamModal';
import AssessmentViewModal from '@/app/components/modals/AssessmentViewModal';
import CreateAssessmentModal from '@/app/components/modals/CreateAssessmentModal';
import FilmRoomSessionViewModal from '@/app/components/film-room/FilmRoomSessionViewModal';
import { FilmRoomSession } from '@/app/types';
import { getYouTubeThumbnail } from '@/app/lib/youtubeUtils';

export default function PrivateMessenger({ 
    currentUserId, 
    chatWithUserId, 
    shareDrillId, 
    sharePlanId,
    shareFilmSessionId 
}: { 
    currentUserId: string, 
    chatWithUserId?: string | null, 
    shareDrillId?: string | null, 
    sharePlanId?: string | null,
    shareFilmSessionId?: string | null 
}) {
    const { addToast } = useToast();
    const [view, setView] = useState<'list' | 'chat'>(chatWithUserId ? 'chat' : 'list');
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateTeam, setShowCreateTeam] = useState(false);
    const [teamToEdit, setTeamToEdit] = useState<TeamToEdit | null>(null);

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
    const [pickerTab, setPickerTab] = useState<'drills' | 'plans' | 'film'>('drills');
    const [coachDrills, setCoachDrills] = useState<any[]>([]);
    const [selectedDrill, setSelectedDrill] = useState<any | null>(null);

    const [trainingPlans, setTrainingPlans] = useState<any[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<any | null>(null);

    // Film Room Attachments
    const [filmSessions, setFilmSessions] = useState<FilmRoomSession[]>([]);
    const [selectedFilmSession, setSelectedFilmSession] = useState<FilmRoomSession | null>(null);
    const [viewingFilmSession, setViewingFilmSession] = useState<FilmRoomSession | null>(null);
    const [openingFilmSessionId, setOpeningFilmSessionId] = useState<string | null>(null);

    const [viewingAssessmentId, setViewingAssessmentId] = useState<string | null>(null);
    const [showCreateAssessment, setShowCreateAssessment] = useState(false);

    const isCoachUser =
        currentUserProfile?.role === 'coach' ||
        currentUserProfile?.role === 'admin' ||
        currentUserProfile?.role === 'sys-admin';

    const activeChatProfile = !isTeamChat && activeChatId
        ? profiles.find((p) => p.id === activeChatId)
        : null;

    const canCreateAssessment =
        isCoachUser &&
        !isTeamChat &&
        activeChatProfile?.role === 'player';

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

        // Fetch Film Sessions
        const { data: films } = await supabase.from('film_room_sessions')
            .select(`
                *,
                coach:profiles!film_room_sessions_coach_id_fkey(first_name, last_name, avatar_url),
                target_team:teams(id, name),
                timestamps:film_room_timestamps(*)
            `)
            .order('created_at', { ascending: false });
        if (films) {
            setFilmSessions(films as FilmRoomSession[]);
            if (shareFilmSessionId) {
                const matchedFilm = (films as FilmRoomSession[]).find(f => f.id === shareFilmSessionId);
                if (matchedFilm) {
                    setSelectedFilmSession(matchedFilm);
                    // Automatically open the targeted chat if assigned
                    if (matchedFilm.target_type === 'team' && matchedFilm.target_team_id) {
                        setActiveChatId(matchedFilm.target_team_id);
                        setIsTeamChat(true);
                        setView('chat');
                        fetchMessages(matchedFilm.target_team_id, true);
                        addToast(`Film session ready in "${matchedFilm.target_team?.name || 'team'}" chat`, 'info');
                    } else if (matchedFilm.target_type === 'player' && matchedFilm.target_player_id) {
                        setActiveChatId(matchedFilm.target_player_id);
                        setIsTeamChat(false);
                        setView('chat');
                        fetchMessages(matchedFilm.target_player_id, false);
                        addToast(`Film session ready in athlete chat`, 'info');
                    } else {
                        setView('list');
                        addToast(`"${matchedFilm.title}" ready to share. Choose an athlete or team below.`, 'info');
                    }
                }
            }
        }
    };

    useEffect(() => {
        if (shareFilmSessionId && filmSessions.length > 0) {
            const matchedFilm = filmSessions.find(f => f.id === shareFilmSessionId);
            if (matchedFilm) {
                setSelectedFilmSession(matchedFilm);
                if (matchedFilm.target_type === 'team' && matchedFilm.target_team_id) {
                    setActiveChatId(matchedFilm.target_team_id);
                    setIsTeamChat(true);
                    setView('chat');
                    fetchMessages(matchedFilm.target_team_id, true);
                } else if (matchedFilm.target_type === 'player' && matchedFilm.target_player_id) {
                    setActiveChatId(matchedFilm.target_player_id);
                    setIsTeamChat(false);
                    setView('chat');
                    fetchMessages(matchedFilm.target_player_id, false);
                }
            }
        }
    }, [shareFilmSessionId, filmSessions]);

    const prefetchFilmSessions = async (ids: string[]) => {
        if (!ids || ids.length === 0) return;
        const missingIds = ids.filter(id => !filmSessions.some(f => f.id === id));
        if (missingIds.length === 0) return;

        try {
            const { data: loadedFilms } = await supabase
                .from('film_room_sessions')
                .select(`
                    *,
                    coach:profiles!film_room_sessions_coach_id_fkey(first_name, last_name, avatar_url),
                    target_team:teams(id, name),
                    timestamps:film_room_timestamps(*)
                `)
                .in('id', missingIds);
            if (loadedFilms && loadedFilms.length > 0) {
                setFilmSessions(prev => {
                    const map = new Map<string, FilmRoomSession>();
                    prev.forEach(f => map.set(f.id, f));
                    (loadedFilms as FilmRoomSession[]).forEach(f => map.set(f.id, f));
                    return Array.from(map.values());
                });
            }
        } catch (e) {
            console.warn('Prefetch film sessions error:', e);
        }
    };

    const handleOpenAttachedFilmSession = async (filmSessionId: string) => {
        setOpeningFilmSessionId(filmSessionId);
        try {
            let matched = filmSessions.find(f => f.id === filmSessionId);
            if (!matched) {
                // 1. Direct Client Query (Fastest, zero-hop)
                try {
                    const { data: directData } = await supabase
                        .from('film_room_sessions')
                        .select(`
                            *,
                            coach:profiles!film_room_sessions_coach_id_fkey(first_name, last_name, avatar_url),
                            target_team:teams(id, name),
                            timestamps:film_room_timestamps(*)
                        `)
                        .eq('id', filmSessionId)
                        .single();
                    if (directData) {
                        matched = directData as FilmRoomSession;
                    }
                } catch (err) {
                    console.warn('Direct fetch film session error:', err);
                }

                // 2. Fallback to API with Bearer token
                if (!matched) {
                    try {
                        const { data: { session: authSession } } = await supabase.auth.getSession();
                        const token = authSession?.access_token;
                        const res = await safeFetch(`/api/film-room?id=${filmSessionId}`, {
                            headers: { Authorization: token ? `Bearer ${token}` : '' }
                        });
                        if (res.success && res.data) {
                            matched = res.data as FilmRoomSession;
                        }
                    } catch (e) {
                        console.error('Error fetching film session via API:', e);
                    }
                }
            }

            if (matched) {
                setFilmSessions(prev => {
                    if (prev.some(f => f.id === matched!.id)) return prev;
                    return [matched!, ...prev];
                });
                setViewingFilmSession(matched);
            } else {
                addToast('Could not load film session', 'error');
            }
        } finally {
            setOpeningFilmSessionId(null);
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

            // Regular users (parents and players/athletes) can ONLY message coaches.
            // System administrators and regular users are excluded so only coaches appear.
            const isRegularUser = myProfile?.role === 'parent' || myProfile?.role === 'player';
            if (isRegularUser) {
                allowedProfiles = allProfiles.filter(p => p.role === 'coach');
            } else if (myProfile?.role !== 'sys-admin') {
                // Non-sysadmins do not see sys-admin in messaging list
                allowedProfiles = allProfiles.filter(p => p.role !== 'sys-admin');
            }

            setProfiles(allowedProfiles);

            if (chatWithUserId) {
                // Check if the target user exists AND is allowed
                const targetUser = allProfiles.find(p => p.id === chatWithUserId);
                if (targetUser) {
                    if (isRegularUser && targetUser.role !== 'coach') {
                        console.warn('❌ Regular users can only message coaches');
                        addToast('You can only message coaches', 'error');
                        setView('list');
                    } else {
                        setActiveChatId(chatWithUserId);
                        setIsTeamChat(false);
                        fetchMessages(chatWithUserId, false);
                    }
                } else {
                    setView('list');
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
                        if (msg.shared_film_session_id) {
                            prefetchFilmSessions([msg.shared_film_session_id]);
                        }
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
        let msgList: any[] = [];
        if (isTeam) {
            const { data } = await supabase.from('messages')
                .select('*')
                .eq('team_id', chatId)
                .order('created_at', { ascending: true });
            if (data) msgList = data;
        } else {
            const { data } = await supabase.from('messages')
                .select('*')
                .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${chatId}),and(sender_id.eq.${chatId},receiver_id.eq.${currentUserId})`)
                .order('created_at', { ascending: true });
            if (data) msgList = data;
        }
        setMessages(msgList);

        // Instantly prefetch attached film sessions for all messages in this chat
        const filmIds = msgList
            .map(m => m.shared_film_session_id)
            .filter((id): id is string => Boolean(id));
        if (filmIds.length > 0) {
            prefetchFilmSessions(filmIds);
        }
    };

    const handleOpenChat = (id: string, isTeam: boolean) => {
        // Prevent regular users (parents and players) from opening DMs with anyone other than coaches
        const isRegularUser = currentUserProfile?.role === 'parent' || currentUserProfile?.role === 'player';
        if (!isTeam && isRegularUser) {
            const targetProfile = profiles.find(p => p.id === id);
            if (targetProfile && targetProfile.role !== 'coach') {
                console.warn('❌ Blocked: Regular users can only message coaches');
                addToast('You can only message coaches', 'error');
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
        if ((!messageInput.trim() && !selectedVideo && !selectedDrill && !selectedPlan && !selectedFilmSession) || !activeChatId) return;

        // Prevent regular users (parents and players) from sending DMs to anyone other than coaches
        const isRegularUser = currentUserProfile?.role === 'parent' || currentUserProfile?.role === 'player';
        if (!isTeamChat && isRegularUser) {
            const targetProfile = profiles.find(p => p.id === activeChatId);
            if (targetProfile && targetProfile.role !== 'coach') {
                console.warn('❌ Blocked: Regular users can only message coaches');
                addToast('You can only message coaches', 'error');
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
            shared_film_session_id: selectedFilmSession ? selectedFilmSession.id : null,
            ...(isTeamChat ? { team_id: activeChatId } : { receiver_id: activeChatId })
        };

        setMessageInput('');
        setSelectedVideo(null);
        setSelectedDrill(null);
        setSelectedPlan(null);
        setSelectedFilmSession(null);
        const { error } = await supabase.from('messages').insert(newMsg);
        if (error) {
            console.error("Message Insert Error:", error);
            alert("Failed to send message: " + error.message);
        } else {
            fetchMessages(activeChatId, isTeamChat);
        }
        setIsUploading(false);
    };

    const handleDeleteTeam = async (teamId: string, teamName: string) => {
        if (!window.confirm(`Are you sure you want to delete team "${teamName}"? This will permanently delete the team, its members, and its messages.`)) {
            return;
        }

        try {
            const { error } = await supabase.from('teams').delete().eq('id', teamId);
            if (error) throw error;

            addToast(`Team "${teamName}" deleted`, 'success');
            if (activeChatId === teamId) {
                setActiveChatId(null);
                setIsTeamChat(false);
                setView('list');
            }
            fetchTeamsAndProfiles();
        } catch (err: any) {
            console.error('Error deleting team:', err);
            addToast(err.message || 'Failed to delete team', 'error');
        }
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
                    {isTeamChat && isCoachUser && (
                        <div className="flex items-center gap-2">
                            {(() => {
                                const currentTeam = teams.find(t => t.id === activeChatId);
                                if (!currentTeam) return null;
                                return (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setTeamToEdit(currentTeam);
                                                setShowCreateTeam(true);
                                            }}
                                            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition flex items-center gap-1.5 text-xs font-bold border border-white/5"
                                            title="Edit Team"
                                        >
                                            <Edit2 size={13} />
                                            <span className="text-[10px] uppercase font-black">Edit</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteTeam(currentTeam.id, currentTeam.name)}
                                            className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition flex items-center gap-1.5 text-xs font-bold border border-red-500/20"
                                            title="Delete Team"
                                        >
                                            <Trash2 size={13} />
                                            <span className="text-[10px] uppercase font-black">Delete</span>
                                        </button>
                                    </>
                                );
                            })()}
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                    {messages.map(msg => {
                        const isMe = msg.sender_id === currentUserId;
                        const senderProfile = profiles.find(p => p.id === msg.sender_id);
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-2xl p-4 ${isMe ? 'bg-east-light/20 border border-east-light/30 rounded-tr-none' : 'bg-white/5 border border-white/10 rounded-tl-none'}`}>
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
                                        <div onClick={() => window.open(`/drill-hub?drill_id=${msg.shared_drill_id}`, '_blank')} className="mt-2 p-3 bg-black/50 rounded-xl flex items-center gap-3 border border-east-light/30 cursor-pointer hover:bg-east-light/10 transition group">
                                            <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center border border-white/10 group-hover:border-east-light/50 transition overflow-hidden shrink-0">
                                                {coachDrills.find(d => d.id === msg.shared_drill_id)?.thumbnail_url ? (
                                                    <img src={coachDrills.find(d => d.id === msg.shared_drill_id)?.thumbnail_url} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Layers size={20} className="text-east-light" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="text-[10px] font-black uppercase text-east-light block leading-none mb-1">Attached Drill</span>
                                                <span className="text-xs font-bold text-white block truncate">
                                                    {coachDrills.find(d => d.id === msg.shared_drill_id)?.title || 'View Drill'}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    {msg.shared_plan_id && (
                                        <div onClick={() => window.open(`/drill-hub?plan_id=${msg.shared_plan_id}`, '_blank')} className="mt-2 p-3 bg-black/50 rounded-xl flex items-center gap-3 border border-east-light/30 cursor-pointer hover:bg-east-light/10 transition group">
                                            <div className="w-10 h-10 rounded-lg bg-east-light/20 flex items-center justify-center border border-east-light/30 group-hover:scale-110 transition shrink-0">
                                                <Layers size={20} className="text-east-light" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="text-[10px] font-black uppercase text-east-light block leading-none mb-1">Training Plan</span>
                                                <span className="text-xs font-bold text-white block truncate">
                                                    {trainingPlans.find(p => p.id === msg.shared_plan_id)?.title || 'View Training Plan'}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    {msg.shared_assessment_id && (
                                        <div
                                            onClick={() => setViewingAssessmentId(msg.shared_assessment_id)}
                                            className="mt-2 p-3 bg-black/50 rounded-xl flex items-center gap-3 border border-east-light/30 cursor-pointer hover:bg-east-light/10 transition group"
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-east-light/20 flex items-center justify-center border border-east-light/30 group-hover:scale-110 transition shrink-0">
                                                <ClipboardCheck size={20} className="text-east-light" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="text-[10px] font-black uppercase text-east-light block leading-none mb-1">Private Assessment</span>
                                                <span className="text-xs font-bold text-white block truncate">
                                                    {msg.content?.replace('New video assessment: ', '') || 'View Assessment'}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    {msg.shared_film_session_id && (() => {
                                        const matchedSession = filmSessions.find(f => f.id === msg.shared_film_session_id);
                                        const isOpening = openingFilmSessionId === msg.shared_film_session_id;
                                        const thumbnail = matchedSession?.video_id 
                                            ? getYouTubeThumbnail(matchedSession.video_id)
                                            : null;

                                        return (
                                            <button
                                                type="button"
                                                disabled={isOpening}
                                                onClick={() => handleOpenAttachedFilmSession(msg.shared_film_session_id)}
                                                className={`w-full text-left mt-2 p-3 bg-black/70 rounded-2xl flex items-center gap-3 border transition group shadow-lg ${
                                                    isOpening
                                                        ? 'border-east-light bg-east-light/10 ring-2 ring-east-light/30'
                                                        : 'border-east-light/40 hover:bg-east-light/10 hover:border-east-light'
                                                }`}
                                            >
                                                <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center border border-white/10 group-hover:border-east-light/50 transition overflow-hidden shrink-0 relative">
                                                    {thumbnail ? (
                                                        <img
                                                            src={thumbnail}
                                                            alt="Film Room Thumbnail"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <Film size={20} className="text-east-light" />
                                                    )}
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                        {isOpening ? (
                                                            <Loader2 size={16} className="text-east-light animate-spin" />
                                                        ) : (
                                                            <Play size={14} className="text-white fill-current ml-0.5 group-hover:scale-110 transition" />
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <span className="text-[10px] font-black uppercase text-east-light block leading-none mb-1 flex items-center gap-1">
                                                        <Film size={10} /> Film Room Session
                                                        {matchedSession?.timestamps?.length ? (
                                                            <span className="ml-1 text-[9px] text-gray-400 font-bold lowercase">
                                                                ({matchedSession.timestamps.length} cues)
                                                            </span>
                                                        ) : null}
                                                    </span>
                                                    <span className="text-xs font-bold text-white block truncate">
                                                        {matchedSession?.title || 'Film Room Breakdown'}
                                                    </span>
                                                    <span className="text-[9px] text-gray-400 block mt-0.5 flex items-center gap-1">
                                                        {isOpening ? (
                                                            <span className="text-east-light font-bold">Opening breakdown theater...</span>
                                                        ) : (
                                                            'Tap to watch with timestamped coaching notes'
                                                        )}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })()}
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
                                    <button onClick={() => setPickerTab('drills')} className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg transition ${pickerTab === 'drills' ? 'bg-east-light/20 text-east-light' : 'text-gray-500 hover:text-white'}`}>Drills</button>
                                    <button onClick={() => setPickerTab('plans')} className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg transition ${pickerTab === 'plans' ? 'bg-east-light/20 text-east-light' : 'text-gray-500 hover:text-white'}`}>Plans</button>
                                    <button onClick={() => setPickerTab('film')} className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg transition ${pickerTab === 'film' ? 'bg-east-light/20 text-east-light' : 'text-gray-500 hover:text-white'}`}>Film Room</button>
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
                                                    <span className="text-[9px] font-black text-east-light uppercase">{drill.category}</span>
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
                                                onClick={() => { setSelectedPlan(plan); setShowContentPicker(false); setSelectedDrill(null); setSelectedFilmSession(null); }}
                                                className="w-full text-left flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition"
                                            >
                                                <div className="w-10 h-10 rounded-lg bg-east-light/10 flex items-center justify-center border border-east-light/30 shrink-0">
                                                    <Layers size={16} className="text-east-light" />
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
                                {pickerTab === 'film' && (
                                    <>
                                        {filmSessions.map(film => (
                                            <button
                                                key={film.id}
                                                onClick={() => { setSelectedFilmSession(film); setShowContentPicker(false); setSelectedDrill(null); setSelectedPlan(null); }}
                                                className="w-full text-left flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition"
                                            >
                                                <div className="w-10 h-10 rounded-lg bg-black overflow-hidden flex items-center justify-center border border-white/10 shrink-0">
                                                    {film.video_id ? (
                                                        <img src={`https://img.youtube.com/vi/${film.video_id}/hqdefault.jpg`} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Film size={16} className="text-east-light" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <span className="text-xs font-bold text-white block truncate">{film.title}</span>
                                                    <span className="text-[9px] font-black text-east-light uppercase">
                                                        {film.timestamps?.length || 0} Markers
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                        {filmSessions.length === 0 && <span className="text-[10px] text-gray-500 text-center block py-4">No film sessions found.</span>}
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {(selectedVideo || selectedDrill || selectedPlan || selectedFilmSession) && (
                        <div className="mb-3 space-y-2">
                            {selectedVideo && (
                                <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Video size={16} className="text-east-light" />
                                        <span className="text-xs font-medium text-gray-300 truncate max-w-[200px]">{selectedVideo.name}</span>
                                    </div>
                                    <button onClick={() => setSelectedVideo(null)} className="p-1 hover:bg-white/10 rounded-full transition text-gray-400 hover:text-red-400">
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                            {selectedDrill && (
                                <div className="p-3 bg-white/5 rounded-xl border border-east-light/30 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Layers size={16} className="text-east-light" />
                                        <span className="text-xs font-medium text-white truncate max-w-[200px]">{selectedDrill.title}</span>
                                    </div>
                                    <button onClick={() => setSelectedDrill(null)} className="p-1 hover:bg-white/10 rounded-full transition text-gray-400 hover:text-red-400">
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                            {selectedPlan && (
                                <div className="p-3 bg-white/5 rounded-xl border border-east-light/30 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Layers size={16} className="text-east-light" />
                                        <span className="text-xs font-medium text-white truncate max-w-[200px]">{selectedPlan.title}</span>
                                    </div>
                                    <button onClick={() => setSelectedPlan(null)} className="p-1 hover:bg-white/10 rounded-full transition text-gray-400 hover:text-red-400">
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                            {selectedFilmSession && (
                                <div className="p-3 bg-white/5 rounded-xl border border-east-light/30 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Film size={16} className="text-east-light" />
                                        <span className="text-xs font-medium text-white truncate max-w-[200px]">{selectedFilmSession.title}</span>
                                    </div>
                                    <button onClick={() => setSelectedFilmSession(null)} className="p-1 hover:bg-white/10 rounded-full transition text-gray-400 hover:text-red-400">
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="flex gap-2 items-center">
                        <button onClick={() => setShowContentPicker(!showContentPicker)} className={`p-3 md:p-4 rounded-xl md:rounded-2xl transition shrink-0 ${selectedDrill || selectedPlan || selectedFilmSession ? 'bg-east-light/20 text-east-light border border-east-light/30' : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'}`} title="Attach Content">
                            <Plus size={18} className="md:w-5 md:h-5" />
                        </button>
                        {canCreateAssessment && (
                            <button
                                onClick={() => setShowCreateAssessment(true)}
                                className="p-3 md:p-4 rounded-xl md:rounded-2xl transition shrink-0 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-east-light border border-white/10 hover:border-east-light/30"
                                title="Send private assessment"
                            >
                                <ClipboardCheck size={18} className="md:w-5 md:h-5" />
                            </button>
                        )}
                        <button onClick={() => videoFileRef.current?.click()} className={`p-3 md:p-4 rounded-xl md:rounded-2xl transition shrink-0 ${selectedVideo ? 'bg-east-light/20 text-east-light border border-east-light/30' : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'}`} title="Attach Video">
                            <Video size={18} className="md:w-5 md:h-5" />
                        </button>
                        <input type="file" accept="video/*" ref={videoFileRef} onChange={handleVideoSelect} className="hidden" />
                        <input
                            type="text"
                            value={messageInput}
                            onChange={e => setMessageInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Type a message..."
                            className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 outline-none focus:border-east-light/50 transition text-sm"
                        />
                        <button disabled={isUploading || (!messageInput.trim() && !selectedVideo && !selectedDrill && !selectedPlan && !selectedFilmSession)} onClick={handleSendMessage} className="p-3 md:p-4 bg-east-light text-black rounded-xl md:rounded-2xl shrink-0 hover:bg-white transition hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isUploading ? <span className="text-[10px] font-black uppercase">Wait</span> : <Send size={18} className="md:w-5 md:h-5" />}
                        </button>
                    </div>
                </div>

                {viewingAssessmentId && (
                    <AssessmentViewModal
                        assessmentId={viewingAssessmentId}
                        isCoach={isCoachUser}
                        onClose={() => setViewingAssessmentId(null)}
                    />
                )}

                {showCreateAssessment && activeChatProfile && (
                    <CreateAssessmentModal
                        coachId={currentUserId}
                        playerId={activeChatProfile.id}
                        playerName={`${activeChatProfile.first_name || ''} ${activeChatProfile.last_name || ''}`.trim() || 'Player'}
                        onClose={() => setShowCreateAssessment(false)}
                        onSuccess={() => {
                            setShowCreateAssessment(false);
                            if (activeChatId) fetchMessages(activeChatId, false);
                        }}
                    />
                )}
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
                        <button onClick={() => setShowCreateTeam(true)} className="p-3 bg-east-light/10 text-east-light rounded-xl hover:bg-east-light/20 transition flex items-center gap-2 border border-east-light/30">
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
                        placeholder={currentUserProfile?.role === 'coach' || currentUserProfile?.role === 'sys-admin' || currentUserProfile?.role === 'admin' ? "Search teams, players, or parents..." : "Search teams or coaches..."}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-east-light/50 transition text-sm"
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
                                const canManageThisTeam = isCoachUser && (team.coach_id === currentUserId || currentUserProfile?.role === 'sys-admin' || currentUserProfile?.role === 'admin' || currentUserProfile?.role === 'coach');

                                return (
                                    <div key={team.id} className="group relative w-full p-4 bg-white/5 border border-white/5 hover:border-white/20 rounded-2xl flex items-center justify-between gap-4 transition">
                                        <button onClick={() => handleOpenChat(team.id, true)} className="flex-1 flex items-center gap-4 text-left min-w-0">
                                            <div className="w-12 h-12 rounded-xl bg-east-light/20 flex items-center justify-center border border-east-light/30 group-hover:scale-105 transition-transform shrink-0">
                                                <Users size={20} className="text-east-light" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-black italic uppercase truncate text-white">{team.name}</h4>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase truncate">{latestMsg ? latestMsg.content || 'Attachment' : 'Team Chat'}</p>
                                            </div>
                                        </button>
                                        
                                        <div className="flex items-center gap-1 shrink-0">
                                            {canManageThisTeam && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setTeamToEdit(team);
                                                            setShowCreateTeam(true);
                                                        }}
                                                        className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition"
                                                        title="Edit Team"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteTeam(team.id, team.name);
                                                        }}
                                                        className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition"
                                                        title="Delete Team"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </>
                                            )}
                                            {isUnread && <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.6)] ml-1" />}
                                        </div>
                                    </div>
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
                                            <p className="text-[10px] text-east-light font-bold uppercase shrink-0">{p.role}</p>
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
                    teamToEdit={teamToEdit}
                    onClose={() => {
                        setShowCreateTeam(false);
                        setTeamToEdit(null);
                    }}
                    onSuccess={() => {
                        setShowCreateTeam(false);
                        setTeamToEdit(null);
                        fetchTeamsAndProfiles();
                    }}
                />
            )}

            {viewingAssessmentId && (
                <AssessmentViewModal
                    assessmentId={viewingAssessmentId}
                    isCoach={isCoachUser}
                    onClose={() => setViewingAssessmentId(null)}
                />
            )}

            {viewingFilmSession && (
                <FilmRoomSessionViewModal
                    session={viewingFilmSession}
                    onClose={() => setViewingFilmSession(null)}
                />
            )}
        </div>
    );
}
