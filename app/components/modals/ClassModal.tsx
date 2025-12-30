// app/components/modals/ClassModal.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { X, Share2, Send, CreditCard, AlertCircle } from 'lucide-react';
import { Session } from '@/app/types/session';
import { supabase } from '@/app/lib/supabase';

interface ClassModalProps {
    sessions: Session[];
    currentUserId: string | null;
    bookedSessionIds: number[];
    onClose: () => void;
    onScheduleChange: () => void;
    onShare?: (session: Session) => void;
    initialAttendeeId?: string | null;
}

export default function ClassModal({
    sessions,
    onClose,
    onScheduleChange,
    currentUserId,
    bookedSessionIds,
    onShare,
    initialAttendeeId
}: ClassModalProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
    const [showTopUp, setShowTopUp] = useState(false); // <--- Controls the Demo Screen
    const [myChildren, setMyChildren] = useState<any[]>([]);
    const [selectedAttendeeId, setSelectedAttendeeId] = useState<string | null>(null);

    // Fetch children on mount
    useEffect(() => {
        if (currentUserId) {
            const fetchChildren = async () => {
                const { data } = await supabase
                    .from('profiles')
                    .select('id, first_name, last_name, role')
                    .eq('parent_id', currentUserId);
                if (data) setMyChildren(data);
            };
            fetchChildren();
        }
    }, [currentUserId]);

    // Set initial attendee to current user (ME) when modal opens or children load
    useEffect(() => {
        if (currentUserId && !selectedAttendeeId) {
            setSelectedAttendeeId(initialAttendeeId || currentUserId);
        }
    }, [currentUserId, initialAttendeeId]);

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
    const isPrivate = displaySession.category === 'PRIVATE';

    // Context Logic
    const uniqueTitles = new Set(sessions.map(s => s.title));
    const uniqueInstructors = new Set(sessions.map(s => s.instructor));
    const isCoachView = uniqueInstructors.size === 1 && uniqueTitles.size > 1;

    const modalHeaderTitle = isCoachView ? displaySession.instructor : displaySession.title;
    const modalSubHeader = isCoachView ? 'PRIVATE COACH' : (isPrivate ? 'PRIVATE LESSON' : `INSTRUCTOR: ${displaySession.instructor}`);

    // Auto-select
    useEffect(() => {
        if (sessions.length === 1) {
            setSelectedSessionId(sessions[0].id);
        }
    }, [sessions]);

    const isBooked = selectedSessionId ? bookedSessionIds.includes(selectedSessionId) : false;
    const selectedSession = sessions.find(s => s.id === selectedSessionId);
    const creditCost = selectedSession ? (selectedSession as any).credit_cost || 10 : 10;

    // --- BOOKING LOGIC ---
    const handleBookSession = async () => {
        if (!selectedSessionId || isNews || !currentUserId) return;
        setIsProcessing(true);
        try {
            const res = await fetch('/api/sessions/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: currentUserId,
                    sessionId: selectedSessionId,
                    attendeeId: selectedAttendeeId // <--- Added attendeeId
                })
            });
            const data = await res.json();
            setIsProcessing(false);

            // ERROR HANDLING (Logic to trigger Top Up)
            if (!res.ok) {
                // Check if the error message from API contains "Insufficient credits"
                if (data.error && data.error.includes('Insufficient credits')) {
                    setShowTopUp(true); // <--- TRIGGER DEMO SCREEN
                    return;
                }
                alert(data.error || 'A critical error occurred.');
                return;
            }

            // Success
            alert(`Success! Session booked.`);
            if (onScheduleChange) onScheduleChange();
            onClose();
        } catch (error) {
            console.error(error);
            setIsProcessing(false);
            alert('Error connecting to the booking service.');
        }
    };

    // --- DEMO TOP UP FUNCTION ---
    // --- REAL TOP UP FUNCTION ---
    const handleTopUp = async () => {
        setIsProcessing(true);
        try {
            const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_TOPUP || 'price_1SfcDS12ap1SCxToMWo5Lz3m';
            if (!priceId) {
                alert('Top Up not configured');
                setIsProcessing(false);
                return;
            }

            // Fetch user email
            const { data: profile } = await supabase.from('profiles').select('contact_email').eq('id', currentUserId).single();
            // We don't have the auth user object here easily without another call, but profile email is best.
            // If profile fetch fails, we can't pre-fill email easily without auth call, but let's try auth call too if needed.
            // Actually, let's just do a quick auth check to be safe and get email.
            const { data: { user } } = await supabase.auth.getUser();
            const email = profile?.contact_email || user?.email;

            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    priceId,
                    userId: currentUserId,
                    userEmail: email
                })
            });

            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert("Failed to initiate checkout.");
                setIsProcessing(false);
            }
        } catch (e) {
            console.error(e);
            alert("Error initiating Top Up.");
            setIsProcessing(false);
        }
    };

    const handleCancelSession = async () => {
        if (!selectedSessionId || isNews || !currentUserId) return;
        setIsProcessing(true);
        try {
            const res = await fetch('/api/sessions/cancel', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUserId, sessionId: selectedSessionId })
            });
            const data = await res.json();
            setIsProcessing(false);
            if (!res.ok) {
                alert(data.error || 'A critical error occurred.');
                return;
            }
            alert(data.message || `Success! Booking cancelled.`);
            if (onScheduleChange) onScheduleChange();
            onClose();
        } catch (error) {
            console.error(error);
            setIsProcessing(false);
            alert('Error connecting to the cancellation service.');
        }
    };

    const handleShare = async () => {
        const title = selectedSession?.title || displaySession.title;
        const text = `Check out ${title} at EAST Sports Group!`;
        const url = window.location.href;

        if (navigator.share) {
            try {
                await navigator.share({ title, text, url });
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            navigator.clipboard.writeText(`${title}\n${text}\n${url}`);
            alert('Link copied to clipboard!');
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn overscroll-y-none">
            <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl relative">

                {/* Header */}
                <div className="bg-gradient-to-r from-east-light to-east-dark p-4 flex justify-between items-center shrink-0">
                    <h2 className="font-montserrat font-black italic text-xl text-white uppercase truncate pr-2">
                        {showTopUp ? 'TOP UP NEEDED' : (isBooked ? 'MY BOOKING' : modalHeaderTitle)}
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                        <X className="text-white" size={24} />
                    </button>
                </div>

                {/* --- TOP UP DEMO VIEW --- */}
                {showTopUp ? (
                    <div className="p-8 flex flex-col items-center text-center space-y-6">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-2">
                            <AlertCircle className="text-red-500" size={32} />
                        </div>
                        <div>
                            <h3 className="font-montserrat font-black italic text-2xl uppercase mb-2 text-red-500">
                                INSUFFICIENT CREDITS
                            </h3>
                            <p className="font-opensans text-sm font-bold text-gray-800 mb-4">
                                You do not have enough credits to book this session.
                            </p>
                            <p className="font-opensans text-sm text-gray-600">
                                Would you like to purchase more?
                            </p>
                        </div>

                        <button
                            onClick={handleTopUp}
                            className="w-full bg-black hover:bg-gray-800 text-white font-black italic py-4 rounded-full uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                            <CreditCard size={18} />
                            TOP UP
                        </button>

                        <button
                            onClick={() => setShowTopUp(false)}
                            className="text-gray-400 text-xs font-bold hover:text-black uppercase tracking-wide"
                        >
                            No thanks
                        </button>
                    </div>
                ) : (
                    /* --- NORMAL BOOKING VIEW --- */
                    <>
                        <div className="overflow-y-auto p-6 text-black">
                            <h2 className="font-montserrat font-black italic text-2xl mb-1 uppercase leading-none">
                                {modalHeaderTitle}
                            </h2>

                            {!isNews && (
                                <p className="font-montserrat font-bold text-[10px] mb-4 uppercase text-gray-500 tracking-wider">
                                    {modalSubHeader}
                                </p>
                            )}

                            <p className="font-opensans text-xs font-bold leading-relaxed mb-6 text-gray-800">
                                {displaySession.description}
                            </p>

                            {(displaySession.image_url || displaySession.coach_image_url) && (
                                <div className="w-full aspect-video rounded-xl overflow-hidden bg-gray-100 mb-6 shadow-inner border border-gray-200">
                                    <img
                                        src={isCoachView ? (displaySession.coach_image_url || displaySession.image_url) : displaySession.image_url}
                                        className="w-full h-full object-cover"
                                        alt={displaySession.title}
                                    />
                                </div>
                            )}

                            {/* ATTENDEE SELECTOR (If User has Children) */}
                            {myChildren.length > 0 && !isBooked && (
                                <div className="mb-6">
                                    <p className="font-montserrat font-bold text-[10px] mb-2 uppercase text-gray-400">
                                        WHO IS THIS FOR?
                                    </p>
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        {/* ME Option */}
                                        <button
                                            onClick={() => setSelectedAttendeeId(currentUserId)}
                                            className={`px-4 py-2 rounded-full text-xs font-black uppercase whitespace-nowrap border transition-all ${selectedAttendeeId === currentUserId
                                                ? 'bg-black text-white border-black'
                                                : 'bg-white text-gray-500 border-gray-200'
                                                }`}
                                        >
                                            MYSELF
                                        </button>

                                        {/* Children Options */}
                                        {myChildren.map(child => (
                                            <button
                                                key={child.id}
                                                onClick={() => setSelectedAttendeeId(child.id)}
                                                className={`px-4 py-2 rounded-full text-xs font-black uppercase whitespace-nowrap border transition-all ${selectedAttendeeId === child.id
                                                    ? 'bg-east-light text-black border-east-light'
                                                    : 'bg-white text-gray-500 border-gray-200'
                                                    }`}
                                            >
                                                {child.first_name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Time Selection List */}
                            {!isNews && (
                                <div className="mb-6">
                                    <p className="font-montserrat font-bold text-[10px] mb-2 uppercase text-gray-400">
                                        {isPrivate ? 'SELECT OPTION:' : 'SELECT SESSION:'}
                                    </p>
                                    <div className="flex flex-col gap-2">
                                        {sessions.map((sess) => {
                                            const isSelected = selectedSessionId === sess.id;
                                            const dateObj = new Date(sess.start_time);
                                            const sessionCost = (sess as any).credit_cost || 10;

                                            return (
                                                <button
                                                    key={sess.id}
                                                    onClick={() => setSelectedSessionId(sess.id)}
                                                    className={`w-full py-3 px-4 rounded-lg border transition-all relative flex items-center justify-between
                                                    ${isSelected
                                                            ? 'bg-east-light text-black border-east-light shadow-md scale-[1.01]'
                                                            : 'bg-white text-gray-600 border-gray-300 hover:border-east-light hover:text-black'}
                                                `}
                                                >
                                                    <div className="flex flex-col items-start">
                                                        {isPrivate && (
                                                            <span className="font-black italic uppercase text-xs text-east-dark mb-0.5">
                                                                {isCoachView ? sess.title : sess.instructor}
                                                            </span>
                                                        )}
                                                        <span className="font-bold uppercase text-xs tracking-wide">
                                                            {dateObj.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                                                            <span className="mx-1 opacity-50">@</span>
                                                            {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).replace(/^0/, '')}
                                                        </span>
                                                    </div>
                                                    <span className={`text-xs font-bold ${isSelected ? 'text-black' : 'text-east-dark'}`}>
                                                        {sessionCost} Credits
                                                    </span>
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
                                    <div className="font-montserrat font-black text-sm text-black uppercase">
                                        {isPrivate && (
                                            <span className="block text-xs">
                                                {sessions.find(s => s.id === selectedSessionId)?.title} with {sessions.find(s => s.id === selectedSessionId)?.instructor}
                                            </span>
                                        )}
                                        <span>
                                            {new Date(sessions.find(s => s.id === selectedSessionId)?.start_time || '').toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                                            {' @ '}
                                            {new Date(sessions.find(s => s.id === selectedSessionId)?.start_time || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Action Bar */}
                        {!isNews && (
                            <div className="bg-gray-50 p-4 flex justify-between items-center shrink-0 border-t border-gray-200">
                                <div className="flex gap-4">
                                    <button className="text-gray-400 hover:text-black transition-colors"><Send size={20} /></button>
                                    <button onClick={handleShare} className="text-gray-400 hover:text-black transition-colors"><Share2 size={20} /></button>
                                </div>
                                {isBooked ? (
                                    <button
                                        onClick={() => { if (window.confirm("Cancel?")) handleCancelSession(); }}
                                        disabled={isProcessing}
                                        className="text-red-500 text-xs font-black italic px-6 py-3 rounded-full uppercase tracking-wider hover:bg-red-600 transition-all disabled:opacity-50"
                                    >
                                        {isProcessing ? 'CANCELLING...' : 'CANCEL BOOKING'}
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleBookSession}
                                        disabled={isProcessing || !selectedSessionId}
                                        className="bg-black text-white text-xs font-black italic px-6 py-3 rounded-full uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg disabled:opacity-50"
                                    >
                                        {isProcessing ? 'REGISTERING...' : `PAY ${creditCost} CREDITS`}
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}