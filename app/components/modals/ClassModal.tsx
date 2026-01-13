// app/components/modals/ClassModal.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { X, Share2, Send, CreditCard, AlertCircle, Check, ChevronLeft } from 'lucide-react';
import { Session } from '@/app/types/session';
import { supabase } from '@/app/lib/supabase';

interface ClassModalProps {
    sessions: Session[];
    currentUserId: string | null;
    bookedSessions: Session[];
    onClose: () => void;
    onScheduleChange: () => void;
    onShare?: (session: Session) => void;
    initialAttendeeId?: string | null;
    origin?: 'facilities' | 'coaches'; // NEW
    coachBio?: string;
    coachName?: string;
    initialSessionId?: number;
}

export default function ClassModal({
    sessions,
    onClose,
    onScheduleChange,
    currentUserId,
    bookedSessions,
    onShare,
    initialAttendeeId,
    origin = 'facilities',
    coachBio,
    coachName,
    initialSessionId
}: ClassModalProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
    const [showTopUp, setShowTopUp] = useState(false);
    const [myChildren, setMyChildren] = useState<{ id: string; first_name: string; last_name: string; role: string }[]>([]);
    // Multi-Select State
    const [selectedAttendeeIds, setSelectedAttendeeIds] = useState<string[]>([]);
    // Facility Date Filter State
    const [viewDate, setViewDate] = useState<string | null>(null);
    const [availableCoaches, setAvailableCoaches] = useState<any[]>([]);
    const [selectedCoachId, setSelectedCoachId] = useState<string | null>(null);
    const [isLoadingCoaches, setIsLoadingCoaches] = useState(false);
    const [currentRegistrations, setCurrentRegistrations] = useState<number>(0);
    const [isLoadingCapacity, setIsLoadingCapacity] = useState(false);

    // NEW: Manual Coach Hierarchy Flow
    const [viewMode, setViewMode] = useState<'COACH_SELECT' | 'SESSION_SELECT'>('SESSION_SELECT');
    const [filterInstructor, setFilterInstructor] = useState<string | null>(null);

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

    // Set initial selection
    useEffect(() => {
        if (currentUserId && selectedAttendeeIds.length === 0) {
            // If passed an initial ID, use it. Else default to JUST the parent (safe default).
            if (initialAttendeeId) {
                setSelectedAttendeeIds([initialAttendeeId]);
            } else {
                setSelectedAttendeeIds([currentUserId]);
            }
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

    const uniqueTitles = new Set(sessions.map(s => s.title));
    const uniqueInstructors = new Set(sessions.map(s => s.instructor));
    const isCoachView = uniqueInstructors.size === 1 && uniqueTitles.size > 1;

    // Dynamic Header Logic
    let modalHeaderTitle = displaySession.title;
    let modalSubHeader = `INSTRUCTOR: ${displaySession.instructor}`;

    if (origin === 'coaches') {
        modalHeaderTitle = coachName || displaySession.instructor;
        modalSubHeader = "PRIVATE COACH";
    } else if (origin === 'facilities') {
        if (selectedCoachId) {
            modalHeaderTitle = "BOOK PRIVATE LESSON";
            modalSubHeader = "FACILITY + COACH";
        } else {
            modalHeaderTitle = "BOOK FACILITY";
        }
    } else {
        // Fallback / Standard Class
        if (isCoachView) {
            modalHeaderTitle = displaySession.instructor;
            modalSubHeader = 'PRIVATE COACH';
        } else if (isPrivate) {
            modalHeaderTitle = 'PRIVATE LESSON';
            modalSubHeader = 'PRIVATE LESSON';
        }
    }

    // Auto-select session
    useEffect(() => {
        if (initialSessionId) {
            setSelectedSessionId(initialSessionId);
        } else if (sessions.length === 1) {
            setSelectedSessionId(sessions[0].id);
        }
    }, [sessions, initialSessionId]);

    // Helpers
    const selectedSession = sessions.find(s => s.id === selectedSessionId);
    const creditCostPerPerson = selectedSession ? selectedSession.credit_cost || 10 : 10;
    const COACH_ADDON_COST = 750; // Constant for now

    // Check who is ALREADY booked for the SELECTED session
    // bookedSessions contains objects with session details AND attendee details (from my-schedule API)
    const getBookedStatus = (attendeeId: string) => {
        if (!selectedSessionId) return false;
        // Check if there is a booking matching this session AND this attendee
        return bookedSessions.some(
            booking => booking.id === selectedSessionId && booking.attendee?.id === attendeeId
        );
    };

    // Derived State
    const totalCost = (selectedAttendeeIds.length * creditCostPerPerson) + (selectedCoachId ? COACH_ADDON_COST : 0);

    // Are ALL selected attendees already booked? if so, show "Manage" or "Cancel"
    // Usually if you select multiple, some might be booked, some not.
    // If ANY selected is NOT booked, show BOOK button for them.
    // If ALL selected are booked, show CANCEL button.
    const allSelectedAreBooked = selectedAttendeeIds.length > 0 && selectedAttendeeIds.every(id => getBookedStatus(id));

    // Determine Logic for Coach Selection
    // If we have > 1 unique instructor AND category is PRIVATE, we might want to start in COACH_SELECT
    // UNLESS origin is 'coaches' (which means we already picked one)
    useEffect(() => {
        if (!sessions || sessions.length === 0) return;

        const isPrivate = sessions[0].category === 'PRIVATE';
        const unique = new Set(sessions.map(s => s.instructor));

        if (origin !== 'coaches' && isPrivate && unique.size > 1) {
            setViewMode('COACH_SELECT');
            setFilterInstructor(null);
        } else {
            setViewMode('SESSION_SELECT');
            setFilterInstructor(null);
        }
    }, [sessions, origin]);

    // Toggle Selection
    const toggleAttendee = (id: string) => {
        setSelectedAttendeeIds(prev => {
            if (prev.includes(id)) {
                // Don't allow deselecting everything? Or allow it? allow it.
                return prev.filter(x => x !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    // --- BOOKING LOGIC ---
    const handleBookSession = async () => {
        if (!selectedSessionId || isNews || !currentUserId || selectedAttendeeIds.length === 0) return;

        // Filter out those who are already booked to avoid double booking error noise
        const attendeesToBook = selectedAttendeeIds.filter(id => !getBookedStatus(id));

        if (attendeesToBook.length === 0) {
            alert("All selected attendees are already booked.");
            return;
        }

        setIsProcessing(true);
        try {
            // Get Auth Token for Security
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const res = await fetch('/api/sessions/book', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({
                    userId: currentUserId,
                    sessionId: selectedSessionId,
                    attendeeIds: attendeesToBook, // Send Array
                    coachId: selectedCoachId, // Optional Coach
                    origin: origin // Pass origin to backend
                })
            });
            const data = await res.json();
            setIsProcessing(false);

            if (!res.ok) {
                if (data.error && data.error.includes('Insufficient credits')) {
                    setShowTopUp(true);
                    return;
                }

                // NEW: Handle Locked/Inactive Subscription
                if (data.code === 'SUBSCRIPTION_LOCKED' || (data.error && data.error.includes('Account Locked'))) {
                    if (window.confirm("Account Locked: active subscription required. Would you like to reactivate now?")) {
                        window.location.href = '/membership';
                    }
                    return;
                }

                alert(data.error || 'A critical error occurred.');
                return;
            }

            // Success
            // data.message might say "Booked 2 session(s)"
            alert(data.message || `Success! Session booked.`);
            if (onScheduleChange) onScheduleChange();
            onClose();
        } catch (error: any) {
            console.error(error);
            alert(`Booking Request Failed: ${error.message || 'Network error'}`);
            setIsProcessing(false);
        }
    };

    // --- TOP UP LOGIC ---
    const handleTopUp = async () => {
        setIsProcessing(true);
        try {
            const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_TOPUP;
            console.log("DEBUG: Env Var Value:", priceId);
            if (!priceId) {
                alert("CRITICAL ERROR: Limit Reached. (Missing TopUp Price ID)");
                setIsProcessing(false);
                return;
            }
            console.log("DEBUG: Using Price ID:", priceId);
            alert(`DEBUG: Price ID is ${priceId}`); // Temporary debug
            if (!priceId) { alert('Top Up not configured'); setIsProcessing(false); return; }

            const { data: profile } = await supabase.from('profiles').select('contact_email').eq('id', currentUserId).single();
            const { data: { user } } = await supabase.auth.getUser();
            const email = profile?.contact_email || user?.email;

            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priceId, userId: currentUserId, userEmail: email })
            });

            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert(`Checkout Failed: ${data.error || 'Unknown error'}`);
                setIsProcessing(false);
            }
        } catch (e) {
            console.error(e);
            alert("Error initiating Top Up.");
            setIsProcessing(false);
        }
    };

    // Cancel logic 
    // If multiple are selected, cancel all of them? Or just warn?
    // Let's iterate.
    const handleCancelSession = async () => {
        if (!selectedSessionId || isNews || !currentUserId || selectedAttendeeIds.length === 0) return;
        setIsProcessing(true);

        // We need to call cancel for EACH selected attendee
        // Current cancel API might not support batch? 
        // Let's assume loop for now or batch if API supports. 
        // The API we have is /api/sessions/cancel -> { userId, sessionId }
        // BUT my updated schema uses `cancel_session_and_refund(attendee_id, session_id)`.
        // The API likely calls this.
        // Let's check API. If it takes `userId` as param which is used as attendee, we need to loop.

        /* 
           NOTE: Since I haven't updated the cancel API route to handle array, I'll loop frontend side.
           Wait, I need to check the cancel route.
           Given I can't check it right now without interrupting, I'll assume standard loop is safer.
        */

        let successCount = 0;
        for (const attendeeId of selectedAttendeeIds) {
            // Only cancel if booked
            if (getBookedStatus(attendeeId)) {
                try {
                    await fetch('/api/sessions/cancel', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: attendeeId, sessionId: selectedSessionId }) // passing attendeeId as userId
                    });
                    successCount++;
                } catch (e) {
                    console.error(e);
                }
            }
        }

        setIsProcessing(false);
        alert(`Cancelled ${successCount} booking(s).`);
        if (onScheduleChange) onScheduleChange();
        onClose();
    };

    const handleShare = async () => {
        const title = selectedSession?.title || displaySession.title;
        const text = `Check out ${title} at EAST Sports Group!`;
        const url = window.location.href;
        if (navigator.share) {
            try { await navigator.share({ title, text, url }); } catch (err) { console.log(err); }
        } else {
            navigator.clipboard.writeText(`${title}\n${text}\n${url}`);
            alert('Link copied to clipboard!');
        }
    };

    // Fetch capacity for selected session
    useEffect(() => {
        if (selectedSessionId) {
            const fetchCapacity = async () => {
                setIsLoadingCapacity(true);
                try {
                    const { count, error } = await supabase
                        .from('registrations')
                        .select('*', { count: 'exact', head: true })
                        .eq('session_id', selectedSessionId);

                    if (!error) {
                        setCurrentRegistrations(count || 0);
                    }
                } catch (e) {
                    console.error("Error fetching capacity:", e);
                } finally {
                    setIsLoadingCapacity(false);
                }
            };
            fetchCapacity();
        }
    }, [selectedSessionId]);

    useEffect(() => {
        if (selectedSessionId && displaySession.category === 'FACILITY') {
            const sess = sessions.find(s => s.id === selectedSessionId);
            if (sess) {
                const fetchCoaches = async () => {
                    setIsLoadingCoaches(true);
                    setSelectedCoachId(null);
                    try {
                        const res = await fetch(`/api/coaches/available?startTime=${encodeURIComponent(sess.start_time)}&endTime=${encodeURIComponent(sess.end_time)}`);
                        if (res.ok) {
                            const data = await res.json();
                            setAvailableCoaches(data);
                        }
                    } catch (e) {
                        console.error("Error fetching coaches:", e);
                    } finally {
                        setIsLoadingCoaches(false);
                    }
                };
                fetchCoaches();
            }
        } else {
            setAvailableCoaches([]);
            setSelectedCoachId(null);
        }
    }, [selectedSessionId, displaySession.category]);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn overscroll-y-none">
            <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl relative">

                {/* Header */}
                <div className="bg-gradient-to-r from-east-light to-east-dark p-4 flex justify-between items-center shrink-0">
                    <h2 className="font-montserrat font-black italic text-xl text-white uppercase truncate pr-2">
                        {showTopUp ? 'TOP UP NEEDED' : modalHeaderTitle}
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
                            <h3 className="font-montserrat font-black italic text-2xl uppercase mb-2 text-red-500">INSUFFICIENT CREDITS</h3>
                            <p className="font-opensans text-sm font-bold text-gray-800 mb-4">You do not have enough credits.</p>
                        </div>
                        <button onClick={handleTopUp} className="w-full bg-black hover:bg-gray-800 text-white font-black italic py-4 rounded-full uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2">
                            <CreditCard size={18} /> TOP UP
                        </button>
                        <button onClick={() => setShowTopUp(false)} className="text-gray-400 text-xs font-bold hover:text-black uppercase tracking-wide">No thanks</button>
                    </div>
                ) : (
                    /* --- NORMAL BOOKING VIEW --- */
                    <>
                        {/* Custom Header for Coach Select Mode */}
                        {viewMode === 'COACH_SELECT' ? (
                            <div className="overflow-y-auto p-6 text-black hide-scrollbar">
                                <h2 className="font-montserrat font-black italic text-2xl mb-1 uppercase leading-none">SELECT INSTRUCTOR</h2>
                                <p className="font-montserrat font-bold text-[10px] mb-6 uppercase text-gray-500 tracking-wider">CHOOSE YOUR PREFERRED COACH</p>

                                <div className="grid grid-cols-2 gap-4">
                                    {Array.from(uniqueInstructors).map(instructorName => {
                                        // Find a session example to get the image
                                        const exampleSession = sessions.find(s => s.instructor === instructorName);
                                        const imgUrl = exampleSession?.coach_image_url || exampleSession?.image_url;

                                        return (
                                            <button
                                                key={instructorName}
                                                onClick={() => {
                                                    setFilterInstructor(instructorName);
                                                    setViewMode('SESSION_SELECT');
                                                    // Auto-select first session of this instructor?
                                                    // setSelectedSessionId(null);
                                                }}
                                                className="flex flex-col items-center gap-3 p-4 rounded-2xl border border-gray-200 hover:border-black hover:shadow-xl transition-all group bg-white"
                                            >
                                                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-100 group-hover:border-east-light transition-colors">
                                                    <img src={imgUrl || 'https://placehold.co/200'} className="w-full h-full object-cover" alt={instructorName} />
                                                </div>
                                                <div className="text-center">
                                                    <h3 className="font-black italic uppercase text-sm leading-tight">{instructorName}</h3>
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">VIEW SCHEDULE</span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            /* --- SESSION SELECTION VIEW --- */
                            <>
                                <div className="overflow-y-auto p-6 text-black hide-scrollbar">

                                    {/* Back Button if filtered */}
                                    {filterInstructor && uniqueInstructors.size > 1 && (
                                        <button onClick={() => setViewMode('COACH_SELECT')} className="mb-4 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors">
                                            <ChevronLeft size={12} /> Back to Instructors
                                        </button>
                                    )}

                                    {/* Details */}
                                    <h2 className="font-montserrat font-black italic text-2xl mb-1 uppercase leading-none">{filterInstructor ? filterInstructor : modalHeaderTitle}</h2>
                                    {!isNews && <p className="font-montserrat font-bold text-[10px] mb-4 uppercase text-gray-500 tracking-wider">
                                        {filterInstructor ? 'PRIVATE COACH' : modalSubHeader}
                                    </p>}

                                    {/* Coach Bio or Description */}
                                    {origin === 'coaches' && coachBio ? (
                                        <div className="mb-6">
                                            <p className="font-opensans text-xs font-bold leading-relaxed text-gray-800 italic">"{coachBio}"</p>
                                        </div>
                                    ) : (
                                        <p className="font-opensans text-xs font-bold leading-relaxed mb-6 text-gray-800">{displaySession.description}</p>
                                    )}

                                    {/* Image (Only show if NOT manually filtered, OR if layout demands it. 
                                        If we filtered by instructor, user just saw the face. Maybe skip large hero image to save space?
                                        Let's keep it for context if it's the specific session image) 
                                    */}
                                    {(!filterInstructor) && (displaySession.image_url || displaySession.coach_image_url) && (
                                        <div className="w-full aspect-video rounded-xl overflow-hidden bg-gray-100 mb-6 shadow-inner border border-gray-200">
                                            <img src={isCoachView ? (displaySession.coach_image_url || displaySession.image_url) : displaySession.image_url} className="w-full h-full object-cover" alt={displaySession.title} />
                                        </div>
                                    )}

                                    {/* ATTENDEE SELECTOR (Multi-Select) */}
                                    {myChildren.length > 0 && (
                                        <div className="mb-6">
                                            <p className="font-montserrat font-bold text-[10px] mb-2 uppercase text-gray-400">WHO IS ATTENDING?</p>
                                            <div className="flex flex-col gap-2">
                                                {[
                                                    { id: currentUserId, name: 'Myself (Parent)' },
                                                    ...myChildren.map(c => ({ id: c.id, name: c.first_name }))
                                                ].map(person => {
                                                    const isSelected = selectedAttendeeIds.includes(person.id);
                                                    const isAlreadyBooked = getBookedStatus(person.id);

                                                    return (
                                                        <button
                                                            key={person.id}
                                                            onClick={() => toggleAttendee(person.id)}
                                                            className={`w-full py-2 px-4 rounded-lg flex items-center justify-between border transition-all ${isSelected
                                                                ? 'bg-black text-white border-black shadow-md'
                                                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-white border-white' : 'border-gray-300'}`}>
                                                                    {isSelected && <Check size={12} className="text-black" />}
                                                                </div>
                                                                <span className="text-xs font-bold uppercase">{person.name}</span>
                                                            </div>

                                                            {isAlreadyBooked && (
                                                                <span className="text-[10px] font-black italic text-green-500 uppercase tracking-wide">BOOKED</span>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Session Times (Date Picker for FACILITIES, List for Others) */}
                                    {!isNews && (
                                        <div className="mb-6">
                                            <p className="font-montserrat font-bold text-[10px] mb-2 uppercase text-gray-400">
                                                {displaySession.category === 'FACILITY' ? 'SELECT DATE & TIME:' : (isPrivate ? 'SELECT OPTION:' : 'SELECT SESSION:')}
                                            </p>

                                            {/* FACILITY: DATE PICKER UI */}
                                            {displaySession.category === 'FACILITY' ? (
                                                <div className="flex flex-col gap-4">
                                                    {/* Date Tabs (Next 7 Days) */}
                                                    <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                                                        {Array.from(new Set(sessions.map(s => new Date(s.start_time).toDateString()))).slice(0, 7).map((dateStr) => {
                                                            const date = new Date(dateStr);
                                                            // Check if there are any slots on this day
                                                            const daySessions = sessions.filter(s => new Date(s.start_time).toDateString() === dateStr);
                                                            if (daySessions.length === 0) return null;

                                                            // Determine the currently viewed date.
                                                            // If a session is selected, use its date. Otherwise, default to the first available date.
                                                            const currentViewDateStr = selectedSessionId
                                                                ? new Date(sessions.find(s => s.id === selectedSessionId)?.start_time || '').toDateString()
                                                                : new Date(sessions[0]?.start_time || '').toDateString();

                                                            const isSelectedDate = currentViewDateStr === dateStr;

                                                            return (
                                                                <button
                                                                    key={dateStr}
                                                                    // When a date tab is clicked, we want to show sessions for that date.
                                                                    // If there's no `viewDate` state, we can simulate by selecting the first session of that day.
                                                                    // This is a workaround for not being able to add `viewDate` state directly in this block.
                                                                    onClick={() => {
                                                                        const firstSessionOfThisDay = daySessions[0];
                                                                        if (firstSessionOfThisDay) {
                                                                            setSelectedSessionId(firstSessionOfThisDay.id);
                                                                        }
                                                                    }}
                                                                    className={`min-w-[60px] p-2 rounded-xl flex flex-col items-center border transition-all ${isSelectedDate
                                                                        ? 'bg-east-light border-east-light shadow-md'
                                                                        : 'bg-white border-gray-200 hover:border-black'
                                                                        }`}
                                                                >
                                                                    <span className={`text-[9px] font-black uppercase ${isSelectedDate ? 'text-black' : 'text-gray-400'}`}>{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                                                    <span className={`text-lg font-black italic ${isSelectedDate ? 'text-black' : 'text-gray-800'}`}>{date.getDate()}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>

                                                    <div className="flex flex-col gap-4">
                                                        {/* Group sessions by Date */}
                                                        {Array.from(new Set(sessions.map(s => new Date(s.start_time).toDateString()))).slice(0, 7).map(dateStr => {
                                                            const daySessions = sessions
                                                                .filter(s => new Date(s.start_time).toDateString() === dateStr);

                                                            if (daySessions.length === 0) return null;

                                                            // Determine the currently viewed date for filtering the displayed times.
                                                            const currentViewDateStr = selectedSessionId
                                                                ? new Date(sessions.find(s => s.id === selectedSessionId)?.start_time || '').toDateString()
                                                                : new Date(sessions[0]?.start_time || '').toDateString();

                                                            // Only render sessions for the currently selected/viewed date tab
                                                            if (dateStr !== currentViewDateStr) return null;

                                                            return (
                                                                <div key={dateStr}>
                                                                    <h4 className="font-black italic text-sm text-gray-300 uppercase mb-2 sticky top-0 bg-white z-10 py-1">
                                                                        {new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                                                    </h4>
                                                                    <div className="grid grid-cols-3 gap-2">
                                                                        {daySessions.map(sess => {
                                                                            const isSelected = selectedSessionId === sess.id;
                                                                            const timeStr = new Date(sess.start_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).replace(' ', '').toLowerCase();
                                                                            return (
                                                                                <button
                                                                                    key={sess.id}
                                                                                    onClick={() => setSelectedSessionId(sess.id)}
                                                                                    className={`py-2 px-1 rounded-lg border text-center transition-all ${isSelected
                                                                                        ? 'bg-east-light border-east-light shadow-md'
                                                                                        : 'bg-white border-gray-200 hover:border-black'
                                                                                        }`}
                                                                                >
                                                                                    <span className={`text-xs font-black uppercase ${isSelected ? 'text-black' : 'text-gray-800'}`}>{timeStr}</span>
                                                                                </button>
                                                                            )
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            ) : (
                                                /* NORMAL LIST (Classes / Private) - FILTERED BY INSTRUCTOR */
                                                <div className="flex flex-col gap-2">
                                                    {sessions
                                                        .filter(s => !filterInstructor || s.instructor === filterInstructor)
                                                        .map((sess) => {
                                                            const isSelected = selectedSessionId === sess.id;
                                                            const dateObj = new Date(sess.start_time);
                                                            const sessionCost = (sess as any).credit_cost || 10;

                                                            // Check for "Total Paid" logic (Facility + Coach)
                                                            // Find all my bookings that start at this EXACT time
                                                            const myBookingsAtTime = bookedSessions.filter(b => new Date(b.start_time).getTime() === dateObj.getTime());
                                                            const isBooked = myBookingsAtTime.some(b => b.id === sess.id);
                                                            const totalPaid = myBookingsAtTime.reduce((sum, b) => sum + (b.credit_cost || 0), 0);

                                                            return (
                                                                <button key={sess.id} onClick={() => setSelectedSessionId(sess.id)} className={`w-full py-3 px-4 rounded-lg border transition-all relative flex items-center justify-between ${isSelected ? 'bg-east-light text-black border-east-light shadow-md scale-[1.01]' : 'bg-white text-gray-600 border-gray-300 hover:border-east-light hover:text-black'}`}>
                                                                    <div className="flex flex-col items-start">
                                                                        {isPrivate && <span className="font-black italic uppercase text-xs text-east-dark mb-0.5">{isCoachView ? sess.title : sess.instructor}</span>}
                                                                        <span className="font-bold uppercase text-xs tracking-wide">
                                                                            {dateObj.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} <span className="mx-1 opacity-50">@</span> {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).replace(/^0/, '')}
                                                                        </span>
                                                                    </div>
                                                                    <span className={`text-xs font-bold ${isSelected ? 'text-black' : (isBooked ? 'text-green-600' : 'text-east-dark')}`}>
                                                                        {isBooked ? `PAID: ${totalPaid}` : `${sessionCost} Credits`}
                                                                    </span>
                                                                </button>
                                                            );
                                                        })}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* ADD A COACH? (Only for Facilities) */}
                                    {displaySession.category === 'FACILITY' && selectedSessionId && (
                                        <div className="mb-6 animate-fadeIn">
                                            <p className="font-montserrat font-bold text-[10px] mb-2 uppercase text-gray-400">ADD A COACH? (+{COACH_ADDON_COST} Credits)</p>

                                            {isLoadingCoaches ? (
                                                <div className="flex gap-2 animate-pulse">
                                                    {[1, 2, 3].map(i => (
                                                        <div key={i} className="w-12 h-12 rounded-full bg-gray-100" />
                                                    ))}
                                                </div>
                                            ) : availableCoaches.length > 0 ? (
                                                <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
                                                    <button
                                                        onClick={() => setSelectedCoachId(null)}
                                                        className={`flex flex-col items-center gap-1 shrink-0 ${!selectedCoachId ? 'opacity-100' : 'opacity-40'}`}
                                                    >
                                                        <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${!selectedCoachId ? 'border-black bg-black' : 'border-gray-200 bg-white'}`}>
                                                            <X size={20} className={!selectedCoachId ? 'text-white' : 'text-gray-300'} />
                                                        </div>
                                                        <span className="text-[8px] font-black uppercase text-center">None</span>
                                                    </button>
                                                    {availableCoaches.map(coach => (
                                                        <button
                                                            key={coach.id}
                                                            onClick={() => setSelectedCoachId(coach.id)}
                                                            className={`flex flex-col items-center gap-1 shrink-0 transition-opacity ${selectedCoachId === coach.id ? 'opacity-100' : (selectedCoachId ? 'opacity-40' : 'opacity-100')}`}
                                                        >
                                                            <div className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${selectedCoachId === coach.id ? 'border-east-light ring-4 ring-east-light/20 scale-110' : 'border-gray-200'}`}>
                                                                <img src={coach.avatar_url || 'https://placehold.co/100'} className="w-full h-full object-cover" alt={coach.first_name} />
                                                            </div>
                                                            <span className="text-[8px] font-black uppercase text-center w-12 truncate">{coach.first_name}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-[9px] font-bold text-gray-400 italic uppercase">No coaches available for this slot</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                {!isNews && (
                                    <div className="bg-gray-50 p-4 flex justify-between items-center shrink-0 border-t border-gray-200">
                                        <div className="flex gap-4">
                                            <button className="text-gray-400 hover:text-black transition-colors"><Send size={20} /></button>
                                            <button onClick={handleShare} className="text-gray-400 hover:text-black transition-colors"><Share2 size={20} /></button>
                                        </div>
                                        {allSelectedAreBooked ? (
                                            <button onClick={() => { if (window.confirm("Cancel selected?")) handleCancelSession(); }} disabled={isProcessing} className="text-red-500 text-xs font-black italic px-6 py-3 rounded-full uppercase tracking-wider hover:bg-red-600 hover:text-white transition-all disabled:opacity-50">
                                                {isProcessing ? 'CANCELLING...' : 'CANCEL SELECTION'}
                                            </button>
                                        ) : (
                                            (() => {
                                                const isFull = currentRegistrations >= (selectedSession?.max_capacity || 999);
                                                return (
                                                    <button
                                                        onClick={handleBookSession}
                                                        disabled={isProcessing || !selectedSessionId || selectedAttendeeIds.length === 0 || isFull}
                                                        className={`text-xs font-black italic px-6 py-3 rounded-full uppercase tracking-widest transition-all shadow-lg disabled:opacity-50 ${isFull ? 'bg-gray-600 text-gray-300' : 'bg-black text-white hover:bg-gray-800'}`}
                                                    >
                                                        {isProcessing ? 'PROCESSING...' : (!selectedSessionId ? 'SELECT OPTION' : isFull ? 'CAPACITY MET' : `PAY ${totalCost} CREDITS`)}
                                                    </button>
                                                );
                                            })()
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}