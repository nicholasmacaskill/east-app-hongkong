'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Session } from '@/app/types/session';
import { ChevronLeft, ChevronRight, Activity } from 'lucide-react';
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

export default function ScheduleScreen({
  onPreviewClick,
  refreshKey,
  currentUserId,
  parentMode = false,
  myChildren = [],
  activeChildId,
  setActiveChildId
}: {
  onPreviewClick: (s: Session) => void,
  refreshKey: number,
  currentUserId: string | null,
  parentMode?: boolean,
  myChildren?: any[],
  activeChildId?: string | null,
  setActiveChildId?: (id: string | null) => void
}) {
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
      .then(data => { if (Array.isArray(data)) setMySchedule(data); })
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
      <div className="relative z-10">
        <div className="mx-4 mb-4 flex flex-col gap-3">
          {/* --- FILTER TABS: High contrast dark theme --- */}
          <div className="flex bg-[#1a1a1a] rounded-xl p-1">
            {['PLAYER', 'PARENT'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f.toLowerCase() as any)}
                className={`flex-1 text-center font-montserrat font-black italic text-[10px] py-2 rounded-lg transition-all ${filter === f.toLowerCase() ? 'bg-east-light text-black shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* --- CHILD SWITCHER (For Parents) --- */}
          {parentMode && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              <button
                onClick={() => setActiveChildId && setActiveChildId(null)}
                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase whitespace-nowrap border transition-all ${!activeChildId
                  ? 'bg-east-light text-black border-east-light'
                  : 'bg-black text-gray-500 border-gray-800'
                  }`}
              >
                Myself
              </button>
              {myChildren.map(child => (
                <button
                  key={child.id}
                  onClick={() => setActiveChildId && setActiveChildId(child.id)}
                  className={`px-4 py-2 rounded-full text-[10px] font-black uppercase whitespace-nowrap border transition-all ${activeChildId === child.id
                    ? 'bg-white text-black border-white'
                    : 'bg-black text-gray-500 border-gray-800 hover:border-gray-600'
                    }`}
                >
                  {child.first_name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mx-4 mb-6 rounded-2xl overflow-hidden border border-gray-800 shadow-2xl">
          <div className="bg-gradient-to-r from-east-light to-east-dark h-11 flex items-center px-4">
            <h2 className="text-black font-montserrat font-black italic text-sm uppercase tracking-tight">My Schedule</h2>
          </div>
          <div className="bg-[#0a0a0a] p-4 relative z-10">

            {/* --- MONTH NAVIGATION/DISPLAY --- */}
            <div className="flex justify-between items-center mb-4">
              <button onClick={handlePrevMonth} className="p-1.5 hover:bg-white/10 rounded-full transition-colors disabled:opacity-30" disabled={isSameDay(startOfMonth(viewStartDate), minDate) || isBefore(viewStartDate, minDate)}>
                <ChevronLeft size={18} className="text-white" />
              </button>
              <div className="font-montserrat font-black italic text-white text-[11px] uppercase tracking-[0.2em]">
                {displayMonth}
              </div>
              <button onClick={handleNextMonth} className="p-1.5 hover:bg-white/10 rounded-full transition-colors disabled:opacity-30" disabled={isAfter(endOfMonth(viewStartDate), maxDate)}>
                <ChevronRight size={18} className="text-white" />
              </button>
            </div>

            {/* --- WEEKLY VIEW --- */}
            <div className="flex justify-between items-center">
              <button onClick={handlePrevWeek} className="p-1 hover:bg-white/5 rounded-full transition-colors disabled:opacity-10" disabled={isBefore(viewStartDate, addDays(minDate, 1))}>
                <ChevronLeft size={20} className="text-gray-500" />
              </button>

              <div className="flex gap-2">
                {Array.from({ length: 6 }, (_, i) => {
                  const d = addDays(viewStartDate, i);
                  const isSelected = isSameDay(d, selectedDate);

                  if (isBefore(d, minDate) || isAfter(d, maxDate)) {
                    return <div key={i} className="w-10" />;
                  }

                  return (
                    <div
                      key={i}
                      onClick={() => setSelectedDate(d)}
                      className={`flex flex-col items-center justify-center w-10 py-2 rounded-xl cursor-pointer transition-all duration-300 border ${isSelected ? 'bg-east-light text-black border-east-light shadow-[0_0_15px_rgba(209,242,217,0.3)]' : 'bg-transparent text-gray-500 border-transparent hover:bg-white/5'}`}
                    >
                      <span className="text-[8px] font-black mb-1">{format(d, 'EEE').toUpperCase()}</span>
                      <span className="text-sm font-black italic">{format(d, 'd')}</span>
                    </div>
                  );
                })}
              </div>

              <button onClick={handleNextWeek} className="p-1 hover:bg-white/5 rounded-full transition-colors disabled:opacity-10" disabled={isAfter(addDays(viewStartDate, 5), maxDate)}>
                <ChevronRight size={20} className="text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        <div className="px-5 space-y-4 min-h-[300px]">
          {loading ? (
            <div className="flex flex-col items-center py-20 gap-3">
              <div className="w-6 h-6 border-2 border-east-light border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Fetching Schedule</p>
            </div>
          ) : eventsForSelectedDay.length > 0 ? (
            eventsForSelectedDay.map((event, idx) => {
              const theme = getTheme(event.category);
              return (
                <div key={idx} className="flex gap-4 animate-fadeIn cursor-pointer group" onClick={() => onPreviewClick(event)}>
                  <div className="flex-1 transition-all duration-300 group-hover:translate-x-1">
                    <div className="bg-[#0a0a0a] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                      <div className="p-4 flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{theme.icon}</span>
                            <h3 className="font-montserrat font-black italic text-sm uppercase text-white tracking-tight">{event.title}</h3>
                          </div>
                          <p className="text-[10px] font-bold text-gray-500 tracking-tighter">
                            {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[8px] font-black uppercase text-east-light bg-east-light/10 px-2 py-0.5 rounded-full border border-east-light/20">
                            {event.category}
                          </span>
                        </div>
                      </div>
                      <div className="bg-white/5 p-3 flex justify-between items-center border-t border-white/5">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-gray-800" />
                          <span className="text-[9px] font-black italic text-gray-400 uppercase tracking-widest">{event.instructor}</span>
                        </div>
                        <button className="bg-white text-black text-[9px] font-black italic px-4 py-1.5 rounded-full hover:bg-east-light transition-colors">DETAILS</button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-gray-800 rounded-3xl bg-[#0a0a0a]/50">
              <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center mb-4">
                <Activity size={24} className="text-gray-700" />
              </div>
              <p className="font-montserrat font-black italic text-gray-600 text-[10px] uppercase tracking-widest">No sessions scheduled</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}