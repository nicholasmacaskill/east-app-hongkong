// app/sys-admin/player-stats/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { ChevronLeft, Upload, Save, Camera, Edit2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/app/lib/supabase';
import { useToast } from '@/app/components/ui/Toast';

interface PlayerStats {
    age?: number | null;
    season?: number | null;
    team?: string | null;
    games_played_season?: number | null;
    games_played_total?: number | null;
    games_missed_healthy?: number | null;
    games_missed_injured?: number | null;
    goals_season?: number | null;
    goals_total?: number | null;
    assists_season?: number | null;
    assists_total?: number | null;
    gp?: number | null;
    goals?: number | null;
    assists?: number | null;
    points?: number | null;
    gwg?: number | null;
    ppg?: number | null;
    shg?: number | null;
    pim?: number | null;
}

export default function PlayerStatsAdmin() {
    const [players, setPlayers] = useState<any[]>([]);
    const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
    const [stats, setStats] = useState<PlayerStats>({});
    const [loading, setLoading] = useState(false);
    const [ocrProcessing, setOcrProcessing] = useState(false);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
    const { addToast } = useToast();

    useEffect(() => {
        fetchPlayers();
    }, []);

    useEffect(() => {
        if (selectedPlayerId) {
            loadPlayerStats(selectedPlayerId);
        }
    }, [selectedPlayerId]);

    const fetchPlayers = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .eq('role', 'player')
            .order('first_name');
        setPlayers(data || []);
    };

    const loadPlayerStats = async (playerId: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/player-stats?playerId=${playerId}`);
            const data = await res.json();
            if (data.stats) {
                setStats(data.stats);
            } else {
                setStats({});
            }
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setOcrProcessing(true);

        // Convert to base64
        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64 = event.target?.result as string;
            setUploadedImage(base64);

            try {
                const res = await fetch('/api/admin/ocr-stats', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageBase64: base64 })
                });

                const data = await res.json();
                if (data.success) {
                    setStats(data.stats);
                } else {
                    addToast('OCR failed: ' + data.error, 'error');
                }
            } catch (err: any) {
                addToast('OCR error: ' + err.message, 'error');
            }
            setOcrProcessing(false);
        };
        reader.readAsDataURL(file);
    };

    const handleSaveStats = async () => {
        if (!selectedPlayerId) {
            addToast('Please select a player', 'warning');
            return;
        }

        setSaveStatus('saving');

        try {
            const res = await fetch('/api/admin/player-stats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerId: selectedPlayerId,
                    stats: stats
                })
            });

            if (res.ok) {
                setSaveStatus('success');
                setTimeout(() => setSaveStatus('idle'), 2000);
            } else {
                setSaveStatus('error');
            }
        } catch (err) {
            setSaveStatus('error');
        }
    };

    const updateStat = (field: keyof PlayerStats, value: string | number | null) => {
        setStats(prev => ({
            ...prev,
            [field]: value === '' ? null : value
        }));
    };

    const statFields = [
        { label: 'Age', field: 'age', type: 'number' },
        { label: 'Season', field: 'season', type: 'number' },
        { label: 'Team', field: 'team', type: 'text' },
        { label: 'Games Played (Season)', field: 'games_played_season', type: 'number' },
        { label: 'Games Played (Total)', field: 'games_played_total', type: 'number' },
        { label: 'Games Missed (Healthy)', field: 'games_missed_healthy', type: 'number' },
        { label: 'Games Missed (Injured)', field: 'games_missed_injured', type: 'number' },
        { label: 'Goals (Season)', field: 'goals_season', type: 'number' },
        { label: 'Goals (Total)', field: 'goals_total', type: 'number' },
        { label: 'Assists (Season)', field: 'assists_season', type: 'number' },
        { label: 'Assists (Total)', field: 'assists_total', type: 'number' },
        { label: 'GP', field: 'gp', type: 'number' },
        { label: 'Goals (Current)', field: 'goals', type: 'number' },
        { label: 'Assists (Current)', field: 'assists', type: 'number' },
        { label: 'Points', field: 'points', type: 'number' },
        { label: 'GWG (Game Winning Goals)', field: 'gwg', type: 'number' },
        { label: 'PPG (Power Play Goals)', field: 'ppg', type: 'number' },
        { label: 'SHG (Short Handed Goals)', field: 'shg', type: 'number' },
        { label: 'PIM (Penalty Minutes)', field: 'pim', type: 'number' }
    ];

    return (
        <div className="min-h-screen bg-black text-white p-6 font-montserrat pb-24">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/sys-admin" className="p-2 bg-[#1e1e1e] rounded-lg hover:bg-[#28D160] hover:text-black transition-colors">
                        <ChevronLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black italic uppercase tracking-tighter">Player Stats Manager</h1>
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">OCR + Manual Entry</p>
                    </div>
                </div>
            </div>

            {/* Player Selector */}
            <div className="mb-8 bg-[#1e1e1e] p-6 rounded-2xl border border-white/10">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Select Player</label>
                <select
                    value={selectedPlayerId}
                    onChange={(e) => setSelectedPlayerId(e.target.value)}
                    className="w-full bg-black border border-white/10 p-4 rounded-xl text-white outline-none focus:border-[#28D160] transition-colors"
                >
                    <option value="">-- Select Player --</option>
                    {players.map(p => (
                        <option key={p.id} value={p.id}>
                            {p.first_name} {p.last_name}
                        </option>
                    ))}
                </select>
            </div>

            {selectedPlayerId && (
                <>
                    {/* OCR Upload Section */}
                    <div className="mb-8 bg-gradient-to-r from-[#28D160]/10 to-blue-500/10 p-6 rounded-2xl border border-[#28D160]/30">
                        <h2 className="text-lg font-black italic uppercase mb-4 flex items-center gap-2">
                            <Camera size={20} className="text-[#28D160]" />
                            Upload Stats Card (OCR)
                        </h2>

                        <label className="cursor-pointer">
                            <div className="border-2 border-dashed border-white/20 rounded-xl p-8 hover:border-[#28D160]/50 transition-colors text-center">
                                {ocrProcessing ? (
                                    <div className="text-[#28D160] font-bold">Processing image...</div>
                                ) : uploadedImage ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <img src={uploadedImage} alt="Uploaded" className="max-h-64 rounded-lg" />
                                        <p className="text-sm text-gray-400">Image uploaded - Stats extracted below ✓</p>
                                    </div>
                                ) : (
                                    <>
                                        <Upload size={32} className="mx-auto mb-2 text-gray-400" />
                                        <p className="text-sm font-bold text-gray-400">Click to upload stats card photo</p>
                                        <p className="text-xs text-gray-600 mt-1">JPG, PNG - Stats will be auto-filled</p>
                                    </>
                                )}
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                        </label>
                    </div>

                    {/* Manual Entry Form */}
                    <div className="bg-[#1e1e1e] p-6 rounded-2xl border border-white/10 mb-8">
                        <h2 className="text-lg font-black italic uppercase mb-6 flex items-center gap-2">
                            <Edit2 size={20} className="text-[#28D160]" />
                            Stats Fields {loading && <span className="text-xs text-gray-500">(Loading...)</span>}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {statFields.map(({ label, field, type }) => (
                                <div key={field}>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 block">{label}</label>
                                    <input
                                        type={type}
                                        value={stats[field as keyof PlayerStats] ?? ''}
                                        onChange={(e) => updateStat(field as keyof PlayerStats, type === 'number' ? (e.target.value ? parseFloat(e.target.value) : null) : e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-[#28D160] transition-colors"
                                        placeholder={type === 'number' ? '0' : 'Enter value'}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={handleSaveStats}
                        disabled={saveStatus === 'saving'}
                        className="w-full bg-[#28D160] text-black font-black italic uppercase text-sm py-4 rounded-xl hover:bg-white transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {saveStatus === 'saving' && <div className="animate-spin">⏳</div>}
                        {saveStatus === 'success' && <CheckCircle2 size={18} />}
                        {saveStatus === 'idle' && <Save size={18} />}
                        {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'success' ? 'Saved!' : 'Save Player Stats'}
                    </button>
                </>
            )}
        </div>
    );
}
