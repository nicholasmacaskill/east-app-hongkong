'use client';
import React from 'react';
import { Plus, Trophy, Settings, ChevronLeft, Lock, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface AppHeaderProps {
    credits?: number;
    onOpenSettings?: () => void;
    onBack?: () => void;
    setTab?: (tab: any) => void;
    title?: string;
    className?: string;
    showLogo?: boolean;
    subscriptionStatus?: string;
    accountStatus?: string;
    role?: string;
}

export default function AppHeader({
    credits,
    onOpenSettings,
    onBack,
    setTab,
    title,
    className = "",
    showLogo = true,
    subscriptionStatus,
    accountStatus,
    role
}: AppHeaderProps) {

    // Check locked status
    // Unlocked if: (Subscription Active OR Trialing) OR (Account Manually Active)
    const isSubscriber = subscriptionStatus === 'active' || subscriptionStatus === 'trialing';
    const isManuallyActive = accountStatus === 'active';
    const isBypass = role === 'admin' || role === 'coach' || role === 'sys-admin';
    const isUnlocked = isSubscriber || isManuallyActive || isBypass;

    // Only apply locking to player/parent roles. Admins/Coaches bypass this.
    const isLocked = !isUnlocked;

    return (
        <div className={`sticky top-0 z-50 px-4 sm:px-6 py-4 border-b border-white/5 flex justify-between items-center backdrop-blur-xl bg-black/50 transition-all duration-300 ${className}`}>
            <div className="flex-1 flex items-center justify-start relative z-20">
                {onBack ? (
                    <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors p-2 -ml-2">
                        <ChevronLeft size={24} />
                    </button>
                ) : (
                    showLogo && (
                        <div className="relative w-28 sm:w-40 h-14">
                            <Image
                                src="/east-logo-transparent.png"
                                alt="EAST"
                                fill
                                className="object-contain object-left opacity-100"
                                priority
                            />
                        </div>
                    )
                )}
            </div>

            {/* Center Area - Elevated z-index to avoid overlap blocking */}
            <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center pointer-events-none">
                <div className="pointer-events-auto">
                    {title ? (
                        <h1 className="font-montserrat font-black italic text-lg text-white uppercase tracking-tight">{title}</h1>
                    ) : (
                        credits !== undefined && setTab && (
                            <div className="flex flex-col items-center gap-2">
                                <button
                                    onClick={() => setTab('qr')}
                                    className={`flex items-center justify-center gap-3 border rounded-full px-4 sm:px-8 py-2.5 transition-all active:scale-95 group backdrop-blur-md shadow-2xl min-w-[120px] sm:min-w-[140px]
                                        ${isLocked ? 'bg-red-900/20 border-red-500/50 hover:bg-red-900/30' : 'bg-[#1a1a1a] border-white/20 hover:bg-white/10 hover:border-east-light'}
                                    `}
                                >
                                    {isLocked ? (
                                        <>
                                            <Lock size={16} className="text-red-500" />
                                            <span className="text-red-500 font-black italic text-xl drop-shadow-md">LOCKED</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-white font-black italic text-xl drop-shadow-md">{credits}</span>
                                            <span className="text-[10px] font-black text-east-light uppercase tracking-[0.2em]">CREDITS</span>
                                            <Plus size={12} className="text-gray-500 group-hover:text-white transition-colors" />
                                        </>
                                    )}
                                </button>
                            </div>
                        )
                    )}
                </div>
            </div>

            <div className="w-24 flex justify-end gap-3 items-center relative z-20">
                {!onBack && (
                    <Link href="/stats" className="text-gray-400 hover:text-east-light transition-colors active:scale-90 duration-200">
                        <Trophy size={18} className="stroke-[1.5px]" />
                    </Link>
                )}

                {onOpenSettings && (
                    <button onClick={onOpenSettings} className="text-gray-400 hover:text-white transition-colors active:scale-90 duration-200">
                        <Settings size={18} className="stroke-[1.5px]" />
                    </button>
                )}
                <Link href="/faq" className="text-gray-400 hover:text-east-light transition-colors active:scale-90 duration-200">
                    <HelpCircle size={17} className="stroke-[1.5px]" />
                </Link>
            </div>
        </div>
    );
}
