'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { fetchSessions } from '@/app/services/dataFetcher';
import { Session } from '@/app/types';
import { Plus } from 'lucide-react';
import { useToast } from '../ui/Toast';
import Link from 'next/link';
import AppHeader from '../AppHeader';
import Skeleton from '../ui/Skeleton';
import { safeDate, safetoLocaleDateString } from '@/app/lib/dateUtils'; // NEW

const SectionHeader = ({ title, className = "" }: { title: string, className?: string }) => (
  <h2 className={`font-montserrat font-black italic text-2xl uppercase text-white mb-4 tracking-tight ${className}`}>
    {title}
  </h2>
);

interface ServiceType {
  id: string;
  title: string;
  category: 'CLASS' | 'PRIVATE' | 'FACILITY';
  image_url: string | null;
  description: string | null;
}

interface HomeScreenProps {
  onClassClick: (
    sessions: Session[],
    description?: string | null,
    origin?: 'facilities' | 'coaches',
    coachName?: string | null,
    coachBio?: string | null,
    initialSessionId?: number | null,
    attendeeId?: string | null,
    serviceId?: string | null // NEW
  ) => void;
  onOpenSettings: () => void;
  bookedSessions: Session[];
  credits: number;
  subscriptionStatus?: string;
  accountStatus?: string;
  role?: string; // NEW
  setTab: (tab: any) => void;
}

