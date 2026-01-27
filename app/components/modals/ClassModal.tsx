// app/components/modals/ClassModal.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { X, Share2, Send, CreditCard, AlertCircle, Check, ChevronLeft } from 'lucide-react';
import { Session } from '@/app/types/session';
import { supabase } from '@/app/lib/supabase';
import { safeDate, safetoLocaleDateString } from '@/app/lib/dateUtils';
import { safeFetch } from '@/app/lib/apiUtils';
import { useToast } from '@/app/components/ui/Toast';

interface ClassModalProps {
    sessions: Session[];
    currentUserId: string | null;
    bookedSessions: Session[];
    onClose: () => void;
    onScheduleChange: () => void;
    onShare?: (session: Session) => void;
    initialAttendeeId?: string | null;
    origin?: 'facilities' | 'coaches';
    coachBio?: string;
    coachName?: string;
    initialSessionId?: number;
    serviceDescription?: string | null;
    serviceId?: string | null;
    subscriptionStatus?: string;
    accountStatus?: string;
    role?: string;
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
    initialSessionId,
    serviceDescription,
    serviceId,
    subscriptionStatus,
    accountStatus,
    role
}: ClassModalProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
    const [showTopUp, setShowTopUp] = useState(false);
    const [myChildren, setMyChildren] = useState<{ id: string; first_name: string; last_name: string; role: string }[]>([]);

    // Multi-Select State
    const [selectedAttendeeIds, setSelectedAttendeeIds] = useState<string[]>([]);
    // Facility Date Filter State
    const [viewDate, setViewDate] = useState<string | null>(null);

    const [currentRegistrations, setCurrentRegistrations] = useState<number>(0);
    const { addToast } = useToast();
    const [isLoadingCapacity, setIsLoadingCapacity] = useState(false);

    // NEW: Manual Coach Hierarchy Flow
    const [viewMode, setViewMode] = useState<'COACH_SELECT' | 'SESSION_SELECT' | 'SERVICE_SELECT'>('SESSION_SELECT');
    const [filterInstructor, setFilterInstructor] = useState<string | null>(null);
    const [filterTitle, setFilterTitle] = useState<string | null>(null);

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

    // Normalize Instructor Names
    const normalize = (name: string) => name?.replace(/\s+/g, ' ').trim().toLowerCase() || '';

    // Helpers
    const selectedSession = sessions.find(s => s.id === selectedSessionId);
    const creditCostPerPerson = selectedSession ? selectedSession.credit_cost || 10 : 10;

    const [allowedCoaches, setAllowedCoaches] = useState<string[] | null>(null);

    // Fetch allowed coaches for strict filtering
    useEffect(() => {
        async function fetchAllowedCoaches() {
            if (!serviceId) {
                setAllowedCoaches(null);
                return;
            }
            // 1. Get coach IDs assigned to this service
            const { data: assignments } = await supabase
                .from('coach_services')
                .select('coach_id')
                .eq('session_type_id', serviceId);

            if (!assignments || assignments.length === 0) {
                setAllowedCoaches([]);
                return;
            }

            const coachIds = assignments.map(a => a.coach_id);

            // 2. Get coach NAMES from profiles
            const { data: profiles } = await supabase
                .from('profiles')
                .select('first_name, last_name')
                .in('id', coachIds);

            if (profiles) {
                const names = profiles.map(p => {
                    const full = `${p.first_name || ''} ${p.last_name || ''}`;
                    return normalize(full);
                });
                setAllowedCoaches(names);
            }
        }
        fetchAllowedCoaches();
    }, [serviceId]);

    // Filter sessions by allowed coaches first
    const visibleSessions = sessions.filter(s => {
        if (!allowedCoaches) return true;
        if (!s.instructor) return false;
        return allowedCoaches.includes(normalize(s.instructor));
    });

    const uniqueTitles = new Set(visibleSessions.map(s => s.title));
    const uniqueInstructors = new Set(visibleSessions.map(s => normalize(s.instructor)));
    const isCoachView = uniqueInstructors.size === 1 && uniqueTitles.size > 1;

    // Dynamic Header Logic
    let modalHeaderTitle = filterTitle || (selectedSession?.title) || displaySession.title;
    if (origin === 'coaches' && coachName && !filterTitle) {
        modalHeaderTitle = coachName;
    }
    if (showTopUp) {
        modalHeaderTitle = "TOP UP NEEDED";
    }

    // Auto-select session
    useEffect(() => {
        if (initialSessionId) {
            setSelectedSessionId(initialSessionId);
        } else if (visibleSessions.length === 1) {
            setSelectedSessionId(visibleSessions[0].id);
        }
    }, [visibleSessions, initialSessionId]);

    // Check who is ALREADY booked
    const getBookedStatus = (attendeeId: string) => {
        if (!selectedSessionId) return false;
        return bookedSessions.some(
            booking => booking.id === selectedSessionId && booking.attendee?.id === attendeeId
        );
    };

    // Derived State
    const totalCost = (selectedAttendeeIds.length * creditCostPerPerson);
    const allSelectedAreBooked = selectedAttendeeIds.length > 0 && selectedAttendeeIds.every(id => getBookedStatus(id));

    const filteredSessions = visibleSessions.filter(s =>
        (!filterInstructor || normalize(s.instructor) === normalize(filterInstructor)) &&
        (!filterTitle || s.title === filterTitle)
    );

    // View Mode Effect
    useEffect(() => {
        if (!sessions || sessions.length === 0) return;
        const normalize = (name: string) => name?.replace(/\s+/g, ' ').trim() || '';

        const uniqueInstructorsSet = new Set(
            sessions.filter(s => !!s.instructor).map(s => normalize(s.instructor))
        );

        if (initialSessionId) {
            setViewMode('SESSION_SELECT');
            return;
        }

        if (origin === 'coaches') {
            setViewMode('SERVICE_SELECT');
            setFilterTitle(null);

            // Try to auto-select the instructor that matches the coachName
            if (coachName) {
                const normTarget = normalize(coachName);
                const matchingSession = sessions.find(s => s.instructor && normalize(s.instructor).includes(normTarget));
                if (matchingSession) {
                    setFilterInstructor(matchingSession.instructor);
                } else {
                    setFilterInstructor(null);
                }
            } else {
                setFilterInstructor(null);
            }
        } else if (uniqueInstructorsSet.size > 1 && displaySession.category !== 'FACILITY') {
            setViewMode('COACH_SELECT');
            setFilterInstructor(null);
            setFilterTitle(null);
        } else {
            setViewMode('SESSION_SELECT');
            setFilterInstructor(null);
            setFilterTitle(null);
        }
    }, [sessions, origin, initialSessionId]);

    // Auto-select session when filtered or single
    useEffect(() => {
        if (filteredSessions.length === 1) {
            setSelectedSessionId(filteredSessions[0].id);
        }
    }, [filteredSessions]);

    // Toggle Selection
    const toggleAttendee = (id: string) => {
        setSelectedAttendeeIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(x => x !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    // --- BOOKING LOGIC ---
    const handleBookSession = async () => {
        if (!selectedSessionId || isNews || !currentUserId || selectedAttendeeIds.length === 0) return;

        const isSubscriber = subscriptionStatus === 'active' || subscriptionStatus === 'trialing';
        const isManuallyActive = accountStatus === 'active';
        const isUnlocked = isSubscriber || isManuallyActive;
        const needsLockCheck = role === 'player' || role === 'parent' || !role;
        const isLocked = needsLockCheck && !isUnlocked;

        if (isLocked) {
            addToast("Account Locked: active subscription required to book.", "error");
            return;
        }

        const attendeesToBook = selectedAttendeeIds.filter(id => !getBookedStatus(id));

        if (attendeesToBook.length === 0) {
            addToast("All selected attendees are already booked.", "warning");
            return;
        }

        setIsProcessing(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const res = await safeFetch('/api/sessions/book', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({
                    userId: currentUserId,
                    sessionId: selectedSessionId,
                    attendeeIds: attendeesToBook,
                    coachId: null,
                    origin: origin
                })
            });

            setIsProcessing(false);

            if (!res.success) {
                const errorMsg = res.error || 'Unknown error';
                if (errorMsg.includes('Insufficient credits')) {
                    setShowTopUp(true);
                    return;
                }
                if (errorMsg.includes('Account Locked')) {
                    addToast("Account Locked: active subscription required.", "error");
                    return;
                }
                addToast(errorMsg, 'error');
                return;
            }

            addToast(res.data.message || `Success! Session booked.`, 'success');
            if (onScheduleChange) onScheduleChange();
            onClose();
        } catch (error: any) {
            console.error(error);
            addToast(`Booking Request Failed: ${error.message || 'Network error'}`, 'error');
            setIsProcessing(false);
        }
    };

    // --- TOP UP LOGIC ---
    const handleTopUp = async () => {
        setIsProcessing(true);
        try {
            const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_TOPUP;
            if (!priceId) {
                addToast("Top Up not configured", "error");
                setIsProcessing(false);
                return;
            }

            const { data: profile } = await supabase.from('profiles').select('contact_email').eq('id', currentUserId).single();
            const { data: { user } } = await supabase.auth.getUser();
            const email = profile?.contact_email || user?.email;

            const res = await safeFetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priceId, userId: currentUserId, userEmail: email })
            });

            if (res.success && res.data.url) {
                window.location.replace(res.data.url);
            } else {
                addToast(`Checkout Failed: ${res.error || 'Unknown error'}`, 'error');
                setIsProcessing(false);
            }
        } catch (e) {
            console.error(e);
            addToast("Error initiating Top Up.", 'error');
            setIsProcessing(false);
        }
    };

    // Cancel logic
    const handleCancelSession = async () => {
        if (!selectedSessionId || isNews || !currentUserId || selectedAttendeeIds.length === 0) return;
        setIsProcessing(true);

        let successCount = 0;
        for (const attendeeId of selectedAttendeeIds) {
            if (getBookedStatus(attendeeId)) {
                try {
                    const res = await safeFetch('/api/sessions/cancel', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: attendeeId, sessionId: selectedSessionId })
                    });

                    if (res.success && res.data.success) {
                        successCount++;
                    } else {
                        addToast(`Failed to cancel: ${res.error || res.data?.message}`, "error");
                    }
                } catch (e) {
                    console.error(e);
                    addToast(`Network error cancelling session.`, "error");
                }
            }
        }

        setIsProcessing(false);
        addToast(`Cancelled ${successCount} booking(s).`, "success");
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
            addToast('Link copied to clipboard!', "success");
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

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn overscroll-y-none">
            <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl relative">

                {/* Header */}
                <div className="bg-gradient-to-r from-east-light to-east-dark p-4 flex justify-between items-center shrink-0">
                    <h2 className="font-montserrat font-black italic text-xl text-white uppercase truncate pr-2">
                        {showTopUp ? 'TOP UP NEEDED' : (origin === 'coaches' ? 'BOOK COACH' : modalHeaderTitle)}
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
                                <h2 className="font-montserrat font-black italic text-2xl mb-1 uppercase leading-none">{modalHeaderTitle}</h2>
                                <p className="font-opensans text-[10px] font-bold text-gray-800 mb-6 leading-relaxed opacity-70">
                                    {serviceDescription || displaySession.description}
                                </p>

                                <div className="border-t border-gray-100 pt-6">
                                    <h3 className="font-montserrat font-black italic text-sm mb-4 uppercase text-gray-400 tracking-tight">SELECT INSTRUCTOR:</h3>

                                    <div className="grid grid-cols-3 gap-3">
                                        {Array.from(uniqueInstructors).filter(i => !!i).map(instructorName => {
                                            const exampleSession = sessions.find(s => s.instructor === instructorName);
                                            const imgUrl = exampleSession?.coach_image_url || exampleSession?.image_url;

                                            return (
                                                <button
                                                    key={instructorName}
                                                    onClick={() => {
                                                        setFilterInstructor(instructorName);
                                                        setViewMode('SESSION_SELECT');
                                                    }}
                                                    className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 hover:border-black hover:shadow-lg transition-all group bg-white"
                                                >
                                                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-100 group-hover:border-east-light transition-colors">
                                                        <img src={imgUrl || 'https://placehold.co/100'} className="w-full h-full object-cover" alt={instructorName} />
                                                    </div>
                                                    <div className="text-center overflow-hidden w-full">
                                                        <h3 className="font-black italic uppercase text-[8px] leading-tight truncate px-1">{instructorName}</h3>
                                                        <span className="text-[6px] font-bold text-gray-400 uppercase tracking-wider">CHOOSE</span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ) : viewMode === 'SERVICE_SELECT' ? (
                            <div className="overflow-y-auto p-6 text-black hide-scrollbar">
                                <h2 className="font-montserrat font-black italic text-2xl mb-1 uppercase leading-none">{coachName || "Coach"}</h2>
                                <p className="font-opensans text-xs font-bold leading-relaxed mb-6 text-gray-800 italic">
                                    {coachBio ? `"${coachBio}"` : "Choose a service to see availability."}
                                </p>

                                <div className="border-t border-gray-100 pt-6">
                                    <h3 className="font-montserrat font-black italic text-sm mb-4 uppercase text-gray-400 tracking-tight">SELECT SERVICE:</h3>

                                    <div className="grid grid-cols-3 gap-3">
                                        {Array.from(uniqueTitles).map(title => {
                                            const exampleSession = sessions.find(s => s.title === title);
                                            const imgUrl = exampleSession?.image_url;

                                            return (
                                                <button
                                                    key={title}
                                                    onClick={() => {
                                                        setFilterTitle(title);
                                                        setViewMode('SESSION_SELECT');
                                                    }}
                                                    className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 hover:border-black hover:shadow-lg transition-all group bg-white"
                                                >
                                                    <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-gray-100 group-hover:border-east-light transition-colors">
                                                        <img src={imgUrl || 'https://placehold.co/100'} className="w-full h-full object-cover" alt={title} />
                                                    </div>
                                                    <div className="text-center overflow-hidden w-full">
                                                        <h3 className="font-black italic uppercase text-[8px] leading-tight truncate px-1">{title}</h3>
                                                        <span className="text-[6px] font-bold text-gray-400 uppercase tracking-wider">SELECT</span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
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
                                    {filterTitle && uniqueTitles.size > 1 && origin === 'coaches' && (
                                        <button onClick={() => setViewMode('SERVICE_SELECT')} className="mb-4 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors">
                                            <ChevronLeft size={12} /> Back to Services
                                        </button>
                                    )}

                                    {/* Details */}
                                    <h2 className="font-montserrat font-black italic text-2xl mb-1 uppercase leading-none">{modalHeaderTitle}</h2>
                                    {origin !== 'coaches' && (
                                        <p className="font-montserrat font-bold text-[10px] mb-4 uppercase text-gray-500 tracking-wider">
                                            INSTRUCTOR: {selectedSession?.instructor || filterInstructor || 'VARIOUS'}
                                        </p>
                                    )}

                                    {/* Coach Bio */}
                                    {origin === 'coaches' && coachBio ? (
                                        <div className="mb-6">
                                            <p className="font-opensans text-xs font-bold leading-relaxed text-gray-800 italic">"{coachBio}"</p>
                                        </div>
                                    ) : (
                                        <p className="font-opensans text-xs font-bold leading-relaxed mb-6 text-gray-800">
                                            {serviceDescription || displaySession.description}
                                        </p>
                                    )}

                                    {/* Image */}
                                    {(!filterInstructor || filterTitle) && (displaySession.image_url || displaySession.coach_image_url) && (
                                        <div className="w-full aspect-video rounded-xl overflow-hidden bg-gray-100 mb-6 shadow-inner border border-gray-200">
                                            <img
                                                src={isCoachView ? (displaySession.coach_image_url || displaySession.image_url) : (filteredSessions[0]?.image_url || displaySession.image_url)}
                                                className="w-full h-full object-cover"
                                                alt={modalHeaderTitle}
                                            />
                                        </div>
                                    )}

                                    {/* ATTENDEE SELECTOR */}
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

                                    {/* Session Times */}
                                    {!isNews && (
                                        <div className="mb-6">
                                            <p className="font-montserrat font-bold text-[10px] mb-2 uppercase text-gray-400">
                                                {displaySession.category === 'FACILITY' ? 'SELECT DATE & TIME:' : (isPrivate ? 'SELECT OPTION:' : 'SELECT SESSION:')}
                                            </p>

                                            {/* FACILITY: DATE PICKER UI */}
                                            {displaySession.category === 'FACILITY' ? (
                                                <div className="flex flex-col gap-4">
                                                    {/* Date Tabs */}
                                                    <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                                                        {Array.from(new Set(filteredSessions.map(s => {
                                                            const d = safeDate(s.start_time);
                                                            return d ? d.toISOString().split('T')[0] : '';
                                                        }).filter(d => !!d))).slice(0, 7).map((dateISO) => {
                                                            const dateObj = safeDate(`${dateISO}T00:00:00`);
                                                            if (!dateObj) return null;
                                                            const daySessions = filteredSessions.filter(s => {
                                                                const d = safeDate(s.start_time);
                                                                return d && d.toISOString().split('T')[0] === dateISO;
                                                            });
                                                            if (daySessions.length === 0) return null;
                                                            const currentSession = sessions.find(s => s.id === selectedSessionId);
                                                            const currentD = currentSession ? safeDate(currentSession.start_time) : safeDate(filteredSessions[0]?.start_time);
                                                            const currentViewISO = currentD ? currentD.toISOString().split('T')[0] : '';
                                                            const isSelectedDate = currentViewISO === dateISO;

                                                            return (
                                                                <button
                                                                    key={dateISO}
                                                                    onClick={() => {
                                                                        const firstSessionOfThisDay = daySessions[0];
                                                                        if (firstSessionOfThisDay) setSelectedSessionId(firstSessionOfThisDay.id);
                                                                    }}
                                                                    className={`min-w-[60px] p-2 rounded-xl flex flex-col items-center border transition-all ${isSelectedDate
                                                                        ? 'bg-east-light border-east-light shadow-md'
                                                                        : 'bg-white border-gray-200 hover:border-black'
                                                                        }`}
                                                                >
                                                                    <span className={`text-[9px] font-black uppercase ${isSelectedDate ? 'text-black' : 'text-gray-400'}`}>{safetoLocaleDateString(dateObj, 'en-US', { weekday: 'short' })}</span>
                                                                    <span className={`text-lg font-black italic ${isSelectedDate ? 'text-black' : 'text-gray-800'}`}>{dateObj.getDate()}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>

                                                    <div className="flex flex-col gap-4">
                                                        {Array.from(new Set(filteredSessions.map(s => {
                                                            const d = safeDate(s.start_time);
                                                            return d ? d.toISOString().split('T')[0] : '';
                                                        }).filter(d => !!d))).slice(0, 7).map(dateISO => {
                                                            const daySessions = filteredSessions.filter(s => {
                                                                const d = safeDate(s.start_time);
                                                                return d && d.toISOString().split('T')[0] === dateISO;
                                                            });
                                                            if (daySessions.length === 0) return null;
                                                            const currentSession = sessions.find(s => s.id === selectedSessionId);
                                                            const currentD = currentSession ? safeDate(currentSession.start_time) : safeDate(filteredSessions[0]?.start_time);
                                                            const currentViewISO = currentD ? currentD.toISOString().split('T')[0] : '';
                                                            if (dateISO !== currentViewISO) return null;
                                                            const displayDateObj = safeDate(`${dateISO}T00:00:00`);

                                                            return (
                                                                <div key={dateISO}>
                                                                    <h4 className="font-black italic text-sm text-gray-300 uppercase mb-2 sticky top-0 bg-white z-10 py-1">
                                                                        {safetoLocaleDateString(displayDateObj, 'en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                                                    </h4>
                                                                    <div className="grid grid-cols-3 gap-2">
                                                                        {daySessions.map(sess => {
                                                                            const isSelected = selectedSessionId === sess.id;
                                                                            const d = safeDate(sess.start_time);
                                                                            if (!d) return null;
                                                                            const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).replace(' ', '').toLowerCase();
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
                                                /* NORMAL LIST (Classes / Private) */
                                                <div className="flex flex-col gap-2">
                                                    {filteredSessions.map((sess) => {
                                                        const isSelected = selectedSessionId === sess.id;
                                                        const dateObj = safeDate(sess.start_time);
                                                        if (!dateObj) return null;
                                                        const sessionCost = (sess as any).credit_cost || 10;
                                                        const myBookingsAtTime = bookedSessions.filter(b => {
                                                            const bd = safeDate(b.start_time);
                                                            return bd && bd.getTime() === dateObj.getTime();
                                                        });
                                                        const isBooked = myBookingsAtTime.some(b => b.id === sess.id);
                                                        const totalPaid = myBookingsAtTime.reduce((sum, b) => sum + (b.credit_cost || 0), 0);

                                                        return (
                                                            <button key={sess.id} onClick={() => setSelectedSessionId(sess.id)} className={`w-full py-3 px-4 rounded-lg border transition-all relative flex items-center justify-between ${isSelected ? 'bg-east-light text-black border-east-light shadow-md scale-[1.01]' : 'bg-white text-gray-600 border-gray-300 hover:border-east-light hover:text-black'}`}>
                                                                <div className="flex flex-col items-start">
                                                                    {!filterInstructor && uniqueInstructors.size > 1 && (
                                                                        <span className="font-black italic uppercase text-xs text-east-dark mb-0.5">{sess.instructor}</span>
                                                                    )}
                                                                    {isPrivate && isCoachView && <span className="font-black italic uppercase text-xs text-east-dark mb-0.5">{sess.title}</span>}
                                                                    <span className="font-bold uppercase text-xs tracking-wide">
                                                                        {safetoLocaleDateString(dateObj, 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })} <span className="mx-1 opacity-50">@</span> {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).replace(/^0/, '')}
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
        </div >
    );
}