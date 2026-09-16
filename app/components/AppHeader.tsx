'use client';
import React from 'react';
import { Plus, Trophy, Settings, ChevronLeft, Lock, HelpCircle, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useTenant } from '@/app/providers/TenantProvider';

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
    const { tenant } = useTenant();

    return (
        <div className={`sticky top-0 z-50 px-3 sm:px-6 py-2.5 sm:py-3.5 border-b border-white/5 flex items-center justify-between gap-2 sm:gap-4 backdrop-blur-xl bg-black/60 transition-all duration-300 ${className}`}>
            {/* Left Area */}
            <div className="flex-shrink-0 flex items-center justify-start z-10 pointer-events-auto min-w-[70px] sm:min-w-[120px]">
                {onBack ? (
                    <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors p-1.5 -ml-1">
                        <ChevronLeft size={22} className="sm:w-6 sm:h-6" />
                    </button>
                ) : (
                    showLogo && (
                        <div className="relative w-16 sm:w-32 h-8 sm:h-12">
                            <Image
                                src={tenant.assets.logoUrl}
                                alt={tenant.assets.logoAlt}
                                fill
                                className="object-contain object-left opacity-100"
                                priority
                            />
                        </div>
                    )
                )}
            </div>

            {/* Center Area */}
            <div className="flex-1 min-w-0 flex items-center justify-center px-1">
                {title ? (
                    <h1 className="font-montserrat font-black italic text-base sm:text-lg text-white uppercase tracking-tight text-center truncate">{title}</h1>
                ) : (
                    credits !== undefined && setTab && (
                        <div className="flex items-center justify-center">
                            <button
                                data-testid="credits-button"
                                onClick={() => {
                                    console.log('Credits button clicked, setting tab to qr');
                                    setTab('qr');
                                }}
                                className={`flex items-center justify-center gap-1.5 sm:gap-2.5 border rounded-full px-2.5 sm:px-6 py-1.5 sm:py-2 transition-all active:scale-95 group backdrop-blur-md shadow-2xl cursor-pointer whitespace-nowrap
                                    ${isLocked ? 'bg-red-900/20 border-red-500/50 hover:bg-red-900/30' : 'bg-[#1a1a1a] border-white/20 hover:bg-white/10 hover:border-east-light'}
                                `}
                            >
                                {isLocked ? (
                                    <>
                                        <Lock size={12} className="text-red-500 sm:w-3.5 sm:h-3.5" />
                                        <span className="text-red-500 font-black italic text-sm sm:text-lg drop-shadow-md">LOCKED</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-white font-black italic text-sm sm:text-lg drop-shadow-md">{credits}</span>
                                        <span className="text-[8px] sm:text-[10px] font-black text-east-light uppercase tracking-[0.12em] sm:tracking-[0.2em]">{credits === 1 ? 'CREDIT' : 'CREDITS'}</span>
                                        <Plus size={10} className="text-gray-500 group-hover:text-white transition-colors sm:w-3 sm:h-3" />
                                    </>
                                )}
                            </button>
                        </div>
                    )
                )}
            </div>

            {/* Right Area */}
            <div className="flex-shrink-0 flex justify-end gap-2 sm:gap-3 items-center min-w-[70px] sm:min-w-[120px] relative z-20 pointer-events-auto">
                {!onBack && !isBypass && setTab && (
                    <button onClick={() => setTab('community')} className="text-gray-400 hover:text-east-light transition-colors active:scale-90 duration-200 p-1 flex items-center justify-center cursor-pointer relative z-30 pointer-events-auto" title="Messages">
                        <MessageSquare size={16} className="sm:hidden stroke-[1.5px] pointer-events-none" />
                        <MessageSquare size={18} className="hidden sm:block stroke-[1.5px] pointer-events-none" />
                    </button>
                )}
                {!onBack && (
                    <Link href="/stats" className="text-gray-400 hover:text-east-light transition-colors active:scale-90 duration-200 p-1 flex items-center justify-center cursor-pointer relative z-30 pointer-events-auto">
                        <Trophy size={16} className="sm:hidden stroke-[1.5px] pointer-events-none" />
                        <Trophy size={18} className="hidden sm:block stroke-[1.5px] pointer-events-none" />
                    </Link>
                )}

                {onOpenSettings && (
                    <button onClick={onOpenSettings} data-testid="settings-button" className="text-gray-400 hover:text-white transition-colors active:scale-90 duration-200 p-1 flex items-center justify-center cursor-pointer relative z-30 pointer-events-auto">
                        <Settings size={16} className="sm:hidden stroke-[1.5px] pointer-events-none" />
                        <Settings size={18} className="hidden sm:block stroke-[1.5px] pointer-events-none" />
                    </button>
                )}
                <Link href="/faq" className="text-gray-400 hover:text-east-light transition-colors active:scale-90 duration-200 p-1 flex items-center justify-center cursor-pointer relative z-30 pointer-events-auto">
                    <HelpCircle size={15} className="sm:hidden stroke-[1.5px] pointer-events-none" />
                    <HelpCircle size={17} className="hidden sm:block stroke-[1.5px] pointer-events-none" />
                </Link>
            </div>
        </div>
    );
}
