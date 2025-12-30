'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    ChevronLeft,
    Home, User as UserIcon, QrCode, Activity, MessageSquare, CheckCircle, X
} from 'lucide-react';
import type { Tab } from '../types';
import { supabase } from '@/app/lib/supabase';

// ✅ Updated: Get Price IDs from the .env.local file we configured
const GYM_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_GYM || '';
const ALL_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_ALL || '';
const ELITE_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE || '';

const plans = [
    {
        id: 'elite',
        name: 'ELITE PASS',
        shortName: 'ELITE',
        // Matches NEXT_PUBLIC_STRIPE_PRICE_ELITE
        stripePriceId: ELITE_PRICE_ID,
        priceMonthly: '3,500',
        priceYearly: '35,000',
        savings: 'SAVE 7,000 ANNUALLY',
        sections: [
            { title: 'ACCESS', items: [{ label: 'PLAYER LOUNGE & ARENA', value: 'INCLUDED', isPositive: true }, { label: 'SHOOTING PAD', value: 'INCLUDED', isPositive: true }] },
            { title: 'BOOKING', items: [{ label: 'CLASSES', value: '8 DAYS AHEAD', isPositive: true }] },
            { title: 'CLASSES', items: [{ label: 'CLASS DISCOUNT', value: '100%', isPositive: true }] },
            { title: 'FACILITY BOOKING', items: [{ label: 'GOLF (1-2 HOURS)', value: '250 HOURS', isPositive: true }] }
        ]
    }
];

function MembershipContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [selectedPlanId, setSelectedPlanId] = useState('elite');
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const activeNavTab: Tab = 'qr';
    const activePlan = plans.find(p => p.id === selectedPlanId) || plans[0];

    // Check for success param from Stripe redirect
    useEffect(() => {
        if (searchParams.get('success') === 'true') {
            setShowSuccess(true);
            router.replace('/membership'); // Clean URL
        }
    }, [searchParams, router]);

    const handlePurchase = async (priceId: string) => {
        // Validation
        if (!priceId || priceId.includes('placeholder')) {
            alert("Configuration Error: This membership plan is not yet configured with a valid Stripe Price ID.");
            return;
        }

        if (isLoading) return;
        setIsLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                alert("Please log in to purchase a membership.");
                router.push('/login');
                return;
            }

            // Fetch profile to get the preferred contact email
            const { data: profile } = await supabase
                .from('profiles')
                .select('contact_email')
                .eq('id', user.id)
                .single();

            const checkoutEmail = profile?.contact_email || user.email;

            const baseUrl = window.location.origin;

            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    priceId: priceId,
                    userId: user.id,
                    userEmail: checkoutEmail, // Use profile contact email if available
                    successUrl: `${baseUrl}/?success=true`,
                    cancelUrl: `${baseUrl}/membership?canceled=true`
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to initiate checkout');
            }

            if (data.url) {
                window.location.href = data.url;
            } else {
                alert("Failed to get checkout URL from Stripe.");
            }

        } catch (error: any) {
            console.error("Purchase error:", error);
            alert("Error: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen bg-black text-white font-opensans select-none flex justify-center overflow-hidden">

            {/* Background */}
            <div className="fixed inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1580748141549-71748ddf0bdc?auto=format&fit=crop&q=80&w=1200"
                    className="w-full h-full object-cover opacity-20 blur-sm"
                    alt="Hockey Background"
                />
                <div className="absolute inset-0 bg-black/60" />
            </div>

            <div className="w-full max-w-xs bg-white text-black h-fit min-h-[600px] relative flex flex-col z-10 border border-white/20 shadow-2xl rounded-[2.5rem] overflow-hidden my-auto">
                <div className="h-3 w-full bg-gradient-to-r from-east-light to-east-dark shrink-0" />

                {/* Header */}
                <div className="flex items-center px-6 pt-8 pb-4 shrink-0 relative">
                    <button onClick={() => router.back()} className="text-black/40 hover:text-black transition-colors absolute left-6 z-20">
                        <ChevronLeft size={24} strokeWidth={3} />
                    </button>
                    <div className="w-full text-center">
                        <h2 className="font-montserrat font-black italic text-2xl mb-1 uppercase tracking-tighter text-black leading-none">MEMBERSHIP</h2>
                        <p className="font-bold text-[9px] text-gray-400 uppercase tracking-widest leading-none">SELECT A PLAN</p>
                    </div>
                </div>

                {/* Plan Tabs */}
                <div className="flex px-8 mb-6 shrink-0 gap-2 justify-center w-full">
                    {plans.map(plan => (
                        <button
                            key={plan.id}
                            onClick={() => setSelectedPlanId(plan.id)}
                            className={`flex-1 text-center font-montserrat font-black italic text-[10px] py-2 rounded-xl transition-all uppercase tracking-widest border ${selectedPlanId === plan.id ? 'bg-black text-white border-black shadow-lg' : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100'
                                }`}
                        >
                            {plan.shortName}
                        </button>
                    ))}
                </div>

                {/* Plan Card (Inside the main container) */}
                <div className="flex-1 flex flex-col items-center px-8 pb-8 overflow-y-auto">
                    <div className="w-full flex flex-col h-full">
                        <div className="text-center mb-6 pb-4 border-b border-dashed border-gray-200 shrink-0">
                            <h2 className="font-montserrat font-black italic text-4xl uppercase mb-0 leading-none tracking-tighter">{activePlan.name.split(' ')[0]}</h2>
                            <h2 className="font-montserrat font-black italic text-4xl uppercase mb-2 leading-none tracking-tighter text-transparent text-stroke-thin opacity-20">{activePlan.name.split(' ')[1]}</h2>

                            <div className="flex items-baseline justify-center gap-1 mt-2">
                                <span className="font-montserrat font-black italic text-3xl tracking-tight">{activePlan.priceMonthly}</span>
                                <span className="font-montserrat font-black italic text-[10px] text-gray-400 uppercase tracking-tight">HKD / MO</span>
                            </div>
                            <div className="mt-3 inline-block bg-east-light/20 text-east-dark text-[9px] font-black italic px-3 py-1 rounded-lg uppercase tracking-widest border border-east-light/20">
                                {activePlan.savings}
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 flex-1 mb-8">
                            {activePlan.sections.map((section, idx) => (
                                <div key={idx} className="flex flex-col gap-1.5">
                                    <h3 className="font-montserrat font-black italic text-[9px] text-gray-300 uppercase tracking-widest">
                                        {section.title}
                                    </h3>
                                    <div className="space-y-1.5">
                                        {section.items.map((item, i) => (
                                            <div key={i} className="flex justify-between items-center border-b border-gray-50 pb-1 last:border-0">
                                                <span className="font-bold text-[11px] text-gray-700 uppercase tracking-tight">{item.label}</span>
                                                <span className={`font-black text-[11px] uppercase text-right italic ${item.isPositive ? 'text-black' : 'text-gray-400'}`}>
                                                    {item.value}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => handlePurchase(activePlan.stripePriceId)}
                            disabled={isLoading}
                            className="w-full bg-black text-white font-montserrat font-black italic text-[12px] py-4 rounded-full uppercase tracking-widest hover:bg-east-light hover:text-black transition-all shadow-xl shrink-0 mt-auto active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-transparent hover:border-black"
                        >
                            {isLoading ? 'PROCESSING...' : 'ACTIVATE MEMBERSHIP'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function MembershipPage() {
    return (
        <Suspense fallback={<div className="bg-black h-screen text-white flex justify-center items-center font-montserrat font-bold uppercase tracking-tighter">Loading...</div>}>
            <MembershipContent />
        </Suspense>
    );
}

const NavItem = ({ tab, icon: Icon, label, activeTab }: { tab: Tab; icon: any; label: string, activeTab: Tab }) => {
    const router = useRouter();
    const isActive = activeTab === tab;
    return (
        <button
            onClick={() => router.push(`/?tab=${tab}`)}
            className={`flex flex-col items-center justify-center w-full py-2 transition-colors duration-200 ${isActive ? 'text-white' : 'text-gray-500'}`}
        >
            <Icon size={24} className={isActive ? 'stroke-[3px]' : 'stroke-2'} />
            <span className="text-[10px] font-bold font-montserrat mt-1 uppercase tracking-wider italic">{label}</span>
        </button>
    );
};