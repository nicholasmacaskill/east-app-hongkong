'use client';

import React from 'react';
import { DisplayStatGroup, StatAccent } from '@/app/lib/statFields';

const ACCENT_HEADER: Record<StatAccent, string> = {
  cyan: 'text-cyan-400',
  amber: 'text-amber-400',
  rose: 'text-rose-400',
  violet: 'text-violet-400',
  sky: 'text-sky-400',
  emerald: 'text-emerald-400',
  orange: 'text-orange-400',
  lime: 'text-lime-400',
};

const ACCENT_ROW: Record<StatAccent, string> = {
  cyan: 'border-l-cyan-400/60 bg-cyan-400/[0.04]',
  amber: 'border-l-amber-400/60 bg-amber-400/[0.04]',
  rose: 'border-l-rose-400/60 bg-rose-400/[0.04]',
  violet: 'border-l-violet-400/60 bg-violet-400/[0.04]',
  sky: 'border-l-sky-400/60 bg-sky-400/[0.04]',
  emerald: 'border-l-emerald-400/60 bg-emerald-400/[0.04]',
  orange: 'border-l-orange-400/60 bg-orange-400/[0.04]',
  lime: 'border-l-lime-400/60 bg-lime-400/[0.04]',
};

function StatGroupSection({ group }: { group: DisplayStatGroup }) {
  return (
    <div className="flex flex-col gap-2">
      <h4 className={`flex items-center gap-2 px-1 font-black italic text-[10px] uppercase tracking-widest ${ACCENT_HEADER[group.accent]}`}>
        <span className="text-sm not-italic leading-none">{group.emoji}</span>
        {group.title}
      </h4>
      <div className="rounded-xl border border-white/10 overflow-hidden bg-white/[0.02]">
        {group.rows.map((row, index) => (
          <div
            key={row.field.key}
            data-testid={`stat-row-${row.field.key}`}
            className={`flex items-center justify-between gap-3 py-3 px-4 border-l-2 ${ACCENT_ROW[group.accent]} ${
              index < group.rows.length - 1 ? 'border-b border-white/5' : ''
            }`}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="text-base shrink-0 leading-none">{row.emoji}</span>
              <span className="text-[11px] font-bold text-white/85 uppercase tracking-wide leading-snug">
                {row.field.label}
              </span>
            </div>
            <div className="flex items-baseline gap-1 shrink-0 text-right">
              <span className="font-black text-base text-white italic leading-none">{row.value}</span>
              {row.field.unit ? (
                <span className="text-[9px] text-white/40 font-bold uppercase">{row.field.unit}</span>
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
    <div className="flex flex-col gap-4" data-testid="stat-display-list">
      <div className="text-center">
        <h3 className="font-black italic text-[10px] text-white/40 uppercase tracking-widest">{categoryLabel} PERFORMANCE</h3>
        {subtitle ? (
          <p className="mt-2 text-[11px] font-bold text-east-light uppercase tracking-widest">{subtitle}</p>
        ) : null}
      </div>
      <div className="flex flex-col gap-5">
        {groups.map((group) => (
          <StatGroupSection key={`${group.title}-${group.rows.map((row) => row.field.key).join('-')}`} group={group} />
        ))}
      </div>
    </div>
  );
}