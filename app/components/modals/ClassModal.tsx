'use client';
import React, { useState, useEffect } from 'react';
import { X, Share2, Send } from 'lucide-react';
import { Session } from '@/app/types/session';

interface ClassModalProps {
    sessions: Session[];
    currentUserId: string | null;
    bookedSessionIds: number[];
    onClose: () => void;
    onScheduleChange: () => void;
    onShare?: (session: Session) => void;
}

export default function ClassModal({
    sessions,
    onClose,
    onScheduleChange,
    currentUserId,
    bookedSessionIds,
    onShare
}: ClassModalProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);

    // Lock Background Scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    if (!sessions || sessions.length === 0 || !currentUserId) return null;

    const displaySession = sessions[0];
    const isNews = displaySession.category === 'NEWS';

    // Auto-select if there is only one option
    useEffect(() => {
        if (sessions.length === 1) {
            setSelectedSessionId(sessions[0].id);
        }
    }, [sessions]);

    const isBooked = selectedSessionId ? bookedSessionIds.includes(selectedSessionId) : false;

    const handleAction = async (method: 'POST' | 'DELETE') => {
        if (!selectedSessionId || isNews) return;

        setIsProcessing(true);

        try {
            const res = await fetch('/api/register', {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUserId, sessionId: selectedSessionId }),
            });

            if (res.ok) {
                onScheduleChange();
            } else if (res.status === 409) {
                alert('You are already registered for this slot.');
            } else {
                alert(`${method === 'POST' ? 'Registration' : 'Cancellation'} failed.`);
            }
        } catch (error) {
            console.error(error);
            alert('Error connecting to server.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn overscroll-y-none">
            <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl relative">

                {/* Header */}
                <div className="bg-gradient-to-r from-east-light to-east-dark p-4 flex justify-between items-center shrink-0">
                    <h2 className="font-montserrat font-black italic text-xl text-white uppercase truncate pr-2">
                        {isBooked ? 'MY BOOKING' : (isNews ? displaySession.title : (displaySession.category === 'COACH' ? displaySession.instructor : displaySession.title))}
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                        <X className="text-white" size={24} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto p-6 text-black">
                    <h2 className="font-montserrat font-black italic text-2xl mb-1 uppercase leading-none">{displaySession.title}</h2>
                    
                    {!isNews && (
                        <p className="font-montserrat font-bold text-[10px] mb-4 uppercase text-gray-500 tracking-wider">
                            {displaySession.category === 'COACH' ? 'PRIVATE COACH' : `INSTRUCTOR: ${displaySession.instructor}`}
                        </p>
                    )}

                    <p className="font-opensans text-xs font-bold leading-relaxed mb-6 text-gray-800">
                        {displaySession.description}
                    </p>

                    {displaySession.image_url && (
                        <div className="w-full aspect-video rounded-xl overflow-hidden bg-gray-100 mb-6 shadow-inner border border-gray-200">
                            <img src={displaySession.image_url} className="w-full h-full object-cover" alt={displaySession.title} />
                        </div>
                    )}

                    {/* Time Selection List */}
                    {!isNews && (
                        <div className="mb-6">
                            <p className="font-montserrat font-bold text-[10px] mb-2 uppercase text-gray-400">SELECT TIME:</p>
                            <div className="flex flex-col gap-2">
                                {sessions.map((sess) => {
                                    // Removed isThisSessionBooked check since we don't use it anymore
                                    const isSelected = selectedSessionId === sess.id;
                                    const dateObj = new Date(sess.start_time);

                                    return (
                                        <button
                                            key={sess.id}
                                            onClick={() => setSelectedSessionId(sess.id)}
                                            className={`w-full py-3 px-4 rounded-lg border transition-all relative flex items-center justify-center
                                                ${isSelected
                                                    ? 'bg-east-light text-black border-east-light shadow-md scale-[1.01]'
                                                    : 'bg-white text-gray-600 border-gray-300 hover:border-east-light hover:text-black'}
                                            `}
                                        >
                                            <span className="font-black italic uppercase text-xs tracking-wide">
                                                {dateObj.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                                                <span className="mx-1 opacity-50">@</span>
                                                {dateObj.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' }).replace(/^0/, '')}
                                            </span>
                                            {/* ✅ Blue Dot Code Removed Here */}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Confirmation Box */}
                    {isBooked && selectedSessionId && (
                        <div className="mb-2 p-3 border border-green-500/30 rounded-xl bg-green-50 block text-left">
                            <p className="font-montserrat font-bold text-[8px] text-green-600 uppercase mb-0.5">CONFIRMED BOOKING</p>
                            <p className="font-montserrat font-black text-sm text-black uppercase">
                                {new Date(sessions.find(s => s.id === selectedSessionId)?.start_time || '').toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                                {' @ '}
                                {new Date(sessions.find(s => s.id === selectedSessionId)?.start_time || '').toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer Action Bar */}
                {!isNews && (
                    <div className="bg-gray-50 p-4 flex justify-between items-center shrink-0 border-t border-gray-200">
                        <div className="flex gap-4">
                            <button className="text-gray-400 hover:text-black transition-colors"><Send size={20} /></button>
                            <button onClick={() => onShare && onShare(displaySession)} className="text-gray-400 hover:text-black transition-colors"><Share2 size={20} /></button>
                        </div>

                        {isBooked ? (
                            <button
                                onClick={() => {
                                    if (window.confirm("Are you sure you want to cancel?")) handleAction('DELETE');
                                }}
                                disabled={isProcessing}
                                className="text-red-500 text-xs font-black italic uppercase tracking-wider hover:text-red-600 transition-colors disabled:opacity-50"
                            >
                                {isProcessing ? 'CANCELLING...' : 'CANCEL BOOKING'}
                            </button>
                        ) : (
                            <button
                                onClick={() => handleAction('POST')}
                                disabled={isProcessing || !selectedSessionId}
                                className="bg-black text-white text-xs font-black italic px-6 py-3 rounded-full uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? 'REGISTERING...' : 'REGISTER NOW'}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}