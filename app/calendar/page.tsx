'use client';

import { useState, useCallback, useEffect } from 'react';
import { addMonths, startOfMonth, format } from 'date-fns';
import Calendar from '../components/Calendar/index';
import { CalendarEvent, EventTypeConfig } from '../types/calendar';
import { useRouter } from 'next/navigation';
import Footer from '../components/Footer';

const eventTypeConfig: EventTypeConfig = {
  'youth-class': {
    color: 'bg-green-500',
    label: 'Youth Class'
  },
  'game': {
    color: 'bg-blue-500',
    label: 'Game'
  }
};

const generateMockEvents = (month: Date): CalendarEvent[] => {
  const events: CalendarEvent[] = [];
  const monthStart = startOfMonth(month);
  const monthYear = format(month, 'yyyy-MM'); // Add import for format from date-fns
  
  // Generate some youth classes (Mondays and Wednesdays)
  for (let i = 0; i < 4; i++) {
    const classDate = new Date(monthStart);
    classDate.setDate(monthStart.getDate() + (i * 7) + 1); // Mondays
    const startTime = new Date(classDate.setHours(10, 0, 0));
    events.push({
      id: `youth-${monthYear}-${i}`, // Use month-year instead of timestamp
      title: 'YOUTH CLASS',
      startTime: startTime,
      endTime: new Date(new Date(startTime).setHours(12, 0, 0)),
      type: 'youth-class',
      host: 'BEN'
    });
  }

  // Generate some games (Saturdays)
  for (let i = 0; i < 4; i++) {
    const gameDate = new Date(monthStart);
    gameDate.setDate(monthStart.getDate() + (i * 7) + 6); // Saturdays
    const startTime = new Date(gameDate.setHours(10, 0, 0));
    events.push({
      id: `game-${monthYear}-${i}`, // Use month-year instead of timestamp
      title: 'GAME VS TROJANS',
      startTime: startTime,
      endTime: new Date(new Date(startTime).setHours(12, 0, 0)),
      type: 'game',
      host: 'BEN'
    });
  }

  return events;
};

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loadedMonths, setLoadedMonths] = useState<Set<string>>(new Set());
  const [initialLoading, setInitialLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('calendar');
  const router = useRouter();

  const loadMonthEvents = useCallback(async (month: Date) => {
    try {
      const monthKey = month.toISOString().slice(0, 7);
      if (loadedMonths.has(monthKey)) return;

      setLoading(true);
      // Simulate API call
      const newEvents = await new Promise<CalendarEvent[]>(resolve => 
        setTimeout(() => resolve(generateMockEvents(month)), 500)
      );
      setEvents(prev => [...prev, ...newEvents]);
      setLoadedMonths(prev => new Set([...prev, monthKey]));
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  }, [loadedMonths]);

  // Load initial month
  useEffect(() => {
    loadMonthEvents(currentMonth).finally(() => {
      setInitialLoading(false);
    });
  }, []);

  const handleMonthChange = useCallback((date: Date) => {
    setCurrentMonth(date);
    setEvents([]); // Clear old events
    loadMonthEvents(date);
    loadMonthEvents(addMonths(date, 1));
  }, [loadMonthEvents]);

  const handleEventClick = useCallback((event: CalendarEvent) => {
    // Handle event click - show details, navigate, etc.
    console.log('Event clicked:', event);
    alert(`Event: ${event.title}\nTime: ${event.startTime.toLocaleString()}\nHost: ${event.host}`);
  }, []);

  return (
    <div className="app min-h-screen bg-dark text-white flex flex-col">
      <div className="east-logo text-4xl md:text-6xl text-center py-6 w-full">EAST</div>
      
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 py-8">
        {initialLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <Calendar
              events={events}
              onMonthChange={handleMonthChange}
              onEventClick={handleEventClick}
            />
            
            {loading && (
              <div className="flex justify-center mt-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            )}
          </>
        )}
      </main>

      <Footer activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}