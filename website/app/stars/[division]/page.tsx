import React from 'react';
import { GlassCard } from '@/app/components/ui/GlassCard';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
    return ['u11', 'u13', 'u15', 'u17'].map((division) => ({
        division,
    }));
}

export default async function StarsPage({
    params,
}: {
    params: Promise<{ division: string }>
}) {
    const division = (await params).division.toUpperCase();

    return (
        <div className="container mx-auto px-6 py-12 space-y-12">
            <section className="text-center space-y-6">
                <h1 className="text-6xl font-black italic uppercase tracking-tighter text-white">
                    EAST STARS <span className="text-east-light">{division}</span>
                </h1>
                <p className="text-white/60 text-lg max-w-2xl mx-auto">
                    The premier select team for the {division} age group.
                </p>
            </section>

            <GlassCard className="p-8 bg-white/5 text-center">
                <h2 className="text-2xl font-bold uppercase text-white mb-4">Season 2025-26 Roster</h2>
                <p className="text-white/40 italic">Roster to be announced following Spring Tryouts.</p>
            </GlassCard>
        </div>
    );
}
