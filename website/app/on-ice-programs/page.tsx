import React from 'react';
import { GlassCard } from '@/app/components/ui/GlassCard';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function OnIceProgramsPage() {
    return (
        <div className="container mx-auto px-6 py-12 space-y-12">
            <Link href="/programs" className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors uppercase text-xs font-bold tracking-widest">
                <ArrowLeft className="w-4 h-4" /> Back to All Programs
            </Link>

            <section className="space-y-6">
                <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white">
                    Winter On-Ice Training
                </h1>
                <p className="text-white/60 text-lg max-w-2xl">
                    Comprehensive skill development during the competitive season.
                </p>
            </section>

            <div className="space-y-8">
                <ProgramSection
                    title="Elite Skills"
                    description="Focus on high-speed execution, edge control, and deception."
                />
                <ProgramSection
                    title="Defensive Specialist"
                    description="Gap control, angling, and puck retrieval mechanics."
                />
                <ProgramSection
                    title="Sniper Series"
                    description="Shooting mechanics: release point, accuracy, and power."
                />
            </div>
        </div>
    );
}

function ProgramSection({ title, description }: { title: string; description: string }) {
    return (
        <GlassCard className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/5">
            <div>
                <h3 className="text-2xl font-black italic uppercase text-white mb-2">{title}</h3>
                <p className="text-white/60">{description}</p>
            </div>
            <Link href="/contact" className="px-6 py-3 border border-white/20 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all whitespace-nowrap">
                Inquire Schedule
            </Link>
        </GlassCard>
    )
}
