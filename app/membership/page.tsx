'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    ChevronLeft,
    CheckCircle, X, Users, User as UserIcon, Heart, Calendar
} from 'lucide-react';
import type { Tab } from '../types';
import { supabase } from '@/app/lib/supabase';

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
            yearly: { id: INDIVIDUAL_PRICE_YEARLY, display: '24,000', credits: '15,000', savings: '3,000 BONUS CREDITS' }
        }
    },
    family: {
        '1': {
            id: 'family-1',
            name: 'PRO FAMILY (1)',
            prices: {
                monthly: { id: FAMILY_1_PRICE_MONTHLY, display: '2,000', credits: '1,000' },
                yearly: { id: FAMILY_1_PRICE_YEARLY, display: '24,000', credits: '15,000', savings: '3,000 BONUS CREDITS' }
            }
        },
        '2': {
            id: 'family-2',
            name: 'PRO FAMILY (2)',
            prices: {
                monthly: { id: FAMILY_2_PRICE_MONTHLY, display: '4,000', credits: '2,500' },
                yearly: { id: FAMILY_2_PRICE_YEARLY, display: '48,000', credits: '33,000', savings: 'SAVE 7,000 ANNUALLY' }
            }
        },
        '3+': {
            id: 'family-3+',
            name: 'PRO FAMILY (3+)',
            prices: {
                monthly: { id: FAMILY_3_PRICE_MONTHLY, display: '5,500', credits: '3,500' },
                yearly: { id: FAMILY_3_PRICE_YEARLY, display: '66,000', credits: '45,000', savings: 'SAVE 10,000 ANNUALLY' }
            }
        }
    }
};

const BENEFITS = [
    {
        title: 'ACCESS',
        items: [
            { label: 'GYM & LOUNGE AREA', value: 'INCLUDED', isPositive: true },
            { label: 'SPECIAL EVENTS', value: 'INCLUDED', isPositive: true },
            { label: 'LOCKER RENTAL', value: 'INCLUDED', isPositive: true },
            { label: 'PRIORITY BOOKINGS', value: 'INCLUDED', isPositive: true }
        ]
    },
    {
        title: 'BOOKINGS',
        items: [
            { label: 'FACILITIES', value: '7 DAYS AHEAD', isPositive: true },
            { label: 'COACHES', value: '7 DAYS AHEAD', isPositive: true },
            { label: 'CLASSES', value: '7 DAYS AHEAD', isPositive: true }
        ]
    },
    {
        title: 'MEMBER RATE DISCOUNTS',
        items: [
            { label: 'LOCKERS', value: '20% OFF', isPositive: true },
            { label: 'CLASSES', value: '50% OFF', isPositive: true },
            { label: 'FACILITIES', value: '50% OFF', isPositive: true },
            { label: 'SKATE SHARPENING', value: '20% OFF', isPositive: true },
            { label: 'MERCH, FOOD AND DRINKS', value: '10% OFF', isPositive: true }
        ]
    }
];

function MembershipContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

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
                // Fetch role for tab visibility
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();
                if (profile) setUserRole(profile.role);
            }
        };
        getUser();
    }, []);

    // Derived State
    const activePlan = planType === 'individual'
        ? plans.individual
        : plans.family[memberCount];

    const activeDetails = billingCycle === 'monthly' ? activePlan.prices.monthly : activePlan.prices.yearly;

    const handlePurchase = async () => {
        if (!currentUserId) {
            alert("Please log in to purchase.");
            return;
        }

        setIsLoading(true);
        try {
            const priceId = activeDetails.id;

            if (!priceId) {
                alert(`Configuration Error: Missing Price ID for this plan.`);
                setIsLoading(false);
                return;
            }

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
                alert(`Checkout Failed: ${data.error || 'Unknown error'}`);
            }
        } catch (e: any) {
            console.error(e);
            alert(`Purchase Failed: ${e.message || 'Network error'}`);
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
                <div className="flex items-center px-6 pt-5 pb-2 shrink-0 relative">
                    <button onClick={() => router.back()} className="text-black/40 hover:text-black transition-colors absolute left-6 z-20">
                        <ChevronLeft size={24} strokeWidth={3} />
                    </button>
                    <div className="w-full text-center">
                        <h2 className="font-montserrat font-black italic text-2xl mb-1 uppercase tracking-tighter text-black leading-none">MEMBERSHIP</h2>
                        <p className="font-bold text-[9px] text-gray-400 uppercase tracking-widest leading-none">SELECT A PLAN</p>
                    </div>
                </div>

                {/* TAB SWITCHER (Individual vs Family) - ONLY FOR PARENTS */}
                {userRole === 'parent' && (
                    <div className="flex justify-center px-8 mb-4 shrink-0 mt-2">
                        <div className="bg-gray-50 p-1 rounded-xl flex w-full relative border border-gray-100">
                            {['individual', 'family'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => {
                                        setPlanType(type as any);
                                        if (type === 'individual') setMemberCount('1');
                                    }}
                                    className={`flex-1 py-2 rounded-lg text-[10px] font-black italic uppercase tracking-widest transition-all z-10 ${planType === type ? 'text-white' : 'text-gray-400'}`}
                                >
                                    {type}
                                </button>
                            ))}
                            <div
                                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-black rounded-lg shadow-md transition-transform duration-300 ease-in-out ${planType === 'family' ? 'translate-x-[100%] ml-1' : 'ml-0'}`}
                            />
                        </div>
                    </div>
                )}

                {/* MEMBER COUNT SELECTOR (Only for Family) */}
                {planType === 'family' && (
                    <div className="flex flex-col gap-1 px-8 mb-4 shrink-0 animate-fadeIn">
                        <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">Select Family Size</p>
                        <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-lg">
                            {['1', '2', '3+'].map((count) => (
                                <button
                                    key={count}
                                    onClick={() => setMemberCount(count as any)}
                                    className={`py-1.5 rounded-md text-[9px] font-black italic transition-all ${memberCount === count ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    {count === '3+' ? '3+' : `${count} Member`}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* BILLING CYCLE TOGGLE */}
                <div className="flex justify-center px-8 mb-4 shrink-0">
                    <div className="bg-gray-100 p-1 rounded-full flex w-full relative">
                        <button
                            onClick={() => setBillingCycle('monthly')}
                            className={`flex-1 py-1.5 rounded-full text-[9px] font-black italic uppercase tracking-widest transition-all z-10 ${billingCycle === 'monthly' ? 'text-white' : 'text-gray-400'}`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingCycle('yearly')}
                            className={`flex-1 py-1.5 rounded-full text-[9px] font-black italic uppercase tracking-widest transition-all z-10 ${billingCycle === 'yearly' ? 'text-white' : 'text-gray-400'}`}
                        >
                            Yearly
                        </button>
                        <div
                            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-black rounded-full shadow-md transition-transform duration-300 ease-in-out ${billingCycle === 'yearly' ? 'translate-x-[100%] ml-1' : 'ml-0'}`}
                        />
                    </div>
                </div>

                {/* Plan Content */}
                <div className="flex-1 flex flex-col items-center px-8 pb-8 overflow-y-auto scrollbar-hide">
                    <div className="w-full flex flex-col h-full">
                        <div className="text-center mb-6 pb-4 border-b border-dashed border-gray-200 shrink-0">
                            <h2 className="font-montserrat font-black italic text-5xl uppercase mb-0 leading-none tracking-tighter">PRO</h2>
                            {planType === 'family' && (
                                <h3 className="text-[10px] font-black text-east-dark uppercase tracking-widest mb-1">FAMILY PASS</h3>
                            )}

                            <div className="flex items-baseline justify-center gap-1 mt-2">
                                <span className="font-montserrat font-black italic text-4xl tracking-tight">
                                    {activeDetails.display}
                                </span>
                                <span className="font-montserrat font-black italic text-[10px] text-gray-400 uppercase tracking-tight">
                                    HKD / {billingCycle === 'monthly' ? 'MO' : 'YR'}
                                </span>
                            </div>

                            {/* Credits Highlight */}
                            <div className="mt-2 text-[10px] font-bold text-black uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full">
                                +{activeDetails.credits} Credits / {billingCycle === 'monthly' ? 'mo' : 'yr'}
                            </div>

                            {/* Savings Badge */}
                            {billingCycle === 'yearly' && (
                                <div className="mt-3 inline-block text-[9px] font-black italic px-3 py-1 rounded-lg uppercase tracking-widest bg-east-light text-black border border-east-light shadow-glow">
                                    {activeDetails.savings}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-4 flex-1 mb-8">
                            {BENEFITS.map((section, idx) => (
                                <div key={idx} className="flex flex-col gap-1.5">
                                    <h3 className="font-montserrat font-black italic text-[9px] text-gray-300 uppercase tracking-widest">
                                        {section.title}
                                    </h3>
                                    <div className="space-y-1.5">
                                        {section.items.map((item, i) => (
                                            <div key={i} className="flex justify-between items-center border-b border-gray-50 pb-1 last:border-0">
                                                <span className="font-bold text-[10px] text-gray-700 uppercase tracking-tight">{item.label}</span>
                                                <span className={`font-black text-[10px] uppercase text-right italic ${item.isPositive ? 'text-black' : 'text-gray-400'}`}>
                                                    {item.value}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={handlePurchase}
                            disabled={isLoading}
                            className="w-full bg-black text-white font-montserrat font-black italic text-[12px] py-4 rounded-full uppercase tracking-widest hover:bg-east-light hover:text-black transition-all shadow-xl shrink-0 mt-auto active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'PROCESSING...' : (billingCycle === 'yearly' ? 'ACTIVATE YEARLY PASS' : 'ACTIVATE MONTHLY PASS')}
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .text-stroke-thin {
                    -webkit-text-stroke: 1px black;
                }
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