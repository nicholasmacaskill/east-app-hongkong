import React from 'react';
import { GlassCard } from '@/app/components/ui/GlassCard';
import { notFound } from 'next/navigation';

const POLICIES: Record<string, { title: string; content: string }> = {
    'refund-policy': {
        title: 'Refund Policy',
        content: `All package purchases are final. Sessions can be cancelled up to 24 hours in advance for credit restoration. Late cancellations result in loss of credit.
        
        Exceptions may be made for medical reasons with a valid doctor's note.`
    },
    'privacy-policy': {
        title: 'Privacy Policy',
        content: `We value your privacy. Your personal information is collected solely for the purpose of managing your training schedule and communication. We do not sell data to third parties.`
    },
    'terms-of-service': {
        title: 'Terms of Service',
        content: `By using the EAST platform, you agree to abide by our code of conduct. We reserve the right to refuse service to anyone demonstrating unsiblings behavior.`
    }
};

export function generateStaticParams() {
    return Object.keys(POLICIES).map((slug) => ({
        slug,
    }));
}

export default async function PolicyPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const slug = (await params).slug;
    const policy = POLICIES[slug];

    if (!policy) {
        notFound();
    }

    return (
        <div className="container mx-auto px-6 py-12 max-w-4xl">
            <GlassCard className="p-12 space-y-8 bg-white/5">
                <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">
                    {policy.title}
                </h1>
                <div className="prose prose-invert prose-lg text-white/70 whitespace-pre-wrap">
                    {policy.content}
                </div>
            </GlassCard>
        </div>
    );
}
