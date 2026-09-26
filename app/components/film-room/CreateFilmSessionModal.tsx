'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
    X, 
    Film, 
    Play, 
    Plus, 
    Trash2, 
    Clock, 
    Loader2, 
    Users, 
    User, 
    Globe, 
    Check, 
    AlertCircle,
    BookmarkPlus
} from 'lucide-react';
import { supabase } from '@/app/lib/supabase';
import { safeFetch } from '@/app/lib/apiUtils';
import { useToast } from '@/app/components/ui/Toast';
import { 
    extractYouTubeVideoId, 
    formatSecondsToLabel, 
    parseLabelToSeconds, 
    getYouTubeThumbnail 
} from '@/app/lib/youtubeUtils';
import YouTubePlayer, { YouTubePlayerRef } from './YouTubePlayer';
import { FilmRoomSession, CreateFilmRoomSessionInput } from '@/app/types';

interface CreateFilmSessionModalProps {
    coachId: string;
    existingSession?: FilmRoomSession | null;
    onClose: () => void;
    onSuccess: (session: FilmRoomSession) => void;
}

interface TimestampFormItem {
    id?: string;
    timestamp_seconds: number;
    timestamp_label: string;
    title: string;
    notes: string;
}

export default function CreateFilmSessionModal({
    coachId,
    existingSession,
    onClose,
    onSuccess
}: CreateFilmSessionModalProps) {
    const { addToast } = useToast();
    const playerRef = useRef<YouTubePlayerRef>(null);

    // Form states
    const [title, setTitle] = useState(existingSession?.title || '');
    const [description, setDescription] = useState(existingSession?.description || '');
    const [youtubeUrl, setYoutubeUrl] = useState(existingSession?.youtube_url || '');
    const [detectedVideoId, setDetectedVideoId] = useState<string | null>(
        existingSession?.video_id || extractYouTubeVideoId(existingSession?.youtube_url || '')
    );
    const [targetType, setTargetType] = useState<'all' | 'team' | 'player'>(
        existingSession?.target_type || 'all'
    );
    const [targetTeamId, setTargetTeamId] = useState<string>(existingSession?.target_team_id || '');
    const [targetPlayerId, setTargetPlayerId] = useState<string>(existingSession?.target_player_id || '');

    // Options
    const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
    const [players, setPlayers] = useState<{ id: string; name: string }[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(true);

    // Timestamps
    const [timestamps, setTimestamps] = useState<TimestampFormItem[]>(
        existingSession?.timestamps?.map((ts) => ({
            id: ts.id,
            timestamp_seconds: ts.timestamp_seconds,
            timestamp_label: ts.timestamp_label || formatSecondsToLabel(ts.timestamp_seconds),
            title: ts.title,
            notes: ts.notes || ''
        })) || []
    );

    const [saving, setSaving] = useState(false);

    // Detect YouTube video ID on URL change
    useEffect(() => {
        const id = extractYouTubeVideoId(youtubeUrl);
        setDetectedVideoId(id);
    }, [youtubeUrl]);

    // Fetch teams and players for assignment
    useEffect(() => {
        const fetchTargets = async () => {
            setLoadingOptions(true);
            try {
                // Fetch coach teams
                const { data: teamsData } = await supabase
                    .from('teams')
                    .select('id, name')
                    .order('name');
                if (teamsData) setTeams(teamsData);

                // Fetch players
                const { data: playersData } = await supabase
                    .from('profiles')
                    .select('id, first_name, last_name')
                    .eq('role', 'player')
                    .order('first_name');
                if (playersData) {
                    setPlayers(
                        playersData.map((p) => ({
                            id: p.id,
                            name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Athlete'
                        }))
                    );
                }
            } catch (err) {
                console.error('Error fetching targets:', err);
            } finally {
                setLoadingOptions(false);
            }
        };

        fetchTargets();
    }, []);

    // Grab current time from the preview player
    const handleGrabCurrentTime = () => {
        let currentSeconds = 0;
        if (playerRef.current) {
            currentSeconds = Math.floor(playerRef.current.getCurrentTime());
        }

        const newMarker: TimestampFormItem = {
            timestamp_seconds: currentSeconds,
            timestamp_label: formatSecondsToLabel(currentSeconds),
            title: `Marker at ${formatSecondsToLabel(currentSeconds)}`,
            notes: ''
        };

        const updated = [...timestamps, newMarker].sort((a, b) => a.timestamp_seconds - b.timestamp_seconds);
        setTimestamps(updated);
        addToast(`Grabbed marker at ${newMarker.timestamp_label}`, 'info');
    };

    // Add manual timestamp
    const handleAddManualTimestamp = () => {
        const lastTs = timestamps.length > 0 ? timestamps[timestamps.length - 1].timestamp_seconds + 30 : 0;
        const newMarker: TimestampFormItem = {
            timestamp_seconds: lastTs,
            timestamp_label: formatSecondsToLabel(lastTs),
            title: '',
            notes: ''
        };
        setTimestamps([...timestamps, newMarker]);
    };

    const handleUpdateTimestamp = (index: number, updates: Partial<TimestampFormItem>) => {
        setTimestamps((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], ...updates };
            // If label changed, recompute seconds
            if (updates.timestamp_label !== undefined) {
                next[index].timestamp_seconds = parseLabelToSeconds(updates.timestamp_label);
            }
            return next;
        });
    };

    const handleRemoveTimestamp = (index: number) => {
        setTimestamps((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSeekPreview = (seconds: number) => {
        if (playerRef.current) {
            playerRef.current.seekTo(seconds);
        }
    };

    const handleSubmit = async () => {
        if (!title.trim()) {
            addToast('Please enter a session title', 'error');
            return;
        }

        if (!youtubeUrl.trim() || !detectedVideoId) {
            addToast('Please enter a valid YouTube video link', 'error');
            return;
        }

        if (targetType === 'team' && !targetTeamId) {
            addToast('Please select a target team', 'error');
            return;
        }

        if (targetType === 'player' && !targetPlayerId) {
            addToast('Please select a target player', 'error');
            return;
        }

        setSaving(true);
        try {
            const { data: { session: authSession } } = await supabase.auth.getSession();
            const token = authSession?.access_token;

            const payload: CreateFilmRoomSessionInput = {
                id: existingSession?.id,
                title: title.trim(),
                description: description.trim(),
                youtube_url: youtubeUrl.trim(),
                target_type: targetType,
                target_team_id: targetType === 'team' ? targetTeamId : null,
                target_player_id: targetType === 'player' ? targetPlayerId : null,
                timestamps: timestamps.map((ts, idx) => ({
                    id: ts.id,
                    timestamp_seconds: ts.timestamp_seconds,
                    timestamp_label: ts.timestamp_label || formatSecondsToLabel(ts.timestamp_seconds),
                    title: ts.title.trim() || `Marker ${idx + 1}`,
                    notes: ts.notes.trim(),
                    sort_order: idx
                }))
            };

            const endpoint = '/api/film-room';
            const method = existingSession ? 'PUT' : 'POST';

            const res = await safeFetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify(payload)
            });

            if (!res.success) {
                throw new Error(res.error || 'Failed to save film session');
            }

            addToast(
                existingSession ? 'Film session updated successfully!' : 'Film session created successfully!',
                'success'
            );
            onSuccess(res.data);
            onClose();
        } catch (err: any) {
            console.error('Error saving film session:', err);
            addToast(err.message || 'Failed to save session', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/95 backdrop-blur-xl animate-fadeIn select-none">
            <div className="w-full max-w-5xl h-full max-h-[95vh] bg-[#0f0f0f] rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col">
                {/* MODAL HEADER */}
                <div className="bg-gradient-to-r from-east-light to-east-dark p-4 sm:p-5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-black/20 flex items-center justify-center">
                            <Film size={22} className="text-black" />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-xl font-black italic uppercase text-black leading-tight">
                                {existingSession ? 'Edit Film Session' : 'New Film Room Session'}
                            </h2>
                            <p className="text-[10px] font-bold text-black/70 uppercase tracking-widest mt-0.5">
                                Add YouTube Video, Mark Timestamps & Add Coaching Notes
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-black/10 hover:bg-black/25 text-black transition"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* MODAL BODY */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 no-scrollbar">
                    {/* 1. YOUTUBE URL INPUT & PREVIEW */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">
                            YouTube Video Link <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={youtubeUrl}
                                onChange={(e) => setYoutubeUrl(e.target.value)}
                                placeholder="Paste link e.g. https://www.youtube.com/watch?v=... or https://youtu.be/..."
                                className="w-full bg-[#181818] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-east-light transition"
                            />
                            {detectedVideoId && (
                                <div className="absolute right-3 top-3 px-2 py-1 rounded-md bg-east-light/20 text-east-light text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                                    <Check size={12} /> Detected
                                </div>
                            )}
                        </div>

                        {/* LIVE PREVIEW PLAYER */}
                        {detectedVideoId && (
                            <div className="mt-4 p-3 bg-black/50 rounded-2xl border border-white/5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        Live Video Preview (Seek & Grab Times)
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleGrabCurrentTime}
                                        className="px-3 py-1.5 rounded-xl bg-east-light text-black hover:bg-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition active:scale-95 shadow-[0_0_15px_var(--brand-glow)]"
                                    >
                                        <BookmarkPlus size={14} /> Grab Current Time
                                    </button>
                                </div>
                                <YouTubePlayer
                                    ref={playerRef}
                                    videoId={detectedVideoId}
                                    autoPlay={false}
                                    className="max-h-[300px]"
                                />
                            </div>
                        )}
                    </div>

                    {/* 2. BASIC SESSION DETAILS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">
                                Session Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Game 3 Neutral Zone Breakdown"
                                className="w-full bg-[#181818] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-east-light transition"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">
                                Tactical Objective / Description
                            </label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="e.g. Focus on D-to-D passing and winger support along the boards"
                                className="w-full bg-[#181818] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-east-light transition"
                            />
                        </div>
                    </div>

                    {/* 3. TARGET AUDIENCE SELECTOR */}
                    <div className="space-y-3 p-4 bg-[#141414] rounded-2xl border border-white/5">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">
                            Target Audience (Who should see this film session?)
                        </label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setTargetType('all')}
                                className={`flex-1 py-2.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition ${
                                    targetType === 'all'
                                        ? 'bg-east-light text-black shadow-lg'
                                        : 'bg-white/5 text-gray-400 hover:text-white'
                                }`}
                            >
                                <Globe size={14} /> Squad General
                            </button>
                            <button
                                type="button"
                                onClick={() => setTargetType('team')}
                                className={`flex-1 py-2.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition ${
                                    targetType === 'team'
                                        ? 'bg-east-light text-black shadow-lg'
                                        : 'bg-white/5 text-gray-400 hover:text-white'
                                }`}
                            >
                                <Users size={14} /> Entire Team
                            </button>
                            <button
                                type="button"
                                onClick={() => setTargetType('player')}
                                className={`flex-1 py-2.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition ${
                                    targetType === 'player'
                                        ? 'bg-east-light text-black shadow-lg'
                                        : 'bg-white/5 text-gray-400 hover:text-white'
                                }`}
                            >
                                <User size={14} /> Individual Athlete
                            </button>
                        </div>

                        {/* SPECIFIC SELECTIONS */}
                        {targetType === 'team' && (
                            <div className="mt-3">
                                <select
                                    value={targetTeamId}
                                    onChange={(e) => setTargetTeamId(e.target.value)}
                                    className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-east-light transition"
                                >
                                    <option value="">-- Select Team --</option>
                                    {teams.map((t) => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {targetType === 'player' && (
                            <div className="mt-3">
                                <select
                                    value={targetPlayerId}
                                    onChange={(e) => setTargetPlayerId(e.target.value)}
                                    className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-east-light transition"
                                >
                                    <option value="">-- Select Athlete --</option>
                                    {players.map((p) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* 4. TIMESTAMPS & COACHING NOTES BUILDER */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xs font-black uppercase text-white tracking-widest">
                                    Timestamp Markers & Coaching Notes
                                </h3>
                                <p className="text-[10px] text-gray-500 mt-0.5">
                                    Click any marker to seek preview. Notes will be highlighted as the video reaches that point.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleAddManualTimestamp}
                                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition"
                                >
                                    <Plus size={12} /> Add Marker
                                </button>
                            </div>
                        </div>

                        {/* LIST OF TIMESTAMPS */}
                        <div className="space-y-3">
                            {timestamps.map((ts, index) => (
                                <div
                                    key={index}
                                    className="bg-[#141414] p-3.5 sm:p-4 rounded-2xl border border-white/10 space-y-3 hover:border-white/20 transition"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-24 shrink-0">
                                            <input
                                                type="text"
                                                value={ts.timestamp_label}
                                                onChange={(e) => handleUpdateTimestamp(index, { timestamp_label: e.target.value })}
                                                placeholder="01:23"
                                                className="w-full bg-[#1f1f1f] border border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-east-light text-center focus:outline-none focus:border-east-light"
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            value={ts.title}
                                            onChange={(e) => handleUpdateTimestamp(index, { title: e.target.value })}
                                            placeholder="Play / Concept title e.g. Breakout turn"
                                            className="flex-1 bg-[#1f1f1f] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-east-light"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleSeekPreview(ts.timestamp_seconds)}
                                            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition"
                                            title="Test seek in preview player"
                                        >
                                            <Play size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTimestamp(index)}
                                            className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                                            title="Remove marker"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                    <textarea
                                        value={ts.notes}
                                        onChange={(e) => handleUpdateTimestamp(index, { notes: e.target.value })}
                                        rows={2}
                                        placeholder="Coaching notes & tactical cues (e.g. Keep your stick down, open up hips to receive the puck, skate through the lane)..."
                                        className="w-full bg-[#1c1c1c] border border-white/5 rounded-xl p-3 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-east-light transition resize-none"
                                    />
                                </div>
                            ))}

                            {timestamps.length === 0 && (
                                <div className="p-8 text-center rounded-2xl border border-dashed border-white/10 bg-white/[0.01] flex flex-col items-center gap-2">
                                    <Clock size={28} className="text-gray-600" />
                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                        No Timestamp Markers Added Yet
                                    </p>
                                    <p className="text-[10px] text-gray-600 max-w-sm">
                                        Play the video above and tap "Grab Current Time" at key plays, or click "+ Add Marker" to type them manually.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* MODAL FOOTER */}
                <div className="bg-[#141414] px-4 sm:px-6 py-4 border-t border-white/10 flex items-center justify-between shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-black uppercase tracking-wider transition"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={saving}
                        className="px-8 py-3 rounded-2xl bg-east-light hover:bg-white text-black font-black italic uppercase text-xs tracking-wider transition shadow-[0_0_20px_var(--brand-glow)] hover:scale-105 active:scale-95 flex items-center gap-2 disabled:opacity-50"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="animate-spin" size={16} />
                                Saving Film Session...
                            </>
                        ) : (
                            <>
                                <Check size={16} />
                                {existingSession ? 'Update Session' : 'Save & Publish Session'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
