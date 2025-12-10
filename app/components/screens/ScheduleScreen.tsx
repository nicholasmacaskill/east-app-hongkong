'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Session } from '@/app/types/session';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ScheduleScreen({ onPreviewClick, refreshKey, currentUserId }: { onPreviewClick: (s: Session) => void, refreshKey: number, currentUserId: string | null }) {
  const [mySchedule, setMySchedule] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [filter, setFilter] = useState<'parent' | 'player' | 'combined'>('player');

  const getTheme = (category: string) => {
    switch (category) {
      case 'YOUTH': return { color: '#D1F2D9', border: 'border-green-500', icon: '🏃' };
      case 'ADULT': return { color: '#F8F9FF', border: 'border-blue-500', icon: '💪' };
      case 'COACH': return { color: '#D8B4FE', border: 'border-purple-400', icon: '🎯' };
      case 'EVENT': return { color: '#FCA5A5', border: 'border-red-400', icon: '🎉' };
      case 'FACILITY': return { color: '#D1D5DB', border: 'border-gray-500', icon: '🏠' };
      default: return { color: '#FFFFFF', border: 'border-gray-300', icon: '🗓️' };
    }
  };

  // ✅ FIX: Logic extracted and renamed to avoid infinite loop
  const loadSchedule = useCallback(() => {
    if (!currentUserId) return;
    setLoading(true);
    
    // Call the API directly with the Real UUID
    fetch(`/api/my-schedule?userId=${currentUserId}`)
        .then(res => res.json())
        .then(data => { if(Array.isArray(data)) setMySchedule(data); })
        .catch(console.error)
        .finally(() => setLoading(false));
  }, [currentUserId]);

  useEffect(() => { loadSchedule(); }, [loadSchedule, refreshKey]);

  const eventsForSelectedDay = mySchedule.filter(event => {
    const eventDate = new Date(event.start_time).getDate();
    return eventDate === selectedDay;
  });

  return (
    <div className="min-h-screen bg-black pb-24 animate-fadeIn relative">
       <div className="fixed inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?q=80&w=1000&auto=format&fit=crop" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-black/80" />
       </div>
       <div className="relative z-10">
         <div className="flex pt-4 px-4 mb-4">
            {['PARENT', 'PLAYER', 'COMBINED'].map(f => (
              <button key={f} onClick={() => setFilter(f.toLowerCase() as any)} className={`flex-1 text-center font-montserrat font-black italic text-sm py-3 border-b-4 transition-colors ${filter === f.toLowerCase() ? 'text-white border-white' : 'text-gray-500 border-gray-800'}`}>{f}</button>
            ))}
         </div>
         <div className="mx-4 mb-6 rounded-2xl overflow-hidden relative">
            <div className="bg-gradient-to-r from-east-light to-east-dark h-12 flex items-center px-4"><h2 className="text-white font-montserrat font-black italic text-xl">SCHEDULE</h2></div>
            <div className="bg-white p-4 rounded-b-2xl -mt-2 relative z-10">
                <div className="mb-3 font-montserrat font-black italic text-black text-sm">{new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()}</div>
                <div className="flex justify-between items-center">
                   <ChevronLeft size={24} className="text-black/50" />
                   {Array.from({ length: 6 }, (_, i) => {
                       const d = new Date(); d.setDate(d.getDate() + (i + 1));
                       return (
                           <div key={i} onClick={() => setSelectedDay(d.getDate())} className={`flex flex-col items-center justify-center w-10 h-16 rounded-full cursor-pointer ${d.getDate() === selectedDay ? 'bg-black text-white scale-110 shadow-lg' : 'text-black'}`}>
                              <span className="text-[9px] font-bold mb-0.5">{d.toLocaleDateString('en-US', { weekday: 'narrow' }).toUpperCase()}</span>
                              <span className="text-lg font-black italic">{d.getDate()}</span>
                           </div>
                       );
                   })}
                   <ChevronRight size={24} className="text-black/50" />
                </div>
            </div>
         </div>
         <div className="px-4 space-y-6 min-h-[300px]">
            {loading ? <p className="text-center text-gray-500 text-xs py-10">Loading...</p> : eventsForSelectedDay.length > 0 ? eventsForSelectedDay.map((event, idx) => {
                const theme = getTheme(event.category);
                return (
                    <div key={idx} className="flex gap-4 animate-fadeIn cursor-pointer group" onClick={() => onPreviewClick(event)}>
                        <div className="flex-1"><div style={{ backgroundColor: theme.color }} className={`rounded-xl overflow-hidden text-black shadow-lg border-l-4 ${theme.border}`}><div className="p-3 pb-2"><h3 className="font-montserrat font-black italic text-sm uppercase">{event.title}</h3><p className="text-xs font-bold mt-0.5 text-gray-600">{new Date(event.start_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {new Date(event.end_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p></div><div className="bg-gray-100 p-2 px-3 flex justify-between items-center border-t border-gray-300"><span className="text-[10px] font-black italic text-gray-700">HOST: {event.instructor}</span><button onClick={(e) => { e.stopPropagation(); onPreviewClick(event); }} className="bg-black text-white text-[8px] font-bold italic px-3 py-1.5 rounded-md">PREVIEW</button></div></div></div>
                    </div>
                );
            }) : <div className="text-center py-12 border border-dashed border-gray-800 rounded-2xl bg-gray-900/50"><p className="font-montserrat font-bold italic text-gray-500 mb-2">NO SESSIONS</p></div>}
         </div>
       </div>
    </div>
  );
}