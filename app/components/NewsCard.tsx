import React from 'react';
import { ExternalLink, Calendar, ChevronRight } from 'lucide-react';
import { safetoLocaleDateString } from '@/app/lib/dateUtils';

interface NewsCardProps {
    title: string;
    content: string;
    image_url?: string;
    external_url?: string;
    type?: 'news' | 'event';
    event_date?: string;
    onClick?: () => void;
}

export default function NewsCard({ 
    title, 
    content, 
    image_url, 
    external_url, 
    type = 'news', 
    event_date,
    onClick 
}: NewsCardProps) {
    return (
        <div 
            onClick={onClick}
            className="group relative bg-[#1e1e1e] rounded-2xl overflow-hidden border border-white/5 hover:border-[#28D160]/30 transition-all active:scale-[0.98] cursor-pointer flex flex-col h-full shadow-xl"
        >
            {/* Image Overlay */}
            <div className="relative aspect-[16/9] overflow-hidden bg-black/40">
                <img 
                    src={image_url || 'https://images.unsplash.com/photo-1515523110800-9415d13b84a8'} 
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1e1e1e] to-transparent opacity-60" />
                
                {/* Badge */}
                <div className="absolute top-4 left-4 flex gap-2">
                    <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-full tracking-[0.1em] ${
                        type === 'news' ? 'bg-[#28D160] text-black' : 'bg-blue-500 text-white'
                    }`}>
                        {type}
                    </span>
                    {external_url && (
                        <div className="bg-black/40 backdrop-blur-md p-1.5 rounded-full text-white">
                            <ExternalLink size={10} />
                        </div>
                    )}
                </div>
            </div>

            {/* Content Body */}
            <div className="p-5 flex flex-col flex-1 gap-2">
                {type === 'event' && event_date && (
                    <div className="flex items-center gap-1.5 text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">
                        <Calendar size={12} />
                        {safetoLocaleDateString(event_date)}
                    </div>
                )}
                
                <h3 className="font-montserrat font-black italic text-lg uppercase leading-none tracking-tighter text-white group-hover:text-[#28D160] transition-colors line-clamp-2">
                    {title}
                </h3>
                
                <p className="text-gray-400 text-xs leading-relaxed line-clamp-3 font-opensans opacity-80">
                    {content}
                </p>

                <div className="mt-auto pt-4 flex items-center justify-between">
                    <span className="text-[10px] font-black italic uppercase tracking-widest text-[#28D160] flex items-center gap-1 group-hover:gap-2 transition-all">
                        Read Story <ChevronRight size={12} />
                    </span>
                    {external_url && (
                        <span className="text-[8px] text-gray-600 font-bold uppercase tracking-widest bg-white/5 px-2 py-1 rounded">
                            External source
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}