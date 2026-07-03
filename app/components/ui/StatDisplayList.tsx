'use client';

import React from 'react';
import { DisplayStatGroup, StatAccent } from '@/app/lib/statFields';

// Colour-coded accent applied to the stat value text and the leading dot
const ACCENT_VALUE: Record<StatAccent, string> = {
  cyan:    'text-cyan-400',
  amber:   'text-amber-400',
  rose:    'text-rose-400',
  violet:  'text-violet-400',
  sky:     'text-sky-400',
  emerald: 'text-emerald-400',
  orange:  'text-orange-400',
  lime:    'text-lime-400',
};

// Subtle dot colour to visually anchor each stat row to its category
const ACCENT_DOT: Record<StatAccent, string> = {
  cyan:    'bg-cyan-400',
  amber:   'bg-amber-400',
  rose:    'bg-rose-400',
  violet:  'bg-violet-400',
  sky:     'bg-sky-400',
  emerald: 'bg-emerald-400',
  orange:  'bg-orange-400',
  lime:    'bg-lime-400',
};

function StatGroupSection({ group }: { group: DisplayStatGroup }) {
  return (
    <div className="flex flex-col">
      {/* Section label — no box, just a subtle inline header */}
      <div className="flex items-center gap-2 mb-2 px-1">
        <span className="text-sm leading-none">{group.emoji}</span>
        <span className={`font-black italic text-[9px] uppercase tracking-widest ${ACCENT_VALUE[group.accent]}`}>
          {group.title}
        </span>
        <div className={`flex-1 h-px opacity-20 ${ACCENT_DOT[group.accent]}`} />
      </div>

      {/* Flat link-style rows — no container card, no background box */}
      <div className="flex flex-col">
        {group.rows.map((row, index) => (
          <div
            key={row.field.key}
            data-testid={`stat-row-${row.field.key}`}
            className={`flex items-center justify-between gap-3 py-3 px-2 ${
              index < group.rows.length - 1 ? 'border-b border-white/[0.06]' : ''
            }`}
          >
            {/* Left: colour dot + emoji + label */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${ACCENT_DOT[group.accent]}`}
              />
              <span className="text-base shrink-0 leading-none">{row.emoji}</span>
              <span className="text-[11px] font-semibold text-white/70 uppercase tracking-wide leading-snug">
                {row.field.label}
              </span>
            </div>

            {/* Right: value + unit, colour-coded */}
            <div className="flex items-baseline gap-1 shrink-0 text-right">
              <span className={`font-black text-base italic leading-none ${ACCENT_VALUE[group.accent]}`}>
                {row.value}
              </span>
              {row.field.unit ? (
                <span className="text-[9px] text-white/30 font-bold uppercase">
                  {row.field.unit}
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StatDisplayList({
  categoryLabel,
  subtitle,
  groups,
}: {
  categoryLabel: string;
  subtitle?: string;
  groups: DisplayStatGroup[];
}) {
  return (
    <div className="flex flex-col gap-5" data-testid="stat-display-list">
      {/* Category heading */}
      <div className="text-center">
        <h3 className="font-black italic text-[10px] text-white/30 uppercase tracking-widest">
          {categoryLabel} PERFORMANCE
        </h3>
        {subtitle ? (
          <p className="mt-1.5 text-[11px] font-bold text-east-light uppercase tracking-widest">
            {subtitle}
          </p>
        ) : null}
      </div>

      {/* Stat groups — flat, no card wrappers */}
      <div className="flex flex-col gap-6">
        {groups.map((group) => (
          <StatGroupSection
            key={`${group.title}-${group.rows.map((r) => r.field.key).join('-')}`}
            group={group}
          />
        ))}
      </div>
    </div>
  );
}