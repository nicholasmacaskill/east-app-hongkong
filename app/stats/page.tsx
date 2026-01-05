'use client';
import { useState, useEffect } from 'react';
import { Trophy, Flame, Star, Shield, Users, ChevronLeft, Flag, Target, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/app/lib/supabase';
import { MOCK_PLAYERS, MOCK_TEAMS } from './mockData';
import UploadGolfStatsModal from '@/app/components/modals/UploadGolfStatsModal';

export default function LeaderboardPage() {
    const [sport, setSport] = useState<'hockey' | 'golf'>('hockey');
    const [activeTab, setActiveTab] = useState<'players' | 'teams'>('players');
    const [filter, setFilter] = useState<'points' | 'goals' | 'assists'>('points');
    const [golfFilter, setGolfFilter] = useState<'handicap' | 'average_score' | 'rounds_played'>('handicap');

    // Golf State
    const [golfLeaders, setGolfLeaders] = useState<any[]>([]);
    const [loadingGolf, setLoadingGolf] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
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
            // 1. Fetch Stats
            const { data: statsData, error: statsError } = await supabase
                .from('golf_stats')
                .select('*');

            if (statsError) {
                console.error("❌ Error fetching golf stats:", statsError);
                return;
            }

            if (statsData && statsData.length > 0) {
                // 2. Fetch Profiles manualy to avoid Join issues
                // Use Set to ensure unique IDs
                const playerIds = Array.from(new Set(statsData.map(s => s.player_id)));

                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id,first_name,last_name,avatar_url,team')
                    .in('id', playerIds);

                if (profilesError) {
                    console.error("Error fetching profiles (JSON):", JSON.stringify(profilesError, null, 2));
                    console.error("Error details:", profilesError.message, profilesError.details, profilesError.hint);
                }

                // 3. Merge Data
                const mergedData = statsData.map(stat => {
                    const profile = profilesData?.find(p => p.id === stat.player_id);
                    return {
                        ...stat,
                        profiles: profile || null
                    };
                });

                // Determine user stats if logged in
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


    // Sort Hockey Players
    const sortedHockeyPlayers = [...MOCK_PLAYERS].sort((a, b) => {
        const valA = filter === 'points' ? a.stats.points : filter === 'goals' ? a.stats.goals : a.stats.assists;
        const valB = filter === 'points' ? b.stats.points : filter === 'goals' ? b.stats.goals : b.stats.assists;
        return valB - valA;
    });

    // Sort Golf Players
    const sortedGolfPlayers = [...golfLeaders].sort((a, b) => {
        if (golfFilter === 'handicap' || golfFilter === 'average_score') {
            // Lower is better (handling 0 as worst if needed, but assuming data is valid)
            // Actually for handicap/score, ASCENDING sort.
            // But 0 might mean unset?
            return (a[golfFilter] || 100) - (b[golfFilter] || 100);
        }
        // Rounds played: Higher is better
        return (b[golfFilter] || 0) - (a[golfFilter] || 0);
    });

    return (
        <div className="min-h-screen bg-black text-white p-0 pb-24 font-montserrat animate-fadeIn relative overflow-hidden">
            {/* Background Image Layer */}
            <div className="fixed inset-0 z-0">
                <img
                    src={sport === 'hockey'
                        ? "https://images.unsplash.com/photo-1580748141549-71748ddf0bdc?auto=format&fit=crop&q=80&w=1200"
                        : "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&q=80&w=1200"
                    }
                    className="w-full h-full object-cover opacity-20 grayscale transition-opacity duration-700"
                    alt="bg"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-black/90" />
            </div>

            <div className="relative z-10 p-4">
                <div className="relative mb-6 pt-10 px-4 text-center">
                    <a href="/" className="fixed left-6 top-6 z-50 text-gray-500 hover:text-white transition-colors">
                        <ChevronLeft size={28} />
                    </a>
                    <h1 className="text-[5rem] leading-none font-black italic text-stroke-thin text-transparent uppercase opacity-10 absolute top-2 left-1/2 -translate-x-1/2 select-none whitespace-nowrap tracking-tighter">LEAGUE</h1>
                    <h1 className="text-4xl font-black italic uppercase relative z-10 text-white tracking-tight">Season Stats</h1>

                    {/* Sport Toggle */}
                    <div className="flex justify-center gap-4 mt-6">
                        <button
                            onClick={() => setSport('hockey')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full uppercase text-[10px] font-black italic tracking-widest transition-all ${sport === 'hockey' ? 'bg-white text-black scale-105' : 'bg-transparent text-gray-500 border border-gray-800'}`}
                        >
                            <Shield size={14} /> Hockey
                        </button>
                        <button
                            onClick={() => setSport('golf')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full uppercase text-[10px] font-black italic tracking-widest transition-all ${sport === 'golf' ? 'bg-white text-black scale-105' : 'bg-transparent text-gray-500 border border-gray-800'}`}
                        >
                            <Flag size={14} /> Golf
                        </button>
                    </div>
                </div>

                {/* HOCKEY VIEW */}
                {sport === 'hockey' && (
                    <>
                        <div className="flex justify-center gap-8 mb-10">
                            <button
                                onClick={() => setActiveTab('players')}
                                className={`font-black italic text-[11px] uppercase transition-all tracking-widest ${activeTab === 'players' ? 'text-east-light border-b-2 border-east-light pb-1' : 'text-gray-600 hover:text-gray-400'}`}
                            >
                                Player Leaders
                            </button>
                            <button
                                onClick={() => setActiveTab('teams')}
                                className={`font-black italic text-[11px] uppercase transition-all tracking-widest ${activeTab === 'teams' ? 'text-east-light border-b-2 border-east-light pb-1' : 'text-gray-600 hover:text-gray-400'}`}
                            >
                                Team Standings
                            </button>
                        </div>

                        {activeTab === 'players' ? (
                            <>
                                <div className="flex justify-center gap-3 mb-8 overflow-x-auto no-scrollbar pb-2">
                                    {['points', 'goals', 'assists'].map(f => (
                                        <button
                                            key={f}
                                            onClick={() => setFilter(f as any)}
                                            className={`px-6 py-2 rounded-full border uppercase font-black italic text-[10px] tracking-widest transition-all ${filter === f ? 'bg-east-light text-black border-east-light' : 'bg-transparent border-gray-800 text-gray-600'}`}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex flex-col gap-4 max-w-md mx-auto">
                                    {sortedHockeyPlayers.map((player, i) => (
                                        <div key={player.id} className={`relative flex items-center p-4 rounded-xl border transition-all ${i === 0 ? 'bg-gray-900 border-east-light' : 'bg-[#0a0a0a] border-gray-800'}`}>
                                            <div className="w-8 font-black italic text-xl text-gray-500">{i + 1}</div>
                                            <div className="w-10 h-10 rounded-full overflow-hidden mr-4 bg-gray-800">
                                                <img src={player.avatar || "https://placehold.co/100"} className="w-full h-full object-cover" alt={player.name} />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-black italic uppercase text-sm text-white">{player.name}</h3>
                                                <p className="text-[10px] font-bold text-gray-500 uppercase">{player.team}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-black italic text-2xl text-white">
                                                    {filter === 'points' ? player.stats.points : filter === 'goals' ? player.stats.goals : player.stats.assists}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            /* TEAMS TAB FROM EXISTING CODE */
                            <div className="flex flex-col gap-4 max-w-md mx-auto pb-10">
                                <div className="grid grid-cols-12 gap-2 px-6 mb-2 text-[9px] font-black text-gray-600 uppercase tracking-[0.2em]">
                                    <div className="col-span-1 text-left">#</div>
                                    <div className="col-span-6 text-left pl-3">Team</div>
                                    <div className="col-span-2 text-center">GP</div>
                                    <div className="col-span-3 text-right">PTS</div>
                                </div>
                                {MOCK_TEAMS.map((team, i) => (
                                    <div key={i} className="relative grid grid-cols-12 gap-2 items-center p-5 rounded-2xl border bg-[#0a0a0a] border-gray-800">
                                        <div className="col-span-1 font-black italic text-xl text-east-light">{team.rank}</div>
                                        <div className="col-span-6 flex items-center gap-4 pl-3">
                                            <span className="font-black italic uppercase text-white">{team.name}</span>
                                        </div>
                                        <div className="col-span-2 font-black text-gray-500 text-sm text-center italic">{team.gp}</div>
                                        <div className="col-span-3 font-black italic text-white text-2xl text-right">{team.pts}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* GOLF VIEW */}
                {sport === 'golf' && (
                    <div className="animate-fadeIn">

                        {/* Action Bar */}
                        <div className="flex justify-between items-center max-w-md mx-auto mb-8 px-2">
                            <h2 className="text-xl font-black italic uppercase text-white">Leaderboard</h2>
                            <button
                                onClick={() => setShowUploadModal(true)}
                                className="bg-east-light text-black px-4 py-2 rounded-lg text-[10px] font-black italic uppercase tracking-widest flex items-center gap-2 hover:bg-white transition-colors"
                            >
                                <PlusCircle size={14} /> Upload Stats
                            </button>
                        </div>

                        {/* Golf Filters */}
                        <div className="flex justify-center gap-3 mb-8 overflow-x-auto no-scrollbar pb-2">
                            {[
                                { id: 'handicap', label: 'Handicap' },
                                { id: 'average_score', label: 'Avg Score' },
                                { id: 'rounds_played', label: 'Rounds' }
                            ].map(f => (
                                <button
                                    key={f.id}
                                    onClick={() => setGolfFilter(f.id as any)}
                                    className={`px-5 py-2 rounded-full border uppercase font-black italic text-[10px] tracking-widest transition-all ${golfFilter === f.id ? 'bg-white text-black border-white' : 'bg-transparent border-gray-800 text-gray-600'}`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>

                        {loadingGolf ? (
                            <div className="text-center text-gray-500 font-bold animate-pulse uppercase text-xs">Loading Golf Stats...</div>
                        ) : sortedGolfPlayers.length === 0 ? (
                            <div className="text-center text-gray-600 font-bold uppercase text-xs py-10">
                                <Target size={32} className="mx-auto mb-4 opacity-50" />
                                No stats found. Be the first to upload!
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4 max-w-md mx-auto">
                                {sortedGolfPlayers.map((stat, i) => (
                                    <div key={stat.id} className={`relative flex items-center p-4 rounded-xl border transition-all ${i === 0 ? 'bg-gray-900 border-white shadow-lg' : 'bg-[#0a0a0a] border-gray-800'}`}>
                                        <div className={`w-8 font-black italic text-xl ${i === 0 ? 'text-yellow-400' : 'text-gray-600'}`}>{i + 1}</div>
                                        <div className="w-10 h-10 rounded-full overflow-hidden mr-4 bg-gray-800 border-2 border-transparent">
                                            <img src={stat.profiles?.avatar_url || "https://placehold.co/100"} className="w-full h-full object-cover" alt="Avatar" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-black italic uppercase text-sm text-white">
                                                {stat.profiles?.first_name} {stat.profiles?.last_name}
                                            </h3>
                                            <p className="text-[9px] font-bold text-gray-500 uppercase">
                                                Handicap: <span className="text-white">{stat.handicap}</span>
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-black italic text-2xl text-white">
                                                {stat[golfFilter]}
                                            </div>
                                            <div className="text-[8px] font-bold text-gray-500 uppercase">
                                                {golfFilter === 'average_score' ? 'Avg' : golfFilter === 'rounds_played' ? 'Rounds' : 'HCP'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {showUploadModal && <UploadGolfStatsModal
                currentUserId={currentUserId}
                onClose={() => setShowUploadModal(false)}
                onSuccess={() => { fetchGolfStats(); }}
                existingStats={currentUserStats}
            />}
        </div>
    );
}