export default function HomeScreen({
  onClassClick,
  onOpenSettings,
  bookedSessions,
  credits,
  subscriptionStatus, // NEW
  accountStatus,
  role,
  setTab
}: HomeScreenProps) {
  const { addToast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [allServices, setAllServices] = useState<ServiceType[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  // No longer using CoachSelectionModal

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch sessions (for booking availability)
        const sessionsData = await fetchSessions();
        if (Array.isArray(sessionsData)) {
          const filtered = sessionsData.filter(s => s.instructor !== 'Coach User');
          setSessions(filtered);
        }

        const { supabase } = await import('@/app/lib/supabase');

        // Fetch Services
        const { data: servicesData } = await supabase
          .from('session_types')
          .select('id, title, category, image_url, description')
          .order('title');
        if (servicesData) setAllServices(servicesData as ServiceType[]);

        // Fetch coaches
        const { data: coachesData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url, bio')
          .eq('role', 'coach')
          .order('first_name', { ascending: true });

        if (coachesData) setCoaches(coachesData);

      } catch (error) {
        console.error('Error fetching data:', error);
      }
      setLoading(false);
    };

    const fetchAnnouncements = async () => {
      try {
        const response = await fetch('/api/announcements', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          setAnnouncements(data);
        }
      } catch (error) {
        console.error('Error fetching announcements:', error);
      }
    };

    loadData();
    fetchAnnouncements();
  }, []);

  const isGroupBooked = (title: string, category: string) => {
    // Logic: Is any future session with this title booked?
    // Simplified: Check if any booked session matches this title
    return bookedSessions.some(b => b.title === title);
  };


  // Facilities, Events, News still use session data for now (unless we migrate them too)
  const facilitiesRaw = sessions.filter(s => s.category === 'FACILITY');
  const eventsRaw = sessions.filter(s => s.category === 'EVENT');

  // Helper for uniques
  const getUniqueItems = (items: Session[], key: 'title') => {
    const seen = new Set();
    return items.filter(item => {
      const val = item[key];
      if (seen.has(val)) return false;
      seen.add(val);
      return true;
    });
  };

  const facilitiesUnique = getUniqueItems(facilitiesRaw, 'title');
  const eventsUnique = getUniqueItems(eventsRaw, 'title');

  // Sort news by priority (desc) then date (desc)
  const newsRaw = sessions
    .filter(s => s.category === 'NEWS')
    .sort((a: any, b: any) => {
      const pA = a.priority || 0;
      const pB = b.priority || 0;
      if (pA !== pB) return pB - pA;
      const dateA = safeDate(a.start_time);
      const dateB = safeDate(b.start_time);
      return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
    });

  // --- News and Events Normalization ---

  // Combine news sessions with news announcements
  const combinedNews = [
    ...newsRaw,
    ...announcements
      .filter(a => a.type === 'news')
      .map(a => ({
        id: a.id,
        title: a.title,
        description: a.content,
        image_url: a.image_url || 'https://images.unsplash.com/photo-1504462385-748101e7cabb?w=800', // Default news image
        category: 'NEWS',
        start_time: a.created_at
      }))
  ].sort((a, b) => {
    const dateA = safeDate(a.start_time);
    const dateB = safeDate(b.start_time);
    return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
  });

  // Combine event sessions with event announcements
  const combinedEvents = [
    ...eventsUnique,
    ...announcements
      .filter(a => a.type === 'event')
      .map(a => ({
        id: a.id,
        title: a.title,
        description: a.content,
        image_url: a.image_url || 'https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?w=800', // Default event image
        category: 'EVENT',
        start_time: a.event_date || a.created_at
      }))
  ].sort((a, b) => {
    const dateA = safeDate(a.start_time);
    const dateB = safeDate(b.start_time);
    return (dateA?.getTime() || 0) - (dateB?.getTime() || 0);
  });

  // Derive Service Lists
  const serviceClasses = allServices.filter(s => s.category === 'CLASS');
  const servicePrivate = allServices.filter(s => s.category === 'PRIVATE');
  const serviceFacilities = allServices.filter(s => s.category === 'FACILITY');

  // Check for "Orphan" Admin Sessions (Private sessions with no matching Service ID)
  // These are often manually created via Admin Panel with title but no Service Type.
  // const orphanSessions = sessions.filter(s =>
  //   s.category === 'PRIVATE' &&
  //   !s.session_type_id
  // );

  // if (orphanSessions.length > 0) {
  //   // Check if we already have a generic "Private Coaching" tile
  //   const hasGeneric = servicePrivate.some(s => s.title === 'Private Coaching');
  //   if (!hasGeneric) {
  //     servicePrivate.push({
  //       id: 'orphan_private_generic',
  //       title: 'Private Coaching',
  //       category: 'PRIVATE',
  //       image_url: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400',
  //       description: 'One-on-one sessions with our expert coaches.'
  //     });
  //   }
  // }

  const handleServiceClick = async (service: ServiceType) => {
    if (service.category === 'FACILITY') {
      const matching = sessions.filter(s =>
        s.category === 'FACILITY' && s.session_type_id === service.id
      );

      if (matching.length === 0) {
        addToast(`No upcoming slots for ${service.title} yet.`, 'info');
      } else {
        matching.sort((a, b) => {
          const dateA = safeDate(a.start_time);
          const dateB = safeDate(b.start_time);
          return (dateA?.getTime() || 0) - (dateB?.getTime() || 0);
        });
        onClassClick(matching, service.description);
      }

    } else if (service.category === 'CLASS') {
      // Show upcoming sessions for this class type
      // We filter the already fetched 'sessions' by title matching the service title
      // NOTE: Ideally we should match by ID, but legacy sessions table doesn't have session_type_id yet.
      // Using Title matching for v1 transition.
      const matching = sessions.filter(s =>
        s.category === 'CLASS' &&
        (s.session_type_id === service.id || s.title.toLowerCase().trim() === service.title.toLowerCase().trim())
      );

      if (matching.length === 0) {
        addToast(`No upcoming sessions scheduled for ${service.title} yet.`, 'info');
      } else {
        matching.sort((a, b) => {
          const dateA = safeDate(a.start_time);
          const dateB = safeDate(b.start_time);
          return (dateA?.getTime() || 0) - (dateB?.getTime() || 0);
        });
        onClassClick(matching, service.description);
      }

    } else if (service.category === 'PRIVATE') {
      const matching = sessions.filter(s =>
        s.category === 'PRIVATE' &&
        (
          // 1. Direct ID match
          s.session_type_id === service.id ||
          // 2. Title Match
          s.title.toLowerCase().trim() === service.title.toLowerCase().trim() ||
          // 3. Fallback: If this is the "Generic" tile (id='orphan_private_generic'), catch ALL orphans
          (service.id === 'orphan_private_generic' && !s.session_type_id)
        )
      );

      if (matching.length === 0) {
        addToast(`No upcoming private slots for ${service.title} yet.`, 'info');
      } else {
        matching.sort((a, b) => {
          const dateA = safeDate(a.start_time);
          const dateB = safeDate(b.start_time);
          return (dateA?.getTime() || 0) - (dateB?.getTime() || 0);
        });
        onClassClick(matching, service.description);
      }
    }
  };

  // handleCoachSelect is no longer needed

  const handleItemClick = (item: any, groupByKey: 'title' | 'instructor') => {
    // If it's an announcement-based item (UUID string vs specific session ID)
    // we just open the detail modal directly for that item.
    if (typeof item.id === 'string' || item.category === 'NEWS') {
      onClassClick([item as Session], item.description, 'facilities', null, null, null, null, item.session_type_id);
      return;
    }

    const allSlots = sessions.filter(s => s[groupByKey] === item[groupByKey] && s.category === item.category);
    allSlots.sort((a, b) => {
      const dateA = safeDate(a.start_time);
      const dateB = safeDate(b.start_time);
      return (dateA?.getTime() || 0) - (dateB?.getTime() || 0);
    });

    // Find matching service description - prioritise session_type_id matches
    const service = allServices.find((svc: ServiceType) =>
      (item.session_type_id && svc.id === item.session_type_id) ||
      svc.title.toLowerCase().trim() === item.title.toLowerCase().trim()
    );
    onClassClick(allSlots, service?.description, 'facilities', null, null, null, null, service?.id || item.session_type_id);
  };

  return (
    <div className="min-h-screen bg-black pb-24 animate-fadeIn relative">
      <AppHeader
        credits={credits}
        onOpenSettings={onOpenSettings}
        setTab={setTab}
        subscriptionStatus={subscriptionStatus}
        accountStatus={accountStatus}
        role={role}
      />

      <div className="relative z-10 px-5 space-y-10 pt-4">
        {/* Membership Prompt */}
        {!(subscriptionStatus === 'active' || subscriptionStatus === 'trialing' || accountStatus === 'active') && (
          <div className="flex flex-col items-center -mb-6">
            <Link
              href="/membership"
              className="text-[10px] font-montserrat font-black italic text-gray-500 uppercase tracking-wider text-center hover:text-white transition-colors animate-pulse bg-white/5 py-2 px-6 rounded-full border border-white/5"
            >
              purchase membership to unlock bookings
            </Link>
          </div>
        )}

        {/* Breaking News */}
        <div>
          <SectionHeader title="Breaking News" />
          {loading ? (
            <div className="flex gap-4 overflow-hidden pb-4">
              {[1, 2].map(i => <Skeleton key={i} className="min-w-[85%] aspect-[16/9] rounded-2xl border border-white/5" />)}
            </div>
          ) : (
            <div className="flex overflow-x-auto no-scrollbar gap-4 snap-x pb-4">
              {combinedNews.map((item) => (
                <div key={item.id} onClick={() => onClassClick([item as Session], item.description, 'facilities', null, null, null, null, (item as any).session_type_id)} className="snap-center min-w-[85%] relative rounded-2xl overflow-hidden aspect-[16/9] border border-white/10 cursor-pointer group shadow-2xl active:scale-95 transition-transform duration-200">
                  <Image src={item.image_url} fill alt={item.title} draggable={false} quality={100} sizes="(max-width: 768px) 100vw, 50vw" className="object-cover opacity-80 transition-all duration-700 group-hover:scale-105 group-hover:opacity-60" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-5 w-full">
                    <div className="bg-east-light text-black text-[8px] font-black px-2 py-0.5 rounded-full w-fit mb-2 uppercase tracking-wider">News</div>
                    <h3 className="font-montserrat font-black italic text-xl leading-none mb-1 text-white uppercase">{item.title}</h3>
                    <p className="font-opensans text-[10px] text-gray-300 line-clamp-2 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Facility Booking */}
        <div>
          <SectionHeader title="Facilities" />
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="aspect-square rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {serviceFacilities.map((fac) => (
                <div key={fac.id} onClick={() => handleServiceClick(fac)} className="flex flex-col gap-2 cursor-pointer group active:scale-95 transition-transform duration-200">
                  <div className="aspect-square rounded-2xl overflow-hidden border border-gray-800 bg-[#0a0a0a] relative shadow-lg group-hover:border-east-light transition-colors">
                    <Image src={fac.image_url || 'https://images.unsplash.com/photo-1541744158664-972170366318?w=400'} fill draggable={false} quality={100} sizes="(max-width: 768px) 50vw, 33vw" className="object-cover opacity-80 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110" alt={fac.title} />
                  </div>
                  <span className="font-montserrat font-bold italic text-[11px] uppercase text-center text-gray-400 group-hover:text-white transition-colors">{fac.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Classes (Dynamic from Session Types) */}
        <div>
          <SectionHeader title="Classes" />
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="aspect-square rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {serviceClasses.map((cls) => (
                <div key={cls.id} onClick={() => handleServiceClick(cls)} className="flex flex-col gap-2 cursor-pointer group active:scale-95 transition-transform duration-200">
                  <div className="aspect-square rounded-2xl overflow-hidden border border-gray-800 bg-[#0a0a0a] relative shadow-lg group-hover:border-east-light transition-colors">
                    <Image src={cls.image_url || 'https://images.unsplash.com/photo-1549466723-863a9af4535e?w=400'} fill alt={cls.title} draggable={false} quality={100} sizes="(max-width: 768px) 50vw, 33vw" className="object-cover opacity-80 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110" />
                    {isGroupBooked(cls.title, 'CLASS') && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-east-light text-[10px] font-black uppercase tracking-widest border border-east-light px-2 py-1 rounded-full bg-black">Booked</span>
                      </div>
                    )}
                  </div>
                  <span className="font-montserrat font-bold italic text-[11px] uppercase text-center text-gray-400 group-hover:text-white transition-colors">{cls.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Private Lessons (Dynamic from Session Types) */}
        <div>
          <SectionHeader title="Private Lessons" />
          {loading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="aspect-square rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {servicePrivate.map((p) => (
                <div key={p.id} onClick={() => handleServiceClick(p)} className="flex flex-col items-center gap-1.5 cursor-pointer group active:scale-95 transition-transform duration-200">
                  <div className="w-full aspect-square rounded-xl overflow-hidden border border-gray-800 bg-[#0a0a0a] relative shadow-md group-hover:border-east-light transition-all">
                    <Image src={p.image_url || 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400'} fill draggable={false} quality={100} sizes="(max-width: 768px) 33vw, 25vw" className="object-cover opacity-80 group-hover:opacity-100 transition-all duration-500" alt={p.title} />
                  </div>
                  <span className="font-montserrat font-bold italic text-[10px] uppercase text-center text-gray-500 group-hover:text-white transition-colors truncate w-full">{p.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Coaches */}
        <div>
          <SectionHeader title="Our Coaches" />
          {loading ? (
            <div className="flex gap-4 overflow-hidden pb-2">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="w-20 h-20 rounded-full shrink-0" />)}
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
              {coaches.map((coach) => (
                <div key={coach.id} onClick={() => {
                  // Unified Flow: Click coach directly -> View ALL their private slots
                  const normalize = (name: string) => name?.replace(/\s+/g, ' ').trim().toLowerCase() || '';

                  const scoreMatch = (instructor: string, first: string, last: string) => {
                    const i = normalize(instructor);
                    const f = normalize(first);
                    const l = normalize(last);

                    // Safety: generic words shouldn't trigger weak matches
                    if (f === 'coach' && !l) return false;

                    // Strong match: instructor contains "first last"
                    if (l && i.includes(`${f} ${l}`)) return true;
                    // Standard match: instructor contains "first" AND "last" (if last exists)
                    if (l && i.includes(f) && i.includes(l)) return true;
                    // Weak match: instructor contains first (only if no last name)
                    if (!l && i.includes(f)) return true;
                    return false;
                  };

                  const coachSessions = sessions.filter(s =>
                    s.instructor &&
                    scoreMatch(s.instructor, coach.first_name, coach.last_name || '')
                  );
                  if (coachSessions.length > 0) {
                    onClassClick(
                      coachSessions,
                      null,
                      'coaches',
                      `${coach.first_name} ${coach.last_name}`,
                      coach.bio,
                      null,
                      null,
                      null // serviceId? Maybe fetch if we can match relevant PRIVATE service, but simpler to rely on filtering
                    );
                  } else {
                    addToast(`${coach.first_name} ${coach.last_name} has no available sessions at the moment.`, 'info');
                  }
                }} className="flex-shrink-0 flex flex-col items-center gap-2 cursor-pointer group w-20 active:scale-95 transition-transform duration-200">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-800 relative shadow-xl group-hover:border-east-light transition-colors">
                    <Image src={coach.avatar_url || 'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=400'} fill draggable={false} quality={100} sizes="80px" className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt={`${coach.first_name} ${coach.last_name}`} />
                  </div>
                  <span className="font-montserrat font-black italic text-[9px] uppercase text-center text-gray-400 group-hover:text-white transition-colors">{coach.first_name} {coach.last_name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Events */}
        <div className="pb-10">
          <SectionHeader title="Up Next" />
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map(i => <Skeleton key={i} className="w-full h-28 rounded-xl" />)}
              </div>
            ) : combinedEvents.map((event: any) => (
              <div key={event.id} className="cursor-pointer group relative rounded-xl overflow-hidden border border-gray-800 active:scale-95 transition-transform duration-200" onClick={() => handleItemClick(event, 'title')}>
                <div className="h-28 relative">
                  <Image src={event.image_url || 'https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?w=800'} fill draggable={false} quality={100} sizes="(max-width: 768px) 100vw, 50vw" className="object-cover opacity-80 group-hover:opacity-60 transition-all duration-500" alt={event.title} />
                  <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
                  <div className="absolute inset-0 p-4 flex flex-col justify-center items-start">
                    <span className="text-[8px] font-bold text-east-light uppercase tracking-widest mb-1 border border-EAST-LIGHT px-2 py-0.5 rounded-full bg-black">coming soon</span>
                    <h4 className="font-montserrat font-black italic text-lg text-white uppercase tracking-tight max-w-[80%]">{event.title}</h4>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* CoachSelectionModal removed for unified ClassModal flow */}

    </div >
  );
}