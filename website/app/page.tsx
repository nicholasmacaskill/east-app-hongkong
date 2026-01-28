import { GlassCard } from "@/app/components/ui/GlassCard";
import { SITE_CONTENT } from "@/data/site-content";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Home() {
  const { hero, about, mission, sections } = SITE_CONTENT;

  return (
    <div className="flex flex-col gap-24 pb-24">

      {/* HERO SECTION */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Video/Image Placeholder */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />
          {/* Replace with actual video or high-res image */}
          <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?q=80&w=3387&auto=format&fit=crop')] bg-cover bg-center opacity-60 grayscale-[30%]" />
        </div>

        <div className="relative z-20 text-center max-w-4xl px-6 space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
          <h1 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter text-white drop-shadow-2xl">
            {hero.title}
          </h1>
          <p className="text-lg md:text-2xl font-bold uppercase tracking-widest text-east-light">
            {hero.subtitle}
          </p>
          <div className="pt-8">
            <Link
              href="/programs"
              className="group relative inline-flex items-center gap-3 px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full transition-all hover:scale-105"
            >
              <span className="font-bold uppercase tracking-widest text-white">{hero.cta}</span>
              <div className="w-8 h-8 rounded-full bg-east-light text-black flex items-center justify-center group-hover:rotate-45 transition-transform duration-300">
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ABOUT SPLIT */}
      <section className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
        <GlassCard className="p-12 space-y-6">
          <h2 className="text-3xl font-black italic uppercase tracking-wider text-white">
            {about.title}
          </h2>
          <p className="text-white/70 leading-relaxed text-lg">
            {about.description}
          </p>
        </GlassCard>
        <div className="space-y-6 md:pl-12 border-l border-white/10">
          <h2 className="text-3xl font-black italic uppercase tracking-wider text-east-light">
            {mission.title}
          </h2>
          <p className="text-white/70 leading-relaxed text-lg">
            {mission.description}
          </p>
        </div>
      </section>

      {/* CORE SECTIONS */}
      <section className="container mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-8">
          {sections.map((section) => (
            <Link key={section.id} href={section.link} className="group">
              <GlassCard hoverEffect className="h-full flex flex-col">
                <div className="h-64 relative overflow-hidden bg-white/5">
                  {/* Fallback pattern if image fails */}
                  <div className="absolute inset-0 bg-gradient-to-br from-east-dark to-black opacity-50" />
                  <div className="absolute bottom-4 left-4 z-10">
                    <h3 className="text-2xl font-black italic uppercase text-white group-hover:text-east-light transition-colors">{section.title}</h3>
                  </div>
                </div>
                <div className="p-8 flex-1 flex flex-col justify-between space-y-6">
                  <p className="text-white/60 leading-relaxed text-sm">
                    {section.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-east-light">
                    Learn More <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}
