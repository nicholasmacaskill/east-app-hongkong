'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { RotateCw, Trophy, Shield, Award, Sparkles, CheckCircle2, ChevronRight, Calendar, Hash } from 'lucide-react';
import { HockeyCardCareerTotals, PlayerHockeyStat } from '@/app/types/stats';

interface HockeyCardProps {
  player: {
    id: string;
    first_name: string;
    last_name: string;
    username?: string;
    avatar_url?: string | null;
    team?: string | null;
  };
  hockeyStats: PlayerHockeyStat[];
  careerTotals?: HockeyCardCareerTotals | null;
  isLoading?: boolean;
}

export default function HockeyCard({ player, hockeyStats = [], careerTotals, isLoading = false }: HockeyCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedRankFilter, setSelectedRankFilter] = useState<'ALL' | 'U11' | 'U13' | 'U15' | 'U18'>('ALL');

  // Latest tournament/season row (if any)
  const latestStat = hockeyStats.length > 0 ? hockeyStats[0] : null;
  const isGoalie = latestStat?.position_type === 'GOALIE' || latestStat?.position === 'G';
  const jerseyNumber = latestStat?.jersey_number ?? (player.username?.match(/\d+$/)?.[0]?.slice(-2) ?? '88');
  const position = latestStat?.position || (isGoalie ? 'G' : 'F');
  const primaryTeam = latestStat?.team_name || player.team || 'EAST Stars U13';
  const currentSeason = latestStat?.season || '2024-25';

  // Identify which ranks the athlete has played in
  const ranksPlayed = new Set(
    hockeyStats
      .map((s) => {
        const div = s.division?.toUpperCase() || '';
        if (div.includes('U11')) return 'U11';
        if (div.includes('U13')) return 'U13';
        if (div.includes('U15')) return 'U15';
        if (div.includes('U18') || div.includes('U17')) return 'U18';
        return '';
      })
      .filter(Boolean)
  );
  if (player.team?.includes('U11')) ranksPlayed.add('U11');
  if (player.team?.includes('U13')) ranksPlayed.add('U13');
  if (player.team?.includes('U15')) ranksPlayed.add('U15');
  if (player.team?.includes('U17') || player.team?.includes('U18')) ranksPlayed.add('U18');

  // Filter stats if rank selected
  const displayedStats =
    selectedRankFilter === 'ALL'
      ? hockeyStats
      : hockeyStats.filter((s) => s.division?.toUpperCase().includes(selectedRankFilter));

  // Compute filtered totals
  const rankTotals = displayedStats.reduce(
    (acc, row) => ({
      gp: acc.gp + (row.gp || 0),
      goals: acc.goals + (row.goals || 0),
      assists: acc.assists + (row.assists || 0),
      points: acc.points + (row.points || 0),
      pim: acc.pim + (row.pim || 0),
    }),
    { gp: 0, goals: 0, assists: 0, points: 0, pim: 0 }
  );

  if (isLoading) {
    return (
      <div className="w-full max-w-sm mx-auto aspect-[5/7] rounded-3xl bg-neutral-900/60 border border-white/10 animate-pulse flex flex-col items-center justify-center p-6 text-center">
        <Sparkles className="w-8 h-8 text-east-light animate-spin mb-3 opacity-60" />
        <p className="text-xs uppercase tracking-widest font-black text-white/50 font-montserrat">
          Forging Hockey Card...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto font-montserrat select-none">
      {/* 3D Flip Card Container */}
      <div
        className="relative aspect-[5/7.2] w-full [perspective:1200px] cursor-pointer group"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div
          className={`relative w-full h-full duration-700 transition-all [transform-style:preserve-3d] ${
            isFlipped ? '[transform:rotateY(180deg)]' : ''
          }`}
          style={{
            transformStyle: 'preserve-3d',
            WebkitTransformStyle: 'preserve-3d',
          }}
        >
          {/* ============================================================== */}
          {/* ======================= FRONT OF CARD ======================= */}
          {/* ============================================================== */}
          <div
            data-testid="hockey-card-front"
            className={`absolute inset-0 w-full h-full rounded-3xl overflow-hidden border-2 border-east-light/40 shadow-[0_0_35px_rgba(40,209,96,0.25)] bg-[#0d0d11] flex flex-col justify-between p-5 transition-opacity duration-300 ${
              isFlipped ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
            style={{
              WebkitBackfaceVisibility: 'hidden',
              backfaceVisibility: 'hidden',
              transform: 'rotateY(0deg)',
              zIndex: isFlipped ? 0 : 10,
            }}
          >
            {/* Holographic metallic foil sheen */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-east-light/10 pointer-events-none opacity-60" />
            <div className="absolute top-0 right-0 w-44 h-44 bg-east-light/10 rounded-full blur-3xl pointer-events-none" />

            {/* TOP HEADER: EAST STARS CREST + DIVISION */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-black/60 border border-east-light/30 flex items-center justify-center shadow-lg">
                  <Shield className="w-5 h-5 text-east-light" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-black italic tracking-wider text-white uppercase">EAST STARS</span>
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-east-light/20 text-east-light uppercase tracking-widest border border-east-light/30">
                      ELITE
                    </span>
                  </div>
                  <p className="text-[9px] font-semibold text-gray-400 tracking-wider uppercase">{primaryTeam}</p>
                </div>
              </div>

              {/* FLIP HINT BUTTON */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(!isFlipped);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-[9px] font-bold text-white transition-all shadow-md group-hover:scale-105"
              >
                <RotateCw className="w-3 h-3 text-east-light" />
                <span>FLIP</span>
              </button>
            </div>

            {/* HERO PLAYER PORTRAIT & JERSEY NUMBER */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center my-2">
              {/* Giant Jersey Number in background */}
              <div className="absolute top-1/2 -translate-y-1/2 text-white/5 text-8xl font-black italic select-none pointer-events-none tracking-tighter">
                #{jerseyNumber}
              </div>

              {/* Portrait Frame with Glow */}
              <div className="relative w-36 h-36 rounded-full p-1 bg-gradient-to-tr from-east-light/40 via-white/20 to-east-light/80 shadow-2xl">
                <div className="w-full h-full rounded-full overflow-hidden bg-neutral-900 relative">
                  <Image
                    src={player.avatar_url || 'https://images.pexels.com/photos/6550836/pexels-photo-6550836.jpeg'}
                    alt={`${player.first_name} ${player.last_name}`}
                    fill
                    className="object-cover"
                    sizes="160px"
                  />
                </div>
                {/* Position Badge Pill */}
                <div className="absolute -bottom-1 -right-1 px-2.5 py-0.5 rounded-full bg-black/90 border border-east-light text-east-light text-[10px] font-black italic shadow-lg">
                  {position}
                </div>
                {/* Jersey # Badge */}
                <div className="absolute -top-1 -left-1 px-2 py-0.5 rounded-full bg-east-light text-black text-[10px] font-black italic shadow-lg flex items-center gap-0.5">
                  <Hash className="w-2.5 h-2.5" />
                  {jerseyNumber}
                </div>
              </div>

              {/* Athlete Name */}
              <div className="text-center mt-3">
                <h3 className="text-xl font-black italic uppercase tracking-tight text-white drop-shadow-md">
                  {player.first_name} <span className="text-east-light">{player.last_name}</span>
                </h3>
                {player.username && (
                  <p className="text-[10px] font-medium text-gray-400 tracking-wider">@{player.username}</p>
                )}
              </div>
            </div>

            {/* QUICK-HIT CURRENT STATS RIBBON */}
            <div className="relative z-10 bg-white/5 rounded-2xl border border-white/10 p-3 backdrop-blur-md">
              <div className="flex items-center justify-between text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-1">
                <span>{latestStat ? latestStat.competition_name : '2024-25 SEASON'}</span>
                <span className="text-east-light">{currentSeason}</span>
              </div>

              {latestStat ? (
                isGoalie ? (
                  /* GOALIE QUICK STATS */
                  <div className="grid grid-cols-4 gap-1 text-center">
                    <div className="bg-black/40 rounded-xl py-1.5 border border-white/5">
                      <div className="text-[8px] font-bold text-gray-400 uppercase">GP</div>
                      <div className="text-sm font-black text-white italic">{latestStat.gp}</div>
                    </div>
                    <div className="bg-black/40 rounded-xl py-1.5 border border-white/5">
                      <div className="text-[8px] font-bold text-gray-400 uppercase">GAA</div>
                      <div className="text-sm font-black text-east-light italic">{latestStat.gaa?.toFixed(2)}</div>
                    </div>
                    <div className="bg-black/40 rounded-xl py-1.5 border border-white/5">
                      <div className="text-[8px] font-bold text-gray-400 uppercase">SV%</div>
                      <div className="text-sm font-black text-white italic">{latestStat.save_pct?.toFixed(3)}</div>
                    </div>
                    <div className="bg-black/40 rounded-xl py-1.5 border border-white/5">
                      <div className="text-[8px] font-bold text-gray-400 uppercase">SO</div>
                      <div className="text-sm font-black text-east-light italic">{latestStat.shutouts}</div>
                    </div>
                  </div>
                ) : (
                  /* SKATER QUICK STATS */
                  <div className="grid grid-cols-4 gap-1 text-center">
                    <div className="bg-black/40 rounded-xl py-1.5 border border-white/5">
                      <div className="text-[8px] font-bold text-gray-400 uppercase">GP</div>
                      <div className="text-sm font-black text-white italic">{latestStat.gp}</div>
                    </div>
                    <div className="bg-black/40 rounded-xl py-1.5 border border-white/5">
                      <div className="text-[8px] font-bold text-gray-400 uppercase">GOALS</div>
                      <div className="text-sm font-black text-east-light italic">{latestStat.goals}</div>
                    </div>
                    <div className="bg-black/40 rounded-xl py-1.5 border border-white/5">
                      <div className="text-[8px] font-bold text-gray-400 uppercase">ASSISTS</div>
                      <div className="text-sm font-black text-white italic">{latestStat.assists}</div>
                    </div>
                    <div className="bg-black/40 rounded-xl py-1.5 border border-white/5">
                      <div className="text-[8px] font-bold text-gray-400 uppercase">PTS</div>
                      <div className="text-sm font-black text-east-light italic">{latestStat.points}</div>
                    </div>
                  </div>
                )
              ) : (
                <div className="py-2 text-center text-[10px] text-gray-400 font-medium italic">
                  ⭐ Rookie Season • Awaiting tournament box scores
                </div>
              )}
            </div>

            {/* BOTTOM VERIFICATION BAR */}
            <div className="relative z-10 flex items-center justify-between text-[8px] font-bold text-gray-400 uppercase tracking-widest pt-2 px-1 border-t border-white/5">
              <div className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                <span>OFFICIAL EAST CARD</span>
              </div>
              <span className="text-white/40">TAP TO VIEW CAREER LEDGER</span>
            </div>
          </div>

          {/* ============================================================== */}
          {/* ======================= BACK OF CARD ======================== */}
          {/* ============================================================== */}
          <div
            data-testid="hockey-card-back"
            className={`absolute inset-0 w-full h-full rounded-3xl overflow-hidden border-2 border-east-light/40 shadow-2xl bg-[#0d0d11] flex flex-col justify-between p-5 transition-opacity duration-300 ${
              isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            style={{
              WebkitBackfaceVisibility: 'hidden',
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              zIndex: isFlipped ? 10 : 0,
            }}
          >
            {/* Holographic backdrop */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-east-light/5 pointer-events-none" />

            {/* TOP HEADER: CAREER LEDGER */}
            <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-2.5">
              <div>
                <h4 className="text-xs font-black italic tracking-wider text-white uppercase flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-east-light" />
                  CAREER TOURNAMENT LEDGER
                </h4>
                <p className="text-[9px] font-bold text-east-light uppercase tracking-widest">
                  {player.first_name} {player.last_name} • #{jerseyNumber}
                </p>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(!isFlipped);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-[9px] font-bold text-white transition-all shadow-md"
              >
                <RotateCw className="w-3 h-3 text-east-light" />
                <span>FRONT</span>
              </button>
            </div>

            {/* EAST STARS RANKS PROGRESSION PATHWAY */}
            <div className="relative z-10 pt-2 pb-1 border-b border-white/5">
              <div className="flex items-center justify-between text-[7px] font-black uppercase tracking-widest text-gray-400 mb-1.5 px-0.5">
                <span className="flex items-center gap-1 text-east-light">
                  <Shield className="w-2.5 h-2.5" />
                  RANKS PROGRESSION
                </span>
                <span className="text-white/50">U11 ➔ U13 ➔ U15 ➔ U18</span>
              </div>

              {/* Rank Filter Pills */}
              <div className="flex items-center gap-1">
                {(['ALL', 'U11', 'U13', 'U15', 'U18'] as const).map((rank) => {
                  const isPlayed = rank === 'ALL' || ranksPlayed.has(rank);
                  const isSelected = selectedRankFilter === rank;

                  return (
                    <button
                      key={rank}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRankFilter(rank);
                      }}
                      className={`flex-1 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-0.5 ${
                        isSelected
                          ? 'bg-east-light text-black shadow-md font-black'
                          : isPlayed
                          ? 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                          : 'bg-white/5 text-gray-500 opacity-60'
                      }`}
                    >
                      {rank}
                      {isPlayed && rank !== 'ALL' && (
                        <span className="w-1 h-1 rounded-full bg-emerald-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CAREER HISTORY TABLE */}
            <div className="relative z-10 flex-1 my-2 overflow-y-auto pr-1 space-y-1.5">
              {displayedStats.length > 0 ? (
                <>
                  <div className="text-[8px] font-black uppercase tracking-wider text-gray-400 grid grid-cols-12 gap-1 px-1.5 pb-1 border-b border-white/5">
                    <span className="col-span-3">SEASON / TIER</span>
                    <span className="col-span-4">COMPETITION</span>
                    <span className="col-span-1 text-center">GP</span>
                    <span className="col-span-1 text-center">G</span>
                    <span className="col-span-1 text-center">A</span>
                    <span className="col-span-1 text-center text-east-light">PTS</span>
                    <span className="col-span-1 text-center text-gray-500">PIM</span>
                  </div>

                  {displayedStats.map((row) => (
                    <div
                      key={row.id}
                      className="bg-white/5 hover:bg-white/10 transition-colors rounded-xl p-2 border border-white/5 text-[9px]"
                    >
                      <div className="grid grid-cols-12 gap-1 items-center">
                        <div className="col-span-3 leading-tight truncate">
                          <span className="font-black text-white italic">{row.season}</span>
                          <span className="text-[8px] block text-east-light font-bold truncate">
                            {row.division}
                          </span>
                        </div>
                        <div className="col-span-4 leading-tight truncate">
                          <span className="font-semibold text-gray-200 truncate block">{row.competition_name}</span>
                          <span className="text-[7px] text-gray-400 font-bold uppercase">{row.competition_type}</span>
                        </div>
                        <span className="col-span-1 text-center font-bold text-white">{row.gp}</span>
                        <span className="col-span-1 text-center font-bold text-white">{row.goals}</span>
                        <span className="col-span-1 text-center font-bold text-white">{row.assists}</span>
                        <span className="col-span-1 text-center font-black text-east-light">{row.points}</span>
                        <span className="col-span-1 text-center text-gray-400">{row.pim}</span>
                      </div>

                      {/* Accolades or Awards for this tournament */}
                      {row.accolades && row.accolades.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1 pt-1 border-t border-white/5">
                          {row.accolades.map((acc, aIdx) => (
                            <span
                              key={aIdx}
                              className="text-[7px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1"
                            >
                              <Award className="w-2.5 h-2.5" />
                              {acc}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <Award className="w-8 h-8 text-white/20 mb-2" />
                  <p className="text-xs font-bold text-white/70 uppercase tracking-widest">
                    {selectedRankFilter === 'ALL' ? 'No Competitions Synced' : `No ${selectedRankFilter} Stats Yet`}
                  </p>
                  <p className="text-[9px] text-gray-400 mt-1 max-w-[200px]">
                    Stats populate automatically when tournament rosters are synced by EAST coaches.
                  </p>
                </div>
              )}
            </div>

            {/* CAREER TOTALS SUMMARY BANNER */}
            <div className="relative z-10 bg-gradient-to-r from-east-light/20 via-black to-east-light/20 border border-east-light/30 rounded-2xl p-2.5 shadow-lg">
              <div className="flex items-center justify-between text-[8px] font-black text-east-light uppercase tracking-widest mb-1.5">
                <span>
                  {selectedRankFilter === 'ALL' ? 'ALL-TIME EAST CAREER TOTALS' : `${selectedRankFilter} RANKS TOTALS`}
                </span>
                <span>
                  {displayedStats.length} {displayedStats.length === 1 ? 'TOURNAMENT' : 'TOURNAMENTS'}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1 text-center">
                <div className="bg-black/60 rounded-lg py-1 border border-white/10">
                  <div className="text-[7px] text-gray-400 uppercase font-bold">TOTAL GP</div>
                  <div className="text-xs font-black text-white italic">
                    {selectedRankFilter === 'ALL' ? careerTotals?.total_gp || rankTotals.gp : rankTotals.gp}
                  </div>
                </div>
                <div className="bg-black/60 rounded-lg py-1 border border-white/10">
                  <div className="text-[7px] text-gray-400 uppercase font-bold">GOALS</div>
                  <div className="text-xs font-black text-east-light italic">
                    {selectedRankFilter === 'ALL' ? careerTotals?.total_goals || rankTotals.goals : rankTotals.goals}
                  </div>
                </div>
                <div className="bg-black/60 rounded-lg py-1 border border-white/10">
                  <div className="text-[7px] text-gray-400 uppercase font-bold">ASSISTS</div>
                  <div className="text-xs font-black text-white italic">
                    {selectedRankFilter === 'ALL' ? careerTotals?.total_assists || rankTotals.assists : rankTotals.assists}
                  </div>
                </div>
                <div className="bg-black/60 rounded-lg py-1 border border-white/10">
                  <div className="text-[7px] text-gray-400 uppercase font-bold">PTS</div>
                  <div className="text-xs font-black text-east-light italic">
                    {selectedRankFilter === 'ALL' ? careerTotals?.total_points || rankTotals.points : rankTotals.points}
                  </div>
                </div>
                <div className="bg-black/60 rounded-lg py-1 border border-white/10">
                  <div className="text-[7px] text-gray-400 uppercase font-bold">PIM</div>
                  <div className="text-xs font-black text-gray-400 italic">
                    {selectedRankFilter === 'ALL' ? careerTotals?.total_pim || rankTotals.pim : rankTotals.pim}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
