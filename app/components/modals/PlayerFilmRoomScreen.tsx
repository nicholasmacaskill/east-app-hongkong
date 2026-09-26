'use client';

import React, { useEffect, useState } from 'react';
import { Film, Loader2, Play, Clock, ChevronRight, Users, User, Globe } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';
import { safeFetch } from '@/app/lib/apiUtils';
import { formatHK } from '@/app/lib/dateUtils';
import { FilmRoomSession } from '@/app/types';
import { getYouTubeThumbnail } from '@/app/lib/youtubeUtils';
import FilmRoomSessionViewModal from '@/app/components/film-room/FilmRoomSessionViewModal';

function SettingsHeader({ title, onBack }: { title: string; onBack: () => void }) {
    return (
        <div className="flex items-center justify-between mb-6 shrink-0">
            <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors p-2 -ml-2">
                <ChevronRight size={24} className="rotate-180" />
            </button>
            <h2 className="font-montserrat font-bold text-xl tracking-tight">{title}</h2>
            <div className="w-8" />
        </div>
    );
}

export default function PlayerFilmRoomScreen({ onBack }: { onBack: () => void }) {
    const [sessions, setSessions] = useState<FilmRoomSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewingSession, setViewingSession] = useState<FilmRoomSession | null>(null);

    useEffect(() => {
        const fetchSessions = async () => {
            setLoading(true);
            setError(null);

            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const res = await safeFetch('/api/film-room', {
                headers: { Authorization: token ? `Bearer ${token}` : '' }
            });

            if (!res.success) {
                setError(res.error || 'Failed to load film sessions');
                setLoading(false);
                return;
            }

            setSessions(res.data || []);
            setLoading(false);
        };

        fetchSessions();
    }, []);

    return (
        <div className="flex flex-col h-full select-none">
            <SettingsHeader title="Film Room" onBack={onBack} />

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pb-8">
                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="animate-spin text-east-light" size={28} />
                        <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">
                            Loading Film Sessions...
                        </p>
                    </div>
                ) : error ? (
                    <div className="py-16 text-center">
                        <p className="text-sm text-red-400">{error}</p>
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="py-16 text-center border border-white/5 rounded-2xl bg-white/[0.02] p-8">
                        <Film className="mx-auto text-gray-600 mb-3" size={36} />
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">
                            No Film Sessions Assigned
                        </p>
                        <p className="text-xs text-gray-600 max-w-xs mx-auto">
                            When your coach breaks down game film and assigns it to you or your team, it will appear here.
                        </p>
                    </div>
                ) : (
                    sessions.map((session) => {
                        const thumb = getYouTubeThumbnail(session.video_id);
                        const markerCount = session.timestamps?.length || 0;

                        return (
                            <button
                                key={session.id}
                                onClick={() => setViewingSession(session)}
                                className="w-full text-left p-3.5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 hover:border-east-light/40 transition group flex flex-col sm:flex-row gap-3 items-start sm:items-center"
                            >
                                <div className="relative w-full sm:w-28 aspect-video rounded-xl bg-black overflow-hidden shrink-0">
                                    {thumb ? (
                                        <img src={thumb} alt={session.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Film size={20} className="text-gray-600" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                        <div className="w-7 h-7 rounded-full bg-east-light/90 text-black flex items-center justify-center shadow">
                                            <Play size={12} className="fill-current ml-0.5" />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                        {session.target_type === 'team' && session.target_team ? (
                                            <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                                Team: {session.target_team.name}
                                            </span>
                                        ) : session.target_type === 'player' ? (
                                            <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                                Private Review
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-east-light/20 text-east-light border border-east-light/30">
                                                Squad
                                            </span>
                                        )}
                                        <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-white/10 text-gray-300 font-mono">
                                            {markerCount} {markerCount === 1 ? 'Marker' : 'Markers'}
                                        </span>
                                    </div>

                                    <h4 className="font-bold text-sm text-white group-hover:text-east-light transition truncate">
                                        {session.title}
                                    </h4>

                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">
                                        Coach {session.coach?.first_name || 'Staff'} • {session.created_at ? formatHK(session.created_at, 'MMM d') : ''}
                                    </p>
                                </div>

                                <ChevronRight size={18} className="text-gray-600 group-hover:text-east-light transition shrink-0 hidden sm:block" />
                            </button>
                        );
                    })
                )}
            </div>

            {viewingSession && (
                <FilmRoomSessionViewModal
                    session={viewingSession}
                    onClose={() => setViewingSession(null)}
                    canEdit={false}
                />
            )}
        </div>
    );
}
