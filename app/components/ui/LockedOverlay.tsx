import React from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';

export default function LockedOverlay() {
    return (
        <div data-testid="locked-overlay" className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
            <div className="bg-red-900/20 border border-red-500/50 p-6 rounded-3xl mb-6 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
                <Lock size={48} className="text-red-500 mx-auto" />
            </div>

            <h2 className="font-montserrat font-black italic text-3xl uppercase text-white mb-2 tracking-tight">
                Account Locked
            </h2>

            <p className="font-opensans text-gray-400 text-sm max-w-xs mb-8 leading-relaxed">
                Your account access is currently restricted. Please update your subscription or top up your credits to continue.
            </p>

            <Link
                href="/top-up"
                className="bg-white text-black font-black italic text-sm px-8 py-3 rounded-full uppercase tracking-widest hover:bg-east-light transition-colors shadow-lg active:scale-95 duration-200"
            >
                Top Up / Manage
            </Link>
        </div>
    );
}
