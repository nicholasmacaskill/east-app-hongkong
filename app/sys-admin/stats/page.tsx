'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import { Search, Save, CheckCircle } from 'lucide-react';
import { useToast } from '@/app/components/ui/Toast';

export default function ManualStatsPage() {
    const [players, setPlayers] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
    const [stats, setStats] = useState({
        goals_season: 0,
        assists_season: 0,
        games_played_season: 0,
        pim: 0
    });
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<string | null>(null);
    const { addToast } = useToast();

    // Fetch Players
    useEffect(() => {
        const fetchPlayers = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, team')
                .eq('role', 'player')
                .ilike('first_name', `%${searchTerm}%`)
                .order('first_name');
            if (data) setPlayers(data);
        };
        const timeout = setTimeout(fetchPlayers, 300);
        return () => clearTimeout(timeout);
    }, [searchTerm]);

    // Fetch Stats when player selected
    useEffect(() => {
        if (!selectedPlayer) return;
        const fetchStats = async () => {
            // Try to find existing stats
            const { data } = await supabase
                .from('players_stats')
                .select('*')
                .eq('player_id', selectedPlayer.id)
                .single();

            if (data) {
                setStats({
                    goals_season: data.goals_season || 0,
                    assists_season: data.assists_season || 0,
                    games_played_season: data.games_played_season || 0,
                    pim: data.pim || 0
                });
            } else {
                // Reset if no stats found (new player)
                setStats({ goals_season: 0, assists_season: 0, games_played_season: 0, pim: 0 });
            }
        };
        fetchStats();
    }, [selectedPlayer]);

    const handleSave = async () => {
        if (!selectedPlayer) return;
        setIsSaving(true);

        const payload = {
            player_id: selectedPlayer.id,
            ...stats,
            points: (parseInt(stats.goals_season as any) || 0) + (parseInt(stats.assists_season as any) || 0),
            is_verified: true,
            verified_at: new Date().toISOString()
        };

        // Upsert stats
        const { error } = await supabase
            .from('players_stats')
            .upsert(payload, { onConflict: 'player_id' });

        setIsSaving(false);
        if (error) {
            addToast('Error saving stats: ' + error.message, 'error');
        } else {
            setLastSaved(new Date().toLocaleTimeString());
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 font-montserrat pb-24">
            <h1 className="text-3xl font-black italic uppercase mb-8 text-east-light">Coach Stats Entry</h1>

            <div className="grid md:grid-cols-2 gap-8">
                {/* 1. Player Search */}
                <div className="bg-[#1e1e1e] p-6 rounded-2xl border border-white/10">
                    <h2 className="text-xl font-bold uppercase mb-4 flex items-center gap-2">
                        <Search size={20} className="text-east-light" /> Select Player
                    </h2>
                    <input
                        className="w-full bg-black/50 border border-white/20 p-4 rounded-xl text-white outline-none focus:border-east-light transition-all mb-4"
                        placeholder="Search by First Name..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                        {players.map(p => (
                            <button
                                key={p.id}
                                onClick={() => setSelectedPlayer(p)}
                                className={`w-full text-left p-4 rounded-xl border transition-all ${selectedPlayer?.id === p.id
                                    ? 'bg-east-light text-black border-east-light font-black'
                                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                                    }`}
                            >
                                <div className="uppercase">{p.first_name} {p.last_name}</div>
                                <div className={`text-[8px] px-2 py-0.5 rounded-full inline-block border mt-1 font-black uppercase tracking-widest ${p.team === 'EAST HK' ? 'bg-east-light/10 text-east-light border-east-light/20' :
                                        p.team === 'NORTH HK' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                            'bg-white/5 text-gray-500 border-white/5'
                                    }`}>
                                    {p.team || 'NO TEAM'}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2. Stats Entry Form */}
                <div className="bg-[#1e1e1e] p-6 rounded-2xl border border-white/10 relative">
                    {!selectedPlayer ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-2xl z-10">
                            <p className="text-gray-500 font-bold uppercase tracking-widest">Select a player to edit details</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-black italic uppercase">{selectedPlayer.first_name} {selectedPlayer.last_name}</h2>
                                    <p className="text-east-light text-sm font-bold uppercase tracking-widest">{selectedPlayer.team}</p>
                                </div>
                                {lastSaved && (
                                    <div className="flex items-center gap-1 text-green-500 text-xs font-bold uppercase animate-fadeIn">
                                        <CheckCircle size={12} /> Saved {lastSaved}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Games Played</label>
                                    <input
                                        type="number"
                                        value={stats.games_played_season}
                                        onChange={e => setStats({ ...stats, games_played_season: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-black border border-white/20 p-3 rounded-lg text-2xl font-black text-center focus:border-east-light outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Penalty Mins</label>
                                    <input
                                        type="number"
                                        value={stats.pim}
                                        onChange={e => setStats({ ...stats, pim: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-black border border-white/20 p-3 rounded-lg text-2xl font-black text-center focus:border-east-light outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-east-light uppercase tracking-widest mb-1 block">Goals</label>
                                    <input
                                        type="number"
                                        value={stats.goals_season}
                                        onChange={e => setStats({ ...stats, goals_season: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-black border border-east-light/50 p-3 rounded-lg text-4xl font-black italic text-center focus:border-east-light outline-none text-east-light"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-east-light uppercase tracking-widest mb-1 block">Assists</label>
                                    <input
                                        type="number"
                                        value={stats.assists_season}
                                        onChange={e => setStats({ ...stats, assists_season: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-black border border-east-light/50 p-3 rounded-lg text-4xl font-black italic text-center focus:border-east-light outline-none text-east-light"
                                    />
                                </div>
                            </div>

                            <div className="bg-white/5 p-4 rounded-xl mb-6 flex justify-between items-center border border-white/5">
                                <span className="text-sm font-bold uppercase text-gray-400">Total Points</span>
                                <span className="text-4xl font-black italic text-white">{(stats.goals_season || 0) + (stats.assists_season || 0)}</span>
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full bg-east-light text-black font-black italic uppercase py-4 rounded-xl text-lg hover:bg-white transition-all shadow-lg flex justify-center items-center gap-2 disabled:opacity-50"
                            >
                                <Save size={20} /> {isSaving ? 'Saving...' : 'Update Stats'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
