'use client';

import React, { useEffect, useState } from 'react';
import { ClipboardCheck, Loader2, Video, Image as ImageIcon, ChevronRight } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';
import { safeFetch } from '@/app/lib/apiUtils';
import { formatHK } from '@/app/lib/dateUtils';
import AssessmentViewModal from '@/app/components/modals/AssessmentViewModal';

interface AssessmentListItem {
    id: string;
    title: string;
    notes?: string;
    created_at: string;
    coach_id: string;
    coach_name: string;
    media_count: number;
    has_video: boolean;
}

function SettingsHeader({ title, onBack }: { title: string; onBack: () => void }) {
    return (
        <div className="flex items-center justify-between mb-8 shrink-0">
            <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors p-2 -ml-2">
                <ChevronRight size={24} className="rotate-180" />
            </button>
            <h2 className="font-montserrat font-bold text-xl tracking-tight">{title}</h2>
            <div className="w-8" />
        </div>
    );
}

export default function PlayerAssessmentsScreen({ onBack }: { onBack: () => void }) {
    const [assessments, setAssessments] = useState<AssessmentListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewingId, setViewingId] = useState<string | null>(null);

    useEffect(() => {
        const fetchAssessments = async () => {
            setLoading(true);
            setError(null);

            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const res = await safeFetch('/api/player/assessments', {
                headers: { Authorization: token ? `Bearer ${token}` : '' },
            });

            if (!res.success) {
                setError(res.error || 'Failed to load assessments');
                setLoading(false);
                return;
            }

            setAssessments((res.data as AssessmentListItem[]) || []);
            setLoading(false);
        };

        fetchAssessments();
    }, []);

    return (
        <>
            <SettingsHeader title="My Assessments" onBack={onBack} />

            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 mb-6">
                Private coach feedback — only visible to you
            </p>

            {loading ? (
                <div className="py-20 flex flex-col items-center gap-3">
                    <Loader2 className="animate-spin text-east-light" size={28} />
                    <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Loading assessments...</p>
                </div>
            ) : error ? (
                <div className="py-16 text-center px-4">
                    <p className="text-sm text-red-400">{error}</p>
                </div>
            ) : assessments.length === 0 ? (
                <div className="py-16 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02] mx-2">
                    <ClipboardCheck className="mx-auto text-gray-600 mb-4" size={32} />
                    <p className="text-sm font-bold text-gray-400">No assessments yet</p>
                    <p className="text-[10px] text-gray-600 mt-2 uppercase tracking-widest">
                        When a coach sends you feedback, it will appear here
                    </p>
                </div>
            ) : (
                <div className="space-y-3 pb-12">
                    {assessments.map((item) => (
                        <button
                            key={item.id}
                            data-testid={`assessment-list-item-${item.id}`}
                            onClick={() => setViewingId(item.id)}
                            className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 hover:border-east-light/30 hover:bg-white/[0.07] transition text-left group"
                        >
                            <div className="w-12 h-12 rounded-xl bg-east-light/10 border border-east-light/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                <ClipboardCheck size={20} className="text-east-light" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-black italic uppercase text-white truncate text-sm">{item.title}</h4>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1 truncate">
                                    {item.coach_name}
                                </p>
                                <div className="flex items-center gap-3 mt-1.5">
                                    <span className="text-[9px] font-black uppercase text-gray-600 tracking-widest">
                                        {formatHK(item.created_at, 'MMM d, yyyy')}
                                    </span>
                                    {item.media_count > 0 && (
                                        <span className="text-[9px] font-black uppercase text-east-light/80 tracking-widest flex items-center gap-1">
                                            {item.has_video ? <Video size={10} /> : <ImageIcon size={10} />}
                                            {item.media_count} media
                                        </span>
                                    )}
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-gray-600 group-hover:text-east-light transition-colors shrink-0" />
                        </button>
                    ))}
                </div>
            )}

            {viewingId && (
                <AssessmentViewModal
                    assessmentId={viewingId}
                    onClose={() => setViewingId(null)}
                />
            )}
        </>
    );
}