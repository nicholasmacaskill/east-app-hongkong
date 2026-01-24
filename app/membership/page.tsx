'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    ChevronLeft,
    CheckCircle, X, Users, User as UserIcon, Heart, Calendar, Info
} from 'lucide-react';
import type { Tab } from '../types';
import { supabase } from '@/app/lib/supabase';
import { useToast } from '@/app/components/ui/Toast';

// --- PRICE IDS ---
// Individual (Pro)
const INDIVIDUAL_PRICE_MONTHLY = process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY || 'price_1SkIZy12ap1SCxTogENbLLlN';
const INDIVIDUAL_PRICE_YEARLY = process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY || 'price_1SkImq12ap1SCxTo7NWXMK3g';

// Family - 1 Member
const FAMILY_1_PRICE_MONTHLY = process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_1_MONTHLY || 'price_1SkIZy12ap1SCxTogENbLLlN'; // Fallback to Individual
const FAMILY_1_PRICE_YEARLY = process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_1_YEARLY || 'price_1SkImq12ap1SCxTo7NWXMK3g';

// Family - 2 Members
const FAMILY_2_PRICE_MONTHLY = process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_2_MONTHLY || 'price_1SmlLo12ap1SCxToOvQC8I0l';
const FAMILY_2_PRICE_YEARLY = process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_2_YEARLY || 'price_1SmlKh12ap1SCxTog9fNuhuE';

// Family - 3+ Members
const FAMILY_3_PRICE_MONTHLY = process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_3_MONTHLY || 'price_1SmlOT12ap1SCxToNrHP5Uqp';
const FAMILY_3_PRICE_YEARLY = process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_3_YEARLY || 'price_1SmlN812ap1SCxTo3SKzuxL5';

const plans: any = {
    individual: {
        id: 'pro',
        name: 'PRO',
        prices: {
            monthly: { id: INDIVIDUAL_PRICE_MONTHLY, display: '2,000', credits: '1,000' },
            yearly: { id: INDIVIDUAL_PRICE_YEARLY, display: '24,000', credits: '15,000', savings: '3,000 BONUS' }
        }
    },
    family: {
        '1': {
            id: 'family-1',
            name: 'PRO FAMILY (1)',
            prices: {
                monthly: { id: FAMILY_1_PRICE_MONTHLY, display: '2,000', credits: '1,000' },
                yearly: { id: FAMILY_1_PRICE_YEARLY, display: '24,000', credits: '15,000', savings: '3,000 BONUS' }
            }
        },
        '2': {
            id: 'family-2',
            name: 'PRO FAMILY (2)',
            prices: {
                monthly: { id: FAMILY_2_PRICE_MONTHLY, display: '4,000', credits: '2,500' },
                yearly: { id: FAMILY_2_PRICE_YEARLY, display: '48,000', credits: '33,000', savings: 'SAVE 7,000' }
            }
        },
        '3+': {
            id: 'family-3+',
            name: 'PRO FAMILY (3+)',
            prices: {
                monthly: { id: FAMILY_3_PRICE_MONTHLY, display: '5,500', credits: '3,500' },
                yearly: { id: FAMILY_3_PRICE_YEARLY, display: '66,000', credits: '45,000', savings: 'SAVE 10,000' }
            }
        }
    }
};

const BENEFITS = [
    {
        title: 'ACCESS',
        items: [
            { label: 'GYM & LOUNGE', value: 'YES' },
            { label: 'EVENTS', value: 'YES' },
            { label: 'LOCKERS', value: 'YES' },
            { label: 'PRIORITY', value: 'YES' }
        ]
    },
    {
        title: 'BOOKINGS',
        items: [
            { label: 'FACILITY', value: '7D' },
            { label: 'COACH', value: '7D' },
            { label: 'CLASS', value: '7D' }
        ]
    },
    {
        title: 'DISCOUNTS',
        items: [
            { label: 'LOCKER', value: '20%' },
            { label: 'CLASS', value: '50%' },
            { label: 'FACILITY', value: '50%' },
            { label: 'SKATE', value: '20%' },
            { label: 'F&B/MERCH', value: '10%' }
        ]
    }
];

function MembershipContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { addToast } = useToast();

    // Selection States
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [planType, setPlanType] = useState<'individual' | 'family'>('individual');
    const [memberCount, setMemberCount] = useState<'1' | '2' | '3+'>('1');

    const [isLoading, setIsLoading] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUserId(user.id);

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                const finalRole = profile?.role || user.user_metadata?.role;
                if (finalRole) setUserRole(finalRole);
            }
        };
        getUser();
    }, []);

    const activePlan = planType === 'individual'
        ? plans.individual
        : plans.family[memberCount];

    const activeDetails = billingCycle === 'monthly' ? activePlan.prices.monthly : activePlan.prices.yearly;

    const handlePurchase = async () => {
        if (!currentUserId) {
            addToast("Please log in to purchase.", "info");
            return;
        }

        setIsLoading(true);
        try {
            const priceId = activeDetails.id;
            const { data: { user } } = await supabase.auth.getUser();
            const email = user?.email;

            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    priceId,
                    userId: currentUserId,
                    userEmail: email,
                    successUrl: `${window.location.origin}/membership?success=true`,
                    cancelUrl: `${window.location.origin}/membership?canceled=true`
                })
            });

            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                addToast(`Checkout Failed: ${data.error || 'Unknown error'}`, "error");
            }
        } catch (e: any) {
            console.error(e);
            addToast(`Purchase Failed: ${e.message || 'Network error'}`, "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen bg-black text-white font-opensans select-none flex justify-center items-center overflow-hidden">
            {/* Background */}
            <div className="fixed inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1580748141549-71748ddf0bdc?auto=format&fit=crop&q=80&w=1200"
                    className="w-full h-full object-cover opacity-20 blur-sm"
                    alt="Hockey Background"
                />
                <div className="absolute inset-0 bg-black/80" />
            </div>

            <div className="w-full max-w-[370px] bg-white text-black h-fit max-h-[96vh] relative flex flex-col z-10 border border-white/20 shadow-2xl rounded-[2.5rem] overflow-hidden m-2">
                <div className="h-2.5 w-full bg-black shrink-0" />

                {/* MODERATE HEADER */}
                <div className="flex items-center justify-between px-7 pt-6 pb-3 shrink-0">
                    <button onClick={() => router.back()} className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                        <ChevronLeft size={20} strokeWidth={3} />
                    </button>
                    <div className="text-right">
                        <h2 className="font-montserrat font-black italic text-2xl uppercase tracking-tighter leading-none">MEMBERSHIP</h2>
                        <p className="font-bold text-[10px] text-amber-500 uppercase tracking-widest leading-none mt-1">EARLY BIRD PRO PASS</p>
                    </div>
                </div>

                {/* CONTROLS SECTION */}
                <div className="px-7 space-y-3 mt-1 shrink-0">
                    {/* Individual vs Family Toggle */}
                    {(userRole === 'parent' || userRole === 'admin') && (
                        <div className="bg-gray-50 p-1 rounded-xl flex border border-gray-100 h-10">
                            {['individual', 'family'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => {
                                        setPlanType(type as any);
                                        if (type === 'individual') setMemberCount('1');
                                    }}
                                    className={`flex-1 rounded-lg text-[11px] font-black italic uppercase tracking-widest transition-all ${planType === type ? 'bg-black text-white shadow-md' : 'text-gray-400'}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Member Count Selector (Only for Family) */}
                    {planType === 'family' && (
                        <div className="flex items-center gap-2 bg-black/5 p-1 rounded-xl animate-fadeIn h-10">
                            <span className="text-[8px] font-black text-gray-500 uppercase tracking-tighter ml-2">FAMILY SIZE:</span>
                            <div className="flex flex-1 gap-1">
                                {['1', '2', '3+'].map((count) => (
                                    <button
                                        key={count}
                                        onClick={() => setMemberCount(count as any)}
                                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-black italic transition-all ${memberCount === count ? 'bg-white text-black shadow-sm' : 'text-gray-400 opacity-60'}`}
                                    >
                                        {count}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Billing Cycle */}
                    <div className="bg-gray-100 p-1 rounded-full flex h-10">
                        {['monthly', 'yearly'].map((cycle) => (
                            <button
                                key={cycle}
                                onClick={() => setBillingCycle(cycle as any)}
                                className={`flex-1 rounded-full text-[10px] font-black italic uppercase tracking-widest transition-all ${billingCycle === cycle ? 'bg-black text-white shadow-md' : 'text-gray-500'}`}
                            >
                                {cycle}
                            </button>
                        ))}
                    </div>
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1 overflow-y-auto px-7 py-5 scrollbar-hide">
                    {/* Large Pricing Row */}
                    <div className="flex items-end justify-between border-b-2 border-dashed border-gray-100 pb-5 mb-5">
                        <div className="text-left">
                            <div className="bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md inline-block mb-1.5 font-bold text-[8px] text-amber-600 uppercase tracking-widest">
                                Early Bird Rates
                            </div>
                            <h2 className="font-montserrat font-black italic text-5xl uppercase leading-none tracking-tighter">PRO</h2>
                            <p className="text-[9px] font-black text-east-light uppercase tracking-widest mt-1">
                                {planType === 'family' ? `${memberCount} MEMBER FAMILY` : 'INDIVIDUAL PASS'}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="flex items-baseline justify-end gap-1">
                                <span className="font-montserrat font-black italic text-4xl tracking-tight leading-none">{activeDetails.display}</span>
                                <span className="font-montserrat font-black italic text-[10px] text-gray-400 uppercase tracking-tighter">HKD</span>
                            </div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase mt-0.5">PER {billingCycle === 'monthly' ? 'MONTH' : 'YEAR'}</p>
                        </div>
                    </div>

                    {/* Highlights Row */}
                    <div className="flex gap-3 mb-8">
                        <div className="flex-1 bg-gray-50 border border-gray-100 px-3 py-2.5 rounded-xl text-center">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter mb-0.5">CREDITS</p>
                            <p className="text-[12px] font-black italic">+{activeDetails.credits}</p>
                        </div>
                        {billingCycle === 'yearly' && (
                            <div className="flex-1 bg-east-light/10 border border-east-light/20 px-3 py-2.5 rounded-xl text-center shadow-sm">
                                <p className="text-[8px] font-black text-east-dark uppercase tracking-tighter mb-0.5">BONUS</p>
                                <p className="text-[12px] font-black italic text-east-dark uppercase whitespace-nowrap">{activeDetails.savings}</p>
                            </div>
                        )}
                    </div>

                    {/* LARGER BENEFITS GRID (2 Columns) */}
                    <div className="space-y-6 mb-6">
                        {BENEFITS.map((section, idx) => (
                            <div key={idx} className="space-y-2.5">
                                <div className="flex items-center gap-3">
                                    <h3 className="font-montserrat font-black italic text-[10px] text-gray-300 uppercase tracking-widest">{section.title}</h3>
                                    <div className="h-[1px] flex-1 bg-gray-100" />
                                </div>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                                    {section.items.map((item, i) => (
                                        <div key={i} className="flex justify-between items-center py-1 border-b border-gray-50 last:border-0 overflow-hidden">
                                            <span className="font-bold text-[11px] text-gray-700 uppercase tracking-tight truncate mr-2">{item.label}</span>
                                            <span className="font-black text-[11px] uppercase italic text-black shrink-0">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* FOOTER BUTTON */}
                <div className="px-7 pb-8 pt-4 bg-gradient-to-t from-white via-white to-white/90 shrink-0">
                    <button
                        onClick={handlePurchase}
                        disabled={isLoading}
                        className="w-full bg-black text-white font-montserrat font-black italic text-[13px] py-4.5 rounded-2xl uppercase tracking-widest hover:bg-east-light hover:text-black transition-all shadow-2xl active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 h-[60px]"
                    >
                        {isLoading ? 'WORKING...' : (
                            <>
                                <span>{billingCycle === 'yearly' ? 'ACTIVATE YEARLY' : 'ACTIVATE MONTHLY'}</span>
                                <CheckCircle size={18} />
                            </>
                        )}
                    </button>
                    <p className="text-[8px] text-center text-gray-400 mt-4 font-bold uppercase tracking-widest">SECURE CHECKOUT VIA STRIPE</p>
                </div>
            </div>

            <style jsx>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
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