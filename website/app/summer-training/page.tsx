import React from 'react';
import { GlassCard } from '@/app/components/ui/GlassCard';
import Link from 'next/link';

export default function SummerTrainingPage() {
    return (
        <div className="container mx-auto px-6 py-12 space-y-12">
            <section className="text-center space-y-6">
                <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white">
                    Summer Training 2025
                </h1>
                <p className="text-white/60 text-lg max-w-2xl mx-auto">
                    Intensive off-season development programs designed to prepare athletes for the upcoming season.
                </p>
            </section>

            <GlassCard className="p-12 text-center space-y-8 bg-white/5">
                <h2 className="text-3xl font-black italic uppercase text-white">Registration Now Open</h2>
                <p className="text-white/70 max-w-xl mx-auto">
                    Our 8-week summer program focuses on power skating, stickhandling mechanics, and dryland conditioning.
                    Spots are limited to fully maximize coach-to-player ratio.
                </p>
                <div className="flex justify-center gap-4">
                    <Link href="/programs" className="bg-east-light text-black px-8 py-4 rounded-full font-bold uppercase tracking-widest hover:scale-105 transition-transform">
                        Browse Programs
                    </Link>
                    <Link href="/contact" className="border border-white/20 text-white px-8 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors">
                        Contact Coach
                    </Link>
                </div>
            </GlassCard>
        </div>
    );
}
