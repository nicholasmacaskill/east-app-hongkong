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
            className="group relative w-full aspect-[9/16] bg-[#121212] rounded-[2.5rem] overflow-hidden border border-white/5 cursor-pointer hover:border-[#28D160] transition-all shadow-2xl active:scale-95 mb-8"
        >
            <img 
                src={video.thumbnail_url} 
                className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-all duration-700 group-hover:scale-105" 
                alt={video.title} 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10" />
            
            <div className="absolute inset-0 p-8 flex flex-col justify-between z-20">
                <div className="flex justify-between items-start">
                    <div className="bg-[#28D160] text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#28D160]/20">
                        {video.category}
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full border-2 border-east-light overflow-hidden bg-gray-900 shadow-xl">
                            <User size={20} className="w-full h-full p-2 text-gray-500" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-east-light italic">{video.coach_name}</p>
                            <h3 className="text-xl font-black italic uppercase tracking-tighter text-white leading-tight line-clamp-2">{video.title}</h3>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-6 text-gray-400">
                        <div className="flex items-center gap-1.5 hover:text-white transition-colors">
                            <Heart size={16} />
                            <span className="text-[10px] font-black italic">{video.likes}</span>
                        </div>
                        <div className="flex items-center gap-1.5 hover:text-white transition-colors">
                            <MessageSquare size={16} />
                            <span className="text-[10px] font-black italic">12</span>
                        </div>
                        <div className="flex-1" />
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black shadow-2xl hover:bg-[#28D160] transition-colors scale-100 group-hover:scale-110">
                            <Play size={20} fill="currentColor" className="ml-1" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white p-6 animate-fadeIn pb-24 font-montserrat">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-east-light text-black rounded-2xl shadow-[0_0_20px_rgba(40,209,96,0.3)]">
                        <Tv size={24} />
                    </div>
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter">COACH TV</h1>
                </div>
            </div>

            {/* Video List */}
            <div className="max-w-md mx-auto">
                {videos.map(v => <VideoCard key={v.id} video={v} />)}
                
                {videos.length === 0 && !loading && (
                    <div className="py-20 text-center opacity-30 grayscale">
                        <Tv size={48} className="mx-auto mb-4" />
                        <h2 className="text-xl font-black italic uppercase tracking-tighter">Signal Searching...</h2>
                        <p className="text-xs font-bold uppercase mt-2">Connecting to the live coaching network.</p>
                    </div>
                )}
            </div>

            {/* Modal for Video Playback (Placeholder) */}
            {activeVideo && (
                <div className="fixed inset-0 z-[100] bg-black animate-fadeIn flex flex-col">
                    <div className="p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent relative z-10">
                        <button 
                            onClick={() => setActiveVideo(null)}
                            className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all"
                        >
                            <X size={24} />
                        </button>
                        <h2 className="text-xs font-black italic uppercase tracking-widest text-center">{activeVideo.title}</h2>
                        <div className="w-10" />
                    </div>

                    <div className="flex-1 bg-gray-900 flex items-center justify-center relative">
                        <img 
                            src={activeVideo.thumbnail_url} 
                            className="w-full aspect-video object-cover" 
                            alt="preview" 
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-20 h-20 bg-[#28D160] rounded-full flex items-center justify-center text-black shadow-2xl animate-pulse cursor-pointer">
                                <Play size={32} fill="currentColor" className="ml-1" />
                            </div>
                        </div>
                    </div>

                    <div className="p-8 pb-32">
                        <div className="flex items-center gap-4 mb-4">
                            <span className="bg-[#28D160]/10 text-[#28D160] border border-[#28D160]/20 px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest italic">{activeVideo.category}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 italic">{activeVideo.views} Views</span>
                        </div>
                        <p className="font-montserrat font-bold italic text-sm text-gray-300 leading-relaxed uppercase">
                            {activeVideo.description}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
