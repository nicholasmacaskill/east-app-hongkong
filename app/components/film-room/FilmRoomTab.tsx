'use client';

import React, { useState, useEffect } from 'react';
import { 
    Film, 
    Play, 
    Plus, 
    Search, 
    Users, 
    User, 
    Globe, 
    Trash2, 
    Edit2, 
    Share2, 
    Clock, 
    Loader2, 
    Sparkles, 
    ExternalLink 
} from 'lucide-react';
import { supabase } from '@/app/lib/supabase';
import { safeFetch } from '@/app/lib/apiUtils';
import { useToast } from '@/app/components/ui/Toast';
import { FilmRoomSession } from '@/app/types';
import { getYouTubeThumbnail, getYouTubeDirectUrl } from '@/app/lib/youtubeUtils';
import { formatHK } from '@/app/lib/dateUtils';
import CreateFilmSessionModal from './CreateFilmSessionModal';
import FilmRoomSessionViewModal from './FilmRoomSessionViewModal';

interface FilmRoomTabProps {
    currentUserId: string;
    onShareToChat?: (session: FilmRoomSession) => void;
}

export default function FilmRoomTab({ currentUserId, onShareToChat }: FilmRoomTabProps) {
    const { addToast } = useToast();
    const [sessions, setSessions] = useState<FilmRoomSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [targetFilter, setTargetFilter] = useState<'all' | 'team' | 'player'>('all');

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingSession, setEditingSession] = useState<FilmRoomSession | null>(null);
    const [viewingSession, setViewingSession] = useState<FilmRoomSession | null>(null);

    const fetchSessions = async () => {
        setLoading(true);
        try {
            const { data: { session: authSession } } = await supabase.auth.getSession();
            const token = authSession?.access_token;

            const res = await safeFetch('/api/film-room', {
                headers: {
                    Authorization: token ? `Bearer ${token}` : ''
                }
            });

            if (res.success) {
                setSessions(res.data || []);
            } else {
                console.error('Failed to fetch film sessions:', res.error);
            }
        } catch (err) {
            console.error('Error in fetchSessions:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, [currentUserId]);

    const handleDeleteSession = async (session: FilmRoomSession, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm(`Are you sure you want to delete "${session.title}"?`)) return;

        try {
            const { data: { session: authSession } } = await supabase.auth.getSession();
            const token = authSession?.access_token;

            const res = await safeFetch(`/api/film-room?id=${session.id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: token ? `Bearer ${token}` : ''
                }
            });

            if (res.success) {
                addToast('Film session deleted', 'success');
                setSessions((prev) => prev.filter((s) => s.id !== session.id));
                if (viewingSession?.id === session.id) {
                    setViewingSession(null);
                }
            } else {
                addToast(res.error || 'Failed to delete session', 'error');
            }
        } catch (err: any) {
            addToast(err.message || 'Error deleting session', 'error');
        }
    };

    const handleOpenEdit = (session: FilmRoomSession, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setEditingSession(session);
        setShowCreateModal(true);
    };

    const filteredSessions = sessions.filter((s) => {
        const matchesSearch = 
            s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.target_team?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            `${s.target_player?.first_name} ${s.target_player?.last_name}`.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesTarget = 
            targetFilter === 'all' || s.target_type === targetFilter;

        return matchesSearch && matchesTarget;
    });

    return (
        <div className="space-y-6 animate-fadeIn select-none">
            {/* TOP CONTROLS & HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-east-light/10 border border-east-light/30 flex items-center justify-center">
                            <Film size={22} className="text-east-light" />
                        </div>
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tighter text-white brightness-125">
                                Film Room
                            </h2>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-0.5">
                                Breakdown YouTube Game Film • Synchronize Coaching Notes • Present to Squad
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            setEditingSession(null);
                            setShowCreateModal(true);
                        }}
                        className="px-6 py-3 bg-east-light text-black rounded-2xl text-xs font-black uppercase italic hover:bg-white transition-all shadow-[0_0_20px_rgba(40,209,96,0.3)] active:scale-95 flex items-center gap-2"
                    >
                        <Plus size={16} /> New Film Session
                    </button>
                </div>
            </div>

            {/* SEARCH & FILTER BAR */}
            <div className="bg-[#141414] p-3 rounded-2xl border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                    <Search size={16} className="absolute left-3.5 top-3 text-gray-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search film sessions, teams, players..."
                        className="w-full bg-[#1e1e1e] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-east-light transition"
                    />
                </div>

                <div className="flex items-center gap-1.5 p-1 bg-[#1e1e1e] rounded-xl border border-white/5 w-full sm:w-auto">
                    <button
                        onClick={() => setTargetFilter('all')}
                        className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition ${
                            targetFilter === 'all' ? 'bg-east-light text-black shadow' : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setTargetFilter('team')}
                        className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition ${
                            targetFilter === 'team' ? 'bg-east-light text-black shadow' : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        Teams
                    </button>
                    <button
                        onClick={() => setTargetFilter('player')}
                        className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition ${
                            targetFilter === 'player' ? 'bg-east-light text-black shadow' : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        Individual
                    </button>
                </div>
            </div>

            {/* GRID OF SESSIONS */}
            {loading ? (
                <div className="py-24 flex flex-col items-center justify-center gap-3">
                    <Loader2 size={32} className="text-east-light animate-spin" />
                    <p className="text-xs font-black uppercase text-gray-500 tracking-widest">
                        Loading Film Sessions...
                    </p>
                </div>
            ) : filteredSessions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSessions.map((session) => {
                        const thumbUrl = getYouTubeThumbnail(session.video_id);
                        const markerCount = session.timestamps?.length || 0;

                        return (
                            <div
                                key={session.id}
                                onClick={() => setViewingSession(session)}
                                className="group bg-[#121212] hover:bg-[#161616] rounded-3xl overflow-hidden border border-white/10 hover:border-east-light/40 transition-all duration-300 shadow-xl flex flex-col cursor-pointer"
                            >
                                {/* THUMBNAIL COVER */}
                                <div className="relative aspect-video w-full bg-black overflow-hidden">
                                    {thumbUrl ? (
                                        <img
                                            src={thumbUrl}
                                            alt={session.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-black">
                                            <Film size={36} className="text-gray-700" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

                                    {/* PLAY BUTTON OVERLAY */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-12 h-12 rounded-full bg-east-light/90 text-black flex items-center justify-center shadow-[0_0_25px_rgba(40,209,96,0.6)] transform group-hover:scale-110 transition duration-300">
                                            <Play size={20} className="fill-current ml-0.5" />
                                        </div>
                                    </div>

                                    {/* TOP BADGES */}
                                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                                        {session.target_type === 'team' && session.target_team ? (
                                            <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-500/80 backdrop-blur-md text-white border border-blue-400/40 flex items-center gap-1 shadow-lg">
                                                <Users size={10} /> Team: {session.target_team.name}
                                            </span>
                                        ) : session.target_type === 'player' && session.target_player ? (
                                            <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-purple-500/80 backdrop-blur-md text-white border border-purple-400/40 flex items-center gap-1 shadow-lg">
                                                <User size={10} /> {session.target_player.first_name} {session.target_player.last_name}
                                            </span>
                                        ) : (
                                            <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-black/70 backdrop-blur-md text-east-light border border-east-light/30 flex items-center gap-1 shadow-lg">
                                                <Globe size={10} /> Squad General
                                            </span>
                                        )}

                                        <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-black/80 backdrop-blur-md text-white border border-white/10 flex items-center gap-1 shadow-lg font-mono">
                                            <Clock size={10} className="text-east-light" />
                                            {markerCount} {markerCount === 1 ? 'Marker' : 'Markers'}
                                        </span>
                                    </div>
                                </div>

                                {/* CARD DETAILS */}
                                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                                    <div>
                                        <h3 className="text-base font-black italic uppercase text-white tracking-tight group-hover:text-east-light transition line-clamp-1">
                                            {session.title}
                                        </h3>
                                        {session.description && (
                                            <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                                                {session.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* FOOTER ACTIONS */}
                                    <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                            {session.created_at ? formatHK(session.created_at, 'MMM d') : ''}
                                        </span>

                                        <div className="flex items-center gap-1">
                                            {onShareToChat && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onShareToChat(session);
                                                    }}
                                                    className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition"
                                                    title="Send in Messenger"
                                                >
                                                    <Share2 size={14} />
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => handleOpenEdit(session, e)}
                                                className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition"
                                                title="Edit Session"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => handleDeleteSession(session, e)}
                                                className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                                                title="Delete Session"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* EMPTY STATE */
                <div className="py-20 p-8 rounded-3xl border border-dashed border-white/10 bg-[#121212] text-center flex flex-col items-center justify-center gap-4">
                    <div className="w-16 h-16 rounded-3xl bg-east-light/10 border border-east-light/30 flex items-center justify-center">
                        <Film size={32} className="text-east-light" />
                    </div>
                    <div className="max-w-md space-y-1">
                        <h3 className="text-lg font-black uppercase text-white tracking-tight">
                            No Film Sessions Yet
                        </h3>
                        <p className="text-xs text-gray-400 leading-relaxed">
                            Stop using paper notebooks for video review. Paste any YouTube video link, add timestamp markers, attach coaching notes, and present or share directly with your squad.
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingSession(null);
                            setShowCreateModal(true);
                        }}
                        className="px-8 py-3 bg-east-light text-black rounded-2xl text-xs font-black uppercase italic hover:bg-white transition-all shadow-[0_0_25px_rgba(40,209,96,0.3)] active:scale-95 flex items-center gap-2 mt-2"
                    >
                        <Plus size={16} /> Create First Film Session
                    </button>
                </div>
            )}

            {/* CREATE / EDIT MODAL */}
            {showCreateModal && (
                <CreateFilmSessionModal
                    coachId={currentUserId}
                    existingSession={editingSession}
                    onClose={() => {
                        setShowCreateModal(false);
                        setEditingSession(null);
                    }}
                    onSuccess={(newOrUpdated) => {
                        fetchSessions();
                    }}
                />
            )}

            {/* INTERACTIVE PRESENTATION VIEW MODAL */}
            {viewingSession && (
                <FilmRoomSessionViewModal
                    session={viewingSession}
                    onClose={() => setViewingSession(null)}
                    onEdit={(s) => {
                        setViewingSession(null);
                        handleOpenEdit(s);
                    }}
                    canEdit={true}
                />
            )}
        </div>
    );
}
