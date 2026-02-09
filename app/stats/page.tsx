'use client';
import { useState, useEffect } from 'react';
import { Trophy, Flame, Star, Shield, Users, ChevronLeft, Flag, Target, Activity, User } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/app/lib/supabase';

// Field configurations matching CMS
const STAT_FIELDS = {
    golf: [
        { key: 'handicap', label: 'Handicap' },
        { key: 'longest_drive', label: 'Longest Drive' },
        { key: 'closest_to_pin', label: 'Closest to Pin' },
        { key: 'league_wins', label: 'League Wins' },
        { key: 'tournament_wins', label: 'Tournament Wins' }
    ],
    hyrox: [
        { key: 'run_1km', label: '1KM Run' },
        { key: 'ski_erg_1000m', label: 'Ski Erg' },
        { key: 'sled_push_50m', label: 'Sled Push' },
        { key: 'sled_pull_50m', label: 'Sled Pull' },
        { key: 'burpee_broad_jumps_80m', label: 'Burpees' },
        { key: 'row_1000m', label: 'Row' },
        { key: 'farmers_carry_200m', label: 'Farmers' },
        { key: 'sandbag_lunges_100m', label: 'Lunges' },
        { key: 'wall_balls_100', label: 'Wall Balls' }
    ],
    hockey: [
        { key: 'react_targets', label: 'React Targets' },
        { key: 'classic_targets', label: 'Classic Targets' }
    ]
};

