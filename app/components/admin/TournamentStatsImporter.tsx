'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Trophy, CheckCircle2, AlertCircle, ArrowRight, Shield, RefreshCw, Upload, Users, Award, ExternalLink } from 'lucide-react';
import { useToast } from '@/app/components/ui/Toast';
import { HockeyCompetitionType, MatchedProfile, ParsedTournamentRow } from '@/app/types/stats';
import Link from 'next/link';

const POPULAR_TEAMS = [
  'U13 EAST Stars (25/26)',
  'EAST Stars U11 (25/26)',
  'U15 EAST Stars (25/26)',
  'U17 EAST Stars (25/26)',
  'Pro Dev League 25/26'
];

const POPULAR_COMPETITIONS = [
  'Quebec International Pee-Wee Tournament',
  'Hong Kong Youth League',
  'Bangkok Youth Hockey Cup',
  'Singapore Ice Hockey Invitational',
  'WSI World Selects Invitational'
];

export default function TournamentStatsImporter() {
  const { addToast } = useToast();

  // Tournament Metadata
  const [season, setSeason] = useState('2024-25');
  const [teamName, setTeamName] = useState('U13 EAST Stars (25/26)');
  const [division, setDivision] = useState('U13');
  const [competitionName, setCompetitionName] = useState('Quebec International Pee-Wee Tournament');
  const [competitionType, setCompetitionType] = useState<HockeyCompetitionType>('TOURNAMENT');

  // Paste / Parse state
  const [rawText, setRawText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedTournamentRow[]>([]);
  const [allProfiles, setAllProfiles] = useState<MatchedProfile[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessInfo, setSaveSuccessInfo] = useState<{ count: number; comp: string } | null>(null);

  // Auto-detect division when team changes
  useEffect(() => {
    if (teamName.includes('U11')) setDivision('U11');
    else if (teamName.includes('U13')) setDivision('U13');
    else if (teamName.includes('U15')) setDivision('U15');
    else if (teamName.includes('U17')) setDivision('U17');
    else if (teamName.includes('U18')) setDivision('U18');
  }, [teamName]);

  // Load sample data for instant demonstration
  const handleLoadSample = () => {
    setSeason('2024-25');
    setTeamName('U13 EAST Stars (25/26)');
    setDivision('U13');
    setCompetitionName('Quebec International Pee-Wee Tournament');
    setCompetitionType('TOURNAMENT');
    setRawText(
`#\tPlayer\tPos\tGP\tG\tA\tPTS\tPIM\tPPG\tSHG\tGWG
8\tNewland, Kyler (C)\tF\t5\t3\t2\t5\t2\t1\t0\t1
17\tLeung, Charles\tD\t5\t1\t4\t5\t4\t0\t0\t0
29\tPang, Jordan\tF\t5\t2\t3\t5\t0\t1\t0\t0
11\tLam, Anson\tF\t5\t2\t1\t3\t2\t0\t0\t0
22\tCao, Kelvin\tD\t5\t0\t3\t3\t6\t0\t0\t0
97\tTham, Isaac\tF\t5\t4\t2\t6\t2\t1\t0\t1
14\tChan, Scarlet\tD\t5\t1\t1\t2\t0\t0\t0\t0
7\tLau, Aden\tF\t5\t1\t2\t3\t2\t0\t0\t0
19\tLau, Andus\tF\t5\t2\t0\t2\t0\t0\t0\t0
12\tHo, Adrian\tD\t5\t0\t2\t2\t4\t0\t0\t0`
    );
  };

  // Trigger server-side smart parse & fuzzy profile matching
  const handleParse = async () => {
    if (!rawText.trim()) {
      addToast('Please paste a tournament table or text first', 'error');
      return;
    }

    setIsParsing(true);
    setSaveSuccessInfo(null);

    try {
      const res = await fetch('/api/admin/hockey-stats/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText,
          teamFilter: division || teamName
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Parsing failed');

      setParsedRows(data.parsedRows || []);
      setAllProfiles(data.allProfiles || []);

      addToast(
        `Parsed ${data.totalRows} players (${data.matchedCount} auto-matched to EAST roster)!`,
        'success'
      );
    } catch (err: any) {
      console.error('Parse error:', err);
      addToast(err.message || 'Failed to parse tournament table', 'error');
    } finally {
      setIsParsing(false);
    }
  };

  // Change athlete assignment for a row
  const handleSelectProfile = (rowIndex: number, profileId: string) => {
    const updated = [...parsedRows];
    if (profileId === 'unmatched') {
      updated[rowIndex].matched_profile = null;
      updated[rowIndex].match_confidence = 'unmatched';
    } else {
      const p = allProfiles.find((x) => x.id === profileId);
      if (p) {
        updated[rowIndex].matched_profile = p;
        updated[rowIndex].match_confidence = 'exact';
      }
    }
    setParsedRows(updated);
  };

  // Remove a row
  const handleRemoveRow = (rowIndex: number) => {
    setParsedRows(parsedRows.filter((_, idx) => idx !== rowIndex));
  };

  // Sync to database
  const handleBatchSave = async () => {
    const matchedOnly = parsedRows.filter((r) => r.matched_profile !== null);
    if (matchedOnly.length === 0) {
      addToast('No matched players to sync. Please match at least one player.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        season,
        team_name: teamName,
        division,
        competition_name: competitionName,
        competition_type: competitionType,
        stats: matchedOnly.map((r) => ({
          player_id: r.matched_profile!.id,
          position_type: r.position_type,
          jersey_number: r.jersey_number,
          position: r.position,
          gp: r.gp,
          goals: r.goals,
          assists: r.assists,
          points: r.points,
          pim: r.pim,
          ppg: r.ppg,
          shg: r.shg,
          gwg: r.gwg,
          minutes_played: r.minutes_played,
          wins: r.wins,
          losses: r.losses,
          otl: r.otl,
          goals_against: r.goals_against,
          gaa: r.gaa,
          shots_against: r.shots_against,
          saves: r.saves,
          save_pct: r.save_pct,
          shutouts: r.shutouts,
          accolades: [competitionName]
        }))
      };

      const res = await fetch('/api/admin/hockey-stats/batch-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save stats');

      setSaveSuccessInfo({
        count: json.savedCount,
        comp: competitionName
      });
      addToast(`🎉 Successfully synced ${json.savedCount} players to Digital Hockey Cards!`, 'success');
    } catch (err: any) {
      console.error('Batch save error:', err);
      addToast(err.message || 'Error saving tournament stats', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full space-y-8 font-montserrat">
      {/* 1. TOURNAMENT METADATA HEADER */}
      <div className="bg-[#18181b] border border-white/10 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-east-light/20 border border-east-light/40 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-east-light" />
            </div>
            <div>
              <h2 className="text-xl font-black italic uppercase text-white tracking-wide">
                Tournament & League Stats Importer
              </h2>
              <p className="text-xs text-gray-400">
                Zero-typing automated box score parser for EAST Stars Hockey Cards
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLoadSample}
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-[11px] font-bold text-gray-300 transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-east-light" />
            <span>Load Quebec Pee-Wee Demo</span>
          </button>
        </div>

        {/* METADATA FORM CONTROLS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Season */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
              Season
            </label>
            <input
              type="text"
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              placeholder="e.g. 2024-25"
              className="w-full bg-black/60 border border-white/20 px-3 py-2.5 rounded-xl text-sm font-bold text-white focus:border-east-light outline-none"
            />
          </div>

          {/* Team */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
              EAST Stars Team
            </label>
            <input
              type="text"
              list="popular-teams"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. U13 EAST Stars (25/26)"
              className="w-full bg-black/60 border border-white/20 px-3 py-2.5 rounded-xl text-sm font-bold text-white focus:border-east-light outline-none"
            />
            <datalist id="popular-teams">
              {POPULAR_TEAMS.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>

          {/* Competition Name */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
              Tournament / League
            </label>
            <input
              type="text"
              list="popular-comps"
              value={competitionName}
              onChange={(e) => setCompetitionName(e.target.value)}
              placeholder="e.g. Quebec Pee-Wee"
              className="w-full bg-black/60 border border-white/20 px-3 py-2.5 rounded-xl text-sm font-bold text-white focus:border-east-light outline-none"
            />
            <datalist id="popular-comps">
              {POPULAR_COMPETITIONS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          {/* Competition Type */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
              Event Type
            </label>
            <select
              value={competitionType}
              onChange={(e) => setCompetitionType(e.target.value as any)}
              className="w-full bg-black/60 border border-white/20 px-3 py-2.5 rounded-xl text-sm font-bold text-white focus:border-east-light outline-none"
            >
              <option value="TOURNAMENT">TOURNAMENT</option>
              <option value="LEAGUE">LEAGUE</option>
              <option value="EXHIBITION">EXHIBITION</option>
              <option value="CAMP">CAMP</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. ZERO-TYPING SMART PASTE DROPZONE */}
      <div className="bg-[#18181b] border border-white/10 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Upload className="w-4 h-4 text-east-light" />
            <span>Paste Tournament Table or Text</span>
          </label>
          <span className="text-[10px] text-gray-400">
            Supports tabs, commas, pipes, or raw copy from tournoipee-wee.qc.ca & GameSheet
          </span>
        </div>

        <textarea
          rows={6}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Highlight the stats table on any tournament website or sheet, press Cmd+C, and paste (Cmd+V) here...&#10;&#10;Example:&#10;#    Player    Pos    GP    G    A    PTS    PIM&#10;8    Newland, Kyler    F    5    3    2    5    2"
          className="w-full bg-black/70 border border-white/20 p-4 rounded-xl text-xs font-mono text-gray-200 focus:border-east-light outline-none transition-all resize-y"
        />

        <div className="flex items-center justify-between mt-4">
          <p className="text-[11px] text-gray-400 italic">
            💡 The parser will automatically strip captain markers, clean names, and match against active EAST athlete accounts.
          </p>

          <button
            type="button"
            onClick={handleParse}
            disabled={isParsing || !rawText.trim()}
            className="px-6 py-3 rounded-xl bg-east-light hover:bg-white text-black font-black italic uppercase tracking-wider text-xs transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
          >
            {isParsing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Parsing & Matching Roster...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Parse & Auto-Match Roster</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3. PARSED ROSTER REVIEW GRID */}
      {parsedRows.length > 0 && (
        <div className="bg-[#18181b] border border-white/10 rounded-2xl p-6 shadow-xl space-y-6 animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h3 className="text-lg font-black italic uppercase text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-east-light" />
                <span>Review & Verify Roster ({parsedRows.length} Players)</span>
              </h3>
              <p className="text-xs text-gray-400">
                {parsedRows.filter((r) => r.matched_profile).length} of {parsedRows.length} players matched to East App profiles.
              </p>
            </div>

            <button
              type="button"
              onClick={handleBatchSave}
              disabled={isSaving}
              className="px-6 py-3 rounded-xl bg-east-light hover:bg-white text-black font-black italic uppercase tracking-wider text-xs transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Syncing to Hockey Cards...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Sync All to Digital Hockey Cards</span>
                </>
              )}
            </button>
          </div>

          {/* TABLE DISPLAY */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[9px] font-black uppercase tracking-wider text-gray-400">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Raw Name</th>
                  <th className="py-2.5 px-3">Pos</th>
                  <th className="py-2.5 px-3">Matched East Profile</th>
                  <th className="py-2.5 px-2 text-center">GP</th>
                  <th className="py-2.5 px-2 text-center">G</th>
                  <th className="py-2.5 px-2 text-center">A</th>
                  <th className="py-2.5 px-2 text-center text-east-light">PTS</th>
                  <th className="py-2.5 px-2 text-center text-gray-400">PIM</th>
                  <th className="py-2.5 px-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {parsedRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    {/* Jersey */}
                    <td className="py-3 px-3 font-bold text-white">
                      {row.jersey_number ?? '-'}
                    </td>

                    {/* Raw Name */}
                    <td className="py-3 px-3 font-semibold text-gray-200">
                      {row.raw_name}
                    </td>

                    {/* Position */}
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black italic ${
                        row.position_type === 'GOALIE' ? 'bg-amber-500/20 text-amber-300' : 'bg-east-light/20 text-east-light'
                      }`}>
                        {row.position || (row.position_type === 'GOALIE' ? 'G' : 'F')}
                      </span>
                    </td>

                    {/* Matched Profile Selector */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        {row.matched_profile ? (
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <select
                              value={row.matched_profile.id}
                              onChange={(e) => handleSelectProfile(idx, e.target.value)}
                              className="bg-black/70 border border-emerald-500/40 px-2.5 py-1.5 rounded-lg text-xs font-bold text-white outline-none focus:border-east-light"
                            >
                              <option value={row.matched_profile.id}>
                                ✓ {row.matched_profile.first_name} {row.matched_profile.last_name} (@{row.matched_profile.username})
                              </option>
                              <option value="unmatched">-- Unlink profile --</option>
                              {allProfiles.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.first_name} {p.last_name} ({p.team || 'No team'})
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                            <select
                              value="unmatched"
                              onChange={(e) => handleSelectProfile(idx, e.target.value)}
                              className="bg-black/70 border border-amber-500/40 px-2.5 py-1.5 rounded-lg text-xs text-amber-300 outline-none focus:border-east-light font-bold"
                            >
                              <option value="unmatched">⚠️ Unmatched - Select athlete...</option>
                              {allProfiles.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.first_name} {p.last_name} ({p.team || 'No team'})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Stats Inputs */}
                    <td className="py-3 px-2 text-center font-bold text-white">{row.gp}</td>
                    <td className="py-3 px-2 text-center font-bold text-white">{row.goals}</td>
                    <td className="py-3 px-2 text-center font-bold text-white">{row.assists}</td>
                    <td className="py-3 px-2 text-center font-black text-east-light">{row.points}</td>
                    <td className="py-3 px-2 text-center text-gray-400">{row.pim}</td>

                    {/* Delete */}
                    <td className="py-3 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(idx)}
                        className="text-[10px] text-red-400 hover:text-red-300 px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 transition-colors"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. SUCCESS BANNER & PROFILE PREVIEW LINK */}
      {saveSuccessInfo && (
        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            <div>
              <h4 className="text-base font-black italic uppercase text-white">
                Hockey Cards Updated Successfully!
              </h4>
              <p className="text-xs text-emerald-200/80">
                {saveSuccessInfo.count} athletes now have their {saveSuccessInfo.comp} tournament stats and career totals permanently logged.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {parsedRows[0]?.matched_profile && (
              <Link
                href={`/profile/${parsedRows[0].matched_profile.id}`}
                target="_blank"
                className="px-4 py-2.5 rounded-xl bg-east-light text-black font-black italic text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg hover:bg-white transition-all"
              >
                <span>View {parsedRows[0].matched_profile.first_name}'s Card</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
