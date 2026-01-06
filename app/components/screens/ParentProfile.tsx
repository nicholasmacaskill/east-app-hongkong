'use client';
import React, { useState } from 'react';
import { Edit2, CheckCircle2, ChevronRight, Users, Calendar, Heart, Award } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';
// Removed: useGallery, Lightbox, ImageIcon

// Simple Card Wrapper
const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
   <div className={`bg-[#1e1e1e] rounded-xl overflow-hidden ${className}`}>
      {children}
   </div>
);

interface ParentProfileProps {
   onOpenSettings: () => void;
   profileData: any;
   isReadOnly?: boolean;
   myChildren?: any[];
   activeChildId?: string | null;
   setActiveChildId?: (id: string | null) => void;
   onAddChild?: () => void;
}

export default function ParentProfile({
   onOpenSettings,
   profileData,
   isReadOnly = false,
   myChildren = [],
   activeChildId,
   setActiveChildId,
   onAddChild
}: ParentProfileProps) {
   const [activeTab, setActiveTab] = useState('athletes');
   const [selectedChildId, setSelectedChildId] = useState<number | string>(activeChildId || 1);
   const [showAddChild, setShowAddChild] = useState(false);
   const [newChild, setNewChild] = useState({ first: '', last: '', email: '', sport: '' });
   // Removed gallery state and refs

   // Removed displayGallery and useGallery

   // Availability Logic
   const [prefObj, setPrefObj] = useState(profileData.preferences || {});
   const [availability, setAvailability] = useState<string[]>(prefObj.availability || []);
   const [savingAvailability, setSavingAvailability] = useState(false);

   // Sync with props if they change
   React.useEffect(() => {
      setPrefObj(profileData.preferences || {});
      setAvailability(profileData.preferences?.availability || []);
   }, [profileData.preferences]);

   // Generate next 14 days
   const next14Days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      return {
         day: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
         date: d.getDate(),
         fullDate: dateStr, // YYYY-MM-DD local
      };
   });

   const toggleAvailability = async (dateStr: string) => {
      const newAvailability = availability.includes(dateStr)
         ? availability.filter(d => d !== dateStr)
         : [...availability, dateStr];

      const newPref = { ...prefObj, availability: newAvailability };

      setAvailability(newAvailability);
      setPrefObj(newPref);
      setSavingAvailability(true);

      // Save to DB
      const { error } = await supabase.from('profiles').update({
         preferences: newPref
      }).eq('id', profileData.id);

      setSavingAvailability(false);

      if (error) {
         alert("Failed to save availability: " + error.message);
         // Revert on error
         setAvailability(availability);
         setPrefObj(prefObj);
      } else {
         // Trigger refresh in parent component to update global state
         if (onAddChild) onAddChild();
      }
   };

   // Removed contributions list

   // Sync local state if activeChildId changes
   React.useEffect(() => {
      if (activeChildId) setSelectedChildId(activeChildId);
   }, [activeChildId]);

   // We use myChildren prop now
   const myAthletes = myChildren;

   const handleAddChild = async () => {
      if (!newChild.first || !newChild.last || !newChild.email) {
         alert("Please fill in Name and Email");
         return;
      }

      try {
         const res = await fetch('/api/family/add-child', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               firstName: newChild.first,
               lastName: newChild.last,
               email: newChild.email,
               sport: newChild.sport,
               parentId: profileData.id
            })
         });

         const data = await res.json();

         if (!res.ok) {
            alert('Error: ' + data.error);
         } else {
            alert(`Child Registered! An email has been sent to ${newChild.email}.`);
            if (onAddChild) onAddChild();
            setShowAddChild(false);
            setNewChild({ first: '', last: '', email: '', sport: '' });
         }
      } catch (e: any) {
         alert('Network Error: ' + e.message);
      }
   };

   // Removed handleGalleryUpload

   return (
      <div className="animate-fadeIn bg-black min-h-screen pb-24 relative overflow-hidden">
         {/* Background Image - Matching Player Profile Style */}
         <div className="fixed inset-0 z-0">
            <img
               src="https://images.unsplash.com/photo-1580748141549-71748ddf0bdc?auto=format&fit=crop&q=80&w=1200"
               className="w-full h-full object-cover opacity-20 grayscale"
               alt="bg"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90" />
         </div>

         <div className="relative z-10 w-full max-w-md mx-auto">
            {/* HEADER CONTAINER */}
            <div className="flex flex-col">
               {/* 1. TOP VISUALS */}
               <div className="relative h-[250px] w-full shrink-0">
                  {!isReadOnly && (
                     <button onClick={onOpenSettings} className="absolute top-4 right-6 z-30 text-gray-400 hover:text-white transition-colors">
                        <Edit2 size={24} />
                     </button>
                  )}

                  <div className="absolute right-8 top-20 z-0 opacity-20">
                     <h1 className="font-montserrat font-black italic text-[7rem] text-white leading-none tracking-tighter select-none uppercase">PARENT</h1>
                  </div>

                  <div className="absolute left-6 top-16 z-10">
                     <div className="w-44 h-44 rounded-full border-[6px] border-white/10 bg-white/5 overflow-hidden shadow-2xl backdrop-blur-sm">
                        <img
                           src={profileData.avatar_url || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400"}
                           className="w-full h-full object-cover opacity-90"
                           alt="profile"
                        />
                     </div>
                  </div>
               </div>

               {/* 2. MIDDLE CONTENT: Name, Bio & Badges */}
               <div className="px-6 pb-8 flex flex-col gap-6 items-center w-full -mt-2">
                  <div className="w-full flex flex-col items-center pt-8">
                     <h2 className="font-montserrat font-black italic text-2xl text-white uppercase tracking-tighter leading-none text-center">
                        {profileData.first_name} <span className="text-east-light">{profileData.last_name || 'PARENT'}</span>
                     </h2>
                     <p className="font-bold text-[10px] text-gray-500 uppercase tracking-widest mt-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                        {profileData.tier?.toUpperCase() || 'MEMBER'} • HOCKEY PARENT
                     </p>
                  </div>

                  {profileData.bio && (
                     <div className="w-full bg-white/5 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-2xl text-center relative z-20">
                        <p className="text-white text-xs font-montserrat font-bold italic leading-relaxed opacity-90">"{profileData.bio}"</p>
                     </div>
                  )}

                  <div className="grid grid-cols-3 w-full gap-2">
                     {[
                        { l: 'VOLUNTEER\nHRS', v: '48', icon: Heart },
                        { l: 'CREDITS\nBALANCE', v: profileData.credits || '0', icon: Users },
                        { l: 'EVENTS\nJOINED', v: '15', icon: Calendar },
                     ].map((stat, i) => (
                        <div key={i} className="flex flex-col items-center p-3 bg-white/5 rounded-xl border border-white/10 group hover:border-east-light/50 transition-colors">
                           <stat.icon size={14} className="text-east-light mb-1" />
                           <span className="font-black text-lg text-white italic">{stat.v}</span>
                           <span className="text-[7px] font-black font-montserrat uppercase text-center leading-tight text-gray-500 whitespace-pre-line">{stat.l}</span>
                        </div>
                     ))}
                  </div>
               </div>

               {/* 3. COLORED BANNER */}
               <div className="w-full bg-gradient-to-r from-east-light to-east-dark py-4 px-8 flex justify-between items-center shadow-lg border-y border-white/10 relative z-30">
                  <div className="text-center">
                     <div className="font-montserrat font-black italic text-[10px] text-black/60 tracking-widest">FAMILY ROLE</div>
                     <div className="font-black text-xl text-white mt-0.5 italic uppercase">HOCKEY MOM</div>
                  </div>
                  <div className="text-center">
                     <div className="font-montserrat font-black italic text-[10px] text-black/60 tracking-widest">ATHLETES</div>
                     <div className="font-black text-xl text-white mt-0.5 italic uppercase">{myAthletes.length} REGISTERED</div>
                  </div>
               </div>
            </div>

            {/* NAVIGATION */}
            <div className="flex justify-center gap-6 py-6 relative z-20 overflow-x-auto no-scrollbar px-4">
               {['ATHLETES', 'AVAILABILITY'].map(tab => (
                  <button
                     key={tab}
                     onClick={() => setActiveTab(tab.toLowerCase())}
                     className={`font-montserrat font-black italic text-xs uppercase transition-all drop-shadow-lg whitespace-nowrap ${activeTab === tab.toLowerCase() ? 'text-white border-b-2 border-east-light pb-1' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                     {tab}
                  </button>
               ))}
            </div>

            {/* CONTENT AREA */}
            <div className="px-4 pb-24 w-full">
               {/* ATHLETES TAB */}
               {activeTab === 'athletes' && (
                  <div className="flex flex-col gap-4 animate-fadeIn">
                     {myAthletes.map((athlete) => {
                        const isSelected = selectedChildId === athlete.id;
                        return (
                           <div
                              key={athlete.id}
                              onClick={() => {
                                 setSelectedChildId(athlete.id);
                                 if (setActiveChildId) setActiveChildId(athlete.id);
                              }}
                              className={`relative overflow-hidden rounded-2xl border transition-all duration-300 group cursor-pointer ${isSelected ? 'border-east-light shadow-2xl scale-[1.02]' : 'border-white/5 hover:border-white/20'}`}
                           >
                              <div className="p-4 flex items-center gap-4 bg-gradient-to-br from-white/10 to-transparent backdrop-blur-md">
                                 <div className={`w-16 h-16 rounded-2xl overflow-hidden border-2 transition-colors ${isSelected ? 'border-east-light' : 'border-white/10'}`}>
                                    <img src={athlete.avatar_url || "https://images.unsplash.com/photo-1544005313-94ddf0286df2??auto=format&fit=crop&q=80&w=200"} className="w-full h-full object-cover" alt={athlete.first_name} />
                                 </div>
                                 <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                       <h4 className={`font-montserrat font-black italic text-lg leading-none uppercase ${isSelected ? 'text-white' : 'text-white/80'}`}>{athlete.first_name}</h4>
                                       {isSelected && <div className="bg-east-light text-black text-[8px] font-black px-2 py-0.5 rounded-full uppercase italic">Selected</div>}
                                    </div>
                                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">{athlete.team || 'EAST SPORTS'}</p>
                                    <div className="flex gap-2 mt-3">
                                       <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                                          <div className="h-full bg-east-light w-[70%]" />
                                       </div>
                                       <span className="text-[8px] font-bold text-east-light">70% XP</span>
                                    </div>
                                 </div>
                                 <ChevronRight size={18} className={`transition-transform ${isSelected ? 'text-east-light rotate-90' : 'text-gray-600'}`} />
                              </div>
                           </div>
                        );
                     })}

                     {/* ADD CHILD BUTTON */}
                     <button
                        onClick={() => setShowAddChild(true)}
                        className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-gray-500 font-montserrat font-black italic text-xs hover:border-east-light/50 hover:text-white transition-all uppercase tracking-widest bg-white/5">
                        + Register New Athlete
                     </button>

                     {/* ADD CHILD MODAL */}
                     {showAddChild && (
                        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
                           <div className="bg-[#1e1e1e] p-6 rounded-2xl w-full max-w-sm border border-white/10">
                              <h3 className="font-black italic text-xl uppercase mb-4 text-white">Add Child</h3>
                              <div className="space-y-4">
                                 <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-500">First Name</label>
                                    <input
                                       value={newChild.first}
                                       onChange={e => setNewChild({ ...newChild, first: e.target.value })}
                                       className="w-full bg-black/50 border border-white/10 p-3 rounded-lg text-white outline-none focus:border-east-light"
                                       placeholder="e.g. Michael"
                                    />
                                 </div>
                                 <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-500">Last Name</label>
                                    <input
                                       value={newChild.last}
                                       onChange={e => setNewChild({ ...newChild, last: e.target.value })}
                                       className="w-full bg-black/50 border border-white/10 p-3 rounded-lg text-white outline-none focus:border-east-light"
                                       placeholder="e.g. Jordan"
                                    />
                                 </div>
                                 <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-500">Email Address</label>
                                    <input
                                       value={newChild.email}
                                       onChange={e => setNewChild({ ...newChild, email: e.target.value })}
                                       className="w-full bg-black/50 border border-white/10 p-3 rounded-lg text-white outline-none focus:border-east-light"
                                       placeholder="child@example.com"
                                       type="email"
                                    />
                                 </div>
                                 <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-500">Sport / Team</label>
                                    <input
                                       value={newChild.sport}
                                       onChange={e => setNewChild({ ...newChild, sport: e.target.value })}
                                       className="w-full bg-black/50 border border-white/10 p-3 rounded-lg text-white outline-none focus:border-east-light"
                                       placeholder="e.g. Ice Hockey"
                                    />
                                 </div>
                                 <div className="flex gap-2 pt-2">
                                    <button onClick={handleAddChild} className="flex-1 bg-east-light text-black font-black uppercase py-3 rounded-lg text-xs hover:bg-white">Save</button>
                                    <button onClick={() => setShowAddChild(false)} className="flex-1 bg-white/10 text-white font-black uppercase py-3 rounded-lg text-xs hover:bg-white/20">Cancel</button>
                                 </div>
                              </div>
                           </div>
                        </div>
                     )}
                  </div>
               )}

               {/* AVAILABILITY TAB */}
               {activeTab === 'availability' && (
                  <div className="flex flex-col gap-4 animate-fadeIn">
                     <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                        <div className="flex justify-between items-end mb-6">
                           <div>
                              <h3 className="font-montserrat font-black italic text-sm text-white uppercase tracking-widest">Live Availability</h3>
                              <p className="text-[9px] font-bold text-gray-500 uppercase mt-1">
                                 {savingAvailability ? <span className="text-east-light animate-pulse">SAVING CHANGES...</span> : 'Tap dates to toggle available days'}
                              </p>
                           </div>
                           <Calendar size={18} className={savingAvailability ? 'text-east-light animate-spin' : 'text-east-light'} />
                        </div>
                        <div className="grid grid-cols-7 gap-3">
                           {next14Days.slice(0, 14).map((day, i) => {
                              const isAvailable = availability.includes(day.fullDate);
                              return (
                                 <div key={i} onClick={() => toggleAvailability(day.fullDate)} className="flex flex-col items-center gap-2 cursor-pointer group">
                                    <span className="text-[8px] font-bold text-gray-600 uppercase group-hover:text-white transition-colors">{day.day}</span>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black transition-all ${day.fullDate === new Date().toISOString().split('T')[0] ? 'border border-east-light text-east-light' : 'bg-white/5 text-white group-hover:bg-white/10'}`}>
                                       {day.date}
                                    </div>
                                    <div className={`w-1.5 h-1.5 rounded-full transition-all ${isAvailable ? 'bg-east-light scale-110 shadow-[0_0_10px_#28D160]' : 'bg-white/10'}`} />
                                 </div>
                              )
                           })}
                        </div>
                     </div>
                     <p className="text-[10px] text-gray-500 text-center italic font-bold">Your availability helps us coordinate volunteering & events.</p>
                  </div>
               )}

               {/* Removed Contributions and Gallery content */}
            </div>
         </div>
      </div>
   );
}