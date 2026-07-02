export type StatFieldType = 'number' | 'time' | 'time-ms' | 'text' | 'dropdown';

export interface StatField {
  key: string;
  label: string;
  type: StatFieldType;
  unit?: string;
  options?: string[];
}

export type SportCategory = 'GOLF' | 'HYROX' | 'HOCKEY' | 'EAGL' | 'FITNESS_TEST';

export const CATEGORY_LABELS: Record<SportCategory, string> = {
  GOLF: 'GOLF',
  HYROX: 'HYROX',
  HOCKEY: 'HOCKEY',
  EAGL: 'EAGL',
  FITNESS_TEST: 'FITNESS TEST',
};

export const STAT_FIELDS: Record<SportCategory, StatField[]> = {
  GOLF: [
    { key: 'handicap', label: 'Handicap', type: 'number', unit: '' },
    { key: 'longest_drive', label: 'Longest Drive', type: 'number', unit: 'yds' },
    { key: 'closest_to_pin', label: 'Closest to Pin', type: 'number', unit: 'ft' },
    { key: 'tournament_wins', label: 'Tournament Wins', type: 'number', unit: '' },
    { key: 'league_wins', label: 'League Wins', type: 'number', unit: '' },
  ],
  HYROX: [
    { key: 'run_1km', label: '1KM Run Time', type: 'time', unit: 'mm:ss' },
    { key: 'ski_erg_1000m', label: 'Ski Erg: 1,000m', type: 'time', unit: 'mm:ss' },
    { key: 'sled_push_50m', label: 'Sled Push: 50m', type: 'time', unit: 'mm:ss' },
    { key: 'sled_pull_50m', label: 'Sled Pull: 50m', type: 'time', unit: 'mm:ss' },
    { key: 'burpee_broad_jumps_80m', label: 'Burpee Broad Jumps: 80m', type: 'time', unit: 'mm:ss' },
    { key: 'row_1000m', label: 'Row: 1,000m', type: 'time', unit: 'mm:ss' },
    { key: 'farmers_carry_200m', label: "Farmer's Carry: 200m", type: 'time', unit: 'mm:ss' },
    { key: 'sandbag_lunges_100m', label: 'Sandbag Lunges: 100m', type: 'time', unit: 'mm:ss' },
    { key: 'wall_balls_100', label: 'Wall Balls: 100 reps', type: 'time', unit: 'mm:ss' },
  ],
  HOCKEY: [
    { key: 'react_targets', label: 'React Targets', type: 'time-ms', unit: 'mm:ss.ms' },
    { key: 'classic_targets', label: 'Classic Targets', type: 'number', unit: '' },
    { key: 'total_pucks_shot', label: 'Total Pucks Shot', type: 'number', unit: '' },
  ],
  EAGL: [
    {
      key: 'season',
      label: 'Season',
      type: 'dropdown',
      options: ['1', '2', '3', '4', '5'],
      unit: '',
    },
    {
      key: 'division',
      label: 'Division',
      type: 'dropdown',
      options: ['Pro Men', 'Rec Men', 'Pro Women', 'Rec Women', 'Doubles Men', 'Doubles Women', 'Mixed Doubles', 'Parent - Child'],
      unit: '',
    },
    {
      key: 'week',
      label: 'Week',
      type: 'dropdown',
      options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
      unit: '',
    },
    { key: 'score', label: 'Score', type: 'number', unit: '' },
  ],
  FITNESS_TEST: [
    { key: 'test', label: 'Test', type: 'text', unit: '' },
    { key: 'agility', label: 'Agility', type: 'time', unit: 'mm:ss' },
    { key: 'on_ice_agility_with_puck', label: 'On Ice Agility with Puck', type: 'time', unit: 'mm:ss' },
    { key: 'on_ice_agility', label: 'On Ice Agility', type: 'time', unit: 'mm:ss' },
    { key: 'skating', label: 'Skating', type: 'time', unit: 'mm:ss' },
    { key: 'critical_power', label: 'Critical Power', type: 'time', unit: 'mm:ss' },
    { key: 'pushups', label: 'Pushups', type: 'number', unit: '#' },
    { key: 'long_jump', label: 'Long Jump', type: 'number', unit: 'cm' },
    { key: 'height', label: 'Height', type: 'number', unit: 'cm' },
    { key: 'weight', label: 'Weight', type: 'number', unit: 'kg' },
    { key: 'targets', label: 'Targets', type: 'number', unit: '#' },
    { key: 'squat_1rm', label: '1RM Squat', type: 'number', unit: 'kg' },
    { key: 'bench_press_1rm', label: '1RM Bench Press', type: 'number', unit: 'kg' },
    { key: 'deadlift_1rm', label: '1RM Deadlift', type: 'number', unit: 'kg' },
    { key: 'clean_1rm', label: '1RM Clean', type: 'number', unit: 'kg' },
    { key: 'vald_grip', label: 'VALD Grip', type: 'number', unit: '#' },
    { key: 'vald_drop_jump', label: 'VALD Drop Jump', type: 'number', unit: '#' },
    { key: 'vald_cmj', label: 'VALD CMJ', type: 'number', unit: '#' },
    { key: 'vald_cmj_sl', label: 'VALD CMJ SL', type: 'number', unit: '#' },
  ],
};

export const SPORT_CATEGORIES = Object.keys(STAT_FIELDS) as SportCategory[];

export function getLeaderboardFields(category: SportCategory): StatField[] {
  return (STAT_FIELDS[category] || []).filter((field) => field.type !== 'text');
}

export function isLowerBetter(category: SportCategory, fieldKey: string): boolean {
  const field = STAT_FIELDS[category]?.find((f) => f.key === fieldKey);
  if (!field) return false;
  if (field.type === 'time' || field.type === 'time-ms') return true;
  if (category === 'GOLF' && (fieldKey === 'handicap' || fieldKey.includes('round'))) return true;
  if (category === 'EAGL' && fieldKey === 'score') return true;
  return false;
}

export interface PersonalStat {
  key: string;
  label: string;
  value: string | number;
  unit: string;
  category: SportCategory;
}

export function normalizeCategory(category: string): SportCategory | null {
  const normalized = category.toUpperCase() as SportCategory;
  return SPORT_CATEGORIES.includes(normalized) ? normalized : null;
}

export function getActivePersonalStats(
  categoryStats: Record<string, Record<string, unknown>>
): PersonalStat[] {
  const results: PersonalStat[] = [];

  for (const [rawCategory, stats] of Object.entries(categoryStats)) {
    const category = normalizeCategory(rawCategory);
    if (!category || !stats) continue;

    for (const field of STAT_FIELDS[category]) {
      const value = stats[field.key];
      if (value === undefined || value === null || value === '') continue;

      results.push({
        key: field.key,
        label: field.label,
        value: value as string | number,
        unit: field.unit || '',
        category,
      });
    }
  }

  return results;
}