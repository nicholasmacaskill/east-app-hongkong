'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Shield,
  ArrowRightLeft,
  Trophy,
  Flame,
  Award,
  Sparkles,
  ChevronDown,
  User,
  CheckCircle2,
  ExternalLink,
  Crown,
} from 'lucide-react';
import HockeyCard from '@/app/components/ui/HockeyCard';
import { PlayerHockeyStat, HockeyCardCareerTotals } from '@/app/types/stats';

interface PlayerProfileShort {
  id: string;
  first_name: string;
  last_name: string;
  username?: string;
  avatar_url?: string;
  team?: string;
}

interface ComparisonMetric {
  metric: string;
  key: string;
  p1: number;
  p2: number;
  leader: 'player1' | 'player2' | 'tie';
}

interface CompareData {
  player1: {
    profile: PlayerProfileShort;
    stats: PlayerHockeyStat[];
    careerTotals: HockeyCardCareerTotals;
  };
  player2: {
    profile: PlayerProfileShort;
    stats: PlayerHockeyStat[];
    careerTotals: HockeyCardCareerTotals;
  };
  comparisonMetrics: ComparisonMetric[];
}

interface PlayerComparisonProps {
  initialPlayer1Id?: string;
  initialPlayer2Id?: string;
}

export default function PlayerComparison({
  initialPlayer1Id,
  initialPlayer2Id,
}: PlayerComparisonProps) {
  // Available athletes list for selection
  const [availablePlayers, setAvailablePlayers] = useState<PlayerProfileShort[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);

  // Selected player IDs
  const [player1Id, setPlayer1Id] = useState<string>(initialPlayer1Id || '');
  const [player2Id, setPlayer2Id] = useState<string>(initialPlayer2Id || '');

  // Comparison result
  const [compareData, setCompareData] = useState<CompareData | null>(null);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch all roster players to populate the dropdowns
  useEffect(() => {
    async function loadRoster() {
      setLoadingPlayers(true);
      try {
        const res = await fetch('/api/hockey-stats/team?division=ALL');
        if (res.ok) {
          const data = await res.json();
          const list: PlayerProfileShort[] = [];
          const seen = new Set<string>();

          [...(data.skaters || []), ...(data.goalies || [])].forEach((item: any) => {
            const prof = Array.isArray(item.profile) ? item.profile[0] : item.profile;
            if (prof && !seen.has(item.player_id)) {
              seen.add(item.player_id);
              list.push({
                id: item.player_id,
                first_name: prof.first_name || '',
                last_name: prof.last_name || '',
                username: prof.username,
                avatar_url: prof.avatar_url,
                team: prof.team || 'EAST Stars',
              });
            }
          });

          // Sort alphabetically
          list.sort((a, b) => a.first_name.localeCompare(b.first_name));
          setAvailablePlayers(list);

          // If no initial IDs were set, default to first two players with stats
          if (!player1Id && list.length > 0) {
            setPlayer1Id(list[0].id);
          }
          if (!player2Id && list.length > 1) {
            setPlayer2Id(list[1].id);
          }
        }
      } catch (e) {
        console.error('Failed to load roster players:', e);
      } finally {
        setLoadingPlayers(false);
      }
    }
    loadRoster();
  }, []);

  // Update if props change
  useEffect(() => {
    if (initialPlayer1Id) setPlayer1Id(initialPlayer1Id);
    if (initialPlayer2Id) setPlayer2Id(initialPlayer2Id);
  }, [initialPlayer1Id, initialPlayer2Id]);

  // 2. Fetch Comparison when both IDs are chosen
  useEffect(() => {
    if (!player1Id || !player2Id) return;

    async function fetchComparison() {
      setLoadingCompare(true);
      setError(null);
      try {
        const res = await fetch(`/api/hockey-stats/compare?player1=${player1Id}&player2=${player2Id}`);
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to compare athletes');
        }
        const data = await res.json();
        setCompareData(data);
      } catch (err: any) {
        console.error('Comparison error:', err);
        setError(err.message || 'Error loading head-to-head comparison');
      } finally {
        setLoadingCompare(false);
      }
    }

    fetchComparison();
  }, [player1Id, player2Id]);

  // Swap players
  const handleSwap = () => {
    const temp = player1Id;
    setPlayer1Id(player2Id);
    setPlayer2Id(temp);
  };

  return (
    <div className="w-full space-y-8 font-montserrat">
      {/* 1. MATCHUP HEADER & PLAYER SELECTORS */}
      <div className="bg-[#18181b] border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-east-light/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-east-light/10 border border-east-light/30 text-east-light text-[10px] font-black uppercase tracking-widest mb-2">
            <Trophy className="w-3.5 h-3.5" />
            Head-to-Head Athlete Showcase
          </div>
          <h2 className="text-2xl sm:text-3xl font-black italic uppercase text-white tracking-wide">
            Stars Stats Player Comparison
          </h2>
          <p className="text-xs text-gray-400 mt-1 max-w-xl mx-auto">
            Compare career tournament statistics, scoring rates, and collectible digital hockey cards side-by-side
          </p>
        </div>

        {/* SELECTOR BAR: PLAYER 1 vs PLAYER 2 */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
          {/* Player 1 Dropdown */}
          <div className="md:col-span-5 bg-black/70 border border-white/15 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-neutral-800 overflow-hidden relative shrink-0 border border-east-light/40 shadow-md">
              {compareData?.player1.profile.avatar_url ? (
                <Image
                  src={compareData.player1.profile.avatar_url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  <User className="w-6 h-6" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <label className="text-[9px] font-black text-east-light uppercase tracking-widest block mb-1">
                Athlete 1 (Left Card)
              </label>
              <select
                value={player1Id}
                onChange={(e) => setPlayer1Id(e.target.value)}
                className="w-full bg-[#121214] border border-white/20 text-white font-bold text-sm px-3 py-2 rounded-xl focus:border-east-light outline-none"
              >
                {loadingPlayers ? (
                  <option>Loading athletes...</option>
                ) : (
                  availablePlayers.map((p) => (
                    <option key={`p1-${p.id}`} value={p.id}>
                      {p.first_name} {p.last_name} ({p.team})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Swap / VS Crest */}
          <div className="md:col-span-1 flex justify-center">
            <button
              type="button"
              onClick={handleSwap}
              title="Swap athletes"
              className="w-11 h-11 rounded-2xl bg-neutral-900 border border-white/20 hover:border-east-light hover:bg-east-light hover:text-black text-white flex items-center justify-center transition-all shadow-xl group"
            >
              <ArrowRightLeft className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
            </button>
          </div>

          {/* Player 2 Dropdown */}
          <div className="md:col-span-5 bg-black/70 border border-white/15 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-neutral-800 overflow-hidden relative shrink-0 border border-cyan-400/40 shadow-md">
              {compareData?.player2.profile.avatar_url ? (
                <Image
                  src={compareData.player2.profile.avatar_url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  <User className="w-6 h-6" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <label className="text-[9px] font-black text-cyan-400 uppercase tracking-widest block mb-1">
                Athlete 2 (Right Card)
              </label>
              <select
                value={player2Id}
                onChange={(e) => setPlayer2Id(e.target.value)}
                className="w-full bg-[#121214] border border-white/20 text-white font-bold text-sm px-3 py-2 rounded-xl focus:border-cyan-400 outline-none"
              >
                {loadingPlayers ? (
                  <option>Loading athletes...</option>
                ) : (
                  availablePlayers.map((p) => (
                    <option key={`p2-${p.id}`} value={p.id}>
                      {p.first_name} {p.last_name} ({p.team})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ERROR OR LOADING STATE */}
      {loadingCompare && (
        <div className="py-20 text-center font-montserrat">
          <div className="w-10 h-10 border-2 border-east-light border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">
            Calculating head-to-head metric analytics...
          </p>
        </div>
      )}

      {error && !loadingCompare && (
        <div className="p-6 bg-red-950/40 border border-red-500/30 rounded-2xl text-center text-xs text-red-300 font-bold uppercase tracking-wider">
          {error}
        </div>
      )}

      {/* COMPARISON CONTENT */}
      {compareData && !loadingCompare && (
        <div className="space-y-8 animate-fadeIn">
          {/* 2. TALE OF THE TAPE: METRIC BARS */}
          <div className="bg-[#18181b] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-east-light" />
                <h3 className="text-base font-black italic uppercase text-white tracking-wide">
                  Tale of the Tape • Career Performance
                </h3>
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Green Bar = Leader
              </span>
            </div>

            {/* Comparison Metrics Grid */}
            <div className="space-y-4">
              {compareData.comparisonMetrics.map((item) => {
                const total = (item.p1 || 0) + (item.p2 || 0);
                const p1Pct = total > 0 ? ((item.p1 || 0) / total) * 100 : 50;
                const p2Pct = total > 0 ? ((item.p2 || 0) / total) * 100 : 50;

                const isP1Leader = item.leader === 'player1';
                const isP2Leader = item.leader === 'player2';

                return (
                  <div
                    key={item.key}
                    className="p-3.5 bg-black/40 rounded-2xl border border-white/5 hover:border-white/20 transition-all"
                  >
                    {/* Value row with Metric title in center */}
                    <div className="flex items-center justify-between text-xs font-bold mb-2">
                      {/* Player 1 value */}
                      <div className="flex items-center gap-2 w-1/3">
                        {isP1Leader && (
                          <Crown className="w-3.5 h-3.5 text-east-light fill-east-light" />
                        )}
                        <span
                          className={`text-lg font-black italic ${
                            isP1Leader ? 'text-east-light' : 'text-gray-300'
                          }`}
                        >
                          {item.p1}
                        </span>
                      </div>

                      {/* Metric Name */}
                      <div className="w-1/3 text-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                          {item.metric}
                        </span>
                      </div>

                      {/* Player 2 value */}
                      <div className="flex items-center justify-end gap-2 w-1/3">
                        <span
                          className={`text-lg font-black italic ${
                            isP2Leader ? 'text-cyan-400' : 'text-gray-300'
                          }`}
                        >
                          {item.p2}
                        </span>
                        {isP2Leader && (
                          <Crown className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
                        )}
                      </div>
                    </div>

                    {/* Dual Comparative Progress Bar */}
                    <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-white/10">
                      <div
                        className={`h-full rounded-l-full transition-all duration-700 ${
                          isP1Leader ? 'bg-east-light shadow-[0_0_8px_rgba(40,209,96,0.6)]' : 'bg-gray-600'
                        }`}
                        style={{ width: `${p1Pct}%` }}
                      />
                      <div
                        className={`h-full rounded-r-full transition-all duration-700 ${
                          isP2Leader ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]' : 'bg-gray-600'
                        }`}
                        style={{ width: `${p2Pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. SIDE-BY-SIDE HOCKEY CARDS SHOWCASE */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-east-light" />
                <h3 className="text-base font-black italic uppercase text-white tracking-wide">
                  Collectible Hockey Cards • Interactive 3D Cards
                </h3>
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Click any card to flip & inspect career ledger
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start justify-items-center">
              {/* CARD 1 */}
              <div className="w-full max-w-sm flex flex-col items-center">
                <div className="mb-3 flex items-center justify-between w-full px-2">
                  <span className="text-xs font-black italic uppercase text-east-light tracking-wider flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-east-light" />
                    {compareData.player1.profile.first_name} {compareData.player1.profile.last_name}
                  </span>
                  <Link
                    href={`/profile/${compareData.player1.profile.id}`}
                    className="text-[10px] font-bold text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    View Profile <ExternalLink className="w-2.5 h-2.5" />
                  </Link>
                </div>
                <HockeyCard
                  player={{
                    id: compareData.player1.profile.id,
                    first_name: compareData.player1.profile.first_name,
                    last_name: compareData.player1.profile.last_name,
                    username: compareData.player1.profile.username,
                    avatar_url: compareData.player1.profile.avatar_url,
                    team: compareData.player1.profile.team,
                  }}
                  hockeyStats={compareData.player1.stats}
                />
              </div>

              {/* CARD 2 */}
              <div className="w-full max-w-sm flex flex-col items-center">
                <div className="mb-3 flex items-center justify-between w-full px-2">
                  <span className="text-xs font-black italic uppercase text-cyan-400 tracking-wider flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-cyan-400" />
                    {compareData.player2.profile.first_name} {compareData.player2.profile.last_name}
                  </span>
                  <Link
                    href={`/profile/${compareData.player2.profile.id}`}
                    className="text-[10px] font-bold text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    View Profile <ExternalLink className="w-2.5 h-2.5" />
                  </Link>
                </div>
                <HockeyCard
                  player={{
                    id: compareData.player2.profile.id,
                    first_name: compareData.player2.profile.first_name,
                    last_name: compareData.player2.profile.last_name,
                    username: compareData.player2.profile.username,
                    avatar_url: compareData.player2.profile.avatar_url,
                    team: compareData.player2.profile.team,
                  }}
                  hockeyStats={compareData.player2.stats}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