export default function LeaderboardPage() {
    const [sport, setSport] = useState<'hockey' | 'golf' | 'hyrox'>('golf');
    const [activeFilter, setActiveFilter] = useState<string>('handicap');
    const [entries, setEntries] = useState<any[]>([]);
    const [currentUserStats, setCurrentUserStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        // Set default filter when sport changes
        setActiveFilter(STAT_FIELDS[sport][0].key);
    }, [sport]);

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUserId(user?.id || null);
        };
        getUser();
    }, []);

    useEffect(() => {
        fetchLeaderboard();
    }, [sport, activeFilter]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            // Ensure we have current user ID
            let userId = currentUserId;
            if (!userId) {
                const { data: { user } } = await supabase.auth.getUser();
                userId = user?.id || null;
                setCurrentUserId(userId);
            }

            const { data, error } = await supabase
                .from('players_stats')
                .select(`
                    stats,
                    player_id,
                    profiles!players_stats_player_id_fkey(id, first_name, last_name, team, avatar_url)
                `)
                .eq('category', sport)
                .not('stats->' + activeFilter, 'is', null);

            if (error) throw error;

            // Map and sort data
            const mappedEntries = (data || []).map((entry: any) => {
                const profile = Array.isArray(entry.profiles) ? entry.profiles[0] : entry.profiles;
                return {
                    id: profile?.id || entry.player_id,
                    name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Player',
                    team: profile?.team || 'INDEPENDENT',
                    avatar_url: profile?.avatar_url,
                    score: entry.stats[activeFilter],
                    stats: entry.stats
                };
            });

            // Sort based on sport and stat type
            const sorted = mappedEntries.sort((a, b) => {
                const aVal = a.score;
                const bVal = b.score;

                // For time-based stats (mm:ss), lower is better
                if (typeof aVal === 'string' && aVal.includes(':')) {
                    const aSeconds = timeToSeconds(aVal);
                    const bSeconds = timeToSeconds(bVal);
                    return aSeconds - bSeconds;
                }

                // For golf scores, lower is better
                if (sport === 'golf' && (activeFilter === 'handicap' || activeFilter === 'round_score')) {
                    return (parseFloat(aVal) || 999) - (parseFloat(bVal) || 999);
                }

                // For everything else, higher is better
                return (parseFloat(bVal) || 0) - (parseFloat(aVal) || 0);
            });

            // Find current user's stats and rank from FULL list
            if (userId) {
                const userIndex = sorted.findIndex(e => e.id === userId);
                if (userIndex !== -1) {
                    setCurrentUserStats({
                        ...sorted[userIndex],
                        rank: userIndex + 1
                    });
                } else {
                    setCurrentUserStats(null);
                }
            } else {
                setCurrentUserStats(null);
            }

            // Set visible entries (top 10)
            setEntries(sorted.slice(0, 10));
        } catch (error) {
            console.error('Failed to fetch leaderboard:', error);
            setEntries([]);
            setCurrentUserStats(null);
        } finally {
            setLoading(false);
        }
    };

    const timeToSeconds = (time: string): number => {
        if (!time || !time.includes(':')) return 999999;
        const [mins, secs] = time.split(':').map(Number);
        return (mins * 60) + secs;
    };

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
                                className={`px-8 py-3 rounded-full border uppercase font-black italic text-[11px] tracking-[0.2em] transition-all duration-300 ${sport === item.id ? 'bg-east-light text-black border-east-light shadow-[0_0_20px_rgba(40,209,96,0.4)]' : 'bg-transparent border-white/10 text-gray-600 hover:border-white/30'}`}
                            >
                                <div className="flex items-center gap-2">
                                    {item.icon}
                                    {item.label}
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* STAT CATEGORY FILTERS */}
                    <div className="flex justify-center gap-2 mt-8 mb-10 overflow-x-auto no-scrollbar pb-2 px-2 flex-wrap">
                        {STAT_FIELDS[sport].map(field => (
                            <button
                                key={field.key}
                                onClick={() => setActiveFilter(field.key)}
                                className={`px-6 py-2.5 rounded-full border uppercase font-black italic text-[10px] tracking-widest transition-all duration-300 whitespace-nowrap ${activeFilter === field.key
                                    ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                                    : 'bg-transparent border-white/10 text-gray-600 hover:border-white/30'
                                    }`}
                            >
                                {field.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* LEADERBOARD TABLE */}
                <div className="animate-slideUp max-w-md mx-auto min-h-[400px]">
                    {loading ? (
                        <div className="text-center py-20 animate-pulse font-black italic uppercase text-gray-600 tracking-widest text-[10px]">Loading Stats...</div>
                    ) : entries.length === 0 ? (
                        <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5 border-dashed">
                            <Target size={40} className="mx-auto mb-4 opacity-10" />
                            <p className="font-black italic uppercase text-gray-600 tracking-widest text-[10px]">No Data Recorded</p>
                        </div>
                    ) : (
                        <>
                            {/* Header */}
                            <div className="flex items-center gap-4 px-4 pb-3 mb-3 border-b border-white/10">
                                <div className="w-8 text-[10px] font-black uppercase text-gray-500">Rank</div>
                                <div className="w-12"></div>
                                <div className="flex-1 text-[10px] font-black uppercase text-gray-500">Player</div>
                                <div className="text-[10px] font-black uppercase text-gray-500">Score</div>
                            </div>

                            {/* Entries */}
                            <div className="flex flex-col gap-3">
                                {entries.map((entry, i) => (
                                    <div
                                        key={i}
                                        className={`group relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-500 overflow-hidden ${entry.id === currentUserId
                                            ? 'bg-east-light/10 border-east-light shadow-[0_0_30px_rgba(40,209,96,0.15)]'
                                            : i === 0
                                                ? 'bg-gray-900/40 border-[#28D160]/50 shadow-[0_0_30px_rgba(40,209,96,0.05)]'
                                                : 'bg-[#050505] border-white/5 hover:border-white/20'
                                            }`}
                                    >
                                        {/* Rank */}
                                        <div className={`w-8 font-black italic text-2xl ${entry.id === currentUserId || i === 0 ? 'text-[#28D160]' : 'text-white/20'} group-hover:text-[#28D160] transition-colors`}>
                                            {i + 1}
                                        </div>

                                        {/* Avatar */}
                                        <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white/5 group-hover:border-white/40 transition-all shrink-0">
                                            {entry.avatar_url ? (
                                                <img src={entry.avatar_url} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                <div className="w-full h-full bg-gray-950 flex items-center justify-center text-gray-700">
                                                    <User size={18} />
                                                </div>
                                            )}
                                        </div>

                                        {/* Player Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-black italic uppercase text-sm text-white tracking-tight truncate">{entry.name}</h3>
                                                {entry.id === currentUserId && (
                                                    <span className="bg-east-light text-black text-[8px] font-black px-1.5 py-0.5 rounded italic uppercase tracking-tighter">YOU</span>
                                                )}
                                            </div>
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest truncate">{entry.team}</p>
                                        </div>

                                        {/* Score */}
                                        <div className="text-right pr-2 shrink-0">
                                            <div className="font-black italic text-2xl text-white group-hover:scale-110 transition-transform">
                                                {entry.score}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Personal Stats Section (if not in top 10) */}
                                {currentUserStats && currentUserStats.rank > 10 && (
                                    <>
                                        <div className="flex items-center gap-4 py-4">
                                            <div className="flex-1 h-px bg-white/10" />
                                            <div className="text-[10px] font-black uppercase text-gray-500 italic tracking-[0.2em]">Your Performance</div>
                                            <div className="flex-1 h-px bg-white/10" />
                                        </div>

                                        <div className={`group relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-500 overflow-hidden bg-east-light/10 border-east-light shadow-[0_0_30px_rgba(40,209,96,0.15)]`}>
                                            {/* Rank */}
                                            <div className={`w-8 font-black italic text-2xl text-[#28D160] group-hover:text-[#28D160] transition-colors`}>
                                                {currentUserStats.rank}
                                            </div>

                                            {/* Avatar */}
                                            <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white/5 group-hover:border-white/40 transition-all shrink-0">
                                                {currentUserStats.avatar_url ? (
                                                    <img src={currentUserStats.avatar_url} className="w-full h-full object-cover" alt="" />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-950 flex items-center justify-center text-gray-700">
                                                        <User size={18} />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Player Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-black italic uppercase text-sm text-white tracking-tight truncate">{currentUserStats.name}</h3>
                                                    <span className="bg-east-light text-black text-[8px] font-black px-1.5 py-0.5 rounded italic uppercase tracking-tighter">YOU</span>
                                                </div>
                                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest truncate">{currentUserStats.team}</p>
                                            </div>

                                            {/* Score */}
                                            <div className="text-right pr-2 shrink-0">
                                                <div className="font-black italic text-2xl text-white group-hover:scale-110 transition-transform">
                                                    {currentUserStats.score}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
