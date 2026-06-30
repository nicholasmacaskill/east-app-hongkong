'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import { Search, Save, CheckCircle } from 'lucide-react';
import { useToast } from '@/app/components/ui/Toast';
import { formatHK } from '@/app/lib/dateUtils';
import { STAT_FIELDS, SportCategory } from '@/app/lib/statFields';

export default function StatsManagementPage() {
    const [selectedSport, setSelectedSport] = useState<SportCategory>('GOLF');
    const [players, setPlayers] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
    const [stats, setStats] = useState<Record<string, any>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<string | null>(null);
    const { addToast } = useToast();

    // Fetch Players based on search
    useEffect(() => {
        const fetchPlayers = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, team, avatar_url')
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
            const { data } = await supabase
                .from('players_stats')
                .select('stats')
                .eq('player_id', selectedPlayer.id)
                .eq('category', selectedSport)
                .single();

            if (data?.stats) {
                setStats(data.stats);
            } else {
                // Initialize empty stats for this sport
                const fields = STAT_FIELDS[selectedSport] || [];
                const emptyStats: Record<string, any> = {};
                fields.forEach((field: any) => {
                    emptyStats[field.key] = field.type === 'number' ? 0 : '';
                });
                setStats(emptyStats);
            }
        };
        fetchStats();
    }, [selectedPlayer, selectedSport]);

    // Validate time format (mm:ss or mm:ss.ms)
    const isValidTime = (time: string, withMs = false): boolean => {
        if (!time || time === '') return true; // Allow empty
        if (withMs) {
            // Accepts mm:ss.ms e.g. 03:45.250 or 03:45.25
            const timeRegex = /^([0-5]?[0-9]):([0-5][0-9])(\.\d{1,3})?$/;
            return timeRegex.test(time);
        }
        const timeRegex = /^([0-5]?[0-9]):([0-5][0-9])$/;
        return timeRegex.test(time);
    };

    const handleSave = async () => {
        if (!selectedPlayer) return;

        // Validate all time fields
        const fields = STAT_FIELDS[selectedSport] || [];
        const timeFields = fields.filter((f: any) => f.type === 'time' || f.type === 'time-ms');
        for (const field of timeFields) {
            const value = stats[field.key];
            const withMs = field.type === 'time-ms';
            if (value && !isValidTime(value, withMs)) {
                const example = withMs ? '03:45.250' : '05:30';
                addToast(`Invalid time format for ${field.label}. Use ${field.unit} (e.g., ${example})`, 'error');
                return;
            }
        }

        setIsSaving(true);

        const payload = {
            playerId: selectedPlayer.id,
            category: selectedSport.toUpperCase(),
            stats: stats,
            verified: true
        };

        try {
            const res = await fetch('/api/admin/player-stats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            setIsSaving(false);
            if (!res.ok) {
                const data = await res.json();
                addToast('Error saving stats: ' + (data.error || res.statusText), 'error');
            } else {
                setLastSaved(formatHK(new Date(), 'h:mm:ss a'));
                addToast('Stats saved successfully!', 'success');
            }
        } catch (err: any) {
            setIsSaving(false);
            addToast('Error saving stats: ' + err.message, 'error');
        }
    };

    const updateStat = (key: string, value: any, type: string) => {
        if (type === 'number') {
            setStats({ ...stats, [key]: parseInt(value) || 0 });
        } else {
            setStats({ ...stats, [key]: value });
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 font-montserrat pb-24 w-full overflow-x-hidden">
            <h1 className="text-3xl font-black italic uppercase mb-8 text-east-light">Stats Management</h1>

            {/* Sport Selector */}
            <div className="flex gap-3 mb-8">
                {[
                    { id: 'GOLF', label: 'Golf', icon: '⛳' },
                    { id: 'HYROX', label: 'HYROX', icon: '🏃' },
                    { id: 'HOCKEY', label: 'Hockey', icon: '🏒' },
                    { id: 'EAGL', label: 'EAGL', icon: '🦅' },
                    { id: 'FITNESS_TEST', label: 'Fitness Test', icon: '💪' }
                ].map(sport => (
                    <button
                        key={sport.id}
                        onClick={() => setSelectedSport(sport.id as any)}
                        className={`px-6 py-3 rounded-xl font-bold uppercase text-sm transition-all ${selectedSport === sport.id
                            ? 'bg-east-light text-black'
                            : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                    >
                        {sport.icon} {sport.label}
                    </button>
                ))}
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Player Search */}
                <div className="bg-[#1e1e1e] p-6 rounded-2xl border border-white/10">
                    <h2 className="text-xl font-bold uppercase mb-4 flex items-center gap-2">
                        <Search size={20} className="text-east-light" /> Search for Member
                    </h2>
                    <input
                        className="w-full bg-black/50 border border-white/20 p-4 rounded-xl text-white outline-none focus:border-east-light transition-all mb-4"
                        placeholder="Search by name..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <div className="max-h-[500px] overflow-y-auto space-y-2 pr-2">
                        {players.map(p => (
                            <button
                                key={p.id}
                                onClick={() => setSelectedPlayer(p)}
                                className={`w-full text-left p-4 rounded-xl border transition-all ${selectedPlayer?.id === p.id
                                    ? 'bg-east-light text-black border-east-light font-black'
                                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    {p.avatar_url && (
                                        <img src={p.avatar_url} className="w-10 h-10 rounded-full object-cover" alt="" />
                                    )}
                                    <div>
                                        <div className="uppercase truncate">{p.first_name} {p.last_name}</div>
                                        <div className="text-xs opacity-70">{p.team || 'NO TEAM'}</div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stats Entry Form */}
                <div className="bg-[#1e1e1e] p-6 rounded-2xl border border-white/10 relative">
                    {!selectedPlayer ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-2xl z-10">
                            <p className="text-gray-500 font-bold uppercase tracking-widest">Select a player to edit stats</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-black italic uppercase">{selectedPlayer.first_name} {selectedPlayer.last_name}</h2>
                                    <p className="text-east-light text-sm font-bold uppercase tracking-widest">{selectedPlayer.team}</p>
                                    <p className="text-gray-400 text-xs uppercase mt-1">{selectedSport} Stats</p>
                                </div>
                                {lastSaved && (
                                    <div className="flex items-center gap-1 text-green-500 text-xs font-bold uppercase animate-fadeIn">
                                        <CheckCircle size={12} /> Saved {lastSaved}
                                    </div>
                                )}
                            </div>

                            {/* Dynamic Fields */}
                            <div className="grid grid-cols-2 gap-4 mb-8 max-h-[500px] overflow-y-auto pr-2">
                                {(STAT_FIELDS[selectedSport] || []).map((field: any) => (
                                    <div key={field.key} className={field.key === 'course_name' ? 'col-span-2' : ''}>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">
                                            {field.label} {field.unit && `(${field.unit})`}
                                        </label>
                                        {(field.type === 'time' || field.type === 'time-ms') ? (
                                            <input
                                                type="text"
                                                placeholder={field.type === 'time-ms' ? 'mm:ss.ms' : 'mm:ss'}
                                                pattern={field.type === 'time-ms' ? '[0-9]{2}:[0-9]{2}\\.[0-9]{1,3}' : '[0-9]{2}:[0-9]{2}'}
                                                value={stats[field.key] || ''}
                                                onChange={e => updateStat(field.key, e.target.value, 'text')}
                                                className="w-full bg-black border border-white/20 p-3 rounded-lg text-xl font-black text-center focus:border-east-light outline-none"
                                            />
                                        ) : field.type === 'number' ? (
                                            <input
                                                type="number"
                                                value={stats[field.key] || 0}
                                                onChange={e => updateStat(field.key, e.target.value, 'number')}
                                                className="w-full bg-black border border-white/20 p-3 rounded-lg text-xl font-black text-center focus:border-east-light outline-none"
                                            />
                                        ) : field.type === 'dropdown' ? (
                                            <select
                                                value={stats[field.key] || ''}
                                                onChange={e => updateStat(field.key, e.target.value, 'text')}
                                                className="w-full bg-black border border-white/20 p-3 rounded-lg text-lg focus:border-east-light outline-none appearance-none"
                                            >
                                                <option value="" disabled>Select Division</option>
                                                {(field as any).options?.map((opt: string) => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type="text"
                                                value={stats[field.key] || ''}
                                                onChange={e => updateStat(field.key, e.target.value, 'text')}
                                                className="w-full bg-black border border-white/20 p-3 rounded-lg text-lg focus:border-east-light outline-none"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full bg-east-light text-black font-black italic uppercase py-4 rounded-xl text-lg hover:bg-white transition-all shadow-lg flex justify-center items-center gap-2 disabled:opacity-50"
                            >
                                <Save size={20} /> {isSaving ? 'Saving...' : 'Save Stats'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
