'use client';
import React from 'react';
import { Plus, Trophy, Settings, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

interface AppHeaderProps {
    credits?: number;
    onOpenSettings?: () => void;
    onBack?: () => void;
    setTab?: (tab: any) => void;
    title?: string;
    className?: string;
    showLogo?: boolean;
}

export default function AppHeader({
    credits,
    onOpenSettings,
    onBack,
    setTab,
    title,
    className = "",
    showLogo = true
}: AppHeaderProps) {
    return (
        <div className={`sticky top-0 z-50 px-6 py-4 border-b border-white/5 flex justify-between items-center backdrop-blur-xl bg-black/50 transition-all duration-300 ${className}`}>
            <div className="flex-1 flex items-center justify-start">
                {onBack ? (
                    <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors p-2 -ml-2">
                        <ChevronLeft size={24} />
                    </button>
                ) : (
                    showLogo && (
                        <div className="relative w-40 h-16">
                            <img src="/east-logo-transparent.png" alt="EAST" className="w-full h-full object-contain object-left opacity-100" />
                        </div>
                    )
                )}
            </div>

            {/* Center Area - Now for Credits or Title */}
            <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10">
                {title ? (
                    <h1 className="font-montserrat font-black italic text-lg text-white uppercase tracking-tight">{title}</h1>
                ) : (
                    credits !== undefined && setTab && (
                        <button
                            onClick={() => setTab('qr')}
                            className="flex items-center justify-center gap-3 bg-[#1a1a1a] border border-white/20 rounded-full px-8 py-2.5 hover:bg-white/10 hover:border-east-light transition-all active:scale-95 group backdrop-blur-md shadow-2xl min-w-[140px]"
                        >
                            <span className="text-white font-black italic text-xl drop-shadow-md">{credits}</span>
                            <span className="text-[10px] font-black text-east-light uppercase tracking-[0.2em]">CREDITS</span>
                            <Plus size={12} className="text-gray-500 group-hover:text-white transition-colors" />
                        </button>
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
