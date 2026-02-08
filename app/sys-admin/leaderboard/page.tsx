// app/sys-admin/leaderboard/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import {
    ChevronLeft, Plus, Save, Trash2, Trophy,
    Flag, Activity, Shield, Edit2, CheckCircle2,
    Search, Filter, User
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/app/components/ui/Toast';

interface LeaderboardEntry {
    id?: string;
    sport: 'hockey' | 'golf' | 'hyrox' | 'team_standings';
    category: string;
    name: string;
    team: string;
    avatar_url: string;
    stats: any;
    rank: number;
    year: string;
    division: string;
}

export default function LeaderboardAdmin() {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterSport, setFilterSport] = useState<string>('all');
    const [selectedEntry, setSelectedEntry] = useState<Partial<LeaderboardEntry> | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const { addToast } = useToast();

    // Stats Editing State
    const [statKey, setStatKey] = useState('');
    const [statValue, setStatValue] = useState('');

    useEffect(() => {
        fetchEntries();
    }, [filterSport]);

    const fetchEntries = async () => {
        setLoading(true);
        try {
            const url = filterSport !== 'all'
                ? `/api/admin/leaderboard?sport=${filterSport}`
                : '/api/admin/leaderboard';
            const res = await fetch(url);
            const data = await res.json();
            setEntries(data);
        } catch (err) {
            console.error('Failed to fetch entries:', err);
            addToast('Failed to load entries', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!selectedEntry?.sport || !selectedEntry?.category || !selectedEntry?.name) {
            addToast('Please fill in required fields', 'warning');
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch('/api/admin/leaderboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(selectedEntry)
            });

            if (res.ok) {
                addToast('Leaderboard entry saved!', 'success');
                setSelectedEntry(null);
                fetchEntries();
            } else {
                const data = await res.json();
                addToast('Save failed: ' + data.error, 'error');
            }
        } catch (err) {
            addToast('Error saving entry', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this entry?')) return;

        try {
            const res = await fetch(`/api/admin/leaderboard?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                addToast('Entry deleted', 'success');
                fetchEntries();
            }
        } catch (err) {
            addToast('Failed to delete', 'error');
        }
    };

    const updateStat = (key: string, value: any) => {
        if (!selectedEntry) return;
        const newStats = { ...(selectedEntry.stats || {}), [key]: value };
        setSelectedEntry({ ...selectedEntry, stats: newStats });
    };

    const removeStat = (key: string) => {
        if (!selectedEntry) return;
        const newStats = { ...(selectedEntry.stats || {}) };
        delete newStats[key];
        setSelectedEntry({ ...selectedEntry, stats: newStats });
    };

    const addNewEntry = () => {
        setSelectedEntry({
            sport: filterSport !== 'all' ? filterSport as any : 'hockey',
            category: 'players',
            name: '',
            team: '',
            avatar_url: '',
            stats: {},
            rank: entries.length + 1,
            year: '2025-2026 Winter',
            division: 'All'
        });
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 font-montserrat pb-24">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/sys-admin" className="p-2 bg-[#1e1e1e] rounded-lg hover:bg-[#28D160] hover:text-black transition-colors">
                        <ChevronLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black italic uppercase tracking-tighter">Leaderboard CMS</h1>
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Manage All Stats & Standings</p>
                    </div>
                </div>
                <button
                    onClick={addNewEntry}
                    className="flex items-center gap-2 bg-[#28D160] text-black px-6 py-3 rounded-xl font-black italic uppercase text-xs hover:bg-white transition-all shadow-[0_0_20px_rgba(40,209,96,0.3)]"
                >
                    <Plus size={16} /> Add New Entry
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 1. Sidebar / Filter */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-[#1e1e1e] p-6 rounded-2xl border border-white/10">
                        <h2 className="text-sm font-black uppercase mb-4 flex items-center gap-2 text-gray-400">
                            <Filter size={16} /> Filters
                        </h2>
                        <div className="space-y-3">
                            {['all', 'hockey', 'golf', 'hyrox', 'team_standings'].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setFilterSport(s)}
                                    className={`w-full text-left px-4 py-3 rounded-xl border uppercase text-[10px] font-black tracking-widest transition-all ${filterSport === s ? 'bg-white text-black border-white' : 'bg-black/40 border-white/5 text-gray-500 hover:border-white/20'}`}
                                >
                                    {s.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Entry List */}
                    <div className="bg-[#1e1e1e] p-6 rounded-2xl border border-white/10 h-[600px] overflow-y-auto no-scrollbar">
                        <h2 className="text-sm font-black uppercase mb-4 flex items-center gap-2 text-gray-400">
                            <Trophy size={16} /> Entries ({entries.length})
                        </h2>
                        {loading ? (
                            <div className="text-center py-10 text-gray-600 animate-pulse text-xs font-bold uppercase">Loading...</div>
                        ) : entries.length === 0 ? (
                            <div className="text-center py-10 text-gray-600 text-xs font-bold uppercase">No entries found</div>
                        ) : (
                            <div className="space-y-2">
                                {entries.map(entry => (
                                    <div
                                        key={entry.id}
                                        onClick={() => setSelectedEntry(entry)}
                                        className={`group flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedEntry?.id === entry.id ? 'bg-[#28D160]/10 border-[#28D160]' : 'bg-black/30 border-white/5 hover:border-white/20'}`}
                                    >
                                        <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 shrink-0">
                                            {entry.avatar_url ? (
                                                <img src={entry.avatar_url} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                <div className="w-full h-full bg-gray-900 flex items-center justify-center text-gray-700">
                                                    <User size={14} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[10px] font-black uppercase truncate">{entry.name}</div>
                                            <div className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">{entry.sport} | {entry.category}</div>
                                        </div>
                                        <div className="text-[14px] font-black italic text-[#28D160]">#{entry.rank}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Main Editor */}
                <div className="lg:col-span-2">
                    {selectedEntry ? (
                        <div className="bg-[#1e1e1e] p-8 rounded-2xl border border-white/10 animate-slideUp">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-xl font-black italic uppercase tracking-tighter">
                                    {selectedEntry.id ? 'Edit Entry' : 'New Leaderboard Entry'}
                                </h2>
                                {selectedEntry.id && (
                                    <button
                                        onClick={() => handleDelete(selectedEntry.id!)}
                                        className="text-red-500 hover:text-red-400 p-2"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Sport</label>
                                    <select
                                        value={selectedEntry.sport}
                                        onChange={e => setSelectedEntry({ ...selectedEntry, sport: e.target.value as any })}
                                        className="w-full bg-black border border-white/10 p-4 rounded-xl text-white outline-none focus:border-[#28D160]"
                                    >
                                        <option value="hockey">Hockey</option>
                                        <option value="golf">Golf</option>
                                        <option value="hyrox">Hyrox</option>
                                        <option value="team_standings">Team Standings</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Category</label>
                                    <input
                                        type="text"
                                        value={selectedEntry.category}
                                        onChange={e => setSelectedEntry({ ...selectedEntry, category: e.target.value })}
                                        className="w-full bg-black border border-white/10 p-4 rounded-xl text-white outline-none focus:border-[#28D160]"
                                        placeholder="e.g. players, goalies, longest_drive"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Name / Label</label>
                                    <input
                                        type="text"
                                        value={selectedEntry.name}
                                        onChange={e => setSelectedEntry({ ...selectedEntry, name: e.target.value })}
                                        className="w-full bg-black border border-white/10 p-4 rounded-xl text-white outline-none focus:border-[#28D160] text-lg font-black italic"
                                        placeholder="Player Name or Team Name"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Avatar URL</label>
                                    <input
                                        type="text"
                                        value={selectedEntry.avatar_url || ''}
                                        onChange={e => setSelectedEntry({ ...selectedEntry, avatar_url: e.target.value })}
                                        className="w-full bg-black border border-white/10 p-4 rounded-xl text-white outline-none focus:border-[#28D160]"
                                        placeholder="https://..."
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Team (Optional)</label>
                                    <input
                                        type="text"
                                        value={selectedEntry.team || ''}
                                        onChange={e => setSelectedEntry({ ...selectedEntry, team: e.target.value })}
                                        className="w-full bg-black border border-white/10 p-4 rounded-xl text-white outline-none focus:border-[#28D160]"
                                        placeholder="e.g. RHINOS"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Rank</label>
                                    <input
                                        type="number"
                                        value={selectedEntry.rank}
                                        onChange={e => setSelectedEntry({ ...selectedEntry, rank: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-black border border-white/10 p-4 rounded-xl text-white outline-none focus:border-[#28D160]"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Division / Level</label>
                                    <input
                                        type="text"
                                        value={selectedEntry.division}
                                        onChange={e => setSelectedEntry({ ...selectedEntry, division: e.target.value })}
                                        className="w-full bg-black border border-white/10 p-4 rounded-xl text-white outline-none focus:border-[#28D160]"
                                        placeholder="All, U9, Pro, etc."
                                    />
                                </div>
                            </div>

                            {/* Stats Manager */}
                            <div className="bg-black/40 p-6 rounded-2xl border border-white/5 mb-8">
                                <h3 className="text-xs font-black uppercase text-gray-400 mb-4 flex items-center gap-2">
                                    <Activity size={14} /> Stats Data (Numbers/Text)
                                </h3>

                                <div className="space-y-3 mb-6">
                                    {Object.entries(selectedEntry.stats || {}).map(([key, value]: [string, any]) => (
                                        <div key={key} className="flex items-center gap-2 bg-white/5 p-3 rounded-xl border border-white/5">
                                            <div className="flex-1">
                                                <div className="text-[8px] font-black uppercase text-gray-500 tracking-widest">{key}</div>
                                                <input
                                                    type="text"
                                                    value={value}
                                                    onChange={e => updateStat(key, e.target.value)}
                                                    className="bg-transparent border-none p-0 text-white font-black italic focus:ring-0 w-full"
                                                />
                                            </div>
                                            <button
                                                onClick={() => removeStat(key)}
                                                className="text-gray-600 hover:text-red-500 p-1"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-2">
                                    <input
                                        placeholder="Stat Key (e.g. goals)"
                                        value={statKey}
                                        onChange={e => setStatKey(e.target.value)}
                                        className="flex-1 bg-black border border-white/10 p-3 rounded-xl text-xs outline-none focus:border-[#28D160]"
                                    />
                                    <input
                                        placeholder="Value"
                                        value={statValue}
                                        onChange={e => setStatValue(e.target.value)}
                                        className="w-24 bg-black border border-white/10 p-3 rounded-xl text-xs outline-none focus:border-[#28D160]"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (statKey) {
                                                updateStat(statKey, statValue);
                                                setStatKey('');
                                                setStatValue('');
                                            }
                                        }}
                                        className="bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-colors"
                                        aria-label="Add Stat"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                                <p className="text-[9px] text-gray-600 mt-4 italic">* For Hockey points, the UI calculates Goals + Assists, but you can also define specific keys like "pts" for other sports.</p>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex-1 bg-[#28D160] text-black font-black italic uppercase py-4 rounded-xl hover:bg-white transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isSaving ? 'SAVING...' : <><Save size={20} /> Save Entry</>}
                                </button>
                                <button
                                    onClick={() => setSelectedEntry(null)}
                                    className="px-8 bg-white/5 text-gray-400 font-black italic uppercase rounded-xl hover:bg-white/10 transition-all border border-white/5"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center bg-[#1e1e1e] rounded-2xl border border-white/5 border-dashed p-20 text-center text-gray-600">
                            <Shield size={48} className="mb-4 opacity-20" />
                            <h3 className="text-xl font-black italic uppercase tracking-tighter mb-2">Editor Inactive</h3>
                            <p className="text-xs font-bold uppercase tracking-widest max-w-xs">Select an entry from the list or create a new one to start managing the leaderboard.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
