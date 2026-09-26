'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
    X, 
    ExternalLink, 
    Clock, 
    Play, 
    Users, 
    User, 
    Globe, 
    ChevronLeft, 
    ChevronRight, 
    Film, 
    Volume2,
    Sparkles,
    Share2
} from 'lucide-react';
import { FilmRoomSession, FilmRoomTimestamp } from '@/app/types';
import YouTubePlayer, { YouTubePlayerRef } from './YouTubePlayer';
import { getYouTubeDirectUrl } from '@/app/lib/youtubeUtils';
import { formatHK } from '@/app/lib/dateUtils';
import { useToast } from '@/app/components/ui/Toast';

interface FilmRoomSessionViewModalProps {
    session: FilmRoomSession;
    onClose: () => void;
    onEdit?: (session: FilmRoomSession) => void;
    canEdit?: boolean;
}

export default function FilmRoomSessionViewModal({
    session,
    onClose,
    onEdit,
    canEdit = false
}: FilmRoomSessionViewModalProps) {
    const { addToast } = useToast();
    const playerRef = useRef<YouTubePlayerRef>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [activeTimestampIndex, setActiveTimestampIndex] = useState<number>(0);
    const [timestamps, setTimestamps] = useState<FilmRoomTimestamp[]>(session.timestamps || []);
    const timelineListRef = useRef<HTMLDivElement>(null);

    // Sync sorted timestamps
    useEffect(() => {
        if (session.timestamps) {
            const sorted = [...session.timestamps].sort((a, b) => {
                if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
                return a.timestamp_seconds - b.timestamp_seconds;
            });
            setTimestamps(sorted);
        }
    }, [session.timestamps]);

    // Handle seeking to a specific timestamp
    const handleSeekToTimestamp = (index: number) => {
        const target = timestamps[index];
        if (!target) return;

        setActiveTimestampIndex(index);
        if (playerRef.current) {
            playerRef.current.seekTo(target.timestamp_seconds);
        }
    };

    // Auto-highlight active timestamp as video plays
    const handleTimeUpdate = (seconds: number) => {
        setCurrentTime(seconds);
        if (!timestamps || timestamps.length === 0) return;

        // Find the most recent timestamp that has been passed
        let currentIdx = 0;
        for (let i = 0; i < timestamps.length; i++) {
            if (seconds >= timestamps[i].timestamp_seconds) {
                currentIdx = i;
            } else {
                break;
            }
        }

        if (currentIdx !== activeTimestampIndex) {
            setActiveTimestampIndex(currentIdx);
        }
    };

    const handleNextMarker = () => {
        if (activeTimestampIndex < timestamps.length - 1) {
            handleSeekToTimestamp(activeTimestampIndex + 1);
        }
    };

    const handlePrevMarker = () => {
        if (activeTimestampIndex > 0) {
            handleSeekToTimestamp(activeTimestampIndex - 1);
        }
    };

    const handleShare = () => {
        const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
        if (navigator.clipboard) {
            navigator.clipboard.writeText(session.youtube_url);
            addToast('YouTube video link copied to clipboard!', 'success');
        }
    };

    const activeTimestamp = timestamps[activeTimestampIndex];

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/95 backdrop-blur-xl animate-fadeIn select-none">
            <div className="w-full max-w-6xl h-full max-h-[95vh] bg-[#0d0d0d] rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.9)] flex flex-col">
                {/* TOP HEADER */}
                <div className="bg-[#141414] px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 flex items-center justify-between gap-4 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-east-light/10 border border-east-light/30 flex items-center justify-center shrink-0">
                            <Film size={20} className="text-east-light" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-base sm:text-xl font-black italic uppercase text-white truncate tracking-tight">
                                    {session.title}
                                </h2>
                                {/* TARGET BADGE */}
                                {session.target_type === 'team' && session.target_team ? (
                                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                                        <Users size={10} /> Team: {session.target_team.name}
                                    </span>
                                ) : session.target_type === 'player' && session.target_player ? (
                                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                                        <User size={10} /> Athlete: {session.target_player.first_name} {session.target_player.last_name}
                                    </span>
                                ) : (
                                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-east-light/20 text-east-light border border-east-light/30 flex items-center gap-1">
                                        <Globe size={10} /> Squad General
                                    </span>
                                )}
                            </div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5 flex items-center gap-2">
                                <span>Coach {session.coach?.first_name || 'Staff'} {session.coach?.last_name || ''}</span>
                                <span>•</span>
                                <span>{session.created_at ? formatHK(session.created_at, 'MMM d, yyyy') : 'Film Session'}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {canEdit && onEdit && (
                            <button
                                onClick={() => onEdit(session)}
                                className="hidden sm:flex px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-[10px] font-black uppercase tracking-wider border border-white/10 transition"
                            >
                                Edit Session
                            </button>
                        )}
                        <a
                            href={getYouTubeDirectUrl(session.video_id, activeTimestamp?.timestamp_seconds)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 text-[10px] font-black uppercase tracking-wider border border-red-500/30 transition shadow-sm"
                            title="Open in YouTube App"
                        >
                            <ExternalLink size={12} /> Watch in YouTube
                        </a>
                        <button
                            onClick={handleShare}
                            className="p-2 sm:p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition"
                            title="Copy Link"
                        >
                            <Share2 size={16} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition hover:scale-105"
                            title="Close"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* MAIN CONTENT AREA */}
                <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 p-3 sm:p-6 no-scrollbar">
                    {/* LEFT / TOP: VIDEO PLAYER & PLAYBACK CONTROLS */}
                    <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
                        <YouTubePlayer
                            ref={playerRef}
                            videoId={session.video_id}
                            initialStartSeconds={activeTimestamp?.timestamp_seconds || 0}
                            onTimeUpdate={handleTimeUpdate}
                            autoPlay={true}
                        />

                        {/* PLAYBACK & MARKER STEPPERS */}
                        <div className="bg-[#141414] p-3 sm:p-4 rounded-2xl border border-white/10 flex items-center justify-between gap-3 shadow-lg">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handlePrevMarker}
                                    disabled={activeTimestampIndex <= 0}
                                    className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition ${
                                        activeTimestampIndex > 0
                                            ? 'bg-white/10 hover:bg-white/20 text-white active:scale-95'
                                            : 'bg-white/5 text-gray-600 cursor-not-allowed'
                                    }`}
                                >
                                    <ChevronLeft size={14} /> Prev Marker
                                </button>
                                <button
                                    onClick={handleNextMarker}
                                    disabled={activeTimestampIndex >= timestamps.length - 1}
                                    className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition ${
                                        activeTimestampIndex < timestamps.length - 1
                                            ? 'bg-east-light text-black hover:bg-white active:scale-95 shadow-[0_0_15px_var(--brand-glow)]'
                                            : 'bg-white/5 text-gray-600 cursor-not-allowed'
                                    }`}
                                >
                                    Next Marker <ChevronRight size={14} />
                                </button>
                            </div>

                            <div className="flex items-center gap-3">
                                {activeTimestamp && (
                                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-east-light/10 border border-east-light/30">
                                        <Clock size={12} className="text-east-light" />
                                        <span className="text-xs font-black text-east-light font-mono">
                                            {activeTimestamp.timestamp_label}
                                        </span>
                                    </div>
                                )}
                                <a
                                    href={getYouTubeDirectUrl(session.video_id, activeTimestamp?.timestamp_seconds)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 sm:hidden rounded-xl bg-red-600/20 text-red-400 border border-red-500/30"
                                    title="Open on YouTube"
                                >
                                    <ExternalLink size={16} />
                                </a>
                            </div>
                        </div>

                        {/* SESSION DESCRIPTION / FOCUS */}
                        {session.description && (
                            <div className="bg-[#141414] p-4 rounded-2xl border border-white/5">
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">
                                    Film Review Objective
                                </span>
                                <p className="text-xs text-gray-300 leading-relaxed font-medium">
                                    {session.description}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* RIGHT / BOTTOM: TIMESTAMPS & COACHING CUES TIMELINE */}
                    <div className="lg:col-span-5 xl:col-span-4 flex flex-col h-full min-h-[300px]">
                        <div className="bg-[#141414] p-4 rounded-t-2xl border border-white/10 border-b-0 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <Sparkles size={16} className="text-east-light" />
                                <h3 className="text-xs font-black uppercase text-white tracking-widest">
                                    Coaching Notes
                                </h3>
                            </div>
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-white/10 text-gray-300">
                                {timestamps.length} {timestamps.length === 1 ? 'Marker' : 'Markers'}
                            </span>
                        </div>

                        <div 
                            ref={timelineListRef}
                            className="bg-[#121212] p-3 sm:p-4 rounded-b-2xl border border-white/10 flex-1 overflow-y-auto space-y-3 no-scrollbar max-h-[550px]"
                        >
                            {timestamps.map((ts, idx) => {
                                const isActive = idx === activeTimestampIndex;
                                return (
                                    <div
                                        key={ts.id || idx}
                                        onClick={() => handleSeekToTimestamp(idx)}
                                        className={`group relative p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                                            isActive
                                                ? 'bg-east-light/10 border-east-light shadow-[0_0_20px_var(--brand-glow)]'
                                                : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/5 hover:border-white/15'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3 mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSeekToTimestamp(idx);
                                                    }}
                                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black font-mono tracking-wider transition ${
                                                        isActive
                                                            ? 'bg-east-light text-black shadow-md'
                                                            : 'bg-white/10 text-gray-300 group-hover:bg-white/20 group-hover:text-white'
                                                    }`}
                                                >
                                                    {ts.timestamp_label}
                                                </button>
                                                <h4 className={`text-xs font-bold leading-snug truncate ${
                                                    isActive ? 'text-white' : 'text-gray-200 group-hover:text-white'
                                                }`}>
                                                    {ts.title}
                                                </h4>
                                            </div>

                                            {isActive ? (
                                                <div className="flex items-center gap-1 text-east-light text-[9px] font-black uppercase tracking-widest shrink-0 animate-pulse">
                                                    <Volume2 size={12} /> Playing
                                                </div>
                                            ) : (
                                                <a
                                                    href={getYouTubeDirectUrl(session.video_id, ts.timestamp_seconds)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white p-1 transition"
                                                    title="Open this clip on YouTube"
                                                >
                                                    <ExternalLink size={12} />
                                                </a>
                                            )}
                                        </div>

                                        {ts.notes ? (
                                            <p className={`text-[11px] leading-relaxed transition ${
                                                isActive ? 'text-gray-200' : 'text-gray-400 group-hover:text-gray-300'
                                            }`}>
                                                {ts.notes}
                                            </p>
                                        ) : (
                                            <p className="text-[10px] italic text-gray-600">
                                                No specific notes for this clip.
                                            </p>
                                        )}
                                    </div>
                                );
                            })}

                            {timestamps.length === 0 && (
                                <div className="py-12 text-center flex flex-col items-center gap-2">
                                    <Clock size={28} className="text-gray-600" />
                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                        No Timestamp Markers
                                    </p>
                                    <p className="text-[10px] text-gray-600 max-w-[200px]">
                                        This video does not have specific timestamp notes attached yet.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
