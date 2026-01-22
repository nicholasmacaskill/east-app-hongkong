
import React from 'react';
import { Loader2 } from 'lucide-react';

interface ProcessingOverlayProps {
    isOpen: boolean;
    message?: string;
}

export default function ProcessingOverlay({ isOpen, message = "Finalizing your credits..." }: ProcessingOverlayProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
            <div className="bg-east-light/10 border border-east-light/30 p-8 rounded-full mb-8 shadow-[0_0_60px_rgba(255,255,255,0.1)] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-east-light/5 to-transparent animate-pulse" />
                <Loader2 size={64} className="text-east-light animate-spin relative z-10" />
            </div>

            <h2 className="font-montserrat font-black italic text-3xl uppercase text-white mb-2 tracking-tighter">
                Processing Payment
            </h2>

            <p className="font-opensans text-gray-400 text-xs max-w-[200px] mb-8 leading-relaxed uppercase tracking-[0.2em] font-bold">
                {message}
            </p>

            <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                    <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-east-light animate-bounce"
                        style={{ animationDelay: `${i * 0.1}s` }}
                    />
                ))}
            </div>
        </div>
    );
}
