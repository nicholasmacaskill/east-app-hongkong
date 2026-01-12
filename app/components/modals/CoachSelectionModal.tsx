'use client';
import React from 'react';
import { X, ChevronRight } from 'lucide-react';

interface Coach {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
}

interface CoachSelectionModalProps {
    serviceTitle: string;
    coaches: Coach[];
    onSelect: (coach: Coach) => void;
    onClose: () => void;
}

export default function CoachSelectionModal({ serviceTitle, coaches, onSelect, onClose }: CoachSelectionModalProps) {
    return (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-end md:items-center justify-center p-4 animate-fadeIn">
            <div className="bg-[#1e1e1e] w-full max-w-md rounded-3xl border border-white/10 overflow-hidden relative max-h-[80vh] flex flex-col">

                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#1e1e1e] z-10">
                    <div>
                        <h2 className="text-xl font-black italic uppercase text-white tracking-tighter">Select a Coach</h2>
                        <p className="text-gray-400 text-xs mt-1">For {serviceTitle}</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* List */}
                <div className="p-4 overflow-y-auto space-y-3">
                    {coaches.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 text-sm">
                            No coaches available for this service yet.
                        </div>
                    ) : (
                        coaches.map(coach => (
                            <button
                                key={coach.id}
                                onClick={() => onSelect(coach)}
                                className="w-full flex items-center gap-4 p-4 bg-black/40 border border-white/5 rounded-2xl hover:border-[#28D160] hover:bg-black/60 transition-all group text-left"
                            >
                                <div className="w-14 h-14 rounded-full bg-gray-800 overflow-hidden relative border border-white/10 group-hover:border-[#28D160] transition-colors">
                                    <img
                                        src={coach.avatar_url || 'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=400'}
                                        alt={coach.first_name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-white text-lg group-hover:text-[#28D160] transition-colors">
                                        {coach.first_name} {coach.last_name}
                                    </h3>
                                    <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Available</p>
                                </div>
                                <ChevronRight className="text-gray-600 group-hover:text-[#28D160] transition-colors" size={20} />
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
