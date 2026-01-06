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
// Force rebuild to pick up env vars - 2026-01-05
const ELITE_PRICE_MONTHLY = process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY || '';
const ELITE_PRICE_YEARLY = process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY || '';

const plans = [
    {
        id: 'pro',
        name: 'PRO PASS',
        shortName: 'PRO',
        // We now store both IDs
        prices: {
            monthly: ELITE_PRICE_MONTHLY,
            yearly: ELITE_PRICE_YEARLY
        },
        displayPrice: {
            monthly: '2,000',
            yearly: '24,000'
        },
        savings: '3,000 BONUS CREDITS', // Yearly benefit
        sections: [
            {
                title: 'ACCESS',
                items: [
                    { label: 'GYM & LOUNGE', value: 'INCLUDED', isPositive: true },
                    { label: 'SHOOTING PAD', value: 'INCLUDED', isPositive: true },
                    { label: 'SPECIAL EVENTS', value: 'ACCESS', isPositive: true }
                ]
            },
            {
                title: 'BOOKING PRIORITY',
                items: [
                    { label: 'FACILITIES', value: '7 DAYS AHEAD', isPositive: true },
                    { label: 'COACHES', value: '7 DAYS AHEAD', isPositive: true },
                    { label: 'CLASSES', value: '7 DAYS AHEAD', isPositive: true }
                ]
            },
            {
                title: 'MEMBER RATES',
                items: [
                    { label: 'CLASSES', value: '50% OFF', isPositive: true },
                    { label: 'FACILITIES', value: '50% OFF', isPositive: true },
                    { label: 'LOCKERS', value: '20% OFF', isPositive: true },
                    { label: 'MERCH & F&B', value: '10% OFF', isPositive: true }
                ]
            }
        ]
    }
];

function MembershipContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    // New State for Billing Cycle
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    const [selectedPlanId, setSelectedPlanId] = useState('pro');
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const activeNavTab: Tab = 'qr';
    const activePlan = plans.find(p => p.id === selectedPlanId) || plans[0];

    // ... (useEffect remains same)

    const handlePurchase = async () => {
        // ... (handlePurchase remains same)
    };

    return (
        <div className="h-screen bg-black text-white font-opensans select-none flex justify-center overflow-hidden">
            {/* Background ... */}
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

                {/* Header ... */}
                <div className="flex items-center px-6 pt-8 pb-4 shrink-0 relative">
                    <button onClick={() => router.back()} className="text-black/40 hover:text-black transition-colors absolute left-6 z-20">
                        <ChevronLeft size={24} strokeWidth={3} />
                    </button>
                    <div className="w-full text-center">
                        <h2 className="font-montserrat font-black italic text-2xl mb-1 uppercase tracking-tighter text-black leading-none">MEMBERSHIP</h2>
                        <p className="font-bold text-[9px] text-gray-400 uppercase tracking-widest leading-none">SELECT A PLAN</p>
                    </div>
                </div>

                {/* BILLING CYCLE TOGGLE ... */}
                <div className="flex justify-center px-8 mb-4 shrink-0">
                    <div className="bg-gray-100 p-1 rounded-full flex w-full relative">
                        <button
                            onClick={() => setBillingCycle('monthly')}
                            className={`flex-1 py-2 rounded-full text-[10px] font-black italic uppercase tracking-widest transition-all z-10 ${billingCycle === 'monthly' ? 'text-white' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingCycle('yearly')}
                            className={`flex-1 py-2 rounded-full text-[10px] font-black italic uppercase tracking-widest transition-all z-10 ${billingCycle === 'yearly' ? 'text-white' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Yearly
                        </button>

                        <div
                            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-black rounded-full shadow-md transition-transform duration-300 ease-in-out ${billingCycle === 'yearly' ? 'translate-x-[100%] ml-1' : 'ml-0'
                                }`}
                        />
                    </div>
                </div>

                {/* Plan Card (Inside the main container) */}
                <div className="flex-1 flex flex-col items-center px-8 pb-8 overflow-y-auto">
                    <div className="w-full flex flex-col h-full">
                        <div className="text-center mb-6 pb-4 border-b border-dashed border-gray-200 shrink-0">
                            <h2 className="font-montserrat font-black italic text-4xl uppercase mb-0 leading-none tracking-tighter">{activePlan.name.split(' ')[0]}</h2>
                            <h2 className="font-montserrat font-black italic text-4xl uppercase mb-2 leading-none tracking-tighter text-transparent text-stroke-thin opacity-20">{activePlan.name.split(' ')[1]}</h2>

                            <div className="flex items-baseline justify-center gap-1 mt-2">
                                <span className="font-montserrat font-black italic text-3xl tracking-tight">
                                    {billingCycle === 'monthly' ? activePlan.displayPrice.monthly : activePlan.displayPrice.yearly}
                                </span>
                                <span className="font-montserrat font-black italic text-[10px] text-gray-400 uppercase tracking-tight">
                                    HKD / {billingCycle === 'monthly' ? 'MO' : 'YR'}
                                </span>
                            </div>

                            {/* Credits Highlight */}
                            <div className="mt-2 text-[10px] font-bold text-black uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full">
                                {billingCycle === 'monthly' ? '+1,000 Credits / mo' : '+15,000 Credits / yr'}
                            </div>

                            {/* Savings Badge - Show distinct highlight for Yearly */}
                            {billingCycle === 'yearly' && (
                                <div className={`mt-3 inline-block text-[9px] font-black italic px-3 py-1 rounded-lg uppercase tracking-widest border transition-all bg-east-light text-black border-east-light shadow-glow`}>
                                    {activePlan.savings}
                                </div>
                            )}
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
                            onClick={handlePurchase}
                            disabled={isLoading}
                            className="w-full bg-black text-white font-montserrat font-black italic text-[12px] py-4 rounded-full uppercase tracking-widest hover:bg-east-light hover:text-black transition-all shadow-xl shrink-0 mt-auto active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-transparent hover:border-black"
                        >
                            {isLoading ? 'PROCESSING...' : (billingCycle === 'yearly' ? 'ACTIVATE YEARLY PASS' : 'ACTIVATE MONTHLY PASS')}
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