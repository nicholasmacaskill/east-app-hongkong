'use client';

import React, { useRef, useState } from 'react';
import { X, Upload, Image as ImageIcon, Video, Loader2, Trash2, Send } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';
import { useToast } from '@/app/components/ui/Toast';
import { compressImage } from '@/app/lib/image-utils';
import { safeFetch } from '@/app/lib/apiUtils';

interface MediaPreview {
    id: string;
    file: File;
    type: 'image' | 'video';
    previewUrl: string;
}

export interface AssessmentPlayerOption {
    id: string;
    name: string;
}

interface CreateAssessmentModalProps {
    coachId: string;
    playerId?: string;
    playerName?: string;
    players?: AssessmentPlayerOption[];
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateAssessmentModal({
    coachId,
    playerId: initialPlayerId,
    playerName: initialPlayerName,
    players = [],
    onClose,
    onSuccess,
}: CreateAssessmentModalProps) {
    const { addToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedPlayerId, setSelectedPlayerId] = useState(initialPlayerId || '');
    const [title, setTitle] = useState('');
    const [notes, setNotes] = useState('');
    const [mediaItems, setMediaItems] = useState<MediaPreview[]>([]);
    const [saving, setSaving] = useState(false);

    const resolvedPlayerId = initialPlayerId || selectedPlayerId;
    const resolvedPlayerName =
        initialPlayerName ||
        players.find((p) => p.id === selectedPlayerId)?.name ||
        'Player';

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        const newItems = files.map((file) => {
            const isVideo = file.type.startsWith('video/');
            return {
                id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                file,
                type: isVideo ? 'video' as const : 'image' as const,
                previewUrl: URL.createObjectURL(file),
            };
        });

        setMediaItems((prev) => [...prev, ...newItems]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeMedia = (id: string) => {
        setMediaItems((prev) => {
            const item = prev.find((m) => m.id === id);
            if (item) URL.revokeObjectURL(item.previewUrl);
            return prev.filter((m) => m.id !== id);
        });
    };

    const uploadMedia = async (item: MediaPreview) => {
        const file = item.type === 'image' ? await compressImage(item.file) : item.file;
        const ext = file.name.split('.').pop() || (item.type === 'video' ? 'mp4' : 'jpg');
        const fileName = `assessment-${coachId}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error } = await supabase.storage.from('uploads').upload(fileName, file);
        if (error) throw new Error(error.message);

        const { data } = supabase.storage.from('uploads').getPublicUrl(fileName);
        return { media_type: item.type, media_url: data.publicUrl };
    };

    const handleSubmit = async () => {
        if (!resolvedPlayerId) {
            addToast('Please select a player', 'error');
            return;
        }
        if (!title.trim()) {
            addToast('Please add a title', 'error');
            return;
        }

        setSaving(true);
        try {
            const uploadedMedia = [];
            for (const item of mediaItems) {
                uploadedMedia.push(await uploadMedia(item));
            }

            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const res = await safeFetch('/api/coach/assessments', {
                method: 'POST',
                headers: {
                    Authorization: token ? `Bearer ${token}` : '',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    playerId: resolvedPlayerId,
                    title: title.trim(),
                    notes: notes.trim(),
                    media: uploadedMedia,
                    sendToPlayer: true,
                }),
            });

            if (!res.success) {
                throw new Error(res.error || 'Failed to save assessment');
            }

            addToast(`Assessment sent to ${resolvedPlayerName}`, 'success');
            onSuccess();
            onClose();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to save assessment';
            addToast(message, 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
            <div className="w-full max-w-lg bg-[#121212] rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col max-h-[90vh]">
                <div className="bg-gradient-to-r from-east-light to-east-dark p-4 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="font-black italic text-lg text-black uppercase leading-none">Video Assessment</h2>
                        <p className="text-[10px] font-bold text-black/60 uppercase tracking-widest mt-1">
                            Private{resolvedPlayerId ? ` • ${resolvedPlayerName}` : ' • Select player'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors">
                        <X size={20} className="text-black" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {!initialPlayerId && (
                        <div>
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Player</label>
                            <select
                                value={selectedPlayerId}
                                onChange={(e) => setSelectedPlayerId(e.target.value)}
                                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl p-4 text-sm text-white focus:border-east-light outline-none appearance-none"
                            >
                                <option value="">Select a player...</option>
                                {players.map((player) => (
                                    <option key={player.id} value={player.id}>
                                        {player.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Title</label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Skating stride review"
                            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl p-4 text-sm text-white focus:border-east-light outline-none"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Coaching feedback, strengths, areas to improve..."
                            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl p-4 text-sm text-white focus:border-east-light outline-none min-h-[120px]"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Photos & Videos</label>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="text-[10px] font-black uppercase text-east-light hover:text-white transition-colors flex items-center gap-1"
                            >
                                <Upload size={12} /> Add Media
                            </button>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            className="hidden"
                            onChange={handleFileSelect}
                        />

                        {mediaItems.length === 0 ? (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full py-10 border border-dashed border-white/10 rounded-2xl bg-white/[0.02] hover:border-east-light/40 transition-colors flex flex-col items-center gap-2"
                            >
                                <Upload size={24} className="text-gray-600" />
                                <span className="text-[10px] font-black uppercase text-gray-600 tracking-widest">
                                    Upload photos or videos
                                </span>
                            </button>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                {mediaItems.map((item) => (
                                    <div key={item.id} className="relative rounded-xl overflow-hidden border border-white/10 bg-black aspect-video">
                                        {item.type === 'video' ? (
                                            <video src={item.previewUrl} className="w-full h-full object-cover" controls />
                                        ) : (
                                            <img src={item.previewUrl} alt="" className="w-full h-full object-cover" />
                                        )}
                                        <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-black/70 text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                                            {item.type === 'video' ? <Video size={10} /> : <ImageIcon size={10} />}
                                            {item.type}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeMedia(item.id)}
                                            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-red-500/80 transition-colors"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-white/10 bg-black/40 shrink-0">
                    <button
                        onClick={handleSubmit}
                        disabled={saving || !title.trim() || !resolvedPlayerId}
                        className="w-full py-4 bg-east-light text-black font-black italic uppercase rounded-xl hover:bg-white transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        {saving ? 'Sending...' : 'Send Assessment to Player'}
                    </button>
                    <p className="text-[9px] text-gray-600 text-center mt-3 uppercase tracking-widest font-bold">
                        Private only — not saved to public drill hub
                    </p>
                </div>
            </div>
        </div>
    );
}