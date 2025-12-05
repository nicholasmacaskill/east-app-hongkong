'use client';

import { useState, useCallback, useEffect } from 'react';
import { addMonths, startOfMonth, format } from 'date-fns';
import Calendar from '../components/Calendar/index';
import { CalendarEvent } from '../types/calendar';
import { Session } from '../types/session'; // Import Session type
import { useRouter } from 'next/navigation';
import Footer from '../components/Footer';

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('calendar');
  const router = useRouter();

  // Fetch real registrations from the API
  const fetchMySchedule = useCallback(async () => {
    try {
      setLoading(true);
      // We use the same API endpoint you used for the ScheduleScreen
      const res = await fetch('/api/my-schedule?userId=12'); 
      const data: Session[] = await res.json();

      if (Array.isArray(data)) {
        // Transform DB Sessions into CalendarEvents
        const formattedEvents: CalendarEvent[] = data.map((session) => ({
          id: session.id.toString(),
          title: session.title,
          startTime: new Date(session.start_time),
          endTime: new Date(session.end_time),
          // Map DB categories to Calendar types (colors)
          type: session.category === 'YOUTH' ? 'youth-class' 
              : session.category === 'GAME' ? 'game'
              : session.category === 'COACH' ? 'practice' // Coaches show as purple
              : 'other', 
          host: session.instructor
        }));
        setEvents(formattedEvents);
      }
    } catch (error) {
      console.error('Failed to load schedule:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMySchedule();
  }, [fetchMySchedule]);

  const handleMonthChange = (date: Date) => {
    // The calendar component handles view changes, 
    // but our API returns ALL events, so we don't strictly need to refetch per month 
    // unless you implement pagination later.
    console.log("View changed to", date); 
  };

  const handleEventClick = (event: CalendarEvent) => {
    alert(`${event.title}\n${event.startTime.toLocaleString()}`);
  };

  return (
    <div className="app min-h-screen bg-black text-white flex flex-col">
      <div className="east-logo text-4xl md:text-6xl text-center py-6 w-full font-montserrat font-black italic">EAST</div>
      
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-east-light"></div>
          </div>
        ) : (
          <Calendar
            events={events}
            onEventClick={handleEventClick}
          />
        )}
      </main>

      <Footer activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}