import { HockeyPositionType, MatchedProfile, ParsedTournamentRow } from '@/app/types/stats';

// Normalize string for fuzzy matching (removes accents, punctuation, extra spaces)
export function normalizeName(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Clean player name from common table artifacts (e.g. "8 - Wong, Alexander (C)")
export function cleanRawName(raw: string): { cleanName: string; detectedJersey?: number; detectedPosition?: string } {
  let name = raw.trim();
  let detectedJersey: number | undefined;
  let detectedPosition: string | undefined;

  // Extract leading jersey if attached like "#8 Alexander" or "8. Alexander" or "8 Alexander"
  const leadingJerseyMatch = name.match(/^#?(\d{1,2})\s*[-.)]?\s+(.*)/);
  if (leadingJerseyMatch) {
    detectedJersey = parseInt(leadingJerseyMatch[1], 10);
    name = leadingJerseyMatch[2].trim();
  }

  // Remove captaincy markers like (C), (A), (AP)
  name = name.replace(/\s*\([CAap]+\)\s*$/i, '').trim();

  // If format is "Lastname, Firstname", convert to "Firstname Lastname"
  if (name.includes(',')) {
    const parts = name.split(',').map((p) => p.trim());
    if (parts.length === 2 && parts[0] && parts[1]) {
      name = `${parts[1]} ${parts[0]}`;
    }
  }

  return { cleanName: name, detectedJersey, detectedPosition };
}

// Smart profile matcher against database profiles
export function matchPlayerToProfile(
  cleanedName: string,
  profiles: MatchedProfile[],
  teamFilter?: string
): { profile: MatchedProfile | null; confidence: 'exact' | 'high' | 'medium' | 'unmatched' } {
  const normTarget = normalizeName(cleanedName);
  if (!normTarget) {
    return { profile: null, confidence: 'unmatched' };
  }

  const targetTokens = normTarget.split(' ').filter(Boolean);

  let bestMatch: MatchedProfile | null = null;
  let bestConfidence: 'exact' | 'high' | 'medium' | 'unmatched' = 'unmatched';
  let bestScore = 0;

  for (const p of profiles) {
    const pFullName = normalizeName(`${p.first_name || ''} ${p.last_name || ''}`);
    const pRevName = normalizeName(`${p.last_name || ''} ${p.first_name || ''}`);

    let score = 0;

    // Exact full name match
    if (pFullName === normTarget || pRevName === normTarget) {
      score = 100;
    } else {
      const pTokens = pFullName.split(' ').filter(Boolean);
      const matchingTokens = targetTokens.filter((t) => pTokens.includes(t));

      if (matchingTokens.length >= 2 && matchingTokens.length === targetTokens.length) {
        score = 85;
      } else if (matchingTokens.length >= 2) {
        score = 70;
      } else if (matchingTokens.length === 1 && targetTokens.length === 1) {
        score = 50;
      }
    }

    // Boost score if player is on the specified team
    if (teamFilter && p.team && p.team.toLowerCase().includes(teamFilter.toLowerCase())) {
      score += 10;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = p;
    }
  }

  if (bestScore >= 95) {
    bestConfidence = 'exact';
  } else if (bestScore >= 75) {
    bestConfidence = 'high';
  } else if (bestScore >= 50) {
    bestConfidence = 'medium';
  } else {
    bestMatch = null;
    bestConfidence = 'unmatched';
  }

  return { profile: bestMatch, confidence: bestConfidence };
}

interface ColumnIndices {
  jersey: number;
  name: number;
  pos: number;
  gp: number;
  goals: number;
  assists: number;
  pts: number;
  pim: number;
  ppg: number;
  shg: number;
  gwg: number;
  // Goalie
  min: number;
  wins: number;
  losses: number;
  otl: number;
  ga: number;
  gaa: number;
  sa: number;
  sv: number;
  savePct: number;
  so: number;
}

function detectHeaders(rowCells: string[]): { isHeader: boolean; isGoalieTable: boolean; indices: ColumnIndices } {
  const norm = rowCells.map((c) => c.toLowerCase().trim());
  const indices: ColumnIndices = {
    jersey: -1,
    name: -1,
    pos: -1,
    gp: -1,
    goals: -1,
    assists: -1,
    pts: -1,
    pim: -1,
    ppg: -1,
    shg: -1,
    gwg: -1,
    min: -1,
    wins: -1,
    losses: -1,
    otl: -1,
    ga: -1,
    gaa: -1,
    sa: -1,
    sv: -1,
    savePct: -1,
    so: -1,
  };

  let recognizedHeaders = 0;
  let isGoalieTable = false;

  norm.forEach((cell, idx) => {
    // Jersey
    if (['#', 'no', '##', 'num', 'jersey'].includes(cell)) {
      indices.jersey = idx;
      recognizedHeaders++;
    }
    // Name
    else if (['player', 'name', 'joueur', 'nom', 'athlete', 'skaters', 'goalers', 'goaltender'].includes(cell)) {
      indices.name = idx;
      recognizedHeaders++;
    }
    // Position
    else if (['pos', 'position', 'p'].includes(cell) && indices.pos === -1) {
      indices.pos = idx;
      recognizedHeaders++;
    }
    // GP
    else if (['gp', 'pj', 'games', 'm'].includes(cell)) {
      indices.gp = idx;
      recognizedHeaders++;
    }
    // Goals / Wins
    else if (['g', 'goals', 'b', 'buts'].includes(cell)) {
      indices.goals = idx;
      recognizedHeaders++;
    }
    // Assists / Losses
    else if (['a', 'assists', 'passes'].includes(cell)) {
      indices.assists = idx;
      recognizedHeaders++;
    }
    // Points
    else if (['pts', 'points'].includes(cell)) {
      indices.pts = idx;
      recognizedHeaders++;
    }
    // Penalty Minutes
    else if (['pim', 'pm', 'pmin', 'pen', 'pun', 'bar'].includes(cell)) {
      indices.pim = idx;
      recognizedHeaders++;
    }
    // Special Goals
    else if (['ppg', 'ban', 'pp'].includes(cell)) {
      indices.ppg = idx;
    } else if (['shg', 'bdn', 'sh', 'pkg'].includes(cell)) {
      indices.shg = idx;
    } else if (['gwg', 'bg', 'wg'].includes(cell)) {
      indices.gwg = idx;
    }
    // Goalie specific
    else if (['min', 'minutes'].includes(cell)) {
      indices.min = idx;
      isGoalieTable = true;
      recognizedHeaders++;
    } else if (['ga', 'ba'].includes(cell)) {
      indices.ga = idx;
      isGoalieTable = true;
      recognizedHeaders++;
    } else if (['gaa', 'moy'].includes(cell)) {
      indices.gaa = idx;
      isGoalieTable = true;
      recognizedHeaders++;
    } else if (['sa', 'bc', 'tirs'].includes(cell)) {
      indices.sa = idx;
      isGoalieTable = true;
      recognizedHeaders++;
    } else if (['sv', 'arr', 'sav'].includes(cell)) {
      indices.sv = idx;
      isGoalieTable = true;
      recognizedHeaders++;
    } else if (['sv%', '%arr', '%eff', 'sv_pct'].includes(cell)) {
      indices.savePct = idx;
      isGoalieTable = true;
      recognizedHeaders++;
    } else if (['so', 'bl', 'jb', 'shutouts'].includes(cell)) {
      indices.so = idx;
      isGoalieTable = true;
      recognizedHeaders++;
    }
  });

  const isHeader = recognizedHeaders >= 3;
  return { isHeader, isGoalieTable, indices };
}

function parseNumber(val: string | undefined): number {
  if (!val) return 0;
  const cleaned = val.replace(/[^0-9.-]/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

// Main parser function that takes raw text/pasted table and matches to active database profiles
export function parseTournamentTable(
  rawInput: string,
  availableProfiles: MatchedProfile[],
  teamFilter?: string
): ParsedTournamentRow[] {
  if (!rawInput || !rawInput.trim()) return [];

  // Split into lines
  const lines = rawInput
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  let currentIndices: ColumnIndices | null = null;
  let isCurrentGoalie = false;
  const results: ParsedTournamentRow[] = [];

  for (const line of lines) {
    // Delimiter detection: Tab, comma, pipe, or multiple spaces
    let cells: string[] = [];
    if (line.includes('\t')) {
      cells = line.split('\t').map((c) => c.trim());
    } else if (line.includes('|')) {
      cells = line
        .split('|')
        .map((c) => c.trim())
        .filter(Boolean);
    } else if (line.includes(',') && !line.includes('  ')) {
      cells = line.split(',').map((c) => c.trim());
    } else {
      // Split on 2 or more spaces
      cells = line.split(/\s{2,}/).map((c) => c.trim());
    }

    if (cells.length < 3) continue;

    // Check if this row is a header
    const headerCheck = detectHeaders(cells);
    if (headerCheck.isHeader) {
      currentIndices = headerCheck.indices;
      isCurrentGoalie = headerCheck.isGoalieTable;
      continue;
    }

    // If no header found yet, fallback to default hockey table layout:
    // Jersey | Name | Pos | GP | G | A | PTS | PIM
    const idx = currentIndices || {
      jersey: 0,
      name: 1,
      pos: 2,
      gp: 3,
      goals: 4,
      assists: 5,
      pts: 6,
      pim: 7,
      ppg: 8,
      shg: 9,
      gwg: 10,
      min: -1,
      wins: -1,
      losses: -1,
      otl: -1,
      ga: -1,
      gaa: -1,
      sa: -1,
      sv: -1,
      savePct: -1,
      so: -1,
    };

    const rawNameCell = idx.name !== -1 && cells[idx.name] ? cells[idx.name] : '';
    if (!rawNameCell) continue;

    // Skip legend / totals rows
    const lowerName = rawNameCell.toLowerCase();
    if (
      lowerName.includes('total') ||
      lowerName.includes('abreviation') ||
      lowerName.includes('team total') ||
      lowerName.includes('legend')
    ) {
      continue;
    }

    const { cleanName, detectedJersey } = cleanRawName(rawNameCell);
    if (!cleanName || cleanName.length < 2) continue;

    const jerseyNum = idx.jersey !== -1 && cells[idx.jersey] ? parseNumber(cells[idx.jersey]) : detectedJersey || null;
    const pos = idx.pos !== -1 && cells[idx.pos] ? cells[idx.pos].toUpperCase() : isCurrentGoalie ? 'G' : 'F';
    const positionType: HockeyPositionType = isCurrentGoalie || pos === 'G' ? 'GOALIE' : 'SKATER';

    const gp = idx.gp !== -1 ? parseNumber(cells[idx.gp]) : 0;
    const goals = idx.goals !== -1 ? parseNumber(cells[idx.goals]) : 0;
    const assists = idx.assists !== -1 ? parseNumber(cells[idx.assists]) : 0;
    const pts = idx.pts !== -1 ? parseNumber(cells[idx.pts]) : goals + assists;
    const pim = idx.pim !== -1 ? parseNumber(cells[idx.pim]) : 0;
    const ppg = idx.ppg !== -1 ? parseNumber(cells[idx.ppg]) : 0;
    const shg = idx.shg !== -1 ? parseNumber(cells[idx.shg]) : 0;
    const gwg = idx.gwg !== -1 ? parseNumber(cells[idx.gwg]) : 0;

    // Goalie stats
    const minutes = idx.min !== -1 ? parseNumber(cells[idx.min]) : undefined;
    const ga = idx.ga !== -1 ? parseNumber(cells[idx.ga]) : undefined;
    const gaa = idx.gaa !== -1 ? parseNumber(cells[idx.gaa]) : undefined;
    const sa = idx.sa !== -1 ? parseNumber(cells[idx.sa]) : undefined;
    const sv = idx.sv !== -1 ? parseNumber(cells[idx.sv]) : undefined;
    const savePct = idx.savePct !== -1 ? parseNumber(cells[idx.savePct]) : undefined;
    const so = idx.so !== -1 ? parseNumber(cells[idx.so]) : undefined;

    // Match profile
    const { profile, confidence } = matchPlayerToProfile(cleanName, availableProfiles, teamFilter);

    results.push({
      raw_name: cleanName,
      jersey_number: jerseyNum,
      position: pos,
      position_type: positionType,
      gp,
      goals,
      assists,
      points: pts,
      pim,
      ppg,
      shg,
      gwg,
      minutes_played: minutes,
      goals_against: ga,
      gaa,
      shots_against: sa,
      saves: sv,
      save_pct: savePct,
      shutouts: so,
      matched_profile: profile,
      match_confidence: confidence,
    });
  }

  return results;
}
