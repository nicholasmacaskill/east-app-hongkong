'use client';
import { useState, useEffect } from 'react';
import { Trophy, Flame, Star, Shield, Users, ChevronLeft, Flag, Target, PlusCircle, ChevronDown, Activity } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/app/lib/supabase';
import { MOCK_PLAYERS, MOCK_TEAMS, MOCK_GOALIES, MOCK_HYROX } from './mockData';
// UploadGolfStatsModal removed

export default function LeaderboardPage() {
    const [sport, setSport] = useState<'hockey' | 'golf' | 'hyrox'>('hockey');
    const [activeTab, setActiveTab] = useState<'players' | 'goalies' | 'teams'>('players');
    const [filter, setFilter] = useState<'points' | 'goals' | 'assists'>('points');
    const [goalieFilter, setGoalieFilter] = useState<'gaa' | 'sv' | 'w' | 'so'>('gaa');
    const [golfFilter, setGolfFilter] = useState<'longest_drive' | 'closest_to_pin' | 'rounds' | 'average_score' | 'tournament_wins' | 'league_wins'>('rounds');
    const [hyroxFilter, setHyroxFilter] = useState<keyof typeof MOCK_HYROX[0]['stats']>('ski_erg');

    // Filter Dropdowns
    const [year, setYear] = useState('2025-2026 Winter');
    const [division, setDivision] = useState('All');

    // Golf State
    const [golfLeaders, setGolfLeaders] = useState<any[]>([]);
    const [loadingGolf, setLoadingGolf] = useState(false);
    // Upload modal state removed
    const [currentUserStats, setCurrentUserStats] = useState<any>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setCurrentUserId(user.id);
        };
        checkUser();
    }, []);

    const fetchGolfStats = async () => {
        setLoadingGolf(true);
        try {
            const { data: statsData, error: statsError } = await supabase
                .from('golf_stats')
                .select('*');

            if (statsError) {
                console.error("❌ Error fetching golf stats:", statsError);
                return;
            }

            if (statsData && statsData.length > 0) {
                const playerIds = Array.from(new Set(statsData.map(s => s.player_id)));

                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id,first_name,last_name,avatar_url,team')
                    .in('id', playerIds);

                const mergedData = statsData.map(stat => {
                    const profile = profilesData?.find(p => p.id === stat.player_id);
                    return {
                        ...stat,
                        profiles: profile || null
                    };
                });

                if (currentUserId) {
                    const myStats = mergedData.find(s => s.player_id === currentUserId);
                    if (myStats) setCurrentUserStats(myStats);
                }
                setGolfLeaders(mergedData);
            } else {
                setGolfLeaders([]);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingGolf(false);
        }
    };

    useEffect(() => {
        if (sport === 'golf') {
            fetchGolfStats();
        }
    }, [sport, currentUserId]);


    // Sort Logic
    const sortedHockeyPlayers = [...MOCK_PLAYERS].sort((a, b) => {
        const valA = filter === 'points' ? a.stats.points : filter === 'goals' ? a.stats.goals : a.stats.assists;
        const valB = filter === 'points' ? b.stats.points : filter === 'goals' ? b.stats.goals : b.stats.assists;
        return valB - valA;
    });

    const sortedGoalies = [...MOCK_GOALIES].sort((a, b) => {
        if (goalieFilter === 'gaa') return a.stats.gaa - b.stats.gaa;
        return b.stats[goalieFilter] - a.stats[goalieFilter];
    });

    const sortedGolfPlayers = [...golfLeaders].sort((a, b) => {
        if (golfFilter === 'average_score') return (a[golfFilter] || 100) - (b[golfFilter] || 100);
        return (b[golfFilter] || 0) - (a[golfFilter] || 0);
    });

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
                                onClick={() => setSport(item.id as any)}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-full uppercase text-[10px] font-black italic tracking-widest transition-all duration-300 border ${sport === item.id ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-105' : 'bg-white/5 text-gray-500 border-white/10 hover:border-white/30'}`}
                            >
                                {item.icon} {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* HOCKEY VIEW */}
                {sport === 'hockey' && (
                    <div className="animate-slideUp">
                        {/* HOCKEY TABS */}
                        <div className="flex justify-center gap-8 mb-8">
                            {[
                                { id: 'players', label: 'Player Leaders' },
                                { id: 'goalies', label: 'Goalie Leaders' },
                                { id: 'teams', label: 'Team Standings' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`font-black italic text-[11px] uppercase transition-all tracking-widest relative pb-2 ${activeTab === tab.id ? 'text-east-light' : 'text-gray-600 hover:text-gray-400'}`}
                                >
                                    {tab.label}
                                    {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-east-light" />}
                                </button>
                            ))}
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

                        {/* CONTENT */}
                        {activeTab === 'players' && (
                            <>
                                <div className="flex justify-center gap-3 mb-8 overflow-x-auto no-scrollbar px-2">
                                    {['points', 'goals', 'assists'].map(f => (
                                        <button
                                            key={f}
                                            onClick={() => setFilter(f as any)}
                                            className={`px-8 py-2.5 rounded-full border uppercase font-black italic text-[11px] tracking-[0.2em] transition-all duration-300 ${filter === f ? 'bg-east-light text-black border-east-light shadow-[0_0_15px_rgba(40,209,96,0.3)]' : 'bg-transparent border-white/10 text-gray-600 hover:border-white/30'}`}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex flex-col gap-3 max-w-md mx-auto">
                                    {sortedHockeyPlayers.map((player, i) => (
                                        <div key={player.id} className={`group relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-500 overflow-hidden ${i === 0 ? 'bg-gray-900/50 border-east-light' : 'bg-[#050505] border-white/5 hover:border-white/20'}`}>
                                            <div className="w-10 font-black italic text-2xl text-white/20 group-hover:text-east-light transition-colors">{i + 1}</div>
                                            <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white/5 group-hover:border-east-light/50 transition-all shadow-xl shrink-0">
                                                <img src={player.avatar || "https://placehold.co/100"} className="w-full h-full object-cover" alt={player.name} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-black italic uppercase text-base text-white tracking-tight truncate">{player.name}</h3>
                                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest truncate">{player.team}</p>
                                            </div>
                                            <div className="text-right pr-2 shrink-0">
                                                <div className="font-black italic text-3xl text-white group-hover:scale-110 transition-transform duration-300">
                                                    {filter === 'points' ? player.stats.points : filter === 'goals' ? player.stats.goals : player.stats.assists}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {activeTab === 'goalies' && (
                            <>
                                <div className="flex justify-center gap-3 mb-8 overflow-x-auto no-scrollbar px-2">
                                    {[
                                        { id: 'gaa', label: 'GAA' },
                                        { id: 'sv', label: 'SV%' },
                                        { id: 'w', label: 'Wins' },
                                        { id: 'so', label: 'SO' }
                                    ].map(f => (
                                        <button
                                            key={f.id}
                                            onClick={() => setGoalieFilter(f.id as any)}
                                            className={`px-8 py-2.5 rounded-full border uppercase font-black italic text-[11px] tracking-[0.2em] transition-all duration-300 ${goalieFilter === f.id ? 'bg-east-light text-black border-east-light shadow-[0_0_15px_rgba(40,209,96,0.3)]' : 'bg-transparent border-white/10 text-gray-600 hover:border-white/30'}`}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex flex-col gap-3 max-w-md mx-auto">
                                    {sortedGoalies.map((goalie, i) => (
                                        <div key={goalie.id} className="group relative flex items-center gap-4 p-4 rounded-2xl border border-white/5 bg-[#050505] hover:border-white/20 transition-all duration-500">
                                            <div className="w-10 font-black italic text-2xl text-white/20">{i + 1}</div>
                                            <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white/5 group-hover:border-east-light/50 transition-all shrink-0">
                                                <img src={goalie.avatar || "https://placehold.co/100"} className="w-full h-full object-cover" alt={goalie.name} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-black italic uppercase text-base text-white tracking-tight truncate">{goalie.name}</h3>
                                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest truncate">{goalie.team}</p>
                                            </div>
                                            <div className="text-right pr-2 shrink-0">
                                                <div className="font-black italic text-3xl text-white group-hover:scale-110 transition-transform">
                                                    {goalieFilter === 'sv' ? goalie.stats.sv.toFixed(3) : goalie.stats[goalieFilter]}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {activeTab === 'teams' && (
                            <div className="flex flex-col gap-4 max-w-md mx-auto pb-10">
                                <div className="grid grid-cols-12 gap-2 px-6 mb-2 text-[9px] font-black text-gray-600 uppercase tracking-[0.3em]">
                                    <div className="col-span-1">#</div>
                                    <div className="col-span-6 pl-4">Team</div>
                                    <div className="col-span-2 text-center">GP</div>
                                    <div className="col-span-3 text-right">PTS</div>
                                </div>
                                {MOCK_TEAMS.map((team, i) => (
                                    <div key={i} className="relative grid grid-cols-12 gap-2 items-center p-6 rounded-2xl border border-white/5 bg-[#050505] hover:border-white/20 transition-all group">
                                        <div className="col-span-1 font-black italic text-xl text-east-light">{team.rank}</div>
                                        <div className="col-span-6 flex items-center gap-4 pl-4 font-black italic uppercase text-white tracking-wider truncate">{team.name}</div>
                                        <div className="col-span-2 font-black text-gray-500 text-sm text-center italic">{team.gp}</div>
                                        <div className="col-span-3 font-black italic text-white text-3xl text-right group-hover:scale-110 transition-transform">{team.pts}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* GOLF VIEW */}
                {sport === 'golf' && (
                    <div className="animate-fadeIn">
                        <div className="flex justify-center items-center max-w-md mx-auto mb-8 px-2">
                            <h2 className="text-2xl font-black italic uppercase text-white tracking-tight">Leaderboard</h2>
                        </div>

                        <div className="flex justify-center gap-3 mb-10 overflow-x-auto no-scrollbar pb-2 px-2">
                            {[
                                { id: 'rounds', label: 'Rounds' },
                                { id: 'average_score', label: 'Avg Score' },
                                { id: 'longest_drive', label: 'Longest Drive' },
                                { id: 'closest_to_pin', label: 'Closest to Pin' },
                                { id: 'tournament_wins', label: 'Tournament Wins' },
                                { id: 'league_wins', label: 'League Wins' }
                            ].map(f => (
                                <button
                                    key={f.id}
                                    onClick={() => setGolfFilter(f.id as any)}
                                    className={`px-6 py-2.5 rounded-full border uppercase font-black italic text-[10px] tracking-widest transition-all duration-300 whitespace-nowrap ${golfFilter === f.id ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-transparent border-white/10 text-gray-600 hover:border-white/30'}`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>

                        {loadingGolf ? (
                            <div className="text-center text-gray-500 font-bold animate-pulse uppercase text-xs py-20 tracking-widest">Loading Professional Data...</div>
                        ) : sortedGolfPlayers.length === 0 ? (
                            <div className="text-center text-gray-600 font-bold uppercase text-[10px] py-20 bg-white/5 rounded-3xl border border-white/5 border-dashed mx-auto max-w-md">
                                <Target size={40} className="mx-auto mb-4 opacity-20" />
                                No results recorded yet.
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3 max-w-md mx-auto">
                                {sortedGolfPlayers.map((stat, i) => (
                                    <div key={stat.id} className={`group relative flex items-center gap-4 p-5 rounded-2xl border transition-all duration-500 ${i === 0 ? 'bg-gray-900/40 border-white/40 shadow-[0_0_30px_rgba(255,255,255,0.05)]' : 'bg-[#050505] border-white/5 hover:border-white/20'}`}>
                                        <div className={`w-10 font-black italic text-2xl ${i === 0 ? 'text-white' : 'text-white/10'} group-hover:text-white transition-colors`}>{i + 1}</div>
                                        <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white/10 group-hover:border-white/40 transition-all shrink-0">
                                            <img src={stat.profiles?.avatar_url || "https://placehold.co/100"} className="w-full h-full object-cover" alt="Avatar" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-black italic uppercase text-base text-white tracking-tight truncate">{stat.profiles?.first_name} {stat.profiles?.last_name}</h3>
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest truncate">PRO DIVISION</p>
                                        </div>
                                        <div className="text-right pr-2 shrink-0">
                                            <div className="font-black italic text-4xl text-white group-hover:scale-110 transition-transform">{stat[golfFilter]}</div>
                                            <div className="text-[8px] font-black text-white/30 uppercase tracking-widest italic">{golfFilter.replace('_', ' ')}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* HYROX VIEW */}
                {sport === 'hyrox' && (
                    <div className="animate-fadeIn">
                        <div className="max-w-md mx-auto mb-8 px-2 flex flex-col items-center text-center">
                            <h2 className="text-3xl font-black italic uppercase text-white tracking-tighter">Leaderboard</h2>
                            <p className="text-[10px] font-black text-east-light uppercase tracking-widest italic mt-1">World Ranking</p>
                        </div>

                        <div className="flex justify-center gap-3 mb-10 overflow-x-auto no-scrollbar pb-2 px-2">
                            {[
                                { id: 'ski_erg', label: 'Ski Erg' },
                                { id: 'sled_push', label: 'Sled Push' },
                                { id: 'sled_pull', label: 'Sled Pull' },
                                { id: 'burpee_jumps', label: 'Burpees' },
                                { id: 'row', label: 'Row' },
                                { id: 'farmers_carry', label: 'Farmers' },
                                { id: 'sandbag_lunges', label: 'Lunges' },
                                { id: 'wall_balls', label: 'Wall Balls' }
                            ].map(f => (
                                <button
                                    key={f.id}
                                    onClick={() => setHyroxFilter(f.id as any)}
                                    className={`px-6 py-2.5 rounded-full border uppercase font-black italic text-[10px] tracking-widest transition-all duration-300 whitespace-nowrap ${hyroxFilter === f.id ? 'bg-east-light text-black border-east-light shadow-[0_0_15px_rgba(40,209,96,0.3)]' : 'bg-transparent border-white/10 text-gray-600 hover:border-white/30'}`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-col gap-3 max-w-md mx-auto">
                            {MOCK_HYROX.map((stat, i) => (
                                <div key={stat.id} className="group relative flex items-center gap-4 p-4 rounded-2xl border border-white/5 bg-[#050505] hover:border-white/20 transition-all duration-500">
                                    <div className="w-10 font-black italic text-3xl text-white/10 group-hover:text-east-light transition-colors">{i + 1}</div>
                                    <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-white/5 group-hover:border-east-light/50 transition-all shadow-2xl shrink-0">
                                        <img src={stat.avatar || "https://placehold.co/100"} className="w-full h-full object-cover" alt={stat.name} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-black italic uppercase text-lg text-white tracking-tight truncate">{stat.name}</h3>
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic truncate">{stat.category}</p>
                                    </div>
                                    <div className="text-right pr-2 shrink-0">
                                        <div className="font-black italic text-3xl text-east-light group-hover:scale-110 transition-transform duration-300">{stat.stats[hyroxFilter]}</div>
                                        <div className="text-[8px] font-black text-gray-600 uppercase tracking-widest mt-1">TIME / REPS</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>


        </div>
    );
}

