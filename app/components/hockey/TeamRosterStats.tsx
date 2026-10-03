'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Trophy, Shield, ArrowUpDown, Search, User, Sparkles, X, ChevronRight, Hash, Award, Flame } from 'lucide-react';
import HockeyCard from '@/app/components/ui/HockeyCard';
import { PlayerHockeyStat } from '@/app/types/stats';

interface TeamRosterStatsProps {
  onSelectForComparison?: (playerId: string) => void;
}

export default function TeamRosterStats({ onSelectForComparison }: TeamRosterStatsProps) {
  const [division, setDivision] = useState<string>('U13');
  const [season, setSeason] = useState<string>('2024-25');
  const [competition, setCompetition] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState('');
  const [sortField, setSortField] = useState<'points' | 'goals' | 'assists' | 'gp' | 'pts_per_game' | 'pim'>('points');
  const [sortAsc, setSortAsc] = useState(false);

  const [loading, setLoading] = useState(true);
  const [skaters, setSkaters] = useState<any[]>([]);
  const [goalies, setGoalies] = useState<any[]>([]);
  const [teamSummary, setTeamSummary] = useState<any>(null);

  // Modal Hockey Card preview
  const [cardModalPlayer, setCardModalPlayer] = useState<any | null>(null);
  const [cardModalStats, setCardModalStats] = useState<PlayerHockeyStat[]>([]);
  const [loadingModalCard, setLoadingModalCard] = useState(false);

  useEffect(() => {
    fetchTeamStats();
  }, [division, season, competition]);

  const fetchTeamStats = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (division) params.set('division', division);
      if (season) params.set('season', season);
      if (competition) params.set('competition', competition);

      const res = await fetch(`/api/hockey-stats/team?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load team stats');
      const data = await res.json();

      setSkaters(data.skaters || []);
      setGoalies(data.goalies || []);
      setTeamSummary(data.teamSummary || null);
    } catch (err) {
      console.error('Error fetching team stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const getProfile = (item: any) => {
    if (!item?.profile) return null;
    return Array.isArray(item.profile) ? item.profile[0] : item.profile;
  };

  const openPlayerCardModal = async (player: any) => {
    const prof = getProfile(player);
    setCardModalPlayer({ ...player, profile: prof });
    setLoadingModalCard(true);
    try {
      const res = await fetch(`/api/hockey-stats/${player.player_id}`);
      if (res.ok) {
        const data = await res.json();
        setCardModalStats(data.stats || []);
      }
    } catch (e) {
      console.error('Error opening card modal:', e);
    } finally {
      setLoadingModalCard(false);
    }
  };

  // Sorting
  const handleSort = (field: 'points' | 'goals' | 'assists' | 'gp' | 'pts_per_game' | 'pim') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const filteredSkaters = skaters
    .filter((s) => {
      const prof = getProfile(s);
      const name = `${prof?.first_name || ''} ${prof?.last_name || ''}`.toLowerCase();
      return name.includes(searchFilter.toLowerCase());
    })
    .sort((a, b) => {
      const valA = a[sortField] || 0;
      const valB = b[sortField] || 0;
      return sortAsc ? valA - valB : valB - valA;
    });

  return (
    <div className="w-full space-y-6 font-montserrat">
      {/* 1. ELITE PROSPECTS HEADER & CONTROLS */}
      <div className="bg-[#18181b] border border-white/10 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-east-light/20 border border-east-light/40 flex items-center justify-center shadow-lg">
              <Shield className="w-5 h-5 text-east-light" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black italic uppercase text-white tracking-wide">
                  EAST Stars {division} Team Roster & Stats
                </h2>
                <span className="text-[9px] font-black px-2 py-0.5 rounded bg-east-light/20 text-east-light border border-east-light/30 uppercase tracking-widest">
                  ELITE PROSPECTS
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Official team scoring leaders, box scores, and individual player cards
              </p>
            </div>
          </div>

          {/* Division Selector Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-black/60 rounded-xl border border-white/10">
            {(['ALL', 'U11', 'U13', 'U15', 'U18'] as const).map((div) => (
              <button
                key={div}
                type="button"
                onClick={() => setDivision(div)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                  division === div
                    ? 'bg-east-light text-black shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {div}
              </button>
            ))}
          </div>
        </div>

        {/* SECONDARY FILTERS: Season, Tournament, Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Season dropdown */}
          <div>
            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
              Season
            </label>
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="w-full bg-black/70 border border-white/20 px-3 py-2 rounded-xl text-xs font-bold text-white focus:border-east-light outline-none"
            >
              <option value="2024-25">2024-25 Season</option>
              <option value="2023-24">2023-24 Season</option>
              <option value="ALL">All Seasons</option>
            </select>
          </div>

          {/* Tournament dropdown */}
          <div>
            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
              Competition / Tournament
            </label>
            <select
              value={competition}
              onChange={(e) => setCompetition(e.target.value)}
              className="w-full bg-black/70 border border-white/20 px-3 py-2 rounded-xl text-xs font-bold text-white focus:border-east-light outline-none"
            >
              <option value="ALL">All Competitions (Quebec, Leagues, Cups)</option>
              <option value="Quebec International Pee-Wee Tournament">Quebec International Pee-Wee</option>
              <option value="Hong Kong Youth League">Hong Kong Youth League</option>
              <option value="Bangkok Youth Hockey Cup">Bangkok Youth Hockey Cup</option>
            </select>
          </div>

          {/* Search Athlete */}
          <div>
            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
              Search Player
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search athlete by name..."
                className="w-full bg-black/70 border border-white/20 pl-8 pr-3 py-2 rounded-xl text-xs font-medium text-white focus:border-east-light outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. TEAM SUMMARY METRIC RIBBON */}
      {teamSummary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-[#18181b] border border-white/10 rounded-2xl p-3.5 shadow-md">
            <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 block">ROSTER SIZE</span>
            <div className="text-xl font-black italic text-white mt-1">
              {teamSummary.total_players} <span className="text-xs text-gray-500 font-semibold">Athletes</span>
            </div>
          </div>

          <div className="bg-[#18181b] border border-white/10 rounded-2xl p-3.5 shadow-md">
            <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 block">GOALS FOR</span>
            <div className="text-xl font-black italic text-east-light mt-1">
              {teamSummary.total_goals} <span className="text-xs text-gray-400 font-semibold">Goals</span>
            </div>
          </div>

          <div className="bg-[#18181b] border border-white/10 rounded-2xl p-3.5 shadow-md">
            <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 block">TOTAL POINTS</span>
            <div className="text-xl font-black italic text-white mt-1">
              {teamSummary.total_points} <span className="text-xs text-gray-500 font-semibold">Pts</span>
            </div>
          </div>

          <div className="bg-[#18181b] border border-white/10 rounded-2xl p-3.5 shadow-md">
            <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 block">POINTS LEADER</span>
            <div className="text-sm font-black italic text-east-light mt-1 truncate">
              {teamSummary.top_scorer ? `${getProfile(teamSummary.top_scorer)?.first_name || ''} ${getProfile(teamSummary.top_scorer)?.last_name || ''}` : '-'}
            </div>
            <span className="text-[8px] text-gray-400 font-bold block">
              {teamSummary.top_scorer ? `${teamSummary.top_scorer.points} PTS (${teamSummary.top_scorer.gp} GP)` : ''}
            </span>
          </div>

          <div className="bg-[#18181b] border border-white/10 rounded-2xl p-3.5 shadow-md col-span-2 md:col-span-1">
            <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 block">GOALS LEADER</span>
            <div className="text-sm font-black italic text-white mt-1 truncate">
              {teamSummary.top_goal_scorer ? `${getProfile(teamSummary.top_goal_scorer)?.first_name || ''} ${getProfile(teamSummary.top_goal_scorer)?.last_name || ''}` : '-'}
            </div>
            <span className="text-[8px] text-east-light font-bold block">
              {teamSummary.top_goal_scorer ? `${teamSummary.top_goal_scorer.goals} Goals` : ''}
            </span>
          </div>
        </div>
      )}

      {/* 3. SKATERS STATS TABLE (ELITE PROSPECTS FORMAT) */}
      <div className="bg-[#18181b] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-east-light" />
            <h3 className="text-sm font-black italic uppercase text-white tracking-wide">
              Skaters ({filteredSkaters.length})
            </h3>
          </div>
          <span className="text-[10px] text-gray-400">
            Click any column header to sort • Click row to view Hockey Card
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-gray-400 font-bold uppercase tracking-widest animate-pulse">
            Loading team scoring ledger...
          </div>
        ) : filteredSkaters.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400 font-bold uppercase tracking-widest">
            No skaters found for selected filters
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[9px] font-black uppercase tracking-wider text-gray-400">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Player</th>
                  <th className="py-2.5 px-2">Pos</th>
                  <th
                    className="py-2.5 px-2 text-center cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('gp')}
                  >
                    <span className="flex items-center justify-center gap-1">
                      GP {sortField === 'gp' && <ArrowUpDown className="w-2.5 h-2.5 text-east-light" />}
                    </span>
                  </th>
                  <th
                    className="py-2.5 px-2 text-center cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('goals')}
                  >
                    <span className="flex items-center justify-center gap-1">
                      G {sortField === 'goals' && <ArrowUpDown className="w-2.5 h-2.5 text-east-light" />}
                    </span>
                  </th>
                  <th
                    className="py-2.5 px-2 text-center cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('assists')}
                  >
                    <span className="flex items-center justify-center gap-1">
                      A {sortField === 'assists' && <ArrowUpDown className="w-2.5 h-2.5 text-east-light" />}
                    </span>
                  </th>
                  <th
                    className="py-2.5 px-2 text-center cursor-pointer hover:text-east-light transition-colors text-east-light"
                    onClick={() => handleSort('points')}
                  >
                    <span className="flex items-center justify-center gap-1 font-black">
                      PTS {sortField === 'points' && <ArrowUpDown className="w-2.5 h-2.5" />}
                    </span>
                  </th>
                  <th
                    className="py-2.5 px-2 text-center cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('pts_per_game')}
                  >
                    <span className="flex items-center justify-center gap-1">
                      PTS/G {sortField === 'pts_per_game' && <ArrowUpDown className="w-2.5 h-2.5 text-east-light" />}
                    </span>
                  </th>
                  <th
                    className="py-2.5 px-2 text-center cursor-pointer hover:text-white transition-colors text-gray-400"
                    onClick={() => handleSort('pim')}
                  >
                    <span className="flex items-center justify-center gap-1">
                      PIM {sortField === 'pim' && <ArrowUpDown className="w-2.5 h-2.5 text-east-light" />}
                    </span>
                  </th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredSkaters.map((skater, idx) => {
                  const prof = getProfile(skater);
                  return (
                  <tr
                    key={skater.player_id || idx}
                    className="hover:bg-white/5 transition-colors cursor-pointer group"
                    onClick={() => openPlayerCardModal(skater)}
                  >
                    {/* Jersey # */}
                    <td className="py-3 px-3 font-black text-gray-400 group-hover:text-east-light">
                      #{skater.jersey_number ?? (prof?.username?.match(/\d+$/)?.[0]?.slice(-2) ?? '88')}
                    </td>

                    {/* Player Info */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-neutral-800 overflow-hidden relative shrink-0 border border-white/10">
                          <Image
                            src={prof?.avatar_url || 'https://images.pexels.com/photos/6550836/pexels-photo-6550836.jpeg'}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="28px"
                          />
                        </div>
                        <div className="truncate">
                          <span className="font-bold text-white group-hover:text-east-light transition-colors block truncate">
                            {prof?.first_name} {prof?.last_name}
                          </span>
                          <span className="text-[9px] text-gray-500 font-medium block truncate">
                            {prof?.team || 'EAST Stars'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Position */}
                    <td className="py-3 px-2">
                      <span className="px-1.5 py-0.5 rounded bg-white/10 text-white font-black text-[9px] uppercase">
                        {skater.position || 'F'}
                      </span>
                    </td>

                    {/* Stats */}
                    <td className="py-3 px-2 text-center font-bold text-white">{skater.gp}</td>
                    <td className="py-3 px-2 text-center font-bold text-white">{skater.goals}</td>
                    <td className="py-3 px-2 text-center font-bold text-white">{skater.assists}</td>
                    <td className="py-3 px-2 text-center font-black text-east-light text-sm">{skater.points}</td>
                    <td className="py-3 px-2 text-center font-bold text-gray-300">{skater.pts_per_game}</td>
                    <td className="py-3 px-2 text-center text-gray-400">{skater.pim}</td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {onSelectForComparison && (
                          <button
                            type="button"
                            onClick={() => onSelectForComparison(skater.player_id)}
                            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-east-light hover:text-black text-[9px] font-bold text-white transition-colors"
                          >
                            + Compare
                          </button>
                        )}
                        <Link
                          href={`/profile/${skater.player_id}`}
                          className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-[9px] font-bold text-gray-300 transition-colors"
                        >
                          Profile
                        </Link>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. GOALIES STATS TABLE */}
      {goalies.length > 0 && (
        <div className="bg-[#18181b] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-black italic uppercase text-white tracking-wide">
                Goaltenders ({goalies.length})
              </h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[9px] font-black uppercase tracking-wider text-gray-400">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Goaltender</th>
                  <th className="py-2.5 px-2 text-center">GP</th>
                  <th className="py-2.5 px-2 text-center">MIN</th>
                  <th className="py-2.5 px-2 text-center">W</th>
                  <th className="py-2.5 px-2 text-center">L</th>
                  <th className="py-2.5 px-2 text-center text-amber-300">GAA</th>
                  <th className="py-2.5 px-2 text-center text-emerald-400">SV%</th>
                  <th className="py-2.5 px-2 text-center">SO</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {goalies.map((goalie, idx) => {
                  const prof = getProfile(goalie);
                  return (
                  <tr
                    key={goalie.player_id || idx}
                    className="hover:bg-white/5 transition-colors cursor-pointer group"
                    onClick={() => openPlayerCardModal(goalie)}
                  >
                    <td className="py-3 px-3 font-black text-gray-400 group-hover:text-amber-300">
                      #{goalie.jersey_number ?? '1'}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-neutral-800 overflow-hidden relative shrink-0 border border-white/10">
                          <Image
                            src={prof?.avatar_url || 'https://images.pexels.com/photos/6550836/pexels-photo-6550836.jpeg'}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="28px"
                          />
                        </div>
                        <div>
                          <span className="font-bold text-white group-hover:text-amber-300 transition-colors block truncate">
                            {prof?.first_name} {prof?.last_name}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center font-bold text-white">{goalie.gp}</td>
                    <td className="py-3 px-2 text-center font-bold text-gray-300">{goalie.minutes_played}</td>
                    <td className="py-3 px-2 text-center font-bold text-white">{goalie.wins}</td>
                    <td className="py-3 px-2 text-center font-bold text-gray-400">{goalie.losses}</td>
                    <td className="py-3 px-2 text-center font-black text-amber-300">{goalie.gaa?.toFixed(2)}</td>
                    <td className="py-3 px-2 text-center font-black text-emerald-400">{goalie.save_pct?.toFixed(3)}</td>
                    <td className="py-3 px-2 text-center font-bold text-white">{goalie.shutouts}</td>
                    <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <Link
                        href={`/profile/${goalie.player_id}`}
                        className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-[9px] font-bold text-gray-300 transition-colors"
                      >
                        Profile
                      </Link>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. MODAL HOCKEY CARD PREVIEW */}
      {cardModalPlayer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setCardModalPlayer(null)}
        >
          <div
            className="relative max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setCardModalPlayer(null)}
              className="absolute -top-3 -right-3 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all shadow-xl"
            >
              <X className="w-4 h-4" />
            </button>

            <HockeyCard
              player={{
                id: cardModalPlayer.player_id,
                first_name: cardModalPlayer.profile?.first_name || 'Player',
                last_name: cardModalPlayer.profile?.last_name || 'Elite',
                username: cardModalPlayer.profile?.username,
                avatar_url: cardModalPlayer.profile?.avatar_url,
                team: cardModalPlayer.profile?.team,
              }}
              hockeyStats={cardModalStats}
              isLoading={loadingModalCard}
            />
          </div>
        </div>
      )}
    </div>
  );
}
