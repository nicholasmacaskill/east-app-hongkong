import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || '12'; // Default to 12 for testing

  const { data, error } = await supabase
    .from('registrations')
    .select(`
      session_id,
      sessions (
        id, title, start_time, end_time, instructor, category, description
      )
    `)
    .eq('user_id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Flatten the structure
  // @ts-ignore
  const schedule = data.map((reg) => reg.sessions).filter(Boolean);
  
  // Sort by date
  schedule.sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  return NextResponse.json(schedule);
}
```

---

### **Step 5: Updating `app/page.tsx`**

I will give you the **4 code blocks** you need to update. Do not delete the other parts of your file (like `PlayerProfile`, `Settings`, etc.).

**Block 1: Imports (Top of file)**
*Replace your existing imports with this.*

```tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Home, User as UserIcon, QrCode, Activity, MessageSquare, 
    ChevronLeft, ChevronRight, ChevronDown, X, CheckCircle2, 
    Settings, LogOut, Bell, FileText, HelpCircle, Shield, 
    Edit2, ToggleLeft, ToggleRight, CreditCard, UserCog,
    Send, Share2, Target // Ensure these are imported
} from 'lucide-react'; 

// Import Types
import type { UserRole, Tab, NewsItem } from './types';
import { Session } from './types/session'; // New session type
```

**Block 2: `ClassModal` (Replace the existing function)**
*This adds the registration logic and fixes the UI.*

```tsx
// ==========================================
// CLASS MODAL (Handles Registration)
// ==========================================
const ClassModal = ({ session, onClose }: { session: Session | null, onClose: () => void }) => {
  const [isRegistering, setIsRegistering] = useState(false);

  if (!session) return null;

  const handleRegister = async () => {
    setIsRegistering(true);
    const userId = 12; // Mock ID for now

    try {
      // If it's a mock session (negative ID), just alert
      if (session.id < 0) {
         alert("This is a preview event. Registration is not available for news items.");
         onClose();
         return;
      }

      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, sessionId: session.id }),
      });

      if (res.ok) {
        alert('Successfully Registered! Check your schedule.');
        onClose();
      } else if (res.status === 409) {
        alert('You are already registered.');
      } else {
        alert('Registration failed.');
      }
    } catch (error) {
      console.error(error);
      alert('Error connecting to server.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden flex flex-col max-h-[90vh]">
         <div className="bg-gradient-to-r from-east-light to-east-dark p-4 flex justify-between items-center shrink-0">
            <h2 className="font-montserrat font-black italic text-xl text-white uppercase truncate pr-2">{session.title}</h2>
            <button onClick={onClose}><X className="text-white" /></button>
         </div>

         <div className="overflow-y-auto p-6 text-black">
            <h2 className="font-montserrat font-black italic text-2xl mb-1 uppercase">{session.title}</h2>
            <p className="font-montserrat font-bold text-[10px] mb-4 uppercase">INSTRUCTOR: {session.instructor}</p>
            <p className="font-opensans text-xs font-bold leading-relaxed mb-6">{session.description || "Join us for this exclusive session."}</p>
            
            {session.image_url && (
                <div className="w-full aspect-video rounded-xl overflow-hidden bg-black mb-6">
                    <img src={session.image_url} className="w-full h-full object-cover" alt={session.title} />
                </div>
            )}

            <div className="text-[10px] font-bold text-gray-500 mb-2">
                TIME: {new Date(session.start_time).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})}
            </div>
         </div>

         <div className="bg-black p-4 flex justify-between items-center shrink-0">
            <div className="flex gap-4">
               <Send className="text-white" size={20} />
               <Share2 className="text-white" size={20} />
            </div>
            <button 
              onClick={handleRegister} 
              disabled={isRegistering}
              className="text-white text-sm font-bold italic underline disabled:opacity-50 hover:text-east-light"
            >
              {isRegistering ? 'REGISTERING...' : 'REGISTER NOW'}
            </button>
         </div>
      </div>
    </div>
  );
};
```

**Block 3: `HomeScreen` (Replace the existing function)**
*This adds the API fetch AND the helper to make sure static cards open the modal.*

```tsx
// ==========================================
// HOME SCREEN (DB Sessions + Static Previews)
// ==========================================
const HomeScreen = ({ onClassClick, onOpenSettings }: { onClassClick: (s: Session) => void, onOpenSettings: () => void }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sessions')
      .then(res => res.json())
      .then(data => {
        if(Array.isArray(data)) setSessions(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const adultClasses = sessions.filter(s => s.category === 'ADULT');
  const youthClasses = sessions.filter(s => s.category === 'YOUTH');

  // Helper to make static content clickable
  const handleStaticClick = (title: string, subtitle: string, image: string) => {
    onClassClick({
        id: -1, // Fake ID
        title,
        category: 'EVENT',
        instructor: 'EAST STAFF',
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
        image_url: image,
        description: subtitle
    });
  };

  const news: NewsItem[] = [
    { id: '1', title: 'WOLVES WIN U-15 CHAMPIONSHIP', subtitle: 'Zen set a record for goals scored in a playoff game.', image: 'https://images.unsplash.com/photo-1515523110800-9415d13b84a8?auto=format&fit=crop&q=80&w=600' },
    { id: '2', title: 'EAST ANNOUNCES NEW FACILITY', subtitle: 'Opening date will include events for prospective members.', image: 'https://images.unsplash.com/photo-1552667466-07770ae110d0?auto=format&fit=crop&q=80&w=600' },
  ];

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
        <div className="flex overflow-x-auto no-scrollbar gap-4 snap-x">
          {news.map((item) => (
            <div key={item.id} onClick={() => handleStaticClick(item.title, item.subtitle, item.image)} className="snap-center min-w-[90%] relative rounded-2xl overflow-hidden aspect-[2/1] border border-gray-800 cursor-pointer group">
              <img src={item.image} alt={item.title} className="w-full h-full object-cover opacity-60" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 p-4 w-3/4">
                <h3 className="font-montserrat font-black italic text-lg leading-tight mb-1 uppercase">{item.title}</h3>
                <p className="font-opensans text-xs text-gray-300 line-clamp-2">{item.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Facility Booking */}
      <div>
        <SectionHeader title="Facility Booking" />
        <div className="grid grid-cols-3 gap-3">
          {['Shooting Pad', 'Golf Simulator', 'Locker'].map((fac, i) => {
            const img = `https://images.unsplash.com/photo-${i === 0 ? '1580748141549-71748dbe0bdc' : i === 1 ? '1587174486073-ae5e5cff23aa' : '1534438327276-14e5300c3a48'}?auto=format&fit=crop&q=80&w=300`;
            return (
            <div key={i} onClick={() => handleStaticClick(fac, `Book the ${fac}`, img)} className="flex flex-col gap-2 cursor-pointer group">
              <div className="aspect-square rounded-xl overflow-hidden border border-gray-700 bg-gray-900 relative">
                 <img src={img} className="w-full h-full object-cover" />
              </div>
              <span className="font-montserrat font-bold italic text-[10px] uppercase">{fac}</span>
            </div>
            )
          })}
        </div>
      </div>

      {/* Adult Classes (DB) */}
      <div>
        <SectionHeader title="Adult Classes" />
        {loading ? <p className="text-xs text-gray-500">Loading...</p> : (
        <div className="grid grid-cols-3 gap-3">
          {adultClasses.map((cls) => (
            <div key={cls.id} onClick={() => onClassClick(cls)} className="flex flex-col gap-2 cursor-pointer group">
              <div className="aspect-square rounded-xl overflow-hidden border border-gray-700 relative">
                <img src={cls.image_url} alt={cls.title} className="w-full h-full object-cover" />
              </div>
              <span className="font-montserrat font-bold italic text-[10px] uppercase truncate">{cls.title}</span>
            </div>
          ))}
        </div>
        )}
      </div>

      {/* Youth Classes (DB) */}
      <div>
        <SectionHeader title="Youth Classes" />
        {loading ? <p className="text-xs text-gray-500">Loading...</p> : (
        <div className="grid grid-cols-3 gap-3">
          {youthClasses.map((cls) => (
            <div key={cls.id} onClick={() => onClassClick(cls)} className="flex flex-col gap-2 cursor-pointer group">
              <div className="aspect-square rounded-xl overflow-hidden border border-gray-700 relative">
                <img src={cls.image_url} alt={cls.title} className="w-full h-full object-cover" />
              </div>
              <span className="font-montserrat font-bold italic text-[10px] uppercase truncate">{cls.title}</span>
            </div>
          ))}
        </div>
        )}
      </div>

      <div className="h-24 w-full" />
    </div>
  );
};
```

**Block 4: `ScheduleScreen` (Replace the existing function)**
*This updates the schedule to pull from your `my-schedule` API.*

```tsx
const ScheduleScreen = ({ onPreviewClick }: { onPreviewClick: (s: Session) => void }) => {
  const [mySchedule, setMySchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('/api/my-schedule?userId=12')
      .then(res => res.json())
      .then(data => {
          if(Array.isArray(data)) setMySchedule(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-black pb-24 animate-fadeIn relative">
       <div className="px-4 space-y-6 min-h-[300px] pt-20">
          <SectionHeader title="My Upcoming Sessions" />
          {loading ? <p className="text-center text-gray-500 text-xs">Loading...</p> : 
            mySchedule.length > 0 ? mySchedule.map((event, idx) => (
              <div key={idx} className="flex gap-4 animate-fadeIn" onClick={() => onPreviewClick(event)}>
                  <div className="w-12 flex flex-col items-center justify-start pt-1">
                      <span className="text-xs font-bold text-east-light">
                        {new Date(event.start_time).getDate()}
                      </span>
                      <span className="text-[10px] font-bold text-gray-500 uppercase">
                        {new Date(event.start_time).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                  </div>
                  <div className="flex-1 cursor-pointer">
                      <div className="bg-white rounded-xl overflow-hidden text-black shadow-lg p-3">
                          <h3 className="font-montserrat font-black italic text-sm uppercase">{event.title}</h3>
                          <p className="text-xs font-bold mt-0.5 text-gray-600">
                            {new Date(event.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                          <p className="text-[10px] font-bold uppercase mt-2 text-east-dark">INSTRUCTOR: {event.instructor}</p>
                      </div>
                  </div>
              </div>
          )) : (
              <div className="text-center text-gray-500 py-10 font-montserrat font-bold italic text-sm">NO CLASSES REGISTERED</div>
          )}
       </div>
    </div>
  );
};