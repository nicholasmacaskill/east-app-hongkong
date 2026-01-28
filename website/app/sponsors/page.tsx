import React from 'react';
import { GlassCard } from '@/app/components/ui/GlassCard';

export default function SponsorsPage() {
    return (
        <div className="container mx-auto px-6 py-12 space-y-12">
            <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white text-center">
                Our Sponsors
            </h1>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                <SponsorCard name="FIJI Water" description="Official Hydration Partner" />
                <SponsorCard name="Warrior Hockey" description="Equipment Supplier" />
                <SponsorCard name="BioSteel" description="Sports Nutrition" />
                <SponsorCard name="Cathay Pacific" description="Travel Partner" />
            </div>
        </div>
    );
}

function SponsorCard({ name, description }: { name: string; description: string }) {
    return (
        <GlassCard className="aspect-video flex flex-col items-center justify-center p-6 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
            <h3 className="text-xl font-bold uppercase text-white mb-2">{name}</h3>
            <p className="text-xs text-white/40 uppercase tracking-widest">{description}</p>
        </GlassCard>
    )
}
