'use client';
import React from 'react';
import { X, Share2, Calendar, Clock, Bookmark } from 'lucide-react';
import { useToast } from '../ui/Toast';

interface NewsArticleModalProps {
    item: {
        title: string;
        description?: string;
        image_url?: string;
        start_time: string;
    };
    onClose: () => void;
}

export default function NewsArticleModal({ item, onClose }: NewsArticleModalProps) {
    const { addToast } = useToast();
    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: item.title,
                    text: item.description,
                    url: window.location.href,
                });
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            // Fallback: Copy to clipboard
            navigator.clipboard.writeText(`${item.title}\n\n${item.description}\n\nRead more on EAST App.`);
            addToast('Link copied to clipboard!', 'success');
        }
    };

    const formattedDate = new Date(item.start_time).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl animate-fadeIn overflow-y-auto no-scrollbar">
            {/* Header / Sticky Close */}
            <div className="sticky top-0 z-[110] px-6 py-5 flex justify-between items-center bg-gradient-to-b from-black via-black/80 to-transparent">
                <button
                    onClick={onClose}
                    className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-90"
                >
                    <X size={24} />
                </button>
                <div className="flex gap-2">
                    <button
                        onClick={handleShare}
                        className="w-12 h-12 rounded-full bg-east-light flex items-center justify-center text-black hover:bg-white transition-all active:scale-90"
                    >
                        <Share2 size={20} />
                    </button>
                    <button className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all active:scale-90">
                        <Bookmark size={20} />
                    </button>
                </div>
            </div>

            <div className="max-w-xl mx-auto pb-20">
                {/* HERO IMAGE */}
                <div className="relative w-full aspect-[16/10] overflow-hidden">
                    <img
                        src={item.image_url || 'https://images.unsplash.com/photo-1515523110800-9415d13b84a8'}
                        className="w-full h-full object-cover"
                        alt={item.title}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                </div>

                {/* CONTENT */}
                <div className="px-6 -mt-10 relative z-10">
                    <div className="bg-east-light text-black text-[10px] font-black px-3 py-1 rounded-full w-fit mb-4 uppercase tracking-[0.2em] shadow-lg shadow-east-light/20">
                        Official Release
                    </div>

                    <h1 className="font-montserrat font-black italic text-4xl text-white uppercase leading-none tracking-tighter mb-6">
                        {item.title}
                    </h1>

                    <div className="flex items-center gap-4 mb-8 text-gray-500 font-bold text-[10px] uppercase tracking-widest border-y border-white/5 py-4">
                        <div className="flex items-center gap-1.5">
                            <Calendar size={14} className="text-east-light" />
                            {formattedDate}
                        </div>
                        <div className="w-1 h-1 rounded-full bg-gray-600" />
                        <div className="flex items-center gap-1.5">
                            <Clock size={14} className="text-east-light" />
                            3 MIN READ
                        </div>
                    </div>

                    <div className="space-y-6">
                        {item.description ? (
                            item.description.split('\n\n').map((paragraph, i) => (
                                <p key={i} className="text-gray-300 font-opensans leading-[1.8] text-base opacity-90 first-letter:text-5xl first-letter:font-black first-letter:italic first-letter:text-east-light first-letter:mr-3 first-letter:float-left first-letter:mt-1">
                                    {paragraph}
                                </p>
                            ))
                        ) : (
                            <p className="text-gray-500 italic uppercase font-black text-xs tracking-widest text-center py-10">No detailed content available for this report.</p>
                        )}
                    </div>

                    {/* CTA / FOOTER */}
                    <div className="mt-16 pt-10 border-t border-white/10 flex flex-col items-center">
                        <div className="w-20 h-1 bg-east-light mb-6 rounded-full" />
                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.5em] mb-10">East Sports Group HQ</p>

                        <button
                            onClick={onClose}
                            className="w-full bg-white text-black font-black italic text-sm py-5 rounded-2xl uppercase hover:bg-east-light transition-all active:scale-95 shadow-2xl"
                        >
                            Back to Feed
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
