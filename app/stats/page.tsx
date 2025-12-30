'use client';
import { useState } from 'react';
import { Trophy, Flame, Star, Shield, Users, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { MOCK_PLAYERS, MOCK_TEAMS } from './mockData';

export default function LeaderboardPage() {
    const [activeTab, setActiveTab] = useState<'players' | 'teams'>('players');
    const [filter, setFilter] = useState<'points' | 'goals' | 'assists'>('points');

    // Sort players based on filter
    const sortedPlayers = [...MOCK_PLAYERS].sort((a, b) => {
        const valA = filter === 'points' ? a.stats.points : filter === 'goals' ? a.stats.goals : a.stats.assists;
        const valB = filter === 'points' ? b.stats.points : filter === 'goals' ? b.stats.goals : b.stats.assists;
        return valB - valA;
    });

    return (
        <div className="min-h-screen bg-black text-white p-0 pb-24 font-montserrat animate-fadeIn relative overflow-hidden">
            {/* Background Image Layer */}
            <div className="fixed inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1580748141549-71748ddf0bdc?auto=format&fit=crop&q=80&w=1200"
                    className="w-full h-full object-cover opacity-20 grayscale"
                    alt="bg"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-black/90" />
            </div>

            <div className="relative z-10 p-4">
                <div className="relative mb-10 pt-10 px-4 text-center">
                    <a href="/" className="fixed left-6 top-6 z-50 text-gray-500 hover:text-white transition-colors">
                        <ChevronLeft size={28} />
                    </a>
                    <h1 className="text-[5rem] leading-none font-black italic text-stroke-thin text-transparent uppercase opacity-10 absolute top-2 left-1/2 -translate-x-1/2 select-none whitespace-nowrap tracking-tighter">LEAGUE</h1>
                    <h1 className="text-4xl font-black italic uppercase relative z-10 text-white tracking-tight">Season Stats</h1>
                    <p className="text-[10px] font-black text-east-light uppercase tracking-[0.3em] mt-2 opacity-80">Hong Kong Warriors League</p>
                </div>

                {/* Main Tabs */}
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
                        {/* Filters */}
                        <div className="flex justify-center gap-3 mb-10 overflow-x-auto no-scrollbar pb-2">
                            {['points', 'goals', 'assists'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f as any)}
                                    className={`px-8 py-2.5 rounded-full border uppercase font-black italic text-[10px] tracking-widest transition-all ${filter === f ? 'bg-east-light text-black border-east-light shadow-[0_0_15px_rgba(209,242,217,0.3)]' : 'bg-transparent border-gray-800 text-gray-600 hover:border-gray-500 hover:text-white'
                                        }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>

                        {/* Leader List */}
                        <div className="flex flex-col gap-4 max-w-md mx-auto">
                            {sortedPlayers.map((player, i) => (
                                <Link key={player.id} href={`/profile/${player.id}`} className="relative group block">
                                    <div className={`
                                    relative flex items-center p-5 rounded-2xl border transition-all duration-300
                                    ${i === 0 ? 'bg-[#0a0a0a] border-east-light shadow-[0_0_20px_rgba(209,242,217,0.1)]' : 'bg-[#0a0a0a] border-gray-800 group-hover:border-gray-700'}
                                  `}>
                                        {/* Rank */}
                                        <div className={`w-8 font-black italic text-2xl ${i < 3 ? 'text-east-light' : 'text-gray-700'}`}>
                                            {i + 1}
                                        </div>

                                        {/* Avatar */}
                                        <div className={`w-12 h-12 rounded-full overflow-hidden mr-5 border shrink-0 ${i === 0 ? 'border-east-light' : 'border-gray-800'}`}>
                                            <img
                                                src={player.avatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200"}
                                                className="w-full h-full object-cover"
                                                alt={player.name}
                                            />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-black italic uppercase text-[15px] leading-tight text-white tracking-tight truncate">
                                                {player.name}
                                            </h3>
                                            <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mt-1">
                                                {player.team}
                                            </p>
                                        </div>

                                        {/* Stat Value */}
                                        <div className="text-right pl-4">
                                            <div className="font-black italic text-3xl text-white leading-none tracking-tighter">
                                                {filter === 'points' ? player.stats.points : filter === 'goals' ? player.stats.goals : player.stats.assists}
                                            </div>
                                            <div className="text-[8px] font-black text-east-light uppercase tracking-widest mt-1 italic">
                                                {filter}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col gap-4 max-w-md mx-auto pb-10">
                        {/* Team Header */}
                        <div className="grid grid-cols-12 gap-2 px-6 mb-2 text-[9px] font-black text-gray-600 uppercase tracking-[0.2em]">
                            <div className="col-span-1 text-left">#</div>
                            <div className="col-span-6 text-left pl-3">Team</div>
                            <div className="col-span-2 text-center">GP</div>
                            <div className="col-span-3 text-right">PTS</div>
                        </div>

                        {MOCK_TEAMS.map((team, i) => (
                            <div key={i} className="relative group">
                                <div className="relative grid grid-cols-12 gap-2 items-center p-5 rounded-2xl border bg-[#0a0a0a] border-gray-800 group-hover:border-gray-700 transition-all">
                                    <div className="col-span-1 font-black italic text-xl text-east-light">{team.rank}</div>
                                    <div className="col-span-6 flex items-center gap-4 pl-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center border border-gray-800">
                                            <Shield size={18} className="text-gray-600" />
                                        </div>
                                        <span className="font-black italic uppercase text-white tracking-tight text-[15px]">{team.name}</span>
                                    </div>
                                    <div className="col-span-2 font-black text-gray-500 text-sm text-center italic">{team.gp}</div>
                                    <div className="col-span-3 font-black italic text-white text-2xl text-right tracking-tighter">{team.pts}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
