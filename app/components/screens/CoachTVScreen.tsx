'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import { 
    Play, 
    ChevronRight, 
    Share2, 
    Heart, 
    MessageSquare,
    User,
    Tv,
    X,
    Maximize2
} from 'lucide-react';

interface TVVideo {
    id: string;
    title: string;
    description: string;
    video_url: string;
    thumbnail_url: string;
    coach_name: string;
    coach_avatar_url?: string;
    category: string;
    likes?: number;
    views?: number;
}

export default function CoachTVScreen() {
    const [videos, setVideos] = useState<TVVideo[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeVideo, setActiveVideo] = useState<TVVideo | null>(null);

    useEffect(() => {
        // Mocking for now as per slides (Florida Panthers, Anaheim Ducks)
        // In a real scenario, this would fetch from a table or a filtered view of drills
        const mockVideos: TVVideo[] = [
            {
                id: '1',
                title: 'Florida Panthers Technical Drill',
                description: 'Full walkthrough of the defensive transition patterns used in the 2024 season.',
                video_url: 'https://vimeo.com/12345678', // Example
                thumbnail_url: 'https://images.unsplash.com/photo-1510566337590-2fc1f21d0faa?w=800',
                coach_name: 'Florida Panthers Staff',
                category: 'DEFENSE',
                likes: 124,
                views: 2400
            },
            {
                id: '2',
                title: 'Anaheim Ducks Offensive Zone Entry',
                description: 'Mastering the half-wall play and finding the trailer on the 3-on-2.',
                video_url: 'https://vimeo.com/87654321', // Example
                thumbnail_url: 'https://images.unsplash.com/photo-1550256200-eee95d03f30a?w=800',
                coach_name: 'Anaheim Ducks Staff',
                category: 'OFFENSE',
                likes: 89,
                views: 1850
            }
        ];
        
        setVideos(mockVideos);
        setLoading(false);
    }, []);

    const VideoCard = ({ video }: { video: TVVideo }) => (
        <div 
            onClick={() => setActiveVideo(video)}
            className="w-full bg-[#FAFAFA] rounded-[2rem] overflow-hidden shadow-2xl mb-10 transition-all active:scale-[0.98] cursor-pointer group"
        >
            {/* Green Header Strip */}
            <div className="bg-[#15803d] py-3 text-center">
                <span className="text-[10px] font-black italic uppercase tracking-widest text-white/90">COACH TV</span>
            </div>

            {/* Video Thumbnail */}
            <div className="p-4">
                <div className="relative aspect-video bg-black rounded-[1.5rem] overflow-hidden border-4 border-white shadow-lg">
                    <img src={video.thumbnail_url} className="w-full h-full object-cover opacity-80" alt="preview" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                            <Play size={20} fill="white" className="text-white ml-0.5" />
                        </div>
                    </div>
                    {/* Avatars Overlay */}
                    <div className="absolute bottom-4 left-4 flex -space-x-4">
                        {[1, 2].map(i => (
                            <div key={i} className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-gray-200">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${video.coach_name + i}`} className="w-full h-full object-cover" alt="avatar" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="px-6 pb-6 text-black font-montserrat">
                <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-2 leading-none text-[#1A1A1A]">{video.title}</h3>
                <p className="text-[10px] font-black uppercase tracking-tight text-gray-400 mb-6 leading-tight italic">
                    HIGH LEVEL WALKTHROUGH OF THE {video.title} CONDUCTED BY COACH {video.coach_name.split(' ')[0].toUpperCase()} DURING TROJANS PRACTICE TIME.
                </p>

                {/* Icons Area */}
                <div className="flex gap-4 mb-6 opacity-40">
                    <Share2 size={20} />
                    <Maximize2 size={20} />
                    <Target size={20} />
                    <ChevronRight size={20} />
                </div>

                {/* Tag Grid */}
                <div className="space-y-2">
                    {[1, 2].map(row => (
                        <div key={row} className="flex gap-2">
                            {['LEVEL', 'LEVEL', 'LEVEL', 'LEVEL'].map((tag, i) => (
                                <div key={i} className="flex-1 bg-white border-2 border-black/5 py-1 rounded-full flex items-center justify-center">
                                    <span className="text-[7px] font-black italic uppercase text-black/40">{tag}</span>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-black animate-fadeIn font-montserrat select-none">
            {/* Header Overlay */}
            <div className="p-8 pb-4">
                <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white opacity-20">COACH TV</h1>
            </div>

            {/* Video Feed */}
            <div className="px-6 pb-32">
                <div className="max-w-md mx-auto">
                    {videos.map(v => <VideoCard key={v.id} video={v} />)}
                </div>
            </div>

            {/* Modal - Unified Look */}
            {activeVideo && (
                <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl animate-fadeIn flex flex-col items-center justify-center p-6">
                    <div className="w-full max-w-md relative">
                        <VideoCard video={activeVideo} />
                        <button 
                            onClick={() => setActiveVideo(null)}
                            className="absolute -top-12 right-0 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all text-white"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

const Target = ({ size, className }: { size: number; className?: string }) => (
    <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
    </svg>
);
