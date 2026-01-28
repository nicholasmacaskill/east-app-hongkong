import React from 'react';
import { GlassCard } from '@/app/components/ui/GlassCard';

export default function TeamPage() {
    return (
        <div className="container mx-auto px-6 py-12 space-y-12">
            <section className="text-center space-y-6">
                <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white">
                    Our Team
                </h1>
                <p className="text-white/60 text-lg max-w-2xl mx-auto">
                    A group of elite athletes turned coaches from North America.
                </p>
            </section>

            <div className="grid md:grid-cols-3 gap-8">
                <TeamMember
                    name="Coach Name"
                    role="Head Coach"
                    bio="Experienced at the highest levels of North American hockey."
                />
                <TeamMember
                    name="Coach Name"
                    role="Strength Coach"
                    bio="Specializing in functional movement and explosive power."
                />
                <TeamMember
                    name="Coach Name"
                    role="Skills Coach"
                    bio="Expert in skating mechanics and stickhandling."
                />
            </div>
        </div>
    );
}

function TeamMember({ name, role, bio }: { name: string; role: string; bio: string }) {
    return (
        <GlassCard className="overflow-hidden group">
            <div className="aspect-[3/4] bg-white/5 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-xl font-black italic uppercase text-white">{name}</h3>
                    <p className="text-east-light text-xs font-bold uppercase tracking-widest mb-2">{role}</p>
                    <p className="text-white/60 text-sm">{bio}</p>
                </div>
            </div>
        </GlassCard>
    );
}
