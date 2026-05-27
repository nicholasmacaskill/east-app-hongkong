'use client';
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/app/lib/supabase';
import { Search, Users, MessageSquare, Plus, Video, Layers, Send, X, ChevronLeft } from 'lucide-react';
import { useToast } from '@/app/components/ui/Toast';

export default function PrivateMessenger({ currentUserId, chatWithUserId }: { currentUserId: string, chatWithUserId?: string | null }) {
    const { addToast } = useToast();
    const [view, setView] = useState<'list' | 'chat'>(chatWithUserId ? 'chat' : 'list');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Data states
    const [teams, setTeams] = useState<any[]>([]);
    const [profiles, setProfiles] = useState<any[]>([]);
    
    // Active chat state
    const [activeChatId, setActiveChatId] = useState<string | null>(null); // can be a user_id or a team_id
    const [isTeamChat, setIsTeamChat] = useState(false);
    const [messages, setMessages] = useState<any[]>([]);
    const [messageInput, setMessageInput] = useState('');
    
    // Attachments
    const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const videoFileRef = useRef<HTMLInputElement>(null);
    
    const [showDrillPicker, setShowDrillPicker] = useState(false);
    const [coachDrills, setCoachDrills] = useState<any[]>([]);

    useEffect(() => {
        fetchTeamsAndProfiles();
    }, [currentUserId]);

    const fetchTeamsAndProfiles = async () => {
        // Fetch Teams where coach is the creator OR is a member
        const { data: myTeams } = await supabase.from('teams').select('*').eq('coach_id', currentUserId);
        if (myTeams) setTeams(myTeams);

        // Fetch Profiles for 1-on-1 chats
        const { data: allProfiles } = await supabase.from('profiles').select('*').neq('id', currentUserId);
        if (allProfiles) {
            setProfiles(allProfiles);
            
            if (chatWithUserId) {
                // Check if the user exists
                const targetUser = allProfiles.find(p => p.id === chatWithUserId);
                if (targetUser) {
                    setActiveChatId(chatWithUserId);
                    setIsTeamChat(false);
                    fetchMessages(chatWithUserId, false);
                }
            }
        }
    };

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
        setActiveChatId(id);
        setIsTeamChat(isTeam);
        setView('chat');
        fetchMessages(id, isTeam);
    };

    const handleSendMessage = async () => {
        if ((!messageInput.trim() && !selectedVideo) || !activeChatId) return;
        
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
            ...(isTeamChat ? { team_id: activeChatId } : { receiver_id: activeChatId })
        };

        setMessageInput('');
        setSelectedVideo(null);
        const { error } = await supabase.from('messages').insert(newMsg);
        if (!error) {
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
    );

    const filteredTeams = teams.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));

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
                                        <div className="mt-2 p-3 bg-black/50 rounded-xl flex items-center gap-2 border border-white/5 cursor-pointer hover:border-[#28D160]/50 transition">
                                            <Layers size={16} className="text-[#28D160]" />
                                            <span className="text-[10px] font-black uppercase">Drill Attached</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="p-4 border-t border-white/10 bg-black/50">
                    {selectedVideo && (
                        <div className="mb-3 p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Video size={16} className="text-[#28D160]" />
                                <span className="text-xs font-medium text-gray-300 truncate max-w-[200px]">{selectedVideo.name}</span>
                            </div>
                            <button onClick={() => setSelectedVideo(null)} className="p-1 hover:bg-white/10 rounded-full transition text-gray-400 hover:text-red-400">
                                <X size={14} />
                            </button>
                        </div>
                    )}
                    <div className="flex gap-2">
                        <button className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition text-gray-400 hover:text-white">
                            <Layers size={20} />
                        </button>
                        <button onClick={() => videoFileRef.current?.click()} className={`p-4 rounded-2xl transition ${selectedVideo ? 'bg-[#28D160]/20 text-[#28D160] border border-[#28D160]/30' : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'}`}>
                            <Video size={20} />
                        </button>
                        <input type="file" accept="video/*" ref={videoFileRef} onChange={handleVideoSelect} className="hidden" />
                        <input 
                            type="text" 
                            value={messageInput}
                            onChange={e => setMessageInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Type a message..." 
                            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 outline-none focus:border-[#28D160]/50 transition"
                        />
                        <button disabled={isUploading || (!messageInput.trim() && !selectedVideo)} onClick={handleSendMessage} className="p-4 bg-[#28D160] text-black rounded-2xl hover:bg-white transition hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isUploading ? <span className="text-[10px] font-black uppercase">Wait</span> : <Send size={20} />}
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
                    <button className="p-3 bg-[#28D160]/10 text-[#28D160] rounded-xl hover:bg-[#28D160]/20 transition flex items-center gap-2 border border-[#28D160]/30">
                        <Plus size={16} /> <span className="text-[10px] font-black uppercase">New Team</span>
                    </button>
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
                            {filteredTeams.map(team => (
                                <button key={team.id} onClick={() => handleOpenChat(team.id, true)} className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-4 hover:border-white/20 transition group text-left">
                                    <div className="w-12 h-12 rounded-xl bg-[#28D160]/20 flex items-center justify-center border border-[#28D160]/30 group-hover:scale-110 transition-transform">
                                        <Users size={20} className="text-[#28D160]" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-black italic uppercase">{team.name}</h4>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase">Team Chat</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div>
                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-3 px-2">Direct Messages</h3>
                    <div className="space-y-2">
                        {filteredProfiles.map(p => (
                            <button key={p.id} onClick={() => handleOpenChat(p.id, false)} className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-4 hover:border-white/20 transition group text-left">
                                <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 group-hover:scale-110 transition-transform">
                                    <img src={p.avatar_url || "https://placehold.co/100"} alt={p.first_name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-black italic uppercase">{p.first_name} {p.last_name}</h4>
                                    <p className="text-[10px] text-[#28D160] font-bold uppercase">{p.role}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
