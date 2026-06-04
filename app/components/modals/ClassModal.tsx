// app/components/modals/ClassModal.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { X, Share2, Send, CreditCard, AlertCircle, Check, ChevronLeft, Layers, Trash } from 'lucide-react';
import { Session } from '@/app/types/index';
import { supabase } from '@/app/lib/supabase';
import { safeDate, safetoLocaleDateString, formatHK } from '@/app/lib/dateUtils';
import { safeFetch } from '@/app/lib/apiUtils';
import { useToast } from '@/app/components/ui/Toast';
import { getStripePriceId } from '@/app/lib/stripe-config';
import { useTracking } from '@/app/hooks/useTracking';
import { polyfill } from "mobile-drag-drop";

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
    const { track } = useTracking();
    const hasBookedRef = React.useRef(false);

    // Multi-Select State
    const [selectedAttendeeIds, setSelectedAttendeeIds] = useState<string[]>([]);
    // Facility Date Filter State
    const [viewDate, setViewDate] = useState<string | null>(null);

    const [currentRegistrations, setCurrentRegistrations] = useState<number>(0);
    const { addToast } = useToast();
    const [isLoadingCapacity, setIsLoadingCapacity] = useState(false);
    const [showPenaltyWarning, setShowPenaltyWarning] = useState(false);
    const [penaltyData, setPenaltyData] = useState<{ percentage: number; amount: number; message: string }>({ percentage: 0, amount: 0, message: '' });
    const [hasTrainingPlan, setHasTrainingPlan] = useState(false);
    const [planDrills, setPlanDrills] = useState<any[]>([]);

    // NEW: Manual Coach Hierarchy Flow
    const [viewMode, setViewMode] = useState<'COACH_SELECT' | 'SESSION_SELECT' | 'SERVICE_SELECT'>('SESSION_SELECT');
    const [filterInstructor, setFilterInstructor] = useState<string | null>(null);
    const [filterTitle, setFilterTitle] = useState<string | null>(null);

    // Drag and Drop & Capacity details state
    const [sessionAttendees, setSessionAttendees] = useState<any[]>([]);
    const [initialsOnly, setInitialsOnly] = useState<boolean>(false);
    const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
    const [pendingAttendeeIds, setPendingAttendeeIds] = useState<string[]>([]);
    const [parentProfile, setParentProfile] = useState<any>(null);

    // Fetch parent profile for avatar and display
    useEffect(() => {
        if (currentUserId) {
            const fetchParent = async () => {
                const { data } = await supabase
                    .from('profiles')
                    .select('id, first_name, last_name, avatar_url, role')
                    .eq('id', currentUserId)
                    .single();
                if (data) setParentProfile(data);
            };
            fetchParent();
        }
    }, [currentUserId]);

    // Fetch children on mount (with avatar_url)
    useEffect(() => {
        if (currentUserId) {
            const fetchChildren = async () => {
                const { data } = await supabase
                    .from('profiles')
                    .select('id, first_name, last_name, role, avatar_url')
                    .eq('parent_id', currentUserId);
                if (data) setMyChildren(data);
            };
            fetchChildren();
        }
    }, [currentUserId]);

    // Set initial selection
    useEffect(() => {
        if (selectedAttendeeIds.length === 0 && pendingAttendeeIds.length === 0) {
            if (initialAttendeeId) {
                setSelectedAttendeeIds([initialAttendeeId]);
                setPendingAttendeeIds([initialAttendeeId]);
            }
        }
    }, [initialAttendeeId]);

    // Lock Background Scroll & Init Polyfill
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        
        // Initialize mobile drag and drop polyfill
        polyfill({
            dragImageCenterOnTouch: true
        });

        // Optional: prevent default touch action to ensure drag works cleanly on iOS
        const preventTouchScroll = (e: TouchEvent) => {
            if ((e.target as HTMLElement).hasAttribute('draggable')) {
                e.preventDefault();
            }
        };
        window.addEventListener('touchmove', preventTouchScroll, { passive: false });

        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('touchmove', preventTouchScroll);
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
    const uniqueInstructors = new Set(visibleSessions.map(s => normalize(s.instructor || '')));
    const isCoachView = uniqueInstructors.size === 1 && uniqueTitles.size > 1;

    // Dynamic Header Logic
    const isFacility = displaySession.category === 'FACILITY';
    let modalHeaderTitle = displaySession.category === 'CLASS' ? 'CLASS' : (filterTitle || (selectedSession?.title) || displaySession.title);
    if (origin === 'coaches' && coachName && !filterTitle && !isFacility) {
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
    const allSelectedAreBooked = selectedAttendeeIds.length > 0 && selectedAttendeeIds.every((id: string) => getBookedStatus(id));

    const filteredSessions = visibleSessions.filter(s =>
        (!filterInstructor || normalize(s.instructor || '') === normalize(filterInstructor)) &&
        (!filterTitle || s.title === filterTitle)
    );

    // View Mode Effect
    useEffect(() => {
        if (!sessions || sessions.length === 0) return;

        const uniqueInstructorsSet = new Set(
            sessions.filter(s => !!s.instructor).map(s => normalize(s.instructor || ''))
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
                    setFilterInstructor(matchingSession.instructor || null);
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
        setSelectedAttendeeIds((prev: string[]) => {
            if (prev.includes(id)) {
                return prev.filter((x: string) => x !== id);
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

        const attendeesToBook = selectedAttendeeIds.filter((id: string) => !getBookedStatus(id));

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

            track('session_booked', {
                session_type: selectedSession?.category,
                coach_name: selectedSession?.instructor,
                credits_used: attendeesToBook.length * creditCostPerPerson,
                attendees_count: attendeesToBook.length,
            });

            hasBookedRef.current = true;
            setPendingAttendeeIds([]);
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
        track('checkout_started');
        try {
            const priceId = getStripePriceId('TOPUP');
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
                body: JSON.stringify({ 
                    priceId, 
                    userId: currentUserId, 
                    userEmail: email,
                    successUrl: `${window.location.origin}/?success=true`,
                    cancelUrl: `${window.location.origin}/?canceled=true`
                })
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

    const handleCancelClick = () => {
        if (!selectedSessionId || !selectedSession) return;

        // Calculate Refund
        const startTime = new Date(selectedSession.start_time).getTime();
        const now = Date.now();
        const hoursUntilStart = (startTime - now) / (1000 * 60 * 60);

        let percentage = 100;
        let message = "You will receive a full refund.";

        if (hoursUntilStart < 24) {
            percentage = 0;
            message = "This cancellation is within 24 hours of your session. You will NOT receive a refund.";
        } else if (hoursUntilStart < 48) {
            percentage = 50;
            message = "This cancellation is between 24-48 hours before your session. You will receive a 50% refund.";
        }

        // Calculate amount (sum of paid credits for selected attendees)
        const totalPaid = bookedSessions
            .filter(b => b.id === selectedSessionId && selectedAttendeeIds.includes(b.attendee?.id || ''))
            .reduce((sum, b) => sum + (b.credit_cost || 0), 0);

        const refundAmount = Math.floor(totalPaid * (percentage / 100));

        setPenaltyData({ percentage, amount: refundAmount, message });
        setShowPenaltyWarning(true);
    };

    const handleConfirmCancel = async () => {
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

        if (successCount > 0) {
            track('session_cancelled', {
                session_type: selectedSession?.category,
                coach_name: selectedSession?.instructor,
                refund_percentage: penaltyData.percentage,
                refund_amount: penaltyData.amount
            });
        }

        setIsProcessing(false);
        setShowPenaltyWarning(false);
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

    // Fetch capacity, attendees, and training plan for selected session
    useEffect(() => {
        if (selectedSessionId) {
            const fetchCapacityAndAttendees = async () => {
                setIsLoadingCapacity(true);
                try {
                    const res = await fetch(`/api/sessions?sessionId=${selectedSessionId}`);
                    if (res.ok) {
                        const data = await res.json();
                        setSessionAttendees(data);
                        setCurrentRegistrations(data.length);
                    }
                } catch (e) {
                    console.error("Error fetching session capacity/attendees:", e);
                } finally {
                    setIsLoadingCapacity(false);
                }
            };
            fetchCapacityAndAttendees();
            
            // Also check for Training Plan
            const checkPlan = async () => {
                const { data, count } = await supabase
                    .from('session_drills')
                    .select('*, coach_drills(id, title, image_url, category)', { count: 'exact' })
                    .eq('session_id', selectedSessionId)
                    .order('order_index', { ascending: true });
                
                setHasTrainingPlan((count || 0) > 0);
                if (data) setPlanDrills(data);
            };
            checkPlan();
        } else {
            setSessionAttendees([]);
            setCurrentRegistrations(0);
            setHasTrainingPlan(false);
        }
    }, [selectedSessionId]);

    const getFormattedName = (profile: any) => {
        if (!profile) return 'Guest';
        const first = profile.first_name || '';
        const last = profile.last_name || '';
        if (initialsOnly) {
            return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || first.slice(0, 2).toUpperCase();
        }
        return `${first} ${last}`.trim();
    };

    const cancelSingleAttendee = (attendeeId: string) => {
        if (!selectedSessionId || !selectedSession) return;

        // Calculate Refund
        const startTime = new Date(selectedSession.start_time).getTime();
        const now = Date.now();
        const hoursUntilStart = (startTime - now) / (1000 * 60 * 60);

        let percentage = 100;
        let message = "You will receive a full refund.";

        if (hoursUntilStart < 24) {
            percentage = 0;
            message = "This cancellation is within 24 hours of your session. You will NOT receive a refund.";
        } else if (hoursUntilStart < 48) {
            percentage = 50;
            message = "This cancellation is between 24-48 hours before your session. You will receive a 50% refund.";
        }

        // Calculate amount for just this attendee
        const totalPaid = bookedSessions
            .filter(b => b.id === selectedSessionId && b.attendee?.id === attendeeId)
            .reduce((sum, b) => sum + (b.credit_cost || 0), 0);

        const refundAmount = Math.floor(totalPaid * (percentage / 100));

        setPenaltyData({ percentage, amount: refundAmount, message });
        setSelectedAttendeeIds([attendeeId]);
        setShowPenaltyWarning(true);
    };

    const handleDropToBook = (personId: string) => {
        const person = attendeesList.find(p => p.id === personId);
        if (!person) return;
        const isBooked = getBookedStatus(personId);
        if (isBooked) {
            addToast(`${person.name} is already booked!`, 'info');
            return;
        }
        if (pendingAttendeeIds.includes(personId)) return;
        
        const cap = selectedSession?.max_capacity || (selectedSession?.category === 'PRIVATE' ? 1 : 4);
        const totalTakingUpSlots = currentRegistrations + pendingAttendeeIds.length;
        if (cap && totalTakingUpSlots >= cap) {
             addToast('Session is at full capacity', 'warning');
             return;
        }

        setPendingAttendeeIds(prev => [...prev, personId]);
        setSelectedAttendeeIds(prev => Array.from(new Set([...prev, personId])));
    };

    const attendeesList = [
        ...(parentProfile ? [{ id: parentProfile.id, name: 'Myself', first_name: parentProfile.first_name, last_name: parentProfile.last_name, avatar_url: parentProfile.avatar_url }] : []),
        ...myChildren.map((c: any) => ({ id: c.id, name: c.first_name, first_name: c.first_name, last_name: c.last_name, avatar_url: (c as any).avatar_url }))
    ];

    const maxCapacity = selectedSession?.max_capacity || (selectedSession?.category === 'PRIVATE' ? 1 : 4);

    const handleClose = () => {
        if (!hasBookedRef.current && selectedSessionId) {
            track('booking_abandoned', { session_type: selectedSession?.category, coach_name: selectedSession?.instructor });
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn overscroll-y-none">
            <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl relative">

                {/* Header */}
                <div className="bg-gradient-to-r from-east-light to-east-dark p-4 flex justify-between items-center shrink-0">
                    <h2 className="font-montserrat font-black italic text-xl text-white uppercase truncate pr-2">
                        {showTopUp ? 'TOP UP NEEDED' : (showPenaltyWarning ? 'Cancellation Policy' : (origin === 'coaches' && !isFacility ? 'BOOK COACH' : modalHeaderTitle))}
                    </h2>
                    <button onClick={handleClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
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
                ) : showPenaltyWarning ? (
                    /* --- PENALTY WARNING VIEW --- */
                    <div className="p-8 flex flex-col items-center text-center space-y-6">
                        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-2">
                            <AlertCircle className="text-yellow-600" size={32} />
                        </div>
                        <div>
                            <h3 className="font-montserrat font-black italic text-2xl uppercase mb-2 text-yellow-600">
                                {penaltyData.percentage === 0 ? 'NO REFUND' : (penaltyData.percentage === 100 ? 'FULL REFUND' : `${penaltyData.percentage}% REFUND`)}
                            </h3>
                            <p className="font-opensans text-sm font-bold text-gray-800 mb-2">{penaltyData.message}</p>
                            <p className="font-opensans text-xs text-gray-500 font-bold">You will receive {penaltyData.amount} credits.</p>
                        </div>
                        <div className="flex gap-4 w-full">
                            <button onClick={() => setShowPenaltyWarning(false)} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-black italic py-4 rounded-full uppercase tracking-widest transition-all">
                                Nevermind
                            </button>
                            <button onClick={handleConfirmCancel} disabled={isProcessing} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-black italic py-4 rounded-full uppercase tracking-widest transition-all shadow-lg">
                                {isProcessing ? '...' : 'Yes, Cancel Session'}
                            </button>
                        </div>
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

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                                <div 
                                    className="overflow-y-auto p-6 text-black hide-scrollbar"
                                    onDragOver={(e) => {
                                        // Allow dropping anywhere outside the slots to cancel
                                        if (e.dataTransfer.types.includes('cancel/plain')) {
                                            e.preventDefault();
                                        }
                                    }}
                                    onDrop={(e) => {
                                        const cancelId = e.dataTransfer.getData('cancel/plain');
                                        if (cancelId) {
                                            cancelSingleAttendee(cancelId);
                                        }
                                    }}
                                >

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
                                    {origin !== 'coaches' && displaySession.category !== 'FACILITY' && (
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

                                    {/* SLOTS UI (PO DESIGN) */}
                                    {selectedSession && !isNews && (
                                        <div className="flex flex-col gap-3 mb-8 mt-6">
                                            {/* CAPACITY METER */}
                                            <div className="flex flex-col mb-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-montserrat font-bold text-[10px] uppercase text-gray-400 tracking-wider">Session Capacity</span>
                                                    <span className={`font-black text-xs ${currentRegistrations >= maxCapacity ? 'text-red-500' : 'text-[#28D160]'}`}>
                                                        {currentRegistrations} / {maxCapacity} Spots Taken
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full transition-all duration-500 ${currentRegistrations >= maxCapacity ? 'bg-red-500' : 'bg-[#28D160]'}`}
                                                        style={{ width: `${Math.min(100, (currentRegistrations / maxCapacity) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {(() => {
                                                const slots: any[] = [];
                                                for (let i = 0; i < maxCapacity; i++) {
                                                    if (i < currentRegistrations) {
                                                        slots.push({ type: 'booked', data: sessionAttendees[i], index: i });
                                                    } else if (i < currentRegistrations + pendingAttendeeIds.length) {
                                                        const pendingId = pendingAttendeeIds[i - currentRegistrations];
                                                        const person = attendeesList.find(p => p.id === pendingId);
                                                        slots.push({ type: 'pending', person, index: i });
                                                    } else {
                                                        slots.push({ type: 'empty', index: i });
                                                    }
                                                }
                                                
                                                return slots.map((slot) => {
                                                    const idx = slot.index;
                                                    const startStr = formatHK(selectedSession.start_time, 'h:mma').toLowerCase().replace(':00', '');
                                                    const endStr = formatHK(selectedSession.end_time, 'h:mma').toLowerCase().replace(':00', '');
                                                    const timeString = `${startStr}-${endStr}`;

                                                    if (slot.type === 'booked') {
                                                        const reg = slot.data;
                                                        const attendeeProfile = reg ? (Array.isArray(reg.profiles) ? reg.profiles[0] : reg.profiles) : null;
                                                        const isMyBooking = reg ? (reg.user_id === currentUserId || myChildren.some((c: any) => c.id === reg.user_id)) : false;
                                                        if (!attendeeProfile) return null;
                                                        const formattedName = getFormattedName(attendeeProfile);
                                                        const initials = `${attendeeProfile.first_name?.charAt(0) || ''}${attendeeProfile.last_name?.charAt(0) || ''}`.toUpperCase() || 'G';
                                                        return (
                                                            <div 
                                                                key={idx}
                                                                draggable={isMyBooking}
                                                                onDragStart={(e) => {
                                                                    if (isMyBooking) {
                                                                        e.dataTransfer.setData('cancel/plain', reg.user_id);
                                                                        e.dataTransfer.effectAllowed = 'move';
                                                                    }
                                                                }}
                                                                className={`flex items-center justify-between p-4 rounded bg-white border-2 border-dashed group relative touch-none ${isMyBooking ? 'border-[#28D160] cursor-grab active:cursor-grabbing' : 'border-gray-600'}`}
                                                            >
                                                                <span className="text-sm font-medium text-gray-800">{timeString} - {formattedName}</span>
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center border border-gray-300 shrink-0">
                                                                        {attendeeProfile.avatar_url ? (
                                                                            <img src={attendeeProfile.avatar_url} alt={formattedName} className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            <span className="text-xs font-black text-gray-500">{initials}</span>
                                                                        )}
                                                                    </div>
                                                                    {isMyBooking && (
                                                                        <button 
                                                                            onClick={() => cancelSingleAttendee(reg.user_id)}
                                                                            className="absolute right-[-40px] opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all bg-white rounded-full shadow border"
                                                                            title="Cancel Booking"
                                                                        >
                                                                            <Trash size={14} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    } else if (slot.type === 'pending') {
                                                        const person = slot.person;
                                                        if (!person) return null;
                                                        const formattedName = getFormattedName(person);
                                                        const initials = `${person.first_name?.charAt(0) || ''}${person.last_name?.charAt(0) || ''}`.toUpperCase() || 'P';
                                                        return (
                                                            <div 
                                                                key={`pending-${idx}`}
                                                                className="flex items-center justify-between p-4 rounded bg-[#28D160]/10 border-2 border-dashed border-[#28D160] group relative animate-fadeIn"
                                                            >
                                                                <span className="text-sm font-black italic text-[#28D160]">{timeString} - {formattedName} (Pending)</span>
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center border border-[#28D160] shrink-0">
                                                                        {person.avatar_url ? (
                                                                            <img src={person.avatar_url} alt={formattedName} className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            <span className="text-xs font-black text-[#28D160]">{initials}</span>
                                                                        )}
                                                                    </div>
                                                                    <button 
                                                                        onClick={() => {
                                                                            setPendingAttendeeIds(prev => prev.filter(id => id !== person.id));
                                                                            setSelectedAttendeeIds(prev => prev.filter(id => id !== person.id));
                                                                        }}
                                                                        className="absolute right-[-40px] opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all bg-white rounded-full shadow border"
                                                                        title="Remove Pending"
                                                                    >
                                                                        <X size={14} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    } else {
                                                        const isDragOver = dragOverSlot === idx;
                                                        return (
                                                            <div
                                                                key={`empty-${idx}`}
                                                                onDragOver={(e) => {
                                                                    e.preventDefault();
                                                                    setDragOverSlot(idx);
                                                                }}
                                                                onDragLeave={() => setDragOverSlot(null)}
                                                                onDrop={(e) => {
                                                                    e.preventDefault();
                                                                    setDragOverSlot(null);
                                                                    const personId = e.dataTransfer.getData('text/plain');
                                                                    if (personId) {
                                                                        handleDropToBook(personId);
                                                                    }
                                                                }}
                                                                className={`flex items-center justify-between p-4 rounded border-2 border-dashed transition-all ${
                                                                    isDragOver
                                                                        ? 'border-[#28D160] bg-[#28D160]/10 text-[#28D160] scale-[1.02]'
                                                                        : 'border-[#28D160] text-gray-500 hover:border-[#28D160]/70 hover:bg-[#28D160]/5'
                                                                }`}
                                                            >
                                                                <span className="text-sm font-medium">{timeString} - Drop Athlete Here</span>
                                                            </div>
                                                        );
                                                    }
                                                });
                                            })()}
                                        </div>
                                    )}

                                    {/* DRAGGABLE ATHLETES BUBBLES AND TOGGLE */}
                                    {!isNews && (
                                        <div className="flex justify-between items-end mb-6 mt-4">
                                            <div className="flex items-center gap-3">
                                                {/* Parent Avatar */}
                                                <div
                                                    draggable
                                                    onDragStart={(e) => {
                                                        e.dataTransfer.setData('text/plain', currentUserId!);
                                                        e.dataTransfer.effectAllowed = 'copy';
                                                    }}
                                                    className="relative cursor-grab active:cursor-grabbing hover:scale-110 transition-transform touch-none"
                                                    title="Drag or tap to book yourself"
                                                >
                                                    <div className="w-12 h-12 rounded-full border-2 border-black overflow-hidden bg-black flex items-center justify-center">
                                                        {parentProfile?.avatar_url ? (
                                                            <img src={parentProfile.avatar_url} className="w-full h-full object-cover" alt="Me" />
                                                        ) : (
                                                            <span className="text-white font-black">{parentProfile?.first_name?.charAt(0) || 'P'}</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Child Avatars */}
                                                {myChildren.map((child: any) => (
                                                    <div
                                                        key={child.id}
                                                        draggable
                                                        onDragStart={(e) => {
                                                            e.dataTransfer.setData('text/plain', child.id);
                                                            e.dataTransfer.effectAllowed = 'copy';
                                                        }}
                                                        className="relative cursor-grab active:cursor-grabbing hover:scale-110 transition-transform touch-none"
                                                        title={`Drag or tap to book ${child.first_name}`}
                                                    >
                                                        <div className="w-12 h-12 rounded-full border-2 border-black overflow-hidden bg-black flex items-center justify-center">
                                                            {child.avatar_url ? (
                                                                <img src={child.avatar_url} className="w-full h-full object-cover" alt={child.first_name} />
                                                            ) : (
                                                                <span className="text-white font-black">{child.first_name?.charAt(0) || 'C'}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* UI Toggle Switch */}
                                            <div className="flex flex-col gap-2">
                                                <div 
                                                    className={`flex items-center justify-between gap-3 px-3 py-1.5 rounded-md border cursor-pointer transition-colors ${!initialsOnly ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`}
                                                    onClick={() => setInitialsOnly(false)}
                                                >
                                                    <span className={`text-[9px] font-bold tracking-wider ${!initialsOnly ? 'text-white' : 'text-gray-500'}`}>Full Name</span>
                                                    <div className={`w-7 h-4 rounded-full flex items-center px-0.5 transition-colors ${!initialsOnly ? 'bg-[#28D160]' : 'bg-gray-300'}`}>
                                                        <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${!initialsOnly ? 'translate-x-3' : 'translate-x-0'}`} />
                                                    </div>
                                                </div>
                                                <div 
                                                    className={`flex items-center justify-between gap-3 px-3 py-1.5 rounded-md border cursor-pointer transition-colors ${initialsOnly ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`}
                                                    onClick={() => setInitialsOnly(true)}
                                                >
                                                    <span className={`text-[9px] font-bold tracking-wider ${initialsOnly ? 'text-white' : 'text-gray-500'}`}>Initials</span>
                                                    <div className={`w-7 h-4 rounded-full flex items-center px-0.5 transition-colors ${initialsOnly ? 'bg-[#28D160]' : 'bg-gray-300'}`}>
                                                        <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${initialsOnly ? 'translate-x-3' : 'translate-x-0'}`} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {/* MICRO-BRIEFING ROW */}
                                    {hasTrainingPlan && (
                                        <div className="mb-6 animate-fadeIn">
                                            <div className="flex justify-between items-center mb-3">
                                                <p className="font-montserrat font-bold text-[10px] uppercase text-gray-400 tracking-wider">Plan Preview:</p>
                                                <button 
                                                    onClick={() => {
                                                        handleClose();
                                                        window.location.href = `/drill-hub?session_id=${selectedSessionId}`;
                                                    }}
                                                    className="text-[10px] font-black italic text-east-light uppercase tracking-widest hover:brightness-110"
                                                >
                                                    Full View
                                                </button>
                                            </div>
                                            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                                                {planDrills.map((p: any, idx: number) => (
                                                    <button 
                                                        key={p.id}
                                                        onClick={() => {
                                                            handleClose();
                                                            window.location.href = `/drill-hub?session_id=${selectedSessionId}&drill_id=${p.drill_id}`;
                                                        }}
                                                        className="flex-shrink-0 w-16 group relative"
                                                    >
                                                        <div className="w-16 h-16 rounded-2xl overflow-hidden border border-gray-100 group-hover:border-east-light transition-all shadow-sm">
                                                            <img 
                                                                src={p.coach_drills?.image_url || 'https://placehold.co/100'} 
                                                                className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all"
                                                                alt={p.coach_drills?.title}
                                                            />
                                                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                                                            <div className="absolute bottom-1 right-1 bg-black/60 rounded-md px-1 py-0.5">
                                                                <span className="text-[6px] font-black italic text-white italic">{idx + 1}</span>
                                                            </div>
                                                        </div>
                                                        <p className="text-[7px] font-black uppercase text-gray-400 mt-1 truncate group-hover:text-black transition-colors">{p.coach_drills?.title}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Session Times */}
                                    {!isNews && (
                                        <div className="mb-6">
                                            <p className="font-montserrat font-bold text-[10px] mb-2 uppercase text-gray-400">
                                                {displaySession.category === 'FACILITY' ? 'SELECT DATE & TIME:' : (isPrivate ? 'SELECT OPTION:' : 'SELECT SESSION:')}
                                            </p>

                                            {/* FACILITY & PRIVATE: DATE PICKER UI */}
                                            {displaySession.category === 'FACILITY' || displaySession.category === 'PRIVATE' ? (
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
                                                                            const timeStr = formatHK(sess.start_time, 'h:mma').toLowerCase();
                                                                            const regCount = (sess.registrations as any)?.[0]?.count || 0;
                                                                            const cap = sess.max_capacity;
                                                                            const isSessFull = cap ? regCount >= cap : false;
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
                                                                                    {cap && cap > 1 && (
                                                                                        <span className={`block text-[9px] font-bold ${isSessFull ? 'text-red-500 animate-pulse' : 'text-gray-400'}`}>
                                                                                            {isSessFull ? 'FULL' : `${regCount}/${cap}`}
                                                                                        </span>
                                                                                    )}
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
                                                        const regCount = (sess.registrations as any)?.[0]?.count || 0;
                                                        const cap = sess.max_capacity;
                                                        const isSessFull = cap ? regCount >= cap : false;

                                                        return (
                                                            <button key={sess.id} onClick={() => setSelectedSessionId(sess.id)} className={`w-full py-3 px-4 rounded-lg border transition-all relative flex items-center justify-between ${isSelected ? 'bg-east-light text-black border-east-light shadow-md scale-[1.01]' : 'bg-white text-gray-600 border-gray-300 hover:border-east-light hover:text-black'}`}>
                                                                <div className="flex flex-col items-start">
                                                                    {!filterInstructor && uniqueInstructors.size > 1 && (
                                                                        <span className="font-black italic uppercase text-xs text-east-dark mb-0.5">{sess.instructor}</span>
                                                                    )}
                                                                    {isPrivate && isCoachView && <span className="font-black italic uppercase text-xs text-east-dark mb-0.5">{sess.title}</span>}
                                                                    <span className="font-bold uppercase text-xs tracking-wide">
                                                                        {safetoLocaleDateString(dateObj, 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })} <span className="mx-1 opacity-50">@</span> {formatHK(dateObj, 'h:mm a')}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-4">
                                                                    {cap && cap > 1 && (
                                                                        <span className={`text-[10px] font-black uppercase ${isSessFull ? 'text-red-500 animate-pulse' : 'text-gray-400'}`}>
                                                                            {isSessFull ? 'FULL' : `${regCount}/${cap} SPOTS`}
                                                                        </span>
                                                                    )}
                                                                    <span className={`text-xs font-bold ${isSelected ? 'text-black' : (isBooked ? 'text-green-600' : 'text-east-dark')}`}>
                                                                        {isBooked ? `PAID: ${totalPaid}` : `${sessionCost} Credits`}
                                                                    </span>
                                                                </div>
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
                                            <button onClick={handleCancelClick} disabled={isProcessing} className="text-red-500 text-xs font-black italic px-6 py-3 rounded-full uppercase tracking-wider hover:bg-red-600 hover:text-white transition-all disabled:opacity-50">
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