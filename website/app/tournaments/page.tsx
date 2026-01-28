import React from 'react';
import { GlassCard } from '@/app/components/ui/GlassCard';
import { Calendar } from 'lucide-react';

export default function TournamentsPage() {
    return (
        <div className="container mx-auto px-6 py-12 space-y-12">
            <section className="text-center space-y-6">
                <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white">
                    Tournaments
                </h1>
                <p className="text-white/60 text-lg max-w-2xl mx-auto">
                    Representing EAST at international competitions.
                </p>
            </section>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <TournamentCard
                    title="Bangkok Super Cup"
                    date="March 2026"
                    location="Bangkok, Thailand"
                    description="U11, U13, and U15 Elite Divisions."
                />
                <TournamentCard
                    title="Singapore Ice Dragons"
                    date="May 2026"
                    location="Singapore"
                    description="Competitive tournament for all age groups."
                />
                <TournamentCard
                    title="Greater Bay Area Cup"
                    date="October 2026"
                    location="Shenzhen, China"
                    description="The premier regional tournament."
                />
            </div>
        </div>
    );
}

function TournamentCard({ title, date, location, description }: { title: string; date: string; location: string; description: string }) {
    return (
        <GlassCard hoverEffect className="p-8 space-y-4 flex flex-col h-full bg-white/5">
            <div className="w-12 h-12 bg-east-light/10 rounded-full flex items-center justify-center text-east-light mb-2">
                <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-black italic uppercase text-white">{title}</h3>
            <div className="space-y-1 text-sm font-bold uppercase tracking-widest text-white/50">
                <p>{date}</p>
                <p>{location}</p>
            </div>
            <p className="text-white/60 leading-relaxed pt-2 flex-grow">{description}</p>
            <button className="w-full mt-4 py-3 border border-white/20 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all">
                View Details
            </button>
        </GlassCard>
    );
}
