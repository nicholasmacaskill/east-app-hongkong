'use client';

import React, { useEffect, useState } from 'react';
import { UserRole } from '@/app/types';

interface LandingScreenProps {
    onSelectAuth: (role: UserRole, step: 'login' | 'register') => void;
}

export default function LandingScreen({ onSelectAuth }: LandingScreenProps) {
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
                <div className={`mb-10 transition-opacity duration-[2000ms] ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
                    <img
                        src="/east-logo-transparent.png"
                        alt="East Sports Group"
                        className="w-[200px] h-auto object-contain"
                    />
                </div>

                {/* CALL TO ACTION */}
                <div className={`w-full transition-all duration-[2000ms] delay-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    <div className="flex flex-col items-center mb-12">
                        <p className="text-[10px] font-bold tracking-[0.5em] text-white/50 uppercase mb-4">
                            East Sports Group • Hong Kong
                        </p>
                        <h2 className="text-[13px] font-black tracking-[0.6em] text-white/80 uppercase text-center">
                            Select Your Portal
                        </h2>
                    </div>

                    <div className="flex flex-col gap-10">
                        {/* ATHLETE SECTION */}
                        <div className="animate-fadeIn" style={{ animationDelay: '0ms' }}>
                            <p className="text-[14px] font-black tracking-[0.3em] text-white uppercase mb-4 text-center">athlete</p>
                            <div className="grid grid-cols-2 gap-3">
                                <LoginButton
                                    label="LOGIN"
                                    onClick={() => onSelectAuth('player', 'login')}
                                    variant="primary"
                                />
                                <LoginButton
                                    label="REGISTER"
                                    onClick={() => onSelectAuth('player', 'register')}
                                    variant="secondary"
                                />
                            </div>
                        </div>

                        {/* PARENT SECTION */}
                        <div className="animate-fadeIn" style={{ animationDelay: '200ms' }}>
                            <p className="text-[14px] font-black tracking-[0.3em] text-white uppercase mb-4 text-center">parent</p>
                            <div className="grid grid-cols-2 gap-3">
                                <LoginButton
                                    label="LOGIN"
                                    onClick={() => onSelectAuth('parent', 'login')}
                                    variant="primary"
                                />
                                <LoginButton
                                    label="REGISTER"
                                    onClick={() => onSelectAuth('parent', 'register')}
                                    variant="secondary"
                                />
                            </div>
                        </div>

                        {/* COACH SECTION */}
                        <div className="animate-fadeIn" style={{ animationDelay: '400ms' }}>
                            <p className="text-[14px] font-black tracking-[0.3em] text-white uppercase mb-4 text-center">coach</p>
                            <LoginButton
                                label="LOGIN"
                                onClick={() => onSelectAuth('coach', 'login')}
                                variant="secondary"
                            />
                        </div>

                        {/* ADMIN SECTION */}
                        <div className="pt-12 mt-4 border-t border-white/10 w-full animate-fadeIn" style={{ animationDelay: '600ms' }}>
                            <LoginButton
                                label="ADMIN PORTAL"
                                onClick={() => onSelectAuth('admin', 'login')}
                                variant="ghost"
                            />
                        </div>
                    </div>
                </div>

                {/* FOOTER - Spacer */}
                <div className="mt-20 h-8" />
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

function LoginButton({ label, onClick, variant = 'primary' }: { label: string; onClick: () => void; variant?: 'primary' | 'secondary' | 'ghost' }) {
    const baseStyles = "group relative overflow-hidden w-full transition-all duration-500 active:scale-95 rounded-2xl py-5 font-black italic tracking-tighter uppercase text-sm";

    const variants = {
        primary: "bg-east-light text-black shadow-[0_10px_20px_-5px_rgba(40,209,96,0.3)] hover:bg-white",
        secondary: "bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/30",
        ghost: "bg-white/10 border border-white/20 text-white hover:bg-white/20"
    };

    return (
        <button onClick={onClick} className={`${baseStyles} ${variants[variant]}`}>
            {/* Hover Glimmer */}
            <div className={`absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent ${variant === 'primary' ? 'via-white/50' : 'via-white/10'} to-transparent`} />

            <span className="relative z-10">{label}</span>

            {variant === 'primary' && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-black shadow-[0_0_10px_rgba(0,0,0,0.5)]" />
                </div>
            )}
        </button>
    );
}
