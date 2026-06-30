'use client';

import React, { useEffect, useState } from 'react';
import { X, Loader2, Video, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';
import { safeFetch } from '@/app/lib/apiUtils';
import { formatHK } from '@/app/lib/dateUtils';

interface AssessmentMedia {
    id: string;
    media_type: 'image' | 'video';
    media_url: string;
    sort_order: number;
}

interface Assessment {
    id: string;
    title: string;
    notes?: string;
    created_at: string;
    media?: AssessmentMedia[];
}

interface AssessmentViewModalProps {
    assessmentId: string;
    isCoach?: boolean;
    onClose: () => void;
}

export default function AssessmentViewModal({ assessmentId, isCoach = false, onClose }: AssessmentViewModalProps) {
    const [assessment, setAssessment] = useState<Assessment | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAssessment = async () => {
            setLoading(true);
            setError(null);

            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            const endpoint = isCoach
                ? `/api/coach/assessments?assessmentId=${assessmentId}`
                : `/api/player/assessments?assessmentId=${assessmentId}`;

            const res = await safeFetch(endpoint, {
                headers: { Authorization: token ? `Bearer ${token}` : '' },
            });

            if (!res.success) {
                setError(res.error || 'Failed to load assessment');
                setLoading(false);
                return;
            }

            const data = res.data as Assessment;
            if (data.media) {
                data.media.sort((a, b) => a.sort_order - b.sort_order);
            }
            setAssessment(data);
            setLoading(false);
        };

        fetchAssessment();
    }, [assessmentId, isCoach]);

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
            <div className="w-full max-w-2xl bg-[#121212] rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col max-h-[90vh]">
                <div className="bg-gradient-to-r from-east-light to-east-dark p-4 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="font-black italic text-lg text-black uppercase leading-none">Private Assessment</h2>
                        <p className="text-[10px] font-bold text-black/60 uppercase tracking-widest mt-1">
                            {assessment?.created_at ? formatHK(assessment.created_at, 'MMM d, yyyy') : 'Loading...'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors">
                        <X size={20} className="text-black" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {loading ? (
                        <div className="py-16 flex flex-col items-center gap-3">
                            <Loader2 className="animate-spin text-east-light" size={28} />
                            <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Loading assessment...</p>
                        </div>
                    ) : error ? (
                        <div className="py-16 text-center">
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    ) : assessment ? (
                        <>
                            <div>
                                <h3 className="font-black italic text-2xl text-white uppercase tracking-tight">{assessment.title}</h3>
                            </div>

                            {assessment.notes && (
                                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                                    <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-2">Coach Notes</p>
                                    <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap">{assessment.notes}</p>
                                </div>
                            )}

                            {assessment.media && assessment.media.length > 0 ? (
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Media</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {assessment.media.map((item) => (
                                            <div key={item.id} className="rounded-2xl overflow-hidden border border-white/10 bg-black">
                                                {item.media_type === 'video' ? (
                                                    <video src={item.media_url} controls className="w-full max-h-72 object-cover bg-black" />
                                                ) : (
                                                    <img src={item.media_url} alt="" className="w-full max-h-72 object-cover" />
                                                )}
                                                <div className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1">
                                                    {item.media_type === 'video' ? <Video size={10} /> : <ImageIcon size={10} />}
                                                    {item.media_type}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-[10px] font-black uppercase text-gray-600 tracking-widest text-center py-8">
                                    No media attached
                                </p>
                            )}
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    );
}