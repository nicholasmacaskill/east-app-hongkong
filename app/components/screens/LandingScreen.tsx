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
                {/* CALL TO ACTION */}
                <div className={`mt-6 w-full space-y-4 transition-all duration-[2000ms] delay-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    <h2 className="text-[10px] font-black tracking-[0.4em] text-white/40 uppercase text-center mb-10">
                        Select Your Portal
                    </h2>

                    <div className="flex flex-col gap-4">
                        <LoginButton
                            label="COACH"
                            onClick={() => onSelectRole('coach')}
                            delay="delay-0"
                        />
                        <LoginButton
                            label="PARENT"
                            onClick={() => onSelectRole('parent')}
                            delay="delay-100"
                        />
                        <LoginButton
                            label="PLAYER"
                            onClick={() => onSelectRole('player')}
                            delay="delay-200"
                        />
                        <div className="pt-6 mt-2 border-t border-white/10 w-full">
                            <LoginButton
                                label="ADMIN"
                                onClick={() => onSelectRole('admin')}
                                delay="delay-300"
                                isAdmin
                            />
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <div className={`mt-12 transition-all duration-[2000ms] delay-[3000ms] ${isLoaded ? 'opacity-40' : 'opacity-0'}`}>
                    <p className="text-[8px] font-bold tracking-widest text-white uppercase">
                        East Sports Group • Hong Kong
                    </p>
                </div>
            </div>

            <style jsx global>{`
                .ease-out-expo {
                    transition-timing-function: cubic-bezier(0.19, 1, 0.22, 1);
                }
            `}</style>
        </div>
    );
}

function LoginButton({ label, onClick, delay, isAdmin = false }: { label: string; onClick: () => void; delay: string; isAdmin?: boolean }) {
    return (
        <button
            onClick={onClick}
            className={`group relative overflow-hidden w-full backdrop-blur-md border ${isAdmin ? 'bg-white/10 border-white/20 hover:border-white/50' : 'bg-white/5 border-white/10 hover:border-east-light/50'} py-5 rounded-2xl transition-all duration-500 hover:bg-white/15 active:scale-95`}
        >
            {/* Hover Glimmer */}
            <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <span className={`relative z-10 font-black italic text-lg tracking-tighter ${isAdmin ? 'text-white' : 'text-white group-hover:text-east-light'} transition-colors duration-500`}>
                {label} {isAdmin ? 'PORTAL' : 'LOGIN'}
            </span>

            <div className={`absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-white shadow-[0_0_10px_#fff]' : 'bg-east-light shadow-[0_0_10px_#4ade80]'}`} />
            </div>
        </button>
    );
}
