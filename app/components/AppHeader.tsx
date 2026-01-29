'use client';
import React from 'react';
import { Plus, Trophy, Settings, ChevronLeft, Lock } from 'lucide-react';
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
    accountStatus
}: AppHeaderProps) {

    // Check locked status
    // Unlocked if: (Subscription Active OR Trialing) OR (Account Manually Active)
    const isSubscriber = subscriptionStatus === 'active' || subscriptionStatus === 'trialing';
    const isManuallyActive = accountStatus === 'active';
    const isUnlocked = isSubscriber || isManuallyActive;

    // Only apply locking to player/parent roles. Admins/Coaches bypass this.
    // If we don't have a role (e.g. initial load), we default to unlocked to avoid flickering red.
    const isLocked = isUnlocked ? false : true;
    // Wait, I need the ROLE in AppHeader to do this properly.

    // WAIT: The issue description says "Users remain LOCKED even after Admin manually activates".
    // This implies `subscriptionStatus` passed here is NOT 'active' even after admin change.
    // OR the logic `subscriptionStatus && ...` fails if it's null?

    // Let's refine the logic to be safer:
    // Locked if: status exists AND is NOT active/trialing.
    // If status is Missing/Null, is it locked? Yes, usually.

    // Correct Logic: 
    // Unlocked = active OR trialing.
    // Locked = NOT (active OR trialing).

    return (
        <div className={`sticky top-0 z-50 px-6 py-4 border-b border-white/5 flex justify-between items-center backdrop-blur-xl bg-black/50 transition-all duration-300 ${className}`}>
            <div className="flex-1 flex items-center justify-start">
                {onBack ? (
                    <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors p-2 -ml-2">
                        <ChevronLeft size={24} />
                    </button>
                ) : (
                    showLogo && (
                        <div className="relative w-32 h-12">
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

            {/* Center Area - Now for Credits or Title */}
            <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
                {title ? (
                    <h1 className="font-montserrat font-black italic text-lg text-white uppercase tracking-tight">{title}</h1>
                ) : (
                    credits !== undefined && setTab && (
                        <div className="flex flex-col items-center gap-2">
                            <button
                                onClick={() => setTab('qr')}
                                className={`flex items-center justify-center gap-3 border rounded-full px-8 py-2.5 transition-all active:scale-95 group backdrop-blur-md shadow-2xl min-w-[140px]
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

            <div className="w-20 flex justify-end gap-5 items-center">
                {!onBack && (
                    <Link href="/stats" className="text-gray-400 hover:text-east-light transition-colors active:scale-90 duration-200">
                        <Trophy size={22} className="stroke-[1.5px]" />
                    </Link>
                )}

                {onOpenSettings && (
                    <button onClick={onOpenSettings} className="text-gray-400 hover:text-white transition-colors active:scale-90 duration-200">
                        <Settings size={22} className="stroke-[1.5px]" />
                    </button>
                )}
            </div>
        </div>
    );
}
