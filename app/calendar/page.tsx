'use client';

import { useState, useCallback, useEffect } from 'react';
import Calendar from '../components/Calendar/index';
import LockedOverlay from '../components/ui/LockedOverlay';
import { CalendarEvent } from '@/app/types/index';
import { Session } from '@/app/types/index';
import { useRouter } from 'next/navigation';
import Footer from '../components/Footer';
import { useToast } from '../components/ui/Toast';
import { formatHK } from '@/app/lib/dateUtils';

export default function CalendarPage() {
  const { addToast } = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [googleEvents, setGoogleEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [activeTab, setActiveTab] = useState('calendar');
  const router = useRouter();
  const [isLocked, setIsLocked] = useState(false);

  // Fetch East App registrations
  const fetchMySchedule = useCallback(async () => {
    try {
      setLoading(true);

      const { supabase } = await import('@/app/lib/supabase');
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('account_status, subscription_status')
          .eq('id', user.id)
          .single();

        if (profile) {
          const locked = (!profile.subscription_status || (profile.subscription_status !== 'active' && profile.subscription_status !== 'trialing')) && profile.account_status !== 'active';
          setIsLocked(locked);
        }
      }

      const res = await fetch('/api/my-schedule?userId=12');
      const data: Session[] = await res.json();

      if (Array.isArray(data)) {
        const formattedEvents: CalendarEvent[] = data.map((session) => ({
          id: session.id.toString(),
          title: session.title,
          startTime: new Date(session.start_time),
          endTime: new Date(session.end_time),
          type: session.category === 'CLASS' ? 'youth-class'
            : session.category === 'EVENT' ? 'game'
              : session.category === 'PRIVATE' ? 'practice'
                : 'other',
          host: session.instructor,
        }));
        setEvents(formattedEvents);
      }
    } catch (error) {
      console.error('Failed to load schedule:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Google Calendar events
  const fetchGoogleCalendar = useCallback(async () => {
    try {
      setGoogleLoading(true);
      const res = await fetch('/api/google-calendar');
      const data = await res.json();

      if (data.tokenRevoked) {
        // Token was revoked by user in Google — clean up our state
        setGoogleConnected(false);
        setGoogleEvents([]);
        addToast('Google Calendar disconnected — please reconnect.', 'error');
        return;
      }

      if (data.connected && Array.isArray(data.events)) {
        setGoogleConnected(true);
        const formatted: CalendarEvent[] = data.events.map((e: any) => ({
          id: e.id,
          title: e.title,
          startTime: new Date(e.startTime),
          endTime: new Date(e.endTime),
          type: 'google' as const,
          host: e.host,
          location: e.location,
          htmlLink: e.htmlLink,
        }));
        setGoogleEvents(formatted);
      } else {
        setGoogleConnected(false);
        setGoogleEvents([]);
      }
    } catch (error) {
      console.error('Failed to load Google Calendar:', error);
    } finally {
      setGoogleLoading(false);
    }
  }, [addToast]);

  // Connect Google Calendar via Supabase OAuth identity linking
  const handleConnectGoogle = useCallback(async () => {
    const { supabase } = await import('@/app/lib/supabase');

    const callbackUrl = `${window.location.origin}/auth/google-callback`;

    const { error } = await supabase.auth.linkIdentity({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
        scopes: 'https://www.googleapis.com/auth/calendar.readonly',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      // linkIdentity not available (user signed up with Google already)
      // Fall back to signInWithOAuth
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          scopes: 'https://www.googleapis.com/auth/calendar.readonly',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
    }
  }, []);

  // Disconnect Google Calendar
  const handleDisconnectGoogle = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/google/link', { method: 'DELETE' });
      if (res.ok) {
        setGoogleConnected(false);
        setGoogleEvents([]);
        addToast('Google Calendar disconnected.', 'info');
      }
    } catch (err) {
      console.error('Failed to disconnect:', err);
    }
  }, [addToast]);

  useEffect(() => {
    fetchMySchedule();
    fetchGoogleCalendar(); // Check connection status on load
  }, [fetchMySchedule, fetchGoogleCalendar]);

  const handleMonthChange = (date: Date) => {
    console.log('View changed to', date);
  };

  const handleEventClick = (event: CalendarEvent) => {
    if (event.type === 'google' && event.htmlLink) {
      window.open(event.htmlLink, '_blank', 'noopener,noreferrer');
    } else {
      addToast(`${event.title}\n${formatHK(event.startTime)} - ${formatHK(event.endTime)}`, 'info');
    }
  };

  // Merge East + Google events
  const allEvents = [...events, ...googleEvents];

  return (
    <div className="app min-h-screen bg-black text-white flex flex-col">
      <div className="east-logo text-4xl md:text-6xl text-center py-6 w-full font-montserrat font-black italic">EAST</div>

      <main className="flex-grow w-full max-w-7xl mx-auto px-4 py-8 relative">
        {isLocked && <LockedOverlay />}

        {/* Google Calendar Sync Bar */}
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            {googleConnected && (
              <>
                <span className="inline-block w-2 h-2 rounded-full bg-blue-400"></span>
                <span>Google Calendar synced</span>
              </>
            )}
          </div>

          {googleConnected ? (
            <button
              id="disconnect-google-calendar"
              onClick={handleDisconnectGoogle}
              className="text-xs text-gray-500 hover:text-red-400 transition-colors underline"
            >
              Disconnect Google
            </button>
          ) : (
            <button
              id="connect-google-calendar"
              onClick={handleConnectGoogle}
              disabled={googleLoading}
              className="flex items-center gap-2 text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full transition-all disabled:opacity-50"
            >
              {googleLoading ? (
                <span className="inline-block w-3 h-3 rounded-full border border-white/40 border-t-white animate-spin"></span>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              Sync Google Calendar
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-east-light"></div>
          </div>
        ) : (
          <Calendar
            events={allEvents}
            onEventClick={handleEventClick}
          />
        )}
      </main>

      <Footer activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}