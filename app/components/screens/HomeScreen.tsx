'use client';
import React, { useState, useEffect } from 'react';
import { fetchSessions } from '@/app/services/dataFetcher';
import { Session } from '@/app/types/session';
import { Settings, Trophy, Plus } from 'lucide-react';
import Link from 'next/link';

const SectionHeader = ({ title, className = "" }: { title: string, className?: string }) => (
  <h2 className={`font-montserrat font-black italic text-2xl uppercase text-white mb-4 tracking-tight ${className}`}>
    {title}
  </h2>
);

export default function HomeScreen({
  onClassClick,
  onOpenSettings,
  bookedSessionIds,
  credits,
  setTab
}: {
  onClassClick: (sessions: Session[]) => void,
  onOpenSettings: () => void,
  bookedSessionIds: number[],
  credits: number,
  setTab: (t: any) => void
}) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions()
      .then(data => {
        if (Array.isArray(data)) {
          // Filter out 'Coach User' test data as requested
          const filtered = data.filter(s => s.instructor !== 'Coach User');
          setSessions(filtered);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // --- Helper: Group Sessions ---
  const getUniqueItems = (items: Session[], key: 'title' | 'instructor') => {
    const seen = new Set();
    return items.filter(item => {
      const val = item[key];
      if (seen.has(val)) return false;
      seen.add(val);
      return true;
    });
  };

  const isGroupBooked = (item: Session, groupByKey: 'title' | 'instructor') => {
    const relatedSessions = sessions.filter(s => s[groupByKey] === item[groupByKey] && s.category === item.category);
    return relatedSessions.some(s => bookedSessionIds.includes(s.id));
  };

  // --- Filter Lists ---
  const classesRaw = sessions.filter(s => s.category === 'CLASS');
  const privateRaw = sessions.filter(s => s.category === 'PRIVATE');
  const facilitiesRaw = sessions.filter(s => s.category === 'FACILITY');
  const eventsRaw = sessions.filter(s => s.category === 'EVENT');
  const newsRaw = sessions.filter(s => s.category === 'NEWS');

  const classesUnique = getUniqueItems(classesRaw, 'title');
  const facilitiesUnique = getUniqueItems(facilitiesRaw, 'title');
  const eventsUnique = getUniqueItems(eventsRaw, 'title');

  // 1. Private Lessons (Grouped by ACTIVITY e.g. Golf, Gym)
  const privateUniqueByTitle = getUniqueItems(privateRaw, 'title');

  // 2. Coaches (Grouped by INSTRUCTOR e.g. Coach Ben, Coach Rhett)
  const privateUniqueByCoach = getUniqueItems(privateRaw, 'instructor');

  const handleItemClick = (item: Session, groupByKey: 'title' | 'instructor') => {
    const allSlots = sessions.filter(s => s[groupByKey] === item[groupByKey] && s.category === item.category);
    allSlots.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    onClassClick(allSlots);
  };

  return (
    <div className="min-h-screen bg-black pb-24 animate-fadeIn relative">
      {/* Header */}
      <div className="sticky top-0 z-50 px-6 py-4 bg-black border-b border-gray-900 flex justify-between items-center">
        <div className="w-20">
          <button
            onClick={() => setTab('qr')}
            className="flex items-center gap-1.5 bg-[#1a1a1a] border border-gray-800 rounded-full px-3 py-1.5 hover:bg-gray-800 transition-all active:scale-95 group"
          >
            <span className="text-white font-black italic text-sm">{credits}</span>
            <span className="text-[9px] font-bold text-east-light uppercase tracking-wider">CR</span>
            <Plus size={10} className="text-gray-500 group-hover:text-white transition-colors" />
          </button>
        </div>
        <img src="/eastedited.png" alt="EAST Logo" className="h-8 w-auto" />
        <div className="w-20 flex justify-end gap-4">
          <Link href="/stats" className="text-gray-400 hover:text-east-light transition-colors">
            <Trophy size={22} />
          </Link>
          <button onClick={onOpenSettings} className="text-gray-400 hover:text-white transition-colors">
            <Settings size={22} />
          </button>
        </div>
      </div>

      <div className="relative z-10 px-5 space-y-10 pt-6">

        {/* Breaking News */}
        <div>
          <SectionHeader title="Breaking News" />
          {loading ? <p className="text-xs text-gray-500 font-mono">LOADING...</p> : (
            <div className="flex overflow-x-auto no-scrollbar gap-4 snap-x pb-4">
              {newsRaw.map((item) => (
                <div key={item.id} onClick={() => onClassClick([item])} className="snap-center min-w-[85%] relative rounded-2xl overflow-hidden aspect-[16/9] border border-gray-800 cursor-pointer group shadow-2xl">
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
          {loading ? <p className="text-xs text-gray-500 font-mono">LOADING...</p> : (
            <div className="grid grid-cols-3 gap-3">
              {facilitiesUnique.map((fac) => (
                <div key={fac.id} onClick={() => handleItemClick(fac, 'title')} className="flex flex-col gap-2 cursor-pointer group">
                  <div className="aspect-square rounded-2xl overflow-hidden border border-gray-800 bg-[#0a0a0a] relative shadow-lg group-hover:border-east-light transition-colors">
                    <img src={fac.image_url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110" alt={fac.title} />
                    {isGroupBooked(fac, 'title') && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-east-light text-[8px] font-black uppercase tracking-widest border border-east-light px-2 py-1 rounded-full bg-black">Booked</span>
                      </div>
                    )}
                  </div>
                  <span className="font-montserrat font-bold italic text-[9px] uppercase text-center text-gray-400 group-hover:text-white transition-colors">{fac.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Classes */}
        <div>
          <SectionHeader title="Classes" />
          {loading ? <p className="text-xs text-gray-500 font-mono">LOADING...</p> : (
            <div className="grid grid-cols-3 gap-3">
              {classesUnique.map((cls) => (
                <div key={cls.id} onClick={() => handleItemClick(cls, 'title')} className="flex flex-col gap-2 cursor-pointer group">
                  <div className="aspect-square rounded-2xl overflow-hidden border border-gray-800 bg-[#0a0a0a] relative shadow-lg group-hover:border-east-light transition-colors">
                    <img src={cls.image_url} alt={cls.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110" />
                    {isGroupBooked(cls, 'title') && (
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

        {/* Private Lessons */}
        <div>
          <SectionHeader title="Private Lessons" />
          {loading ? <p className="text-xs text-gray-500 font-mono">LOADING...</p> : (
            <div className="grid grid-cols-4 gap-2">
              {privateUniqueByTitle.map((p) => (
                <div key={p.id} onClick={() => handleItemClick(p, 'title')} className="flex flex-col items-center gap-1.5 cursor-pointer group">
                  <div className="w-full aspect-square rounded-xl overflow-hidden border border-gray-800 bg-[#0a0a0a] relative shadow-md group-hover:border-east-light transition-all">
                    <img src={p.image_url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-500" alt={p.title} />
                    {isGroupBooked(p, 'title') && <div className="absolute top-1 right-1 w-2 h-2 bg-east-light rounded-full shadow-[0_0_8px_rgba(209,242,217,0.8)]" />}
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
          {loading ? <p className="text-xs text-gray-500 font-mono">LOADING...</p> : (
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
              {privateUniqueByCoach.map((p) => (
                <div key={p.id} onClick={() => handleItemClick(p, 'instructor')} className="flex-shrink-0 flex flex-col items-center gap-2 cursor-pointer group w-20">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-800 relative shadow-xl group-hover:border-east-light transition-colors">
                    <img src={p.coach_image_url || p.image_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt={p.instructor} />
                    {isGroupBooked(p, 'instructor') && <div className="absolute top-1 right-1 w-3 h-3 bg-east-light rounded-full border-2 border-black" />}
                  </div>
                  <span className="font-montserrat font-black italic text-[9px] uppercase text-center text-gray-400 group-hover:text-white transition-colors">{p.instructor}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Events */}
        <div className="pb-10">
          <SectionHeader title="Up Next" />
          <div className="space-y-4">
            {loading ? <p className="text-xs text-gray-500 font-mono">LOADING...</p> : eventsUnique.map((event) => (
              <div key={event.id} className="cursor-pointer group relative rounded-xl overflow-hidden border border-gray-800" onClick={() => handleItemClick(event, 'title')}>
                <div className="h-28 relative">
                  <img src={event.image_url || ''} className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-all duration-500" alt={event.title} />
                  <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
                  <div className="absolute inset-0 p-4 flex flex-col justify-center items-start">
                    <span className="text-[8px] font-bold text-east-light uppercase tracking-widest mb-1 border border-east-light px-2 py-0.5 rounded-full bg-black">Coming Soon</span>
                    <h4 className="font-montserrat font-black italic text-lg text-white uppercase tracking-tight max-w-[80%]">{event.title}</h4>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div >
  );
}