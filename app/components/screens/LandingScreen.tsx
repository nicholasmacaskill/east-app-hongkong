'use client';

import React, { useEffect, useState } from 'react';
import { UserRole } from '@/app/types';

interface LandingScreenProps {
    onSelectRole: (role: UserRole) => void;
}

export default function LandingScreen({ onSelectRole }: LandingScreenProps) {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoaded(true), 500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden font-montserrat select-none">
            {/* 1. SOLID BLACK BACKGROUND */}
            <div className="absolute inset-0 z-0 bg-black" />

            {/* 2. CONTENT CONTAINER */}
            <div className="relative z-10 flex flex-col items-center w-full max-w-sm px-6">
                {/* LOGO */}
                <div className={`mb-8 transition-opacity duration-[2000ms] ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
                    <img
                        src="/east-logo-transparent.png"
                        alt="East Sports Group"
                        className="w-[180px] h-auto object-contain"
                    />
                </div>

                {/* CALL TO ACTION */}
                <div className={`w-full transition-all duration-[2000ms] delay-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    <div className="flex flex-col items-center mb-10">
                        <p className="text-[8px] font-bold tracking-[0.5em] text-white/40 uppercase mb-4 opacity-100">
                            East Sports Group • Hong Kong
                        </p>
                        <h2 className="text-[10px] font-black tracking-[0.5em] text-white/60 uppercase text-center">
                            Select Your Portal
                        </h2>
                    </div>

                    <div className="flex flex-col gap-8">
                        <div className="animate-fadeIn" style={{ animationDelay: '0ms' }}>
                            <p className="text-[10px] font-black tracking-[0.2em] text-white/30 uppercase mb-3 ml-1 text-center">coach</p>
                            <LoginButton
                                label="LOGIN"
                                onClick={() => onSelectRole('coach')}
                            />
                        </div>

                        <div className="animate-fadeIn" style={{ animationDelay: '200ms' }}>
                            <p className="text-[10px] font-black tracking-[0.2em] text-white/30 uppercase mb-3 ml-1 text-center">parent</p>
                            <LoginButton
                                label="LOGIN OR REGISTER"
                                onClick={() => onSelectRole('parent')}
                            />
                        </div>

                        <div className="animate-fadeIn" style={{ animationDelay: '400ms' }}>
                            <p className="text-[10px] font-black tracking-[0.2em] text-white/30 uppercase mb-3 ml-1 text-center">athlete</p>
                            <LoginButton
                                label="LOGIN OR REGISTER"
                                onClick={() => onSelectRole('player')}
                            />
                        </div>

                        <div className="pt-10 mt-6 border-t border-white/10 w-full animate-fadeIn" style={{ animationDelay: '600ms' }}>
                            <LoginButton
                                label="ADMIN PORTAL"
                                onClick={() => onSelectRole('admin')}
                                isAdmin
                            />
                        </div>
                    </div>
                </div>

                {/* FOOTER - Spacer */}
                <div className="mt-16 h-8" />
            </div>

            <style jsx global>{`
                .ease-out-expo {
                    transition-timing-function: cubic-bezier(0.19, 1, 0.22, 1);
                }
                .animate-fadeIn {
                    animation: fadeIn 1.2s cubic-bezier(0.19, 1, 0.22, 1) forwards;
                    opacity: 0;
                    transform: translateY(10px);
                }
                @keyframes fadeIn {
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}

function LoginButton({ label, onClick, isAdmin = false }: { label: string; onClick: () => void; isAdmin?: boolean }) {
    return (
        <button
            onClick={onClick}
            className={`group relative overflow-hidden w-full transition-all duration-500 active:scale-95 rounded-2xl py-5
                ${isAdmin
                    ? 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                    : 'bg-east-light text-black shadow-[0_10px_20px_-5px_rgba(40,209,96,0.3)] hover:bg-white'
                }`}
        >
            {/* Hover Glimmer */}
            <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/50 to-transparent" />

            <span className="relative z-10 font-black italic text-lg tracking-tighter uppercase">
                {label}
            </span>

            {!isAdmin && (
                <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-black shadow-[0_0_10px_rgba(0,0,0,0.5)]" />
                </div>
            )}
        </button>
    );
}
