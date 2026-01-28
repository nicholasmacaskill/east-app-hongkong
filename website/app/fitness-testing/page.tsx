import React from 'react';
import { GlassCard } from '@/app/components/ui/GlassCard';

export default function FitnessTestingPage() {
    return (
        <div className="container mx-auto px-6 py-12 space-y-12">
            <section className="text-center space-y-6">
                <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white">
                    Fitness & Skill Testing
                </h1>
                <p className="text-white/60 text-lg max-w-2xl mx-auto">
                    Quantifying progress through data-driven performance analysis.
                </p>
            </section>

            <GlassCard className="p-12 bg-white/5 space-y-8">
                <div className="grid md:grid-cols-2 gap-12">
                    <div>
                        <h3 className="text-2xl font-black italic uppercase text-white mb-4">Combine Testing</h3>
                        <ul className="space-y-4 text-white/70">
                            <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-east-light rounded-full" /> 30m Sprint (On-Ice/Off-Ice)</li>
                            <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-east-light rounded-full" /> Vertical Jump</li>
                            <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-east-light rounded-full" /> Agility Weave</li>
                            <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-east-light rounded-full" /> Shot Velocity Radar</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-2xl font-black italic uppercase text-white mb-4">Upcoming Dates</h3>
                        <div className="space-y-4">
                            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-white">Spring Combine</span>
                                    <span className="text-east-light text-xs font-bold uppercase">April 12, 2026</span>
                                </div>
                                <p className="text-xs text-white/50">Location: MegaIce</p>
                            </div>
                            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-white">Pre-Season Testing</span>
                                    <span className="text-east-light text-xs font-bold uppercase">August 28, 2026</span>
                                </div>
                                <p className="text-xs text-white/50">Location: Elements</p>
                            </div>
                        </div>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
}
