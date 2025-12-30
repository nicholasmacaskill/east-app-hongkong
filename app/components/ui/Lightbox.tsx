import React from 'react';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';

interface LightboxProps {
    isOpen: boolean;
    imageSrc: string | null;
    onClose: () => void;
    onNext: (e: React.MouseEvent) => void;
    onPrev: (e: React.MouseEvent) => void;
    currentIndex: number;
    totalImages: number;
}

export default function Lightbox({
    isOpen,
    imageSrc,
    onClose,
    onNext,
    onPrev,
    currentIndex,
    totalImages
}: LightboxProps) {
    if (!isOpen || !imageSrc) return null;

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center animate-fadeIn"
            onClick={onClose}
        >
            <button
                onClick={onClose}
                className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors p-2"
            >
                <X size={32} />
            </button>

            <div
                className="relative w-full max-w-4xl px-4 flex items-center justify-center h-[80vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Navigation Buttons */}
                {totalImages > 1 && (
                    <>
                        <button
                            onClick={onPrev}
                            className="absolute left-2 md:-left-12 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10 backdrop-blur-md z-10 top-1/2 -translate-y-1/2"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <button
                            onClick={onNext}
                            className="absolute right-2 md:-right-12 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10 backdrop-blur-md z-10 top-1/2 -translate-y-1/2"
                        >
                            <ArrowRight size={24} />
                        </button>
                    </>
                )}

                {/* Image */}
                <div className="relative w-full h-full flex items-center justify-center">
                    <img
                        src={imageSrc}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                        alt={`Gallery ${currentIndex}`}
                    />
                </div>
            </div>

            {/* Counter */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
                <span className="font-black italic text-east-light text-xl tracking-widest">
                    {currentIndex + 1} / {totalImages}
                </span>
            </div>
        </div>
    );
}
