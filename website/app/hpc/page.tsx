import React from 'react';
import { GlassCard } from '@/app/components/ui/GlassCard';

export default function HPCPage() {
    return (
        <div className="container mx-auto px-6 py-12 space-y-12">
            <section className="text-center space-y-6">
                <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white">
                    High Performance Centre
                </h1>
                <div className="inline-block bg-east-light text-black font-bold uppercase tracking-widest px-4 py-1 rounded-full text-xs">
                    Opening Spring 2026
                </div>
                <p className="text-white/60 text-lg max-w-2xl mx-auto">
                    A state-of-the-art facility designed for the complete development of the elite athlete.
                </p>
            </section>

            <div className="grid md:grid-cols-3 gap-8">
                <FeatureCard
                    title="Athlete Gym"
                    description="Olympic lifting platforms, velocity based training systems, and functional movement areas."
                />
                <FeatureCard
                    title="Shooting Pads"
                    description="Synthetic ice surface for shooting mechanics and stickhandling drills."
                />
                <FeatureCard
                    title="Golf Simulator"
                    description="TrackMan powered simulator for swing analysis and virtual rounds."
                />
                <FeatureCard
                    title="Player Lounge"
                    description="Recovery boots, video review station, and study area for student-athletes."
                />
                <FeatureCard
                    title="Physiotherapy"
                    description="On-site treatment to manage injuries and optimize recovery."
                />
                <FeatureCard
                    title="Locker Room"
                    description="Dedicated storage for equipment and showers."
                />
            </div>
        </div>
    );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
    return (
        <GlassCard className="p-8 space-y-3 bg-white/5 hover:bg-white/10 transition-colors">
            <h3 className="text-xl font-black italic uppercase text-white">{title}</h3>
            <p className="text-white/50 text-sm leading-relaxed">{description}</p>
        </GlassCard>
    );
}
