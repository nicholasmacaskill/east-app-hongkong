'use client';
import React, { useState, useEffect } from 'react';
import { fetchSessions } from '@/app/services/dataFetcher';
import { Session } from '@/app/types/session';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import AppHeader from '../AppHeader';
import Skeleton from '../ui/Skeleton';

const SectionHeader = ({ title, className = "" }: { title: string, className?: string }) => (
  <h2 className={`font-montserrat font-black italic text-2xl uppercase text-white mb-4 tracking-tight ${className}`}>
    {title}
  </h2>
);

interface ServiceType {
  id: string;
  title: string;
  category: 'CLASS' | 'PRIVATE';
  image_url: string | null;
  description: string | null;
}

interface HomeScreenProps {
  onClassClick: (
    sessions: Session[],
    description?: string | null,
    origin?: 'facilities' | 'coaches',
    coachName?: string | null,
    coachBio?: string | null
  ) => void;
  onOpenSettings: () => void;
  bookedSessions: Session[];
  credits: number;
  subscriptionStatus?: string;
  setTab: (tab: any) => void;
}

export default function HomeScreen({
  onClassClick,
  onOpenSettings,
  bookedSessions,
  credits,
  subscriptionStatus, // NEW
  setTab
}: HomeScreenProps) {
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
        const response = await fetch('/api/announcements');
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

  // --- Filter Lists ---
  // We now use allServices for Classes and Private Lessons
  const serviceClasses = allServices.filter(s => s.category === 'CLASS');
  const servicePrivate = allServices.filter(s => s.category === 'PRIVATE');

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
      return new Date(b.start_time).getTime() - new Date(a.start_time).getTime();
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
  ].sort((a, b) => new Date(b.start_time || 0).getTime() - new Date(a.start_time || 0).getTime());

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
  ].sort((a, b) => new Date(a.start_time || 0).getTime() - new Date(b.start_time || 0).getTime());

  const handleServiceClick = async (service: ServiceType) => {
    if (service.category === 'CLASS') {
      // Show upcoming sessions for this class type
      // We filter the already fetched 'sessions' by title matching the service title
      // NOTE: Ideally we should match by ID, but legacy sessions table doesn't have session_type_id yet.
      // Using Title matching for v1 transition.
      const matching = sessions.filter(s =>
        s.category === 'CLASS' &&
        (s.session_type_id === service.id || s.title.toLowerCase().trim() === service.title.toLowerCase().trim())
      );

      if (matching.length === 0) {
        alert(`No upcoming sessions scheduled for ${service.title} yet.`);
      } else {
        matching.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
        onClassClick(matching, service.description);
      }

    } else if (service.category === 'PRIVATE') {
      const matching = sessions.filter(s =>
        s.category === 'PRIVATE' &&
        (s.session_type_id === service.id || s.title.toLowerCase().trim() === service.title.toLowerCase().trim())
      );

      if (matching.length === 0) {
        alert(`No upcoming private slots for ${service.title} yet.`);
      } else {
        matching.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
        onClassClick(matching, service.description);
      }
    }
  };

  // handleCoachSelect is no longer needed

  const handleItemClick = (item: any, groupByKey: 'title' | 'instructor') => {
    // If it's an announcement-based item (UUID string vs specific session ID)
    // we just open the detail modal directly for that item.
    if (typeof item.id === 'string' || item.category === 'NEWS') {
      onClassClick([item as Session], item.description);
      return;
    }

    const allSlots = sessions.filter(s => s[groupByKey] === item[groupByKey] && s.category === item.category);
    allSlots.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    // Find matching service description - prioritise session_type_id matches
    const service = allServices.find((svc: ServiceType) =>
      (item.session_type_id && svc.id === item.session_type_id) ||
      svc.title.toLowerCase().trim() === item.title.toLowerCase().trim()
    );
    onClassClick(allSlots, service?.description);
  };

  return (
    <div className="min-h-screen bg-black pb-24 animate-fadeIn relative">
      <AppHeader
        credits={credits}
        onOpenSettings={onOpenSettings}
        setTab={setTab}
        subscriptionStatus={subscriptionStatus}
      />

      <div className="relative z-10 px-5 space-y-10 pt-6">

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
                <div key={item.id} onClick={() => onClassClick([item as Session])} className="snap-center min-w-[85%] relative rounded-2xl overflow-hidden aspect-[16/9] border border-white/10 cursor-pointer group shadow-2xl active:scale-95 transition-transform duration-200">
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover opacity-80 transition-all duration-700 group-hover:scale-105 group-hover:opacity-60" />
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
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="aspect-square rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {facilitiesUnique.map((fac) => (
                <div key={fac.id} onClick={() => handleItemClick(fac, 'title')} className="flex flex-col gap-2 cursor-pointer group active:scale-95 transition-transform duration-200">
                  <div className="aspect-square rounded-2xl overflow-hidden border border-gray-800 bg-[#0a0a0a] relative shadow-lg group-hover:border-east-light transition-colors">
                    <img src={fac.image_url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110" alt={fac.title} />
                  </div>
                  <span className="font-montserrat font-bold italic text-[9px] uppercase text-center text-gray-400 group-hover:text-white transition-colors">{fac.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Classes (Dynamic from Session Types) */}
        <div>
          <SectionHeader title="Classes" />
          {loading ? (
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="aspect-square rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {serviceClasses.map((cls) => (
                <div key={cls.id} onClick={() => handleServiceClick(cls)} className="flex flex-col gap-2 cursor-pointer group active:scale-95 transition-transform duration-200">
                  <div className="aspect-square rounded-2xl overflow-hidden border border-gray-800 bg-[#0a0a0a] relative shadow-lg group-hover:border-east-light transition-colors">
                    <img src={cls.image_url || 'https://images.unsplash.com/photo-1549466723-863a9af4535e?w=400'} alt={cls.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110" />
                    {isGroupBooked(cls.title, 'CLASS') && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-east-light text-[8px] font-black uppercase tracking-widest border border-east-light px-2 py-1 rounded-full bg-black">Booked</span>
                      </div>
                    )}
                  </div>
                  <span className="font-montserrat font-bold italic text-[9px] uppercase text-center text-gray-400 group-hover:text-white transition-colors">{cls.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Private Lessons (Dynamic from Session Types) */}
        <div>
          <SectionHeader title="Private Lessons" />
          {loading ? (
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="aspect-square rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {servicePrivate.map((p) => (
                <div key={p.id} onClick={() => handleServiceClick(p)} className="flex flex-col items-center gap-1.5 cursor-pointer group active:scale-95 transition-transform duration-200">
                  <div className="w-full aspect-square rounded-xl overflow-hidden border border-gray-800 bg-[#0a0a0a] relative shadow-md group-hover:border-east-light transition-all">
                    <img src={p.image_url || 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400'} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-500" alt={p.title} />
                  </div>
                  <span className="font-montserrat font-bold italic text-[8px] uppercase text-center text-gray-500 group-hover:text-white transition-colors truncate w-full">{p.title}</span>
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
                  const scoreMatch = (instructor: string, first: string, last: string) => {
                    const i = instructor.toLowerCase();
                    const f = first.toLowerCase();
                    const l = last.toLowerCase();
                    // Strong match: instructor contains "First Last"
                    if (l && i.includes(`${f} ${l}`)) return true;
                    // Standard match: instructor contains "First" AND "Last" (if last exists)
                    if (l && i.includes(f) && i.includes(l)) return true;
                    // Weak match: instructor contains First (only if no Last name)
                    if (!l && i.includes(f)) return true;
                    return false;
                  };

                  const coachSessions = sessions.filter(s =>
                    s.category === 'PRIVATE' &&
                    s.instructor &&
                    scoreMatch(s.instructor, coach.first_name, coach.last_name || '')
                  );
                  if (coachSessions.length > 0) {
                    onClassClick(
                      coachSessions,
                      null,
                      'coaches',
                      `${coach.first_name} ${coach.last_name}`,
                      coach.bio
                    );
                  } else {
                    alert(`${coach.first_name} ${coach.last_name} has no available sessions at the moment.`);
                  }
                }} className="flex-shrink-0 flex flex-col items-center gap-2 cursor-pointer group w-20 active:scale-95 transition-transform duration-200">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-800 relative shadow-xl group-hover:border-east-light transition-colors">
                    <img src={coach.avatar_url || 'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=400'} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt={`${coach.first_name} ${coach.last_name}`} />
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
                  <img src={event.image_url || ''} className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-all duration-500" alt={event.title} />
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