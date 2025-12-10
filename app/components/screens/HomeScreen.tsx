'use client';
import React, { useState, useEffect } from 'react';
import { fetchSessions } from '@/app/services/dataFetcher';
import { Session } from '@/app/types/session';
import { Settings } from 'lucide-react';

const SectionHeader = ({ title, className = "" }: { title: string, className?: string }) => (
  <h2 className={`font-montserrat font-black italic text-2xl uppercase text-white mb-4 tracking-tight ${className}`}>
    {title}
  </h2>
);

export default function HomeScreen({ onClassClick, onOpenSettings, bookedSessionIds }: { onClassClick: (sessions: Session[]) => void, onOpenSettings: () => void, bookedSessionIds: number[] }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions()
      .then(data => { if(Array.isArray(data)) setSessions(data); })
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

  // Filter Lists
  const adultRaw = sessions.filter(s => s.category === 'ADULT');
  const youthRaw = sessions.filter(s => s.category === 'YOUTH');
  const coachesRaw = sessions.filter(s => s.category === 'COACH');
  const facilitiesRaw = sessions.filter(s => s.category === 'FACILITY');
  const eventsRaw = sessions.filter(s => s.category === 'EVENT');
  const newsRaw = sessions.filter(s => s.category === 'NEWS');

  const adultUnique = getUniqueItems(adultRaw, 'title');
  const youthUnique = getUniqueItems(youthRaw, 'title');
  const coachesUnique = getUniqueItems(coachesRaw, 'instructor');
  const facilitiesUnique = getUniqueItems(facilitiesRaw, 'title');
  const eventsUnique = getUniqueItems(eventsRaw, 'title'); 

  const handleItemClick = (item: Session, groupByKey: 'title' | 'instructor') => {
      const allSlots = sessions.filter(s => s[groupByKey] === item[groupByKey] && s.category === item.category);
      allSlots.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
      onClassClick(allSlots);
  };

  return (
    <div className="pb-22 pt-4 px-4 space-y-8 animate-fadeIn relative">
      <div className="flex justify-between items-center mb-6 px-2 relative z-10">
         <div className="w-8"></div>
         <h1 className="font-montserrat font-black italic text-5xl text-white tracking-tighter drop-shadow-lg">
           E<span className="text-east-light">A</span>ST
         </h1>
         <button onClick={onOpenSettings} className="text-gray-400 hover:text-white transition-colors">
            <Settings size={24} />
         </button>
      </div>

      {/* Breaking News */}
      <div>
        <SectionHeader title="Breaking News" />
        {loading ? <p className="text-xs text-gray-500">Loading...</p> : (
        <div className="flex overflow-x-auto no-scrollbar gap-4 snap-x">
          {newsRaw.map((item) => (
            <div key={item.id} onClick={() => onClassClick([item])} className="snap-center min-w-[90%] relative rounded-2xl overflow-hidden aspect-[2/1] border border-gray-800 cursor-pointer group">
              <img src={item.image_url} alt={item.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 p-4 w-3/4">
                <h3 className="font-montserrat font-black italic text-lg leading-tight mb-1 uppercase">{item.title}</h3>
                <p className="font-opensans text-xs text-gray-300 line-clamp-2">{item.description}</p>
              </div>
              <div className="absolute bottom-4 right-4">
                <button className="bg-white text-black text-[10px] font-bold px-2 py-1 rounded">READ MORE</button>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

      {/* Facility Booking */}
      <div>
        <SectionHeader title="Facility Booking" />
        {loading ? <p className="text-xs text-gray-500">Loading...</p> : (
        <div className="grid grid-cols-3 gap-3">
          {facilitiesUnique.map((fac) => (
            <div key={fac.id} onClick={() => handleItemClick(fac, 'title')} className="flex flex-col gap-2 cursor-pointer group relative">
              <div className="aspect-square rounded-xl overflow-hidden border border-gray-700 bg-gray-900 relative">
                 <img src={fac.image_url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={fac.title} />
                 <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-300" />
                 {isGroupBooked(fac, 'title') && (
                    <div className="absolute top-2 right-2 bg-east-light text-black text-[8px] font-black px-1.5 py-0.5 rounded">BOOKED</div>
                 )}
              </div>
              <span className="font-montserrat font-bold italic text-[10px] uppercase truncate">{fac.title}</span>
            </div>
          ))}
        </div>
        )}
      </div>

      {/* Adult Classes */}
      <div>
        <SectionHeader title="Adult Classes" />
        {loading ? <p className="text-xs text-gray-500">Loading...</p> : (
        <div className="grid grid-cols-3 gap-3">
          {adultUnique.map((cls) => (
            <div key={cls.id} onClick={() => handleItemClick(cls, 'title')} className="flex flex-col gap-2 cursor-pointer group relative">
              <div className="aspect-square rounded-xl overflow-hidden border border-gray-700 relative">
                <img src={cls.image_url} alt={cls.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-300" />
                {isGroupBooked(cls, 'title') && (
                    <div className="absolute top-2 right-2 bg-east-light text-black text-[8px] font-black px-1.5 py-0.5 rounded">BOOKED</div>
                )}
              </div>
              <span className="font-montserrat font-bold italic text-[10px] uppercase truncate">{cls.title}</span>
            </div>
          ))}
        </div>
        )}
      </div>

      {/* Youth Classes */}
      <div>
        <SectionHeader title="Youth Classes" />
        {loading ? <p className="text-xs text-gray-500">Loading...</p> : (
        <div className="grid grid-cols-3 gap-3">
          {youthUnique.map((cls) => (
            <div key={cls.id} onClick={() => handleItemClick(cls, 'title')} className="flex flex-col gap-2 cursor-pointer group relative">
              <div className="aspect-square rounded-xl overflow-hidden border border-gray-700 relative">
                <img src={cls.image_url} alt={cls.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-300" />
                {isGroupBooked(cls, 'title') && (
                    <div className="absolute top-2 right-2 bg-east-light text-black text-[8px] font-black px-1.5 py-0.5 rounded">BOOKED</div>
                )}
              </div>
              <span className="font-montserrat font-bold italic text-[10px] uppercase truncate">{cls.title}</span>
            </div>
          ))}
        </div>
        )}
      </div>

      {/* Private Coach */}
      <div>
        <SectionHeader title="Private Coach" />
        {loading ? <p className="text-xs text-gray-500">Loading...</p> : (
        <div className="grid grid-cols-4 gap-3">
          {coachesUnique.map((c) => (
             <div key={c.id} onClick={() => handleItemClick(c, 'instructor')} className="flex flex-col items-center gap-2 cursor-pointer group relative">
              <div className="w-full aspect-square rounded-xl overflow-hidden border border-white relative">
                <img src={c.image_url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={c.instructor} />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                {isGroupBooked(c, 'instructor') && (
                    <div className="absolute top-1 right-1 bg-east-light text-black text-[7px] font-black px-1 py-0.5 rounded-sm">✓</div>
                )}
              </div>
              <span className="font-montserrat font-bold italic text-[10px] uppercase">{c.instructor}</span>
             </div>
          ))}
        </div>
        )}
      </div>

      {/* Events List */}
      <div>
        <SectionHeader title="Events" />
        <div className="space-y-6">
            {loading ? <p className="text-xs text-gray-500">Loading...</p> : eventsUnique.map((event) => (
                <div key={event.id} className="cursor-pointer group relative" onClick={() => handleItemClick(event, 'title')}>
                   <div className="flex justify-between items-center mb-2">
                       <h4 className="font-montserrat font-bold italic text-[10px] text-white uppercase tracking-widest">{event.title}</h4>
                       {isGroupBooked(event, 'title') && (
                            <span className="bg-east-light text-black text-[8px] font-black px-2 py-0.5 rounded">REGISTERED</span>
                       )}
                   </div>
                   <div className="relative rounded-2xl overflow-hidden h-32 border border-gray-700 group-hover:border-east-light transition-colors duration-300">
                      <img src={event.image_url || ''} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-300" alt={event.title}/>
                   </div>
                </div>
            ))}
        </div>
      </div>

      <div className="h-24 w-full" />
    </div>
  );
}