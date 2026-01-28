import React from 'react';
import { notFound } from 'next/navigation';
import { PRODUCTS } from '@/data/products';
import { GlassCard } from '@/app/components/ui/GlassCard';
import { AddToCartButton } from '@/app/components/ui/AddToCartButton';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export function generateStaticParams() {
    return PRODUCTS.map((product) => ({
        slug: product.slug,
    }));
}

export default async function ProductPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const slug = (await params).slug;
    const product = PRODUCTS.find((p) => p.slug === slug);

    if (!product) {
        notFound();
    }

    return (
        <div className="container mx-auto px-6 py-12 space-y-8">
            <Link href="/programs" className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors uppercase text-xs font-bold tracking-widest">
                <ArrowLeft className="w-4 h-4" /> Back to Programs
            </Link>

            <div className="grid md:grid-cols-2 gap-12">
                {/* Gallery */}
                <div className="space-y-4">
                    <GlassCard className="aspect-square bg-white/5 flex items-center justify-center p-8">
                        {product.images[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover rounded-lg shadow-2xl" />
                        ) : (
                            <div className="text-white/20 font-black text-6xl uppercase tracking-tighter">No Image</div>
                        )}
                    </GlassCard>
                </div>

                {/* Details */}
                <div className="space-y-8">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white mb-2">
                            {product.name}
                        </h1>
                        <p className="text-2xl font-mono text-east-light">${product.price}</p>
                    </div>

                    <GlassCard className="p-8 space-y-6 bg-white/5">
                        <p className="text-white/70 leading-relaxed text-lg">
                            {product.description}
                        </p>

                        <AddToCartButton product={product} />

                        <div className="pt-6 border-t border-white/10 text-xs text-white/40 space-y-2">
                            <p>• Immediate confirmation</p>
                            <p>• Secure checkout via Stripe</p>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
