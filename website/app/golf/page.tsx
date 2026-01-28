import React from 'react';
import { GlassCard } from '@/app/components/ui/GlassCard';
import Link from 'next/link';

export default function GolfPage() {
    return (
        <div className="container mx-auto px-6 py-12 space-y-12">
            <section className="text-center space-y-6">
                <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white">
                    EAST Golf
                </h1>
                <p className="text-white/60 text-lg max-w-2xl mx-auto">
                    Taking your passion for golf to the next level with new facilities and elite coaching.
                </p>
            </section>

            <div className="grid md:grid-cols-2 gap-12">
                <GlassCard className="p-8 space-y-4">
                    <h2 className="text-2xl font-black italic uppercase text-white">The EAST Classic</h2>
                    <p className="text-white/70">
                        Our annual golf tournament brings together athletes, alumni, and supporters for a day of competition and community.
                    </p>
                    <div className="pt-4">
                        <button className="bg-white text-black px-6 py-3 font-bold uppercase tracking-widest rounded-full hover:bg-east-light transition-colors">
                            Register Interest
                        </button>
                    </div>
                </GlassCard>

                <GlassCard className="p-8 space-y-4">
                    <h2 className="text-2xl font-black italic uppercase text-white">Golf Performance</h2>
                    <p className="text-white/70">
                        Specific strength and mobility training designed to add yards to your drive and consistency to your swing.
                    </p>
                    <div className="pt-4">
                        <Link href="/programs" className="text-east-light font-bold uppercase tracking-widest hover:underline">
                            View Programs
                        </Link>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
