'use client';
import React from 'react';
import { Plus, Trophy, Settings, ChevronLeft, Lock, HelpCircle, MessageSquare } from 'lucide-react';
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
    const normalizedRole = role?.toLowerCase().trim();
    const isSubscriber = subscriptionStatus === 'active' || subscriptionStatus === 'trialing';
    const isManuallyActive = accountStatus === 'active';
    const isBypass = normalizedRole === 'admin' || normalizedRole === 'coach' || normalizedRole === 'sys-admin';
    const isUnlocked = isSubscriber || isManuallyActive || isBypass;

    // Only apply locking to player/parent roles. Admins/Coaches bypass this.
    const isLocked = !isUnlocked;

    return (
        <div className={`sticky top-0 z-50 px-4 sm:px-6 py-4 border-b border-white/5 grid grid-cols-3 items-center backdrop-blur-xl bg-black/50 transition-all duration-300 ${className}`}>
            {/* Left Area - Flex-1 ensures it shares space equally with Right Area */}
            <div className="flex-1 flex items-center justify-start z-10 pointer-events-auto">
                {onBack ? (
                    <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors p-2 -ml-2">
                        <ChevronLeft size={24} />
                    </button>
                ) : (
                    showLogo && (
                        <div className="relative w-24 sm:w-40 h-10 sm:h-14">
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

            {/* Center Area - Flex-none ensures it takes only needed space, centered by flex-1 siblings */}
            <div className="flex-none z-50 flex flex-col items-center relative pointer-events-auto">
                {title ? (
                    <h1 className="font-montserrat font-black italic text-lg text-white uppercase tracking-tight text-center">{title}</h1>
                ) : (
                    credits !== undefined && setTab && (
                        <div className="flex flex-col items-center">
                            <button
                                data-testid="credits-button"
                                onClick={() => {
                                    console.log('Credits button clicked, setting tab to qr');
                                    setTab('qr');
                                }}
                                className={`flex items-center justify-center gap-2 sm:gap-3 border rounded-full px-4 sm:px-8 py-2.5 sm:py-2.5 transition-all active:scale-95 group backdrop-blur-md shadow-2xl min-w-[110px] sm:min-w-[140px] cursor-pointer
                                    ${isLocked ? 'bg-red-900/20 border-red-500/50 hover:bg-red-900/30' : 'bg-[#1a1a1a] border-white/20 hover:bg-white/10 hover:border-east-light'}
                                `}
                            >
                                {isLocked ? (
                                    <>
                                        <Lock size={14} className="text-red-500" />
                                        <span className="text-red-500 font-black italic text-lg sm:text-xl drop-shadow-md">LOCKED</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-white font-black italic text-lg sm:text-xl drop-shadow-md">{credits}</span>
                                        <span className="text-[9px] sm:text-[10px] font-black text-east-light uppercase tracking-[0.15em] sm:tracking-[0.2em]">{credits === 1 ? 'CREDIT' : 'CREDITS'}</span>
                                        <Plus size={12} className="text-gray-500 group-hover:text-white transition-colors" />
                                    </>
                                )}
                            </button>
                        </div>
                    )
                )}
            </div>

            {/* Right Area - Flex-1 ensures it shares space equally with Left Area */}
            <div className="flex-1 flex justify-end gap-2 sm:gap-3 items-center z-10">
                {!onBack && !isBypass && setTab && (
                    <button onClick={() => setTab('community')} className="text-gray-400 hover:text-[#28D160] transition-colors active:scale-90 duration-200" title="Messages">
                        <MessageSquare size={16} className="sm:hidden stroke-[1.5px]" />
                        <MessageSquare size={18} className="hidden sm:block stroke-[1.5px]" />
                    </button>
                )}
                {!onBack && (
                    <Link href="/stats" className="text-gray-400 hover:text-east-light transition-colors active:scale-90 duration-200">
                        <Trophy size={16} className="sm:hidden stroke-[1.5px]" />
                        <Trophy size={18} className="hidden sm:block stroke-[1.5px]" />
                    </Link>
                )}

                {onOpenSettings && (
                    <button onClick={onOpenSettings} data-testid="settings-button" className="text-gray-400 hover:text-white transition-colors active:scale-90 duration-200">
                        <Settings size={16} className="sm:hidden stroke-[1.5px]" />
                        <Settings size={18} className="hidden sm:block stroke-[1.5px]" />
                    </button>
                )}
                <Link href="/faq" className="text-gray-400 hover:text-east-light transition-colors active:scale-90 duration-200">
                    <HelpCircle size={15} className="sm:hidden stroke-[1.5px]" />
                    <HelpCircle size={17} className="hidden sm:block stroke-[1.5px]" />
                </Link>
            </div>
        </div>
    );
}
