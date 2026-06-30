'use client';
import { useState, useEffect } from 'react';
import { Trophy, Flame, Star, Shield, Users, ChevronLeft, Flag, Target, Activity, User, Dumbbell } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/app/lib/supabase';
import { useTracking } from '@/app/hooks/useTracking';
import { STAT_FIELDS, SportCategory, getLeaderboardFields, isLowerBetter } from '@/app/lib/statFields';
import PlayerSearch from '@/app/components/PlayerSearch';

export default function LeaderboardPage() {
    const [sport, setSport] = useState<SportCategory>('GOLF');
    const [activeFilter, setActiveFilter] = useState<string>('handicap');
    const [activeDivision, setActiveDivision] = useState<string>('All');
    const [activeSeason, setActiveSeason] = useState<number | 'All'>('All');
    const [activeWeek, setActiveWeek] = useState<number | 'All'>('All');
    const [entries, setEntries] = useState<any[]>([]);
    const [checkInEntries, setCheckInEntries] = useState<any[]>([]);
    const [currentUserStats, setCurrentUserStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [loadingCheckIns, setLoadingCheckIns] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const { track } = useTracking();

    useEffect(() => {
        // Set default filter when sport changes
        const fields = getLeaderboardFields(sport);
        setActiveFilter(fields[0]?.key || '');
        setActiveDivision('All');
        if (sport === 'EAGL') {
            setActiveSeason(1);
            setActiveWeek(1);
        }
    }, [sport]);

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUserId(user?.id || null);
        };
        getUser();
    }, []);

    useEffect(() => {
        track('leaderboard_viewed', { sport, filter: activeFilter });
        fetchLeaderboard();
        fetchCheckInLeaderboard();
    }, [sport, activeFilter, activeDivision, activeSeason, activeWeek]);

    const fetchCheckInLeaderboard = async () => {
        setLoadingCheckIns(true);
        try {
            // First try to use the view `check_in_leaderboard` if it exists
            const { data, error } = await supabase
                .from('check_in_leaderboard')
                .select(`
                    player_id,
                    checkin_count,
                    profiles(first_name, last_name, avatar_url, team)
                `)
                .order('checkin_count', { ascending: false })
                .limit(100);

            if (error) {
                console.warn('View check_in_leaderboard query failed, attempting client-side aggregation fallback:', error);
                // Fallback to fetching check_ins and aggregating client-side
                const { data: rawData, error: rawError } = await supabase
                    .from('check_ins')
                    .select('user_id, profiles(first_name, last_name, avatar_url, team)');
                    
                if (!rawError && rawData) {
                    const counts: any = {};
                    rawData.forEach((row: any) => {
                        if (!row.user_id) return;
                        if (!counts[row.user_id]) {
                            const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
                            counts[row.user_id] = { count: 0, profile };
                        }
                        counts[row.user_id].count++;
                    });
                    const agg = Object.keys(counts).map(uid => ({
                        id: uid,
                        name: `${counts[uid].profile?.first_name || ''} ${counts[uid].profile?.last_name || ''}`.trim() || 'Player',
                        team: counts[uid].profile?.team || 'INDEPENDENT',
                        avatar_url: counts[uid].profile?.avatar_url,
                        score: counts[uid].count
                    })).sort((a, b) => b.score - a.score).slice(0, 100);
                    
                    setCheckInEntries(agg);
                    return;
                }
                throw error;
            }

            const mapped = (data || []).map((entry: any) => {
                const profile = Array.isArray(entry.profiles) ? entry.profiles[0] : entry.profiles;
                return {
                    id: entry.player_id,
                    name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Player',
                    team: profile?.team || 'INDEPENDENT',
                    avatar_url: profile?.avatar_url,
                    score: entry.checkin_count
                };
            });
            setCheckInEntries(mapped);
        } catch (error) {
            console.error('Failed to fetch check-in leaderboard:', error);
            setCheckInEntries([]);
        } finally {
            setLoadingCheckIns(false);
        }
    };

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

            // Map UI sport to database category
            const categoryMap: Record<string, string> = {
                hockey: 'HOCKEY',
                golf: 'GOLF',
                hyrox: 'HYROX',
                league: 'season_2024'
            };

            const dbCategory = categoryMap[sport] || sport.toUpperCase();

            let query = supabase
                .from('players_stats')
                .select(`
                    stats,
                    player_id,
                    profiles!players_stats_player_id_fkey(id, first_name, last_name, team, avatar_url)
                `)
                .eq('category', dbCategory)
                .not('stats->' + activeFilter, 'is', null);

            // Triple-Filtering logic for EAGL or Golf
            if (activeDivision !== 'All') {
                query = query.eq('stats->>division', activeDivision);
            }
            if (sport === 'EAGL') {
                if (activeSeason !== 'All') {
                    query = query.eq('stats->>season', activeSeason.toString());
                }
                if (activeWeek !== 'All') {
                    query = query.eq('stats->>week', activeWeek.toString());
                }
            }

            const { data, error } = await query;

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

                if (isLowerBetter(sport, activeFilter)) {
                    if (typeof aVal === 'string' && aVal.includes(':')) {
                        return timeToSeconds(aVal) - timeToSeconds(bVal);
                    }
                    return (parseFloat(aVal) || 999) - (parseFloat(bVal) || 999);
                }

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

            // Set visible entries (top 100)
            setEntries(sorted.slice(0, 100));
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
        const [minPart, secPart] = time.split(':');
        const mins = parseInt(minPart) || 0;
        // Handle optional milliseconds: ss or ss.ms
        const [secs, ms] = (secPart || '0').split('.');
        return (mins * 60) + (parseInt(secs) || 0) + ((parseInt(ms) || 0) / 1000);
    };

    return (
        <div className="min-h-screen bg-black text-white p-0 pb-24 font-montserrat animate-fadeIn relative overflow-hidden select-none">
            {/* Background Layer */}
            <div className="fixed inset-0 z-0 opacity-20 transition-all duration-700 grayscale">
                <img
                    src={sport === 'HOCKEY'
                        ? "https://images.unsplash.com/photo-1580748141549-71748ddf0bdc?auto=format&fit=crop&q=80&w=1200"
                        : sport === 'GOLF'
                            ? "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&q=80&w=1200"
                            : "https://images.unsplash.com/photo-1594882645126-14020914d58d?auto=format&fit=crop&q=80&w=1200"
                    }
                    className="w-full h-full object-cover"
                    alt="bg"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black via-black/40 to-black" />
            </div>

            <div className="relative z-10 px-4 pt-12 max-w-7xl mx-auto">
                <Link href="/" className="absolute left-4 top-10 z-50 text-white hover:text-east-light transition-colors backdrop-blur-md p-2 rounded-full border border-white/20 bg-black/60 shadow-lg">
                    <ChevronLeft size={24} />
                </Link>

                <div className="text-center mb-10">
                    <h1 className="text-[4rem] sm:text-[5.5rem] leading-none font-black italic text-stroke-thin text-transparent uppercase opacity-5 absolute top-4 left-1/2 -translate-x-1/2 select-none whitespace-nowrap tracking-tighter w-full">LEADERBOARD</h1>
                    <h1 className="text-4xl sm:text-5xl font-black italic uppercase relative z-10 text-white tracking-tight drop-shadow-2xl">Leaderboard</h1>

                    <div className="mt-8 px-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#28D160] mb-3 text-center">
                            Search Players
                        </p>
                        <PlayerSearch />
                    </div>

                    {/* SPORT SELECTOR */}
                    <div className="flex justify-center gap-2 sm:gap-3 mt-8 flex-wrap">
                        {[
                            { id: 'HOCKEY', icon: <Shield size={14} />, label: 'Hockey' },
                            { id: 'GOLF', icon: <Flag size={14} />, label: 'Golf' },
                            { id: 'HYROX', icon: <Activity size={14} />, label: 'Hyrox' },
                            { id: 'EAGL', icon: <Trophy size={14} />, label: 'EAGL' },
                            { id: 'FITNESS_TEST', icon: <Dumbbell size={14} />, label: 'Fitness Test' }
                        ].map(item => (
                            <button
                                key={item.id}
                                onClick={() => setSport(item.id as any)}
                                className={`px-4 sm:px-8 py-2.5 sm:py-3 rounded-full border uppercase font-black italic text-[10px] sm:text-[11px] tracking-widest sm:tracking-[0.2em] transition-all duration-300 ${sport === item.id ? 'bg-east-light text-black border-east-light shadow-[0_0_20px_rgba(40,209,96,0.4)]' : 'bg-transparent border-white/10 text-gray-600 hover:border-white/30'}`}
                            >
                                <div className="flex items-center gap-2">
                                    {item.icon}
                                    {item.label}
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* DIVISION / SEASON / WEEK SELECTORS */}
                    {(sport === 'GOLF' || sport === 'EAGL') && (
                        <div className="flex flex-col gap-3 items-center mt-6">
                            <div className="flex flex-wrap justify-center gap-2">
                                {/* Division Selector */}
                                <div className="relative inline-block border border-white/20 rounded-full px-4 py-1.5 bg-black hover:border-east-light transition-all">
                                    <select 
                                        value={activeDivision}
                                        onChange={(e) => setActiveDivision(e.target.value)}
                                        className="bg-transparent text-white text-[10px] sm:text-[11px] font-black uppercase tracking-widest outline-none appearance-none pr-8 cursor-pointer text-center min-w-[150px]"
                                    >
                                        <option value="All">All Divisions Global</option>
                                        <option value="Pro Men">Pro Men</option>
                                        <option value="Rec Men">Rec Men</option>
                                        <option value="Pro Women">Pro Women</option>
                                        <option value="Rec Women">Rec Women</option>
                                        <option value="Doubles Men">Doubles Men</option>
                                        <option value="Doubles Women">Doubles Women</option>
                                        <option value="Mixed Doubles">Mixed Doubles</option>
                                        <option value="Parent - Child">Parent - Child</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <svg className="w-3 h-3 text-east-light" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>

                                {sport === 'EAGL' && (
                                    <>
                                        {/* Season Input */}
                                        <div className="relative inline-block border border-white/20 rounded-full px-4 py-1.5 bg-black hover:border-east-light transition-all flex items-center gap-2">
                                            <span className="text-[9px] font-black text-gray-500 uppercase">S</span>
                                            <select 
                                                value={activeSeason}
                                                onChange={(e) => setActiveSeason(e.target.value === 'All' ? 'All' : parseInt(e.target.value))}
                                                className="bg-transparent text-white text-[10px] sm:text-[11px] font-black uppercase tracking-widest outline-none appearance-none pr-6 cursor-pointer text-center w-12"
                                            >
                                                <option value="All">All</option>
                                                {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v}</option>)}
                                            </select>
                                        </div>

                                        {/* Week Input */}
                                        <div className="relative inline-block border border-white/20 rounded-full px-4 py-1.5 bg-black hover:border-east-light transition-all flex items-center gap-2">
                                            <span className="text-[9px] font-black text-gray-500 uppercase">W</span>
                                            <select 
                                                value={activeWeek}
                                                onChange={(e) => setActiveWeek(e.target.value === 'All' ? 'All' : parseInt(e.target.value))}
                                                className="bg-transparent text-white text-[10px] sm:text-[11px] font-black uppercase tracking-widest outline-none appearance-none pr-6 cursor-pointer text-center w-12"
                                            >
                                                <option value="All">All</option>
                                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(v => <option key={v} value={v}>{v}</option>)}
                                            </select>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* STAT CATEGORY FILTERS */}
                    <div className="flex justify-start sm:justify-center gap-2 mt-8 mb-10 overflow-x-auto no-scrollbar pb-4 px-2 -mx-4 sm:mx-0 flex-nowrap sm:flex-wrap">
                        {getLeaderboardFields(sport).map(field => (
                            <button
                                key={field.key}
                                onClick={() => setActiveFilter(field.key)}
                                className={`px-5 sm:px-6 py-2 sm:py-2.5 rounded-full border uppercase font-black italic text-[9px] sm:text-[10px] tracking-widest transition-all duration-300 whitespace-nowrap flex-shrink-0 ${activeFilter === field.key
                                    ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                                    : 'bg-transparent border-white/10 text-gray-600 hover:border-white/30'
                                    }`}
                            >
                                {field.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-12 pb-10">
                    {/* CHECK-IN LEADERBOARD */}
                    <div className="animate-slideUp w-full max-w-2xl mx-auto">
                        <div className="flex items-center gap-2 mb-4 justify-center">
                            <Activity size={16} className="text-[#28D160]" />
                            <h2 className="font-black italic text-lg uppercase tracking-widest text-white">Most Visits</h2>
                        </div>
                        {loadingCheckIns ? (
                            <div className="text-center py-20 animate-pulse font-black italic uppercase text-gray-600 tracking-widest text-[10px]">Loading Visits...</div>
                        ) : checkInEntries.length === 0 ? (
                            <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5 border-dashed">
                                <Target size={40} className="mx-auto mb-4 opacity-10" />
                                <p className="font-black italic uppercase text-gray-600 tracking-widest text-[10px]">No Check-Ins Recorded</p>
                            </div>
                        ) : (
                            <>
                                {/* Header */}
                                <div className="flex items-center gap-4 px-4 pb-3 mb-3 border-b border-white/10">
                                    <div className="w-8 text-[10px] font-black uppercase text-gray-500">Rank</div>
                                    <div className="w-12"></div>
                                    <div className="flex-1 text-[10px] font-black uppercase text-gray-500">Player</div>
                                    <div className="text-[10px] font-black uppercase text-gray-500">Check-Ins</div>
                                </div>

                                {/* Entries */}
                                <div className="flex flex-col gap-3">
                                    {checkInEntries.map((entry, i) => (
                                        <Link
                                            key={entry.id || i}
                                            href={entry.id ? `/profile/${entry.id}` : '#'}
                                            className={`group relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-500 overflow-hidden cursor-pointer ${entry.id === currentUserId
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
                                        </Link>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                {/* LEADERBOARD TABLE (SPORTS) */}
                    <div className="animate-slideUp w-full max-w-2xl mx-auto">
                        <div className="flex items-center gap-2 mb-4 justify-center">
                            <Trophy size={16} className="text-[#28D160]" />
                            <h2 className="font-black italic text-lg uppercase tracking-widest text-white">Performance</h2>
                        </div>
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
                                        <Link
                                            key={entry.id || i}
                                            href={entry.id ? `/profile/${entry.id}` : '#'}
                                            className={`group relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-500 overflow-hidden cursor-pointer ${entry.id === currentUserId
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
                                        </Link>
                                    ))}

                                    {/* Personal Stats Section (if not in top 100) */}
                                    {currentUserStats && currentUserStats.rank > 100 && (
                                        <>
                                            <div className="flex items-center gap-4 py-4">
                                                <div className="flex-1 h-px bg-white/10" />
                                                <div className="text-[10px] font-black uppercase text-gray-500 italic tracking-[0.2em]">Your Performance</div>
                                                <div className="flex-1 h-px bg-white/10" />
                                            </div>

                                            <Link
                                                href={currentUserStats.id ? `/profile/${currentUserStats.id}` : '#'}
                                                className="group relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-500 overflow-hidden bg-east-light/10 border-east-light shadow-[0_0_30px_rgba(40,209,96,0.15)] cursor-pointer"
                                            >
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
                                            </Link>
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    </div>
            </div>
        </div>
    );
}
