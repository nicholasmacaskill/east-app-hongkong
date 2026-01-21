'use client';
import React, { useState } from 'react';
import { X, Save, Activity } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';
import { useToast } from '../ui/Toast';

interface UploadGolfStatsModalProps {
    onClose: () => void;
    currentUserId: string | null;
    onSuccess: () => void;
    existingStats?: any;
}

export default function UploadGolfStatsModal({ onClose, currentUserId, onSuccess, existingStats }: UploadGolfStatsModalProps) {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({
        handicap: existingStats?.handicap || '',
        rounds_played: existingStats?.rounds_played || '',
        average_score: existingStats?.average_score || '',
        best_score: existingStats?.best_score || '',
        driver_distance: existingStats?.driver_distance || ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setStats({ ...stats, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!currentUserId) throw new Error("No user ID");

            const payload = {
                player_id: currentUserId,
                handicap: parseFloat(stats.handicap) || 0,
                rounds_played: parseInt(stats.rounds_played) || 0,
                average_score: parseInt(stats.average_score) || 0,
                best_score: parseInt(stats.best_score) || 0,
                driver_distance: parseInt(stats.driver_distance) || 0,
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('golf_stats')
                .upsert(payload, { onConflict: 'player_id' });

            if (error) throw error;

            onSuccess();
            onClose();
        } catch (error: any) {
            addToast('Error updating stats: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl relative">
                <div className="bg-gradient-to-r from-east-light to-east-dark p-4 flex justify-between items-center">
                    <h2 className="font-montserrat font-black italic text-xl text-white uppercase">Upload Golf Stats</h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                        <X className="text-white" size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-gray-500">Handicap</label>
                        <input
                            type="number"
                            step="0.1"
                            name="handicap"
                            value={stats.handicap}
                            onChange={handleChange}
                            className="w-full p-3 bg-gray-50 text-black rounded-xl border border-gray-200 outline-none focus:border-black font-bold font-montserrat"
                            placeholder="e.g. 12.5"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-gray-500">Rounds Played</label>
                            <input
                                type="number"
                                name="rounds_played"
                                value={stats.rounds_played}
                                onChange={handleChange}
                                className="w-full p-3 bg-gray-50 text-black rounded-xl border border-gray-200 outline-none focus:border-black font-bold font-montserrat"
                                placeholder="Total"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-gray-500">Avg Score</label>
                            <input
                                type="number"
                                name="average_score"
                                value={stats.average_score}
                                onChange={handleChange}
                                className="w-full p-3 bg-gray-50 text-black rounded-xl border border-gray-200 outline-none focus:border-black font-bold font-montserrat"
                                placeholder="18 Holes"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-gray-500">Best Score</label>
                            <input
                                type="number"
                                name="best_score"
                                value={stats.best_score}
                                onChange={handleChange}
                                className="w-full p-3 bg-gray-50 text-black rounded-xl border border-gray-200 outline-none focus:border-black font-bold font-montserrat"
                                placeholder="Lowest"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-gray-500">Driver Dist</label>
                            <input
                                type="number"
                                name="driver_distance"
                                value={stats.driver_distance}
                                onChange={handleChange}
                                className="w-full p-3 bg-gray-50 text-black rounded-xl border border-gray-200 outline-none focus:border-black font-bold font-montserrat"
                                placeholder="Yards"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-black text-white py-4 rounded-xl font-black italic uppercase tracking-widest hover:bg-gray-800 transition-all flex items-center justify-center gap-2 mt-4"
                    >
                        {loading ? 'Saving...' : <><Save size={18} /> Save Stats</>}
                    </button>
                </form>
            </div>
        </div>
    );
}
