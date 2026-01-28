import React from 'react';
import { PRODUCTS } from '@/data/products';
import { GlassCard } from '@/app/components/ui/GlassCard';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function ProgramsPage() {
    return (
        <div className="container mx-auto px-6 py-12 space-y-12">
            <div className="text-center space-y-4">
                <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white">
                    Training Programs
                </h1>
                <p className="text-white/60 text-lg max-w-2xl mx-auto">
                    Choose from our selection of elite on-ice and off-ice development programs.
                </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {PRODUCTS.map((product) => (
                    <Link key={product.id} href={`/products/${product.slug}`}>
                        <GlassCard hoverEffect className="group h-full flex flex-col">
                            <div className="aspect-video bg-white/5 relative overflow-hidden">
                                {/* Placeholder for now */}
                                <div className="absolute inset-0 bg-gradient-to-br from-east-dark/20 to-black" />
                            </div>
                            <div className="p-8 flex-1 flex flex-col space-y-4">
                                <div className="flex-1">
                                    <h2 className="text-xl font-bold uppercase tracking-wide text-white group-hover:text-east-light transition-colors">{product.name}</h2>
                                    <p className="text-white/50 text-sm mt-2 line-clamp-3">{product.description}</p>
                                </div>
                                <div className="flex items-center justify-between border-t border-white/10 pt-4">
                                    <span className="font-mono text-east-light font-bold">${product.price}</span>
                                    <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">Details <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" /></span>
                                </div>
                            </div>
                        </GlassCard>
                    </Link>
                ))}
            </div>
        </div>
    );
}
