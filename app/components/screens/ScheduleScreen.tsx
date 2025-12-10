'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Session } from '@/app/types/session';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { 
    addDays, 
    subDays, 
    addMonths, 
    subMonths, 
    format, 
    isSameDay, 
    startOfMonth, 
    endOfMonth, 
    endOfYear, 
    addYears, 
    isBefore, 
    isAfter 
} from 'date-fns';

export default function ScheduleScreen({ onPreviewClick, refreshKey, currentUserId }: { onPreviewClick: (s: Session) => void, refreshKey: number, currentUserId: string | null }) {
  const [mySchedule, setMySchedule] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for Navigation and Selection
  const [viewStartDate, setViewStartDate] = useState(new Date()); // The first visible day in the strip
  const [selectedDate, setSelectedDate] = useState(new Date());   // The currently selected date filter
  const [filter, setFilter] = useState<'parent' | 'player' | 'combined'>('player');

  // Constraints: Current month start up to next December end
  const minDate = startOfMonth(new Date());
  const maxDate = endOfYear(addYears(new Date(), 1));

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

  const loadSchedule = useCallback(() => {
    if (!currentUserId) return;
    setLoading(true);
    
    fetch(`/api/my-schedule?userId=${currentUserId}`)
        .then(res => res.json())
        .then(data => { if(Array.isArray(data)) setMySchedule(data); })
        .catch(console.error)
        .finally(() => setLoading(false));
  }, [currentUserId]);

  useEffect(() => { loadSchedule(); }, [loadSchedule, refreshKey]);

  // --- WEEKLY NAVIGATION (Moves the window by 7 days) ---
  const handlePrevWeek = () => {
    const newDate = subDays(viewStartDate, 7); 
    // Prevent navigating before the minimum allowed date (start of current month)
    if (!isBefore(newDate, minDate)) {
        setViewStartDate(newDate);
    }
  };

  const handleNextWeek = () => {
    const newDate = addDays(viewStartDate, 7);
    // Allow navigation as long as the 6th visible day is not past the maxDate
    if (!isAfter(addDays(newDate, 5), maxDate)) {
        setViewStartDate(newDate);
    }
  };

  // --- MONTHLY NAVIGATION (Moves the view to the start of the next/previous month) ---
  const handlePrevMonth = () => {
    const targetMonthStart = startOfMonth(subMonths(viewStartDate, 1)); 

    if (isBefore(targetMonthStart, minDate)) {
        // If target is before minDate, snap to minDate (start of this month)
        setViewStartDate(minDate);
        setSelectedDate(minDate);
    } else {
        // Otherwise, move to the start of the target month
        setViewStartDate(targetMonthStart);
        setSelectedDate(targetMonthStart);
    }
  };

  const handleNextMonth = () => {
    // Get the start of the month 1 month ahead
    const nextMonthStart = startOfMonth(addMonths(viewStartDate, 1));
    
    if (isAfter(nextMonthStart, maxDate)) {
        // If the next month starts after the max date, do nothing
        return;
    } else {
        // Move to the start of the next month
        setViewStartDate(nextMonthStart);
        setSelectedDate(nextMonthStart);
    }
  };


  // Filter Events
  const eventsForSelectedDay = mySchedule.filter(event => {
    return isSameDay(new Date(event.start_time), selectedDate);
  });
  
  // Calculate display month based on the currently selected date
  const displayMonth = format(viewStartDate, 'MMM yyyy').toUpperCase();

  return (
    <div className="min-h-screen bg-black pb-24 animate-fadeIn relative">
       <div className="fixed inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?q=80&w=1000&auto=format&fit=crop" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-black/80" />
       </div>
       <div className="relative z-10">
         <div className="flex pt-4 px-4 mb-4">
            {/* --- MODIFIED: Swapped order to ['PLAYER', 'PARENT'] --- */}
            {['PLAYER', 'PARENT'].map(f => (
              <button key={f} onClick={() => setFilter(f.toLowerCase() as any)} className={`flex-1 text-center font-montserrat font-black italic text-sm py-3 border-b-4 transition-colors ${filter === f.toLowerCase() ? 'text-white border-white' : 'text-gray-500 border-gray-800'}`}>{f}</button>
            ))}
            {/* ---------------------------------------------------- */}
         </div>
         <div className="mx-4 mb-6 rounded-2xl overflow-hidden relative">
            <div className="bg-gradient-to-r from-east-light to-east-dark h-12 flex items-center px-4"><h2 className="text-white font-montserrat font-black italic text-xl">SCHEDULE</h2></div>
            <div className="bg-white p-4 rounded-b-2xl -mt-2 relative z-10">
                
                {/* --- MONTH NAVIGATION/DISPLAY --- */}
                <div className="flex justify-between items-center mb-3">
                   <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-30" disabled={isSameDay(startOfMonth(viewStartDate), minDate) || isBefore(viewStartDate, minDate)}>
                        <ChevronLeft size={20} className="text-black" />
                   </button>
                   <div className="font-montserrat font-black italic text-black text-sm uppercase tracking-wider">
                       {displayMonth}
                   </div>
                   <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-30" disabled={isAfter(endOfMonth(viewStartDate), maxDate)}>
                        <ChevronRight size={20} className="text-black" />
                   </button>
                </div>
                
                {/* --- WEEKLY VIEW (with Week Navigation Arrows) --- */}
                <div className="flex justify-between items-center pt-2">
                   {/* Previous Week Button (moves by 7 days) */}
                   <button onClick={handlePrevWeek} className="p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-30" disabled={isBefore(viewStartDate, addDays(minDate, 1))}>
                        <ChevronLeft size={24} className="text-black" />
                   </button>
                   
                   {/* Render 6 Days from viewStartDate */}
                   <div className="flex gap-1.5 overflow-hidden">
                       {Array.from({ length: 6 }, (_, i) => {
                           const d = addDays(viewStartDate, i);
                           const isSelected = isSameDay(d, selectedDate);
                           
                           // Hide dates outside the overall allowed range
                           if (isBefore(d, minDate) || isAfter(d, maxDate)) {
                               return <div key={i} className="w-10 h-16" />; 
                           }

                           return (
                               <div 
                                    key={i} 
                                    onClick={() => setSelectedDate(d)} 
                                    // Using rounded-xl for the oval shape
                                    className={`flex flex-col items-center justify-center w-10 h-16 rounded-xl cursor-pointer transition-all duration-200 ${isSelected ? 'bg-black text-white scale-105 shadow-lg' : 'text-black hover:bg-gray-100'}`}
                               >
                                  <span className="text-[9px] font-bold mb-0.5">{format(d, 'EEE').toUpperCase()}</span>
                                  <span className="text-lg font-black italic">{format(d, 'd')}</span>
                               </div>
                           );
                       })}
                   </div>

                   {/* Next Week Button (moves by 7 days) */}
                   <button onClick={handleNextWeek} className="p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-30" disabled={isAfter(addDays(viewStartDate, 5), maxDate)}>
                        <ChevronRight size={24} className="text-black" />
                   </button>
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