// app/stats/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { Trophy, Flame, Star, Shield, Users, ChevronLeft, Flag, Target, PlusCircle, ChevronDown, Activity, User } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/app/lib/supabase';

export default function LeaderboardPage() {
    const [sport, setSport] = useState<'hockey' | 'golf' | 'hyrox' | 'team_standings'>('hockey');
    const [activeTab, setActiveTab] = useState<string>('players');
    const [filter, setFilter] = useState<string>('points');

    // Filter Dropdowns
    const [year, setYear] = useState('2025-2026 Winter');
    const [division, setDivision] = useState('All');

    // Data State
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDynamicEntries();
    }, [sport, year, division]);

    const fetchDynamicEntries = async () => {
        setLoading(true);
        try {
            const url = `/api/admin/leaderboard?sport=${sport}&year=${year}&division=${division}`;
            const res = await fetch(url);
            const data = await res.json();

            // Defensively ensure data is an array
            const entriesData = Array.isArray(data) ? data : [];

            // Auto-select tab if possible
            if (entriesData.length > 0) {
                const categories = Array.from(new Set(entriesData.map((e: any) => e.category)));
                if (!categories.includes(activeTab)) {
                    setActiveTab(categories[0] as string);
                }
            }

            setEntries(entriesData);
        } catch (err) {
            console.error('Failed to fetch leaderboard data:', err);
            setEntries([]); // Reset to empty array on error
        } finally {
            setLoading(false);
        }
    };

    // Filtered data based on active tab - add defensive check
    const filteredEntries = (Array.isArray(entries) ? entries : []).filter(e => e.category === activeTab);

    // Filter tabs based on sport
    const hockeyTabs = [
        { id: 'players', label: 'Player Leaders' },
        { id: 'goalies', label: 'Goalie Leaders' },
        { id: 'teams', label: 'Team Standings' }
    ];

    const golfFilters = [
        { id: 'rounds', label: 'Rounds' },
        { id: 'average_score', label: 'Avg Score' },
        { id: 'longest_drive', label: 'Longest Drive' },
        { id: 'closest_to_pin', label: 'Closest to Pin' },
        { id: 'tournament_wins', label: 'Tournament Wins' },
        { id: 'league_wins', label: 'League Wins' }
    ];

    const hyroxFilters = [
        { id: 'ski_erg', label: 'Ski Erg' },
        { id: 'sled_push', label: 'Sled Push' },
        { id: 'sled_pull', label: 'Sled Pull' },
        { id: 'burpee_jumps', label: 'Burpees' },
        { id: 'row', label: 'Row' },
        { id: 'farmers_carry', label: 'Farmers' },
        { id: 'sandbag_lunges', label: 'Lunges' },
        { id: 'wall_balls', label: 'Wall Balls' }
    ];

    return (
        <div className="min-h-screen bg-black text-white p-0 pb-24 font-montserrat animate-fadeIn relative overflow-hidden select-none">
            {/* Background Layer */}
            <div className="fixed inset-0 z-0 opacity-20 transition-all duration-700 grayscale">
                <img
                    src={sport === 'hockey'
                        ? "https://images.unsplash.com/photo-1580748141549-71748ddf0bdc?auto=format&fit=crop&q=80&w=1200"
                        : sport === 'golf'
                            ? "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&q=80&w=1200"
                            : "https://images.unsplash.com/photo-1594882645126-14020914d58d?auto=format&fit=crop&q=80&w=1200"
                    }
                    className="w-full h-full object-cover"
                    alt="bg"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black via-black/40 to-black" />
            </div>

            <div className="relative z-10 px-4 pt-12 max-w-5xl mx-auto">
                <Link href="/" className="absolute left-4 top-10 z-50 text-white hover:text-east-light transition-colors backdrop-blur-md p-2 rounded-full border border-white/20 bg-black/60 shadow-lg">
                    <ChevronLeft size={24} />
                </Link>

                <div className="text-center mb-10">
                    <h1 className="text-[5.5rem] leading-none font-black italic text-stroke-thin text-transparent uppercase opacity-5 absolute top-4 left-1/2 -translate-x-1/2 select-none whitespace-nowrap tracking-tighter w-full">SEASON STATS</h1>
                    <h1 className="text-5xl font-black italic uppercase relative z-10 text-white tracking-tight drop-shadow-2xl">Season Stats</h1>

                    {/* SPORT SELECTOR */}
                    <div className="flex justify-center gap-3 mt-8">
                        {[
                            { id: 'hockey', icon: <Shield size={14} />, label: 'Hockey' },
                            { id: 'golf', icon: <Flag size={14} />, label: 'Golf' },
                            { id: 'hyrox', icon: <Activity size={14} />, label: 'Hyrox' }
                        ].map(item => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setSport(item.id as any);
                                    if (item.id === 'hockey') setActiveTab('players');
                                    else if (item.id === 'golf') setActiveTab('rounds');
                                    else if (item.id === 'hyrox') setActiveTab('ski_erg');
                                }}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-full uppercase text-[10px] font-black italic tracking-widest transition-all duration-300 border ${sport === item.id ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-105' : 'bg-white/5 text-gray-500 border-white/10 hover:border-white/30'}`}
                            >
                                {item.icon} {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* YEAR & DIVISION DROPDOWNS */}
                <div className="flex justify-center gap-4 mb-10 max-w-sm mx-auto">
                    <div className="flex-1 relative">
                        <select
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 px-4 text-[10px] font-black italic uppercase tracking-widest appearance-none text-white focus:outline-none focus:border-east-light transition-colors"
                        >
                            <option>2025-2026 Winter</option>
                            <option>2026 Summer (Coming Soon)</option>
                            <option>2025 Summer</option>
                            <option>All Time</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-east-light pointer-events-none" />
                    </div>
                    <div className="flex-1 relative">
                        <select
                            value={division}
                            onChange={(e) => setDivision(e.target.value)}
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 px-4 text-[10px] font-black italic uppercase tracking-widest appearance-none text-white focus:outline-none focus:border-east-light transition-colors"
                        >
                            {['All', 'U9', 'U11', 'U13', 'U15', 'Pro Dev', '3v3'].map(d => <option key={d}>{d}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-east-light pointer-events-none" />
                    </div>
                </div>

                {/* HOCKEY SPECIFIC TABS */}
                {sport === 'hockey' && (
                    <div className="flex justify-center gap-8 mb-8">
                        {hockeyTabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`font-black italic text-[11px] uppercase transition-all tracking-widest relative pb-2 ${activeTab === tab.id ? 'text-east-light' : 'text-gray-600 hover:text-gray-400'}`}
                            >
                                {tab.label}
                                {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-east-light" />}
                            </button>
                        ))}
                    </div>
                )}

                {/* GOLF FILTER BUTTONS */}
                {sport === 'golf' && (
                    <div className="flex justify-center gap-3 mb-10 overflow-x-auto no-scrollbar pb-2 px-2">
                        {golfFilters.map(f => (
                            <button
                                key={f.id}
                                onClick={() => setActiveTab(f.id)}
                                className={`px-6 py-2.5 rounded-full border uppercase font-black italic text-[10px] tracking-widest transition-all duration-300 whitespace-nowrap ${activeTab === f.id ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-transparent border-white/10 text-gray-600 hover:border-white/30'}`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* HYROX FILTER BUTTONS */}
                {sport === 'hyrox' && (
                    <div className="flex justify-center gap-3 mb-10 overflow-x-auto no-scrollbar pb-2 px-2">
                        {hyroxFilters.map(f => (
                            <button
                                key={f.id}
                                onClick={() => setActiveTab(f.id)}
                                className={`px-6 py-2.5 rounded-full border uppercase font-black italic text-[10px] tracking-widest transition-all duration-300 whitespace-nowrap ${activeTab === f.id ? 'bg-east-light text-black border-east-light shadow-[0_0_15px_rgba(40,209,96,0.3)]' : 'bg-transparent border-white/10 text-gray-600 hover:border-white/30'}`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* HOCKEY POINT FILTERS */}
                {sport === 'hockey' && activeTab === 'players' && (
                    <div className="flex justify-center gap-3 mb-8 overflow-x-auto no-scrollbar px-2">
                        {['points', 'goals', 'assists'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-8 py-2.5 rounded-full border uppercase font-black italic text-[11px] tracking-[0.2em] transition-all duration-300 ${filter === f ? 'bg-east-light text-black border-east-light shadow-[0_0_15px_rgba(40,209,96,0.3)]' : 'bg-transparent border-white/10 text-gray-600 hover:border-white/30'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                )}

                {/* DATA DISPLAY */}
                <div className="animate-slideUp max-w-md mx-auto min-h-[400px]">
                    {loading ? (
                        <div className="text-center py-20 animate-pulse font-black italic uppercase text-gray-600 tracking-widest text-[10px]">Syncing Professional Stats...</div>
                    ) : filteredEntries.length === 0 ? (
                        <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5 border-dashed">
                            <Target size={40} className="mx-auto mb-4 opacity-10" />
                            <p className="font-black italic uppercase text-gray-600 tracking-widest text-[10px]">No Data Recorded for this Selection</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {filteredEntries.map((entry, i) => (
                                <div key={entry.id} className={`group relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-500 overflow-hidden ${i === 0 ? 'bg-gray-900/40 border-[#28D160]/50 shadow-[0_0_30px_rgba(40,209,96,0.05)]' : 'bg-[#050505] border-white/5 hover:border-white/20'}`}>
                                    <div className={`w-8 font-black italic text-2xl ${i === 0 ? 'text-[#28D160]' : 'text-white/20'} group-hover:text-[#28D160] transition-colors`}>{entry.rank || i + 1}</div>
                                    <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white/5 group-hover:border-white/40 transition-all shrink-0">
                                        {entry.avatar_url ? (
                                            <img src={entry.avatar_url} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <div className="w-full h-full bg-gray-950 flex items-center justify-center text-gray-700">
                                                <User size={18} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-black italic uppercase text-sm text-white tracking-tight truncate">{entry.name}</h3>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest truncate">{entry.team || 'INDEPENDENT'}</p>
                                    </div>
                                    <div className="text-right pr-2 shrink-0">
                                        <div className="font-black italic text-2xl text-white group-hover:scale-110 transition-transform">
                                            {sport === 'hockey' && activeTab === 'players' ? (
                                                filter === 'points' ? (parseInt(entry.stats?.goals) || 0) + (parseInt(entry.stats?.assists) || 0) :
                                                    filter === 'goals' ? (entry.stats?.goals || 0) :
                                                        (entry.stats?.assists || 0)
                                            ) : (
                                                entry.stats?.[activeTab] || entry.stats?.[filter] || entry.stats?.points || entry.stats?.value || 0
                                            )}
                                        </div>
                                        <div className="text-[8px] font-black text-gray-600 uppercase tracking-widest mt-0.5">{activeTab}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

