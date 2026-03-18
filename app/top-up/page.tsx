'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import { useToast } from '@/app/components/ui/Toast';
import { ChevronLeft, Check, TrendingUp } from 'lucide-react';
import { getStripePriceId } from '@/app/lib/stripe-config';


export default function TopUpPage() {
    const router = useRouter();
    const { addToast } = useToast();

    // --- DYNAMIC PRICE RESOLUTION ---
    const TOPUP_OPTIONS = React.useMemo(() => [
        {
            id: getStripePriceId('TOPUP_STARTER'),
            credits: 500,
            price: 'HKD $500',
            label: 'Starter',
            color: 'bg-gray-800'
        },
        {
            id: getStripePriceId('TOPUP_STANDARD'),
            credits: 1000,
            price: 'HKD $1,000',
            label: 'Standard',
            color: 'bg-gray-800'
        },
        {
            id: getStripePriceId('TOPUP_PRO'),
            credits: 2500,
            price: 'HKD $2,500',
            label: 'Pro',
            color: 'bg-east-blue/20 border-east-blue'
        },
        {
            id: getStripePriceId('TOPUP_ELITE'),
            credits: 5000,
            price: 'HKD $5,000',
            label: 'Elite',
            color: 'bg-gray-800'
        },
        {
            id: getStripePriceId('TOPUP_ULTIMATE'),
            credits: 10000,
            price: 'HKD $10,000',
            label: 'Ultimate',
            color: 'bg-east-light text-black',
            textColor: 'text-black',
            highlight: true
        }
    ], []);

    const handleCheckout = async (priceId: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data: profile } = await supabase.from('profiles').select('contact_email').eq('id', user.id).single();
            const email = profile?.contact_email || user.email;

            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    priceId,
                    userId: user.id,
                    userEmail: email,
                    successUrl: `${window.location.origin}/?success=true`,
                    cancelUrl: `${window.location.origin}/top-up`
                })
            });

            const data = await res.json();
            if (data.url) window.location.replace(data.url);
            else throw new Error(data.error || 'Checkout failed');

        } catch (e: any) {
            addToast(e.message, 'error');
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 pb-24">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <ChevronLeft size={24} />
                </button>
                <div>
                    <h1 className="font-montserrat font-black text-2xl uppercase italic tracking-wider">Top Up Credits</h1>
                    <p className="text-gray-400 text-sm font-medium">1 Credit = 1 HKD</p>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {TOPUP_OPTIONS.map((opt) => (
                    <button
                        key={opt.id}
                        onClick={() => handleCheckout(opt.id)}
                        className={`relative group p-6 rounded-2xl border transition-all duration-300 text-left hover:scale-[1.02] active:scale-95 ${opt.highlight
                            ? 'bg-east-light border-east-light text-black shadow-[0_0_30px_rgba(200,255,0,0.3)]'
                            : 'bg-white/5 border-white/10 hover:border-east-light hover:bg-white/10'
                            }`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>

                                <div className="flex items-baseline gap-1">
                                    <span className={`font-montserrat font-black text-4xl italic tracking-tighter ${opt.highlight ? 'text-black' : 'text-white'}`}>
                                        {opt.credits.toLocaleString()}
                                    </span>
                                    <span className={`text-xs font-bold ${opt.highlight ? 'text-black/60' : 'text-gray-500'}`}>
                                        CREDITS
                                    </span>
                                </div>
                            </div>
                            {opt.highlight && (
                                <div className="bg-black text-east-light p-2 rounded-full">
                                    <TrendingUp size={20} />
                                </div>
                            )}
                        </div>

                        <div className={`mt-4 pt-4 border-t flex items-center justify-between ${opt.highlight ? 'border-black/10' : 'border-white/10'}`}>
                            <span className={`font-montserrat font-bold text-lg ${opt.highlight ? 'text-black' : 'text-white'}`}>
                                {opt.price}
                            </span>
                            <div className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${opt.highlight
                                ? 'bg-black text-east-light'
                                : 'bg-east-light/10 text-east-light group-hover:bg-east-light group-hover:text-black'
                                }`}>
                                Purchase
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
