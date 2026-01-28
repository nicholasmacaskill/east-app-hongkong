import React from 'react';
import { GlassCard } from '@/app/components/ui/GlassCard';

export default function AlumniPage() {
    return (
        <div className="container mx-auto px-6 py-12 space-y-12">
            <section className="text-center space-y-6">
                <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white">
                    EAST Alumni
                </h1>
                <p className="text-white/60 text-lg max-w-2xl mx-auto">
                    Celebrating the athletes who have graduated from our program to higher levels of hockey.
                </p>
            </section>

            <div className="grid md:grid-cols-3 gap-8">
                <AlumniCard name="Player Name" team="Princeton University (NCAA)" year="2024" />
                <AlumniCard name="Player Name" team="Windsor Spitfires (OHL)" year="2023" />
                <AlumniCard name="Player Name" team="Toronto Marlboros (GTHL)" year="2025" />
            </div>
        </div>
    );
}

function AlumniCard({ name, team, year }: { name: string; team: string; year: string }) {
    return (
        <GlassCard className="p-8 space-y-2 bg-white/5">
            <h3 className="text-xl font-black italic uppercase text-white">{name}</h3>
            <p className="text-east-light font-bold text-sm">{team}</p>
            <p className="text-white/30 text-xs font-mono">Class of {year}</p>
        </GlassCard>
    )
}
