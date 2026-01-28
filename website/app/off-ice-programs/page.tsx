import React from 'react';
import { GlassCard } from '@/app/components/ui/GlassCard';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function OffIceProgramsPage() {
    return (
        <div className="container mx-auto px-6 py-12 space-y-12">
            <Link href="/programs" className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors uppercase text-xs font-bold tracking-widest">
                <ArrowLeft className="w-4 h-4" /> Back to All Programs
            </Link>

            <section className="space-y-6">
                <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white">
                    Winter Off-Ice Training
                </h1>
                <p className="text-white/60 text-lg max-w-2xl">
                    Building the physical engine required for elite performance.
                </p>
            </section>

            <div className="grid md:grid-cols-2 gap-8">
                <ProgramCard
                    title="Strength & Power"
                    description="Olympic lifting and plyometrics to translate gym strength to on-ice speed."
                    ageGroup="U13+"
                />
                <ProgramCard
                    title="Speed & Agility"
                    description="Footwork, reaction time, and multi-directional acceleration."
                    ageGroup="U9 - U11"
                />
                <ProgramCard
                    title="Mobility & Recovery"
                    description="Injury prevention and flexibility routines for longevity."
                    ageGroup="All Ages"
                />
            </div>
        </div>
    );
}

function ProgramCard({ title, description, ageGroup }: { title: string; description: string; ageGroup: string }) {
    return (
        <GlassCard hoverEffect className="p-8 space-y-4 bg-white/5">
            <div className="flex justify-between items-start">
                <h3 className="text-2xl font-black italic uppercase text-white">{title}</h3>
                <span className="bg-east-light/10 text-east-light px-3 py-1 rounded text-xs font-bold uppercase tracking-widest">{ageGroup}</span>
            </div>
            <p className="text-white/60 leading-relaxed">{description}</p>
            <Link href="/contact" className="inline-block mt-4 text-xs font-bold uppercase tracking-widest text-white hover:text-east-light transition-colors">
                Inquire Now →
            </Link>
        </GlassCard>
    )
}
